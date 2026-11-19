"""Genera la página de cada idioma (ca/, va/, gl/, eu/, en/) a partir de index.html.

El castellano se sigue escribiendo en index.html. Cada idioma tiene dos archivos:
  idiomas/xx.txt      los textos de la página: cada frase en castellano («es:») y, debajo, su traducción («xx:»)
  js/idiomas/xx.js    los textos que pone el JavaScript (las mismas entradas que js/textos.js)

Uso:
  py herramientas/idiomas.py                 genera todas las páginas
  py herramientas/idiomas.py en ca           solo esas
  py herramientas/idiomas.py --comprueba     no escribe nada: dice qué falta y qué páginas están sin regenerar
  py herramientas/idiomas.py --avisos        además, lista las traducciones cuyas cifras, enlaces o términos de
                                             glosario no coinciden con los del castellano
  py herramientas/idiomas.py --nuevo xx      crea idiomas/xx.txt con todas las frases por traducir

Si a un idioma le falta una frase (porque se ha añadido o cambiado en index.html), su página sale con esa frase en
castellano, la frase se apunta al final de idiomas/xx.txt para traducirla y el script termina con error.

Formato de idiomas/xx.txt (bloques separados por una línea en blanco; las líneas con # son comentarios):
  es: frase tal como está en index.html
  xx: traducción
Dentro de una frase:
  [[escano|escaños]]     palabra del glosario: se traduce solo lo que va detrás de la barra
  [texto](https://…)     enlace: se traduce solo el texto
  <b>…</b>, <small>…</small> y las demás etiquetas se dejan como están
Traducciones especiales:
  xx: [quitar]           el párrafo no sale en ese idioma; si es el título de un cajón, no sale el cajón entero
  xx: una parte ¶ otra   el párrafo se parte en dos
Cajones que solo existen en un idioma:
  +cajón después de: título del cajón en castellano        (o «+cajón antes de:»)
  título: …
  p: …                   (tantas líneas «p:» como párrafos)
  nota: …
"""
import datetime, difflib, html, pathlib, re, sys
from collections import Counter
from html.parser import HTMLParser

RAIZ = pathlib.Path(__file__).resolve().parent.parent
URL = 'https://gastiaso.github.io/de-las-urnas-a-la-moncloa/'
# carpeta, etiqueta del idioma, nombre en la lista y og:locale. El castellano es la raíz y no se genera.
LENGUAS = [('es', 'es', 'Castellano', 'es_ES'), ('ca', 'ca', 'Català', 'ca_ES'), ('va', 'ca-valencia', 'Valencià', 'ca_ES'),
           ('gl', 'gl', 'Galego', 'gl_ES'), ('eu', 'eu', 'Euskara', 'eu_ES'), ('en', 'en', 'English', 'en_GB')]
VACIOS = {'meta', 'link', 'br', 'input', 'img', 'hr', 'source', 'wbr', 'area', 'base', 'col', 'embed', 'track'}
# etiquetas que pueden llevar texto directamente; si aparece texto suelto en otra (un div, una sección), el script para
FRASE = {'title', 'p', 'summary', 'h1', 'h2', 'h3', 'h4', 'label', 'legend', 'button', 'li', 'span', 'a', 'b', 'i', 'strong', 'em',
         'small', 'dt', 'dd', 'th', 'td', 'caption', 'figcaption', 'option', 'output'}
ATRIBUTOS = ('aria-label', 'title', 'alt', 'placeholder')
META = ('description', 'og:site_name', 'og:title', 'og:description', 'og:image:alt')
QUITAR = '[quitar]'
LETRAS = re.compile(r'[A-Za-zÀ-ÿ]')


class Nodo:
    def __init__(self, tag, attrs, ini, ini_fin, padre):
        self.tag, self.attrs, self.ini, self.ini_fin, self.padre = tag, attrs, ini, ini_fin, padre
        self.fin_ini = self.fin = ini_fin; self.hijos = []; self.texto = False


