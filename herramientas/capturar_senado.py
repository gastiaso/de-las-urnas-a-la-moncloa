"""Lee los senadores elegidos en la web oficial de resultados, circunscripción a circunscripción, y escribe el CSV del
Senado (circunscripcion;partido;electos) que resultados.py mete en la web con --senado (formato en senado.py).

Es el compañero de capturar_web.py, con sus mismos parámetros y su misma forma de pedir (sin credenciales, una petición
cada --pausa segundos, User-Agent genérico, cada JSON guardado con su huella si se pide --guardar). Supone una web como la
del 23J (resultados.generales23j.es):
  - el nomenclátor (backend-difu/nomenclator/getNomenclator) trae el Senado como elección 3, con las provincias (nivel 30),
    las islas (nivel 70) y, en 2023, Ibiza y Formentera juntas (nivel 60);
  - backend-difu/scope/data/getScopeData/{scope}/2/3/1/0 da el escrutinio de cada circunscripción, con partidos[] y, en
    cada partido, «cargos»: los senadores que lleva ese partido en ese momento.
Lo comprobado y lo supuesto (23-nov-2026): la elección 3 y sus ámbitos salen del nomenclátor archivado del 23J; los cargos
por partido, del total nacional del Senado archivado (getScopeDataTopPartidosGanadores/…/2/3/1/1/20, el 23J a las 22:20).
La ruta de cada circunscripción no está archivada: «2/3/1/0» se deduce de la del Congreso («1/2/1/0») y de la del Senado
archivada. Si la del 29N es otra, se cambia con --ruta (mirarla en el navegador: F12, Red, filtrar por getScopeData).

Uso (desde la carpeta del repositorio; cada orden en una sola línea):
  py herramientas/capturar_senado.py --base https://resultados.29neleccionesgenerales.es --solo Mallorca   (¿responde y se entiende?)
  py herramientas/capturar_senado.py --base https://resultados.29neleccionesgenerales.es --guardar ../descargas/interior/web_29N
      --csv datos/senado_29N.csv
  py herramientas/capturar_senado.py --carpeta ../descargas/interior/web_29N/20261129-231500 --csv datos/senado_29N.csv   (sin red)
  py herramientas/capturar_senado.py --revisar archivo.json             (qué se lee de un JSON guardado desde el navegador)
Al acabar comprueba el CSV con senado.py: si las circunscripciones o los electos no cuadran con el decreto, lo dice y
acaba con error (el CSV queda escrito, para completarlo a mano). Las siglas se traducen con datos/siglas.csv; lo que no
se traduce queda tal cual y la web lo enseña con ese nombre (senado.py lo avisa).
"""
import argparse, collections, datetime, json, pathlib, re, sys
from capturar_web import AGENTE, NOMENCLATOR, Lector, aviso, coma, hora, leer_json, para, valor
from escrutinio import INE, sin_acentos
from interior_a_csv import tabla_siglas
import senado

RUTA = 'backend-difu/scope/data/getScopeData/{scope}/2/3/1/0'
ELECCION = 3
NIVEL_NACIONAL, NIVEL_PROVINCIA, NIVEL_IBIZA_FORMENTERA, NIVEL_ISLA = 1, 30, 60, 70


def circ_de_ambito(nivel, codigo, nombre):
    """Circunscripción del Senado (nombre de senado.SENADO) de un ámbito del nomenclátor o de un escrutinio, o None."""
    if nivel == NIVEL_IBIZA_FORMENTERA: return senado.JUNTAS_2023
    if nivel == NIVEL_ISLA: c = senado.circunscripcion(nombre); return c if c and not c.startswith('ERROR') else None
    if nivel == NIVEL_PROVINCIA and str(codigo).zfill(2) in INE:
        c = senado.circunscripcion(str(codigo).zfill(2)); return c if c and not c.startswith('ERROR') else None
    return None


