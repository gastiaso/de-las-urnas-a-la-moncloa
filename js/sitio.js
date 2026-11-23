// De las urnas a la Moncloa: el texto a un lado y, al otro, un escenario con los 350 escaños del Congreso, que cambian
// de forma en cada paso (mapa, reparto de tu provincia, habitantes por escaño, Senado, hemiciclo, pactos).
// Tu voto es el hexágono dorado: se sigue de principio a fin. Al entrar, una montaña de sobres se convierte en el mapa.
import { PROV, PART, CONGRESO_2023, COLOR_PARTIDO } from './datos.js';
import { T } from './textos.js';
import { contenido, FASE2 } from './contenido.js';
import { dhondt } from './dhondt.js';
import { HEX, HEX_SEN } from './cartograma.js';
import { geometria, tonoProv, hexD, TEJA } from './mapa.js';
import { hemi } from './hemiciclo.js';
import { ICONO } from './fichas.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calma = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const GRIS = '#D2CDC2', ORO = '#E0A526';
const anuncio = $('#anuncio'); let tA = 0;
function anuncia(t) { clearTimeout(tA); anuncio.textContent = ''; tA = setTimeout(() => { anuncio.textContent = t; }, 60); }
const enLectura = () => document.body.classList.contains('lectura');
const secs = $$('.paso').filter(s => FASE2 || !s.classList.contains('f2'));
const casilla = s => +s.dataset.k, ULTIMA = FASE2 ? 13 : 8;

/* ---------- el escenario ---------- */
const gC = geometria(false), gS = geometria(true);
const porProvC = {}, porProvS = {};
HEX.forEach((h, i) => (porProvC[h[2]] = porProvC[h[2]] || []).push(i));
HEX_SEN.forEach((h, i) => (porProvS[h[2]] = porProvS[h[2]] || []).push(i));
// Piezas: por provincia, tantas como el máximo entre sus escaños del Congreso y del Senado.
const piezas = [];
PROV.forEach((_, p) => { const n = Math.max(porProvC[p].length, porProvS[p].length); for (let j = 0; j < n; j++) piezas.push({ p, j, c: porProvC[p][j], s: porProvS[p][j] }); });
// Asiento en el hemiciclo: de oeste a este en el mapa, de izquierda a derecha en el hemiciclo.
const HM = hemi(350), conC = piezas.filter(q => q.c !== undefined).sort((a, b) => HEX[a.c][0] - HEX[b.c][0] || HEX[a.c][1] - HEX[b.c][1]);
conC.forEach((q, i) => { q.asiento = i; });
const HX = 0, HY = 0.2, HS = 0.48;   // el hemiciclo, en coordenadas del escenario
const enHemi = i => ({ x: HX + HM[i].x * HS, y: HY + HM[i].z * HS });

const esc = document.createElement('div'); esc.className = 'escenario';
esc.setAttribute('role', 'img'); esc.setAttribute('aria-label', T.ariaEscenario);
const SOBRE = '<path class="sobre" d="M-1.25 -0.85 H1.25 V0.85 H-1.25 Z"/><path class="sobre-solapa" d="M-1.2 -0.8 L0 0.15 L1.2 -0.8"/>';
esc.innerHTML = '<p class="rotulo"></p><svg viewBox="-0.52 -0.46 1.04 0.96"><g class="piezas">' +
  piezas.map(() => '<g class="p"><g class="env">' + SOBRE + '</g><path class="hx" d="' + hexD(0, 0, 1, 3) + '"/></g>').join('') +
  '</g><g class="hemi-guia" opacity="0"><path class="raya176" d="M0 ' + (HY - HS * 1.03).toFixed(3) + ' V' + (HY - HS * 0.3).toFixed(3) + '"/><text class="t176" x="0" y="' + (HY - HS * 1.06).toFixed(3) + '">176</text></g>' +
  '<g class="tuyo"><path d="' + hexD(0, 0, 1, 3) + '"/><circle r=".3"/></g></svg><span class="marca" hidden>' + T.tuVoto + '</span><p class="pie-escenario"></p>';
