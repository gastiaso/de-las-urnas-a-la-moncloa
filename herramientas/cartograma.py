"""Cartograma de 350 hexágonos, uno por escaño, con la silueta real de España.

Método:
1. La silueta de la Península (límites del IGN, vía es-atlas) se rellena con tantos hexágonos como escaños
   peninsulares (325): se elige el tamaño de hexágono con el que la silueta pasa justo por los centros del borde.
2. Cada celda se asigna a una provincia de modo que cada una reciba exactamente sus escaños (anexo del Real Decreto
   806/2026) y la suma de distancias al cuadrado hasta su centro geográfico sea mínima (asignación con capacidad).
   Las provincias con muchos escaños crecen y empujan a sus vecinas, pero cada una queda en su sitio relativo.
3. Si alguna provincia queda partida, se recompone pasando celdas de borde de provincia en provincia.
4. Baleares, Ceuta y Melilla se colocan en el mar, junto a su posición real; Canarias, en un recuadro al suroeste.

Uso: python3 herramientas/cartograma.py [vista.png] > js/cartograma.js
     y, después, py herramientas/islas_senado.py, que en el Senado coloca Baleares y Canarias isla por isla (sin shapely).
Requiere numpy, scipy y shapely. Geometría: herramientas/geo/provincias-es-atlas.json (IGN, CC BY 4.0, vía es-atlas).
"""
import json, math, sys, os
from collections import defaultdict
import numpy as np
from shapely.geometry import Polygon, MultiPolygon, Point
from shapely.ops import unary_union
from scipy.optimize import linear_sum_assignment

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
PROV = json.loads(open(os.path.join(RAIZ, 'js/datos.js'), encoding='utf-8').read().split('export const PROV = ')[1].split(';')[0])
# Código INE de cada provincia, en el orden de PROV
INE = ['02', '03', '04', '01', '33', '05', '06', '07', '08', '48', '09', '10', '11', '39', '12', '13', '14', '15', '16', '20', '17', '18', '19', '21',
       '22', '23', '24', '25', '27', '28', '29', '30', '31', '32', '34', '35', '36', '26', '37', '38', '40', '41', '42', '43', '44', '45', '46', '47',
       '49', '50', '51', '52']
assert len(INE) == len(PROV) == 52 and sum(p[1] for p in PROV) == 350

# --- TopoJSON mínimo ---
topo = json.load(open(os.path.join(AQUI, 'geo/provincias-es-atlas.json'), encoding='utf-8'))
sc, tr = topo['transform']['scale'], topo['transform']['translate']
LAT0 = math.cos(math.radians(40))   # proyección sencilla: longitud × cos 40°, latitud
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
def poli(p):
    an = [anillo(h) for h in p]; an = [a for a in an if len(a) >= 4]   # la simplificación deja algún anillo degenerado
    return Polygon(an[0], an[1:]) if an and len(an[0]) >= 4 else None
def geom(g):
    ps = [poli(g['arcs'])] if g['type'] == 'Polygon' else [poli(p) for p in g['arcs']]
    return MultiPolygon([p for p in ps if p is not None]).buffer(0)
por_id = {g['id']: geom(g) for g in topo['objects']['provinces']['geometries']}
comunidades = [(g['properties']['name'], geom(g)) for g in topo['objects']['autonomous_regions']['geometries']]
pol = [por_id[c] for c in INE]
NOMBRE_CCAA = {'Cataluña/Catalunya': 'Cataluña', 'País Vasco/Euskadi': 'País Vasco', 'Comunidad Foral de Navarra': 'Navarra',
               'Principado de Asturias': 'Asturias', 'Región de Murcia': 'Murcia', 'Comunidad de Madrid': 'Madrid',
               'Ciudad Autónoma de Ceuta': 'Ceuta', 'Ciudad Autónoma de Melilla': 'Melilla'}
comu = []
for p in pol:
    rp = p.representative_point(); n = next(n for n, g in comunidades if g.contains(rp)); comu.append(NOMBRE_CCAA.get(n, n))

