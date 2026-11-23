"""Lee los resultados del Congreso en la web oficial de resultados, provincia a provincia, y escribe los mismos CSV
que interior_a_csv.py: el de resultados.py y el de escaños oficiales (y, si se pide, el CSV largo, para revisarlo o
completarlo a mano).

Supone una web como la del 23J (resultados.generales23j.es), que cargaba cada ámbito en JSON:
  - el nomenclátor (backend-difu/nomenclator/getNomenclator) da el identificador (scopeId) de cada provincia;
  - backend-difu/scope/data/getScopeData/{scope}/1/2/1/0 da su escrutinio: partidos[] con siglas, votos y cargos
    (escaños), votosBlancos, votosNulos, votosValidos, votosTotales, censoNocheEscrutado y porcMesasEscrutadas.
Si la web del 29N usa otra dirección u otras rutas, se cambian con --base, --nomenclator y --ruta sin tocar el código
({scope} es el identificador del nomenclátor; {codigo}, el código INE de la provincia, «28»).
Con --mapa se pide una sola cosa: el total nacional con el mapa de las provincias (…/{scope}/1/2/1/1/30). En el 23J
el total nacional traía así el ámbito entero de cada comunidad; con provincias y escrutinio no está comprobado.
Si no hay forma de bajarlos con el script, los JSON guardados desde el navegador (F12, Red) se leen con --carpeta
(también un solo JSON nacional con el mapa de provincias).

Sin credenciales: si la web pide usuario y contraseña (401) o niega el acceso (403), se para. Una petición cada
--pausa segundos (1 por defecto), con un User-Agent genérico. Avisa del porcentaje escrutado de cada provincia:
votos y escaños de una provincia sin terminar todavía pueden cambiar.

Uso (desde la carpeta del repositorio; cada orden en una sola línea):
  py herramientas/capturar_web.py --base https://resultados.29neleccionesgenerales.es --guardar ../descargas/interior/web_29N
      --csv datos/resultados_29N.csv --oficiales datos/escanos_oficiales_29N.csv --largo datos/resultados_29N_largo.csv
  py herramientas/capturar_web.py --base https://... --solo Soria      (una provincia: ¿responde la web y se entiende?)
  py herramientas/capturar_web.py --base https://... --mapa --csv ...  (las 52 de una vez, si la web las da así)
  py herramientas/capturar_web.py --revisar archivo.json                (qué se lee de un JSON guardado desde el navegador)
  py herramientas/capturar_web.py --carpeta ../descargas/interior/web_29N/20261129-231500 --csv ...   (sin red)
--base también acepta una carpeta con la misma estructura que la web (la que escribe simular_web.py, para ensayar).
"""
import argparse, collections, csv, datetime, gzip, hashlib, json, pathlib, re, sys, time, urllib.error, urllib.request
from escrutinio import DECRETO, INE, NOMBRES, clave_siglas, provincia, sin_acentos
from interior_a_csv import convertir, tabla_siglas

RUTA = 'backend-difu/scope/data/getScopeData/{scope}/1/2/1/0'
RUTA_MAPA = 'backend-difu/scope/data/getScopeData/{scope}/1/2/1/1/30'
NOMENCLATOR = 'backend-difu/nomenclator/getNomenclator'
AGENTE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
NIVEL_NACIONAL, NIVEL_PROVINCIA = 1, 30

for _s in (sys.stdout, sys.stderr):
    try: _s.reconfigure(errors='replace', line_buffering=True)   # que un carácter raro no lo pare y salga todo en orden
    except AttributeError: pass


def para(msg):
    print('ERROR: ' + msg, file=sys.stderr); sys.exit(1)


def aviso(msg):
    print('AVISO: ' + msg, file=sys.stderr)


def coma(x, d=2):
    return ('%.*f' % (d, x)).replace('.', ',')


def leer_json(datos, donde):
    if datos[:2] == b'\x1f\x8b': datos = gzip.decompress(datos)
    try: texto = datos.decode('utf-8-sig')
    except UnicodeDecodeError: texto = datos.decode('cp1252')
    try: return json.loads(texto)
    except ValueError:
        muestra = re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', texto)).strip()[:160]
        para('%s no es JSON. Empieza así: «%s»' % (donde, muestra))


