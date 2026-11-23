"""Convierte resultados del Ministerio del Interior en el CSV de resultados.py y en un CSV de escaños oficiales
para cotejar_escanos.py.

Dos entradas posibles:

  dat    Ficheros de la Base de Datos de Resultados Electorales de infoelectoral.interior.gob.es (zip o carpeta
         con 03xxaamm.DAT, 07xxaamm.DAT y 08xxaamm.DAT del Congreso). Registros de ancho fijo, en ANSI, descritos en
         FICHEROS.doc dentro del propio zip. Así se publican los resultados oficiales de cada elección.

  largo  Un CSV en formato largo, hecho a mano o desde cualquier otra fuente, con columnas provincia,siglas,votos
         y, si se conocen, escanos (los oficiales de esa candidatura en esa provincia). Por provincia, además de
         una fila por candidatura, filas con estas siglas especiales en la columna siglas:
           _blancos (obligatoria), _validos, _nulos, _votantes, _censo y _escanos (escaños de la provincia;
           si no está, los del Real Decreto 806/2026: solo hace falta para ensayar con otras elecciones)
         Si hay _validos, lo que no está en ninguna fila de candidatura va a OTROS. Si no hay _votantes pero sí
         _nulos, votantes = válidos + nulos. Plantilla: datos/plantilla_largo.csv.

Las siglas se traducen a los partidos de la web con datos/siglas.csv (o --alias). Una candidatura sin traducir
se suma a OTROS si no llega al 3 % de los válidos en ninguna provincia ni saca escaño; si llega, el script se
para y la lista, porque sumarla a OTROS cambiaría el reparto que hace la web.

Un id que no sea OTROS tiene que estar en META (resultados.py); OTROS no puede tener escaños.

Uso (desde la carpeta del repositorio; cada orden en una sola línea):
  py herramientas/interior_a_csv.py dat ../descargas/interior/2023_congreso/02202307_TOTA.zip
      --siglas datos/siglas.csv --siglas datos/siglas_23J.csv --csv datos/simulacro_23J.csv
      --oficiales datos/escanos_oficiales_23J.csv
  py herramientas/interior_a_csv.py largo datos/resultados_29N_largo.csv --csv datos/resultados_29N.csv
      --oficiales datos/escanos_oficiales_29N.csv
"""
import argparse, collections, csv, pathlib, re, sys, zipfile
from escrutinio import DECRETO, INE, NOMBRES, RAIZ, clave_siglas, leer_siglas, provincia

ESPECIALES = {'_blancos', '_validos', '_nulos', '_votantes', '_censo', '_escanos'}


def num(x, donde):
    """Entero; acepta separadores de miles con punto o espacio («93.282», «93 282») y «93282.0» de una hoja de cálculo."""
    t = (x or '').strip().replace(' ', '').replace(' ', '')
    if re.fullmatch(r'\d{1,3}(\.\d{3})+', t): t = t.replace('.', '')
    elif re.fullmatch(r'\d+[.,]0+', t): t = re.split(r'[.,]', t)[0]
    if not re.fullmatch(r'\d+', t): sys.exit('ERROR: «%s» no es un número entero (%s)' % (x, donde))
    return int(t)


