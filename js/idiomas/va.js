// Textos del JavaScript en valenciano. Mismas entradas que js/textos.js.
import { idioma, parteFecha, parteEscrutado, ARTICULO } from '../textos.js';

/* números: como en castellano, miles con punto y decimales con coma */
const miles = n => Math.round(n).toLocaleString('es-ES');
const dec = x => x.toFixed(1).replace('.', ',');
const escons = n => n + (n === 1 ? ' escó' : ' escons');
const sis = n => n + (n === 1 ? ' sí' : ' sís');
const nos = n => n + (n === 1 ? ' no' : ' nos');
const falten = n => (n === 1 ? 'falta ' : 'falten ') + sis(n);
// Delante de 1 (u) y de 11 (onze) hay apóstrofo: «d'11», «l'11,5 %», «fins a l'1 de desembre».
const deN = n => (n === 1 || n === 11 ? "d'" : 'de ') + n;
const U_ONZE = /^(1|11)(?![\d.])/;
const el = s => (U_ONZE.test(s) ? "l'" : 'el ') + s;

/* las 52 circunscripciones, en el mismo orden que PROV (js/datos.js). El artículo, en minúscula, va con el nombre
   cuando es valenciano («la Rioja», «les Illes Balears»); «Las Palmas» lo lleva dentro y no se toca. */
const NOMS = ['Albacete', 'Alacant', 'Almeria', 'Àlaba', 'Astúries', 'Àvila', 'Badajoz', 'les Illes Balears', 'Barcelona', 'Biscaia', 'Burgos', 'Càceres', 'Cadis',
  'Cantàbria', 'Castelló', 'Ciudad Real', 'Còrdova', 'la Corunya', 'Conca', 'Guipúscoa', 'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Osca', 'Jaén', 'Lleó',
  'Lleida', 'Lugo', 'Madrid', 'Màlaga', 'Múrcia', 'Navarra', 'Ourense', 'Palència', 'Las Palmas', 'Pontevedra', 'la Rioja', 'Salamanca', 'Santa Cruz de Tenerife',
  'Segòvia', 'Sevilla', 'Sòria', 'Tarragona', 'Terol', 'Toledo', 'València', 'Valladolid', 'Zamora', 'Saragossa', 'Ceuta', 'Melilla'];
