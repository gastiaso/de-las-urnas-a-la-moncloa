"""Monta en una carpeta una copia de la web de resultados con la forma de la del 23J, para ensayar capturar_web.py.

Los votos y escaños salen de los ficheros oficiales del Ministerio (los mismos que lee interior_a_csv.py dat), y los
JSON copian la estructura de los archivados de resultados.generales23j.es (getScopeData: scope, escrutinio,
partidos[] con votos y cargos en {pro, def}). Con --nomenclator se usa el nomenclátor archivado del 23J, con sus
identificadores reales (y comprimido en gzip, como lo guardó el archivo). Nada de esto toca el sitio.

Uso (desde la carpeta del repositorio; cada orden en una sola línea):
  py herramientas/simular_web.py ../descargas/interior/2023_congreso/02202307_TOTA.zip
      --nomenclator ../descargas/interior/web_23J_archivo/nomenclator.json --salida C:/temp/web23J
  py herramientas/capturar_web.py --base C:/temp/web23J --siglas datos/siglas.csv --siglas datos/siglas_23J.csv --csv ...
o, para probar también las peticiones, servir la carpeta y pasar la dirección:
  py -m http.server 8840 --directory C:/temp/web23J      y      --base http://localhost:8840
Opciones para ensayar fallos: --escrutado Madrid=97.3 (provincia sin terminar), --falta Soria (sin escrutinio).
Con --senado datos/senado_23J.csv (y el nomenclátor archivado) añade el Senado, para ensayar capturar_senado.py: los
senadores de cada circunscripción en «cargos», con la forma del total nacional del Senado archivado. Los votos de cada
candidato no se simulan (el capturador no los lee).
"""
import argparse, collections, gzip, json, pathlib, sys
from escrutinio import INE, NOMBRES, provincia
from interior_a_csv import leer_dat

NAC = '00000000000000000000000b'
FECHA = '2023-07-24T00:24:13.003+00:00'


def pd(x):
    return {'pro': x, 'def': x}