class Arbol(HTMLParser):
    """Lee el HTML y apunta dónde empieza y acaba cada elemento en el archivo, para sustituir solo el texto."""
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src; self.lineas = [0] + [m.end() for m in re.finditer('\n', src)]
        self.raiz = Nodo('#raiz', {}, 0, 0, None); self.pila = [self.raiz]
        self.feed(src); self.close()
        assert len(self.pila) == 1, 'Quedan etiquetas sin cerrar: %s' % [n.tag for n in self.pila[1:]]
    def pos(self):
        linea, col = self.getpos(); return self.lineas[linea - 1] + col
    def handle_starttag(self, tag, attrs):
        ini = self.pos(); n = Nodo(tag, dict(attrs), ini, ini + len(self.get_starttag_text()), self.pila[-1])
        self.pila[-1].hijos.append(n)
        if tag not in VACIOS: self.pila.append(n)
    def handle_startendtag(self, tag, attrs):
        ini = self.pos(); self.pila[-1].hijos.append(Nodo(tag, dict(attrs), ini, ini + len(self.get_starttag_text()), self.pila[-1]))
    def handle_endtag(self, tag):
        if tag in VACIOS: return
        n = self.pila.pop()
        assert n.tag == tag, 'Se cierra </%s> pero estaba abierta <%s> (carácter %d)' % (tag, n.tag, self.pos())
        n.fin_ini = self.pos(); n.fin = self.src.index('>', n.fin_ini) + 1
    def handle_data(self, d):
        if d.strip() and self.pila[-1].tag not in ('script', 'style'): self.pila[-1].texto = True
    def handle_entityref(self, name): self.pila[-1].texto = True
    def handle_charref(self, name): self.pila[-1].texto = True


def simplifica(h):
    """El HTML de dentro de un párrafo, en la forma corta en que se escribe en idiomas/xx.txt."""
    h = re.sub(r'\s+', ' ', h).strip()
    h = re.sub(r'<button type="button" class="glos" data-g="(\w+)">(.*?)</button>', r'[[\1|\2]]', h)
    return re.sub(r'<a href="([^"]+)">(.*?)</a>', r'[\2](\1)', h)

def despliega(t):
    t = re.sub(r'\[\[(\w+)\|(.*?)\]\]', r'<button type="button" class="glos" data-g="\1">\2</button>', t)
    return re.sub(r'\[([^\]\[]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', t)


class Pagina:
    def __init__(self, src):
        self.src = src; self.arbol = Arbol(src)
        self.frases = []     # (nodo, clave): cada elemento con texto, de fuera adentro
        self.atributos = []  # (nodo, atributo, valor)
        self.cajones = {}    # título en castellano -> nodo <details>
        self.contexto = {}   # clave -> rótulo de la sección en la que aparece por primera vez
        self.seccion = 'Cabecera: título y descripción para buscadores y redes'
        self.recorre(self.arbol.raiz)
        for n, clave in self.frases:
            dentro = re.sub(r'\s+', ' ', src[n.ini_fin:n.fin_ini]).strip()
            assert despliega(clave) == dentro, 'No sé escribir de forma corta este párrafo:\n  %s' % dentro
    def recorre(self, n):
        for h in n.hijos:
            if h.tag in ('script', 'style'): continue
            for a in ATRIBUTOS:
                if LETRAS.search(h.attrs.get(a) or ''): self.atributos.append((h, a, h.attrs[a])); self.contexto.setdefault(h.attrs[a], self.seccion)
            if h.tag == 'meta' and (h.attrs.get('name') in META or h.attrs.get('property') in META):
                self.atributos.append((h, 'content', h.attrs['content'])); self.contexto.setdefault(h.attrs['content'], self.seccion)
            if h.attrs.get('translate') == 'no': continue
            if h.texto:
                if h.tag not in FRASE: sys.exit('Hay texto suelto dentro de <%s> (carácter %d de index.html): tiene que ir en un párrafo.' % (h.tag, h.ini))
                clave = simplifica(self.src[h.ini_fin:h.fin_ini])
                if h.tag in ('h1', 'h2') and h.padre.tag != 'header': self.seccion = re.sub(r'<[^>]+>', '', clave)
                if h.tag == 'b' and h.padre.tag == 'header': self.seccion = 'Barra de arriba y salida'
                if h.padre.tag == 'footer' or (h.padre.padre and h.padre.padre.tag == 'footer'): self.seccion = 'Pie de página'
                if LETRAS.search(re.sub(r'<[^>]+>', '', clave)):
                    self.frases.append((h, clave)); self.contexto.setdefault(clave, self.seccion)
                    if h.tag == 'summary' and h.padre.tag == 'details': self.cajones[clave] = h.padre
            else: self.recorre(h)
    def claves(self):
        vistas, orden = set(), []
        for c in [v for _, _, v in self.atributos if _ == 'content'] + [c for _, c in self.frases] + [v for _, a, v in self.atributos if a != 'content']:
            if c not in vistas: vistas.add(c); orden.append(c)
        return orden


