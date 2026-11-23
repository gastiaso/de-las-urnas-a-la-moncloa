"""Senado por islas: en Baleares y Canarias, los hexágonos de cada isla, sobre su isla o lo más cerca posible.

herramientas/cartograma.py coloca los senadores de Baleares, Las Palmas y Santa Cruz de Tenerife en un racimo por provincia.
Pero allí cada isla elige los suyos (Real Decreto 806/2026, art. 3): Mallorca 3, Menorca, Ibiza y Formentera 1; Gran Canaria
y Tenerife 3; Lanzarote, Fuerteventura, La Palma, La Gomera y El Hierro 1. Este script vuelve a colocar esas tres provincias
isla por isla y reescribe en js/cartograma.js HEX_SEN y CANARIAS_SEN. La Península, Ceuta y Melilla no se mueven.
No necesita shapely (que cartograma.py sí necesita): solo la biblioteca estándar.

Método:
1. Dónde está cada isla: el centroide de su polígono en herramientas/geo/provincias-es-atlas.json (el mismo archivo y la misma
   proyección que cartograma.py: longitud × cos 40°, latitud). Cada isla es el polígono más cercano a un punto de referencia.
2. Baleares, en su sitio: ese punto se pasa al mapa con la escala y la traslación que mejor llevan el centro de cada
   provincia peninsular al centro de sus hexágonos (mínimos cuadrados). Canarias, en su recuadro: las islas guardan su
   posición relativa a otra escala (ESCALA_CAN, la de cartograma.py), en la esquina de abajo a la izquierda, como antes.
3. Cada isla ocupa tantas celdas de la rejilla como senadores elige. Se busca la colocación que menos aleja las celdas de
   su isla (suma de distancias al cuadrado), con estas reglas: cada isla, de una pieza; dos islas no se tocan, salvo las que
   separa un brazo de mar estrecho (PEGADAS: Ibiza y Formentera, Lanzarote y Fuerteventura), y entonces la raya entre las dos
   es de costa; ninguna toca la Península, Ceuta ni Melilla; todo cabe en el escenario, y el recuadro de Canarias queda a
   media celda, al menos, de cualquier otro hexágono (Ceuta, la más cercana).
   Búsqueda exhaustiva con poda (son pocas islas y pocas celdas).
4. HEX_SEN lleva una sexta columna: la circunscripción (índice de SENADO en js/datos.js). Dentro de cada provincia, los
   hexágonos van por circunscripción (en el orden de SENADO: Mallorca antes que Menorca) y, dentro de cada una, de oeste a
   este en la Península (como los deja cartograma.py) y de norte a sur en las islas. El primero de cada provincia, que es
   donde va el hexágono dorado de tu voto, cae así en la isla más poblada y en su hexágono de arriba: la etiqueta «Tu voto»,
   que va encima, no tapa ningún otro de la isla.

Uso (desde la carpeta del repositorio):
  py herramientas/islas_senado.py               reescribe HEX_SEN y CANARIAS_SEN en js/cartograma.js
  py herramientas/islas_senado.py --comprueba   no escribe nada: dice si js/cartograma.js está al día
  py herramientas/islas_senado.py --dibuja      además, dibuja en texto Baleares y Canarias
Para regenerar el cartograma entero: py herramientas/cartograma.py > js/cartograma.js y, después, este script.
"""
import json, math, re, sys, pathlib
sys.stdout.reconfigure(errors='replace')

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CARTO = RAIZ / 'js' / 'cartograma.js'
_datos = (RAIZ / 'js' / 'datos.js').read_text(encoding='utf-8')
SENADO = json.loads(re.search(r'export const SENADO = (\[.*?\]);', _datos, re.S).group(1))
PROV = json.loads(re.search(r'export const PROV = (\[.*?\]);', _datos, re.S).group(1))
assert len(SENADO) == 60 and sum(s[2] for s in SENADO) == 209
ISLAS = sorted({s[1] for s in SENADO if sum(1 for t in SENADO if t[1] == s[1]) > 1})   # provincias que votan por islas
assert [PROV[i][0] for i in ISLAS] == ['Balears (Illes)', 'Palmas (Las)', 'Santa Cruz de Tenerife']
BALEARES = ISLAS[0]
INE = {ISLAS[0]: '07', ISLAS[1]: '35', ISLAS[2]: '38'}
# Un punto (longitud, latitud) de cada isla, solo para saber cuál de los polígonos de su provincia es.
REF = {'Mallorca': (2.95, 39.6), 'Menorca': (4.1, 39.95), 'Ibiza': (1.42, 38.98), 'Formentera': (1.46, 38.69),
       'Gran Canaria': (-15.6, 27.95), 'Lanzarote': (-13.64, 29.03), 'Fuerteventura': (-14.04, 28.4),
       'Tenerife': (-16.56, 28.29), 'La Palma': (-17.86, 28.69), 'La Gomera': (-17.23, 28.12), 'El Hierro': (-18.0, 27.75)}