document.body.appendChild(esc);
const svgEl = $('svg', esc), gs = $$('.piezas > .p', esc), rotulo = $('.rotulo', esc), pieEsc = $('.pie-escenario', esc);
const tuyo = $('.tuyo', esc), marca = $('.marca', esc), guia = $('.hemi-guia', esc);
guia.insertAdjacentHTML('afterend', '<g class="hemi-rot"></g>'); const rotHemi = $('.hemi-rot', esc);   // rótulos de los pactos (ver rotulaHemi)
piezas.forEach((q, i) => { q.el = gs[i]; q.hx = $('.hx', gs[i]); q.env = $('.env', gs[i]); q.cur = { x: 0, y: 0, r: 0, o: 0, a: 0, e: 0 }; q.el.dataset.p = q.p; q.env.style.opacity = 0; });
// Bordes de provincia y de comunidad, costa y recuadro de Canarias (las rayas que calcula mapa.js), encima de las piezas.
// Solo se ven en los mapas, y cuando las piezas ya han llegado a su sitio (ver aplica).
const raya = s => s.map(q => 'M' + q[0].toFixed(4) + ' ' + q[1].toFixed(4) + 'L' + q[2].toFixed(4) + ' ' + q[3].toFixed(4)).join('');
const bordes = (g, c) => { const [x0, z0, x1, z1] = g.marco; return '<g class="bordes ' + c + '"><path class="b-prov" d="' + raya(g.prov) + '"/><path class="b-ccaa" d="' + raya(g.ccaa) + '"/><path class="b-costa" d="' + raya(g.costa) + '"/><rect class="b-marco" x="' + x0 + '" y="' + z0 + '" width="' + (x1 - x0).toFixed(4) + '" height="' + (z1 - z0).toFixed(4) + '"/></g>'; };
$('.piezas', esc).insertAdjacentHTML('afterend', bordes(gC, 'bc') + bordes(gS, 'bs'));
const bordesC = $('.bc', esc), bordesS = $('.bs', esc);

let C = null, k = 0, revelado = null, pacto6 = null, pacto12 = null, res = null, provRes = null, listo = false;
const sel = () => C ? C.st.prov : 0;
const R0 = gC.R * 0.92, RS = gS.R * 0.92;
const agrupa = cols => { const n = {}; cols.forEach(c => { n[c] = (n[c] || 0) + 1; }); return Object.keys(n).sort((a, b) => n[b] - n[a]).flatMap(c => Array(n[c]).fill(c)); };
const ESC_HAB = ['#7A2A16', '#9C3D25', '#C9773F', '#E2B77A', '#F1E2C2'];

/* Pactos: cada asiento lleva el color de su partido; los partidos se agrupan en sí, abstención y no, por ese orden
   y, dentro de cada grupo, de izquierda a derecha. Devuelve, para cada asiento base, su nuevo sitio y su color. */
function bloques(estado, partidos, color) {
  const base = []; partidos.forEach(p => { for (let i = 0; i < p[2]; i++) base.push(p); });
  const orden = ['si', 'abs', 'no'], sitio = new Array(base.length); let n = 0;
  const cuenta = { si: 0, abs: 0, no: 0 };
  orden.forEach(e => partidos.forEach(p => {
    if ((estado[p[0]] || 'no') !== e) return;
    cuenta[e] += p[2];
    base.forEach((b, i) => { if (b === p) sitio[i] = n++; });
  }));
  return { sitio, color: base.map(p => color(p)), partido: base.map(p => p[0]), cuenta };
}
/* Pactos: «Sí», «Abst.» y «No» bajo la base del hemiciclo, cada uno a la altura de su bloque, y, en escritorio, el nombre de
   los partidos con 15 escaños o más en el centro de sus asientos. Así el hemiciclo no se lee solo por el color. */
function rotulaHemi(b) {
  if (!b) { rotHemi.innerHTML = ''; return; }
  const xs = []; let ini = 0;
  ['si', 'abs', 'no'].forEach(e => { const n = b.cuenta[e]; if (n) xs.push([e, HX + Math.cos(HM[Math.floor(ini + n / 2)].t) * HS * 0.62]); ini += n; });
  for (let i = 1; i < xs.length; i++) xs[i][1] = Math.max(xs[i][1], xs[i - 1][1] + 0.15);   // que no se pisen
  const sobra = xs.length ? xs[xs.length - 1][1] - 0.42 : 0; if (sobra > 0) xs.forEach(x => { x[1] -= sobra; });
  let h = xs.map(([e, x]) => '<text class="r-bloque" x="' + x.toFixed(3) + '" y="' + (HY + 0.055).toFixed(3) + '">' + T.voto[e] + '</text>').join('');
  if (innerWidth >= 900) {
    const cen = {}; b.partido.forEach((p, i) => { const q = enHemi(b.sitio[i]), c = cen[p] = cen[p] || { x: 0, y: 0, n: 0 }; c.x += q.x; c.y += q.y; c.n++; });
    h += Object.entries(cen).filter(([, c]) => c.n >= 15).map(([p, c]) => '<text class="r-partido" x="' + (c.x / c.n).toFixed(3) + '" y="' + (c.y / c.n + 0.008).toFixed(3) + '">' + p + '</text>').join('');
  }
  rotHemi.innerHTML = h;
}

