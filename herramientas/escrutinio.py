"""Piezas comunes de interior_a_csv.py y cotejar_escanos.py: nombres de las circunscripciones,
siglas de los partidos y el reparto D'Hondt, el mismo que hace la web (js/dhondt.js).
No se ejecuta solo.
"""
import csv, io, json, math, os, re, pathlib, sys, unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def consola_windows():
    """En Windows, si la salida va a una tubería (PowerShell con | o ISE) y no a la consola, Python escribe en ANSI
    y PowerShell lo lee en la página de la consola (850): «Cádiz» sale «Cßdiz». Se escribe en la de la consola."""
    if sys.platform != 'win32' or os.environ.get('PYTHONIOENCODING'): return   # si se pide una codificación, esa
    try:
        import ctypes
        cp = ctypes.windll.kernel32.GetConsoleOutputCP()
        for s in (sys.stdout, sys.stderr):
            if cp and not s.isatty(): s.reconfigure(encoding='cp%d' % cp, errors='replace')
    except (AttributeError, LookupError, OSError, ValueError):
        pass

consola_windows()


def leer_texto(ruta):
    """Un CSV en UTF-8 (con BOM o sin él), en UTF-16 (el «>» de PowerShell 5.1) o en ANSI (Excel, «CSV delimitado
    por comas»), devuelto como texto que se puede leer línea a línea con csv."""
    b = pathlib.Path(ruta).read_bytes()
    if b[:2] in (b'\xff\xfe', b'\xfe\xff'): return io.StringIO(b.decode('utf-16'), newline='')
    try: return io.StringIO(b.decode('utf-8-sig'), newline='')
    except UnicodeDecodeError: pass
    try: texto = b.decode('cp1252')
    except UnicodeDecodeError: sys.exit('ERROR: %s no está en UTF-8 ni en ANSI. Guardarlo como «CSV UTF-8».' % ruta)
    print('AVISO: %s no está en UTF-8: se lee como ANSI (Windows-1252), que es como lo guarda Excel. '
          'Comprobar los acentos de las provincias y las siglas.' % ruta, file=sys.stderr)
    return io.StringIO(texto, newline='')

# Circunscripciones y escaños del decreto, tal como están en js/datos.js (anexo del Real Decreto 806/2026).
_datos = (RAIZ / 'js' / 'datos.js').read_text(encoding='utf-8')
PROV = json.loads(re.search(r'export const PROV = (\[.*?\]);', _datos).group(1))
NOMBRES = [p[0] for p in PROV]
DECRETO = dict((p[0], p[1]) for p in PROV)

# Código INE de cada provincia (el que usan los ficheros del Ministerio del Interior).
INE = {'01': 'Araba/Álava', '02': 'Albacete', '03': 'Alicante/Alacant', '04': 'Almería', '05': 'Ávila', '06': 'Badajoz',
       '07': 'Balears (Illes)', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón/Castelló',
       '13': 'Ciudad Real', '14': 'Córdoba', '15': 'Coruña (A)', '16': 'Cuenca', '17': 'Girona', '18': 'Granada',
       '19': 'Guadalajara', '20': 'Gipuzkoa', '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
       '26': 'Rioja (La)', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
       '33': 'Asturias', '34': 'Palencia', '35': 'Palmas (Las)', '36': 'Pontevedra', '37': 'Salamanca',
       '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona',
       '44': 'Teruel', '45': 'Toledo', '46': 'Valencia/València', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora',
       '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla'}
assert sorted(INE.values()) == sorted(NOMBRES), 'INE y js/datos.js no tienen las mismas circunscripciones'


