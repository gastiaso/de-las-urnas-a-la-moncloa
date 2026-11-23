"""Coteja los escaños que calcula la web con los oficiales, provincia a provincia.

Recalcula el reparto D'Hondt de cada circunscripción con la misma regla que js/dhondt.js (barrera del 3 % de los
votos válidos, empates a favor de la candidatura con más votos) a partir de:
  - js/resultados.js, lo que de verdad va a ver la gente; o
  - el CSV de resultados.py (sirve para cotejar antes de generar resultados.js).
y lo compara con un CSV de escaños oficiales en formato largo: provincia,partido,escanos (lo escribe
interior_a_csv.py con --oficiales; los partidos con los mismos id que la web; los que no aparecen tienen 0).
Filas con provincia «Total» (o «España») dan el total nacional oficial de cada partido, que también se coteja:
es lo más rápido de copiar a mano la noche electoral (datos/plantilla_oficiales.csv).

Al final lista los «últimos escaños» más ajustados: por defecto, por los votos que le faltaron al rival sobre los
válidos de la provincia; con --en-bruto, por los votos que le faltaron, sin más. El escaño más ajustado de España se
elige en bruto: el primero de esa lista.

Sale con código 0 si todo coincide, 1 si hay alguna diferencia (o faltan provincias, salvo con --parcial)
y 2 si los archivos no se pueden leer.

Uso (desde la carpeta del repositorio):
  py herramientas/cotejar_escanos.py js/resultados.js datos/escanos_oficiales_29N.csv
  py herramientas/cotejar_escanos.py datos/simulacro_23J.csv datos/escanos_oficiales_23J.csv
  py herramientas/cotejar_escanos.py js/resultados.js datos/escanos_oficiales_29N.csv --en-bruto --ajustados 5
"""
import argparse, collections, csv, json, re, sys
from escrutinio import NOMBRES, faltan_para_ultimo, leer_texto, provincia, reparto, sin_acentos

FIJAS = {'district', 'ccaa', 'escanos', 'escanos_2023', 'validos', 'OTROS', 'BLANCO', 'censo', 'votantes', 'nulos'}


def error(msg):
    print('ERROR: ' + msg, file=sys.stderr); sys.exit(2)


def leer_calculo(ruta, col_escanos):
    """Lista de circunscripciones: (nombre, escaños, válidos, [(id, votos), ...])."""
    if ruta.lower().endswith('.js'):
        texto = open(ruta, encoding='utf-8-sig').read()
        m = re.search(r'export const RES = (\{.*\});', texto, re.S)
        if not m: error('%s no tiene «export const RES = {...};»' % ruta)
        res = json.loads(m.group(1))
        ids = [p['id'] for p in res['partidos']]
        print('Calculado desde %s: %s%s.' % (ruta, res.get('etiqueta') or 'sin etiqueta', ' (datos de prueba)' if res.get('prueba') else ''))
        return [(q['n'], q['e'], q['val'], list(zip(ids, q['v']))) for q in res['prov']]
    with open(ruta, encoding='utf-8-sig', newline='') as f:
        filas = list(csv.DictReader(f))
    if not filas: error('%s está vacío' % ruta)
    if col_escanos not in filas[0]: error('%s no tiene la columna %s' % (ruta, col_escanos))
    cols = [c for c in filas[0] if c not in FIJAS and not c.startswith('s_')]
    n = lambda x: int(round(float(x or 0)))
    print('Calculado desde %s (columna de escaños: %s).' % (ruta, col_escanos))
    return [(f['district'], n(f[col_escanos]), n(f['validos']), [(c, n(f[c])) for c in cols]) for f in filas]


