"""Convierte un CSV de resultados por circunscripción en js/resultados.js.

Formato del CSV (el mismo que datos/base_23J.csv de Porra Electoral): una fila por circunscripción con
  district, escanos, validos, una columna de votos por partido, OTROS y BLANCO.
  Columnas opcionales: censo, votantes y nulos. Si vienen en todas las filas, la casilla 9 da la participación.

Comprobaciones antes de escribir nada:
  - las 52 circunscripciones, con los mismos nombres que js/datos.js (si no, la web no las encuentra);
  - los escaños de cada una, frente al anexo del Real Decreto 806/2026 (los de js/datos.js). Con --prueba,
    una diferencia solo avisa (los datos del 23J llevan los escaños de 2023); sin --prueba, para el script;
  - que los votos de cada partido, más OTROS y BLANCO, sumen los válidos; y, si hay votantes, que
    válidos más nulos no pasen de votantes ni votantes de censo.
Uso:
  python3 herramientas/resultados.py datos/prueba_23J.csv --escanos escanos_2023 --prueba \
      --etiqueta "Resultados del 23 de julio de 2023" --fuente "Ministerio del Interior, escrutinio del 23J" > js/resultados.js
  python3 herramientas/resultados.py datos/resultados_29N.csv --abierta \
      --etiqueta "Escrutinio provisional del 29 de noviembre de 2026" --fuente "Ministerio del Interior" > js/resultados.js
  Con el escrutinio general (4-dic), además --general: la web deja de decir que los resultados son provisionales.
  Con --senado datos/senado_29N.csv, también los senadores elegidos en las urnas (pasos 9 y 10). Formato y comprobaciones
  en herramientas/senado.py: se para si no cuadran con el Real Decreto 806/2026. Su fuente, la de --fuente o --fuente-senado.
  Las etiquetas y fuentes que la web traduce están en la lista «dato» de cada js/idiomas/xx.js; otra cualquiera sale en castellano.
"""
import argparse, csv, json, re, sys, pathlib

TINTA = '#2B2118'
NEUTRO = '#C9C1B4'   # Senado: candidaturas que no están en META (una agrupación de una sola isla, por ejemplo)
# Orden de izquierda a derecha del hemiciclo y color de cada partido. Orden y colores son provisionales.
META = [('BILDU', 'EH Bildu', '#7C9440', '#fff'), ('ERC', 'ERC', '#D9A62E', TINTA), ('AA', 'Adelante Andalucía', '#3E7C59', '#fff'),
        ('POD', 'Podemos', '#6B4A86', '#fff'), ('FA', 'Frente Amplio', '#B4527A', '#fff'), ('SUMAR', 'Sumar', '#B4527A', '#fff'),
        ('COMP', 'Compromís', '#DE7740', TINTA), ('UPC', 'Unidad del Pueblo Canario', '#BC9FC6', TINTA),
        ('BNG', 'BNG', '#86AFCF', TINTA), ('PSOE', 'PSOE', '#B5382E', '#fff'), ('GBAI', 'Geroa Bai', '#8CCFA4', TINTA), ('PNV', 'PNV', '#2E6B4A', '#fff'),
        ('TE', 'Teruel Existe', '#D98A8F', TINTA), ('SY', 'Soria ¡Ya!', '#8C78C8', TINTA),
        ('CC', 'Coalición Canaria', '#E3CC6B', TINTA), ('JUNTS', 'Junts', '#2A9D97', '#fff'), ('UPN', 'UPN', '#8C5A3C', '#fff'),
        ('SALF', 'SALF', '#8A8378', '#fff'), ('PP', 'PP', '#2F5D8C', '#fff'), ('VOX', 'Vox', '#5F9E3A', '#fff')]
HITOS = [('2026-11-29', '29 nov', 'Votación.'), ('2026-12-04', '4 dic', 'Escrutinio general: el recuento oficial.'),
         ('2026-12-23', '23 dic', 'Se constituyen el Congreso y el Senado.'), (None, 'Sin fecha', 'El Rey consulta a los grupos y propone un candidato.'),
         (None, '1.ª votación', 'Hacen falta 176 síes. Arranca el reloj de dos meses.'), (None, '48 h después', '2.ª votación: más síes que noes.'),
         (None, 'Gobierno', 'El Rey nombra al presidente.')]

