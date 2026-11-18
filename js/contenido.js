// El contenido de los pasos: glosario, calendario, provincia, apuesta, tablas, Senado, calculadoras y resultados.
// No dibuja nada: los efectos visuales (el escenario de los 350 escaños) le llegan en G.
import { PROV, PROV_INICIAL, POB, PART, PORRA, SEN, GLOS, COLOR_PARTIDO } from './datos.js';
import { dhondt, reparto } from './dhondt.js';
import { RES } from './resultados.js';

const $ = (s, r = document) => r.querySelector(s);
const plural = n => n + (n === 1 ? ' escaño' : ' escaños');
const miles = n => Math.round(n).toLocaleString('es-ES');
const pct = x => (x * 100).toFixed(1).replace('.', ',') + ' %';
const calma = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// La fase 2 se abre para todos con RES.abierta; para verla antes, añadir #fase2 a la dirección.
export const FASE2 = RES.abierta || location.hash === '#fase2';
export { plural, miles, pct };

/* G: setProv, resetBet, reveal, setSen, setPact, setRes, setProvRes, setPact2 (pueden no hacer nada).
   anuncia(texto): mensaje para lectores de pantalla. enLectura(): si se está en modo de solo texto. */
export function contenido({ G, anuncia = () => {}, enLectura = () => false }) {
document.body.classList.toggle('fase2', FASE2);
const st = { prov: PROV_INICIAL, bets: [0, 0, 0, 0, 0], revealed: null, sen: new Set(), pact: {}, pact2: {} };
const S = () => PROV[st.prov][1];
/* calendario del paso 7: cada fecha abre o cierra su explicación; solo una abierta a la vez */
function cierraHitos(salvo) {
  document.querySelectorAll('.hito.abierto').forEach(h => { if (h !== salvo) { h.classList.remove('abierto'); $('.fecha', h).setAttribute('aria-expanded', 'false'); } });
}
document.addEventListener('click', e => {
  const f = e.target.closest('.fecha');
  if (!f) { if (!e.target.closest('.tip')) cierraHitos(null); return; }
  const h = f.parentElement; cierraHitos(h);
  f.setAttribute('aria-expanded', h.classList.toggle('abierto') ? 'true' : 'false');
});
addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.hito.abierto')) { const f = $('.hito.abierto .fecha'); cierraHitos(null); f.focus(); } });

/* glosario */
document.addEventListener('click', e => {
  const b = e.target.closest('.glos'); if (!b) return;
  const p = b.closest('p'), nxt = p.nextElementSibling, era = nxt && nxt.classList.contains('def') ? nxt.dataset.g : null;
  if (era) { nxt.remove(); p.querySelectorAll('.glos[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false')); }
  if (era === b.dataset.g) return;
  b.setAttribute('aria-expanded', 'true');
  const d = document.createElement('div'); d.className = 'def'; d.dataset.g = b.dataset.g;
  const t = document.createElement('b'); t.textContent = GLOS[b.dataset.g][0] + '. ';
  d.appendChild(t); d.appendChild(document.createTextNode(GLOS[b.dataset.g][1]));
  p.after(d);
});
document.querySelectorAll('.glos').forEach(b => b.setAttribute('aria-expanded', 'false'));
const dl = $('#glosario');
Object.values(GLOS).sort((a, b) => a[0].localeCompare(b[0], 'es')).forEach(g => {
  const dt = document.createElement('dt'); dt.textContent = g[0];
  const dd = document.createElement('dd'); dd.textContent = g[1];
  dl.appendChild(dt); dl.appendChild(dd);
});
/* al abrir un cajón se cierran los demás de su panel, para que no se haga interminable */
document.addEventListener('toggle', e => {
  const d = e.target; if (!d.open || d.tagName !== 'DETAILS' || enLectura()) return;
  d.parentElement.querySelectorAll(':scope > details[open]').forEach(o => { if (o !== d) o.open = false; });
}, true);