PEGADAS = {frozenset(('Ibiza', 'Formentera')), frozenset(('Lanzarote', 'Fuerteventura'))}
ESCALA_CAN = 0.85   # escala de Canarias en su recuadro, respecto de la Península (la de cartograma.py)
LAT0 = math.cos(math.radians(40))

# --- js/cartograma.js ---
FIN = '\r\n' if b'\r\n' in CARTO.read_bytes() else '\n'   # se respeta el fin de línea de la copia de trabajo
texto = CARTO.read_text(encoding='utf-8')
PASO = float(re.search(r'export const PASO_SEN = ([\d.]+);', texto).group(1))
HEX = json.loads(re.search(r'export const HEX_SEN = (\[.*?\]);', texto).group(1))
R3 = math.sqrt(3) / 2
# rejilla: x = X0 + (columna + media si la fila es impar) × PASO; z = Z0 + fila × PASO × √3/2
X0 = sum(h[0] - (h[3] + 0.5 * (h[4] & 1)) * PASO for h in HEX) / len(HEX)
Z0 = sum(h[1] - h[4] * PASO * R3 for h in HEX) / len(HEX)
xz = lambda c, r: (X0 + (c + 0.5 * (r & 1)) * PASO, Z0 + r * PASO * R3)
assert all(abs(xz(h[3], h[4])[0] - h[0]) < 2e-4 and abs(xz(h[3], h[4])[1] - h[1]) < 2e-4 for h in HEX), 'HEX_SEN no está en una rejilla'
def vecinos(c, r):
    o = [(1, 0), (-1, 0)] + ([(0, -1), (1, -1), (0, 1), (1, 1)] if r & 1 else [(-1, -1), (0, -1), (-1, 1), (0, 1)])
    return [(c + a, r + b) for a, b in o]
fijas = {(h[3], h[4]): h[2] for h in HEX if h[2] not in ISLAS}   # Península, Ceuta y Melilla

# --- geometría: TopoJSON mínimo, como en cartograma.py ---
topo = json.load(open(RAIZ / 'herramientas' / 'geo' / 'provincias-es-atlas.json', encoding='utf-8'))
sc, tr = topo['transform']['scale'], topo['transform']['translate']
arcos = []
for a in topo['arcs']:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append(((x * sc[0] + tr[0]) * LAT0, y * sc[1] + tr[1]))
    arcos.append(pts)
def anillo(ids):
    pts = []
    for i in ids:
        a = arcos[i] if i >= 0 else arcos[~i][::-1]
        pts += a if not pts else a[1:]
    return pts
def centroide(pol):   # [(área, cx, cy)] de cada polígono (solo el anillo exterior)
    A = cx = cy = 0
    for (x0, y0), (x1, y1) in zip(pol, pol[1:] + pol[:1]):
        c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    return abs(A / 2), cx / (3 * A), cy / (3 * A)
geos = {g['id']: g for g in topo['objects']['provinces']['geometries']}
def poligonos(ine):
    g = geos[ine]; ps = [g['arcs']] if g['type'] == 'Polygon' else g['arcs']
    return [centroide(anillo(p[0])) for p in ps if len(anillo(p[0])) >= 4]