// destino de cada pieza: posición (x, y), radio r, opacidad o, giro a, sobre e (1 = sobre, 0 = hexágono) y color f
function destino(estado) {
  const p0 = sel(), n0 = porProvC[p0].length;
  if (estado === 'pila') {   // la montaña de sobres de la portada
    return q => { const h = q.pila; return { x: h.x, y: h.y, r: 0.026, o: q.c === undefined ? 0 : 1, a: h.a, e: 1, f: GRIS }; };
  }
  if (estado === 'prov' || estado === 'provRes') {   // la provincia elegida, grande en el centro; el resto, apagado en su sitio
    const cols = Math.min(8, Math.ceil(Math.sqrt(n0 * 2))), filas = Math.ceil(n0 / cols), r = Math.min(0.06, 0.8 / (cols * 1.75 + 1), 0.6 / (filas * 1.55 + 1));
    const w = r * Math.sqrt(3), h = r * 1.5, orden = estado === 'provRes' ? provRes : revelado;
    return q => {
      if (q.c === undefined) return { x: HEX_SEN[q.s][0], y: HEX_SEN[q.s][1], r: 0, o: 0, f: GRIS };
      if (q.p !== p0) return { x: HEX[q.c][0], y: HEX[q.c][1], r: R0, o: 0.16, f: tonoProv(q.p) };
      const i = q.j, c = i % cols, fl = Math.floor(i / cols);
      return { x: -(Math.min(cols, n0) - 1) * w / 2 - (filas > 1 ? w / 4 : 0) + c * w + (fl % 2) * w / 2, y: 0.05 - (filas - 1) * h / 2 + fl * h, r: r * 0.95, o: 1, f: orden ? orden[i] || GRIS : GRIS };
    };
  }
  if (estado === 'senado') return q => q.s === undefined
    ? { x: HEX[q.c][0], y: HEX[q.c][1], r: 0, o: 0, f: tonoProv(q.p) }
    : { x: HEX_SEN[q.s][0], y: HEX_SEN[q.s][1], r: RS, o: 1, f: q.p === p0 ? TEJA : tonoProv(q.p) };
  if (estado === 'hemi' || estado === 'hemiRes') {
    const color = estado === 'hemi' ? (i => i < 176 ? TEJA : GRIS) : (i => (res && res.hemi[i]) || GRIS);
    return q => q.c === undefined ? { x: HX, y: HY, r: 0, o: 0, f: GRIS } : { ...enHemi(q.asiento), r: 0.0125, o: 1, f: color(q.asiento) };
  }
  if (estado === 'pacto') {
    const b = k === 12 ? pacto12 : pacto6;
    return q => q.c === undefined || !b ? { x: HX, y: HY, r: q.c === undefined ? 0 : 0.0125, o: q.c === undefined ? 0 : 1, f: GRIS, ...(q.c === undefined ? {} : enHemi(q.asiento)) }
      : { ...enHemi(b.sitio[q.asiento]), r: 0.0125, o: 1, f: b.color[q.asiento] };
  }
  // mapa del Congreso
  const HABC = {}; if (C) [...C.HAB].sort((a, b) => a.h - b.h).forEach((x, j, o) => { HABC[x.i] = ESC_HAB[Math.min(4, Math.floor(j / o.length * 5))]; });
  return q => {
    if (q.c === undefined) return { x: HEX_SEN[q.s][0], y: HEX_SEN[q.s][1], r: 0, o: 0, f: tonoProv(q.p) };
    let f = tonoProv(q.p);
    if (estado === 'mapaSel' && q.p === p0) f = TEJA;
    if (estado === 'hab') f = HABC[q.p] || f;
    if (estado === 'res') f = (res && res.porProvincia[q.p][q.j]) || GRIS;
    return { x: HEX[q.c][0], y: HEX[q.c][1], r: R0, o: 1, f, b: estado === 'hab' && q.p === p0 };
  };
}
const ESTADO = { 0: 'mapaSel', 1: 'mapaSel', 2: 'prov', 3: 'hab', 4: 'senado', 5: 'hemi', 6: 'pacto', 7: 'hemi', 8: 'mapaSel', 9: 'res', 10: 'provRes', 11: 'hemiRes', 12: 'pacto', 13: 'hemiRes', 14: 'mapaSel' };
let forzado = null;   // 'pila' mientras se ve la portada
const estadoActual = () => forzado || ESTADO[k] || 'mapaSel';

