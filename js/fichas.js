// Iconos de las estaciones, con el estilo del mapa: trazo fino de tinta, tonos planos de papel y teja de acento.
// Cada uno es un SVG de 48 × 48. ICONO[k] da el de la casilla k.
const T = '#2B2118', TEJA = '#9C3D25', PAPEL = '#F5F3EE', ARENA = '#E6D6B4', GRIS = '#D9D5CB', SALVIA = '#D2D9C4', ROSA = '#EAD6CB', ORO = '#E0A526';
const L = 'stroke="' + T + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
const svg = c => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">' + c + '</svg>';
// hexágono con vértice arriba, como los del mapa
const hex = (x, y, r, f, extra = '') => {
  const p = []; for (let k = 0; k < 6; k++) { const a = (60 * k - 90) * Math.PI / 180; p.push((x + r * Math.cos(a)).toFixed(2) + ',' + (y + r * Math.sin(a)).toFixed(2)); }
  return '<polygon points="' + p.join(' ') + '" fill="' + f + '" ' + L + ' ' + extra + '/>';
};

export const FICHAS = {
  sobre: svg('<rect x="7" y="13" width="34" height="23" rx="1.5" fill="' + PAPEL + '" ' + L + '/><path d="M7.8 14 L24 26.5 L40.2 14" fill="none" ' + L + '/><path d="M7.8 35.2 L19.5 23 M40.2 35.2 L28.5 23" fill="none" ' + L + ' stroke-width="1.1"/>' + hex(24, 27, 3.4, TEJA)),
  urna: svg('<g transform="rotate(-8 25 12)"><rect x="17" y="4" width="15" height="13" fill="' + PAPEL + '" ' + L + '/>' + hex(24.5, 10.5, 2.6, TEJA) + '</g><rect x="9" y="20" width="30" height="5" fill="' + GRIS + '" ' + L + '/><rect x="18" y="21.8" width="12" height="1.6" fill="' + T + '"/><rect x="11" y="25" width="26" height="18" fill="' + ARENA + '" ' + L + '/>' + hex(24, 34, 4.2, PAPEL)),
  escano: svg(hex(24, 24, 19, ROSA) + '<path d="M17 15 h14 a2 2 0 0 1 2 2 v11 h-18 v-11 a2 2 0 0 1 2 -2 z" fill="' + TEJA + '" ' + L + '/><rect x="13" y="27" width="22" height="5" rx="1.5" fill="' + TEJA + '" ' + L + '/><path d="M16 32 v5 M32 32 v5" ' + L + '/>'),
  mapa: svg(hex(24, 24, 7, TEJA) + hex(36.1, 24, 7, ARENA) + hex(11.9, 24, 7, SALVIA) + hex(30.05, 13.5, 7, GRIS) + hex(17.95, 13.5, 7, PAPEL) + hex(30.05, 34.5, 7, PAPEL) + hex(17.95, 34.5, 7, ROSA)),
  papeleta: svg('<rect x="11" y="5" width="26" height="38" fill="' + ARENA + '" ' + L + '/><path d="M15 10 h12" ' + L + '/>' + [17, 26, 35].map((y, i) => '<rect x="15" y="' + (y - 3) + '" width="6" height="6" fill="' + PAPEL + '" ' + L + ' stroke-width="1.2"/><path d="M24 ' + y + ' h9" ' + L + ' stroke-width="1.2"/>' + (i === 1 ? '<path d="M15.8 ' + (y - 2.2) + ' l4.4 4.4 M20.2 ' + (y - 2.2) + ' l-4.4 4.4" stroke="' + TEJA + '" stroke-width="1.8" stroke-linecap="round"/>' : '')).join('')),
  hemiciclo: svg((() => { let s = ''; [[19, 9], [14, 7], [9, 5]].forEach(([r, n]) => { for (let j = 0; j < n; j++) { const t = Math.PI * (1 - (j + 0.5) / n), x = 24 + r * Math.cos(t), y = 38 - r * Math.sin(t); s += hex(x, y, 2.6, x < 24 ? TEJA : GRIS, 'stroke-width="1"'); } }); return s; })() + '<path d="M3 41.5 h42" ' + L + '/>'),
  balanza: svg('<path d="M24 9 v29" ' + L + ' stroke-width="2.2"/><rect x="15" y="38" width="18" height="4.5" rx="1.5" fill="' + GRIS + '" ' + L + '/><path d="M8 13 h32" ' + L + ' stroke-width="2"/>' + hex(24, 10, 3, ORO) +
    '<path d="M9 13 l-5 13 M9 13 l5 13 M39 13 l-5 13 M39 13 l5 13" ' + L + ' stroke-width="1.1"/><path d="M3 26 h12 a6 4.5 0 0 1 -12 0 z" fill="' + TEJA + '" ' + L + '/><path d="M33 26 h12 a6 4.5 0 0 1 -12 0 z" fill="' + PAPEL + '" ' + L + '/>'),
  reloj: svg('<rect x="12" y="5" width="24" height="4.5" rx="1.5" fill="' + GRIS + '" ' + L + '/><rect x="12" y="38.5" width="24" height="4.5" rx="1.5" fill="' + GRIS + '" ' + L + '/><path d="M15 9.5 h18 v4 c0 6 -6.5 7.5 -6.5 10.5 c0 3 6.5 4.5 6.5 10.5 v4 h-18 v-4 c0 -6 6.5 -7.5 6.5 -10.5 c0 -3 -6.5 -4.5 -6.5 -10.5 z" fill="' + PAPEL + '" ' + L + '/><path d="M17.5 14 h13 c-1 3.5 -4.5 5 -6.5 6.8 c-2 -1.8 -5.5 -3.3 -6.5 -6.8 z" fill="' + ARENA + '"/><path d="M17 38 c0 -4.5 4 -6.5 7 -6.5 c3 0 7 2 7 6.5 z" fill="' + TEJA + '"/>'),
  meta: svg('<path d="M12 43 V6" ' + L + ' stroke-width="2"/><path d="M12 7 h26 l-5 7 l5 7 h-26 z" fill="' + PAPEL + '" ' + L + '/>' + hex(19, 12, 2.6, TEJA, 'stroke-width="1"') + hex(25, 15.5, 2.6, ARENA, 'stroke-width="1"') + hex(31, 12, 2.6, TEJA, 'stroke-width="1"') + '<path d="M6 43 h14" ' + L + '/>'),
  lupa: svg(hex(16, 18, 5, ARENA, 'stroke-width="1"') + hex(24.6, 18, 5, TEJA, 'stroke-width="1"') + hex(20.3, 25.5, 5, SALVIA, 'stroke-width="1"') + '<circle cx="20.5" cy="21.5" r="13" fill="none" ' + L + ' stroke-width="2"/><path d="M30 31 l11 11" ' + L + ' stroke-width="4"/>'),
  moncloa: svg('<path d="M5 18 L24 7 L43 18 Z" fill="' + ARENA + '" ' + L + '/><rect x="8" y="18" width="32" height="3.5" fill="' + GRIS + '" ' + L + '/>' + [12, 20, 28, 36].map(x => '<rect x="' + (x - 1.6) + '" y="21.5" width="3.2" height="15" fill="' + PAPEL + '" ' + L + ' stroke-width="1.2"/>').join('') + '<rect x="6" y="36.5" width="36" height="4" fill="' + GRIS + '" ' + L + '/>' + hex(24, 13.5, 2.4, TEJA, 'stroke-width="1"'))
};
// Icono de cada casilla (0 = salida, 14 = La Moncloa).
export const ICONO = ['sobre', 'urna', 'escano', 'mapa', 'papeleta', 'hemiciclo', 'balanza', 'reloj', 'meta', 'lupa', 'mapa', 'hemiciclo', 'balanza', 'reloj', 'moncloa'].map(n => FICHAS[n]);