a = argparse.ArgumentParser(); a.add_argument('csv'); a.add_argument('--escanos', default='escanos')
a.add_argument('--etiqueta', default=''); a.add_argument('--fuente', default='')
a.add_argument('--prueba', action='store_true'); a.add_argument('--abierta', action='store_true')
a.add_argument('--general', action='store_true', help='escrutinio general (4-dic): los resultados dejan de ser provisionales')
a.add_argument('--senado', help='CSV de senadores elegidos por circunscripción y partido (ver herramientas/senado.py)')
a.add_argument('--fuente-senado', default='', help='fuente de los datos del Senado, si no es la misma que --fuente')
o = a.parse_args()
filas = list(csv.DictReader(open(o.csv, encoding='utf-8')))
assert len(filas) == 52, 'Tiene que haber 52 circunscripciones'
# Escaños del decreto, tal como están en js/datos.js (anexo del Real Decreto 806/2026).
datos = (pathlib.Path(__file__).resolve().parent.parent / 'js' / 'datos.js').read_text(encoding='utf-8')
DECRETO = dict(json.loads(re.search(r'export const PROV = (\[.*?\]);', datos).group(1)))
nombres = [f['district'] for f in filas]
faltan, sobran = sorted(set(DECRETO) - set(nombres)), sorted(set(nombres) - set(DECRETO))
assert not faltan and not sobran, 'Los nombres no coinciden con js/datos.js. Faltan: %s. Sobran: %s' % (faltan, sobran)
fijas = {'district', 'ccaa', 'escanos', 'escanos_2023', 'validos', 'OTROS', 'BLANCO', 'censo', 'votantes', 'nulos'}
cols = [c for c in filas[0] if c not in fijas and not c.startswith('s_')]
desconocidos = [c for c in cols if c not in [m[0] for m in META]]
assert not desconocidos, 'Partidos sin orden ni color en META: %s' % desconocidos
partidos = [m for m in META if m[0] in cols]
num = lambda x: int(round(float(x or 0)))
conCenso = all((f.get('censo') or '').strip() and (f.get('votantes') or '').strip() for f in filas)
prov, avisos = [], []
for f in filas:
    v = [num(f[p[0]]) for p in partidos]; val = num(f['validos']); otros = num(f.get('OTROS')); bl = num(f.get('BLANCO'))
    assert abs(sum(v) + otros + bl - val) <= 1, 'No cuadran los votos válidos en %s' % f['district']
    e = num(f[o.escanos])
    if e != DECRETO[f['district']]:
        msg = '%s: %d escaños en el CSV y %d en el decreto' % (f['district'], e, DECRETO[f['district']])
        assert o.prueba, msg + '. Sin --prueba no se genera nada.'
        avisos.append(msg)
    q = {'n': f['district'], 'e': e, 'val': val, 'bl': bl, 'otros': otros, 'v': v}
    if conCenso:
        q['censo'], q['votantes'], q['nulos'] = num(f['censo']), num(f['votantes']), num(f.get('nulos'))
        assert val + q['nulos'] <= q['votantes'] + 1 and q['votantes'] <= q['censo'], 'No cuadran censo, votantes y nulos en %s' % f['district']
    prov.append(q)
assert sum(p['e'] for p in prov) == 350, 'Los escaños no suman 350'
for m in avisos: print('AVISO (datos de prueba) · ' + m, file=sys.stderr)
if 'general' in o.etiqueta.lower() and not o.general:
    print('AVISO · la etiqueta habla del escrutinio general y falta --general: la web seguirá diciendo que es provisional', file=sys.stderr)
res = {'abierta': o.abierta, 'prueba': o.prueba, 'provisional': not o.general, 'etiqueta': o.etiqueta, 'fuente': o.fuente,
       'partidos': [{'id': p[0], 'nombre': p[1], 'color': p[2], 'tinta': p[3]} for p in partidos],
       'prov': prov, 'hitos': [{'f': h[0], 'r': h[1], 't': h[2]} for h in HITOS]}
if o.senado:
    # Senado: los partidos de META, en su orden y con su color; los demás, con su nombre y un color neutro, detrás.
    import senado
    S = senado.leer(o.senado, prueba=o.prueba)
    for m in S['avisos']: print('AVISO (Senado) · ' + m, file=sys.stderr)
    t = senado.total(S)
    ids = [m[0] for m in META if m[0] in t] + [i for i, _ in t.most_common() if i not in [m[0] for m in META]]
    sp = [dict(zip(('id', 'nombre', 'color', 'tinta'), next((m for m in META if m[0] == i), (i, i, NEUTRO, TINTA))), n=t[i]) for i in ids]
    res['senado'] = {'fuente': o.fuente_senado or o.fuente, 'partidos': sp,
                     'circ': [{'c': c['c'], 'p': c['p'], 'n': c['n'], 'r': [[ids.index(i), n] for i, n in sorted(c['r'].items(), key=lambda x: (-x[1], ids.index(x[0])))]}
                              for c in S['circ']]}
    print('Senado: %d senadores en %d circunscripciones (%s).' % (sum(t.values()), len(S['circ']), ', '.join('%s %d' % (p['id'], p['n']) for p in sp)), file=sys.stderr)
print('// Generado con herramientas/resultados.py. No editar a mano: cambiar el CSV y volver a generar.')
print('// «abierta» abre la fase 2 para todo el mundo; «prueba» avisa de que no son los resultados del 29N;')
print('// «provisional» (hasta el escrutinio general del 4-dic) lo dice en los pasos 9, 10 y 12. «senado», si está: los senadores')
print('// elegidos en las urnas (partidos y, en circ, cada circunscripción con su provincia p y [partido, electos]).')
print('export const RES = ' + json.dumps(res, ensure_ascii=False, separators=(',', ':')) + ';')
