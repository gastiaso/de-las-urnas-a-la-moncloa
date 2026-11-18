# De las urnas a la Moncloa

Sitio didáctico sobre las elecciones generales del 29 de noviembre de 2026: qué se vota, cómo se convierten los votos en escaños y cómo se llega a un Gobierno. El texto va a un lado y, al otro, un escenario con los 350 escaños del Congreso, uno por hexágono, que cambian de forma en cada paso: mapa de provincias, reparto de tu provincia, habitantes por escaño, Senado, hemiciclo y pactos. Tu voto es el hexágono dorado y se sigue de principio a fin.

## Cómo verlo en local

Hace falta servir la carpeta por HTTP (los módulos de JavaScript no cargan abriendo el archivo directamente):

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000`. No hay paso de compilación ni dependencias que instalar. Todo se sirve desde el propio sitio: las fuentes no se piden a servidores externos y no hay cookies ni analítica.

## Cómo se recorre

- Al entrar, una montaña de sobres con la tapa: nombre, instrucciones y «Clica aquí para empezar». Al pulsarlo, cada sobre vuela a su sitio y se convierte en un hexágono del mapa. Solo se ve una vez por pestaña, y se salta si se llega con una combinación compartida (`?p6=…`).
- Primero se elige la provincia en la que se vota (en el desplegable o tocándola en el mapa). Cada paso trae una frase sobre esa provincia.
- Bajando por la página: en cada paso, los 350 hexágonos cambian de forma. En escritorio, el escenario va a la derecha; en el móvil, arriba.
- El hexágono dorado es tu voto: está en tu provincia, en el reparto, en el Senado y en el hemiciclo. En los pactos de la fase 1 queda aparte, porque el bloque en el que estaría depende de a quién se vote. En la fase 2 marca el primer escaño de tu provincia, que es del partido más votado allí.
- En los pactos, cada escaño lleva el color de su partido y los partidos se juntan en tres bloques: sí, abstención y no. La raya del 176 dice si sale a la primera.
- El menú «Paso X de 8» de la barra salta a cualquier paso; al final de cada paso, el botón «Siguiente» lleva al que sigue y deja el foco en su título.
- «Ver solo el texto» (en el menú, en la portada y en el primer Tab) quita el escenario.
- Sin JavaScript se ve el texto completo, sin escenario ni juegos.

## El mapa de hexágonos

Un hexágono por escaño: cada provincia ocupa tantos como diputados elige, dentro de la silueta real de la Península. Lo genera `herramientas/cartograma.py`:

1. Rellena la silueta peninsular con 325 hexágonos (los escaños peninsulares), con el tamaño con el que el borde pasa justo por los centros.
2. Reparte las celdas entre provincias con una asignación con capacidad: cada una recibe exactamente sus escaños y la suma de distancias al cuadrado hasta su centro geográfico es mínima. Si alguna queda partida, se recompone.
3. Coloca Baleares, Ceuta y Melilla en el mar, junto a su posición real, y Canarias en un recuadro.

Hace lo mismo con los 209 senadores elegidos (cuatro por provincia; en las islas, según la isla), para el paso del Senado. Requiere `numpy`, `scipy` y `shapely`: `python3 herramientas/cartograma.py > js/cartograma.js` (con un nombre de archivo `.png` como argumento, dibuja además una vista previa).

## Las dos fases

- **Fase 1 (pasos 1 a 8):** las reglas. Es lo que se ve por defecto.
- **Fase 2 (pasos 9 a 13 y «La Moncloa»):** los resultados. Está construida pero cerrada. Para verla antes de tiempo, añadir `#fase2` a la dirección: enseña los resultados del 23 de julio de 2023 como datos de prueba, con un aviso.

Para abrir la fase 2 con los resultados del 29N:

```bash
# 1. Dejar los votos por circunscripción en datos/resultados_29N.csv, con el mismo formato que datos/prueba_23J.csv
# 2. Generar el archivo de resultados y abrir la fase para todo el mundo
python3 herramientas/resultados.py datos/resultados_29N.csv --abierta \
    --etiqueta "escrutinio provisional del 29 de noviembre de 2026" --fuente "Ministerio del Interior" > js/resultados.js
```

Los escaños no se copian de ningún sitio: se calculan en el navegador con los votos de cada provincia. Con los datos del 23J, el cálculo reproduce los 350 escaños de 2023.