/* el hexágono dorado: tu voto. Va encima de una de las piezas de tu provincia o, en los pactos de la fase 1, aparte. */
function piezaTuya() {
  const est = estadoActual(), p0 = sel();
  if (est === 'pila') return null;
  if (est === 'pacto' && k !== 12) return 'aparte';
  if ((est === 'hemiRes' || (est === 'pacto' && k === 12)) && C && C.R) {
    // fase 2: el primer escaño de tu provincia, que fue para el partido más votado en ella
    const id = C.R.prov[p0].rep.order[0];
    if (est === 'hemiRes') { let n = 0; for (const q of C.R.partidos) { if (q.id === id) break; n += q.esc; } return conC[n]; }
    const b = pacto12; if (!b) return null; const nombre = C.R.partidos.find(q => q.id === id).nombre;
    const i = b.partido.findIndex((x, j) => b.nombreDe[j] === nombre); return i >= 0 ? conC[i] : null;
  }
  return piezas.find(q => q.p === p0 && q.j === 0);
}
const textoMarca = () => {
  const est = estadoActual();
  if (est === 'hemiRes' || (est === 'pacto' && k === 12)) return T.primerEscano(sel());
  return T.tuVoto;
};
function ponMarca() {
  const q = piezaTuya();
  if (!q) { tuyo.setAttribute('opacity', 0); marca.hidden = true; return; }
  const c = q === 'aparte' ? { x: HX, y: HY + 0.2, r: 0.022, o: 1 } : q.cur;   // aparte: debajo de los rótulos de los bloques
  const r = q === 'aparte' ? c.r : Math.max(c.r * 1.12, 0.012);
  tuyo.setAttribute('transform', 'translate(' + c.x.toFixed(4) + ' ' + c.y.toFixed(4) + ') scale(' + r.toFixed(5) + ')');
  tuyo.setAttribute('opacity', (q === 'aparte' ? 1 : c.o).toFixed(2));
  const m = svgEl.getScreenCTM(), e = esc.getBoundingClientRect();
  if (!m) return;
  const pt = svgEl.createSVGPoint(); pt.x = c.x; pt.y = c.y - r * 1.15;
  const s = pt.matrixTransform(m);
  marca.style.left = (s.x - e.left) + 'px'; marca.style.top = (s.y - e.top - 4) + 'px';
  marca.textContent = textoMarca(); marca.hidden = false;
}