def lee(cod):
    """idiomas/xx.txt -> (traducciones, pendientes ya apuntadas, cajones propios)"""
    f = RAIZ / 'idiomas' / (cod + '.txt')
    if not f.exists(): sys.exit('No existe %s. Para crearlo: py herramientas/idiomas.py --nuevo %s' % (f, cod))
    trad, pend, cajones = {}, set(), []
    for n, bloque in enumerate(re.split(r'\n\s*\n', f.read_text(encoding='utf-8').replace('\r\n', '\n'))):
        lineas = [l for l in bloque.split('\n') if l.strip() and not l.lstrip().startswith('#')]
        if not lineas: continue
        if lineas[0].startswith('+cajón'):
            m = re.match(r'\+cajón (antes|después) de: (.+)$', lineas[0].strip())
            c = {'donde': m and m.group(1), 'ancla': m and m.group(2).strip(), 'p': [], 'nota': '', 'titulo': ''}
            for l in lineas[1:]:
                k, _, v = l.partition(':'); k, v = k.strip(), v.strip()
                if k == 'título': c['titulo'] = v
                elif k == 'p': c['p'].append(v)
                elif k == 'nota': c['nota'] = v
                else: sys.exit('%s: no entiendo «%s» dentro de un +cajón' % (f.name, l))
            if not m or not c['titulo'] or not c['p']: sys.exit('%s: +cajón mal escrito:\n%s' % (f.name, bloque))
            cajones.append(c); continue
        if len(lineas) != 2 or not lineas[0].startswith('es: ') or not lineas[1].startswith(cod + ':'):
            sys.exit('%s, bloque %d: tiene que ser una línea «es: …» y otra «%s: …»:\n%s' % (f.name, n + 1, cod, bloque))
        es, t = lineas[0][4:].strip(), lineas[1][len(cod) + 1:].strip()
        if es in trad and trad[es] != t: sys.exit('%s: la misma frase tiene dos traducciones distintas:\n  %s' % (f.name, es))
        if t: trad[es] = t
        else: pend.add(es)
    return trad, pend, cajones


def cifras(t): return Counter(re.sub(r'[.,\s  ]', '', x) for x in re.findall(r'\d(?:[\d.,  ]*\d)?', re.sub(r'\]\([^)]*\)', ']', t)))

def revisa(es, t):
    """Diferencias que conviene mirar entre una frase y su traducción (no son errores por fuerza)."""
    if t == QUITAR: return []
    a = []
    if cifras(es) != cifras(t): a.append('cifras: %s / %s' % (' '.join(sorted(cifras(es) - cifras(t))) or '—', ' '.join(sorted(cifras(t) - cifras(es))) or '—'))
    for nombre, patron in (('glosario', r'\[\[(\w+)\|'), ('enlaces', r'\]\(([^)]+)\)'), ('etiquetas', r'<(/?\w+)')):
        if Counter(re.findall(patron, es)) != Counter(re.findall(patron, t)): a.append(nombre)
    return a