class Lector:
    """Pide cada recurso a la web (o lo lee de una carpeta con la misma estructura) y, si se pide, lo guarda."""
    def __init__(self, base, pausa, agente, cabeceras, guardar):
        self.base, self.pausa, self.ultima = base, pausa, 0.0
        self.web = bool(re.match(r'https?://', base, re.I))
        self.cab = {'User-Agent': agente, 'Accept': 'application/json, text/plain, */*', 'Accept-Encoding': 'gzip'}
        for c in cabeceras:
            if ':' not in c: para('--cabecera necesita «Nombre: valor»')
            k, v = c.split(':', 1); self.cab[k.strip()] = v.strip()
        self.guardar = None
        if guardar:
            self.guardar = pathlib.Path(guardar) / datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
            self.guardar.mkdir(parents=True, exist_ok=False)

    def bajar(self, ruta, nombre):
        if self.web:
            datos = self._http(self.base.rstrip('/') + '/' + ruta.lstrip('/'))
        else:
            p = pathlib.Path(self.base, *[x for x in ruta.split('?')[0].split('/') if x])
            if not p.is_file(): para('no existe %s' % p)
            datos = p.read_bytes()
        if self.guardar:   # cada archivo con su huella en el momento, aunque luego algo falle
            (self.guardar / nombre).write_bytes(datos)
            with open(self.guardar / 'SHA256SUMS.txt', 'a', encoding='utf-8', newline='\n') as f:
                f.write('%s *%s\n' % (hashlib.sha256(datos).hexdigest(), nombre))
        return leer_json(datos, ruta)

    def _http(self, url):
        for intento in range(4):
            espera = self.pausa - (time.monotonic() - self.ultima)
            if espera > 0: time.sleep(espera)
            self.ultima = time.monotonic()
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=self.cab), timeout=30) as r:
                    return r.read()
            except urllib.error.HTTPError as e:
                if e.code in (401, 403):
                    para('%s responde %d: pide usuario y contraseña o niega el acceso. El capturador no usa credenciales: '
                         'si la web sigue cerrada, toca el camino a mano.' % (url, e.code))
                if e.code == 404:
                    para('%s no existe (404). ¿Ha cambiado la ruta? Mirarla en el navegador (F12, Red) y pasarla con '
                         '--ruta o --nomenclator.' % url)
                if e.code != 429 and e.code < 500: para('%s responde %d' % (url, e.code))
                motivo = 'HTTP %d' % e.code
                retraso = min(60, int(e.headers.get('Retry-After') or 0) or 10 * (intento + 1))
            except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
                motivo, retraso = str(getattr(e, 'reason', e)), 5 * (intento + 1)
            if intento < 3:
                aviso('%s: %s. Otro intento dentro de %d s.' % (url, motivo, retraso)); time.sleep(retraso)
        para('%s no responde tras 4 intentos' % url)

    def cerrar(self, nota):
        if not self.guardar: return
        (self.guardar / 'captura.txt').write_text(nota, encoding='utf-8')
        print('JSON guardados en %s (con SHA256SUMS.txt). Se pueden volver a leer con --carpeta.' % self.guardar)


# ---------- qué se lee de cada respuesta ----------
def del_nomenclator(nom, eleccion):
    """Identificador (scopeId) del total nacional y de cada provincia, con el código INE como clave."""
    try:
        amb = next(a['ambitos'] for a in nom['amb'] if a.get('elec') == eleccion)
    except (KeyError, TypeError, StopIteration):
        para('el nomenclátor no tiene la forma del 23J (amb[].elec == %d con ambitos[]). Claves: %s'
             % (eleccion, ', '.join(nom) if isinstance(nom, dict) else type(nom).__name__))
    provs = {str(x['co']).zfill(2): x['c'] for x in amb if x.get('l') == NIVEL_PROVINCIA}
    nac = next((x['c'] for x in amb if x.get('l') == NIVEL_NACIONAL), None)
    raros = sorted(set(provs) - set(INE))
    if raros or len(provs) != 52:
        para('el nomenclátor da %d provincias (hacen falta las 52)%s' % (len(provs), '; códigos raros: ' + ', '.join(raros) if raros else ''))
    return nac, provs