def centro_prov(ine):
    ps = poligonos(ine); A = sum(p[0] for p in ps)
    return sum(p[0] * p[1] for p in ps) / A, sum(p[0] * p[2] for p in ps) / A

# --- 1. centro de cada isla, en la proyección ---
real = {}
for p in ISLAS:
    ps = poligonos(INE[p])
    for nombre, _, n in (s for s in SENADO if s[1] == p):
        lon, lat = REF[nombre]; X = lon * LAT0
        a, cx, cy = min(ps, key=lambda q: (q[1] - X) ** 2 + (q[2] - lat) ** 2)
        real[nombre] = (cx, cy)
assert len(set(real.values())) == len(real), 'dos islas con el mismo polígono'

# --- 2. del mapa real al cartograma ---
# Baleares: x = a·X + b, z = −a·Y + c, ajustado con los centros de las provincias peninsulares
INE_PROV = ['02', '03', '04', '01', '33', '05', '06', '07', '08', '48', '09', '10', '11', '39', '12', '13', '14', '15', '16', '20', '17', '18', '19', '21',
            '22', '23', '24', '25', '27', '28', '29', '30', '31', '32', '34', '35', '36', '26', '37', '38', '40', '41', '42', '43', '44', '45', '46', '47',
            '49', '50', '51', '52']   # el mismo orden de PROV que en cartograma.py
pen = [i for i in range(52) if INE_PROV[i] not in ('07', '35', '38', '51', '52')]
P = [centro_prov(INE_PROV[i]) for i in pen]
Q = [(sum(h[0] for h in HEX if h[2] == i) / 4, sum(h[1] for h in HEX if h[2] == i) / 4) for i in pen]
n = len(pen); mX = sum(p[0] for p in P) / n; mY = sum(p[1] for p in P) / n; mx = sum(q[0] for q in Q) / n; mz = sum(q[1] for q in Q) / n
a = (sum((p[0] - mX) * (q[0] - mx) - (p[1] - mY) * (q[1] - mz) for p, q in zip(P, Q)) /
     sum((p[0] - mX) ** 2 + (p[1] - mY) ** 2 for p in P))
al_mapa = lambda X, Y: (mx + a * (X - mX), mz - a * (Y - mY))
resto = math.sqrt(sum((al_mapa(*p)[0] - q[0]) ** 2 + (al_mapa(*p)[1] - q[1]) ** 2 for p, q in zip(P, Q)) / n) / PASO
# Canarias: en el recuadro, al oeste y abajo. Se ajusta a la columna más al oeste y a la fila más baja de la rejilla.
can = [s[0] for s in SENADO if s[1] in ISLAS[1:]]
cX0 = min(real[i][0] for i in can); cY0 = min(real[i][1] for i in can)
# (la columna y la fila más extremas de la rejilla con las que el recuadro, 0,9 pasos más allá, cabe en el escenario;
# no dependen de dónde estaban antes las islas, así que el script da siempre lo mismo)
xmin = min(xz(c, r)[0] for c in range(-10, 30) for r in (0, 1) if xz(c, r)[0] - 0.9 * PASO >= -0.52)
zmax = max(xz(0, r)[1] for r in range(0, 40) if xz(0, r)[1] + 0.9 * PASO <= 0.5)
def al_recuadro(X, Y): return (xmin + 0.25 * PASO + a * ESCALA_CAN * (X - cX0), zmax - 0.25 * PASO - a * ESCALA_CAN * (Y - cY0))
destino = {i: (al_recuadro if i in can else al_mapa)(*real[i]) for i in real}

# --- 3. colocación ---
LIM_X = 0.5 - PASO / 2; LIM_Z0 = -0.46 + PASO / 2; LIM_Z1 = 0.5 - PASO / 2   # que el hexágono entero quepa en el escenario
def dentro(q):
    x, z = xz(*q); return -LIM_X <= x <= LIM_X and LIM_Z0 <= z <= LIM_Z1