R3 = math.sqrt(3) / 2
def cartograma(ESC, ESCALA_CAN=1.0, AREA=0.0):
    global dueno, ocup, S, OX, OY, minx, miny, maxx, maxy
    FUERA = {'07', '35', '38', '51', '52'}   # Baleares, Canarias, Ceuta y Melilla
    pen = [i for i, c in enumerate(INE) if c not in FUERA]
    peninsula = unary_union([pol[i] for i in pen])
    if peninsula.geom_type == 'MultiPolygon': peninsula = max(peninsula.geoms, key=lambda g: g.area)
    NPEN = sum(ESC[i] for i in pen)

    # --- rejilla: hexágonos con vértice arriba; las filas impares, desplazadas medio paso a la derecha ---
    R3 = math.sqrt(3) / 2
    def vecinos(c, r):
        o = [(1, 0), (-1, 0)] + ([(0, -1), (1, -1), (0, 1), (1, 1)] if r & 1 else [(-1, -1), (0, -1), (-1, 1), (0, 1)])
        return [(c + a, r + b) for a, b in o]
    minx, miny, maxx, maxy = peninsula.bounds
    def centro(c, r, s, ox, oy): return (minx + ox + (c + 0.5 * (r & 1)) * s, maxy + oy - r * s * R3)
    borde = peninsula.boundary
    def rellena(s, ox, oy):
        cand = []
        for r in range(-3, int((maxy - miny) / (s * R3)) + 5):
            for c in range(-3, int((maxx - minx) / s) + 5):
                x, y = centro(c, r, s, ox, oy); p = Point(x, y)
                cand.append((borde.distance(p) * (1 if peninsula.contains(p) else -1), c, r))
        cand.sort(reverse=True)
        return cand[:NPEN], abs(cand[NPEN - 1][0])
    mejor = None
    for s in np.linspace(0.30, 0.42, 25):
        for fx in (0, 1 / 3, 2 / 3):
            for fy in (0, 0.5):
                sel, umbral = rellena(s, fx * s, fy * s * R3)
                if mejor is None or umbral < mejor[0]: mejor = (umbral, s, fx * s, fy * s * R3, sel)
    _, S, OX, OY, sel = mejor
    xy = lambda c, r: centro(c, r, S, OX, OY)
    celdas = [(c, r) for _, c, r in sel]

    # --- asignación con capacidad ---
    cen = [p.centroid for p in pol]
    def coste(i, c, r):
        x, y = xy(c, r); d = ((x - cen[i].x) ** 2 + (y - cen[i].y) ** 2) / S ** 2
        # AREA > 0: pesa también la distancia a la provincia real (útil cuando los escaños se parecen a la superficie)
        return d if not AREA else 0.25 * d + AREA * (pol[i].distance(Point(x, y)) / S) ** 2
    huecos = [i for i in pen for _ in range(ESC[i])]
    M = np.array([[coste(i, c, r) for i in huecos] for c, r in celdas])
    fi, co = linear_sum_assignment(M)
    dueno = {celdas[a]: huecos[b] for a, b in zip(fi, co)}

    # --- provincias partidas: se recomponen ---
    def piezas(i):
        cs = {q for q, j in dueno.items() if j == i}; out = []
        while cs:
            q = cs.pop(); comp = {q}; pila = [q]
            while pila:
                for n in vecinos(*pila.pop()):
                    if n in cs: cs.remove(n); comp.add(n); pila.append(n)
            out.append(comp)
        return sorted(out, key=len, reverse=True)
    def conexa_sin(i, q):
        cs = {x for x, j in dueno.items() if j == i and x != q}
        if not cs: return False
        a = next(iter(cs)); vis = {a}; pila = [a]
        while pila:
            for n in vecinos(*pila.pop()):
                if n in cs and n not in vis: vis.add(n); pila.append(n)
        return len(vis) == len(cs)
    def recompone():
        for vuelta in range(200):
            rotas = [i for i in set(dueno.values()) if len(piezas(i)) > 1]
            if not rotas: return
            p = rotas[0]; ps = piezas(p); principal = ps[0]
            g = min(ps[-1], key=lambda q: min(coste(dueno[n], *q) for n in vecinos(*q) if n in dueno and dueno[n] != p) if any(n in dueno and dueno[n] != p for n in vecinos(*q)) else 1e9)
            qs = [dueno[n] for n in vecinos(*g) if n in dueno and dueno[n] != p]
            q = min(qs, key=lambda j: coste(j, *g)); dueno[g] = q
            # cadena: de q hacia p, cada provincia cede una celda de borde a la siguiente
            prev = {q: None}; cola = [q]; paso = {}
            while cola and p not in prev:
                a = cola.pop(0)
                for x in [x for x, j in dueno.items() if j == a]:
                    for n in vecinos(*x):
                        b = dueno.get(n)
                        if b is None or b == a or b in prev: continue
                        if b == p and n not in principal: continue
                        if not conexa_sin(a, x): continue
                        d = coste(b, *x) - coste(a, *x)
                        if (a, b) not in paso or d < paso[(a, b)][0]: paso[(a, b)] = (d, x)
                for (a2, b), _ in sorted(paso.items(), key=lambda kv: kv[1][0]):
                    if a2 == a and b not in prev: prev[b] = a; cola.append(b)
            b = p
            while prev[b] is not None:
                a = prev[b]; dueno[paso[(a, b)][1]] = b; b = a
        raise SystemExit('No se pudo recomponer')
    recompone()

    # --- Baleares, Ceuta y Melilla: en el mar, cerca de su sitio y separadas de la costa ---
    ocup = set(dueno)
    def junto_costa(q): return any(n in ocup for n in vecinos(*q))
    def libre(q): return q not in ocup and not junto_costa(q)
    def a_celda(x, y):
        r = round((maxy + OY - y) / (S * R3)); c = round((x - minx - OX) / S - 0.5 * (r & 1)); return c, r
    def racimo(i, x, y, n, cerca=4):
        c0, r0 = a_celda(x, y)
        cand = [(c, r) for c in range(c0 - cerca - 3, c0 + cerca + 4) for r in range(r0 - cerca - 3, r0 + cerca + 4) if libre((c, r))]
        sem = min(cand, key=lambda q: (xy(*q)[0] - x) ** 2 + (xy(*q)[1] - y) ** 2); grupo = [sem]
        while len(grupo) < n:   # crece pegado a lo ya puesto, hacia el punto de destino
            bord = {m for q in grupo for m in vecinos(*q) if m not in grupo and libre(m)}
            grupo.append(min(bord, key=lambda q: (xy(*q)[0] - x) ** 2 + (xy(*q)[1] - y) ** 2))
        for q in grupo: dueno[q] = i
        ocup.update(grupo)
    i_bal, i_ceu, i_mel, i_lp, i_tf = (INE.index(c) for c in ('07', '51', '52', '35', '38'))
    b = cen[i_bal]; racimo(i_bal, b.x, b.y, ESC[i_bal])
    for i in (i_ceu, i_mel): racimo(i, cen[i].x, cen[i].y, ESC[i])

    # --- Canarias: recuadro al suroeste de la Península; Santa Cruz de Tenerife al oeste, Las Palmas al este ---
    cx = minx + 0.3 * S; cy = cen[i_ceu].y - 1.3 * S
    racimo(i_tf, cx, cy, ESC[i_tf])
    racimo(i_lp, cx + 3.7 * S * ESCALA_CAN, cy, ESC[i_lp])
    canarias = [q for q, j in dueno.items() if j in (i_lp, i_tf)]

    # --- tonos por comunidad: colores alternos para que dos comunidades vecinas no coincidan ---
    nombres = sorted(set(comu)); adj = defaultdict(set)
    for q, i in dueno.items():
        for n in vecinos(*q):
            j = dueno.get(n)
            if j is not None and comu[j] != comu[i]: adj[comu[i]].add(comu[j])
    tono = {}; NT = 5; uso = [0] * NT
    for n in sorted(nombres, key=lambda n: (-len(adj[n]), n)):   # el tono permitido menos usado, para repartirlos
        usados = {tono[m] for m in adj[n] if m in tono}; t = min((t for t in range(NT) if t not in usados), key=lambda t: (uso[t], t))
        tono[n] = t; uso[t] += 1

    # --- salida: coordenadas normalizadas como en la versión anterior (x hacia el este, z hacia el sur) ---
    pts = {q: xy(*q) for q in dueno}
    xs = [p[0] for p in pts.values()]; ys = [p[1] for p in pts.values()]
    mx, my = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    span = max(max(xs) - min(xs), max(ys) - min(ys)) + S
    orden = sorted(dueno.items(), key=lambda kv: (kv[1], pts[kv[0]][0], -pts[kv[0]][1]))
    HEX = [[round((pts[q][0] - mx) / span, 4), round(-(pts[q][1] - my) / span, 4), i, q[0], q[1]] for q, i in orden]
    assert all(len(piezas(i)) == 1 for i in pen), 'provincia partida'
    assert len(HEX) == sum(ESC) and all(sum(1 for h in HEX if h[2] == i) == ESC[i] for i in range(52))
    cxs = [pts[q][0] for q in canarias]; cys = [pts[q][1] for q in canarias]
    marco = [round((min(cxs) - S * 0.9 - mx) / span, 4), round(-(max(cys) + S * 0.9 - my) / span, 4),
             round((max(cxs) + S * 0.9 - mx) / span, 4), round(-(min(cys) - S * 0.9 - my) / span, 4)]
    return dict(S=S, span=span, HEX=HEX, marco=marco, comu=comu, tono=tono, nombres=nombres, vecinos=vecinos)

