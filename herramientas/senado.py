"""Senadores elegidos en las urnas, por circunscripción y partido: lee el CSV del Senado y comprueba que cuadra con el
Real Decreto 806/2026 (art. 3: 60 circunscripciones y 209 senadores; están en js/datos.js, SENADO).

Formato del CSV (se puede rellenar a mano; plantilla con las 60 circunscripciones en datos/plantilla_senado.csv):
  circunscripcion;partido;electos          (también con comas; en UTF-8 o en ANSI, como lo guarde Excel)
  - circunscripcion: la provincia o, en Baleares y Canarias, la isla («Mallorca», «Ibiza», «La Gomera»). También vale
    como lo escribe el BOE («Balears (Illes): MALLORCA») y el código INE de la provincia.
  - partido: el id de la web (PP, PSOE, VOX, ERC...) o las siglas tal como salen, que se traducen con datos/siglas.csv.
    Lo que no se traduce sale en la web con ese mismo nombre y un color neutro (una candidatura de una sola isla, por
    ejemplo), y el script lo avisa. OTROS no vale: un senador elegido tiene que salir con su partido.
  - electos: senadores de ese partido en esa circunscripción. Las filas con 0 o vacías no cuentan.
  Las líneas con # no cuentan.
Se para si falta o sobra una circunscripción, si una fila se repite o si los electos de una circunscripción no suman
los del decreto. Con --prueba (datos de 2023) acepta Ibiza y Formentera juntas, como se votó entonces, con un aviso.

Uso (desde la carpeta del repositorio):
  py herramientas/senado.py datos/senado_29N.csv               comprueba y resume; no escribe nada
  py herramientas/senado.py datos/senado_23J.csv --prueba
En la web entra con resultados.py (o escribir_resultados.py), añadiendo --senado datos/senado_29N.csv.
"""
import argparse, collections, csv, json, re, sys
from escrutinio import RAIZ, _palabras, clave_siglas, leer_siglas, leer_texto, provincia

_datos = (RAIZ / 'js' / 'datos.js').read_text(encoding='utf-8')
SENADO = json.loads(re.search(r'export const SENADO = (\[.*?\]);', _datos, re.S).group(1))
assert len(SENADO) == 60 and sum(s[2] for s in SENADO) == 209, 'SENADO, en js/datos.js, no tiene 60 circunscripciones y 209 senadores'
# Los id de los partidos de la web (META, en resultados.py): un partido escrito así no se traduce.
META_IDS = set(re.findall(r"\('(\w+)', '[^']*', '#", (RAIZ / 'herramientas' / 'resultados.py').read_text(encoding='utf-8')))
JUNTAS_2023 = 'Ibiza y Formentera'   # en 2023, una sola circunscripción con un senador
ISLAS = {p for p in {s[1] for s in SENADO} if sum(1 for s in SENADO if s[1] == p) > 1}   # provincias que votan por islas

_CLAVES = {_palabras(s[0]): s[0] for s in SENADO if s[1] in ISLAS}
_CLAVES[_palabras('Eivissa')] = 'Ibiza'
_CLAVES[_palabras('Gomera')] = 'La Gomera'
_CLAVES[_palabras('Hierro')] = 'El Hierro'
for _t in ('Eivissa-Formentera', 'Ibiza-Formentera', 'Ibiza y Formentera', 'Eivissa i Formentera'): _CLAVES[_palabras(_t)] = JUNTAS_2023
_UNICA = {s[1]: s[0] for s in SENADO if s[1] not in ISLAS}   # provincia → su circunscripción, si no vota por islas
_PROV = {s[0]: s[1] for s in SENADO}
_PROV[JUNTAS_2023] = next(s[1] for s in SENADO if s[0] == 'Ibiza')


def circunscripcion(texto):
    """Nombre de la circunscripción como en SENADO (o JUNTAS_2023), None si no se reconoce, o un mensaje de error."""
    t = (texto or '').strip()
    if ':' in t: t = t.split(':', 1)[1]   # «Balears (Illes): MALLORCA»
    c = _CLAVES.get(_palabras(t))
    if c: return c
    n = provincia(t)
    if n is None: return None
    i = next(k for k, s in enumerate(json.loads(re.search(r'export const PROV = (\[.*?\]);', _datos).group(1))) if s[0] == n)
    return _UNICA.get(i) or 'ERROR: %s vota por islas: hay que escribir la isla' % n