def valor(x, campo):
    return x.get(campo) if isinstance(x, dict) else x


def escrutinio(d, campo, donde):
    """Lo que hace falta de una respuesta de getScopeData. Sin escrutinio todavía, 'filas' es None."""
    s = d.get('scope', d) if isinstance(d, dict) else None
    if not isinstance(s, dict) or 'nivel' not in s:
        para('%s no tiene la forma del 23J («scope» con «nivel» y «escrutinio»). Claves: %s'
             % (donde, ', '.join(d) if isinstance(d, dict) else type(d).__name__))
    r = {'nombre': s.get('nombre') or '', 'codigo': str(s.get('codigo') or ''), 'nivel': s.get('nivel'), 'filas': None,
         'eleccion': (s.get('id') or {}).get('eleccion')}
    e = s.get('escrutinio')
    if not e: return r
    falta = [k for k in ('partidos', 'votosValidos', 'votosBlancos', 'votosNulos') if e.get(k) is None]
    if falta: para('%s: el escrutinio no trae %s. Claves: %s' % (donde, ', '.join(falta), ', '.join(e)))
    n = lambda k: valor(e.get(k), campo)
    filas = []
    for p in e['partidos']:
        v, c = valor(p.get('votos'), campo), valor(p.get('cargos'), campo)
        if v is None: para('%s: %s sin votos («%s»)' % (donde, p.get('siglas'), campo))
        filas.append({'siglas': (p.get('siglas') or '').strip(), 'nombre': (p.get('nombre') or '').strip(),
                      'alternativas': [a['siglas'] for a in p.get('agrupaciones') or [] if a.get('siglas')],
                      'votos': int(v), 'escanos': None if c is None else int(c)})
    distintos = [k for k, x in e.items() if isinstance(x, dict) and {'pro', 'def'} <= set(x) and x['pro'] != x['def']]
    distintos += ['votos de %s' % p.get('siglas') for p in e['partidos'] if valor(p.get('votos'), 'pro') != valor(p.get('votos'), 'def')]
    r.update(filas=filas, blancos=int(n('votosBlancos')), nulos=int(n('votosNulos')), validos=int(n('votosValidos')),
             votantes=n('votosTotales'), censo=n('censoNocheEscrutado') or s.get('censoNoche'), a_partidos=n('votosPartidos'),
             porc=n('porcMesasEscrutadas'), fecha=e.get('fecha'), envio=e.get('envio'), distintos=distintos)
    # Cuadres: las candidaturas suman votosPartidos; válidos = candidaturas + blancos; votantes = válidos + nulos.
    cand = sum(f['votos'] for f in filas)
    if r['a_partidos'] is not None and cand != r['a_partidos']:
        if cand > r['a_partidos']: para('%s: las candidaturas suman %d y votosPartidos dice %d' % (donde, cand, r['a_partidos']))
        aviso('%s: la web solo da %d de %d votos a candidaturas; el resto va a OTROS' % (donde, cand, r['a_partidos']))
        filas.append({'siglas': '(resto hasta los válidos)', 'nombre': '', 'alternativas': [], 'votos': r['a_partidos'] - cand,
                      'escanos': None, 'resto': True})
        cand = r['a_partidos']
    if cand + r['blancos'] != r['validos']:
        para('%s: candidaturas (%d) más blancos (%d) no dan los válidos (%d)' % (donde, cand, r['blancos'], r['validos']))
    if r['votantes'] is not None and r['votantes'] != r['validos'] + r['nulos']:
        aviso('%s: votosTotales (%d) no es válidos más nulos (%d); se usa como votantes igualmente' % (donde, r['votantes'], r['validos'] + r['nulos']))
    return r


def hora(fecha):
    try: return datetime.datetime.fromisoformat(fecha).astimezone().strftime('%d-%m %H:%M:%S')
    except (TypeError, ValueError): return str(fecha or '?')


