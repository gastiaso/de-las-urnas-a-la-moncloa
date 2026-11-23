// Los textos que escribe el JavaScript, en castellano: rótulos del escenario, frases de «Tu voto», calculadoras y resultados.
// Los demás textos están en index.html. Cada idioma tiene su versión de este objeto en js/idiomas/xx.js y su página en xx/,
// que se genera con herramientas/idiomas.py. Para comprobar que a ningún idioma le falta nada: node herramientas/prueba_idiomas.mjs
import { PROV, TITULOS, SEN, GLOS } from './datos.js';

const escanos = n => n + (n === 1 ? ' escaño' : ' escaños');
const sies = n => n + (n === 1 ? ' sí' : ' síes');
const miles = n => Math.round(n).toLocaleString('es-ES');
const dec = x => x.toFixed(1).replace('.', ',');
// Nombre para el texto: «Balears (Illes)» → «Illes Balears», «Coruña (A)» → «A Coruña».
const prov = i => PROV[i][0].replace(/^(.*) \((.*)\)$/, '$2 $1');
const faltan = n => (n === 1 ? 'falta ' : 'faltan ') + sies(n);

export const ES = {
  cod: 'es',      // carpeta del idioma; el castellano está en la raíz
  locale: 'es',   // para ordenar el glosario

  /* números y provincias */
  miles, dec,
  pct: x => dec(x * 100) + ' %',          // de una proporción: 0,402 → «40,2 %»
  pctEntero: n => n + ' %',
  provLista: i => PROV[i][0],             // en los desplegables y en las barras
  prov,                                   // dentro de una frase
  escanos, sies,

  /* textos que en castellano viven en js/datos.js */
  titulos: TITULOS, sen: SEN, glos: GLOS,
  fecha: f => f,   // una fecha escrita como en js/datos.js («23 de julio de 2023»)
  dato: s => s,    // los textos que vienen dentro de js/resultados.js (etiqueta, fuente e hitos)

  /* el escenario */
  ariaEscenario: 'Los 350 escaños del Congreso, que cambian de forma en cada paso. El hexágono dorado es tu voto.',
  // lo que dice el escenario al lector de pantalla en cada paso: texto (rótulo y pie, ya con punto) y marca (T.tuVoto, T.primerEscano o vacío)
  ariaPaso: (texto, marca) => texto + (marca ? ' Hexágono dorado: ' + marca.charAt(0).toLowerCase() + marca.slice(1) + '.' : ''),
  tuVoto: 'Tu voto',
  primerEscano: i => '1.er escaño de ' + prov(i),
  // k: paso; i: provincia; n: sus escaños; revelado: si ya se ha hecho la apuesta del paso 2
  rotulo: (k, i, n, revelado) => ({
    0: '350 escaños: un hexágono por escaño',
    1: prov(i) + ': ' + n + ' de 350',
    2: revelado ? prov(i) + ": así reparte D'Hondt " + (n === 1 ? 'su escaño' : 'sus ' + n) : prov(i) + ': ' + escanos(n) + ' por repartir',
    3: 'Más oscuro: menos habitantes por escaño',
    4: 'Senado: 209 elegidos, cuatro por provincia',
    5: '176 de 350: la mayoría absoluta',
    7: 'El Congreso que elegirá presidente<small>El plazo de dos meses empieza con la primera votación.</small>',
    8: '350 escaños',
    9: 'Cada escaño, del color de quien lo ganó',
    10: prov(i) + ': ' + escanos(n),
    11: 'El Congreso que sale de las urnas',
    13: 'El Congreso que sale de las urnas',
    14: '350 escaños' }[k] || ''),
  // c: { si, abs, no }, en escaños
  rotuloPacto: c => 'Sí ' + c.si + ' · Abst. ' + c.abs + ' · No ' + c.no + '<small>' + (c.si >= 176 ? 'Sale a la primera: 176 síes o más.'
    : c.si > c.no ? 'No llega a 176, pero sale en la segunda votación.'
    : c.si === 0 ? 'Toca los partidos para formar una mayoría.'
    : 'No sale: ' + faltan(176 - c.si) + ' para llegar a 176.') + '</small>',
  piePacto: 'Cada escaño, del color de su partido. Tu voto, aparte: en qué bloque estaría depende de a quién votes.',
  piePactoRes: 'Cada escaño, del color de su partido. Los síes se juntan a la izquierda, luego las abstenciones y luego los noes.',

  /* la frase de «Tu voto» de cada paso. Solo datos que ya están en el texto de los pasos.
     i: provincia; n: sus escaños; entran, soria, madrid: cuántos de los cinco partidos inventados sacan escaño en la provincia,
     con 2 escaños y con 38; primero: el partido que se llevó el primer escaño de la provincia (fase 2) */
  islas: {
    7: 'Mallorca elige tres senadores y se marcan dos nombres; Menorca, Ibiza y Formentera eligen uno cada una',
    35: 'Gran Canaria elige tres senadores y se marcan dos nombres; Lanzarote y Fuerteventura eligen uno cada una',
    39: 'Tenerife elige tres senadores y se marcan dos nombres; La Palma, La Gomera y El Hierro eligen uno cada una' },
  frase(k, { i, n, entran, soria, madrid, primero }) {
    const nom = prov(i), uno = n === 1;
    switch (k) {
      case 0: return 'Tu voto es el hexágono dorado. Elige dónde votas y síguelo hasta el final.';
      case 1: return (uno ? 'Tu voto es el hexágono dorado: es el único escaño de ' + nom + '.' : 'Tu voto es el hexágono dorado: está en ' + nom + ', entre los escaños de tu provincia, en teja.') + ' Tu papeleta blanca, la del Congreso, va a su urna.';
      case 2: return uno ? 'Tu voto se suma a los de tu partido en ' + nom + '. Allí hay un solo escaño: es para el más votado.'
        : 'Tu voto se suma a los de tu partido en ' + nom + ', que solo entra en el reparto si llega al 3 % de los votos válidos.';
      case 3:
        if (uno) return 'En ' + nom + ' hay un solo escaño: con los cinco partidos inventados del paso 2, solo entraría el más votado.';
        if (n === 2 || n === 38) return 'Con los cinco partidos inventados del paso 2, en ' + nom + ' entran <b>' + entran + '</b>. Es uno de los dos extremos de la tabla.';
        return 'Con los cinco partidos inventados del paso 2, los ' + n + ' escaños de ' + nom + ' dan escaño a <b>' + entran + '</b> de ellos: ' + (entran > soria ? 'más que' : 'tantos como') + ' en Soria (' + soria + ') y ' + (entran < madrid ? 'menos que' : 'tantos como') + ' en Madrid (' + madrid + ').';
      case 4:
        if (this.islas[i]) return 'Tu segunda papeleta, la sepia, es la del Senado. En ' + nom + ' depende de tu isla: ' + this.islas[i] + '.';
        if (uno) return 'Tu segunda papeleta, la sepia, es la del Senado. ' + nom + ' pasa de un diputado a <b>dos</b> senadores.';
        return 'Tu segunda papeleta, la sepia, es la del Senado. En el mapa, ' + nom + ' pasa de ' + n + ' diputados a <b>cuatro</b> senadores, como cualquier provincia de la Península.';
      case 5: return (uno ? 'El diputado de ' + nom + ' se sienta' : 'Los ' + n + ' diputados de ' + nom + ' se sientan') + ' con los otros ' + (350 - n) + '. ' + (uno ? 'Tu voto cuenta para ese asiento solo si tu partido es el más votado allí.' : 'Tu voto cuenta para alguno de esos asientos solo si tu partido saca escaño allí.');
      case 6: return (uno ? 'El diputado de ' + nom + ' suele votar con su partido.' : 'Los ' + n + ' diputados de ' + nom + ' suelen votar con su partido.') + ' Tu voto queda aparte, debajo del hemiciclo: en qué bloque estaría depende de a quién votes.';
      case 7: return 'La noche del 29N, tu papeleta se cuenta en tu mesa de ' + nom + ', en público y en voz alta.';
      case 8: return 'Ese es el camino de tu papeleta en ' + nom + ': de la urna a la Moncloa.';
      case 10: return primero ? 'El hexágono dorado es el primer escaño que se repartió en ' + nom + ': fue para <b>' + primero + '</b>.' : '';
      case 11: case 12: return primero ? 'El hexágono dorado es el primer escaño de ' + nom + ': fue para <b>' + primero + '</b>, el partido más votado allí.' : '';
      default: return '';
    }
  },

  /* navegación */
  estacion: (k, ultima) => k === 0 ? 'Salida' : k === 14 ? 'La Moncloa' : 'Paso ' + k + ' de ' + ultima,
  donde: (k, ultima, lectura) => lectura ? 'Índice' : k === 0 ? 'Salida' : k === 14 ? 'La Moncloa' : 'Paso ' + k + ' de ' + ultima,
  dondeVotas: '¿Dónde votas?',
  tocaMapa: 'También puedes tocar tu provincia en el mapa.',
  fase2Cerrada: 'Los pasos 9 a 13 se abren el 30N, con los resultados.',
  abre30N: '30N',   // junto a cada paso cerrado, en el menú
  sigueMiVoto: 'Sigue mi voto: ',
  irResultados: 'Ir a los resultados: ',   // fase 2: atajo de la salida al paso 9
  siguiente: 'Siguiente: ',
  verEscanos: 'Volver a los 350 escaños',
  verTexto: 'Ver solo el texto',
  tapa: {
    banda: 'Elecciones generales · 29 de noviembre de 2026',
    titulo: 'De las urnas a la Moncloa',
    sub: 'Millones de papeletas se convierten en 350 escaños, y los escaños, en un Gobierno. Así funciona.',
    como: 'Cómo se sigue',
    pasos: ['Elige la provincia en la que votas.', 'Baja: en cada paso, los 350 escaños cambian de forma.', 'Tu voto es el hexágono dorado: síguelo hasta el final.'],
    boton: 'Clica aquí para empezar',
    texto: 'o lee solo el texto' },

  /* paso 1 */
  provElige: (i, n) => prov(i) + ' elige ' + escanos(n) + ' de los 350.',
  // en el recuadro «Tu voto» del paso 1, si no se ha elegido provincia; a y b envuelven el enlace al desplegable
  cambiaProv: (i, a, b) => '¿No votas en ' + prov(i) + '? ' + a + 'Cámbiala aquí debajo' + b + '.',

  /* paso 2: la apuesta y la tabla de divisiones */
  apuestaIntro: (i, n) => prov(i) + ' reparte ' + escanos(n) + ' entre cinco partidos inventados. ¿Cuántos le das a cada uno?',
  ariaApuesta: letra => 'Escaños para el partido ' + letra,
  resto: q => q === 0 ? 'Todo repartido.' : q === 1 ? 'Te queda 1 escaño por repartir.' : 'Te quedan ' + q + ' escaños por repartir.',
  tuApuesta: 'Tu apuesta',   // sobre la columna de cifras
  dhondtDa: (n, tuyo) => "D'Hondt: " + n + ' · tú: ' + tuyo,   // tras apostar: lo que da D'Hondt y lo que apostaste
  acierto: (aciertos, total) => 'Has acertado ' + aciertos + ' de ' + total + '.',
  partido: 'Partido',
  fuera: ' (fuera)',
  // escaño número «orden» de «total», para el partido «letra» con el cociente ya escrito; division: si la casilla no cabe en la tabla, cuál es
  repartoPaso: (orden, total, letra, cociente, division) => 'Escaño ' + orden + ' de ' + total + ': para ' + letra + ', con ' + cociente + (division ? ' (división ÷' + division + ', fuera de la tabla).' : '.'),
  repartoEmpieza: 'Empieza el reparto…',
  repartoFin: lista => 'Reparto terminado: ' + lista + '.',

  /* paso 3 */
  habitantes: (i, porEscano, puesto, media) => 'En ' + prov(i) + ' hay un escaño por cada ' + miles(porEscano) + ' habitantes (puesto ' + puesto + ' de 52, de menos a más). La media de España es uno por cada ' + miles(media) + '.',
  comparacion: (soria, madrid) => soria + ' de 2 en Soria · ' + madrid + ' de 38 en Madrid',
  tamanos: (pequenas, medianas, grandes) => 'De las 52 circunscripciones, ' + pequenas + ' reparten cinco escaños o menos, ' + medianas + ' reparten entre seis y nueve y solo ' + grandes + ' reparten diez o más.',

  /* paso 4 */
  senTope: 'Solo tres. Quita una marca para cambiarla.',
  senMarcadas: n => 'Has marcado ' + n + ' de 3.',

  /* paso 7: la etiqueta junto a lo que pasa hoy o, si hoy no hay nada, junto a lo siguiente */
  calHoy: 'hoy',
  calSiguiente: 'lo siguiente',

  /* calculadoras de pactos (pasos 6 y 12) */
  voto: { no: 'No', si: 'Sí', abs: 'Abst.' },
  votoLargo: { no: 'no', si: 'sí', abs: 'abstención' },
  ariaBarra: 'Barra de 350 escaños con la marca de 176',
  votacion1: '1.ª votación · mayoría absoluta',
  votacion2: '2.ª votación · más síes que noes',
  copiar: 'Copiar enlace a esta combinación',
  compartirComb: 'Compartir esta combinación',   // en el móvil, con la hoja de compartir del teléfono
  // quien llega por un enlace con una combinación y sin haber elegido provincia; a y b envuelven el enlace a la salida
  enviada: (a, b) => 'Te han enviado esta combinación. Cámbiala o ' + a + 'empieza por el principio' + b + '.',
  copiado: 'Enlace copiado.',
  copiaManual: 'Copia la dirección del navegador: ya lleva la combinación.',
  copiaDireccion: 'Copia la dirección del navegador',   // botón «Compartir», si no se puede copiar sola
  ariaPartido: (nombre, n, voto) => nombre + ', ' + escanos(n) + ', vota ' + voto + '. Toca para cambiar',
  cuentaSi: n => 'Sí: ' + n,
  cuentaAbs: n => 'Abst.: ' + n,
  cuentaNo: n => 'No: ' + n,
  primera: si => si >= 176 ? 'Sale: tiene ' + si + ' síes.' : 'No sale: ' + faltan(176 - si) + '.',
  segunda: (si, no) => (si > no ? 'Sale: ' : 'No sale: ') + si + ' síes frente a ' + no + ' noes.',
  anuncioPacto: (si, abs, no, primera, segunda) => 'Sí ' + si + ', abstención ' + abs + ', no ' + no + '. Primera votación: ' + primera + ' Segunda: ' + segunda,
  // fecha: la de las elecciones de las que salen los escaños del paso 6, ya escrita en el idioma (T.fecha)
  calcNota: fecha => 'Escaños que cada partido sacó en las elecciones del ' + fecha + ', las últimas antes del 29N. No es una encuesta ni un resultado del 29N.',

  /* fase 2: los resultados */
  avisoPrueba: etiqueta => 'Vista previa con datos de prueba: ' + etiqueta + '. No son los resultados del 29N.',
  masEscanos: (nombre, n, pctVotos, absoluta) => nombre + ' es el partido con más escaños: ' + n + ', con el ' + pctVotos + ' de los votos. ' + (absoluta ? 'Supera los 176 de la mayoría absoluta.' : 'Ningún partido llega solo a los 176 de la mayoría absoluta.'),
  participacion: p => ' Votó el ' + p + ' del censo.',
  thVotos: 'Votos',
  thEscanos: 'Escaños',
  thPorEscano: 'Votos por escaño',
  fuenteRes: (prueba, etiqueta, fuente) => (prueba ? 'Datos de prueba: ' : '') + etiqueta + '. Fuente: ' + fuente + '. Los escaños se calculan aquí con los votos de cada provincia.',
  repartia: (i, n) => prov(i) + ' repartía ' + escanos(n) + '.',
  ultimo: (ganador, rival, votos) => 'El último escaño fue para ' + ganador + '. A ' + rival + ' le faltaron ' + miles(votos) + ' votos para quitárselo.',
  unico: ganador => 'El escaño fue para ' + ganador + '.',
  votos: n => miles(n) + ' votos',
  ysiIguales: 'Elige dos partidos distintos.',
  ysiCambia: (n, de, a, ultimo) => 'Con ' + miles(n) + ' votos de ' + de + ' a ' + a + ', cambia el reparto. El último escaño sería para ' + ultimo + '.',
  ysiNoCambia: (n, ultimo) => 'Con ' + miles(n) + ' votos, el reparto no cambia. El último escaño sigue siendo para ' + ultimo + '.',
  votosYEscanos: 'El porcentaje de escaños de un partido casi nunca coincide con su porcentaje de votos.',
  sinEscano: (n, p) => miles(n) + ' votos (' + p + ') fueron a candidaturas que no lograron escaño en su provincia.',
  loSiguiente: t => 'Lo siguiente: ' + t.charAt(0).toLowerCase() + t.slice(1),
  calendarioCompleto: 'El calendario está completo.'
};

// Los textos en uso. La página de cada idioma carga antes su js/idiomas/xx.js, que llama a idioma() con los suyos.
export const T = { ...ES };
export function idioma(textos) { Object.assign(T, textos); }

// Para los demás idiomas: descompone una fecha escrita en castellano («8 de noviembre de 2026») o como 2026-11-08.
// Devuelve { d, m, a }, con el mes de 1 a 12, o null si no la entiende.
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export function parteFecha(f) {
  let x = /^(\d{4})-(\d\d)-(\d\d)$/.exec(f);
  if (x) return { d: +x[3], m: +x[2], a: +x[1] };
  x = /^(\d{1,2}) de ([a-zé]+) de (\d{4})$/i.exec(String(f).trim());
  const m = x ? MESES.indexOf(x[2].toLowerCase().replace('setiembre', 'septiembre')) + 1 : 0;
  return m ? { d: +x[1], m, a: +x[3] } : null;
}