/* animación: cada pieza va de su posición a la nueva, con un pequeño retraso de oeste a este */
let anim = 0;
function aplica(suave, dur0) {
  const est = estadoActual(), d = destino(est), t0 = performance.now(), dur = calma() || !suave ? 0 : dur0 || 950;
  const desdePila = piezas[0].cur.e > 0.5 && est !== 'pila';
  piezas.forEach(q => {
    q.ini = { ...q.cur }; q.fin = { a: 0, e: 0, ...d(q) };
    q.ret = !dur ? 0 : desdePila ? (0.5 - q.ini.y) * 900 + (q.fin.x + 0.5) * 300 : (q.fin.x + 0.5) * 380;
    q.hx.style.fill = q.fin.f; q.el.classList.toggle('borde', !!q.fin.b);
  });
  guia.setAttribute('opacity', est === 'pacto' || est === 'hemi' || est === 'hemiRes' ? 1 : 0);
  const llega = dur ? dur + Math.max(...piezas.map(q => q.ret)) : 0;   // ms hasta que la última pieza está en su sitio
  [[bordesC, ['mapaSel', 'hab', 'res'].includes(est)], [bordesS, est === 'senado']].forEach(([b, v]) => { b.style.transitionDelay = v && llega ? Math.max(0, llega - 200) + 'ms' : '0ms'; b.classList.toggle('ve', v); });
  esc.dataset.est = est;   // en los mapas, el contorno de cada hexágono se aclara para que se lean los bordes (css/estilo.css)
  rotulaHemi(est === 'pacto' ? (k === 12 ? pacto12 : pacto6) : null);
  rotHemi.style.transitionDelay = est === 'pacto' && llega ? Math.max(0, llega - 200) + 'ms' : '0ms'; rotHemi.classList.toggle('ve', est === 'pacto');
  cancelAnimationFrame(anim);
  const paso = now => {
    let sigue = false;
    piezas.forEach(q => {
      let u = dur ? (now - t0 - q.ret) / dur : 1; u = Math.max(0, Math.min(1, u)); if (u < 1) sigue = true;
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, a = q.ini, b = q.fin, c = {};
      for (const z of ['x', 'y', 'r', 'o', 'a', 'e']) c[z] = (a[z] || 0) + ((b[z] || 0) - (a[z] || 0)) * e;
      q.cur = c;
      q.el.setAttribute('transform', 'translate(' + c.x.toFixed(4) + ' ' + c.y.toFixed(4) + ') rotate(' + c.a.toFixed(1) + ') scale(' + Math.max(0.0001, c.r).toFixed(5) + ')');
      q.el.style.opacity = c.o.toFixed(3);
      // el sobre se desvanece en la segunda mitad del vuelo y aparece el hexágono
      if (a.e || b.e) { q.env.style.opacity = c.e.toFixed(3); q.hx.style.opacity = (1 - c.e).toFixed(3); }
    });
    ponMarca();
    if (sigue) anim = requestAnimationFrame(paso);
  };
  anim = requestAnimationFrame(paso);
  rotula();
}
function rotula() {
  const est = estadoActual();
  let t = T.rotulo(k, sel(), PROV[sel()][1], !!revelado);
  let pie = '';
  if (est === 'pacto') {
    const b = k === 12 ? pacto12 : pacto6;
    if (b) t = T.rotuloPacto(b.cuenta);
    pie = k === 12 ? T.piePactoRes : T.piePacto;
  }
  if (est === 'pila') t = '';
  // paso 3: la escala de habitantes por escaño, de la provincia con menos a la que tiene más (los cinco tonos son quintos de la lista)
  const leyenda = est === 'hab' && C ? '<span class="esc-hab" aria-hidden="true">' + T.miles(C.HAB[0].h) + ESC_HAB.map(c => '<i style="background:' + c + '"></i>').join('') + T.miles(C.HAB[C.HAB.length - 1].h) + '</span>' : '';
  rotulo.innerHTML = t + leyenda; pieEsc.textContent = pie;
  // para lectores de pantalla, el escenario dice qué enseña en cada paso: el rótulo, el pie y qué es el hexágono dorado
  const punto = s => /[.:?!]$/.test(s) ? s : s + '.', limpio = punto(t.replace('<small>', '. ').replace(/<[^>]+>/g, '').trim());
  esc.setAttribute('aria-label', !t ? T.ariaEscenario : T.ariaPaso(limpio + (pie ? ' ' + punto(pie) : ''), piezaTuya() ? textoMarca() : ''));
}
// tocar una provincia en el mapa la elige
svgEl.addEventListener('click', e => { const g = e.target.closest('.p'); if (g && C && ['mapaSel', 'hab', 'senado', 'res'].includes(estadoActual())) C.eligeProv(+g.dataset.p); });
addEventListener('resize', () => ponMarca());

/* ---------- el contenido, con los efectos del escenario ---------- */
const colorVoto = p => p[3] || COLOR_PARTIDO[p[0]] || GRIS;
const G = {
  setProv() { revelado = null; if (listo) aplica(true); pintaTuVoto(); },
  resetBet() { revelado = null; if (listo && k === 2) aplica(true); },
  reveal(d) { revelado = agrupa(d.order.map(id => PART.find(p => p[0] === id)[2])); if (listo && k === 2) { aplica(true); rotula(); } },
  setSen() {},
  setPact(estado, partidos) { pacto6 = bloques(estado, partidos || CONGRESO_2023.partidos, colorVoto); if (listo && k === 6) aplica(true, 700); },
  setRes(r) { res = r; if (listo && [9, 11, 13].includes(k)) aplica(true); },
  setProvRes(colores) { provRes = agrupa(colores); if (listo && k === 10) aplica(true); },
  setPact2(estado, partidos) {
    const color = p => { const q = C && C.R && C.R.partidos.find(x => x.nombre === p[1]); return q ? q.color : GRIS; };
    pacto12 = bloques(estado, partidos, color); pacto12.nombreDe = []; partidos.forEach(p => { for (let i = 0; i < p[2]; i++) pacto12.nombreDe.push(p[1]); });
    if (listo && k === 12) aplica(true, 700);
  }
};
C = contenido({ G, anuncia, enLectura });
C.sincroniza();