/* provincia (el desplegable aparece en el paso 1 y, en la fase 2, en el 10) */
const sels = [...document.querySelectorAll('.selProv')];
sels.forEach(sel => {
  PROV.forEach((p, i) => { const o = document.createElement('option'); o.value = i; o.textContent = p[0]; sel.appendChild(o); });
  sel.addEventListener('change', () => { st.prov = +sel.value; pintaProv(); });
});
function pintaProv() {
  const [n, s] = PROV[st.prov];
  sels.forEach(sel => { sel.value = st.prov; });
  $('#provTxt').textContent = n + ' elige ' + plural(s) + ' de los 350.';
  $('#betIntro').textContent = n + ' reparte ' + plural(s) + ' entre cinco partidos inventados. ¿Cuántos le das a cada uno?';
  G.setProv(st.prov);
  pintaHab();
  resetBet(); pintaCocientes(); if (FASE2) pintaProvRes();
}

/* apuesta */
const sl = $('#sliders');
const filas = PART.map((p, i) => {
  const f = document.createElement('div'); f.className = 'fila';
  f.innerHTML = '<span class="ficha" style="background:' + p[2] + ';color:' + p[3] + '">' + p[0] + '</span><small>' + Math.round(p[1]) + ' %</small><span class="mid"><input type="range" min="0" step="1" value="0" aria-label="Escaños para el partido ' + p[0] + '"><span class="real" hidden></span></span><output>0</output>';
  sl.appendChild(f);
  const r = $('input', f);
  r.addEventListener('input', () => {
    const otros = st.bets.reduce((a, b, j) => a + (j === i ? 0 : b), 0);
    const v = Math.min(+r.value, S() - otros);
    r.value = v; st.bets[i] = v; pintaBet();
  });
  return f;
});
const resto = () => S() - st.bets.reduce((a, b) => a + b, 0);
function pintaBet() {
  const q = resto();
  filas.forEach((f, i) => { $('output', f).textContent = st.bets[i]; });
  $('#resto').textContent = q === 0 ? 'Todo repartido.' : (q === 1 ? 'Te queda 1 escaño por repartir.' : 'Te quedan ' + q + ' escaños por repartir.');
  if (q === 0) $('#betErr').hidden = true;
}
function resetBet() {
  st.bets = [0, 0, 0, 0, 0]; st.revealed = null;
  filas.forEach(f => { const r = $('input', f); r.max = S(); r.value = 0; r.hidden = false; $('.real', f).hidden = true; });
  $('#betRes').hidden = true; $('#apostar').hidden = false; $('#betErr').hidden = true;
  pintaBet(); G.resetBet(S());
}
$('#apostar').addEventListener('click', () => {
  if (resto() !== 0) { $('#betErr').hidden = false; return; }
  const d = dhondt(S()); st.revealed = d;
  let hit = 0;
  filas.forEach((f, i) => {
    const id = PART[i][0]; hit += Math.min(st.bets[i], d.seats[id]);
    const r = $('.real', f); r.hidden = false; r.textContent = "D'Hondt le da " + d.seats[id];
    $('input', f).hidden = true;
  });
  $('#betHit').textContent = 'Has acertado ' + hit + ' de ' + S() + '.';
  anuncia($('#betHit').textContent + ' ' + PART.map(p => p[0] + ': ' + d.seats[p[0]]).join(', ') + '. ' + $('#betRes p:not(.res)').textContent);
  $('#betRes').hidden = false; $('#apostar').hidden = true;
  G.reveal(d);
});
$('#reapostar').addEventListener('click', resetBet);

