// Paso 9, «Frente a 2023»: con qué candidatura de las generales de 2023 se compara cada partido del 29N.
// Se edita a mano. La clave es el id del partido en herramientas/resultados.py (META); «ref», su id en
// js/referencia_2023.js (PP, PSOE, VOX, SUMAR, ERC, JUNTS, BILDU, PNV, BNG, CC, UPN).
//
// tipo:
//   'igual'   la misma candidatura que en 2023: se restan los escaños.
//   'cambio'  la que ocupa su sitio, con otra composición: se restan, y una nota lo dice.
//   'sin'     se presentó en 2023 y no sacó escaño: cuenta 0 en 2023.
//   'dentro'  en 2023 iba dentro de otra candidatura («ref»): no hay cifra propia de 2023.
//   'nuevo'   no se presentó en 2023: no hay cifra de 2023.
// nota: la clave de una nota de T.notas2023 (js/textos.js y js/idiomas/xx.js), que sale con un asterisco.
// Un partido que no esté aquí sale «sin equivalente en 2023», sin cifra: nunca se inventa una.
// Dos partidos no pueden restar contra el mismo de 2023: si pasa, el segundo sale sin cifra (y la consola lo avisa).
// Un partido de 2023 con escaños que nadie toma como referencia sale aparte, solo con sus escaños de 2023.
import { REF2023 } from './referencia_2023.js';

// Frente Amplio frente a Sumar: lo decide Guillermo. Basta con cambiar la letra.
//   'a'  Frente Amplio se compara con los 31 escaños de Sumar en 2023, con una nota: Sumar incluía a Podemos.
//   'b'  Frente Amplio sale sin cifra de 2023, como candidatura nueva; los 31 de Sumar salen aparte, sin equivalente el 29N.
export const FA_FRENTE_A_SUMAR = 'b';

export const EQUIV = {
  PP: { ref: 'PP', tipo: 'igual' },
  PSOE: { ref: 'PSOE', tipo: 'igual' },     // con el PSC, como en 2023
  VOX: { ref: 'VOX', tipo: 'igual' },
  ERC: { ref: 'ERC', tipo: 'igual' },
  JUNTS: { ref: 'JUNTS', tipo: 'igual' },
  BILDU: { ref: 'BILDU', tipo: 'igual' },
  PNV: { ref: 'PNV', tipo: 'igual' },
  BNG: { ref: 'BNG', tipo: 'igual' },
  CC: { ref: 'CC', tipo: 'igual' },
  UPN: { ref: 'UPN', tipo: 'igual' },       // el 29N, UPN-PP cuenta como PP (datos/siglas.csv): sin votos propios, UPN sale «sin equivalente el 29N»
  FA: { a: { ref: 'SUMAR', tipo: 'cambio', nota: 'faSumar' }, b: { tipo: 'nuevo', nota: 'faNuevo' } }[FA_FRENTE_A_SUMAR],
  // Para los datos de prueba del 23J. El 29N no se espera ninguna candidatura con este id (datos/siglas.csv, en cotejo-29N);
  // si la hubiera, no sería la coalición de 2023: revisar esta línea antes de publicar.
  SUMAR: { ref: 'SUMAR', tipo: 'cambio', nota: 'sumar' },
  POD: { ref: 'SUMAR', tipo: 'dentro', nota: 'podemos' },
  AA: { tipo: 'sin', nota: 'aa' },          // en 2023, solo en Cádiz: 9.191 votos, sin escaño (Interior, 02202307_TOTA.zip)
  SALF: { tipo: 'nuevo', nota: 'salf' }     // ni SALF ni Frente Amplio están entre las candidaturas de 2023 (mismo fichero)
};

/* ---------- el cálculo: no hace falta tocarlo ---------- */
const GRIS = '#D2CDC2';
const de2023 = new Map(REF2023.partidos.map(x => [x.id, x]));
const conCifra = t => t === 'igual' || t === 'cambio';