/* ---------- cada paso: su número e icono, y la frase de tu provincia ---------- */
// La frase de cada paso está en js/textos.js (T.frase); aquí se calculan los datos que necesita.
function frase(k) {
  const i = C.st.prov, n = PROV[i][1];
  // con los cinco partidos inventados del paso 2: cuántos entran en tu provincia y en las dos de los extremos
  const entran = e => Object.values(dhondt(e).seats).filter(x => x > 0).length;
  // fase 2: el partido que se llevó el primer escaño de tu provincia
  const primero = C.R ? C.R.partidos.find(x => x.id === C.R.prov[i].rep.order[0]).nombre : '';
  return T.frase(k, { i, n, entran: entran(n), soria: entran(2), madrid: entran(38), primero });
}
secs.forEach(s => {
  const kk = casilla(s), cu = $('.cuerpo', s) || $('.portada', s), h = $('h1, h2', cu);
  const et = document.createElement('p'); et.className = 'estacion';
  et.innerHTML = ICONO[kk] + '<span>' + T.estacion(kk, ULTIMA) + '</span>';
  cu.insertBefore(et, h);
  if (h.firstChild && h.firstChild.nodeType === 3) h.firstChild.data = h.firstChild.data.replace(/^\d+ · /, '');   // «1 · Qué se vota»: el número ya lo dice la línea de encima
  const tv = document.createElement('div'); tv.className = 'tuvoto'; tv.dataset.k = kk; h.after(tv);
});
let enviado = 0;   // paso de la calculadora a la que se ha llegado por un enlace sin haber elegido provincia (ver al final)
function pintaTuVoto() {
  if (!C) return;
  const sp = $('#provVoto'); if (sp) sp.value = C.st.prov;
  $$('.tuvoto').forEach(t => { const f = frase(+t.dataset.k); t.hidden = !f || (+t.dataset.k === enviado && !C.st.elegida); t.innerHTML = f ? '<span class="tv-et">' + T.tuVoto + '</span>' + f : ''; });
  // paso 1: si no se ha elegido provincia, el recuadro lo dice y lleva al desplegable
  const t1 = $('.tuvoto[data-k="1"]'); if (t1 && !t1.hidden && !C.st.elegida) t1.insertAdjacentHTML('beforeend', '<span class="tv-cambia">' + T.cambiaProv(C.st.prov, '<button type="button" class="enlace">', '</button>') + '</span>');
}
document.addEventListener('click', e => { if (e.target.closest('.tv-cambia .enlace')) { irA(1, false, $('#prov')); $('#prov').focus({ preventScroll: true }); } });
/* salida: elegir dónde votas. Va justo debajo del título, para que se vea sin bajar nada más cerrar la portada. */
const salida = $('.paso[data-k="0"] .portada');
const elige = document.createElement('div'); elige.className = 'elige';
elige.innerHTML = '<label class="sel" for="provVoto">' + T.dondeVotas + '</label><select id="provVoto"></select>';
PROV.forEach((p, i) => { const o = document.createElement('option'); o.value = i; o.textContent = T.provLista(i); $('select', elige).appendChild(o); });
$('select', elige).addEventListener('change', e => C.eligeProv(+e.target.value));
$('h1', salida).after(elige);
const tocaMapa = document.createElement('p'); tocaMapa.className = 'nota'; tocaMapa.textContent = T.tocaMapa;
pintaTuVoto();