/* la tabla de divisiones de tu provincia; al abrir el cajón, los escaños se reparten uno a uno */
let tablaD = null, tablaT = 0;
function pintaCocientes() {
  const d = dhondt(S()), cols = Math.min(6, Math.max(2, Math.max(...Object.values(d.seats)) + 1));
  let h = '<table><tr><th>Partido</th>';
  for (let c = 1; c <= cols; c++) h += '<th>÷' + c + '</th>';
  h += '</tr>';
  PART.forEach(p => {
    const fuera = !d.dentro.includes(p[0]);
    h += '<tr><td>' + p[0] + (fuera ? ' (fuera)' : '') + '</td>';
    for (let c = 1; c <= cols; c++) h += '<td data-p="' + p[0] + '" data-c="' + c + '">' + (p[1] / c).toFixed(1).replace('.', ',') + '</td>';
    h += '</tr>';
  });
  $('#cocientes').innerHTML = h + '</table>';
  tablaD = d; clearTimeout(tablaT); marcaTabla(d.order.length);
}
// Marca en la tabla los n primeros escaños, con su número de orden.
function marcaTabla(n) {
  const d = tablaD, cuenta = {}, num = x => x.toFixed(1).replace('.', ',');
  $('#cocientes').querySelectorAll('td.gana').forEach(td => { td.classList.remove('gana'); delete td.dataset.n; });
  let txt = '';
  d.order.slice(0, n).forEach((id, i) => {
    cuenta[id] = (cuenta[id] || 0) + 1;
    const td = $('#cocientes td[data-p="' + id + '"][data-c="' + cuenta[id] + '"]');
    if (td) { td.classList.add('gana'); td.dataset.n = i + 1; }
    txt = 'Escaño ' + (i + 1) + ' de ' + d.order.length + ': para ' + id + ', con ' + num(PART.find(p => p[0] === id)[1] / cuenta[id]) + (td ? '.' : ' (división ÷' + cuenta[id] + ', fuera de la tabla).');
  });
  $('#pasoReparto').textContent = n === 0 ? 'Empieza el reparto…' : n === d.order.length ? 'Reparto terminado: ' + PART.filter(p => d.seats[p[0]]).map(p => p[0] + ' ' + d.seats[p[0]]).join(', ') + '.' : txt;
}
function animaTabla() {
  clearTimeout(tablaT);
  if (calma()) { marcaTabla(tablaD.order.length); return; }
  const total = tablaD.order.length, paso = Math.min(650, 9000 / total);
  let n = 0; marcaTabla(0);
  const sigue = () => { n++; marcaTabla(n); if (n < total) tablaT = setTimeout(sigue, paso); else anuncia($('#pasoReparto').textContent); };
  tablaT = setTimeout(sigue, 500);
}
$('#cocientes').closest('details').addEventListener('toggle', e => { if (e.target.open) animaTabla(); else { clearTimeout(tablaT); marcaTabla(tablaD.order.length); } });
$('#repetirReparto').addEventListener('click', animaTabla);

/* habitantes por escaño (paso 3): la frase de la provincia elegida y las barras de las 52 circunscripciones */
const HAB = PROV.map((p, i) => ({ i, n: p[0], h: Math.round(POB[i] / p[1]) })).sort((a, b) => a.h - b.h);
const MEDIA = Math.round(POB.reduce((a, b) => a + b, 0) / 350), MAXH = HAB[HAB.length - 1].h;
(() => {
  const ol = $('#barrasHab');
  HAB.forEach(x => {
    const li = document.createElement('li'); li.dataset.i = x.i;
    li.innerHTML = '<span class="bn">' + x.n + '</span><span class="bb"><i style="width:' + (x.h / MAXH * 100).toFixed(1) + '%"></i></span><span class="bv">' + miles(x.h) + '</span>';
    ol.appendChild(li);
  });
})();
function pintaHab() {
  const x = HAB.find(y => y.i === st.prov), pos = HAB.indexOf(x) + 1;
  $('#hab').textContent = 'En ' + x.n + ' hay un escaño por cada ' + miles(x.h) + ' habitantes (puesto ' + pos + ' de 52, de menos a más). La media de España es uno por cada ' + miles(MEDIA) + '.';
  $('#barrasHab').querySelectorAll('li').forEach(li => li.classList.toggle('sel', +li.dataset.i === st.prov));
}

/* Soria frente a Madrid, y cuántas provincias hay de cada tamaño */
(() => {
  const a = dhondt(2).seats, b = dhondt(38).seats, ul = $('#comp');
  PART.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = '<b>' + p[0] + ' · ' + Math.round(p[1]) + ' %</b><span>' + a[p[0]] + ' de 2 en Soria · ' + b[p[0]] + ' de 38 en Madrid</span>';
    ul.appendChild(li);
  });
  const n = lim => PROV.filter(p => p[1] <= lim).length, ch = n(5), med = n(9) - ch, gr = 52 - ch - med;
  $('#tamanos').textContent = 'De las 52 circunscripciones, ' + ch + ' reparten cinco escaños o menos, ' + med + ' reparten entre seis y nueve y solo ' + gr + ' reparten diez o más.';
})();