# Congreso: escaños del Real Decreto 806/2026. Senado: cuatro por provincia peninsular; en las islas, uno por isla y tres
# en Gran Canaria, Mallorca y Tenerife (Ibiza y Formentera, por separado desde mayo de 2026); dos en Ceuta y dos en Melilla.
# LOREG, art. 165; Constitución, art. 69. Total: 209.
CON = cartograma([p[1] for p in PROV])
SEN_ESC = [4] * 52
for c, n in (('07', 6), ('35', 5), ('38', 6), ('51', 2), ('52', 2)): SEN_ESC[INE.index(c)] = n
assert sum(SEN_ESC) == 209
SENADO = cartograma(SEN_ESC, 0.85, AREA=4.0)
CCAA = sorted(CON['nombres']); comu = CON['comu']; tono = CON['tono']
print('// Generado con herramientas/cartograma.py: un hexágono por escaño, con la silueta de España.')
print('// HEX: [x, z, provincia (índice de PROV), columna, fila]; x y z van de -0,5 a 0,5 (x hacia el este, z hacia el sur).')
print('// Filas impares desplazadas medio paso a la derecha. Dentro de cada provincia, ordenados de oeste a este.')
print('export const PASO = %.4f;' % (CON['S'] / CON['span']))
print('export const HEX = ' + json.dumps(CON['HEX'], separators=(',', ':')) + ';')
print('// Recuadro de Canarias: [x0, z0, x1, z1].')
print('export const CANARIAS = ' + json.dumps(CON['marco']) + ';')
print('// Senado: 209 escaños elegidos, con la misma silueta (hexágonos más grandes).')
print('export const PASO_SEN = %.4f;' % (SENADO['S'] / SENADO['span']))
print('export const HEX_SEN = ' + json.dumps(SENADO['HEX'], separators=(',', ':')) + ';')
print('export const CANARIAS_SEN = ' + json.dumps(SENADO['marco']) + ';')
print('// Comunidad de cada provincia (índice de CCAA) y tono de cada comunidad (0 a %d), distinto del de sus vecinas.' % max(tono.values()))
print('export const CCAA = ' + json.dumps(CCAA, ensure_ascii=False) + ';')
print('export const COMUNIDAD = ' + json.dumps([CCAA.index(c) for c in comu]) + ';')
print('export const TONO = ' + json.dumps([tono[c] for c in CCAA]) + ';')

