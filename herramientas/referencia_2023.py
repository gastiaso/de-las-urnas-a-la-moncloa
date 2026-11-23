"""Genera js/referencia_2023.js: los escaños de las generales del 23 de julio de 2023, por provincia y partido, para
compararlos con los del 29N en el paso 9 («Frente a 2023»). Se genera una vez y no cambia.

Los escaños se calculan con el mismo reparto que usa la web (js/dhondt.js, a través de Node) a partir de los votos de
datos/prueba_23J.csv y de los escaños que repartía cada provincia en 2023 (columna escanos_2023). Antes de escribir
nada, el script comprueba que el total de cada partido es el de CONGRESO_2023 en js/datos.js, que es el proclamado por
la Junta Electoral Central (BOE-A-2023-18907), y que suman 350.
Cotejado además provincia a provincia con el fichero oficial del Ministerio del Interior (02202307_TOTA.zip, registros
08 de electos) el 23-nov-2026: coinciden las 52.

Uso, desde la raíz del repositorio (necesita Node, como herramientas/guion.py):
  py herramientas/referencia_2023.py
Escribe el archivo directamente en UTF-8: no hace falta «>», que en PowerShell estropea los acentos.
"""
import csv, json, pathlib, subprocess, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CSV = RAIZ / 'datos' / 'prueba_23J.csv'
SALIDA = RAIZ / 'js' / 'referencia_2023.js'

# Partidos con escaño en 2023: id (el de herramientas/resultados.py y js/equivalencias.js) y nombre, como en
# CONGRESO_2023. El PSOE incluye al PSC (en el BOE van aparte: PSOE 102 y PSC-PSOE 19). Sumar es la coalición de 2023.
PARTIDOS = [('PP', 'PP'), ('PSOE', 'PSOE'), ('VOX', 'Vox'), ('SUMAR', 'Sumar'), ('ERC', 'ERC'), ('JUNTS', 'Junts'),
            ('BILDU', 'EH Bildu'), ('PNV', 'PNV'), ('BNG', 'BNG'), ('CC', 'Coalición Canaria'), ('UPN', 'UPN')]

filas = {f['district']: f for f in csv.DictReader(open(CSV, encoding='utf-8'))}
num = lambda x: int(round(float(x or 0)))
# El reparto, con el código de la web (js/dhondt.js, reparto(escaños, votos, válidos)); los nombres de las provincias y
# CONGRESO_2023, de js/datos.js.
js = ("import { reparto } from './js/dhondt.js'; import { PROV, CONGRESO_2023 } from './js/datos.js'; let s = '';"
      " process.stdin.on('data', d => { s += d; }).on('end', () => { const f = JSON.parse(s);"
      " console.log(JSON.stringify({ prov: PROV, oficial: CONGRESO_2023.partidos,"
      "  seats: PROV.map(p => { const x = f[p[0]]; return x ? reparto(x.e, x.votos, x.val).seats : null; }) })); });")
entrada = {n: {'e': num(f['escanos_2023']), 'val': num(f['validos']), 'votos': [{'id': p[0], 'v': num(f[p[0]])} for p in PARTIDOS]}
           for n, f in filas.items()}
r = json.loads(subprocess.run(['node', '--input-type=module', '-e', js], input=json.dumps(entrada), cwd=RAIZ,
                              capture_output=True, text=True, check=True, encoding='utf-8').stdout)
decreto = dict(r['prov'])
assert sorted(decreto) == sorted(filas), 'Los nombres de datos/prueba_23J.csv no coinciden con js/datos.js'

prov = []
for (n, _), s in zip(r['prov'], r['seats']):
    v = [s[p[0]] for p in PARTIDOS]
    assert sum(v) == entrada[n]['e'], '%s: el reparto da %d escaños y la provincia tenía %d' % (n, sum(v), entrada[n]['e'])
    prov.append({'n': n, 'e': entrada[n]['e'], 's': v})
assert sum(p['e'] for p in prov) == 350, 'Los escaños de 2023 no suman 350'
total = {p[1]: sum(q['s'][i] for q in prov) for i, p in enumerate(PARTIDOS)}
oficial = {x[1]: x[2] for x in r['oficial']}
assert total == oficial, 'El reparto no reproduce CONGRESO_2023 (js/datos.js): %s' % {k: (total.get(k), oficial.get(k)) for k in set(total) | set(oficial) if total.get(k) != oficial.get(k)}
# Las provincias que el 29N reparten otro número de escaños (anexo del Real Decreto 806/2026, en js/datos.js)
cambian = {p['n']: (p['e'], decreto[p['n']]) for p in prov if p['e'] != decreto[p['n']]}
assert cambian == {'Cádiz': (9, 8), 'Madrid': (37, 38)}, 'Cambian otras provincias: %s. Corregir el comentario de abajo y el cajón «Cómo se compara con 2023»' % cambian
print('Comprobado: el reparto reproduce los 350 escaños de 2023, partido a partido. Cambian de escaños: %s.' % cambian, file=sys.stderr)

ref = {'partidos': [{'id': p[0], 'nombre': p[1], 'esc': total[p[1]]} for p in PARTIDOS], 'prov': prov}
SALIDA.write_text('// Generado con herramientas/referencia_2023.py a partir de datos/prueba_23J.csv. No editar a mano.\n'
                  '// Escaños de las generales del 23 de julio de 2023 (Junta Electoral Central, BOE-A-2023-18907): por partido\n'
                  '// (partidos[].esc) y por provincia (prov[].s, en el orden de partidos). prov[].e son los escaños que repartía\n'
                  '// cada provincia en 2023; el 29N, Cádiz reparte 8 (antes 9) y Madrid 38 (antes 37).\n'
                  'export const REF2023 = ' + json.dumps(ref, ensure_ascii=False, separators=(',', ':')) + ';\n',
                  encoding='utf-8', newline='\n')
print('Escrito %s' % SALIDA.relative_to(RAIZ), file=sys.stderr)