# ---------- entrada «dat»: ficheros de ancho fijo de infoelectoral ----------
def leer_dat(ruta):
    ruta = pathlib.Path(ruta)
    textos = {}
    if ruta.is_dir():
        for p in ruta.iterdir():
            if re.fullmatch(r'0[378]02\d{4}\.DAT', p.name, re.I): textos[p.name[:2]] = p.read_bytes()
    else:
        with zipfile.ZipFile(ruta) as z:
            for n in z.namelist():
                if re.fullmatch(r'0[378]02\d{4}\.DAT', pathlib.PurePath(n).name, re.I): textos[pathlib.PurePath(n).name[:2]] = z.read(n)
    falta = [t for t in ('03', '07', '08') if t not in textos]
    if falta: sys.exit('ERROR: faltan los ficheros %s del Congreso (0x02aamm.DAT) en %s' % (', '.join(falta), ruta))
    lineas = {t: b.decode('cp1252').splitlines() for t, b in textos.items()}
    # 03: candidaturas. Código (9-14), siglas (15-64), denominación (65-214), cabecera de acumulación nacional (227-232).
    cand = {}
    for l in lineas['03']:
        if len(l) < 232: continue
        cand[l[8:14]] = {'siglas': l[14:64].strip(), 'nombre': l[64:214].strip(), 'nac': l[226:232]}
    # 07: datos globales por ámbito. Comunidad (10-11), provincia (12-13), distrito (14; 9 = total provincial),
    # censo de escrutinio (86-93), blancos (126-133), nulos (134-141), votos a candidaturas (142-149), escaños (150-155).
    prov = {}
    for l in lineas['07']:
        if len(l) < 155 or l[9:11] == '99' or l[11:13] == '99' or l[13] != '9': continue
        n = INE.get(l[11:13])
        if not n: sys.exit('ERROR: código de provincia desconocido en 07: %s' % l[11:13])
        bl, nul, vc = int(l[125:133]), int(l[133:141]), int(l[141:149])
        prov[n] = {'escanos': int(l[149:155]), 'blancos': bl, 'nulos': nul, 'validos': vc + bl, 'votantes': vc + bl + nul,
                   'censo': int(l[85:93]), 'cand': vc, 'filas': [], 'nombre_fichero': l[14:64].strip()}
    # 08: votos y escaños de cada candidatura por ámbito. Candidatura (15-20), votos (21-28), electos (29-33).
    for l in lineas['08']:
        if len(l) < 33 or l[9:11] == '99' or l[11:13] == '99' or l[13] != '9': continue
        n = INE[l[11:13]]
        c = cand.get(l[14:20])
        if not c: sys.exit('ERROR: candidatura %s de %s sin fila en 03' % (l[14:20], n))
        cabecera = cand.get(c['nac'], c)
        prov[n]['filas'].append({'siglas': c['siglas'], 'alternativas': [cabecera['siglas']], 'nombre': c['nombre'],
                                 'votos': int(l[20:28]), 'escanos': int(l[28:33])})
    for n, p in prov.items():
        s = sum(f['votos'] for f in p['filas'])
        if s != p['cand']: sys.exit('ERROR: en %s los votos de las candidaturas (08) suman %d y el total (07) dice %d' % (n, s, p['cand']))
        e = sum(f['escanos'] for f in p['filas'])
        if e != p['escanos']: sys.exit('ERROR: en %s los electos (08) suman %d y los escaños (07) son %d' % (n, e, p['escanos']))
        p['con_escanos'] = True
    return prov


# ---------- entrada «largo»: un CSV por provincia y candidatura ----------
def leer_largo(ruta):
    with open(ruta, encoding='utf-8-sig', newline='') as f:
        lineas = [l for l in f if l.strip() and not l.lstrip().startswith('#')]   # las líneas con # no cuentan
    muestra = ''.join(lineas[:20])
    sep = ';' if muestra.count(';') > muestra.count(',') else ','
    lector = csv.DictReader(lineas, delimiter=sep)
    filas = list(lector)
    cols = {c.strip().lower(): c for c in (lector.fieldnames or [])}
    for c in ('provincia', 'siglas', 'votos'):
        if c not in cols: sys.exit('ERROR: el CSV largo necesita las columnas provincia, siglas y votos (tiene: %s)' % ', '.join(cols))
    prov, desconocidas, vacias = {}, set(), []
    for k, f in enumerate(filas, 2):
        texto = (f[cols['provincia']] or '').strip()
        if not texto: continue
        n = provincia(texto)
        if not n: desconocidas.add(texto); continue
        p = prov.setdefault(n, {'filas': [], 'esp': {}})
        sig = (f[cols['siglas']] or '').strip()
        if not (f[cols['votos']] or '').strip(): vacias.append('%s %s' % (n, sig)); continue
        v = num(f[cols['votos']], 'fila %d de datos, %s, %s' % (k - 1, texto, sig))
        clave = sig.lower() if sig.lower() in ESPECIALES else clave_siglas(sig)
        if clave in p.setdefault('vistas', set()): sys.exit('ERROR: %s aparece dos veces en %s' % (sig, n))
        p['vistas'].add(clave)
        if sig.lower() in ESPECIALES:
            p['esp'][sig.lower()] = v
        else:
            e = (f.get(cols.get('escanos', ''), '') or '').strip() if 'escanos' in cols else ''
            p['filas'].append({'siglas': sig, 'alternativas': [], 'nombre': sig, 'votos': v, 'escanos': num(e, 'fila %d' % k) if e else None})
    if desconocidas: sys.exit('ERROR: provincias que no se reconocen: %s' % ', '.join(sorted(desconocidas)))
    if vacias: sys.exit('ERROR: %d filas sin votos (rellenarlas o borrarlas): %s%s' % (len(vacias), '; '.join(vacias[:12]), '...' if len(vacias) > 12 else ''))
    for n, p in prov.items():
        e = p.pop('esp'); p.pop('vistas', None)
        if '_blancos' not in e: sys.exit('ERROR: falta la fila _blancos de %s' % n)
        p['blancos'] = e['_blancos']
        cand = sum(f['votos'] for f in p['filas'])
        if '_validos' in e:
            otros = e['_validos'] - e['_blancos'] - cand
            if otros < 0: sys.exit('ERROR: en %s las candidaturas y los blancos suman más que _validos (%d de más)' % (n, -otros))
            if otros: p['filas'].append({'siglas': '(resto hasta _validos)', 'alternativas': [], 'nombre': '', 'votos': otros, 'escanos': None, 'resto': True})
            p['validos'] = e['_validos']
        else:
            p['validos'] = cand + e['_blancos']
        p['nulos'] = e.get('_nulos')
        p['votantes'] = e.get('_votantes', p['validos'] + e['_nulos'] if '_nulos' in e else None)
        p['censo'] = e.get('_censo')
        p['escanos'] = e.get('_escanos', DECRETO[n])
        # Con un escaño escrito en alguna candidatura, las casillas vacías de esa provincia valen 0.
        p['con_escanos'] = any(f['escanos'] is not None for f in p['filas'])
        if p['con_escanos']:
            for f in p['filas']: f['escanos'] = f['escanos'] or 0
            s = sum(f['escanos'] for f in p['filas'])
            if s != p['escanos']: sys.exit('ERROR: en %s los escaños escritos suman %d y la provincia tiene %d (decreto o _escanos)' % (n, s, p['escanos']))
    return prov