def vista(R, nombre):
    from PIL import Image, ImageDraw
    HEX, S, span, marco, vecinos = R['HEX'], R['S'], R['span'], R['marco'], R['vecinos']
    W = 1000; k = W / 1.0; im = Image.new('RGB', (W, W), '#E4E2DC'); dr = ImageDraw.Draw(im)
    pal = ['#F5F3EE', '#E6D6B4', '#D9D5CB', '#C9D1BE', '#E9D2C8', '#CFC0A6', '#D7DCE0', '#EFE7D6']
    P = lambda x, z: (W / 2 + x * k * 0.96, W / 2 + z * k * 0.96)
    rr = S / span / math.sqrt(3) * k * 0.96
    pos = {(h[3], h[4]): h for h in HEX}
    for h in HEX:
        X, Y = P(h[0], h[1])
        dr.polygon([(X + rr * math.cos(math.radians(60 * j - 30)), Y + rr * math.sin(math.radians(60 * j - 30))) for j in range(6)], fill=pal[tono[comu[h[2]]]], outline='#9a917f')
    for h in HEX:
        X, Y = P(h[0], h[1])
        for n in vecinos(h[3], h[4]):
            q = pos.get(n)
            if q and q[2] == h[2]: continue
            dc, dr_ = n[0] - h[3], n[1] - h[4]
            nx = h[0] + (dc + 0.5 * ((n[1] & 1) - (h[4] & 1))) * S / span; nz = h[1] + dr_ * S / span * R3
            Xn, Yn = P(nx, nz); mxp, myp = (X + Xn) / 2, (Y + Yn) / 2; a = math.atan2(Yn - Y, Xn - X) + math.pi / 2
            w = 4 if not q or comu[q[2]] != comu[h[2]] else 2
            dr.line([(mxp + rr / 2 * math.cos(a), myp + rr / 2 * math.sin(a)), (mxp - rr / 2 * math.cos(a), myp - rr / 2 * math.sin(a))], fill='#2B2118', width=w)
    x0, z0, x1, z1 = marco; dr.rectangle([P(x0, z0), P(x1, z1)], outline='#2B2118', width=2)
    for i, p in enumerate(PROV):
        q = [h for h in HEX if h[2] == i]; X, Y = P(sum(h[0] for h in q) / len(q), sum(h[1] for h in q) / len(q))
        dr.text((X - 10, Y - 6), p[0][:3], fill='#2B2118')
    im.save(nombre)
if len(sys.argv) > 1:
    vista(CON, sys.argv[1]); vista(SENADO, sys.argv[1].replace('.png', '-senado.png'))