def sin_acentos(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def _palabras(s):
    s = sin_acentos(s).lower().replace('ñ', 'n')
    return frozenset(w for w in re.split(r'[^a-z0-9]+', s) if w)

# Cada circunscripción se reconoce por sus palabras, sin acentos y en cualquier orden: «A Coruña» = «Coruña (A)»,
# «Illes Balears» = «Balears (Illes)», «Alacant/Alicante» = «Alicante/Alacant». También vale una sola de las dos
# formas de los nombres dobles («Álava», «Alicante», «Castelló») y el código INE («28»).
_CLAVES = {}
for _n in NOMBRES:
    _CLAVES[_palabras(_n)] = _n
    for _parte in _n.split('/'):
        _CLAVES.setdefault(_palabras(_parte), _n)
for _c, _n in INE.items():
    _CLAVES[frozenset([_c])] = _n
    _CLAVES[frozenset([str(int(_c))])] = _n
_CLAVES[_palabras('Islas Baleares')] = 'Balears (Illes)'
_CLAVES[_palabras('Baleares')] = 'Balears (Illes)'
_CLAVES[_palabras('La Coruña')] = 'Coruña (A)'
_CLAVES[_palabras('Gerona')] = 'Girona'
_CLAVES[_palabras('Lérida')] = 'Lleida'
_CLAVES[_palabras('Orense')] = 'Ourense'
_CLAVES[_palabras('Guipúzcoa')] = 'Gipuzkoa'
_CLAVES[_palabras('Vizcaya')] = 'Bizkaia'
_CLAVES[_palabras('Tenerife')] = 'Santa Cruz de Tenerife'
_CLAVES[_palabras('Región de Murcia')] = 'Murcia'
_CLAVES[_palabras('Comunidad de Madrid')] = 'Madrid'
_CLAVES[_palabras('Principado de Asturias')] = 'Asturias'
_CLAVES[_palabras('Comunidad Foral de Navarra')] = 'Navarra'


def provincia(texto):
    """Nombre de la circunscripción como en js/datos.js, o None si no se reconoce."""
    return _CLAVES.get(_palabras(texto or ''))


def clave_siglas(s):
    """Siglas normalizadas para compararlas: mayúsculas, sin acentos, sin puntos ni espacios ni guiones."""
    return re.sub(r'[^A-Z0-9+]', '', sin_acentos(s or '').upper().replace('Ñ', 'N'))


def leer_siglas(ruta):
    """datos/siglas.csv: siglas,id[,nota]. id es un partido de META en resultados.py, u OTROS."""
    tabla = {}
    with leer_texto(ruta) as f:
        for fila in csv.DictReader(l for l in f if l.strip() and not l.lstrip().startswith('#')):
            k = clave_siglas(fila['siglas'])
            if k: tabla[k] = fila['id'].strip()
    return tabla


def reparto(escanos, votos, validos, barrera=0.03):
    """D'Hondt de una circunscripción, igual que reparto() de js/dhondt.js (LOREG, art. 163).
    votos: lista de (id, votos), en el orden del CSV; validos: votos a candidaturas más votos en blanco.
    Entran las candidaturas con al menos el 3 % de los válidos. A igual cociente gana la de más votos;
    si también empatan en votos, la ley manda sortear y aquí gana la primera de la lista (como en la web).
    Devuelve (escaños por id, último cociente, avisos de empate)."""
    dentro = [(i, v) for i, v in votos if v > 0 and v / validos >= barrera]
    seats = {i: 0 for i, _ in votos}
    q = None
    for _ in range(escanos):
        mejor, q = None, -1
        for i, v in dentro:
            c = v / (seats[i] + 1)
            if c > q or (c == q and mejor and v > mejor[1]): q, mejor = c, (i, v)
        if not mejor: break
        seats[mejor[0]] += 1
    avisos = []
    if dentro and any(seats.values()):
        # Empate exacto entre el último escaño dado y el siguiente cociente, con los mismos votos: la ley manda sortear.
        q_ultimo = min(v / seats[i] for i, v in dentro if seats[i])
        ultimos = [v for i, v in dentro if seats[i] and v / seats[i] == q_ultimo]
        siguientes = [v for i, v in dentro if v / (seats[i] + 1) == q_ultimo]
        if siguientes and any(v in ultimos for v in siguientes):
            avisos.append('empate exacto en votos por el último escaño: la ley manda sortear y aquí gana la primera de la lista')
    return seats, q, avisos


def faltan_para_ultimo(escanos_por_id, votos, validos, barrera=0.03):
    """Para el último escaño: quién se lo llevó y cuántos votos le faltaron al rival más cercano (como la web)."""
    dentro = [(i, v) for i, v in votos if v > 0 and v / validos >= barrera]
    cocientes = [(v / escanos_por_id[i], i) for i, v in dentro if escanos_por_id[i]]
    if not cocientes: return None
    q, ultimo = min(cocientes)
    rival = None
    for i, v in dentro:
        if i == ultimo: continue
        faltan = math.floor(q * (escanos_por_id[i] + 1) - v) + 1
        if rival is None or faltan < rival[1]: rival = (i, faltan)
    return (ultimo, rival) if rival else None
