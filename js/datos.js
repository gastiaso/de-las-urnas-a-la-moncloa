// Datos del sitio. Cada cifra lleva su fuente en docs/guion.md.

// Escaños del Congreso por circunscripción: anexo del Real Decreto 806/2026 (BOE-A-2026-20742). Suman 350.
export const PROV = [["Albacete",4],["Alicante/Alacant",12],["Almería",6],["Araba/Álava",4],["Asturias",7],["Ávila",3],["Badajoz",5],["Balears (Illes)",8],["Barcelona",32],["Bizkaia",8],["Burgos",4],["Cáceres",4],["Cádiz",8],["Cantabria",5],["Castellón/Castelló",5],["Ciudad Real",5],["Córdoba",6],["Coruña (A)",8],["Cuenca",3],["Gipuzkoa",6],["Girona",6],["Granada",7],["Guadalajara",3],["Huelva",5],["Huesca",3],["Jaén",5],["León",4],["Lleida",4],["Lugo",4],["Madrid",38],["Málaga",11],["Murcia",10],["Navarra",5],["Ourense",4],["Palencia",3],["Palmas (Las)",8],["Pontevedra",7],["Rioja (La)",4],["Salamanca",4],["Santa Cruz de Tenerife",7],["Segovia",3],["Sevilla",12],["Soria",2],["Tarragona",6],["Teruel",3],["Toledo",6],["Valencia/València",16],["Valladolid",5],["Zamora",3],["Zaragoza",7],["Ceuta",1],["Melilla",1]];
export const PROV_INICIAL = 46; // Valencia/València

// Población de cada circunscripción, en el mismo orden que PROV: cifras oficiales del padrón a 1 de enero de 2025,
// Real Decreto 1117/2025, anexo (BOE-A-2025-25362). Con ellas, la regla del art. 162 de la LOREG reproduce el anexo del decreto.
export const POB = [390406, 2030037, 773577, 342161, 1013529, 159887, 663886, 1237480, 5983325, 1166816, 361556, 387752, 1257041, 593964, 627173, 494407, 772153, 1135612, 198216, 733365, 832026, 942618, 285390, 535703, 230624, 617604, 446771, 456106, 325759, 7137031, 1791092, 1589138, 683500, 305573, 158687, 1167555, 946225, 327286, 328779, 1082421, 158470, 1976624, 90234, 874808, 136197, 750815, 2758633, 528841, 165275, 991991, 83595, 86780];

// Partidos inventados para explicar el reparto: [letra, % de voto, color, color del texto]
// Los colores no repiten el tono y el puesto de ningún partido real, y ninguno se parece al dorado de «tu voto».
export const PART = [['A', 40.2, '#7A4B5E', '#fff'], ['B', 31.0, '#7FA39B', '#2B2118'], ['C', 17.2, '#2F4B5C', '#fff'], ['D', 9.2, '#56663F', '#fff'], ['E', 2.4, '#6A645C', '#fff']];

// Color de cada partido: los habituales, algo apagados para que convivan con la paleta del sitio (los mismos que usa
// herramientas/resultados.py en la fase 2). Son provisionales.
export const COLOR_PARTIDO = { Bildu: '#7C9440', ERC: '#D9A62E', AA: '#3E7C59', FA: '#B4527A', Sumar: '#B4527A', BNG: '#86AFCF', PSOE: '#B5382E',
  PNV: '#2E6B4A', CC: '#E3CC6B', Junts: '#2A9D97', UPN: '#8C5A3C', PP: '#2F5D8C', Vox: '#5F9E3A' };

// Calculadora de pactos del paso 6: los escaños que salieron de las elecciones del 23 de julio de 2023, proclamados por la
// Junta Electoral Central (BOE-A-2023-18907; los 121 del PSOE incluyen los 19 del PSC). Son un resultado, no una encuesta,
// así que no hay nada que congelar durante la veda. Van de izquierda a derecha del hemiciclo, como en herramientas/resultados.py.
// Los escaños del 29N se ven en el paso 12, cuando se abre la fase 2.
export const CONGRESO_2023 = {
  fecha: '23 de julio de 2023',
  partidos: [['Bildu', 'EH Bildu', 6], ['ERC', 'ERC', 7], ['Sumar', 'Sumar', 31], ['BNG', 'BNG', 1], ['PSOE', 'PSOE', 121], ['PNV', 'PNV', 5],
    ['CC', 'Coalición Canaria', 1], ['Junts', 'Junts', 7], ['UPN', 'UPN', 1], ['PP', 'PP', 137], ['Vox', 'Vox', 33]]
};