def del_nomenclator(nom, eleccion):
    """Identificador (scopeId) del total nacional y de cada circunscripción del Senado."""
    try:
        amb = next(a['ambitos'] for a in nom['amb'] if a.get('elec') == eleccion)
    except (KeyError, TypeError, StopIteration):
        para('el nomenclátor no trae la elección %d (el Senado) como el del 23J (amb[].elec con ambitos[])' % eleccion)
    nac = next((x['c'] for x in amb if x.get('l') == NIVEL_NACIONAL), None)
    juntas = {x['i'] for x in amb if x.get('l') == NIVEL_IBIZA_FORMENTERA}
    ids = {}
    for x in amb:
        if x.get('l') == NIVEL_ISLA and any(p.get('l') == NIVEL_IBIZA_FORMENTERA and set(p.get('p') or []) & juntas for p in x.get('p') or []):
            continue   # Ibiza o Formentera dentro de la circunscripción conjunta de 2023: cuenta la conjunta
        c = circ_de_ambito(x.get('l'), x.get('co'), x.get('n'))
        if c: ids[c] = x['c']
    esperadas = [s[0] for s in senado.SENADO]
    if senado.JUNTAS_2023 in ids: esperadas = [senado.JUNTAS_2023 if c == 'Ibiza' else c for c in esperadas if c != 'Formentera']
    faltan = [c for c in esperadas if c not in ids]
    if faltan: aviso('el nomenclátor no trae %d circunscripciones del Senado: %s' % (len(faltan), ', '.join(faltan)))
    return nac, {c: ids[c] for c in esperadas if c in ids}


def escrutinio(d, campo, donde):
    """Lo que hace falta de una respuesta de getScopeData del Senado. Sin escrutinio todavía, 'filas' es None."""
    s = d.get('scope', d) if isinstance(d, dict) else None
    if not isinstance(s, dict) or 'nivel' not in s:
        para('%s no tiene la forma del 23J («scope» con «nivel» y «escrutinio»). Claves: %s'
             % (donde, ', '.join(d) if isinstance(d, dict) else type(d).__name__))
    r = {'nombre': s.get('nombre') or '', 'codigo': str(s.get('codigo') or ''), 'nivel': s.get('nivel'), 'filas': None,
         'eleccion': (s.get('id') or {}).get('eleccion')}
    e = s.get('escrutinio')
    if not e: return r
    if e.get('partidos') is None: para('%s: el escrutinio no trae «partidos». Claves: %s' % (donde, ', '.join(e)))
    filas = []
    for p in e['partidos']:
        c = valor(p.get('cargos'), campo)
        if c is None: para('%s: %s sin «cargos» (los senadores elegidos). ¿Es una respuesta del Senado?' % (donde, p.get('siglas')))
        filas.append({'siglas': (p.get('siglas') or '').strip(), 'nombre': (p.get('nombre') or '').strip(), 'electos': int(c),
                      'alternativas': [a['siglas'] for a in p.get('agrupaciones') or [] if a.get('siglas')]})
    distintos = ['%s' % p.get('siglas') for p in e['partidos'] if isinstance(p.get('cargos'), dict) and p['cargos'].get('pro') != p['cargos'].get('def')]
    r.update(filas=filas, porc=valor(e.get('porcMesasEscrutadas'), campo), fecha=e.get('fecha'), envio=e.get('envio'), distintos=distintos)
    return r


def resumen(r, n=None):
    print('%s (nivel %s, código %s)%s' % (r['nombre'], r['nivel'], r['codigo'], ' · ' + n if n else ''))
    if r['filas'] is None: print('  Sin escrutinio todavía.'); return
    print('  Datos de %s (envío %s). Mesas escrutadas: %s %%.' % (hora(r['fecha']), r['envio'], coma(r['porc'] or 0)))
    con = [f for f in r['filas'] if f['electos']]
    print('  Senadores: %s' % (', '.join('%s %d' % (f['siglas'], f['electos']) for f in con) or 'ninguno todavía'))
    if r['distintos']: print('  «pro» y «def» no coinciden en: %s' % ', '.join(r['distintos'][:8]))


def traduce(f, tabla):
    """El id de la web si las siglas (o las de su agrupación) están en datos/siglas.csv; si no, las siglas tal cual."""
    for s in [f['siglas']] + f['alternativas']:
        i = tabla.get(senado.clave_siglas(s))
        if i and i != 'OTROS': return i
    return f['siglas']