def toca(q, celdas): return any(v in celdas for v in vecinos(*q))
def piezas(nombre, n, radio=4):
    """Las colocaciones posibles de una isla: n celdas conexas cerca de su destino, de menor a mayor coste."""
    x0, z0 = destino[nombre]
    cerca = [(c, r) for c in range(-6, 30) for r in range(-2, 30)
             if dentro((c, r)) and (c, r) not in fijas and not toca((c, r), fijas)
             and math.hypot(xz(c, r)[0] - x0, xz(c, r)[1] - z0) <= radio * PASO]
    coste = {q: ((xz(*q)[0] - x0) ** 2 + (xz(*q)[1] - z0) ** 2) / PASO ** 2 for q in cerca}
    grupos = {frozenset([q]) for q in cerca}
    for _ in range(n - 1):
        grupos = {g | {v} for g in grupos for q in g for v in vecinos(*q) if v in coste and v not in g}
    return sorted(((sum(coste[q] for q in g), sorted(g)) for g in grupos), key=lambda t: (t[0], t[1]))
RH = PASO / math.sqrt(3); HOLGURA = 0.5 * PASO
def marco_de(celdas):   # recuadro: 0,9 pasos alrededor de los hexágonos, como en cartograma.py
    cc = [xz(*q) for q in celdas]
    return [round(min(p[0] for p in cc) - 0.9 * PASO, 4), round(min(p[1] for p in cc) - 0.9 * PASO, 4),
            round(max(p[0] for p in cc) + 0.9 * PASO, 4), round(max(p[1] for p in cc) + 0.9 * PASO, 4)]
def marco_cabe(m):   # dentro del escenario (viewBox de js/sitio.js) y a media celda, al menos, de cualquier otro hexágono
    if m[0] < -0.52 or m[2] > 0.52 or m[1] < -0.46 or m[3] > 0.5: return False
    return not any(m[0] - HOLGURA < xz(*q)[0] + PASO / 2 and xz(*q)[0] - PASO / 2 < m[2] + HOLGURA and
                   m[1] - HOLGURA < xz(*q)[1] + RH and xz(*q)[1] - RH < m[3] + HOLGURA for q in fijas)
def coloca(nombres, recuadro=False):
    """La colocación de menor coste de esas islas que cumple las reglas (búsqueda en profundidad con poda).
    recuadro: las islas van en un recuadro, que no puede acercarse a ningún otro hexágono."""
    orden = sorted(nombres, key=lambda i: -dict((s[0], s[2]) for s in SENADO)[i])
    cand = {i: piezas(i, next(s[2] for s in SENADO if s[0] == i)) for i in orden}
    mejor = [math.inf, None]
    minimo = [min(c[0] for c in cand[i]) for i in orden]
    def sigue(k, puesto, total):
        if total + sum(minimo[k:]) >= mejor[0]: return
        if k == len(orden): mejor[0], mejor[1] = total, dict(puesto); return
        i = orden[k]
        for c, g in cand[i]:
            if total + c + sum(minimo[k + 1:]) >= mejor[0]: break
            if any(q in otra or (frozenset((i, j)) not in PEGADAS and toca(q, otra)) for j, otra in puesto.items() for q in g): continue
            if recuadro and not marco_cabe(marco_de([q for o in puesto.values() for q in o] + g)): continue   # el recuadro solo crece
            puesto[i] = set(g); sigue(k + 1, puesto, total + c); del puesto[i]
    sigue(0, {}, 0)
    if mejor[1] is None: raise SystemExit('No caben: ' + ', '.join(nombres))
    return mejor[0], mejor[1]
coste_bal, bal = coloca([s[0] for s in SENADO if s[1] == BALEARES])
coste_can, cana = coloca(can, recuadro=True)
sitio = {**bal, **cana}

marco = marco_de([q for i in can for q in sitio[i]])
assert marco_cabe(marco)

# --- 4. HEX_SEN con la circunscripción ---
idx = {s[0]: k for k, s in enumerate(SENADO)}
circ_prov = {p: idx[next(s[0] for s in SENADO if s[1] == p)] for p in range(52) if p not in ISLAS}
nuevo = [[h[0], h[1], h[2], h[3], h[4], circ_prov[h[2]]] for h in HEX if h[2] not in ISLAS]
for i, celdas in sitio.items():
    p = SENADO[idx[i]][1]
    nuevo += [[round(xz(*q)[0], 4), round(xz(*q)[1], 4), p, q[0], q[1], idx[i]] for q in celdas]