def resumen(r):
    """Lo que se ha leído de un ámbito, para revisarlo en pantalla."""
    print('%s (nivel %s, código %s)' % (r['nombre'], r['nivel'], r['codigo']))
    if r['filas'] is None: print('  Sin escrutinio todavía.'); return
    print('  Datos de %s (envío %s). Mesas escrutadas: %s %%.' % (hora(r['fecha']), r['envio'], coma(r['porc'] or 0)))
    print('  Censo %s · votantes %s · válidos %d · blancos %d · nulos %d' % (r['censo'], r['votantes'], r['validos'], r['blancos'], r['nulos']))
    for f in sorted(r['filas'], key=lambda f: -f['votos'])[:12]:
        print('  %-30s %9d votos  %5s %%  %s escaños' % (f['siglas'][:30], f['votos'], coma(100 * f['votos'] / r['validos'] if r['validos'] else 0),
                                                       '-' if f['escanos'] is None else f['escanos']))
    if len(r['filas']) > 12: print('  ... y %d candidaturas más' % (len(r['filas']) - 12))
    if r['distintos']: print('  «pro» y «def» no coinciden en: %s' % ', '.join(r['distintos'][:8]))


def a_provincia(r, n):
    """Del escrutinio leído a la forma de interior_a_csv.py (la misma que leer_dat y leer_largo)."""
    filas = r['filas']
    p = {'filas': filas, 'blancos': r['blancos'], 'validos': r['validos'], 'nulos': r['nulos'],
         'votantes': r['votantes'], 'censo': r['censo'], 'porc': r['porc'], 'fecha': r['fecha'], 'envio': r['envio']}
    esc = sum(f['escanos'] or 0 for f in filas)
    p['con_escanos'] = esc > 0
    for f in filas: f['escanos'] = (f['escanos'] or 0) if esc else None
    p['escanos'] = esc or DECRETO[n]
    if esc and esc != DECRETO[n]:
        aviso('%s: la web reparte %d escaños y el decreto da %d (con datos de otra elección es normal; '
              'el 29N, resultados.py se parará)' % (n, esc, DECRETO[n]))
    return p


def clasificar(d, donde, campo, eleccion, provs, nac=None):
    """Mete en provs las provincias de una respuesta (la propia o las de su «mapa») y devuelve el total nacional
    si la respuesta lo es. Lo que no es un ámbito del Congreso (nomenclátor, Senado...) no cuenta."""
    if not isinstance(d, dict): return nac, 0
    ambitos = [d.get('scope', d)] + [x for x in d.get('mapa') or [] if isinstance(x, dict) and 'nivel' in x]
    usados = 0
    for s in ambitos:
        if not isinstance(s, dict) or 'nivel' not in s: continue
        if (s.get('id') or {}).get('eleccion', eleccion) != eleccion: continue   # el Senado, por ejemplo
        codigo = str(s.get('codigo') or '').zfill(2)
        if s['nivel'] == NIVEL_NACIONAL:
            r = escrutinio({'scope': s}, campo, donde); usados += 1
            if nac is None or nac['filas'] is None or (r['filas'] is not None and (r.get('envio') or 0) >= (nac.get('envio') or 0)): nac = r
        elif s['nivel'] == NIVEL_PROVINCIA and codigo in INE:
            r = escrutinio({'scope': s}, campo, '%s (%s)' % (donde, INE[codigo])); n = INE[codigo]; usados += 1
            if n in provs:
                aviso('%s está dos veces (envíos %s y %s); se queda el más alto' % (n, provs[n].get('envio'), r.get('envio')))
                if (r.get('envio') or 0) < (provs[n].get('envio') or 0): continue
            provs[n] = r
    return nac, usados


