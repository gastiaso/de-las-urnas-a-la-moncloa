// Comprueba que los textos del JavaScript de cada idioma (js/idiomas/xx.js) tienen las mismas entradas que los castellanos
// (js/textos.js) y, con --muestra, escribe todas las frases con datos de ejemplo para leerlas de corrido.
// Uso:  node herramientas/prueba_idiomas.mjs            comprueba todos
//       node herramientas/prueba_idiomas.mjs eu         solo ese
//       node herramientas/prueba_idiomas.mjs eu --muestra > eu_frases.txt
import { ES } from '../js/textos.js';
import { PROV } from '../js/datos.js';
import { readdirSync } from 'node:fs';

const args = process.argv.slice(2), muestra = args.includes('--muestra');
const pedidos = args.filter(a => !a.startsWith('--'));
const dir = new URL('../js/idiomas/', import.meta.url);
const cods = pedidos.length ? pedidos : readdirSync(dir).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)).sort();

// Provincias de ejemplo: una grande, la más pequeña, las que llevan artículo o nombre doble, las de islas y Ceuta.
const PROVS = [46, 42, 29, 8, 7, 35, 39, 17, 37, 1, 3, 9, 5, 24, 50];
const tipo = v => Array.isArray(v) ? 'lista' : typeof v === 'function' ? 'función' : v === null ? 'nulo' : typeof v === 'object' ? 'objeto' : 'texto';

function compara(es, x, ruta, fallos) {
  for (const k of Object.keys(es)) {
    const r = ruta + k;
    if (!(k in x)) { fallos.push('falta ' + r); continue; }
    if (tipo(es[k]) !== tipo(x[k])) { fallos.push(r + ': en castellano es ' + tipo(es[k]) + ' y aquí ' + tipo(x[k])); continue; }
    if (tipo(es[k]) === 'lista') {
      if (es[k].length !== x[k].length) fallos.push(r + ': ' + x[k].length + ' elementos en vez de ' + es[k].length);
      es[k].forEach((v, i) => { if (Array.isArray(v) && (!Array.isArray(x[k][i]) || x[k][i].length !== v.length)) fallos.push(r + '[' + i + ']: no tiene ' + v.length + ' partes'); });
    } else if (tipo(es[k]) === 'objeto') compara(es[k], x[k], r + '.', fallos);
    else if (tipo(es[k]) === 'texto' && !String(x[k]).trim() && String(es[k]).trim()) fallos.push(r + ': vacío');
  }
  for (const k of Object.keys(x)) if (!(k in es)) fallos.push('sobra ' + ruta + k + ' (no está en js/textos.js)');
}