def genera(pag, cod, trad, cajones):
    """Devuelve (html de la página, frases sin traducir, avisos)."""
    src, bcp, _, locale = pag.src, *next(l for l in LENGUAS if l[0] == cod)[1:]
    faltan, avisos, cambios, quitados = [], [], [], []
    def t(clave):
        if clave not in trad:
            if clave not in faltan: faltan.append(clave)
            return clave
        r = revisa(clave, trad[clave])
        if r and (clave, r) not in avisos: avisos.append((clave, r))
        return trad[clave]
    for n, clave in pag.frases:
        x = t(clave); abre, cierra = src[n.ini:n.ini_fin], src[n.fin_ini:n.fin]
        if x == QUITAR:
            q = n.padre if n.tag == 'summary' and n.padre.tag == 'details' else n
            fin = q.fin + (1 if src[q.fin:q.fin + 1] == '\n' else 0)
            quitados.append((q.ini, fin)); cambios.append((q.ini, fin, '')); continue
        partes = [despliega(p.strip()) for p in x.split('¶')]
        sin_id = re.sub(r' id="[^"]*"', '', abre)
        cambios.append((n.ini, n.fin, abre + partes[0] + cierra + ''.join('\n' + sin_id + p + cierra for p in partes[1:])))
    # atributos con texto (aria-label, descripción…): se cambia el valor dentro de la etiqueta de apertura
    por_nodo = {}
    for n, a, v in pag.atributos: por_nodo.setdefault(n, []).append((a, v))
    for n, lista in por_nodo.items():
        abre = src[n.ini:n.ini_fin]
        for a, v in lista:
            viejo = '%s="%s"' % (a, v); assert viejo in abre, 'No encuentro %s en %s' % (viejo, abre)
            abre = abre.replace(viejo, '%s="%s"' % (a, html.escape(t(v), quote=True).replace('&#x27;', "'")))
        # si el elemento es además una frase, su cambio ya incluye la etiqueta de apertura: se retoca ese
        for i, (ini, fin, txt) in enumerate(cambios):
            if ini == n.ini and txt: cambios[i] = (ini, fin, abre + txt[n.ini_fin - n.ini:]); break
        else: cambios.append((n.ini, n.ini_fin, abre))
    # cajones propios del idioma
    for c in cajones:
        if c['ancla'] not in pag.cajones: sys.exit('idiomas/%s.txt: el +cajón «%s» se apoya en un cajón que no existe: «%s»' % (cod, c['titulo'], c['ancla']))
        d = pag.cajones[c['ancla']]
        h = '<details><summary>%s</summary>\n%s\n%s</details>' % (despliega(c['titulo']), '\n'.join('<p>%s</p>' % despliega(p) for p in c['p']),
                                                               ('<p class="nota">%s</p>\n' % despliega(c['nota'])) if c['nota'] else '')
        cambios.append((d.ini, d.ini, h + '\n') if c['donde'] == 'antes' else (d.fin, d.fin, '\n' + h))
    # la lista de idiomas, con el actual marcado
    nav = next((n for n in todos(pag.arbol.raiz) if n.tag == 'nav' and 'idiomas' in (n.attrs.get('class') or '')), None)
    if not nav: sys.exit('index.html no tiene <nav class="idiomas">')
    cambios.append((nav.ini_fin, nav.fin_ini, '\n' + ''.join('<a href="../%s" lang="%s" hreflang="%s"%s>%s</a>\n' % (
        '' if c == 'es' else c + '/', b, b, ' aria-current="page"' if c == cod else '', nombre) for c, b, nombre, _ in LENGUAS)))
    # se aplican de atrás adelante; lo que cae dentro de un cajón quitado, se salta
    fuera = lambda ini, fin: any(a <= ini and fin <= b and (a, b) != (ini, fin) for a, b in quitados)
    orden = sorted([c for c in cambios if not fuera(c[0], c[1])], key=lambda c: (c[0], c[1]), reverse=True)
    for i in range(len(orden) - 1): assert orden[i + 1][1] <= orden[i][0], 'Dos cambios se pisan: %r y %r' % (orden[i + 1], orden[i])
    out = src
    for ini, fin, txt in orden: out = out[:ini] + txt + out[fin:]
    # lo que cambia en todas las páginas: idioma, direcciones y la carga de los textos del JavaScript
    def una(patron, nuevo, s):
        s2, k = re.subn(patron, nuevo, s, count=1); assert k == 1, 'No encuentro %s en index.html' % patron; return s2
    out = una(r'<html lang="es">', '<html lang="%s">' % bcp, out)
    out = una(r'<!DOCTYPE html>\n', '<!DOCTYPE html>\n<!-- Generado con herramientas/idiomas.py a partir de index.html, idiomas/%s.txt y js/idiomas/%s.js. No editar a mano. -->\n' % (cod, cod), out)
    out = una(r'(<link rel="canonical" href=")[^"]*"', r'\g<1>%s%s/"' % (URL, cod), out)
    out = una(r'(<meta property="og:url" content=")[^"]*"', r'\g<1>%s%s/"' % (URL, cod), out)
    out = una(r'(<meta property="og:locale" content=")[^"]*"', r'\g<1>%s"' % locale, out)
    out = una(r'<script type="module" src="js/sitio\.js"></script>', "<script type=\"module\">import '../js/idiomas/%s.js'; import '../js/sitio.js';</script>" % cod, out)
    out = re.sub(r'\b(href|src)="(?!https?:|#|mailto:|data:|/|\.\./)([^"]*)"', lambda m: '%s="../%s"' % (m.group(1), '' if m.group(2) == './' else m.group(2)), out)
    return out, faltan, avisos

