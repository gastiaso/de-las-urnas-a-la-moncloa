// El mapa de hexágonos (uno por escaño): geometría y dibujo en canvas o en SVG.
// Los datos salen de js/cartograma.js (herramientas/cartograma.py). Coordenadas de -0,5 a 0,5: x hacia el este, z hacia el sur.
import { HEX, PASO, CANARIAS, HEX_SEN, PASO_SEN, CANARIAS_SEN, CCAA, COMUNIDAD, TONO } from './cartograma.js';

export const INK = '#2B2118', TEJA = '#9C3D25', PAPEL = '#F5F3EE';
// Un tono claro por comunidad; dos comunidades vecinas nunca comparten tono.
export const TONOS = ['#F5F3EE', '#E6D6B4', '#D9D5CB', '#D2D9C4', '#EAD6CB'];
export const tonoProv = i => TONOS[TONO[COMUNIDAD[i]]];
export { CCAA, COMUNIDAD };

// Vecino en la dirección d (0 este, 1 sureste, 2 suroeste, 3 oeste, 4 noroeste, 5 noreste); filas impares desplazadas a la derecha.
function vecino(c, r, d) {
  const o = r & 1;
  return [[c + 1, r], o ? [c + 1, r + 1] : [c, r + 1], o ? [c, r + 1] : [c - 1, r + 1], [c - 1, r], o ? [c, r - 1] : [c - 1, r - 1], o ? [c + 1, r - 1] : [c, r - 1]][d];
}
const RAD = Math.PI / 180;

// Geometría de una de las dos capas: Congreso (350) o Senado (209 elegidos).
const cache = {};
export function geometria(sen) {
  const k = sen ? 's' : 'c'; if (cache[k]) return cache[k];
  const H = sen ? HEX_SEN : HEX, P = sen ? PASO_SEN : PASO, R = P / Math.sqrt(3);
  const idx = new Map(H.map((h, i) => [h[3] + ',' + h[4], i]));
  const costa = [], ccaa = [], prov = [];
  H.forEach((h, i) => {
    for (let d = 0; d < 6; d++) {
      const [c, r] = vecino(h[3], h[4], d), j = idx.get(c + ',' + r);
      const a1 = (60 * d - 30) * RAD, a2 = (60 * d + 30) * RAD;
      const s = [h[0] + R * Math.cos(a1), h[1] + R * Math.sin(a1), h[0] + R * Math.cos(a2), h[1] + R * Math.sin(a2)];
      if (j === undefined) costa.push(s);
      else if (j > i && H[j][2] !== h[2]) (COMUNIDAD[H[j][2]] !== COMUNIDAD[h[2]] ? ccaa : prov).push(s);
    }
  });
  const suma = {}; H.forEach(h => { const s = suma[h[2]] = suma[h[2]] || [0, 0, 0]; s[0] += h[0]; s[1] += h[1]; s[2]++; });
  const centro = Object.keys(suma).sort((a, b) => a - b).map(i => [suma[i][0] / suma[i][2], suma[i][1] / suma[i][2]]);
  return (cache[k] = { H, P, R, costa, ccaa, prov, centro, marco: sen ? CANARIAS_SEN : CANARIAS });
}

// Contorno de un hexágono con vértice arriba, centrado en (x, z), de radio r.
export function vertices(x, z, r) { const v = []; for (let k = 0; k < 6; k++) { const a = (60 * k - 90) * RAD; v.push([x + r * Math.cos(a), z + r * Math.sin(a)]); } return v; }
export function hexD(x, z, r, n = 2) { return 'M' + vertices(x, z, r).map(p => p[0].toFixed(n) + ' ' + p[1].toFixed(n)).join('L') + 'Z'; }

/* Canvas: dibuja el mapa en un cuadrado de W px (con un margen) sobre fondo transparente.
   color(i) da el color del hexágono i; hueco: separación entre hexágonos, en fracción del radio. */
export function dibuja(ctx, W, { sen = false, color = i => tonoProv(geometria(sen).H[i][2]), hueco = 0.1, margen = 0.02, grosor = 1 } = {}) {
  const g = geometria(sen), k = W * (1 - 2 * margen), X = x => W / 2 + x * k, Z = z => W / 2 + z * k, r = g.R * k;
  ctx.save();
  // fondo bajo los hexágonos: el color del papel con un borde, para que la silueta se lea entera
  g.H.forEach((h, i) => {
    ctx.beginPath(); vertices(X(h[0]), Z(h[1]), r * (1 - hueco)).forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath(); ctx.fillStyle = color(i); ctx.fill();
  });
  const raya = (segs, w) => { ctx.lineWidth = w; ctx.beginPath(); segs.forEach(s => { ctx.moveTo(X(s[0]), Z(s[1])); ctx.lineTo(X(s[2]), Z(s[3])); }); ctx.stroke(); };
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  raya(g.prov, 1.4 * grosor * W / 1024); raya(g.ccaa, 2.6 * grosor * W / 1024); raya(g.costa, 3.4 * grosor * W / 1024);
  const [x0, z0, x1, z1] = g.marco; ctx.lineWidth = 2 * grosor * W / 1024; ctx.setLineDash([10 * W / 1024, 7 * W / 1024]);
  ctx.strokeRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k); ctx.setLineDash([]);
  ctx.restore();
}

/* SVG: el mapa como texto SVG, en un viewBox de -0,5 a 0,5. Cada hexágono es un <path class="h" data-i data-p>. */
export function svg({ sen = false, color = i => tonoProv(geometria(sen).H[i][2]), hueco = 0.1, clase = 'mapa', titulo = '' } = {}) {
  const g = geometria(sen), r = g.R * (1 - hueco);
  const hs = g.H.map((h, i) => '<path class="h" data-i="' + i + '" data-p="' + h[2] + '" fill="' + color(i) + '" d="' + hexD(h[0], h[1], r, 4) + '"/>').join('');
  const raya = (segs, c) => '<path class="' + c + '" d="' + segs.map(s => 'M' + s[0].toFixed(4) + ' ' + s[1].toFixed(4) + 'L' + s[2].toFixed(4) + ' ' + s[3].toFixed(4)).join('') + '"/>';
  const [x0, z0, x1, z1] = g.marco;
  return '<svg class="' + clase + '" viewBox="-0.5 -0.5 1 1" role="img"' + (titulo ? ' aria-label="' + titulo + '"' : ' aria-hidden="true"') + '>' +
    '<g class="hs">' + hs + '</g><g class="bordes" fill="none" stroke="' + INK + '" stroke-linecap="round">' +
    raya(g.prov, 'b-prov') + raya(g.ccaa, 'b-ccaa') + raya(g.costa, 'b-costa') +
    '<rect class="b-marco" x="' + x0 + '" y="' + z0 + '" width="' + (x1 - x0).toFixed(4) + '" height="' + (z1 - z0).toFixed(4) + '"/></g></svg>';
}
// Estilos de las rayas del SVG (grosor en unidades del viewBox, que mide 1 de ancho).
export const SVG_CSS = '.mapa .b-prov{stroke-width:.0016}.mapa .b-ccaa{stroke-width:.0032}.mapa .b-costa{stroke-width:.0042}.mapa .b-marco{stroke-width:.0022;stroke-dasharray:.01 .007}';