// Escaños de 2023 por id: de toda España o, con el nombre de una provincia (el de js/datos.js), de esa provincia.
// En la provincia devuelve también cuántos escaños repartía (e).
export const escanos2023 = nombre => {
  if (!nombre) return { e: 350, esc: Object.fromEntries(REF2023.partidos.map(x => [x.id, x.esc])) };
  const r = REF2023.prov.find(x => x.n === nombre);
  return { e: r.e, esc: Object.fromEntries(REF2023.partidos.map((x, j) => [x.id, r.s[j]])) };
};

// Empareja los partidos del 29N (los de js/resultados.js) con los de 2023.
export function empareja(partidos) {
  const usados = new Set(), eq = {};
  partidos.forEach(q => {
    let e = EQUIV[q.id] || { tipo: 'falta' };
    if (e.ref && !de2023.has(e.ref)) e = { tipo: 'falta' };
    if (conCifra(e.tipo) && usados.has(e.ref)) { console.warn('Equivalencias: ' + e.ref + ' de 2023 ya tiene pareja; ' + q.id + ' sale sin cifra.'); e = { tipo: 'falta' }; }
    if (conCifra(e.tipo)) usados.add(e.ref);
    eq[q.id] = e;
  });
  return { eq, huerfanos: REF2023.partidos.filter(x => !usados.has(x.id)) };
}

// Una fila por partido con escaños en alguna de las dos elecciones, de más a menos escaños.
//   ahora: { id del 29N: escaños }; antes: { id de 2023: escaños }.
//   Fila: { nombre, color, ahora, antes, dif, tipo, ref (nombre del partido de 2023), nota }. ahora es null en los partidos
//   de 2023 sin pareja (tipo 'solo2023'); antes y dif son null cuando no hay cifra de 2023 con la que comparar.
export function compara(partidos, { eq, huerfanos }, ahora, antes) {
  const filas = partidos.map(q => {
    const e = eq[q.id], hay = conCifra(e.tipo) || e.tipo === 'sin', n = ahora[q.id] || 0, a = !hay ? null : e.tipo === 'sin' ? 0 : antes[e.ref] || 0;
    return { nombre: q.nombre, color: q.color, ahora: n, antes: a, dif: hay ? n - a : null, tipo: e.tipo, ref: e.ref ? de2023.get(e.ref).nombre : '', nota: e.nota };
  }).filter(f => f.ahora > 0 || f.antes > 0);
  huerfanos.forEach(x => { if (antes[x.id] > 0) filas.push({ nombre: x.nombre, color: GRIS, ahora: null, antes: antes[x.id], dif: null, tipo: 'solo2023', ref: '' }); });
  return filas.sort((a, b) => (b.ahora ?? -1) - (a.ahora ?? -1) || (b.antes ?? -1) - (a.antes ?? -1));
}

export const signo = d => d > 0 ? '+' + d : d < 0 ? '−' + -d : '0';

// Para la frase de arriba (T.frente2023): los que más escaños ganan y los que más pierden.
export function extremos(filas) {
  const con = filas.filter(f => f.dif !== null), mas = Math.max(0, ...con.map(f => f.dif)), menos = -Math.min(0, ...con.map(f => f.dif));
  return { gana: mas ? con.filter(f => f.dif === mas).map(f => f.nombre) : [], mas, pierde: menos ? con.filter(f => f.dif === -menos).map(f => f.nombre) : [], menos,
    todos: filas.every(f => f.dif !== null) };
}

// Para la frase de «Tu voto» (T.frase2023): lo que cambia en una provincia. e, e23: escaños que reparte ahora y en 2023.
export function resumen(filas, e, e23) {
  return { e, e23,
    cambios: filas.filter(f => f.dif).map(f => ({ nombre: f.nombre, signo: signo(f.dif) })),
    sin: filas.filter(f => f.dif === null && f.ahora > 0).map(f => ({ nombre: f.nombre, n: f.ahora })),
    antes: filas.filter(f => f.tipo === 'solo2023').map(f => ({ nombre: f.nombre, n: f.antes })),
    iguales: filas.filter(f => f.dif === 0 && f.ahora > 0).map(f => f.nombre) };
}