nuevo.sort(key=lambda h: (h[2], h[5], h[0], h[1]) if h[2] not in ISLAS else (h[2], h[5], h[1], h[0]))
assert len(nuevo) == 209 and all(sum(1 for h in nuevo if h[5] == k) == s[2] for k, s in enumerate(SENADO))
assert len({(h[3], h[4]) for h in nuevo}) == 209

CORTO = {'Mallorca': 'MA', 'Menorca': 'ME', 'Ibiza': 'IB', 'Formentera': 'FO', 'Gran Canaria': 'GC', 'Lanzarote': 'LZ',
         'Fuerteventura': 'FV', 'Tenerife': 'TF', 'La Palma': 'LP', 'La Gomera': 'GO', 'El Hierro': 'HI'}
def dibujo(prov):
    hs = [h for h in nuevo if h[2] in prov]; cs = {(h[3], h[4]): h for h in hs}
    c0 = min(h[3] for h in hs) - 2; c1 = max(h[3] for h in hs) + 2; r0 = min(h[4] for h in hs) - 1; r1 = max(h[4] for h in hs) + 1
    lin = []
    for r in range(r0, r1 + 1):
        s = ' ' if r & 1 else ''
        for c in range(c0, c1 + 1):
            h = cs.get((c, r)); s += (CORTO[SENADO[h[5]][0]] if h else ('##' if (c, r) in fijas else ' .')) + '  '
        lin.append(s)
    return '\n'.join(lin)

linea = lambda k, v: 'export const %s = %s;' % (k, json.dumps(v, separators=(',', ':')) if k == 'HEX_SEN' else json.dumps(v))
nuevo_texto = re.sub(r'export const HEX_SEN = \[.*?\];', lambda m: linea('HEX_SEN', nuevo), texto, flags=re.S)
nuevo_texto = re.sub(r'export const CANARIAS_SEN = \[.*?\];', lambda m: linea('CANARIAS_SEN', marco), nuevo_texto)
COMENTARIO = ('// Senado: 209 escaños elegidos, con la misma silueta (hexágonos más grandes). HEX_SEN lleva una columna más: la\n'
              '// circunscripción (índice de SENADO en js/datos.js). En Baleares y Canarias, cada isla en su sitio y, dentro de cada\n'
              '// provincia, los hexágonos van de isla en isla, en el orden de SENADO (herramientas/islas_senado.py).\n')
nuevo_texto = re.sub(r'// Senado: 209 escaños elegidos[^\n]*\n((?!export)//[^\n]*\n)*', COMENTARIO, nuevo_texto)

print('Ajuste de la Península al mapa: escala %.4f, error medio %.2f hexágonos.' % (a, resto))
print('Coste (suma de distancias al cuadrado, en hexágonos): Baleares %.2f, Canarias %.2f.' % (coste_bal, coste_can))
for i in real:
    x0, z0 = destino[i]; cs = [xz(*q) for q in sitio[i]]
    x1, z1 = sum(p[0] for p in cs) / len(cs), sum(p[1] for p in cs) / len(cs)
    print('  %-14s %d  a %.2f hexágonos de su isla' % (i, len(cs), math.hypot(x1 - x0, z1 - z0) / PASO))
print('Recuadro de Canarias:', marco)
if '--dibuja' in sys.argv:
    print(dibujo([BALEARES]) + '\n\n' + dibujo(ISLAS[1:]))
if '--comprueba' in sys.argv:
    if nuevo_texto != texto: raise SystemExit('js/cartograma.js no está al día: py herramientas/islas_senado.py')
    print('js/cartograma.js está al día.')
elif nuevo_texto != texto:
    CARTO.write_text(nuevo_texto, encoding='utf-8', newline=FIN); print('Escrito js/cartograma.js.')
else:
    print('js/cartograma.js ya estaba al día.')
