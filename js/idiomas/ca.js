// Textos del JavaScript en catalán. Mismas entradas que js/textos.js.
import { idioma, parteFecha } from '../textos.js';

/* números */
const escons = n => n + (n === 1 ? ' escó' : ' escons');
const sis = n => n + (n === 1 ? ' sí' : ' sís');
const nos = n => n + (n === 1 ? ' no' : ' nos');
// Miles con punto, también en los números de cuatro cifras, que es lo habitual en catalán: 1.340, 187.817.
const miles = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dec = x => x.toFixed(1).replace('.', ',');
const falten = n => (n === 1 ? 'falta ' : 'falten ') + sis(n);

/* gramática */
const maj = s => s.charAt(0).toUpperCase() + s.slice(1);
const minus = s => s.charAt(0).toLowerCase() + s.slice(1);
// «de» se apostrofa ante vocal o h muda: «d'Àvila», «d'Osca», «d'abril», «d'ERC». No ante «hu» + vocal, que suena [w]
// como en «de Washington»: «de Huelva».
const de = s => (/^[aeiouàèéíòóúh]/i.test(s) && !/^hu[aeio]/i.test(s) ? "d'" : 'de ') + s;

/* las 52 circunscripciones, en el mismo orden que PROV en js/datos.js: [nombre, artículo si lo lleva] */
const PROVS = [['Albacete'], ['Alacant'], ['Almeria'], ['Àlaba'], ['Astúries'], ['Àvila'], ['Badajoz'], ['Illes Balears', 'les'], ['Barcelona'],
  ['Biscaia'], ['Burgos'], ['Càceres'], ['Cadis'], ['Cantàbria'], ['Castelló'], ['Ciudad Real'], ['Còrdova'], ['Corunya', 'la'], ['Conca'],
  ['Guipúscoa'], ['Girona'], ['Granada'], ['Guadalajara'], ['Huelva'], ['Osca'], ['Jaén'], ['Lleó'], ['Lleida'], ['Lugo'], ['Madrid'],
  ['Màlaga'], ['Múrcia'], ['Navarra'], ['Ourense'], ['Palència'], ['Las Palmas'], ['Pontevedra'], ['Rioja', 'la'], ['Salamanca'],
  ['Santa Cruz de Tenerife'], ['Segòvia'], ['Sevilla'], ['Sòria'], ['Tarragona'], ['Terol'], ['Toledo'], ['València'], ['Valladolid'],
  ['Zamora'], ['Saragossa'], ['Ceuta'], ['Melilla']];
const art = i => PROVS[i][1] || '';
// En los desplegables y en las barras: «València», «La Rioja», «La Corunya», «Illes Balears».
const provLista = i => art(i) === 'la' ? 'La ' + PROVS[i][0] : PROVS[i][0];
// Dentro de una frase: «València», «la Rioja», «la Corunya», «les Illes Balears».
const prov = i => (art(i) ? art(i) + ' ' : '') + PROVS[i][0];
const Prov = i => maj(prov(i));          // a principio de frase: «La Rioja», «Les Illes Balears»
const deProv = i => de(prov(i));         // «de València», «d'Alacant», «de la Rioja», «de les Illes Balears», «de Las Palmas»
const aProv = i => 'a ' + prov(i);       // «a València», «a la Corunya», «a les Illes Balears»
const AProv = i => 'A ' + prov(i);
const plural = i => art(i) === 'les';    // «les Illes Balears» lleva el verbo en plural

/* fechas: «8 de novembre de 2026», «1 d'abril de 2026» */
const MESOS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
const fecha = f => { const p = parteFecha(f); return p ? p.d + ' ' + de(MESOS[p.m - 1]) + ' de ' + p.a : f; };