def leer(ruta, prueba=False, siglas=None):
    """Lee y comprueba el CSV. Devuelve {'circ': [{'c', 'p', 'n', 'r': {partido: electos}}] en el orden de SENADO,
    'avisos': [...]}. partido: un id de META o el nombre tal como venía."""
    with leer_texto(ruta) as f:
        lineas = [l for l in f if l.strip() and not l.lstrip().startswith('#')]
    if not lineas: sys.exit('ERROR: %s no tiene datos' % ruta)
    sep = ';' if lineas[0].count(';') > lineas[0].count(',') else ','
    lector = csv.DictReader(lineas, delimiter=sep)
    cols = {c.strip().lower(): c for c in (lector.fieldnames or [])}
    falta = [c for c in ('circunscripcion', 'partido', 'electos') if c not in cols]
    if falta: sys.exit('ERROR: %s necesita las columnas circunscripcion, partido y electos (tiene: %s)' % (ruta, ', '.join(cols)))
    tabla = {}
    for s in siglas or [str(RAIZ / 'datos' / 'siglas.csv')]: tabla.update(leer_siglas(s))
    porid = {i.upper(): i for i in META_IDS}
    datos, malas, propios, avisos = collections.OrderedDict(), [], collections.Counter(), []
    for k, f in enumerate(lector, 2):
        texto, part, n = (f[cols['circunscripcion']] or '').strip(), (f[cols['partido']] or '').strip(), (f[cols['electos']] or '').strip()
        if not texto and not part and not n: continue
        if not n or n in ('0', '0.0', '0,0'): continue   # una fila de la plantilla sin rellenar o un partido sin senadores
        if not re.fullmatch(r'\d+([.,]0+)?', n): sys.exit('ERROR: fila %d: «%s» no es un número de senadores' % (k, n))
        c = circunscripcion(texto)
        if c is None or c.startswith('ERROR'): malas.append('fila %d: %s' % (k, c[7:] if c else '«%s» no es una circunscripción del Senado' % texto)); continue
        if not part: sys.exit('ERROR: fila %d (%s): falta el partido' % (k, c))
        i = 'OTROS' if part.upper() == 'OTROS' else porid.get(part.upper()) or tabla.get(clave_siglas(part))
        if i == 'OTROS': sys.exit('ERROR: fila %d (%s): «%s» iría a OTROS (así está en datos/siglas.csv), y un senador elegido tiene que salir '
                                  'con su partido. Escribir el id de la web o el nombre con el que debe salir.' % (k, c, part))
        if not i: i = part; propios[part] += int(float(n.replace(',', '.')))
        r = datos.setdefault(c, collections.Counter())
        if i in r: sys.exit('ERROR: %s aparece dos veces en %s (fila %d). Si son dos siglas del mismo partido, sumarlas en una fila.' % (i, c, k))
        r[i] = int(float(n.replace(',', '.')))
    if malas: sys.exit('ERROR: circunscripciones que no se reconocen (vale la provincia o, en Baleares y Canarias, la isla):\n  ' + '\n  '.join(malas))
    decreto = {s[0]: s[2] for s in SENADO}
    if JUNTAS_2023 in datos:
        if not prueba: sys.exit('ERROR: «%s» votaron juntas en 2023; el 29N son dos circunscripciones (Real Decreto 806/2026, art. 3). '
                                'Para ensayar con datos de 2023, --prueba.' % JUNTAS_2023)
        if 'Ibiza' in datos or 'Formentera' in datos: sys.exit('ERROR: Ibiza y Formentera están juntas y por separado a la vez')
        avisos.append('Ibiza y Formentera, juntas como en 2023, con 1 senador: el 29N eligen uno cada una')
        decreto = {(JUNTAS_2023 if c == 'Ibiza' else c): v for c, v in decreto.items() if c != 'Formentera'}
    faltan = [c for c in decreto if c not in datos]
    mal = ['%s: %d electos y el decreto da %d' % (c, sum(datos[c].values()), decreto[c]) for c in decreto if c in datos and sum(datos[c].values()) != decreto[c]]
    if faltan or mal:
        sys.exit('ERROR: el Senado no cuadra con el Real Decreto 806/2026, art. 3. Sin esto no se genera nada.%s%s'
                 % ('\n  Faltan %d circunscripciones: %s' % (len(faltan), ', '.join(faltan)) if faltan else '',
                    ''.join('\n  ' + m for m in mal)))
    if propios:
        avisos.append('sin traducir: sale(n) en la web con ese nombre y color neutro: %s. Si es un partido de la web, '
                      'una fila en datos/siglas.csv' % ', '.join('%s (%d)' % x for x in propios.most_common()))
    circ = [{'c': c, 'p': _PROV[c], 'n': decreto[c], 'r': dict(datos[c])} for c in decreto]
    return {'circ': circ, 'avisos': avisos}


def total(s):
    t = collections.Counter()
    for c in s['circ']: t.update(c['r'])
    return t


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    a.add_argument('csv'); a.add_argument('--prueba', action='store_true', help='datos de 2023: Ibiza y Formentera juntas')
    a.add_argument('--siglas', action='append', help='tabla de siglas; se puede repetir (por defecto, datos/siglas.csv)')
    o = a.parse_args()
    s = leer(o.csv, o.prueba, o.siglas)
    for m in s['avisos']: print('AVISO: ' + m, file=sys.stderr)
    t = total(s)
    print('%s: %d circunscripciones y %d senadores, que cuadran con el decreto.' % (o.csv, len(s['circ']), sum(t.values())))
    print('Por partido: ' + ', '.join('%s %d' % x for x in t.most_common()) + '.')


if __name__ == '__main__':
    main()