`resultados.py` comprueba antes de escribir nada que estén las 52 circunscripciones con los nombres de `js/datos.js`, que sus escaños coincidan con el decreto y que cuadren los votos. Si el CSV trae `censo`, `votantes` y `nulos`, el paso 9 da la participación.

Las calculadoras de pactos se pueden compartir: la combinación va en la dirección (`?p6=PSOE:s,PNV:a` para el paso 6, `?p12=` para el 12).

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Todo el texto del sitio, paso por paso |
| `css/estilo.css` | Estilos: recorrido, escenario, portada, juegos y modo «solo texto» |
| `js/sitio.js` | El recorrido: escenario de los 350 hexágonos, tu voto, portada de sobres, menú y navegación |
| `js/contenido.js` | Juegos y calculadoras de los pasos (glosario, provincia, apuesta, Senado, pactos, resultados) |
| `js/mapa.js` | Geometría y dibujo del mapa de hexágonos |
| `js/hemiciclo.js` | Posiciones de los 350 asientos del hemiciclo |
| `js/fichas.js` | Iconos de cada paso, con el estilo del mapa |
| `js/datos.js` | Escaños por provincia, población, partidos de ejemplo, estimación de la calculadora, colores de los partidos, glosario |
| `js/dhondt.js` | Reparto D'Hondt con barrera del 3 % y cálculo del último escaño |
| `js/resultados.js` | Resultados para la fase 2 (generado) |
| `js/cartograma.js` | Posición de los 350 hexágonos del Congreso y los 209 del Senado (generado) |
| `herramientas/cartograma.py` | Genera `js/cartograma.js` a partir de `herramientas/geo/provincias-es-atlas.json` |
| `herramientas/resultados.py` | Convierte el CSV de resultados en `js/resultados.js` |
| `herramientas/guion.py` | Genera `docs/guion.md` desde `index.html` |
| `fuentes/` | Courier Prime y Libre Franklin en woff2 (licencia OFL) |
| `img/` | Imagen para compartir (1200 × 630), favicon e icono |
| `datos/prueba_23J.csv` | Resultados del 23J por circunscripción, copiados de Porra Electoral |
| `docs/guion.md` | El texto del sitio con la fuente de cada cajón (generado) |

Tras cambiar un texto en `index.html`, regenerar el guion: `python3 herramientas/guion.py > docs/guion.md`.

## Datos y fuentes

- Escaños por circunscripción: anexo del Real Decreto 806/2026 (BOE-A-2026-20742).
- Población por circunscripción (habitantes por escaño, paso 3): Real Decreto 1117/2025, cifras oficiales del padrón a 1 de enero de 2025 (BOE-A-2025-25362). Con ellas, la regla del art. 162 de la LOREG reproduce el anexo del decreto.
- Reglas: Constitución, LOREG, Reglamento del Congreso, Real Decreto 605/1999 y Ley 50/1997. El artículo de cada una está en `docs/guion.md`.
- Calculadora de pactos: escaños calculados por [Porra Electoral](https://gastiaso.github.io/porra-electoral/) a partir de las últimas encuestas, hasta el 8 de noviembre de 2026. Es una estimación, no un resultado.
- Los partidos A a E y los nombres de la papeleta del Senado son inventados.
- Datos de prueba de la fase 2: escrutinio del 23 de julio de 2023 (Ministerio del Interior), tal como están reunidos en Porra Electoral.
- Límites provinciales para el mapa de hexágonos: Instituto Geográfico Nacional (líneas límite), licencia CC BY 4.0, en la versión TopoJSON de [es-atlas](https://github.com/martgnz/es-atlas) (licencia MIT). Solo se usan para colocar los hexágonos.
- Colores de los partidos: los habituales, algo apagados; provisionales.

## Licencias

- Código: MIT (ver `LICENSE`).
- Textos del sitio (`index.html`, `docs/guion.md`): CC BY 4.0.
- Tipografías Courier Prime y Libre Franklin: SIL Open Font License (ver `fuentes/`).

## Pendiente

- Congelar la estimación de la calculadora antes de la veda y cambiarla por el resultado el 30N.
- Orden y colores definitivos de los partidos (`js/datos.js` y `herramientas/resultados.py`).
- Los metadatos para compartir apuntan a `https://gastiaso.github.io/de-las-urnas-a-la-moncloa/`: si el repositorio se llama distinto, cambiar `og:url`, `og:image` y `canonical` en `index.html`.
