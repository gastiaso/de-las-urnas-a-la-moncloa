"""Genera docs/guion.md a partir de index.html y del glosario de js/datos.js, para que el guion
y el sitio no se separen nunca. Uso: python3 herramientas/guion.py > docs/guion.md   (necesita Node para leer el glosario)
"""
import json, re, subprocess, sys
from html.parser import HTMLParser

class Lector(HTMLParser):
    def __init__(self):
        super().__init__(); self.secs = []; self.pila = []; self.txt = None; self.cls = ''; self.nos = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('noscript', 'footer'): self.nos = True
        if self.nos: return   # el aviso para navegadores sin JavaScript no es parte del guion
        if tag == 'section': self.secs.append({'k': int(a.get('data-k', -1)), 'f2': 'f2' in a.get('class', ''), 'titulo': '', 'riel': [], 'mas': []})
        if not self.secs: return
        if tag == 'details': self.secs[-1]['mas'].append({'t': '', 'p': [], 'f': []}); self.pila.append('details')
        if tag in ('h1', 'h2', 'summary', 'p', 'li'): self.txt = []; self.cls = a.get('class', ''); self.tag = tag
        if tag == 'br' and self.txt is not None: self.txt.append(' ')
    def handle_endtag(self, tag):
        if tag in ('noscript', 'footer'): self.nos = False; return
        if self.nos: return
        if not self.secs: return
        if tag == 'details' and self.pila: self.pila.pop()
        if self.txt is not None and tag == getattr(self, 'tag', None):
            t = re.sub(r'\s+', ' ', ''.join(self.txt)).strip(); self.txt = None; s = self.secs[-1]
            if not t: return
            if tag in ('h1', 'h2'): s['titulo'] = t
            elif tag == 'summary': s['mas'][-1]['t'] = t
            elif self.pila: (s['mas'][-1]['f'] if 'nota' in self.cls else s['mas'][-1]['p']).append(t)
            elif not any(c in self.cls for c in ('aviso', 'prueba', 'leyenda')): s['riel'].append(('· ' if tag == 'li' else '') + t)
    def handle_data(self, d):
        if self.txt is not None: self.txt.append(d)

html = open('index.html', encoding='utf-8').read()
html = re.sub(r'<details class="formatos">.*?</details>', '', html, flags=re.S)   # selector de formatos de prueba: no es contenido
# Calendario de la casilla 7: cada hito sale como «fecha — qué pasa: explicación (fuente)».
html = re.sub(r'<li class="fase">(.*?)</li>', r'<li>\1</li>', html)
html = re.sub(r'<li class="hito[^"]*"><button[^>]*>(.*?)</button><span class="que">(.*?)</span><span class="tip"[^>]*>(.*?) <small>(.*?)</small></span></li>', r'<li>\1 — \2: \3 (\4)</li>', html)
L = Lector(); L.feed(html)
glos = json.loads(subprocess.run(['node', '--input-type=module', '-e', "import {GLOS} from './js/datos.js'; console.log(JSON.stringify(GLOS))"], capture_output=True, text=True, check=True).stdout)
o = ['# Guion · De las urnas a la Moncloa', '',
     'Generado desde `index.html` con `herramientas/guion.py`: es, palabra por palabra, el texto que lleva el sitio.',
     'Cada cajón «saber más» lleva al final sus fuentes. Los textos que dependen de los datos (provincia elegida, resultados) se rellenan solos y aquí aparecen vacíos.', '']
fase = None
for s in L.secs:
    f = 'Fase 2 · los resultados (cerrada hasta el 30N)' if s['f2'] else 'Fase 1 · las reglas'
    if f != fase: o += ['# ' + f, '']; fase = f
    o += ['## ' + (s['titulo'] if s['k'] else 'Salida · ' + s['titulo']), '']
    if s['riel']: o += ['**Riel:**', ''] + [r if r.startswith('· ') else r for r in s['riel']] + ['']
    for m in s['mas']:
        if m['t'] == 'Glosario completo': continue
        o += ['**Saber más: ' + m['t'] + '**', ''] + m['p'] + (['', '_' + ' '.join(m['f']) + '_'] if m['f'] else []) + ['']
o += ['# Glosario', '']
for g in sorted(glos.values(), key=lambda g: g[0].lower()): o.append('- **%s.** %s' % (g[0], g[1]))
cajones = sum(len([m for m in s['mas'] if m['t'] != 'Glosario completo']) for s in L.secs)
palabras = sum(len(' '.join(m['p']).split()) for s in L.secs for m in s['mas'])
o += ['', '# Recuento', '', '- Cajones «saber más»: %d (%d palabras).' % (cajones, palabras), '- Términos de glosario: %d.' % len(glos)]
print('\n'.join(o))