def ambito(sid, codigo, nombre, nivel, circ, p, filas, porc, envio):
    cand = sum(f['votos'] for f in filas)
    partidos = [{'siglas': f['siglas'], 'codigo': str(k), 'cargos': pd(f['escanos']), 'nombre': f['nombre'], 'votos': pd(f['votos']),
                 'porcentaje': pd(round(100 * f['votos'] / p['validos'], 2)), 'orden': k, 'candidatos': [],
                 'agrupaciones': [{'nivel': 1, 'nombre': a, 'siglas': a, 'codigo': ''} for a in f.get('alternativas', [])]}
                for k, f in enumerate(sorted(filas, key=lambda f: -f['votos']), 1)]
    esc = None if porc is None else {
        'envio': envio, 'fecha': FECHA, 'censoNocheEscrutado': pd(p['censo']), 'votosValidos': pd(p['validos']),
        'votosBlancos': pd(p['blancos']), 'votosNulos': pd(p['nulos']), 'votosPartidos': pd(cand), 'votosTotales': pd(p['votantes']),
        'abstencion': pd(p['censo'] - p['votantes']), 'porcMesasEscrutadas': pd(porc), 'porcCensoNocheEscrutado': pd(porc),
        'participacion': pd(round(100 * p['votantes'] / p['censo'], 2)), 'partidos': partidos}
    return {'scope': {'codigo': codigo, 'nombre': nombre, 'nivel': nivel, 'censoINE': p['censo'], 'censoNoche': p['censo'],
                      'padres': [] if nivel == 1 else [{'nivel': 1, 'nombre': 'España', 'codigo': '1', 'isCircuns': 2, 'scopeId': NAC}],
                      'apertura': None, 'avances': None, 'escrutinio': esc, 'escrutinioAnt': None, 'envio': envio, 'isCircuns': circ,
                      'mapa': None, 'id': {'scopeId': sid, 'eleccion': 2}, 'showEscrutinio': True}}


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    a.add_argument('dat', help='zip o carpeta con los .DAT del Congreso (02202307_TOTA.zip)')
    a.add_argument('--salida', required=True, help='carpeta donde montar la web simulada')
    a.add_argument('--nomenclator', help='nomenclátor archivado del 23J (si no, uno inventado)')
    a.add_argument('--escrutado', action='append', default=[], metavar='PROVINCIA=PCT', help='mesas escrutadas de una provincia')
    a.add_argument('--falta', action='append', default=[], metavar='PROVINCIA', help='provincia todavía sin escrutinio')
    a.add_argument('--senado', help='CSV del Senado (como datos/senado_23J.csv): añade el Senado; necesita --nomenclator')
    o = a.parse_args()
    prov = leer_dat(o.dat)
    porc = {n: 100.0 for n in NOMBRES}
    for x in o.escrutado:
        n, v = x.rsplit('=', 1); porc[provincia(n) or sys.exit('provincia desconocida: ' + n)] = float(v)
    for x in o.falta: porc[provincia(x) or sys.exit('provincia desconocida: ' + x)] = None
    sal = pathlib.Path(o.salida)
    base = sal / 'backend-difu' / 'scope' / 'data' / 'getScopeData'
    (sal / 'backend-difu' / 'nomenclator').mkdir(parents=True, exist_ok=True)
    nomen = sal / 'backend-difu' / 'nomenclator' / 'getNomenclator'
    if o.nomenclator:
        crudo = pathlib.Path(o.nomenclator).read_bytes(); nomen.write_bytes(crudo)
        nom = json.loads(gzip.decompress(crudo) if crudo[:2] == b'\x1f\x8b' else crudo)
        amb = next(x['ambitos'] for x in nom['amb'] if x['elec'] == 2)
        ids = {str(x['co']).zfill(2): x['c'] for x in amb if x['l'] == 30}
    else:
        ids = {c: '%024x' % (0x100 + int(c)) for c in INE}
        amb = [{'i': 0, 'c': NAC, 'co': '1', 'n': 'España', 'l': 1}] + [{'i': k, 'c': ids[c], 'co': c, 'n': n, 'l': 30} for k, (c, n) in enumerate(INE.items(), 1)]
        nomen.write_text(json.dumps({'ver': 1, 'amb': [{'elec': 2, 'ord': 1, 'ambitos': amb}]}, ensure_ascii=False), encoding='utf-8')
    cods = {n: c for c, n in INE.items()}
    mapa = []
    for k, n in enumerate(NOMBRES):
        p = prov[n]
        d = base / ids[cods[n]] / '1' / '2' / '1'; d.mkdir(parents=True, exist_ok=True)
        x = ambito(ids[cods[n]], cods[n], p['nombre_fichero'], 30, 1, p, p['filas'], porc[n], 130 + k % 3)
        (d / '0').write_text(json.dumps(x, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        mapa.append(x['scope'])
    # Total nacional: candidaturas sumadas por su cabecera nacional, como en la web.
    tot, filas = collections.Counter(), {}
    for n in NOMBRES:
        if porc[n] is None: continue
        for k in ('blancos', 'nulos', 'validos', 'votantes', 'censo'): tot[k] += prov[n][k]
        for f in prov[n]['filas']:
            s = f['alternativas'][0] if f['alternativas'] else f['siglas']
            g = filas.setdefault(s, {'siglas': s, 'nombre': s, 'votos': 0, 'escanos': 0}); g['votos'] += f['votos']; g['escanos'] += f['escanos']
    hechas = [v for v in porc.values() if v is not None]
    d = base / NAC / '1' / '2' / '1'; d.mkdir(parents=True, exist_ok=True)
    nac = ambito(NAC, '1', 'España', 1, 2, tot, list(filas.values()), min(hechas), 132)
    (d / '0').write_text(json.dumps(nac, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    # El total nacional con el mapa de provincias (--mapa de capturar_web.py), como el nacional con comunidades del 23J.
    (d / '1').mkdir(exist_ok=True)
    (d / '1' / '30').write_text(json.dumps(dict(nac, mapa=mapa), ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('Web simulada en %s: 52 provincias, el total nacional y el nacional con el mapa de provincias.' % sal)
    if o.senado:
        if not o.nomenclator: sys.exit('--senado necesita --nomenclator (el archivado del 23J, que trae el Senado)')
        print('Senado: %d circunscripciones y el total nacional.' % senado_simulado(o.senado, base, nom))


def senado_simulado(ruta, base, nom):
    """El Senado (elección 3) de la web simulada: getScopeData/{scope}/2/3/1/0 de cada circunscripción y del total."""
    import senado
    from capturar_senado import del_nomenclator
    s = senado.leer(ruta, prueba=True)
    nac_id, ids = del_nomenclator(nom, 3)
    amb = {x['c']: x for x in next(a['ambitos'] for a in nom['amb'] if a['elec'] == 3)}
    def escribe(sid, x, cuenta, circ):
        partidos = [{'siglas': i, 'codigo': str(k), 'cargos': pd(n), 'nombre': i, 'votos': pd(0), 'porcentaje': pd(0.0), 'orden': k,
                     'candidatos': None, 'agrupaciones': []} for k, (i, n) in enumerate(cuenta.most_common(), 1)]
        d = {'scope': {'codigo': x['co'], 'nombre': x['n'], 'nivel': x['l'], 'padres': [], 'apertura': None, 'avances': None,
                       'escrutinio': {'envio': 140, 'fecha': FECHA, 'porcMesasEscrutadas': pd(100.0), 'cargos': sum(cuenta.values()), 'partidos': partidos},
                       'escrutinioAnt': None, 'envio': 140, 'isCircuns': circ, 'mapa': None, 'id': {'scopeId': sid, 'eleccion': 3}, 'showEscrutinio': True}}
        dd = base / sid / '2' / '3' / '1'; dd.mkdir(parents=True, exist_ok=True)
        (dd / '0').write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    tot = collections.Counter()
    for c in s['circ']:
        if c['c'] not in ids: sys.exit('el nomenclátor no tiene %s en el Senado' % c['c'])
        escribe(ids[c['c']], amb[ids[c['c']]], collections.Counter(c['r']), 1); tot.update(c['r'])
    escribe(nac_id, amb[nac_id], tot, 2)
    return len(s['circ'])


if __name__ == '__main__':
    main()