/* ---------- navegación: menú de pasos, «Siguiente», solo texto ---------- */
const indice = $('#indice');
const irA = (kk, foco, dentro) => {   // dentro: un elemento del paso al que bajar, en vez de su principio
  const s = secs.find(x => casilla(x) === kk); if (!s) return;
  const y = kk === 0 ? 0 : (dentro || s).getBoundingClientRect().top + scrollY - (innerWidth < 900 && !enLectura() ? innerHeight * 0.35 + 52 : 56);
  scrollTo({ top: y, behavior: calma() || Math.abs(y - scrollY) > innerHeight * 3 ? 'auto' : 'smooth' });
  if (foco) { const t = $('h1, h2', s); t.tabIndex = -1; t.focus({ preventScroll: true }); }
};
secs.forEach(s => {
  const kk = casilla(s), b = document.createElement('button'); b.type = 'button'; b.dataset.k = kk;
  b.innerHTML = '<b>' + (kk === 0 ? '·' : kk === 14 ? '·' : kk) + '</b><span>' + T.titulos[kk] + '</span>';
  b.addEventListener('click', () => { abreIndice(false); irA(kk, true); });
  indice.appendChild(b);
});
const bTexto = document.createElement('button'); bTexto.type = 'button'; indice.appendChild(bTexto);
bTexto.addEventListener('click', () => { abreIndice(false); lectura(!enLectura()); });
if (!FASE2) {   // los pasos 9 a 13 se ven en el menú, desactivados, y cada tarjeta cerrada lleva su icono
  for (let kk = 9; kk <= 13; kk++) { const b = document.createElement('button'); b.type = 'button'; b.disabled = true; b.innerHTML = '<b>' + kk + '</b><span>' + T.titulos[kk] + '</span><small>' + T.abre30N + '</small>'; indice.insertBefore(b, bTexto); }
  const pi = document.createElement('p'); pi.textContent = T.fase2Cerrada; indice.appendChild(pi);
  $$('.capado').forEach(c => $('.estacion', c).insertAdjacentHTML('afterbegin', ICONO[+c.dataset.k] || ''));
}
// los idiomas: la lista está en el HTML, al principio de la página; se repite en el menú de pasos y en la portada
const idiomas = $('nav.idiomas');
if (idiomas) indice.appendChild(idiomas.cloneNode(true));
function abreIndice(v, foco) {
  indice.hidden = !v; $('#donde').setAttribute('aria-expanded', v ? 'true' : 'false');
  if (v && foco) { const bs = $$('button', indice); (bs[Math.max(0, secs.findIndex(s => casilla(s) === k))] || bs[0]).focus(); }
}
$('#donde').addEventListener('click', e => abreIndice(indice.hidden, e.detail === 0));
addEventListener('keydown', e => { if (e.key === 'Escape' && !indice.hidden) { abreIndice(false); $('#donde').focus(); } });
indice.addEventListener('focusout', e => { if (e.relatedTarget && !indice.contains(e.relatedTarget) && e.relatedTarget !== $('#donde')) abreIndice(false); });
secs.forEach((s, i) => {
  if (i === secs.length - 1) return;
  const kk = casilla(secs[i + 1]), b = document.createElement('button'); b.type = 'button'; b.className = 'sig';
  b.textContent = (i === 0 ? T.sigueMiVoto : T.siguiente) + (kk === 14 ? '' : kk + ' · ') + T.titulos[kk];
  b.addEventListener('click', () => irA(kk, true));
  if (i === 0) { elige.after(b); b.after(tocaMapa); b.addEventListener('click', () => C.recuerda()); }   // en la salida, el botón va con el desplegable; pulsarlo acepta la provincia
  else ($('.cuerpo', s) || $('.portada', s)).appendChild(b);
});
if (FASE2) {   // en la fase 2, la salida lleva primero un atajo a los resultados; el recorrido por las reglas queda de segundo
  const b = document.createElement('button'); b.type = 'button'; b.className = 'sig';
  b.textContent = T.irResultados + '9 · ' + T.titulos[9];
  b.addEventListener('click', () => { C.recuerda(); irA(9, true); });
  const s0 = $('.sig', salida); s0.classList.add('sec'); s0.before(b);
}
function lectura(v) {
  document.body.classList.toggle('lectura', v);
  const t = v ? T.verEscanos : T.verTexto;
  bTexto.innerHTML = '<b>≡</b><span>' + t + '</span>'; const st = $('#soloTexto'); if (st) st.textContent = t;
  scrollTo({ top: 0 }); mira(true);
}
lectura(false);
$('#saltar').addEventListener('click', e => { e.preventDefault(); if (portada) portada.cierra(); lectura(true); $('h1', secs[0]).focus(); });
const st = $('#soloTexto'); if (st) st.addEventListener('click', () => lectura(!enLectura()));
['#volver', '#volver2'].forEach(s => { const b = $(s); if (b) b.addEventListener('click', () => irA(0, true)); });
// Compartir el sitio: la hoja de compartir del teléfono si la hay; si no, se copia la dirección. El texto es la descripción de la página.
$$('.compartir-sitio').forEach(b => b.addEventListener('click', async () => {
  const rot = b.textContent, desc = $('meta[name="description"]');
  const d = { title: document.title, text: desc ? desc.content : '', url: location.origin + location.pathname };
  const dice = t => { b.textContent = t; anuncia(t); setTimeout(() => { b.textContent = rot; }, 2500); };
  try {
    if (navigator.share) await navigator.share(d);
    else { await navigator.clipboard.writeText(d.url); dice(T.copiado.replace(/\.$/, '')); }
  } catch (e) { if (!e || e.name !== 'AbortError') dice(T.copiaDireccion); }
}));

/* qué paso se está leyendo: el último cuyo principio ha pasado de la mitad de la pantalla */
function mira(forzar) {
  let a = 0;
  secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.55) a = casilla(s); });
  $('#donde').textContent = T.donde(a, ULTIMA, enLectura()) + ' ▾';
  $$('button[data-k]', indice).forEach(b => { if (+b.dataset.k === a) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });   // el menú marca dónde estás
  if (a !== k || forzar) { k = a; if (listo) aplica(true); pintaTuVoto(); }
}
let pend = false;
addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; mira(); }); } }, { passive: true });