def todos(n):
    for h in n.hijos:
        yield h; yield from todos(h)


def plantilla(pag, cod, trad=None):
    """El archivo de un idioma con todas las frases, en el orden de la página y con el nombre de cada sección."""
    o = ['# %s · textos de la página. Formato y uso: ver herramientas/idiomas.py' % cod,
         '# Cada bloque es una frase de index.html («es:») y su traducción («%s:»). No cambies la línea «es:».' % cod, '']
    sec = None
    for c in pag.claves():
        if pag.contexto[c] != sec: sec = pag.contexto[c]; o += ['# ───── %s ─────' % sec, '']
        o += ['es: ' + c, '%s: %s' % (cod, (trad or {}).get(c, '')), '']
    return '\n'.join(o)


def main():
    sys.stdout.reconfigure(errors='replace')   # la consola de Windows no siempre sabe escribir todos los caracteres
    args = sys.argv[1:]
    op = {a for a in args if a.startswith('--')}; cods = [a for a in args if not a.startswith('--')]
    pag = Pagina((RAIZ / 'index.html').read_text(encoding='utf-8').replace('\r\n', '\n'))
    if '--nuevo' in op:
        for cod in cods:
            f = RAIZ / 'idiomas' / (cod + '.txt')
            if f.exists(): sys.exit('%s ya existe' % f)
            f.parent.mkdir(exist_ok=True); f.write_text(plantilla(pag, cod), encoding='utf-8', newline='\n')
            print('Creado %s: %d frases' % (f.relative_to(RAIZ), len(pag.claves())))
        return
    mal = False
    for cod in cods or [l[0] for l in LENGUAS if l[0] != 'es']:
        if cod not in [l[0] for l in LENGUAS] or cod == 'es': sys.exit('Idioma desconocido: %s' % cod)
        trad, pend, cajones = lee(cod)
        out, faltan, avisos = genera(pag, cod, trad, cajones)
        claves = set(pag.claves()); sobran = [c for c in trad if c not in claves]
        destino = RAIZ / cod / 'index.html'
        viejo = destino.read_text(encoding='utf-8').replace('\r\n', '\n') if destino.exists() else None
        js = (RAIZ / 'js' / 'idiomas' / (cod + '.js')).exists()
        estado = 'al día' if viejo == out else 'SIN REGENERAR' if '--comprueba' in op else 'escrita'
        print('%s  %s · %d frases · faltan %d · sobran %d · avisos %d%s' % (cod, estado, len(claves), len(faltan), len(sobran), len(avisos), '' if js else ' · FALTA js/idiomas/%s.js' % cod))
        for c in faltan: print('   falta: ' + c[:110])
        for c in sobran: print('   sobra (ya no está en index.html): ' + c[:90])
        if '--avisos' in op:
            for c, r in avisos: print('   mirar [%s]: %s' % ('; '.join(r), c[:100]))
        if faltan or not js or (estado == 'SIN REGENERAR'): mal = True
        if '--comprueba' in op: continue
        destino.parent.mkdir(exist_ok=True); destino.write_text(out, encoding='utf-8', newline='\n')
        nuevas = [c for c in faltan if c not in pend]
        if nuevas:   # se apuntan al final del archivo, con la traducción de la frase a la que más se parecen
            o = ['', '# ───── PENDIENTE: frases nuevas o cambiadas en index.html (apuntadas el %s) ─────' % datetime.date.today().isoformat(), '']
            for c in nuevas:
                parecida = difflib.get_close_matches(c, sobran, n=1, cutoff=0.6)
                if parecida: o += ['# antes decía: ' + parecida[0], '# y estaba traducida así: ' + trad[parecida[0]]]
                o += ['es: ' + c, cod + ':', '']
            with open(RAIZ / 'idiomas' / (cod + '.txt'), 'a', encoding='utf-8', newline='\n') as f: f.write('\n'.join(o))
    if mal: sys.exit(1)

if __name__ == '__main__': main()