// Casillas 0 a 8: fase 1 (las reglas). 9 a 13: fase 2 (los resultados), cerradas hasta el 30N. 14: la meta.
export const TITULOS = ['Salida', 'Qué se vota', 'Del voto al escaño', 'Dónde votas', 'El Senado', 'Las mayorías', 'Pactos', 'Del 29N al Gobierno', 'Cierre',
  'Qué ha pasado', 'En tu provincia', 'Votos y escaños', '¿Quién gobierna?', 'Lo que viene', 'La Moncloa'];
export const SEN = ['Persona 1 · Partido A', 'Persona 2 · Partido A', 'Persona 3 · Partido A', 'Persona 4 · Partido B', 'Persona 5 · Partido B', 'Persona 6 · Partido C'];

export const GLOS = {
  escano: ['Escaño', 'Cada uno de los 350 asientos del Congreso. Quien lo ocupa es diputado o diputada.'],
  circ: ['Circunscripción', 'La zona en la que se cuentan los votos y se reparten los escaños. En las generales es la provincia; Ceuta y Melilla son una cada una.'],
  dhondt: ["Regla D'Hondt", 'La forma de repartir los escaños de cada provincia: se dividen los votos de cada partido entre 1, 2, 3… y los escaños van a los resultados más altos.'],
  barrera: ['Barrera electoral', 'El mínimo para entrar en el reparto: el 3 % de los votos válidos de la provincia.'],
  blanco: ['Voto en blanco', 'Un sobre sin papeleta. Es un voto válido: no va a ningún partido, pero cuenta en el total.'],
  nulo: ['Voto nulo', 'Un voto que no vale: por ejemplo, una papeleta con tachaduras o añadidos, o un sobre que no es el oficial.'],
  absoluta: ['Mayoría absoluta', 'Más de la mitad de todos los diputados, voten o no: 176 de 350.'],
  simple: ['Mayoría simple', 'Más votos a favor que en contra. Las abstenciones no cuentan.'],
  investidura: ['Investidura', 'La votación en la que el Congreso da su confianza a un candidato a presidente del Gobierno.'],
  abstencion: ['Abstención', 'Ni sí ni no. No suma a favor, pero tampoco en contra.'],
  mesa: ['Mesa del Congreso', 'El órgano que dirige la Cámara: una presidencia, cuatro vicepresidencias y cuatro secretarías. Se elige el primer día.'],
  grupo: ['Grupo parlamentario', 'La agrupación de los diputados de un partido en el Congreso. Por regla general hacen falta quince; hay otra vía con cinco si se supera un mínimo de votos.'],
  funciones: ['Gobierno en funciones', 'El Gobierno que ya ha cesado y sigue al frente hasta que entra el nuevo, con poderes limitados.'],
  escrutinio: ['Escrutinio general', 'El recuento oficial, que hacen las juntas electorales cinco días después de votar.'],
  censura: ['Moción de censura', 'La vía para cambiar de presidente sin elecciones: necesita mayoría absoluta y propone un candidato alternativo.'],
  designacion: ['Senador por designación', 'El que no eligen los votantes, sino el parlamento de cada comunidad autónoma.'],
  cortes: ['Cortes Generales', 'El Congreso y el Senado juntos. Hacen las leyes, aprueban los Presupuestos y controlan al Gobierno.'],
  censo: ['Censo electoral', 'La lista oficial de quienes pueden votar. Para votar hay que estar inscrito en ella.'],
  mesael: ['Mesa electoral', 'El equipo que atiende la urna: un presidente y dos vocales, elegidos por sorteo entre los votantes de esa mesa.'],
  junta: ['Junta electoral', 'El órgano que vigila que las elecciones sean limpias y hace el recuento oficial. Hay una central, una por provincia y otras de zona.'],
  lista: ['Lista', 'La candidatura de un partido en una provincia: tantos candidatos como escaños se reparten, en un orden fijo, y hasta diez suplentes.'],
  suplente: ['Suplente', 'Quien va al final de la lista, detrás de los candidatos. Solo entra si queda un escaño libre y ya no hay candidatos por delante. En el Senado, cada candidato lleva dos.'],
  quorum: ['Quórum', 'El mínimo de asistentes para que una votación valga: más de la mitad de la Cámara.'],
  organica: ['Ley orgánica', 'Una ley sobre asuntos de más peso, como los derechos fundamentales o las reglas electorales. Necesita mayoría absoluta del Congreso.'],
  decretoley: ['Decreto-ley', 'Una norma que el Gobierno aprueba por urgencia. El Congreso tiene treinta días para mantenerla o tumbarla.'],
  confianza: ['Cuestión de confianza', 'La votación que pide el propio presidente para comprobar que el Congreso lo sigue apoyando. Le basta la mayoría simple; si la pierde, dimite.'],
  veto: ['Veto del Senado', 'El rechazo del Senado a una ley que viene del Congreso. El Congreso puede levantarlo.'],
  permanente: ['Diputación Permanente', 'El grupo reducido de diputados (y otro de senadores) que queda de guardia cuando las Cámaras están disueltas o no se reúnen.']
};