/* Senado */
const fs = $('#sen');
SEN.forEach((n, i) => {
  const l = document.createElement('label');
  const c = document.createElement('input'); c.type = 'checkbox';
  c.addEventListener('change', () => {
    if (c.checked && st.sen.size >= 3) { c.checked = false; $('#senTxt').textContent = 'Solo tres. Quita una marca para cambiarla.'; anuncia($('#senTxt').textContent); return; }
    if (c.checked) st.sen.add(i); else st.sen.delete(i);
    pintaSen(true);
  });
  l.appendChild(c); l.appendChild(document.createTextNode(n)); fs.appendChild(l);
});
function pintaSen(avisa) { $('#senTxt').textContent = 'Has marcado ' + st.sen.size + ' de 3.'; G.setSen(st.sen); if (avisa) anuncia($('#senTxt').textContent); }

/* calculadora de pactos: partidos = [nombre corto, nombre largo, escaños]; estado = { corto: 'no' | 'si' | 'abs' }
   clave: nombre del parámetro de la dirección que guarda la combinación (?p6=PSOE:s,PNV:a), para compartirla. */
function calculadora(raiz, partidos, estado, alCambiar, clave) {
  const ORD = ['no', 'si', 'abs'], TXT = { no: 'No', si: 'Sí', abs: 'Abst.' }, LARGO = { no: 'no', si: 'sí', abs: 'abstención' };
  const COD = { si: 's', abs: 'a' }, DEC = { s: 'si', a: 'abs' };
  try {   // combinación recibida en la dirección
    const q = new URLSearchParams(location.search).get(clave);
    if (q) q.split(',').forEach(x => { const [id, c] = x.split(':'); if (DEC[c] && partidos.some(p => p[0] === id)) estado[id] = DEC[c]; });
  } catch (e) {}
  raiz.innerHTML = '<div class="tally"><span class="tSi"></span><span class="tAbs"></span><span class="tNo"></span></div><div class="barra" role="img" aria-label="Barra de 350 escaños con la marca de 176"><i class="bSi"></i><i class="bNo"></i><i class="bM"></i></div><div class="ver"><small>1.ª votación · mayoría absoluta</small><b class="v1"></b></div><div class="ver"><small>2.ª votación · más síes que noes</small><b class="v2"></b></div><div class="grid"></div><div class="compartir"><button type="button" class="pill sec">Copiar enlace a esta combinación</button><span class="nota" role="status"></span></div>';
  $('.compartir button', raiz).addEventListener('click', () => {
    const u = new URL(location.href), v = partidos.filter(p => COD[estado[p[0]]]).map(p => p[0] + ':' + COD[estado[p[0]]]).join(',');
    if (v) u.searchParams.set(clave, v); else u.searchParams.delete(clave);
    try { history.replaceState(null, '', u); } catch (e) {}
    const ok = () => { $('.compartir .nota', raiz).textContent = 'Enlace copiado.'; }, mal = () => { $('.compartir .nota', raiz).textContent = 'Copia la dirección del navegador: ya lleva la combinación.'; };
    try { navigator.clipboard.writeText(u.href).then(ok, mal); } catch (e) { mal(); }
  });
  const btns = partidos.map(p => {
    const b = document.createElement('button'); b.type = 'button';
    b.addEventListener('click', () => { const e = estado[p[0]] || 'no'; estado[p[0]] = ORD[(ORD.indexOf(e) + 1) % 3]; pinta(true); });
    $('.grid', raiz).appendChild(b); return b;
  });
  function pinta(avisa) {
    let si = 0, no = 0, abs = 0;
    partidos.forEach((p, i) => {
      const e = estado[p[0]] || 'no';
      if (e === 'si') si += p[2]; else if (e === 'abs') abs += p[2]; else no += p[2];
      btns[i].className = e;
      btns[i].innerHTML = '<b>' + (p[3] ? '<i class="pt" style="background:' + p[3] + '"></i>' : '') + p[0] + ' ' + p[2] + '</b><span>' + TXT[e] + '</span>';
      btns[i].setAttribute('aria-label', p[1] + ', ' + plural(p[2]) + ', vota ' + LARGO[e] + '. Toca para cambiar');
    });
    $('.tSi', raiz).textContent = 'Sí: ' + si; $('.tAbs', raiz).textContent = 'Abst.: ' + abs; $('.tNo', raiz).textContent = 'No: ' + no;
    $('.bSi', raiz).style.width = (si / 350 * 100).toFixed(2) + '%'; $('.bNo', raiz).style.width = (no / 350 * 100).toFixed(2) + '%';
    const s1 = si >= 176, s2 = si > no;
    $('.v1', raiz).textContent = s1 ? 'Sale: tiene ' + si + ' síes.' : 'No sale: faltan ' + (176 - si) + ' síes.';
    $('.v2', raiz).textContent = (s2 ? 'Sale: ' : 'No sale: ') + si + ' síes frente a ' + no + ' noes.';
    $('.v1', raiz).className = 'v1' + (s1 ? ' ok' : ''); $('.v2', raiz).className = 'v2' + (s2 ? ' ok' : '');
    if (avisa) anuncia('Sí ' + si + ', abstención ' + abs + ', no ' + no + '. Primera votación: ' + $('.v1', raiz).textContent + ' Segunda: ' + $('.v2', raiz).textContent);
    alCambiar(estado, partidos);
  }
  return pinta;
}
const pintaPact = calculadora($('#calc6'), PORRA.partidos.map(p => [...p, COLOR_PARTIDO[p[0]]]), st.pact, (e, p) => G.setPact(e, p), 'p6');
$('#porraNota').innerHTML = 'Escaños calculados a partir de las últimas encuestas, hasta el ' + PORRA.corte + ' (<a href="https://gastiaso.github.io/porra-electoral/">Porra Electoral</a>). Es una estimación, no un resultado.';