const LLISTA = { 7: 'Illes Balears' };   // en los desplegables, sin artículo
const PLURAL = { 7: true };              // «les Illes Balears» lleva el verbo en plural
const maj = s => s.charAt(0).toUpperCase() + s.slice(1);
const prov = i => NOMS[i];               // dentro de una frase: «la Rioja»
const Prov = i => maj(NOMS[i]);          // al principio de una frase: «La Rioja»
// «de» y «a» delante de un nombre: «d'Alacant», «d'Osca», «de la Rioja», «de les Illes Balears», «de Las Palmas», «a la Corunya».
// Ante i o u consonánticas no hay apóstrofo: «de Huelva» (como «de iode»), pero sí ante una sigla («d'IU», «d'UPN»).
const VOCAL = /^h?[aeiouàèéíòóú]/i, SEMI = /^[Hh]?[IUiu][aeiouàèéíòóú]/;
const de = nom => /^el /.test(nom) ? 'del ' + nom.slice(3) : /^els /.test(nom) ? 'dels ' + nom.slice(4)
  : /^(la |les |l')/.test(nom) ? 'de ' + nom : (VOCAL.test(nom) && !SEMI.test(nom) ? "d'" : 'de ') + nom;
const a = nom => /^el /.test(nom) ? 'al ' + nom.slice(3) : /^els /.test(nom) ? 'als ' + nom.slice(4) : 'a ' + nom;
const deProv = i => de(NOMS[i]), aProv = i => a(NOMS[i]);
const verb = (i, singular, plural) => PLURAL[i] ? plural : singular;
// Partidos con artículo (ARTICULO, en js/textos.js): «el PP», que de() y a() vuelven «del PP» y «al PP»; «per al PP», «per a Sumar».
// p: nombre del partido; b: en negrita, con el artículo fuera. Los que llevan artículo empiezan por consonante: sin apóstrofo.
const elP = (p, b) => (ARTICULO[p] ? (ARTICULO[p] === 'f' ? 'la ' : 'el ') : '') + (b ? '<b>' + p + '</b>' : p);
const perA = s => /^el /.test(s) ? 'per al ' + s.slice(3) : 'per a ' + s;

/* fechas: «8 de novembre de 2026», «1 d'abril de 2027» */
const MESOS = ['de gener', 'de febrer', 'de març', "d'abril", 'de maig', 'de juny', 'de juliol', "d'agost", 'de setembre', "d'octubre", 'de novembre', 'de desembre'];
const fecha = f => { const p = parteFecha(f); return p ? p.d + ' ' + MESOS[p.m - 1] + ' de ' + p.a : f; };

/* los textos que vienen dentro de los datos (js/resultados.js): etiqueta, fuente e hitos */
const DADES = {
  'resultados del 23 de julio de 2023': 'resultats del 23 de juliol de 2023',
  'Ministerio del Interior, escrutinio del 23J (datos reunidos en Porra Electoral)': "Ministeri de l'Interior, escrutini del 23J (dades reunides en Porra Electoral)",
  'Escrutinio provisional del 29 de noviembre de 2026': 'Escrutini provisional del 29 de novembre de 2026',
  'Ministerio del Interior': "Ministeri de l'Interior",
  'Ministerio del Interior, escrutinio provisional': "Ministeri de l'Interior, escrutini provisional",
  'escrutinio general del 4 de diciembre de 2026': 'escrutini general del 4 de desembre de 2026',
  'Ministerio del Interior, escrutinio general': "Ministeri de l'Interior, escrutini general",
  '29 nov': '29 nov.', '4 dic': '4 des.', '23 dic': '23 des.',
  'Sin fecha': 'Sense data',
  '1.ª votación': '1a votació',
  '48 h después': '48 h després',
  'Gobierno': 'Govern',
  'Votación.': 'Votació.',
  'Escrutinio general: el recuento oficial.': 'Escrutini general: el recompte oficial.',
  'Se constituyen el Congreso y el Senado.': 'Es constituïxen el Congrés i el Senat.',
  'El Rey consulta a los grupos y propone un candidato.': 'El Rei consulta els grups i proposa un candidat.',
  'Hacen falta 176 síes. Arranca el reloj de dos meses.': 'Fan falta 176 sís. Arranca el rellotge de dos mesos.',
  '2.ª votación: más síes que noes.': '2a votació: més sís que nos.',
  'El Rey nombra al presidente.': 'El Rei nomena el president.'
};
const MES_CURT = { ene: 'gen.', feb: 'febr.', mar: 'març', abr: 'abr.', may: 'maig', jun: 'juny', jul: 'jul.', ago: 'ag.', sep: 'set.', oct: 'oct.', nov: 'nov.', dic: 'des.' };
// Busca el texto sin distinguir la mayúscula de la primera letra y devuelve la traducción con la misma inicial que traía.
// Lo que no está en el diccionario se devuelve tal cual, salvo las fechas cortas de los hitos («7 dic» → «7 des.»).
const datoFijo = s => {
  if (typeof s !== 'string' || !s) return s;
  const c = s.charAt(0), resto = s.slice(1);
  const t = DADES[s] || DADES[c.toLowerCase() + resto] || DADES[c.toUpperCase() + resto];
  if (t) return DADES[s] ? t : (c === c.toLowerCase() ? t.charAt(0).toLowerCase() : t.charAt(0).toUpperCase()) + t.slice(1);
  const x = /^(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)$/i.exec(s);
  return x ? x[1] + ' ' + MES_CURT[x[2].toLowerCase()] : s;
};
// La etiqueta de la noche lleva el porcentaje escrutado: «…, amb el 99,9 % escrutat», «amb l'11 %».
const dato = s => { const e = parteEscrutado(s); return e ? datoFijo(e.t) + ', amb ' + el(e.n) + ' % escrutat' : datoFijo(s); };

const ILLES = {
  7: "Mallorca elegix tres senadors i es marquen dos noms; Menorca, Eivissa i Formentera n'elegixen un cadascuna",
  35: "Gran Canària elegix tres senadors i es marquen dos noms; Lanzarote i Fuerteventura n'elegixen un cadascuna",
  39: "Tenerife elegix tres senadors i es marquen dos noms; La Palma, La Gomera i El Hierro n'elegixen un cadascuna" };

const TITOLS = ['Eixida', 'Què es vota', "Del vot a l'escó", 'On votes', 'El Senat', 'Les majories', 'Pactes', 'Del 29N al Govern', 'Tancament',
  'Què ha passat', 'A la teua província', 'Vots i escons', 'Qui governa?', 'El que vindrà', 'La Moncloa'];
const SEN = ['Persona 1 · Partit A', 'Persona 2 · Partit A', 'Persona 3 · Partit A', 'Persona 4 · Partit B', 'Persona 5 · Partit B', 'Persona 6 · Partit C'];

const GLOS = {
  escano: ["Escó", "Cadascun dels 350 seients del Congrés; els del Senat també es diuen així. Qui n'ocupa un en el Congrés és diputat o diputada."],
  circ: ['Circumscripció', 'La zona en què es compten els vots i es repartixen els escons. En les generals és la província; Ceuta i Melilla en són una cadascuna.'],
  dhondt: ["Regla D'Hondt", 'La manera de repartir els escons de cada província: es dividixen els vots de cada partit per 1, 2, 3… i els escons van als resultats més alts.'],
  barrera: ['Barrera electoral', 'El mínim per a entrar en el repartiment: el 3 % dels vots vàlids de la província.'],
  blanco: ["Vot en blanc", "Un sobre sense papereta; en el Senat, també la papereta sense cap creu. És un vot vàlid: no va a cap partit, però compta en el total."],
  nulo: ['Vot nul', "Un vot que no val: per exemple, una papereta amb ratllades o afegits, o un sobre que no és l'oficial."],
  absoluta: ['Majoria absoluta', 'Més de la mitat de tots els diputats, voten o no: 176 de 350.'],
  simple: ['Majoria simple', 'Més vots a favor que en contra. Les abstencions no compten.'],
  investidura: ['Investidura', 'La votació en què el Congrés dona la seua confiança a un candidat a president del Govern.'],
  abstencion: ["Abstenció", "En unes eleccions, no anar a votar. En una votació del Congrés, no votar ni sí ni no: no suma a favor ni en contra."],
  mesa: ['Mesa del Congrés', "L'òrgan que dirigix la Cambra: una presidència, quatre vicepresidències i quatre secretaries. S'elegix el primer dia."],
  grupo: ['Grup parlamentari', "L'agrupació dels diputats d'un partit en el Congrés. Per regla general en fan falta quinze; hi ha una altra via amb cinc si se supera un mínim de vots."],
  funciones: ['Govern en funcions', 'El Govern que ja ha cessat i continua al capdavant fins que entra el nou, amb poders limitats.'],
  escrutinio: ['Escrutini general', 'El recompte oficial, que fan les juntes electorals cinc dies després de votar.'],
  censura: ['Moció de censura', 'La via per a canviar de president sense eleccions: necessita majoria absoluta i proposa un candidat alternatiu.'],
  designacion: ['Senador per designació', 'El que no elegixen els votants, sinó el parlament de cada comunitat autònoma.'],
  cortes: ['Corts Generals', 'El Congrés i el Senat junts. Fan les lleis, aproven els Pressupostos i controlen el Govern.'],
  censo: ['Cens electoral', 'La llista oficial dels qui poden votar. Per a votar cal estar-hi inscrit.'],
  mesael: ['Mesa electoral', "L'equip que atén l'urna: un president i dos vocals, elegits per sorteig entre els votants d'eixa mesa."],
  junta: ['Junta electoral', "L'òrgan que vigila que les eleccions siguen netes i fa el recompte oficial. N'hi ha una de central, una per província i altres de zona."],
  lista: ['Llista', "La candidatura d'un partit en una província: tants candidats com escons es repartixen, en un orde fix, i fins a deu suplents."],
  suplente: ['Suplent', "Qui va al final de la llista, darrere dels candidats. Només entra si queda un escó lliure i ja no hi ha candidats per davant. En el Senat, cada candidat en porta dos."],
  quorum: ['Quòrum', "El mínim d'assistents perquè una votació valga: més de la mitat de la Cambra."],
  organica: ['Llei orgànica', 'Una llei sobre assumptes de més pes, com els drets fonamentals o les regles electorals. Necessita majoria absoluta del Congrés.'],
  decretoley: ['Decret llei', 'Una norma que el Govern aprova per urgència. El Congrés té trenta dies per a mantindre-la o tombar-la.'],
  confianza: ['Qüestió de confiança', 'La votació que demana el mateix president per a comprovar que el Congrés continua donant-li suport. Li basta la majoria simple; si la perd, dimitix.'],
  veto: ['Veto del Senat', 'El rebuig del Senat a una llei que ve del Congrés. El Congrés pot alçar-lo.'],
  permanente: ["Diputació Permanent", "El grup reduït que queda de guàrdia en cada cambra quan estan dissoltes o no es reunixen. N'hi ha una en el Congrés i una altra en el Senat."],
  validos: ["Vots vàlids", "Els que van a un partit més els vots en blanc. Els nuls no compten."],
  hemiciclo: ["Hemicicle", "La sala de plens del Congrés, amb els escons en forma de mitja lluna."]
};

export const textos = {
  cod: 'va',
  locale: 'ca',

  /* números y provincias */
  miles, dec,
  pct: x => dec(x * 100) + ' %',
  pctEntero: n => n + ' %',
  provLista: i => LLISTA[i] || Prov(i),
  prov,
  escanos: escons, sies: sis,

  /* textos que en castellano viven en js/datos.js */
  titulos: TITOLS, sen: SEN, glos: GLOS,
  fecha, dato,

  /* el escenario */
  ariaEscenario: "Els 350 escons del Congrés, que canvien de forma en cada pas. L'hexàgon daurat és el teu vot.",
  tuVoto: 'El teu vot',
  primerEscano: i => '1r escó ' + deProv(i),
  rotulo: (k, i, n, revelado) => ({
    0: '350 escons: un hexàgon per escó',
    1: Prov(i) + ': ' + n + ' de 350',
    2: revelado ? Prov(i) + ": així repartix D'Hondt " + (n === 1 ? 'el seu escó' : 'els seus ' + n) : Prov(i) + ': ' + escons(n) + ' per repartir',
    3: 'Més fosc: menys habitants per escó',
    4: 'Senat: 209 elegits, quatre per província',
    5: '176 de 350: la majoria absoluta',
    7: 'El Congrés que elegirà president<small>El termini de dos mesos comença amb la primera votació.</small>',
    8: '350 escons',
    9: 'Cada escó, del color del seu partit',
    10: Prov(i) + ': ' + escons(n),
    11: 'El Congrés que ix de les urnes',
    13: 'El Congrés que ix de les urnes',
    14: '350 escons' }[k] || ''),
  rotuloPacto: c => 'Sí ' + c.si + ' · Abst. ' + c.abs + ' · No ' + c.no + '<small>' + (c.si >= 176 ? 'Ix a la primera: 176 sís o més.'
    : c.si > c.no ? 'No arriba a 176, però ix en la segona votació.'
    : c.si === 0 ? 'Toca els partits per a formar una majoria.'
    : 'No ix: ' + falten(176 - c.si) + ' per a arribar a 176.') + '</small>',
  piePacto: 'Cada escó, del color del seu partit. El teu vot, a banda: en quin bloc estaria depén de qui votes.',
  piePactoRes: "Cada escó, del color del seu partit. Els sís s'ajunten a l'esquerra, després les abstencions i després els nos.",

  /* la frase de «Tu voto» de cada paso */
  islas: ILLES,
  frase(k, { i, n, entran, soria, madrid, primero }) {
    const uno = n === 1;
    switch (k) {
      case 0: return "El teu vot és l'hexàgon daurat. Tria on votes i seguix-lo fins al final.";
      case 1: return (uno ? "El teu vot és l'hexàgon daurat: és l'únic escó " + deProv(i) + '.' : "El teu vot és l'hexàgon daurat: està " + aProv(i) + ', entre els escons de la teua província, en color teula.') + ' La teua papereta blanca, la del Congrés, va a la seua urna.';
      case 2: return uno ? 'El teu vot se suma al del teu partit ' + aProv(i) + '. Allí hi ha un sol escó: és per al més votat.'
        : 'El teu vot se suma al del teu partit ' + aProv(i) + ', i només entra en el repartiment si eixe partit arriba al 3 % dels vots vàlids de la província.';
      case 3:
        if (uno) return maj(aProv(i)) + ' hi ha un sol escó: amb els cinc partits inventats del pas 2, només entraria el més votat.';
        if (n === 2 || n === 38) return 'Amb els cinc partits inventats del pas 2, ' + aProv(i) + " n'entren <b>" + entran + '</b>. És un dels dos extrems de la taula.';
        return 'Amb els cinc partits inventats del pas 2, els ' + n + ' escons ' + deProv(i) + ' donen escó a <b>' + entran + "</b> d'ells: " + (entran > soria ? 'més que' : 'tants com') + ' a Sòria (' + soria + ') i ' + (entran < madrid ? 'menys que' : 'tants com') + ' a Madrid (' + madrid + ').';
      case 4:
        if (ILLES[i]) return 'La teua segona papereta, la sépia, és la del Senat. ' + maj(aProv(i)) + ' depén de la teua illa: ' + ILLES[i] + '.';
        if (uno) return 'La teua segona papereta, la sépia, és la del Senat. ' + Prov(i) + " passa d'un diputat a <b>dos</b> senadors.";
        return 'La teua segona papereta, la sépia, és la del Senat. En el mapa, ' + prov(i) + verb(i, ' passa ', ' passen ') + deN(n) + ' diputats a <b>quatre</b> senadors, com qualsevol província de la Península.';
      case 5: return (uno ? 'El diputat ' + deProv(i) + ' seu' : 'Els ' + n + ' diputats ' + deProv(i) + ' seuen') + ' amb els altres ' + (350 - n) + '. ' + (uno ? 'El teu vot compta per a eixe seient només si el teu partit és el més votat allí.' : "El teu vot compta per a algun d'eixos seients només si el teu partit trau escó allí.");
      case 6: return (uno ? 'El diputat ' + deProv(i) + ' sol votar amb el seu partit.' : 'Els ' + n + ' diputats ' + deProv(i) + ' solen votar amb el seu partit.') + " El teu vot queda a banda, davall de l'hemicicle: en quin bloc estaria depén de qui votes.";
      case 7: return 'La nit del 29N, la teua papereta es compta en la teua mesa ' + deProv(i) + ', en públic i en veu alta.';
      case 8: return 'Eixe és el camí de la teua papereta ' + aProv(i) + ": de l'urna a la Moncloa.";
      case 10: return primero ? "L'hexàgon daurat és el primer escó que es va repartir " + aProv(i) + ': va ser ' + perA(elP(primero, true)) + '.' : '';
      case 11: case 12: return primero ? "L'hexàgon daurat és el primer escó " + deProv(i) + ': va ser ' + perA(elP(primero, true)) + ', el partit més votat allí.' : '';
      default: return '';
    }
  },

  /* navegación */
  estacion: (k, ultima) => k === 0 ? 'Eixida' : k === 14 ? 'La Moncloa' : 'Pas ' + k + ' ' + deN(ultima),
  donde: (k, ultima, lectura) => lectura ? 'Índex' : k === 0 ? 'Eixida' : k === 14 ? 'La Moncloa' : 'Pas ' + k + ' ' + deN(ultima),
  dondeVotas: 'On votes?',
  tocaMapa: 'També pots tocar la teua província en el mapa.',
  fase2Cerrada: "Els passos 9 a 13 s'obrin el 30N, amb els resultats.",
  abre30N: '30N',   // junto a cada paso cerrado, en el menú
  sigueMiVoto: 'Seguix el meu vot: ',
  siguiente: 'Següent: ',
  verEscanos: 'Tornar als 350 escons',
  verTexto: 'Veure només el text',
  tapa: {
    banda: 'Eleccions generals · 29 de novembre de 2026',
    titulo: 'De les urnes a la Moncloa',
    sub: 'Milions de paperetes es convertixen en 350 escons, i els escons, en un Govern. Així funciona.',
    como: 'Com se seguix',
    pasos: ['Tria la província en què votes.', 'Baixa: en cada pas, els 350 escons canvien de forma.', "El teu vot és l'hexàgon daurat: seguix-lo fins al final."],
    boton: 'Clica ací per a començar',
    texto: 'o llig només el text' },

  /* paso 1 */
  provElige: (i, n) => Prov(i) + verb(i, ' elegix ', ' elegixen ') + escons(n) + ' dels 350.',

  /* paso 2: la apuesta y la tabla de divisiones */
  apuestaIntro: (i, n) => Prov(i) + verb(i, ' repartix ', ' repartixen ') + escons(n) + ' entre cinc partits inventats. Quants en dones a cadascun?',
  ariaApuesta: letra => 'Escons per al partit ' + letra,
  resto: q => q === 0 ? 'Tot repartit.' : q === 1 ? 'Et queda 1 escó per repartir.' : 'Et queden ' + q + ' escons per repartir.',
  dhondtDa: n => "D'Hondt li'n dona " + n,
  acierto: (aciertos, total) => "N'has encertat " + aciertos + ' ' + deN(total) + '.',
  partido: 'Partit',
  fuera: ' (fora)',
  repartoPaso: (orden, total, letra, cociente, division) => 'Escó ' + orden + ' ' + deN(total) + ': per a ' + letra + ', amb ' + cociente + (division ? ' (divisió ÷' + division + ', fora de la taula).' : '.'),
  repartoEmpieza: 'Comença el repartiment…',
  repartoFin: lista => 'Repartiment acabat: ' + lista + '.',

  /* paso 3 */
  habitantes: (i, porEscano, puesto, media) => maj(aProv(i)) + ' hi ha un escó per cada ' + miles(porEscano) + ' habitants (lloc ' + puesto + " de 52, de menys a més). La mitjana d'Espanya és un per cada " + miles(media) + '.',
  comparacion: (soria, madrid) => soria + ' de 2 a Sòria · ' + madrid + ' de 38 a Madrid',
  tamanos: (pequenas, medianas, grandes) => 'De les 52 circumscripcions, ' + pequenas + ' repartixen cinc escons o menys, ' + medianas + ' en repartixen entre sis i nou i només ' + grandes + ' en repartixen deu o més.',

  /* paso 4 */
  senTope: 'Només tres. Lleva una marca per a canviar-la.',
  senMarcadas: n => "N'has marcat " + n + ' de 3.',

  /* calculadoras de pactos (pasos 6 y 12) */
  voto: { no: 'No', si: 'Sí', abs: 'Abst.' },
  votoLargo: { no: 'no', si: 'sí', abs: 'abstenció' },
  ariaBarra: 'Barra de 350 escons amb la marca de 176',
  votacion1: '1a votació · majoria absoluta',
  votacion2: '2a votació · més sís que nos',
  copiar: "Copiar l'enllaç a esta combinació",
  copiado: 'Enllaç copiat.',
  copiaManual: "Copia l'adreça del navegador: ja porta la combinació.",
  copiaDireccion: "Copia l'adreça del navegador",
  ariaPartido: (nombre, n, voto) => nombre + ', ' + escons(n) + ', vota ' + voto + '. Toca per a canviar',
  cuentaSi: n => 'Sí: ' + n,
  cuentaAbs: n => 'Abst.: ' + n,
  cuentaNo: n => 'No: ' + n,
  primera: si => si >= 176 ? 'Ix: té ' + sis(si) + '.' : 'No ix: ' + falten(176 - si) + '.',
  segunda: (si, no) => (si > no ? 'Ix: ' : 'No ix: ') + sis(si) + ' contra ' + nos(no) + '.',
  anuncioPacto: (si, abs, no, primera, segunda) => 'Sí ' + si + ', abstenció ' + abs + ', no ' + no + '. Primera votació: ' + primera + ' Segona: ' + segunda,
  calcNota: data => 'Escons que cada partit va traure en les eleccions ' + (U_ONZE.test(data) ? "de l'" : 'del ') + data + ', les últimes abans del 29N. No és una enquesta ni un resultat del 29N.',

  /* fase 2: los resultados */
  avisoPrueba: etiqueta => 'Vista prèvia amb dades de prova: ' + etiqueta + '. No són els resultats del 29N.',
  masEscanos: (nombre, n, pctVotos, absoluta) => maj(elP(nombre)) + ' és el partit amb més escons: ' + n + ', amb ' + el(pctVotos) + ' dels vots. ' + (absoluta ? 'Supera els 176 de la majoria absoluta.' : 'Cap partit arriba a soles als 176 de la majoria absoluta.'),
  participacion: p => ' Va votar ' + el(p) + ' del cens.',
  provisionalRes: " Són resultats provisionals fins a l'escrutini general del 4 de desembre, que suma el vot arribat de l'estranger.",
  thVotos: 'Vots',
  thEscanos: 'Escons',
  thPorEscano: 'Vots per escó',
  fuenteRes: (prueba, etiqueta, fuente) => (prueba ? 'Dades de prova: ' + etiqueta : maj(etiqueta)) + '. Font: ' + fuente + '. Els escons es calculen ací amb els vots de cada província; els oficials els proclamen les juntes electorals.',
  /* paso 9: frente a 2023 */
  lista: xs => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' i ' + xs[xs.length - 1],
  frente2023(gana, mas, pierde, menos, todos) {
    if (!gana.length && !pierde.length) return todos ? 'Cada partit té els mateixos escons que en les generals de 2023.' : 'Els partits que es poden comparar amb 2023 tenen els mateixos escons que aleshores.';
    const g = gana.length ? (gana.length > 1 ? 'els que guanyen més escons: ' : 'el que guanya més escons: ') + this.lista(gana) + ' (+' + mas + ')' : '';
    const p = pierde.length ? (pierde.length > 1 ? (g ? 'els que en perden més: ' : 'els que perden més escons: ') : (g ? 'el que en perd més: ' : 'el que perd més escons: ')) + this.lista(pierde) + ' (−' + menos + ')' : '';
    return 'Respecte a les generals de 2023, ' + [g, p].filter(Boolean).join('; ') + '.' + (todos && !p ? ' Cap partit en perd.' : todos && !g ? ' Cap partit en guanya.' : '');
  },
  tabla2023: 'Escons de cada partit en 2023 i el 29N',
  th2023: '2023',
  th29N: '29N',
  thDif: 'Diferència',
  nuevo: 'nou',
  sinCifra: { nuevo: 'no es va presentar en 2023', falta: 'sense equivalent en 2023', solo2023: 'sense equivalent el 29N', dentro: ref => 'en 2023, dins ' + de(ref) },
  notas2023: {
    faSumar: 'El Frente Amplio es compara amb Sumar, que en 2023 incloïa Podemos.',
    faNuevo: 'El Frente Amplio no es va presentar en 2023.',
    sumar: 'En 2023, Sumar incloïa Podemos.',
    podemos: 'Podemos es va presentar en 2023 dins de Sumar: no té xifra pròpia amb què comparar-lo.',
    aa: 'En 2023, Adelante Andalucía només es va presentar a Cadis, i no va traure escó.',
    salf: 'SALF no es va presentar en 2023.' },
  fuente2023: 'Escons de 2023: els proclamats per la <a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907">Junta Electoral Central</a>.',
  frase2023(i, { e, e23, cambios, iguales, sin, antes }) {
    const d = e - e23, A = maj(aProv(i)), b = c => '<b>' + c.nombre + '</b>', o = [];
    if (!cambios.length && !sin.length && !antes.length) return e === 1 ? A + ", l'escó és per al mateix partit que en 2023." : A + ', els ' + e + ' escons es repartixen igual que en 2023.';
    if (d) o.push(A + ' hi ha ' + escons(e) + ', ' + (Math.abs(d) === 1 ? 'un' : Math.abs(d)) + (d > 0 ? ' més' : ' menys') + ' que en 2023.');
    const cm = this.lista(cambios.map(c => b(c) + ' ' + c.signo)), ig = iguales.length ? this.lista(iguales) + ', sense canvis' : '';
    if (cm || ig) o.push((d ? 'Per partits: ' : A + ', respecte a 2023: ') + [cm, ig].filter(Boolean).join('; ') + '.');
    if (sin.length) o.push('No es poden comparar amb 2023: ' + this.lista(sin.map(c => b(c) + ' (' + escons(c.n) + ')')) + '.');
    if (antes.length) o.push('Sense equivalent el 29N: ' + this.lista(antes.map(c => b(c) + ' (' + escons(c.n) + ' en 2023)')) + '.');
    return o.join(' ');
  },
  repartia: (i, n) => Prov(i) + verb(i, ' repartia ', ' repartien ') + escons(n) + '.',
  ultimo: (ganador, rival, votos) => "L'últim escó va ser " + perA(elP(ganador)) + '. ' + maj(a(elP(rival))) + (votos === 1 ? ' li va faltar 1 vot' : ' li van faltar ' + miles(votos) + ' vots') + " per a llevar-li'l.",
  provisionalUltimo: " És el recompte provisional: el vot arribat de l'estranger, que se suma el 4 de desembre, el pot canviar.",
  unico: ganador => "L'escó va ser " + perA(elP(ganador)) + '.',
  provisional12: "Són els escons del recompte provisional. L'escrutini general del 4 de desembre suma el vot arribat de l'estranger i en pot moure algun.",
  votos: n => miles(n) + (Math.round(n) === 1 ? ' vot' : ' vots'),
  ysiIguales: 'Tria dos partits diferents.',
  ysiCambia: (n, deQui, aQui, ultimo) => 'Amb ' + miles(n) + ' vots ' + de(elP(deQui)) + ' ' + a(elP(aQui)) + ", canvia el repartiment. L'últim escó seria " + perA(elP(ultimo)) + '.',
  ysiNoCambia: (n, ultimo) => 'Amb ' + miles(n) + " vots, el repartiment no canvia. L'últim escó continua sent " + perA(elP(ultimo)) + '.',
  votosYEscanos: "El percentatge d'escons d'un partit quasi mai coincidix amb el seu percentatge de vots.",
  sinEscano: (n, p) => miles(n) + ' vots (' + p + ') van anar a candidatures que no van aconseguir escó en la seua província.',
  loSiguiente: t => 'El següent: ' + t.charAt(0).toLowerCase() + t.slice(1),
  calendarioCompleto: 'El calendari està complet.'
};
idioma(textos);
