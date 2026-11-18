// Posiciones de un hemiciclo de n asientos en filas concéntricas, ordenados de izquierda a derecha.
// Radio exterior 1; x de -1 a 1, z de -1 a 0 (z hacia abajo, como en pantalla). La misma regla que la escena 3D.
export function hemi(n, filas = 10) {
  const radios = [...Array(filas)].map((_, i) => 0.95 + 1.7 * i / (filas - 1)), suma = radios.reduce((a, b) => a + b, 0), R = 2.65 + 0.12;
  const cuantos = radios.map(r => Math.round(n * r / suma)); cuantos[filas - 1] += n - cuantos.reduce((a, b) => a + b, 0);
  const pts = [];
  radios.forEach((r, i) => { for (let j = 0; j < cuantos[i]; j++) { const t = Math.PI * (1 - (j + 0.5) / cuantos[i]); pts.push({ x: r * Math.cos(t) / R, z: -r * Math.sin(t) / R, t }); } });
  return pts.sort((a, b) => b.t - a.t);
}
// Lado de cada asiento (en las mismas unidades), para que no se pisen.
export const LADO_HEMI = 0.05;