def leer_carpeta(carpeta, campo):
    circs, nac = {}, None
    for f in sorted(pathlib.Path(carpeta).rglob('*')):
        if not f.is_file() or f.suffix.lower() in ('.txt', '.csv'): continue
        try: d = leer_json(f.read_bytes(), f.name)
        except SystemExit: continue
        s = d.get('scope') if isinstance(d, dict) else None
        if not isinstance(s, dict) or (s.get('id') or {}).get('eleccion') not in (None, ELECCION) or 'nivel' not in s: continue   # el Congreso es la 2
        r = escrutinio(d, campo, f.name)
        if r['nivel'] == NIVEL_NACIONAL: nac = r; continue
        c = circ_de_ambito(r['nivel'], r['codigo'], r['nombre'])
        if c and (c not in circs or (r.get('envio') or 0) >= (circs[c].get('envio') or 0)): circs[c] = r
    print('Leídas de %s: %d circunscripciones del Senado%s.' % (carpeta, len(circs), ' y el total nacional' if nac else ''))
    return circs, nac


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    a.add_argument('--base', help='dirección de la web de resultados (https://...) o carpeta con la misma estructura')
    a.add_argument('--carpeta', help='leer JSON ya guardados (con --guardar o desde el navegador) en lugar de bajarlos')
    a.add_argument('--revisar', metavar='JSON', help='enseñar lo que se lee de un JSON guardado, sin escribir nada')
    a.add_argument('--solo', action='append', metavar='CIRCUNSCRIPCIÓN', help='bajar solo esta (provincia o isla) y enseñarla, sin escribir nada')
    a.add_argument('--ruta', default=RUTA, help='ruta del escrutinio de cada ámbito (por defecto, la deducida del 23J: %(default)s)')
    a.add_argument('--nomenclator', default=NOMENCLATOR, help='ruta del nomenclátor en la web, o un archivo ya guardado (por defecto, %(default)s)')
    a.add_argument('--eleccion', type=int, default=ELECCION, help='elección del Senado en el nomenclátor (3, como el 23J)')
    a.add_argument('--guardar', metavar='CARPETA', help='guardar cada JSON bajado en una subcarpeta con la fecha y la hora')
    a.add_argument('--csv', help='CSV del Senado de salida (circunscripcion;partido;electos)')
    a.add_argument('--siglas', action='append', help='tabla de siglas; se puede repetir (por defecto, datos/siglas.csv)')
    a.add_argument('--alias', action='append', default=[], metavar='SIGLAS=ID', help='traducción extra; se puede repetir')
    a.add_argument('--campo', default='pro', choices=['pro', 'def'], help='qué valor leer de cada {pro, def} (por defecto, pro)')
    a.add_argument('--pausa', type=float, default=1.0, help='segundos entre peticiones (por defecto, 1)')
    a.add_argument('--agente', default=AGENTE, help='User-Agent de las peticiones')
    a.add_argument('--cabecera', action='append', default=[], metavar='"Nombre: valor"', help='cabecera extra; se puede repetir')
    a.add_argument('--prueba', action='store_true', help='datos de 2023 (Ibiza y Formentera juntas), para ensayar')
    o = a.parse_args()
    if sum(bool(x) for x in (o.base, o.carpeta, o.revisar)) != 1: a.error('hace falta una (y solo una) de --base, --carpeta o --revisar')
    if o.revisar:
        r = escrutinio(leer_json(pathlib.Path(o.revisar).read_bytes(), o.revisar), o.campo, o.revisar)
        resumen(r, circ_de_ambito(r['nivel'], r['codigo'], r['nombre'])); return
    if not o.solo and not o.csv: a.error('falta --csv (o --solo para mirar una circunscripción)')
    solo = []
    for x in o.solo or []:
        c = senado.circunscripcion(x)
        if not c or c.startswith('ERROR'): a.error('no es una circunscripción del Senado: %s (en Baleares y Canarias, la isla)' % x)
        solo.append(c)

    inicio, lector, nac = datetime.datetime.now(), None, None
    if o.carpeta:
        leidas, nac = leer_carpeta(o.carpeta, o.campo)
        if solo: leidas = {c: r for c, r in leidas.items() if c in solo}
    else:
        lector = Lector(o.base, o.pausa, o.agente, o.cabecera, o.guardar)
        nac_id, ids = del_nomenclator(lector.bajar(o.nomenclator, 'nomenclator.json'), o.eleccion)
        pedir = [c for c in ids if not solo or c in solo]
        print('Bajando %d circunscripciones del Senado de %s...' % (len(pedir), o.base), file=sys.stderr)
        leidas = {}
        for c in pedir:
            r = escrutinio(lector.bajar(o.ruta.format(scope=ids[c]), 'senado_%s.json' % re.sub(r'[^A-Za-z0-9]+', '_', sin_acentos(c)).strip('_')), o.campo, c)
            if r['eleccion'] not in (None, o.eleccion): aviso('%s: la web devuelve la elección %s, no la %d (el Senado)' % (c, r['eleccion'], o.eleccion))
            leidas[c] = r
        if nac_id and not solo: nac = escrutinio(lector.bajar(o.ruta.format(scope=nac_id), 'senado_nacional.json'), o.campo, 'total nacional')

    if solo:
        for c in solo:
            if c in leidas: resumen(leidas[c], c)
            else: aviso('%s: no está' % c)
        if lector: lector.cerrar('Captura del Senado de %s: %s\n' % (o.base, ', '.join(solo)))
        return

    orden = [s[0] for s in senado.SENADO]
    if senado.JUNTAS_2023 in leidas: orden = [senado.JUNTAS_2023 if c == 'Ibiza' else c for c in orden if c != 'Formentera']
    sin = [c for c in orden if c not in leidas or leidas[c]['filas'] is None]
    con = [c for c in orden if c not in sin]
    print('\nMesas escrutadas por circunscripción del Senado (* = sin terminar):')
    celdas = ['%-20s %s' % (c[:20], '   sin datos' if c in sin else '%8s %%%s' % (coma(leidas[c]['porc'] or 0), ' ' if (leidas[c]['porc'] or 0) >= 100 else '*')) for c in orden]
    for k in range(0, len(celdas), 3): print('  ' + '   '.join(celdas[k:k + 3]))
    pendientes = [c for c in con if (leidas[c]['porc'] or 0) < 100]
    if pendientes: aviso('%d circunscripciones sin terminar de escrutar (sus senadores aún pueden cambiar): %s'
                         % (len(pendientes), ', '.join('%s %s %%' % (c, coma(leidas[c]['porc'] or 0)) for c in pendientes)))
    elif con: print('Todas las circunscripciones leídas, al 100 %.')
    if sin: aviso('sin datos de %s: copiarlas a mano en el CSV (mismas columnas) y comprobarlo con senado.py' % ', '.join(sin))
    if not con: para('ninguna circunscripción del Senado tiene escrutinio todavía')

    tabla = tabla_siglas(o.siglas, o.alias)
    nota = 'Capturado de %s el %s.' % (o.base or o.carpeta, inicio.strftime('%d-%m-%Y a las %H:%M:%S'))
    if lector: lector.cerrar(nota + '\nRuta: %s\nUser-Agent: %s\n' % (o.ruta, o.agente))
    total = collections.Counter()
    with open(o.csv, 'w', encoding='utf-8-sig', newline='') as f:
        f.write('# Senadores elegidos por circunscripción y partido. %s\n# Partido: el id de la web si las siglas están en datos/siglas.csv; si no, las siglas de la web.\n' % nota)
        f.write('circunscripcion;partido;electos\n')
        for c in con:
            n = collections.Counter()
            for x in leidas[c]['filas']:
                if x['electos']: n[traduce(x, tabla)] += x['electos']
            for i, k in n.most_common(): f.write('%s;%s;%d\n' % (c, i, k))
            total.update(n)
    print('Escrito %s: %d circunscripciones, %d senadores (%s).' % (o.csv, len(con), sum(total.values()), ', '.join('%s %d' % x for x in total.most_common())), file=sys.stderr)
    # El total nacional de la web, frente a la suma de las circunscripciones (la web puede agrupar las siglas de otra forma).
    if nac and nac['filas'] is not None and not sin:
        tn = collections.Counter()
        for x in nac['filas']:
            if x['electos']: tn[traduce(x, tabla)] += x['electos']
        print('Total nacional de la web: %s %% escrutado; %s.' % (coma(nac['porc'] or 0), ', '.join('%s %d' % x for x in tn.most_common())))
        dif = ['%s %+d' % (i, total[i] - tn[i]) for i in sorted(set(total) | set(tn)) if total[i] != tn[i]]
        if dif: aviso('la suma de las circunscripciones no da el total nacional de la web (circunscripciones menos total): %s. '
                      'Si son siglas que la web agrupa distinto, no es un error; si son senadores, repetir la captura.' % '; '.join(dif))
        else: print('Suma de las circunscripciones: coincide con el total nacional de la web.')
    print('', file=sys.stderr)
    s = senado.leer(o.csv, prueba=o.prueba, siglas=o.siglas)   # se para si no cuadra con el decreto
    for m in s['avisos']: aviso(m)
    print('Comprobado con senado.py: %d circunscripciones y %d senadores, que cuadran con el decreto.' % (len(s['circ']), sum(senado.total(s).values())))
    if sin: sys.exit(1)


if __name__ == '__main__':
    main()