/* ---------- fase 2: los resultados ---------- */
let R = null, pintaPact2 = () => {};
function pintaProvRes() {
  if (!R) return;
  const p = R.prov[st.prov], [n] = PROV[st.prov], con = R.partidos.filter(q => p.rep.seats[q.id] > 0).sort((a, b) => p.rep.seats[b.id] - p.rep.seats[a.id]);
  $('#r10').textContent = n + ' repartía ' + plural(p.e) + '.';
  $('#l10').innerHTML = con.map(q => '<li><b>' + q.nombre + '</b><span>' + plural(p.rep.seats[q.id]) + ' · ' + pct(p.votos[q.id] / p.val) + '</span></li>').join('');
  const nom = id => R.partidos.find(q => q.id === id).nombre;
  $('#u10').textContent = p.rep.ultimo && p.rep.rival
    ? 'El último escaño fue para ' + nom(p.rep.ultimo.id) + '. A ' + nom(p.rep.rival.id) + ' le faltaron ' + miles(p.rep.rival.faltan) + ' votos para quitárselo.'
    : (p.rep.ultimo ? 'El escaño fue para ' + nom(p.rep.ultimo.id) + '.' : '');
  G.setProvRes(p.rep.order.map(id => R.partidos.find(q => q.id === id).color), p.e);
  preparaYsi();
}
/* ¿y si…? (paso 10): se pasan votos de un partido a otro, el total de válidos no cambia y se repite el reparto */
function preparaYsi() {
  const p = R.prov[st.prov], ps = R.partidos.filter(q => p.votos[q.id] > 0).sort((a, b) => p.votos[b.id] - p.votos[a.id]);
  const opc = ps.map(q => '<option value="' + q.id + '">' + q.nombre + '</option>').join('');
  $('#ysiDe').innerHTML = opc; $('#ysiA').innerHTML = opc;
  if (ps[1]) $('#ysiDe').value = ps[1].id;
  if (ps[2]) $('#ysiA').value = ps[2].id; else if (ps[0]) $('#ysiA').value = ps[0].id;
  pintaYsi(true);
}
function pintaYsi(reinicia) {
  const p = R.prov[st.prov], de = $('#ysiDe').value, a = $('#ysiA').value, r = $('#ysiN');
  const max = p.votos[de] || 0, paso = Math.max(1, Math.round(p.val / 2000));
  r.max = max; r.step = paso; if (reinicia) r.value = 0;
  const n = de === a ? 0 : Math.min(+r.value, max);
  $('#ysiV').textContent = miles(n) + ' votos';
  const votos = R.partidos.map(q => ({ id: q.id, v: p.votos[q.id] + (q.id === de ? -n : 0) + (q.id === a ? n : 0) }));
  const nuevo = reparto(p.e, votos, p.val), nom = id => R.partidos.find(q => q.id === id).nombre;
  const cambian = R.partidos.filter(q => nuevo.seats[q.id] !== p.rep.seats[q.id]);
  $('#ysiL').innerHTML = R.partidos.filter(q => nuevo.seats[q.id] > 0 || p.rep.seats[q.id] > 0).map(q => {
    const d = nuevo.seats[q.id] - p.rep.seats[q.id];
    return '<li class="' + (d ? 'clave' : '') + '"><b>' + q.nombre + '</b><span>' + plural(nuevo.seats[q.id]) + (d ? ' (' + (d > 0 ? '+' : '') + d + ')' : '') + '</span></li>';
  }).join('');
  $('#ysiT').textContent = de === a ? 'Elige dos partidos distintos.'
    : cambian.length ? 'Con ' + miles(n) + ' votos de ' + nom(de) + ' a ' + nom(a) + ', cambia el reparto. El último escaño sería para ' + nom(nuevo.ultimo.id) + '.'
    : 'Con ' + miles(n) + ' votos, el reparto no cambia. El último escaño sigue siendo para ' + nom(nuevo.ultimo.id) + '.';
}
['ysiDe', 'ysiA'].forEach(id => $('#' + id).addEventListener('change', () => pintaYsi(true)));
$('#ysiN').addEventListener('input', () => pintaYsi(false));
if (FASE2) {
  const porNombre = {}; RES.prov.forEach(p => { porNombre[p.n] = p; });
  R = { partidos: RES.partidos, prov: PROV.map(q => {
    const p = porNombre[q[0]], votos = {}; RES.partidos.forEach((x, i) => { votos[x.id] = p.v[i]; });
    return { e: p.e, val: p.val, bl: p.bl, votos, rep: reparto(p.e, RES.partidos.map((x, i) => ({ id: x.id, v: p.v[i] })), p.val) };
  }) };
  const val = R.prov.reduce((a, p) => a + p.val, 0);
  R.partidos.forEach(q => {
    q.votos = R.prov.reduce((a, p) => a + p.votos[q.id], 0);
    q.esc = R.prov.reduce((a, p) => a + p.rep.seats[q.id], 0);
    q.perdidos = R.prov.reduce((a, p) => a + (p.rep.seats[q.id] === 0 ? p.votos[q.id] : 0), 0);
  });
  const orden = [...R.partidos].sort((a, b) => b.esc - a.esc || b.votos - a.votos), pt = q => '<i class="pt" style="background:' + q.color + '"></i>';
  const aviso = (RES.prueba ? 'Vista previa con datos de prueba: ' + RES.etiqueta + '. No son los resultados del 29N.' : RES.etiqueta);
  if (RES.prueba) { $('#avisoPrueba').hidden = false; $('#avisoPrueba').textContent = aviso; }
  /* 9 */
  const g = orden[0];
  $('#r9').textContent = g.nombre + ' es el partido con más escaños: ' + g.esc + ', con el ' + pct(g.votos / val) + ' de los votos. ' + (g.esc >= 176 ? 'Supera los 176 de la mayoría absoluta.' : 'Ningún partido llega solo a los 176 de la mayoría absoluta.');
  // Participación, si el CSV traía censo y votantes (herramientas/resultados.py las pasa solo cuando vienen en todas las filas).
  if (RES.prov.every(p => p.censo)) {
    const censo = RES.prov.reduce((x, p) => x + p.censo, 0), vot = RES.prov.reduce((x, p) => x + p.votantes, 0);
    $('#r9').textContent += ' Votó el ' + pct(vot / censo) + ' del censo.';
  }
  $('#t9').innerHTML = '<table><tr><th>Partido</th><th>Votos</th><th>Escaños</th></tr>' + orden.filter(q => q.esc > 0).map(q => '<tr><td>' + pt(q) + q.nombre + '</td><td>' + pct(q.votos / val) + '</td><td>' + q.esc + '</td></tr>').join('') + '</table>';
  $('#f9').textContent = (RES.prueba ? 'Datos de prueba: ' : '') + RES.etiqueta + '. Fuente: ' + RES.fuente + '. Los escaños se calculan aquí con los votos de cada provincia.';
  /* 11 */
  const sin = R.partidos.reduce((a, q) => a + q.perdidos, 0), otros = RES.prov.reduce((a, p) => a + p.otros, 0);
  $('#r11').textContent = 'El porcentaje de escaños de un partido casi nunca coincide con su porcentaje de votos.';
  $('#t11').innerHTML = '<table><tr><th>Partido</th><th>Votos</th><th>Escaños</th><th>Por escaño</th></tr>' + orden.filter(q => q.esc > 0).map(q => '<tr><td>' + pt(q) + q.nombre + '</td><td>' + pct(q.votos / val) + '</td><td>' + pct(q.esc / 350) + '</td><td>' + miles(q.votos / q.esc) + '</td></tr>').join('') + '</table>';
  const tope = Math.max(...orden.map(q => Math.max(q.votos / val, q.esc / 350)));
  $('#g11').innerHTML = orden.filter(q => q.esc > 0).map(q => '<li><span class="gn">' + pt(q) + q.nombre + '</span><span class="gb"><i class="gv" style="width:' + (q.votos / val / tope * 100).toFixed(1) + '%"></i><i class="ge" style="width:' + (q.esc / 350 / tope * 100).toFixed(1) + '%"></i></span><span class="gx">' + pct(q.votos / val) + '<br>' + pct(q.esc / 350) + '</span></li>').join('');
  $('#s11').textContent = miles(sin + otros) + ' votos (' + pct((sin + otros) / val) + ') fueron a candidaturas que no lograron escaño en su provincia.';
  /* 12 */
  const corto = q => q.nombre.replace('Coalición Canaria', 'CC').replace('Adelante Andalucía', 'AA').replace('Frente Amplio', 'FA').replace('EH Bildu', 'Bildu');
  pintaPact2 = calculadora($('#calc12'), R.partidos.filter(q => q.esc > 0).map(q => [corto(q), q.nombre, q.esc, q.color]), st.pact2, (e, p) => G.setPact2(e, p), 'p12');
  /* 13 */
  const hoy = new Date().toISOString().slice(0, 10), sig = RES.hitos.find(h => !h.f || h.f > hoy);
  $('#r13').textContent = sig ? 'Lo siguiente: ' + sig.t.charAt(0).toLowerCase() + sig.t.slice(1) : 'El calendario está completo.';
  $('#l13').innerHTML = RES.hitos.map(h => '<li class="' + (h.f && h.f <= hoy ? 'hecho' : h === sig ? 'clave' : '') + '"><b>' + h.r + '</b><span>' + h.t + '</span></li>').join('');
  R.hemi = []; R.partidos.forEach(q => { for (let i = 0; i < q.esc; i++) R.hemi.push(q.color); });
  R.hitos = RES.hitos.map(h => ({ r: h.r, hecho: !!(h.f && h.f <= hoy), sig: h === sig }));
}


// Tras cargar los efectos visuales de un formato: les pasa el estado actual.
function sincroniza() {
  G.setProv(st.prov); G.resetBet(S()); if (st.revealed) G.reveal(st.revealed);
  G.setSen(st.sen); pintaPact();
  if (R) { G.setRes({ porProvincia: R.prov.map(p => R.partidos.flatMap(q => Array(p.rep.seats[q.id]).fill(q.color))), hemi: R.hemi }); pintaProvRes(); pintaPact2(); }
}
// Cambiar de provincia desde fuera (por ejemplo, tocando el mapa).
function eligeProv(i) { st.prov = i; pintaProv(); }
pintaProv(); pintaSen(); pintaPact(); pintaPact2();
return { st, S, get R() { return R; }, pintaProv, pintaSen, pintaPact, pintaPact2: () => pintaPact2(), sincroniza, eligeProv, HAB, MEDIA };
}