// Todas las frases que salen de funciones, con datos de ejemplo. Devuelve [rótulo, texto].
function frases(t) {
  const o = [], pon = (r, v) => o.push([r, String(v)]);
  pon('miles', t.miles(187817)); pon('dec', t.dec(13.4)); pon('pct', t.pct(0.402)); pon('pctEntero', t.pctEntero(17));
  pon('escanos', [1, 2, 38].map(t.escanos).join(' | ')); pon('sies', [1, 2, 176].map(t.sies).join(' | '));
  pon('fecha', ['23 de julio de 2023', '8 de noviembre de 2026', '21 de noviembre de 2026', '2026-11-01'].map(t.fecha).join(' | '));
  pon('provLista', PROV.map((_, i) => t.provLista(i)).join(' · ')); pon('prov', PROV.map((_, i) => t.prov(i)).join(' · '));
  for (const s of ['resultados del 23 de julio de 2023', 'Ministerio del Interior, escrutinio del 23J (datos reunidos en Porra Electoral)',
    'Escrutinio provisional del 29 de noviembre de 2026', 'Ministerio del Interior', '29 nov', '4 dic', '23 dic', 'Sin fecha', '1.ª votación', '48 h después', 'Gobierno',
    'Votación.', 'Escrutinio general: el recuento oficial.', 'Se constituyen el Congreso y el Senado.', 'El Rey consulta a los grupos y propone un candidato.',
    'Hacen falta 176 síes. Arranca el reloj de dos meses.', '2.ª votación: más síes que noes.', 'El Rey nombra al presidente.']) pon('dato', s + '  →  ' + t.dato(s));
  for (const k of [0, 3, 4, 5, 7, 8, 9, 11, 13, 14]) pon('rotulo ' + k, t.rotulo(k, 46, 16, false));
  for (const i of PROVS) {
    const n = PROV[i][1];
    pon('rotulo 1', t.rotulo(1, i, n, false)); pon('rotulo 2', t.rotulo(2, i, n, false)); pon('rotulo 2 (repartido)', t.rotulo(2, i, n, true)); pon('rotulo 10', t.rotulo(10, i, n, false));
    pon('primerEscano', t.primerEscano(i)); pon('provElige', t.provElige(i, n)); pon('apuestaIntro', t.apuestaIntro(i, n));
    pon('habitantes', t.habitantes(i, 45117, 1, 140327)); pon('repartia', t.repartia(i, n));
    const ctx = { i, n, entran: n === 1 ? 1 : n === 2 ? 2 : n >= 16 ? 4 : 3, soria: 2, madrid: 4, primero: 'PSOE' };
    for (const k of [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11]) pon('frase ' + k, t.frase(k, ctx));
  }
  pon('frase 3 (tantos como en Soria)', t.frase(3, { i: 5, n: 3, entran: 2, soria: 2, madrid: 4, primero: '' }));
  pon('frase 3 (tantos como en Madrid)', t.frase(3, { i: 8, n: 32, entran: 4, soria: 2, madrid: 4, primero: '' }));
  pon('frase 10 (sin resultados)', t.frase(10, { i: 5, n: 3, entran: 2, soria: 2, madrid: 4, primero: '' }));
  for (const c of [{ si: 0, abs: 0, no: 350 }, { si: 175, abs: 0, no: 175 }, { si: 120, abs: 10, no: 220 }, { si: 170, abs: 20, no: 160 }, { si: 190, abs: 0, no: 160 }]) pon('rotuloPacto', t.rotuloPacto(c));
  for (const k of [0, 3, 14]) { pon('estacion', t.estacion(k, 8)); pon('donde', t.donde(k, 8, false)); }
  pon('donde (solo texto)', t.donde(3, 8, true));
  pon('ariaApuesta', t.ariaApuesta('A')); for (const q of [0, 1, 5]) pon('resto', t.resto(q));
  pon('dhondtDa', t.dhondtDa(3)); pon('acierto', t.acierto(12, 16));
  pon('repartoPaso', t.repartoPaso(3, 16, 'A', t.dec(20.1), 0)); pon('repartoPaso (fuera de la tabla)', t.repartoPaso(16, 16, 'A', t.dec(5.7), 7)); pon('repartoFin', t.repartoFin('A 7, B 5, C 3, D 1'));
  pon('comparacion', t.comparacion(1, 16)); pon('tamanos', t.tamanos(28, 17, 7)); for (const n of [0, 1, 3]) pon('senMarcadas', t.senMarcadas(n));
  pon('ariaPartido', t.ariaPartido('Coalición Canaria', 1, t.votoLargo.abs)); pon('ariaPartido', t.ariaPartido('PSOE', 110, t.votoLargo.si));
  pon('cuentas', [t.cuentaSi(120), t.cuentaAbs(10), t.cuentaNo(220)].join(' | '));
  for (const si of [176, 175, 120]) pon('primera', t.primera(si));
  pon('segunda', t.segunda(170, 160)); pon('segunda', t.segunda(120, 220));
  pon('anuncioPacto', t.anuncioPacto(170, 20, 160, t.primera(170), t.segunda(170, 160)));
  pon('calcNota', t.calcNota(t.fecha('23 de julio de 2023')));
  // paso 9, frente a 2023 (ver js/equivalencias.js)
  for (const x of [[['PP'], 18, ['Vox'], 13, true], [['PP', 'PSOE'], 3, [], 0, true], [[], 0, ['UPN'], 1, false], [[], 0, [], 0, true], [[], 0, [], 0, false]]) pon('frente2023', t.frente2023(...x));
  pon('lista', [[], ['PP'], ['PP', 'Vox'], ['PP', 'PSOE', 'Vox']].map(t.lista).join(' | '));
  pon('sinCifra', [t.sinCifra.nuevo, t.sinCifra.falta, t.sinCifra.solo2023, t.sinCifra.dentro('Sumar')].join(' | '));
  const sin = [{ nombre: 'Frente Amplio', n: 4 }, { nombre: 'SALF', n: 2 }, { nombre: 'Podemos', n: 1 }], antes = [{ nombre: 'Sumar', n: 6 }];
  for (const [i, e, e23, cambios, iguales, s, a] of [[29, 38, 37, [{ nombre: 'PP', signo: '+1' }, { nombre: 'Vox', signo: '−1' }], ['PSOE'], sin, antes], [12, 8, 9, [{ nombre: 'PSOE', signo: '−1' }], ['PP', 'Vox'], [], [{ nombre: 'Sumar', n: 1 }]],
    [46, 16, 16, [], ['PP', 'PSOE', 'Vox'], [{ nombre: 'Frente Amplio', n: 3 }], [{ nombre: 'Sumar', n: 3 }]], [7, 8, 8, [{ nombre: 'PP', signo: '+2' }], [], [], []], [17, 8, 8, [], [], [], []], [50, 1, 1, [], [], [], []],
    [50, 1, 1, [{ nombre: 'PP', signo: '−1' }, { nombre: 'PSOE', signo: '+1' }], [], [], []], [35, 8, 8, [], ['PSOE'], [], [{ nombre: 'Sumar', n: 1 }, { nombre: 'Nueva Canarias', n: 1 }]]])
    pon('frase2023', t.frase2023(i, { e, e23, cambios, iguales, sin: s, antes: a }));
  pon('avisoPrueba', t.avisoPrueba(t.dato('resultados del 23 de julio de 2023')));
  pon('masEscanos', t.masEscanos('PP', 137, t.pct(0.3306), false)); pon('masEscanos (absoluta)', t.masEscanos('PP', 180, t.pct(0.41), true)); pon('participacion', t.participacion(t.pct(0.664)));
  pon('fuenteRes', t.fuenteRes(true, t.dato('resultados del 23 de julio de 2023'), t.dato('Ministerio del Interior, escrutinio del 23J (datos reunidos en Porra Electoral)')));
  pon('fuenteRes', t.fuenteRes(false, t.dato('Escrutinio provisional del 29 de noviembre de 2026'), t.dato('Ministerio del Interior')));
  pon('ultimo', t.ultimo('PP', 'PSOE', 1340)); pon('unico', t.unico('PP')); pon('votos', t.votos(12500));
  pon('ysiCambia', t.ysiCambia(12500, 'Vox', 'PSOE', 'PSOE')); pon('ysiNoCambia', t.ysiNoCambia(300, 'PP')); pon('sinEscano', t.sinEscano(1234567, t.pct(0.051)));
  pon('loSiguiente', t.loSiguiente(t.dato('Escrutinio general: el recuento oficial.')));
  return o;
}
const sueltos = (t, ruta = '') => Object.entries(t).flatMap(([k, v]) => tipo(v) === 'texto' ? [[ruta + k, v]] : tipo(v) === 'objeto' ? sueltos(v, ruta + k + '.') : tipo(v) === 'lista' ? v.map((x, i) => [ruta + k + '[' + i + ']', Array.isArray(x) ? x.join(' — ') : x]) : []);