/* textos que vienen dentro de los datos (js/resultados.js): castellano → catalán */
const DADES = new Map([
  ['resultados del 23 de julio de 2023', 'resultats del 23 de juliol de 2023'],
  ['Ministerio del Interior, escrutinio del 23J (datos reunidos en Porra Electoral)', "Ministeri de l'Interior, escrutini del 23J (dades recollides a Porra Electoral)"],
  ['Escrutinio provisional del 29 de noviembre de 2026', 'Escrutini provisional del 29 de novembre de 2026'],
  ['Ministerio del Interior', "Ministeri de l'Interior"],
  ['29 nov', '29 nov.'],
  ['4 dic', '4 des.'],
  ['23 dic', '23 des.'],
  ['Sin fecha', 'Sense data'],
  ['1.ª votación', '1a votació'],
  ['48 h después', '48 h després'],
  ['Gobierno', 'Govern'],
  ['Votación.', 'Votació.'],
  ['Escrutinio general: el recuento oficial.', 'Escrutini general: el recompte oficial.'],
  ['Se constituyen el Congreso y el Senado.', 'Es constitueixen el Congrés i el Senat.'],
  ['El Rey consulta a los grupos y propone un candidato.', 'El Rei consulta els grups i proposa un candidat.'],
  ['Hacen falta 176 síes. Arranca el reloj de dos meses.', 'Calen 176 sís. Es posa en marxa el rellotge de dos mesos.'],
  ['2.ª votación: más síes que noes.', '2a votació: més sís que nos.'],
  ['El Rey nombra al presidente.', 'El Rei nomena el president.']
].map(([es, ca]) => [minus(es), ca]));
// Busca sin distinguir la mayúscula de la primera letra y devuelve la traducción con la inicial tal como llega.
const dato = s => {
  const t = typeof s === 'string' ? DADES.get(minus(s)) : undefined;
  if (t === undefined) return s;
  const c = s.charAt(0);
  return c !== c.toLowerCase() ? maj(t) : c !== c.toUpperCase() ? minus(t) : t;
};


const ILLES = {
  7: "Mallorca escull tres senadors i s'hi marquen dos noms; Menorca, Eivissa i Formentera n'escullen un cadascuna",
  35: "Gran Canària escull tres senadors i s'hi marquen dos noms; Lanzarote i Fuerteventura n'escullen un cadascuna",
  39: "Tenerife escull tres senadors i s'hi marquen dos noms; La Palma, La Gomera i El Hierro n'escullen un cadascuna" };

