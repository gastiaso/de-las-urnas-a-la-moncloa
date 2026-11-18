import { PART } from './datos.js';

// Reparto D'Hondt de una circunscripción (LOREG, art. 163).
//   votos: [{ id, v }]; validos: votos a candidaturas más votos en blanco; barrera: 3 % de los válidos.
// Devuelve los escaños de cada partido, el orden en que se adjudican, quién se lleva el último
// y a qué partido le faltaron menos votos para quitárselo.
export function reparto(escanos, votos, validos, barrera = 0.03) {
  const dentro = votos.filter(p => p.v > 0 && p.v / validos >= barrera);
  const seats = {}; votos.forEach(p => { seats[p.id] = 0; });
  const order = []; let ultimo = null;
  for (let i = 0; i < escanos; i++) {
    let mejor = null, q = -1;
    for (const p of dentro) { const c = p.v / (seats[p.id] + 1); if (c > q || (c === q && mejor && p.v > mejor.v)) { q = c; mejor = p; } }
    if (!mejor) break;
    seats[mejor.id]++; order.push(mejor.id); ultimo = { id: mejor.id, q };
  }
  let rival = null;
  if (ultimo) for (const p of dentro) {
    if (p.id === ultimo.id) continue;
    const faltan = Math.floor(ultimo.q * (seats[p.id] + 1) - p.v) + 1;
    if (!rival || faltan < rival.faltan) rival = { id: p.id, faltan };
  }
  return { seats, order, ultimo, rival, dentro: dentro.map(p => p.id) };
}

// El mismo reparto con los cinco partidos inventados de la fase 1 (sus porcentajes hacen de votos).
export const dhondt = escanos => reparto(escanos, PART.map(p => ({ id: p[0], v: p[1] })), 100);