# ---------- de candidaturas a partidos de la web ----------
def traducir(prov, tabla):
    """Asigna a cada fila un id. Devuelve la lista de candidaturas sin traducir que no pueden ir a OTROS."""
    graves = collections.defaultdict(list)
    for n, p in prov.items():
        for f in p['filas']:
            if f.get('resto'): f['id'] = 'OTROS'; continue
            f['id'] = next((tabla[k] for k in [clave_siglas(f['siglas'])] + [clave_siglas(a) for a in f['alternativas']] if k in tabla), None)
            pct = f['votos'] / p['validos'] if p['validos'] else 0
            dato = '%s %.1f %%%s' % (n, 100 * pct, ', %d escaños' % f['escanos'] if f['escanos'] else '')
            if f['id'] is None and (pct >= 0.03 or (f['escanos'] or 0) > 0):
                graves[f['siglas']].append(dato)
            elif f['id'] == 'OTROS' and (f['escanos'] or 0) > 0:
                graves[f['siglas'] + ' (está como OTROS, pero OTROS no puede tener escaños)'].append(dato)
            elif f['id'] == 'OTROS' and pct >= 0.03:
                print('AVISO: %s pasa del 3 %% y va a OTROS por datos/siglas.csv: %s' % (f['siglas'], dato), file=sys.stderr)
            f['id'] = f['id'] or 'OTROS'
    return graves


def tabla_siglas(siglas=None, alias=()):
    """Tabla de traducción: los archivos de siglas (por defecto, datos/siglas.csv) y los --alias SIGLAS=ID."""
    tabla = {}
    for s in siglas or [str(RAIZ / 'datos' / 'siglas.csv')]: tabla.update(leer_siglas(s))
    for x in alias:
        if '=' not in x: sys.exit('ERROR: --alias necesita SIGLAS=ID, por ejemplo --alias "UPN-PP=UPN"')
        s, i = x.rsplit('=', 1); tabla[clave_siglas(s)] = i.strip()
    return tabla


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    a.add_argument('formato', choices=['dat', 'largo']); a.add_argument('entrada')
    a.add_argument('--csv', required=True, help='CSV de salida para resultados.py')
    a.add_argument('--oficiales', help='CSV de salida con los escaños oficiales (provincia,partido,escanos)')
    a.add_argument('--siglas', action='append', help='tabla de siglas; se puede repetir (por defecto, datos/siglas.csv)')
    a.add_argument('--alias', action='append', default=[], metavar='SIGLAS=ID', help='traducción extra; se puede repetir')
    o = a.parse_args()
    tabla = tabla_siglas(o.siglas, o.alias)
    prov = leer_dat(o.entrada) if o.formato == 'dat' else leer_largo(o.entrada)
    if not prov: sys.exit('ERROR: %s no tiene datos' % o.entrada)
    convertir(prov, tabla, o.csv, o.oficiales)