let mal = false;
for (const cod of cods) {
  const { textos } = await import(new URL(cod + '.js', dir));
  const fallos = []; compara(ES, textos, '', fallos);
  if (textos.cod !== cod) fallos.push('cod tiene que ser «' + cod + '» y es «' + textos.cod + '»');
  let fr = [];
  try { fr = frases(textos); } catch (e) { fallos.push('una función falla: ' + e.message); }
  const es = fallos.some(f => f.startsWith('una función')) ? [] : frases(ES);
  fr.forEach(([r, v], i) => {
    if (/undefined|NaN|\[object/.test(v)) fallos.push(r + ' escribe «' + v + '»');
    // las mismas cifras que en castellano, sin contar los separadores de miles ni el 1 suelto, que un idioma puede
    // escribir con letra («eserleku bat», «one seat»)
    const nums = s => (s.replace(/<[^>]+>/g, ' ').match(/\d[\d.,  ]*\d|\d/g) || []).map(x => x.replace(/[.,  ]/g, '')).filter(x => x !== '1').sort().join(' ');
    if (es[i] && !/^(dato|fecha|primerEscano|escanos|sies|provLista|prov)$/.test(r) && nums(es[i][1]) !== nums(v)) fallos.push(r + ': no lleva las mismas cifras. «' + es[i][1] + '» / «' + v + '»');
  });
  console.log(cod + (fallos.length ? '  ' + fallos.length + ' problemas' : '  bien') + ' · ' + fr.length + ' frases probadas');
  fallos.forEach(f => console.log('   ' + f));
  if (fallos.length) mal = true;
  if (muestra) { console.log(''); [...sueltos(textos), ...fr].forEach(([r, v]) => console.log(r.padEnd(26) + v)); }
}
process.exit(mal ? 1 : 0);