def leer_carpeta(carpeta, campo, eleccion):
    """Ámbitos de los JSON de una carpeta (guardados con --guardar o a mano): provincias y total nacional."""
    provs, nac, ignorados = {}, None, 0
    for f in sorted(pathlib.Path(carpeta).rglob('*')):
        if not f.is_file(): continue
        try:
            b = f.read_bytes()
            d = json.loads((gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b).decode('utf-8-sig'))
        except (ValueError, UnicodeDecodeError, OSError, EOFError):
            ignorados += 1; continue
        nac, usados = clasificar(d, f.name, campo, eleccion, provs, nac)
        if not usados: ignorados += 1
    print('Leídos de %s: %d provincias%s%s.' % (carpeta, len(provs), ' y el total nacional' if nac else '',
                                               ', %d archivos más que no son del Congreso por provincia' % ignorados if ignorados else ''))
    return provs, nac


def escribir_largo(ruta, prov, tabla, nota):
    """El CSV largo de interior_a_csv.py (entrada «largo»): se puede revisar, completar a mano y volver a convertir."""
    with open(ruta, 'w', encoding='utf-8-sig', newline='') as f:
        f.write('# %s\n# Las siglas son las de la web; si una solo se reconoce por su agrupación, va la de la agrupación.\n' % nota)
        w = csv.writer(f, delimiter=';', lineterminator='\n'); w.writerow(['provincia', 'siglas', 'votos', 'escanos', 'nombre'])
        for n in NOMBRES:
            if n not in prov: continue
            p = prov[n]
            for x in p['filas']:
                if x.get('resto'): continue
                sig = x['siglas']
                if clave_siglas(sig) not in tabla:
                    sig = next((a for a in x['alternativas'] if clave_siglas(a) in tabla), sig)
                w.writerow([n, sig, x['votos'], '' if x['escanos'] is None else x['escanos'],
                            x['nombre'] + (' (en la web: %s)' % x['siglas'] if sig != x['siglas'] else '')])
            for k in ('blancos', 'validos', 'nulos', 'votantes', 'censo'):
                if p.get(k) is not None: w.writerow([n, '_' + k, p[k], '', ''])
            if p['con_escanos'] and p['escanos'] != DECRETO[n]: w.writerow([n, '_escanos', p['escanos'], '', ''])
    print('Escrito %s (CSV largo, para revisar o completar a mano).' % ruta, file=sys.stderr)


def cotejo_nacional(nac, prov, tabla):
    """Compara el total nacional que da la web con la suma de las provincias, por partido de la web."""
    if not nac or nac['filas'] is None: return
    votos, esc = collections.Counter(), collections.Counter()
    for f in nac['filas']:
        i = next((tabla[k] for k in [clave_siglas(f['siglas'])] + [clave_siglas(a) for a in f['alternativas']] if k in tabla), 'OTROS')
        votos[i] += f['votos']; esc[i] += f['escanos'] or 0
    sv, se = collections.Counter(), collections.Counter()
    for p in prov.values(): sv.update(p['votos']); se.update(p['esc'])
    print('\nTotal nacional de la web: %s %% escrutado; %s.' % (coma(nac['porc'] or 0), ', '.join('%s %d' % x for x in esc.most_common() if x[1])))
    dif = ['%s: %+d votos, %+d escaños' % (i, sv[i] - votos[i], se[i] - esc[i]) for i in sorted(set(votos) | set(sv))
           if sv[i] != votos[i] or se[i] != esc[i]]
    if len(prov) < 52: print('Suma de provincias frente al total nacional: no se coteja (faltan provincias).')
    elif dif: aviso('la suma de las provincias no da el total nacional de la web (provincias menos total): %s. '
                    'Puede ser una coalición que la web agrupa distinto, o provincias leídas en otro momento.' % '; '.join(dif))
    else: print('Suma de las 52 provincias: coincide con el total nacional de la web, en votos y escaños.')