def convertir(prov, tabla, salida_csv, salida_oficiales=None):
    """Traduce las siglas y escribe el CSV de resultados.py y, si se pide, el de escaños oficiales.
    Lo usan main() y capturar_web.py. Devuelve prov con los votos ('votos') y escaños ('esc') por id."""
    faltan = [n for n in NOMBRES if n not in prov]
    if faltan: print('AVISO: faltan %d circunscripciones: %s' % (len(faltan), ', '.join(faltan)), file=sys.stderr)
    graves = traducir(prov, tabla)
    if graves:
        print('ERROR: candidaturas sin traducir que llegan al 3 % o sacan escaño en alguna provincia.', file=sys.stderr)
        print('Añadir una fila a datos/siglas.csv (o --alias "SIGLAS=ID") con un id de META en resultados.py, u OTROS:', file=sys.stderr)
        for s, d in sorted(graves.items()): print('  %s: %s' % (s, '; '.join(d)), file=sys.stderr)
        sys.exit(1)

    # Votos por partido de la web: se suman las candidaturas con el mismo id (PSC y PSdeG-PSOE con PSOE, etc.).
    total = collections.Counter()
    for p in prov.values():
        p['votos'] = collections.Counter(); p['esc'] = collections.Counter()
        for f in p['filas']:
            p['votos'][f['id']] += f['votos']
            if p['con_escanos']: p['esc'][f['id']] += f['escanos']
        for i, v in p['votos'].items(): total[i] += v
    ids = [i for i, _ in total.most_common() if i != 'OTROS']
    con_censo = all(p.get('censo') is not None and p.get('votantes') is not None for p in prov.values())
    if not con_censo:
        sin = [n for n in NOMBRES if n in prov and (prov[n].get('censo') is None or prov[n].get('votantes') is None)]
        print('AVISO: sin censo o votantes en %d circunscripciones (%s): el CSV va sin censo, votantes ni nulos '
              'y la web no dará la participación.' % (len(sin), ', '.join(sin[:6]) + ('...' if len(sin) > 6 else '')), file=sys.stderr)
    cab = ['district', 'escanos', 'validos'] + ids + ['OTROS', 'BLANCO'] + (['censo', 'votantes', 'nulos'] if con_censo else [])
    with open(salida_csv, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, lineterminator='\n'); w.writerow(cab)
        for n in NOMBRES:
            if n not in prov: continue
            p = prov[n]
            w.writerow([n, p['escanos'], p['validos']] + [p['votos'][i] for i in ids] + [p['votos']['OTROS'], p['blancos']]
                       + ([p['censo'], p['votantes'], p['nulos'] or 0] if con_censo else []))
    print('Escrito %s: %d circunscripciones, partidos %s.' % (salida_csv, len(prov), ', '.join(ids)), file=sys.stderr)

    if salida_oficiales:
        sin = [n for n in NOMBRES if n in prov and not prov[n]['con_escanos']]
        if sin: print('AVISO: sin escaños oficiales en %d circunscripciones (no van al CSV de oficiales): %s' % (len(sin), ', '.join(sin)), file=sys.stderr)
        with open(salida_oficiales, 'w', encoding='utf-8', newline='') as f:
            w = csv.writer(f, lineterminator='\n'); w.writerow(['provincia', 'partido', 'escanos'])
            for n in NOMBRES:
                if n in prov and prov[n]['con_escanos']:
                    for i, e in sorted(prov[n]['esc'].items(), key=lambda x: -x[1]):
                        if e: w.writerow([n, i, e])
        tot = collections.Counter()
        for p in prov.values(): tot.update(p['esc'])
        print('Escrito %s: %d escaños (%s).' % (salida_oficiales, sum(tot.values()), ', '.join('%s %d' % x for x in tot.most_common() if x[1])), file=sys.stderr)
    return prov


if __name__ == '__main__':
    main()