def leer_oficiales(ruta):
    with leer_texto(ruta) as f:
        lineas = [l for l in f if l.strip() and not l.lstrip().startswith('#')]   # las líneas con # no cuentan
    muestra = ''.join(lineas[:20])
    filas = list(csv.DictReader(lineas, delimiter=';' if muestra.count(';') > muestra.count(',') else ','))
    if not filas or not {'provincia', 'partido', 'escanos'} <= {c.strip().lower() for c in filas[0]}:
        error('%s necesita las columnas provincia, partido y escanos, y al menos una fila' % ruta)
    col = {c.strip().lower(): c for c in filas[0]}
    of, malas = collections.defaultdict(collections.Counter), set()
    for f in filas:
        t = (f[col['provincia']] or '').strip()
        if not t: continue
        n = 'TOTAL' if sin_acentos(t).lower() in ('total', 'espana', 'nacional', 'total nacional') else provincia(t)
        if not n: malas.add(t); continue
        e = (f[col['escanos']] or '0').strip()
        if not re.fullmatch(r'\d+', e): error('escaños no enteros en %s: «%s»' % (t, e))
        of[n][(f[col['partido']] or '').strip()] += int(e)
    if malas: error('provincias que no se reconocen en %s: %s' % (ruta, ', '.join(sorted(malas))))
    return of


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    a.add_argument('calculo', help='js/resultados.js o el CSV de resultados.py')
    a.add_argument('oficiales', help='CSV provincia,partido,escanos')
    a.add_argument('--escanos', default='escanos', help='columna de escaños del CSV (escanos_2023 para el 23J)')
    a.add_argument('--parcial', action='store_true', help='no dar por fallo las provincias sin escaños oficiales')
    a.add_argument('--ajustados', type=int, default=8, help='cuántos «últimos escaños» más ajustados listar (0: ninguno)')
    a.add_argument('--en-bruto', action='store_true', help='ordenar los más ajustados por votos que faltaron, no por su %% sobre los válidos')
    o = a.parse_args()

    try:
        calc = leer_calculo(o.calculo, o.escanos)
        of = leer_oficiales(o.oficiales)
    except (OSError, ValueError, KeyError) as e:
        error('no se puede leer: %s' % e)
    nacional = of.pop('TOTAL', None)
    nombres = [c[0] for c in calc]
    raros = [x for x in nombres if x not in NOMBRES]
    if raros: error('circunscripciones con nombre distinto del de js/datos.js en %s: %s' % (o.calculo, ', '.join(raros)))

    difs, sin_oficial, avisos, ajust = [], [], [], []
    tot_c, tot_cc, tot_o = collections.Counter(), collections.Counter(), collections.Counter()
    for n, e, val, votos in calc:
        seats, _, emp = reparto(e, votos, val)
        avisos += ['%s: %s' % (n, x) for x in emp]
        c = collections.Counter({i: s for i, s in seats.items() if s})
        tot_c.update(c)
        r = faltan_para_ultimo(seats, votos, val)
        if r: ajust.append((r[1][1] / val, n, r[0], r[1][0], r[1][1]))
        if sum(c.values()) != e: avisos.append('%s: se reparten %d de %d escaños (¿menos candidaturas que escaños por encima del 3 %%?)' % (n, sum(c.values()), e))
        if n not in of: sin_oficial.append(n); continue
        ofi = collections.Counter({i: s for i, s in of[n].items() if s})
        tot_o.update(ofi); tot_cc.update(c)
        if sum(ofi.values()) != e: avisos.append('%s: los oficiales suman %d escaños y la circunscripción tiene %d' % (n, sum(ofi.values()), e))
        if c != ofi:
            ids = sorted(set(c) | set(ofi), key=lambda i: (-(c[i] + ofi[i]), i))
            difs.append((n, ', '.join('%s %d' % (i, c[i]) for i in ids if c[i]), ', '.join('%s %d' % (i, ofi[i]) for i in ids if ofi[i]),
                         ', '.join('%s %+d' % (i, c[i] - ofi[i]) for i in ids if c[i] != ofi[i])))
    extra = sorted(set(of) - set(nombres))
    for n in extra: avisos.append('%s tiene escaños oficiales pero no está en %s' % (n, o.calculo))

    cotejadas = len(calc) - len(sin_oficial)
    print('Escaños calculados: %d en %d circunscripciones (%s).' % (sum(tot_c.values()), len(calc), ', '.join('%s %d' % x for x in tot_c.most_common())))
    print('Cotejadas con los oficiales: %d circunscripciones.' % cotejadas)
    if sin_oficial: print('Sin escaños oficiales: %d circunscripciones%s' % (len(sin_oficial), '.' if o.parcial and len(sin_oficial) > 10 else ' (' + ', '.join(sin_oficial) + ').'))
    for x in avisos: print('AVISO · ' + x)
    if difs:
        print('\nDIFERENCIAS (%d circunscripciones):' % len(difs))
        for n, c, ofi, d in difs:
            print('  %s\n    calculado: %s\n    oficial:   %s\n    diferencia (calculado - oficial): %s' % (n, c, ofi, d))
        ids = sorted(set(tot_cc) | set(tot_o), key=lambda i: -(tot_cc[i] + tot_o[i]))
        print('  Total en las cotejadas (calculado - oficial): ' + ', '.join('%s %+d' % (i, tot_cc[i] - tot_o[i]) for i in ids if tot_cc[i] != tot_o[i]))
    elif cotejadas:
        print('Sin diferencias en las %d circunscripciones cotejadas.' % cotejadas)
    dif_nac = []
    if nacional is not None:
        nac = collections.Counter({i: s for i, s in nacional.items() if s})
        ids = sorted(set(tot_c) | set(nac), key=lambda i: -(tot_c[i] + nac[i]))
        dif_nac = ['%s %+d' % (i, tot_c[i] - nac[i]) for i in ids if tot_c[i] != nac[i]]
        print('\nTotal nacional oficial: %s.' % ', '.join('%s %d' % x for x in nac.most_common()))
        print('TOTAL NACIONAL: ' + ('DIFERENCIAS (calculado - oficial): ' + ', '.join(dif_nac) if dif_nac else 'coincide.'))
    if o.ajustados and ajust:
        print('\nÚltimos escaños más ajustados (votos que le faltaron al rival, %s):'
              % ('en bruto' if o.en_bruto else 'sobre los válidos de la provincia'))
        for pct, n, ult, riv, falt in sorted(ajust, key=lambda x: (x[4], x[0]) if o.en_bruto else x)[:o.ajustados]:
            print('  %-24s %-6s se lo lleva; a %-6s le faltaron %7d votos (%.2f %%)' % (n, ult, riv, falt, 100 * pct))
    fallo = bool(difs) or bool(dif_nac) or (bool(sin_oficial) and not o.parcial) or bool(extra)
    print('\nRESULTADO: ' + ('HAY DIFERENCIAS O FALTAN DATOS' if fallo else 'TODO COINCIDE'))
    sys.exit(1 if fallo else 0)


if __name__ == '__main__':
    main()