def main():
    a = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    a.add_argument('--base', help='dirección de la web de resultados (https://...) o carpeta con la misma estructura')
    a.add_argument('--carpeta', help='leer JSON ya guardados (con --guardar o desde el navegador) en lugar de bajarlos')
    a.add_argument('--revisar', metavar='JSON', help='enseñar lo que se lee de un JSON guardado, sin escribir nada')
    a.add_argument('--solo', action='append', metavar='PROVINCIA', help='bajar solo esta provincia y enseñarla, sin escribir nada')
    a.add_argument('--ruta', default=RUTA, help='ruta del escrutinio de cada ámbito (por defecto, la del 23J: %(default)s)')
    a.add_argument('--mapa', action='store_true', help='una sola petición: el total nacional con el mapa de las provincias')
    a.add_argument('--ruta-mapa', default=RUTA_MAPA, help='ruta del total nacional con el mapa (por defecto, %(default)s)')
    a.add_argument('--nomenclator', default=NOMENCLATOR, help='ruta del nomenclátor (por defecto, %(default)s)')
    a.add_argument('--eleccion', type=int, default=2, help='elección en el nomenclátor (2 = Congreso, como el 23J)')
    a.add_argument('--guardar', metavar='CARPETA', help='guardar cada JSON bajado en una subcarpeta con la fecha y la hora')
    a.add_argument('--csv', help='CSV de salida para resultados.py')
    a.add_argument('--oficiales', help='CSV de salida con los escaños oficiales (provincia,partido,escanos)')
    a.add_argument('--largo', help='CSV largo de salida (provincia;siglas;votos;escanos), para revisarlo o completarlo')
    a.add_argument('--siglas', action='append', help='tabla de siglas; se puede repetir (por defecto, datos/siglas.csv)')
    a.add_argument('--alias', action='append', default=[], metavar='SIGLAS=ID', help='traducción extra; se puede repetir')
    a.add_argument('--campo', default='pro', choices=['pro', 'def'], help='qué valor leer de cada {pro, def} (por defecto, pro)')
    a.add_argument('--pausa', type=float, default=1.0, help='segundos entre peticiones (por defecto, 1)')
    a.add_argument('--agente', default=AGENTE, help='User-Agent de las peticiones')
    a.add_argument('--cabecera', action='append', default=[], metavar='"Nombre: valor"', help='cabecera extra; se puede repetir')
    o = a.parse_args()
    if sum(bool(x) for x in (o.base, o.carpeta, o.revisar)) != 1: a.error('hace falta una (y solo una) de --base, --carpeta o --revisar')
    if o.revisar:
        resumen(escrutinio(leer_json(pathlib.Path(o.revisar).read_bytes(), o.revisar), o.campo, o.revisar)); return
    if not o.solo and not o.csv: a.error('falta --csv (o --solo para mirar una provincia)')
    solo = []
    for x in o.solo or []:
        n = provincia(x)
        if not n: a.error('provincia que no se reconoce: %s' % x)
        solo.append(n)

    inicio = datetime.datetime.now()
    lector = None
    if o.carpeta:
        leidas, nac = leer_carpeta(o.carpeta, o.campo, o.eleccion)
        if solo: leidas = {n: r for n, r in leidas.items() if n in solo}
    elif o.mapa:
        lector = Lector(o.base, o.pausa, o.agente, o.cabecera, o.guardar)
        nac_id, _ = del_nomenclator(lector.bajar(o.nomenclator, 'nomenclator.json'), o.eleccion)
        print('Bajando el total nacional con el mapa de provincias de %s...' % o.base, file=sys.stderr)
        leidas = {}
        nac, _ = clasificar(lector.bajar(o.ruta_mapa.format(scope=nac_id), 'nacional_mapa.json'), 'total nacional con mapa',
                            o.campo, o.eleccion, leidas)
        if len(leidas) < 52: aviso('el mapa trae %d provincias. Sin --mapa se piden una a una.' % len(leidas))
        if solo: leidas = {n: r for n, r in leidas.items() if n in solo}
    else:
        lector = Lector(o.base, o.pausa, o.agente, o.cabecera, o.guardar)
        nac_id, ids = None, {c: None for c in INE}
        if '{scope}' in o.ruta:
            nac_id, ids = del_nomenclator(lector.bajar(o.nomenclator, 'nomenclator.json'), o.eleccion)
        codigos = [c for c, n in sorted(INE.items(), key=lambda x: NOMBRES.index(x[1])) if not solo or n in solo]
        print('Bajando %d provincias de %s (una petición cada %s s)...' % (len(codigos), o.base, coma(o.pausa, 1)), file=sys.stderr)
        leidas, nac = {}, None
        for c in codigos:
            n = INE[c]
            r = escrutinio(lector.bajar(o.ruta.format(scope=ids[c], codigo=c), '%s_%s.json' % (c, re.sub(r'[^A-Za-z0-9]+', '_', sin_acentos(n)).strip('_'))), o.campo, n)
            if r['nivel'] != NIVEL_PROVINCIA or r['codigo'].zfill(2) != c or r['eleccion'] not in (None, o.eleccion):
                aviso('%s: la web devuelve «%s» (nivel %s, código %s, elección %s)' % (n, r['nombre'], r['nivel'], r['codigo'], r['eleccion']))
            leidas[n] = r
        if nac_id and not solo:
            nac = escrutinio(lector.bajar(o.ruta.format(scope=nac_id, codigo='00'), 'nacional.json'), o.campo, 'total nacional')

    if solo:
        for n in solo:
            if n in leidas: resumen(leidas[n])
            else: aviso('%s: no está' % n)
        if lector: lector.cerrar('Captura de %s: %s\n' % (o.base, ', '.join(solo)))
        return

    # Porcentaje escrutado de cada provincia: lo primero que hay que mirar.
    sin = [n for n in NOMBRES if n not in leidas or leidas[n]['filas'] is None]
    prov = {n: a_provincia(leidas[n], n) for n in NOMBRES if n not in sin}
    print('\nMesas escrutadas por provincia (* = sin terminar):')
    celdas = ['%-22s %s' % (n[:22], '   sin datos' if n in sin else '%8s %%%s' % (coma(prov[n]['porc'] or 0), ' ' if (prov[n]['porc'] or 0) >= 100 else '*'))
              for n in NOMBRES]
    for k in range(0, len(celdas), 3): print('  ' + '   '.join(celdas[k:k + 3]))
    pendientes = sorted((n for n in prov if (prov[n]['porc'] or 0) < 100), key=lambda n: prov[n]['porc'] or 0)
    if pendientes:
        aviso('%d provincias sin terminar de escrutar (sus votos y escaños aún pueden cambiar): %s'
              % (len(pendientes), ', '.join('%s %s %%' % (n, coma(prov[n]['porc'] or 0)) for n in pendientes)))
    elif prov: print('Todas las provincias leídas, al 100 %.')
    if prov:
        fechas = sorted(p['fecha'] for p in prov.values() if p['fecha'])
        if fechas: print('Datos de la web entre %s y %s (envíos %s a %s).' % (hora(fechas[0]), hora(fechas[-1]),
                                                                          min(p['envio'] or 0 for p in prov.values()), max(p['envio'] or 0 for p in prov.values())))
    if nac and nac['filas'] is not None:
        print('Total nacional: %s %% escrutado (es el porcentaje que va en la etiqueta).' % coma(nac['porc'] or 0))
    distintos = [n for n in prov if leidas[n]['distintos']]
    if distintos: aviso('«pro» y «def» no coinciden en %d provincias (%s): se lee «%s»' % (len(distintos), ', '.join(distintos[:5]), o.campo))
    if sin: aviso('sin datos de %s. Se pueden copiar a mano en el CSV largo y convertirlo con interior_a_csv.py largo.'
                  % ', '.join(sin))
    if not prov: para('ninguna provincia tiene escrutinio todavía')

    tabla = tabla_siglas(o.siglas, o.alias)
    nota = 'Capturado de %s el %s.' % (o.base or o.carpeta, inicio.strftime('%d-%m-%Y a las %H:%M:%S'))
    if lector: lector.cerrar(nota + '\nRuta: %s\nUser-Agent: %s\n' % (o.ruta, o.agente))
    if o.largo: escribir_largo(o.largo, prov, tabla, nota)
    print('', file=sys.stderr)
    convertir(prov, tabla, o.csv, o.oficiales)
    cotejo_nacional(nac, prov, tabla)
    if sin: sys.exit(1)   # resultados.py necesita las 52


if __name__ == '__main__':
    main()