export const textos = {
  cod: 'ca',
  locale: 'ca',

  /* números y provincias */
  miles, dec,
  pct: x => dec(x * 100) + ' %',
  pctEntero: n => n + ' %',
  provLista,
  prov,
  escanos: escons, sies: sis,

  /* textos que en castellano viven en js/datos.js */
  titulos: ['Sortida', 'Què es vota', "Del vot a l'escó", 'On votes', 'El Senat', 'Les majories', 'Pactes', 'Del 29N al Govern', 'Tancament',
    'Què ha passat', 'A la teva província', 'Vots i escons', 'Qui governa?', 'El que ve', 'La Moncloa'],
  sen: ['Persona 1 · Partit A', 'Persona 2 · Partit A', 'Persona 3 · Partit A', 'Persona 4 · Partit B', 'Persona 5 · Partit B', 'Persona 6 · Partit C'],
  glos: {
    escano: ["Escó", "Cadascun dels 350 seients del Congrés; els del Senat també es diuen així. Qui n'ocupa un al Congrés és diputat o diputada."],
    circ: ['Circumscripció', 'La zona on es compten els vots i es reparteixen els escons. A les generals és la província; Ceuta i Melilla en són una cadascuna.'],
    dhondt: ["Regla D'Hondt", 'La manera de repartir els escons de cada província: es divideixen els vots de cada partit per 1, 2, 3… i els escons van als resultats més alts.'],
    barrera: ['Barrera electoral', 'El mínim per entrar en el repartiment: el 3 % dels vots vàlids de la província.'],
    blanco: ["Vot en blanc", "Un sobre sense papereta; al Senat, també la papereta sense cap creu. És un vot vàlid: no va a cap partit, però compta en el total."],
    nulo: ['Vot nul', "Un vot que no val: per exemple, una papereta amb ratllades o afegits, o un sobre que no és l'oficial."],
    absoluta: ['Majoria absoluta', 'Més de la meitat de tots els diputats, votin o no: 176 de 350.'],
    simple: ['Majoria simple', 'Més vots a favor que en contra. Les abstencions no compten.'],
    investidura: ['Investidura', 'La votació en què el Congrés dona la seva confiança a un candidat a president del Govern.'],
    abstencion: ["Abstenció", "En unes eleccions, no anar a votar. En una votació del Congrés, no votar ni sí ni no: no suma a favor ni en contra."],
    mesa: ['Mesa del Congrés', "L'òrgan que dirigeix la cambra: una presidència, quatre vicepresidències i quatre secretaries. S'escull el primer dia."],
    grupo: ['Grup parlamentari', "L'agrupació dels diputats d'un partit al Congrés. Per regla general en calen quinze; hi ha una altra via amb cinc si se supera un mínim de vots."],
    funciones: ['Govern en funcions', 'El Govern que ja ha cessat i continua al capdavant fins que entra el nou, amb poders limitats.'],
    escrutinio: ['Escrutini general', 'El recompte oficial, que fan les juntes electorals cinc dies després de votar.'],
    censura: ['Moció de censura', 'La via per canviar de president sense eleccions: necessita majoria absoluta i proposa un candidat alternatiu.'],
    designacion: ['Senador per designació', 'El que no escullen els votants, sinó el parlament de cada comunitat autònoma.'],
    cortes: ['Corts Generals', 'El Congrés i el Senat junts. Fan les lleis, aproven els pressupostos i controlen el Govern.'],
    censo: ['Cens electoral', 'La llista oficial dels qui poden votar. Per votar cal estar-hi inscrit.'],
    mesael: ['Mesa electoral', "L'equip que atén l'urna: un president i dos vocals, escollits per sorteig entre els votants d'aquesta mesa."],
    junta: ['Junta electoral', "L'òrgan que vigila que les eleccions siguin netes i fa el recompte oficial. N'hi ha una de central, una per província i d'altres de zona."],
    lista: ['Llista', "La candidatura d'un partit en una província: tants candidats com escons es reparteixen, en un ordre fix, i fins a deu suplents."],
    suplente: ['Suplent', "Qui va al final de la llista, darrere dels candidats. Només entra si queda un escó lliure i ja no hi ha candidats per davant. Al Senat, cada candidat en porta dos."],
    quorum: ['Quòrum', "El mínim d'assistents perquè una votació valgui: més de la meitat de la cambra."],
    organica: ['Llei orgànica', 'Una llei sobre assumptes de més pes, com els drets fonamentals o les regles electorals. Necessita majoria absoluta del Congrés.'],
    decretoley: ['Decret llei', 'Una norma que el Govern aprova per urgència. El Congrés té trenta dies per mantenir-la o tombar-la.'],
    confianza: ['Qüestió de confiança', 'La votació que demana el mateix president per comprovar que el Congrés li continua donant suport. En té prou amb la majoria simple; si la perd, dimiteix.'],
    veto: ['Vet del Senat', 'El rebuig del Senat a una llei que ve del Congrés. El Congrés el pot aixecar.'],
    permanente: ["Diputació Permanent", "El grup reduït que queda de guàrdia a cada cambra quan estan dissoltes o no es reuneixen. N'hi ha una al Congrés i una altra al Senat."],
    validos: ["Vots vàlids", "Els que van a un partit més els vots en blanc. Els nuls no compten."],
    hemiciclo: ["Hemicicle", "La sala de plens del Congrés, amb els escons en forma de mitja lluna."]
  },
  fecha,
  dato,

  /* el escenario */
  ariaEscenario: "Els 350 escons del Congrés, que canvien de forma a cada pas. L'hexàgon daurat és el teu vot.",
  ariaPaso: (texto, marca) => texto + (marca ? ' Hexàgon daurat: ' + marca.charAt(0).toLowerCase() + marca.slice(1) + '.' : ''),
  tuVoto: 'El teu vot',
  primerEscano: i => '1r escó ' + deProv(i),
  // k: paso; i: provincia; n: sus escaños; revelado: si ya se ha hecho la apuesta del paso 2
  rotulo: (k, i, n, revelado) => ({
    0: '350 escons: un hexàgon per escó',
    1: Prov(i) + ': ' + n + ' de 350',
    2: revelado ? Prov(i) + ": així reparteix D'Hondt " + (n === 1 ? 'el seu escó' : 'els seus ' + n) : Prov(i) + ': ' + escons(n) + ' per repartir',
    3: 'Més fosc: menys habitants per escó',
    4: 'Senat: 209 escollits, quatre per província',
    5: '176 de 350: la majoria absoluta',
    7: 'El Congrés que escollirà president<small>El termini de dos mesos comença amb la primera votació.</small>',
    8: '350 escons',
    9: 'Cada escó, del color de qui el va guanyar',
    10: Prov(i) + ': ' + escons(n),
    11: 'El Congrés que surt de les urnes',
    13: 'El Congrés que surt de les urnes',
    14: '350 escons' }[k] || ''),
  // c: { si, abs, no }, en escaños
  rotuloPacto: c => 'Sí ' + c.si + ' · Abst. ' + c.abs + ' · No ' + c.no + '<small>' + (c.si >= 176 ? 'Surt escollit a la primera: 176 sís o més.'
    : c.si > c.no ? 'No arriba a 176, però surt escollit a la segona votació.'
    : c.si === 0 ? 'Toca els partits per formar una majoria.'
    : 'No surt escollit: ' + falten(176 - c.si) + ' per arribar a 176.') + '</small>',
  piePacto: 'Cada escó, del color del seu partit. El teu vot, a part: en quin bloc estaria depèn de qui votis.',
  piePactoRes: "Cada escó, del color del seu partit. Els sís s'agrupen a l'esquerra, després les abstencions i després els nos.",

  /* la frase de «Tu voto» de cada paso */
  islas: ILLES,
  frase(k, { i, n, entran, soria, madrid, primero }) {
    const uno = n === 1;
    switch (k) {
      case 0: return "El teu vot és l'hexàgon daurat. Tria on votes i segueix-lo fins al final.";
      case 1: return (uno ? "El teu vot és l'hexàgon daurat: és l'únic escó " + deProv(i) + '.' : "El teu vot és l'hexàgon daurat: és " + aProv(i) + ', entre els escons de la teva província, en color teula.') + ' La teva papereta blanca, la del Congrés, va a la seva urna.';
      case 2: return uno ? 'El teu vot se suma al del teu partit ' + aProv(i) + '. Allà hi ha un sol escó: és per al més votat.'
        : 'El teu vot se suma al del teu partit ' + aProv(i) + ', i només entra en el repartiment si aquest partit arriba al 3 % dels vots vàlids de la província.';
      case 3:
        if (uno) return AProv(i) + ' hi ha un sol escó: amb els cinc partits inventats del pas 2, només hi entraria el més votat.';
        if (n === 2 || n === 38) return 'Amb els cinc partits inventats del pas 2, ' + aProv(i) + " n'hi entren <b>" + entran + '</b>. És un dels dos extrems de la taula.';
        return 'Amb els cinc partits inventats del pas 2, els ' + n + ' escons ' + deProv(i) + ' donen escó a <b>' + entran + "</b> d'ells: " + (entran > soria ? 'més que' : 'tants com') + ' a Sòria (' + soria + ') i ' + (entran < madrid ? 'menys que' : 'tants com') + ' a Madrid (' + madrid + ').';
      case 4:
        if (ILLES[i]) return 'La teva segona papereta, la de color sèpia, és la del Senat. ' + AProv(i) + ' depèn de la teva illa: ' + ILLES[i] + '.';
        if (uno) return 'La teva segona papereta, la de color sèpia, és la del Senat. ' + Prov(i) + " passa d'un diputat a <b>dos</b> senadors.";
        return 'La teva segona papereta, la de color sèpia, és la del Senat. Al mapa, ' + prov(i) + (plural(i) ? ' passen de ' : ' passa de ') + n + ' diputats a <b>quatre</b> senadors, com qualsevol província de la Península.';
      case 5: return (uno ? 'El diputat ' + deProv(i) + ' seu' : 'Els ' + n + ' diputats ' + deProv(i) + ' seuen') + ' amb els altres ' + (350 - n) + '. ' + (uno ? 'El teu vot compta per a aquest seient només si el teu partit hi és el més votat.' : "El teu vot compta per a algun d'aquests seients només si el teu partit hi treu escó.");
      case 6: return (uno ? 'El diputat ' + deProv(i) + ' sol votar amb el seu partit.' : 'Els ' + n + ' diputats ' + deProv(i) + ' solen votar amb el seu partit.') + " El teu vot queda a part, sota l'hemicicle: en quin bloc estaria depèn de qui votis.";
      case 7: return 'La nit del 29N, la teva papereta es compta a la teva mesa ' + deProv(i) + ', en públic i en veu alta.';
      case 8: return 'Aquest és el camí de la teva papereta ' + aProv(i) + ": de l'urna a la Moncloa.";
      case 10: return primero ? "L'hexàgon daurat és el primer escó que es va repartir " + aProv(i) + ': va ser per a <b>' + primero + '</b>.' : '';
      case 11: case 12: return primero ? "L'hexàgon daurat és el primer escó " + deProv(i) + ': va ser per a <b>' + primero + '</b>, el partit més votat allà.' : '';
      default: return '';
    }
  },

  /* navegación */
  estacion: (k, ultima) => k === 0 ? 'Sortida' : k === 14 ? 'Arribada' : 'Pas ' + k + ' de ' + ultima,
  donde: (k, ultima, lectura) => lectura ? 'Índex' : k === 0 ? 'Sortida' : k === 14 ? 'La Moncloa' : 'Pas ' + k + ' de ' + ultima,
  dondeVotas: 'On votes?',
  tocaMapa: 'També pots tocar la teva província al mapa.',
  fase2Cerrada: "Els passos del 9 al 13 s'obren el 30N, amb els resultats.",
  abre30N: '30N',   // junto a cada paso cerrado, en el menú
  sigueMiVoto: 'Segueix el meu vot: ',
  irResultados: 'Anar als resultats: ',   // fase 2: atajo de la salida al paso 9
  siguiente: 'Següent: ',
  verEscanos: 'Torna als 350 escons',
  verTexto: 'Mostra només el text',
  tapa: {
    banda: 'Eleccions generals · 29 de novembre de 2026',
    titulo: 'De les urnes a la Moncloa',
    sub: 'Milions de paperetes es converteixen en 350 escons, i els escons, en un Govern. Així funciona.',
    como: 'Com se segueix',
    pasos: ['Tria la província on votes.', 'Baixa: a cada pas, els 350 escons canvien de forma.', "El teu vot és l'hexàgon daurat: segueix-lo fins al final."],
    boton: 'Clica aquí per començar',
    texto: 'o llegeix només el text' },

  /* paso 1 */
  provElige: (i, n) => Prov(i) + (plural(i) ? ' escullen ' : ' escull ') + escons(n) + ' dels 350.',

  /* paso 2: la apuesta y la tabla de divisiones */
  apuestaIntro: (i, n) => Prov(i) + (plural(i) ? ' reparteixen ' : ' reparteix ') + escons(n) + ' entre cinc partits inventats. Quants en dones a cadascun?',
  ariaApuesta: letra => 'Escons per al partit ' + letra,
  resto: q => q === 0 ? 'Tot repartit.' : q === 1 ? 'Et queda 1 escó per repartir.' : 'Et queden ' + q + ' escons per repartir.',
  dhondtDa: n => "D'Hondt li'n dona " + n,
  acierto: (aciertos, total) => "N'has encertat " + aciertos + ' de ' + total + '.',
  partido: 'Partit',
  fuera: ' (fora)',
  // escaño número «orden» de «total», para el partido «letra» con el cociente ya escrito; division: si la casilla no cabe en la tabla, cuál es
  repartoPaso: (orden, total, letra, cociente, division) => 'Escó ' + orden + ' de ' + total + ': per a ' + letra + ', amb ' + cociente + (division ? ' (divisió ÷' + division + ', fora de la taula).' : '.'),
  repartoEmpieza: 'Comença el repartiment…',
  repartoFin: lista => 'Repartiment acabat: ' + lista + '.',

  /* paso 3 */
  habitantes: (i, porEscano, puesto, media) => AProv(i) + ' hi ha un escó per cada ' + miles(porEscano) + ' habitants (posició ' + puesto + " de 52, de menys a més). La mitjana d'Espanya és d'un per cada " + miles(media) + '.',
  comparacion: (soria, madrid) => soria + ' de 2 a Sòria · ' + madrid + ' de 38 a Madrid',
  tamanos: (pequenas, medianas, grandes) => 'De les 52 circumscripcions, ' + pequenas + ' reparteixen cinc escons o menys, ' + medianas + ' en reparteixen entre sis i nou i només ' + grandes + ' en reparteixen deu o més.',

  /* paso 4 */
  senTope: 'Només tres. Treu una marca per canviar-la.',
  senMarcadas: n => "N'has marcat " + n + ' de 3.',

  /* calculadoras de pactos (pasos 6 y 12) */
  voto: { no: 'No', si: 'Sí', abs: 'Abst.' },
  votoLargo: { no: 'no', si: 'sí', abs: 'abstenció' },
  ariaBarra: 'Barra de 350 escons amb la marca de 176',
  votacion1: '1a votació · majoria absoluta',
  votacion2: '2a votació · més sís que nos',
  copiar: "Copia l'enllaç a aquesta combinació",
  compartirComb: 'Comparteix aquesta combinació',   // en el móvil, con la hoja de compartir del teléfono
  enviada: (a, b) => "T'han enviat aquesta combinació. Canvia-la o " + a + 'comença pel principi' + b + '.',
  copiado: 'Enllaç copiat.',
  copiaManual: "Copia l'adreça del navegador: ja porta la combinació.",
  copiaDireccion: "Copia l'adreça del navegador",
  ariaPartido: (nombre, n, voto) => nombre + ', ' + escons(n) + ', vota ' + voto + '. Toca per canviar-ho',
  cuentaSi: n => 'Sí: ' + n,
  cuentaAbs: n => 'Abst.: ' + n,
  cuentaNo: n => 'No: ' + n,
  primera: si => si >= 176 ? 'Surt escollit: té ' + sis(si) + '.' : 'No surt escollit: ' + falten(176 - si) + '.',
  segunda: (si, no) => (si > no ? 'Surt escollit: ' : 'No surt escollit: ') + sis(si) + ' contra ' + nos(no) + '.',
  anuncioPacto: (si, abs, no, primera, segunda) => 'Sí ' + si + ', abstenció ' + abs + ', no ' + no + '. Primera votació: ' + primera + ' Segona: ' + segunda,
  calcNota: data => 'Escons que cada partit va treure a les eleccions ' + (/^(1|11)\D/.test(data) ? "de l'" : 'del ') + data + ', les últimes abans del 29N. No és una enquesta ni un resultat del 29N.',

  /* fase 2: los resultados */
  avisoPrueba: etiqueta => 'Vista prèvia amb dades de prova: ' + etiqueta + '. No són els resultats del 29N.',
  masEscanos: (nombre, n, pctVotos, absoluta) => nombre + ' és el partit amb més escons: ' + n + ', amb el ' + pctVotos + ' dels vots. ' + (absoluta ? 'Supera els 176 de la majoria absoluta.' : 'Cap partit no arriba tot sol als 176 de la majoria absoluta.'),
  participacion: p => ' Va votar el ' + p + ' del cens.',
  thVotos: 'Vots',
  thEscanos: 'Escons',
  thPorEscano: 'Vots per escó',
  fuenteRes: (prueba, etiqueta, fuente) => (prueba ? 'Dades de prova: ' : '') + etiqueta + '. Font: ' + fuente + '. Els escons es calculen aquí amb els vots de cada província.',
  repartia: (i, n) => Prov(i) + (plural(i) ? ' repartien ' : ' repartia ') + escons(n) + '.',
  ultimo: (ganador, rival, votos) => "L'últim escó va ser per a " + ganador + '. A ' + rival + ' li van faltar ' + miles(votos) + " vots per prendre-l'hi.",
  unico: ganador => "L'escó va ser per a " + ganador + '.',
  votos: n => miles(n) + ' vots',
  ysiIguales: 'Tria dos partits diferents.',
  ysiCambia: (n, de_, a, ultimo) => 'Amb ' + miles(n) + ' vots ' + de(de_) + ' a ' + a + ", canvia el repartiment. L'últim escó seria per a " + ultimo + '.',
  ysiNoCambia: (n, ultimo) => 'Amb ' + miles(n) + " vots, el repartiment no canvia. L'últim escó continua sent per a " + ultimo + '.',
  votosYEscanos: "El percentatge d'escons d'un partit gairebé mai coincideix amb el seu percentatge de vots.",
  sinEscano: (n, p) => miles(n) + ' vots (' + p + ') van anar a candidatures que no van aconseguir escó a la seva província.',
  loSiguiente: t => 'El que ve ara: ' + t.charAt(0).toLowerCase() + t.slice(1),
  calendarioCompleto: 'El calendari està complet.'
};

idioma(textos);