/* ---------- portada: una montaña de sobres que se convierte en el mapa ---------- */
// Montón: más alto en el centro, sobres girados al azar (con semilla fija, para que sea siempre el mismo).
let semilla = 29; const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
piezas.forEach(q => {
  const x = (azar() + azar() + azar() - 1.5) / 1.5 * 0.46, alto = (innerWidth < 600 ? 0.42 : 0.3) * Math.max(0, 1 - Math.pow(x / 0.47, 2)) + 0.03;
  q.pila = { x, y: 0.47 - azar() * alto, a: (azar() - 0.5) * 70 };
});
const saltaPortada = (() => { try { return !!sessionStorage.getItem('sobres') || /[?&]p(6|12)=/.test(location.search) || (location.hash.length > 1 && location.hash !== '#fase2'); } catch (e) { return false; } })();
let portada = null;
if (!saltaPortada) {
  document.body.classList.add('intro');
  forzado = 'pila'; aplica(false);
  const tapa = document.createElement('div'); tapa.className = 'tapa'; tapa.setAttribute('role', 'dialog'); tapa.setAttribute('aria-modal', 'true'); tapa.setAttribute('aria-labelledby', 'tapaTit');
  tapa.innerHTML = '<p class="banda">' + T.tapa.banda + '</p><h1 id="tapaTit">' + T.tapa.titulo + '</h1>' +
    '<p class="sub">' + T.tapa.sub + '</p>' +
    '<h2>' + T.tapa.como + '</h2><ol>' + T.tapa.pasos.map(x => '<li>' + x + '</li>').join('') + '</ol>' +
    '<button type="button" class="boton">' + T.tapa.boton + '</button><button type="button" class="texto">' + T.tapa.texto + '</button>';
  if (idiomas) tapa.appendChild(idiomas.cloneNode(true));
  document.body.appendChild(tapa);
  const cierra = () => { tapa.remove(); document.body.classList.remove('intro'); forzado = null; listo = true; portada = null; };
  portada = { cierra: () => { cierra(); aplica(false); } };
  $('.boton', tapa).addEventListener('click', () => {
    try { sessionStorage.setItem('sobres', '1'); } catch (e) {}
    tapa.classList.add('fuera'); forzado = null; listo = true; k = 0;
    aplica(true, 1100);   // los sobres vuelan a su sitio en el mapa y se convierten en hexágonos
    setTimeout(() => {
      esc.classList.add('mueve'); document.body.classList.remove('intro');
      const sigue = () => ponMarca(); const iv = setInterval(sigue, 30);
      setTimeout(() => { clearInterval(iv); esc.classList.remove('mueve'); ponMarca(); tapa.remove(); portada = null; $('#provVoto').focus({ preventScroll: true }); }, calma() ? 0 : 750);
    }, calma() ? 0 : 1900);
  });
  $('.texto', tapa).addEventListener('click', () => { cierra(); lectura(true); $('h1', secs[0]).focus(); });
  setTimeout(() => $('.boton', tapa).focus({ preventScroll: true, focusVisible: false }), 50);
} else { listo = true; }
mira(true);
// Enlace compartido a una calculadora (?p6=…): se baja directo a ella, salvo al recargar (el navegador ya vuelve a donde se estaba).
// Si quien llega no ha elegido provincia, el recuadro «Tu voto» de ese paso no sale y una línea dice de dónde viene la combinación.
const m = location.search.match(/[?&]p(6|12)=/), kEnlace = m ? +m[1] : 0;
const recarga = (() => { try { return performance.getEntriesByType('navigation')[0].type === 'reload'; } catch (e) { return false; } })();
if (kEnlace && !recarga && secs.some(s => casilla(s) === kEnlace)) {
  let destino = $('#calc' + kEnlace);
  if (!C.st.elegida) {
    enviado = kEnlace; pintaTuVoto();
    const p = document.createElement('p'); p.className = 'enviada';
    p.innerHTML = T.enviada('<button type="button" class="enlace">', '</button>');
    $('button', p).addEventListener('click', () => irA(0, true));
    (kEnlace === 6 ? $('#calcNota') : destino).before(p); destino = p;
  }
  setTimeout(() => irA(kEnlace, false, destino), 80);
}
window.__sitio = { aplica, irA, C: () => C };
