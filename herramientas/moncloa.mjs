// Genera js/moncloa.js: «LA MONCLOA» escrito con los 350 escaños, para el último paso.
// Uso:  node herramientas/moncloa.mjs
//
// Cada letra es un glifo fijo de hexágonos de punta arriba, calculado una vez en su propia rejilla (centro en x entero,
// primera fila par) a partir de unos trazos rectos, y copiado tal cual: como las copias se desplazan un número entero
// de celdas y un número par de filas, las dos A, las dos O y las dos L salen idénticas. Las letras repetidas llevan un
// trazo algo más grueso que las únicas (M, N, C) para que el total sea exactamente 350. Tu voto va en el centro de la
// primera O de «MONCLOA».
import { writeFileSync } from 'node:fs';

const ALTO = Math.sqrt(3) / 2;   // alto de fila, en anchos de celda
const FILAS = 9, GROSOR = 1.0, GROSOR_UNICAS = 0.95, HUECO = 2, INTERLINEA = 4;
const LINEAS = ['LA', 'MONCLOA'];

// trazos de cada letra: media anchura hw y segmentos (x, t), con t de 0 (arriba) a 1 (abajo)
const TRAZO = {
  L: { hw: 2, s: hw => [[-hw, 0, -hw, 1], [-hw, 1, hw, 1]] },
  A: { hw: 2.6, s: hw => [[-hw, 1, -0.35, 0], [0.35, 0, hw, 1], [-0.35, 0, 0.35, 0], [-hw * 0.62, 0.64, hw * 0.62, 0.64]] },
  M: { hw: 3, s: hw => [[-hw, 1, -hw, 0], [-hw, 0, 0, 0.62], [0, 0.62, hw, 0], [hw, 0, hw, 1]] },
  O: { hw: 2.6, s: hw => [[-hw * 0.45, 0, hw * 0.45, 0], [hw * 0.45, 0, hw, 0.22], [hw, 0.22, hw, 0.78], [hw, 0.78, hw * 0.45, 1], [hw * 0.45, 1, -hw * 0.45, 1], [-hw * 0.45, 1, -hw, 0.78], [-hw, 0.78, -hw, 0.22], [-hw, 0.22, -hw * 0.45, 0]] },
  N: { hw: 2.4, s: hw => [[-hw, 1, -hw, 0], [-hw, 0, hw, 1], [hw, 1, hw, 0]] },
  C: { hw: 2.4, s: hw => [[hw, 0, -hw * 0.45, 0], [-hw * 0.45, 0, -hw, 0.22], [-hw, 0.22, -hw, 0.78], [-hw, 0.78, -hw * 0.45, 1], [-hw * 0.45, 1, hw, 1]] },
};
const dist = (px, py, [ax, ay, bx, by]) => {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
function glifo(ch, g) {
  const { hw, s } = TRAZO[ch], alto = (FILAS - 1) * ALTO, tr = s(hw).map(([a, b, c, d]) => [a, b * alto, c, d * alto]), celdas = [];
  for (let y = 0; y < FILAS; y++) {
    const off = y % 2 ? 0.5 : 0;
    for (let x = -Math.ceil(hw) - 2 + off; x <= hw + 2; x += 1) if (tr.some(t => dist(x, y * ALTO, t) <= g)) celdas.push([x, y]);
  }
  const xs = celdas.map(c => c[0]);
  return { celdas, izq: Math.min(...xs), der: Math.max(...xs) };
}

const veces = {}; LINEAS.join('').split('').forEach(ch => { veces[ch] = (veces[ch] || 0) + 1; });
const cache = {}, g = ch => (cache[ch] ??= glifo(ch, veces[ch] > 1 ? GROSOR : GROSOR_UNICAS));
const celdas = []; let oro = null;
LINEAS.forEach((t, li) => {
  const y0 = li * (FILAS + INTERLINEA + ((FILAS + INTERLINEA) % 2));   // desplazamiento par de filas
  const letras = [...t]; let x = 0; const pos = [];
  for (const ch of letras) { const q = g(ch); x += -q.izq; pos.push(x); x += q.der + HUECO; }
  const centro = Math.round((pos.at(-1) + g(letras.at(-1)).der + pos[0] + g(letras[0]).izq) / 2);
  letras.forEach((ch, i) => {
    const dx = pos[i] - centro;
    for (const [cx, cy] of g(ch).celdas) celdas.push([cx + dx, cy + y0]);
    if (ch === 'O' && !oro && li === LINEAS.length - 1) oro = [dx, y0 + (FILAS - 1) / 2];
  });
});
if (oro[1] % 2) throw new Error('el centro de la O cae en una fila impar');
celdas.push(oro);
if (celdas.length !== 350) throw new Error('salen ' + celdas.length + ' hexágonos, no 350');

// a coordenadas del escenario (viewBox -0.52 -0.46 1.04 0.96): 1,0 de ancho como mucho, centrado un poco por debajo
const pts = celdas.map(([x, y]) => [x, y * ALTO]);   // x ya lleva el medio desplazamiento de las filas impares
const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
const ancho = Math.max(...xs) - Math.min(...xs) + 1, alto = Math.max(...ys) - Math.min(...ys) + 1;
const esc = Math.min(1.0 / ancho, 0.66 / alto), cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
const final = pts.map(([x, y]) => [+((x - cx) * esc).toFixed(4), +((y - cy) * esc + 0.03).toFixed(4)]);
const iOro = final.length - 1;
// orden de izquierda a derecha y de arriba abajo, para que los escaños vuelen del hemiciclo a las letras sin cruzarse
const orden = final.map((p, i) => i).sort((a, b) => final[a][0] - final[b][0] || final[a][1] - final[b][1]);
const salida = orden.map(i => final[i]), oroFinal = orden.indexOf(iOro);

writeFileSync(new URL('../js/moncloa.js', import.meta.url),
  '// Generado por herramientas/moncloa.mjs: no editar a mano.\n' +
  '// «LA MONCLOA» escrito con los 350 escaños (último paso). celdas: centro de cada hexágono en coordenadas del escenario,\n' +
  '// de izquierda a derecha; r: radio; oro: la celda de tu voto, en el centro de la primera O de «MONCLOA».\n' +
  'export const MONCLOA = ' + JSON.stringify({ r: +(esc / Math.sqrt(3) * 0.92).toFixed(5), oro: oroFinal, celdas: salida }) + ';\n');
console.log('js/moncloa.js: 350 hexágonos, radio', (esc / Math.sqrt(3) * 0.92).toFixed(5), 'celda de tu voto', oroFinal);
