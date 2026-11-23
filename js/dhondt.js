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
  // Lo que le falta a cada partido: votos para que su siguiente división supere a la del último escaño (en enteros, sin
  // redondeos; a igual división gana el que tiene más votos en total, art. 163.1.d) y, si no llega a la barrera, también
  // los que necesita para pasarla. Cuenta a todos los que se presentan, no solo a los que pasan la barrera.
  let rival = null;
  if (ultimo) {
    const u = votos.find(p => p.id === ultimo.id), su = seats[u.id];
    for (const p of votos) {
      if (p.id === ultimo.id || !(p.v > 0)) continue;
      const d = u.v * (seats[p.id] + 1) - p.v * su;   // lo que le falta, multiplicado por los escaños del último
      let faltan = d % su === 0 && p.v + d / su > u.v ? d / su : Math.floor(d / su) + 1;
      if (!dentro.includes(p)) faltan = Math.max(faltan, hastaBarrera(p.v, validos, barrera));
      if (!rival || faltan < rival.faltan) rival = { id: p.id, faltan };
    }
  }
  return { seats, order, ultimo, rival, dentro: dentro.map(p => p.id) };
}

// Votos que le faltan a un partido para llegar a la barrera. Al sumárselos también crecen los válidos, y con ellos la barrera.
function hastaBarrera(v, validos, barrera) {
  let x = Math.max(0, Math.ceil((barrera * validos - v) / (1 - barrera)));
  while ((v + x) / (validos + x) < barrera) x++;
  while (x > 0 && (v + x - 1) / (validos + x - 1) >= barrera) x--;
  return x;
}

// El mismo reparto con los cinco partidos inventados de la fase 1 (sus porcentajes hacen de votos).
export const dhondt = escanos => reparto(escanos, PART.map(p => ({ id: p[0], v: p[1] })), 100);
