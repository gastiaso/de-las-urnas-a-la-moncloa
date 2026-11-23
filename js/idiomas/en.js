// Textos del JavaScript en inglés. Mismas entradas que js/textos.js.
// La edición inglesa está adaptada para un lector de fuera de España: no habla de «tu voto», sino de un voto que se sigue.
import { idioma, parteFecha, parteEscrutado, ARTICULO } from '../textos.js';

// Las 52 circunscripciones, en el orden de PROV (js/datos.js): [en los desplegables, dentro de una frase]
const N = [['Albacete'], ['Alicante'], ['Almería'], ['Álava'], ['Asturias'], ['Ávila'], ['Badajoz'], ['Balearic Islands', 'the Balearic Islands'], ['Barcelona'], ['Bizkaia'],
  ['Burgos'], ['Cáceres'], ['Cádiz'], ['Cantabria'], ['Castellón'], ['Ciudad Real'], ['Córdoba'], ['Coruña (A)', 'A Coruña'], ['Cuenca'], ['Gipuzkoa'], ['Girona'], ['Granada'],
  ['Guadalajara'], ['Huelva'], ['Huesca'], ['Jaén'], ['León'], ['Lleida'], ['Lugo'], ['Madrid'], ['Málaga'], ['Murcia'], ['Navarre'], ['Ourense'], ['Palencia'],
  ['Palmas (Las)', 'Las Palmas'], ['Pontevedra'], ['Rioja (La)', 'La Rioja'], ['Salamanca'], ['Santa Cruz de Tenerife'], ['Segovia'], ['Seville'], ['Soria'], ['Tarragona'],
  ['Teruel'], ['Toledo'], ['Valencia'], ['Valladolid'], ['Zamora'], ['Zaragoza'], ['Ceuta'], ['Melilla']];
const prov = i => N[i][1] || N[i][0];
const may = s => s.charAt(0).toUpperCase() + s.slice(1);   // al principio de una frase: «The Balearic Islands»
const min = s => s.charAt(0).toLowerCase() + s.slice(1);
const escanos = n => n + (n === 1 ? ' seat' : ' seats');
const sies = n => n + (n === 1 ? ' yes vote' : ' yes votes');
const miles = n => Math.round(n).toLocaleString('en-GB');
const dec = x => x.toFixed(1);
const diputados = (i, n) => n === 1 ? 'The deputy for ' + prov(i) : 'The ' + n + ' deputies for ' + prov(i);
// Partidos con artículo (ARTICULO, en js/textos.js): «the PP», «the PSOE»; sin él, «Vox», «Sumar». b: en negrita, con el artículo fuera.
const theP = (p, b) => (ARTICULO[p] ? 'the ' : '') + (b ? '<b>' + p + '</b>' : p);
const MESES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Textos que llegan en castellano dentro de js/resultados.js (los escribe herramientas/resultados.py)
const DATOS = {
  'resultados del 23 de julio de 2023': 'results of the general election of 23 July 2023',
  'ministerio del interior, escrutinio del 23j (datos reunidos en porra electoral)': 'Ministry of the Interior, count of the 23 July election (data compiled by Porra Electoral)',
  'escrutinio provisional del 29 de noviembre de 2026': 'provisional count of 29 November 2026',
  'ministerio del interior': 'Ministry of the Interior',
  'ministerio del interior, escrutinio provisional': 'Ministry of the Interior, provisional count',
  'escrutinio general del 4 de diciembre de 2026': 'general count of 4 December 2026',
  'ministerio del interior, escrutinio general': 'Ministry of the Interior, general count',
  '29 nov': '29 Nov', '4 dic': '4 Dec', '23 dic': '23 Dec', 'sin fecha': 'No date', '1.ª votación': '1st vote', '48 h después': '48 h later', 'gobierno': 'Government',
  'votación.': 'Polling day.',
  'escrutinio general: el recuento oficial.': 'General count: the official tally.',
  'se constituyen el congreso y el senado.': 'Congress and the Senate are constituted.',
  'el rey consulta a los grupos y propone un candidato.': 'The King consults the groups and nominates a candidate.',
  'hacen falta 176 síes. arranca el reloj de dos meses.': '176 yes votes are needed. The two-month clock starts.',
  '2.ª votación: más síes que noes.': '2nd vote: more yes votes than no votes.',
  'el rey nombra al presidente.': 'The King appoints the prime minister.' };

export const textos = {
  cod: 'en',
  locale: 'en',

  /* números y provincias */
  miles, dec,
  pct: x => dec(x * 100) + '%',
  pctEntero: n => n + '%',
  provLista: i => N[i][0],
  prov,
  escanos, sies,

  titulos: ['Start', "What's being elected", 'From votes to seats', 'Where the vote is cast', 'The Senate', 'Majorities', 'Deals', 'From 29 November to a government', 'Wrap-up',
    'What happened', 'In one province', 'Votes and seats', 'Who governs?', "What's next", 'La Moncloa'],
  sen: ['Person 1 · Party A', 'Person 2 · Party A', 'Person 3 · Party A', 'Person 4 · Party B', 'Person 5 · Party B', 'Person 6 · Party C'],
  glos: {
    escano: ["Seat (escaño)", "Each of the 350 places in Congress; those in the Senate have the same name. Whoever holds one in Congress is a deputy (diputado or diputada): a member of parliament."],
    circ: ['Constituency (circunscripción)', 'The area in which votes are counted and seats are shared out. In a general election it is the province; Ceuta and Melilla are one each.'],
    dhondt: ["D'Hondt method", "The way the seats in each province are shared out: each party's votes are divided by 1, 2, 3… and the seats go to the highest results."],
    barrera: ['Threshold (barrera electoral)', 'The minimum needed to enter the share-out: 3% of the valid votes in the province.'],
    blanco: ["Blank vote (voto en blanco)", "An envelope with no ballot paper in it; for the Senate, also a ballot paper with no cross on it. It is a valid vote: it goes to no party, but it counts in the total."],
    nulo: ['Spoilt vote (voto nulo)', 'A vote that does not count: for example, a ballot paper with crossings-out or additions, or an envelope that is not the official one.'],
    absoluta: ['Absolute majority (mayoría absoluta)', 'More than half of all deputies, whether they vote or not: 176 of 350.'],
    simple: ['Simple majority (mayoría simple)', 'More votes in favour than against. Abstentions do not count.'],
    investidura: ['Investiture (investidura)', 'The vote in which Congress gives its confidence to a candidate for prime minister.'],
    abstencion: ["Abstention", "In an election, not turning out to vote. In a vote in Congress, voting neither yes nor no: it adds neither to the votes in favour nor to those against."],
    mesa: ['Bureau of Congress (Mesa del Congreso)', 'The body that runs the chamber: a president (the speaker), four vice-presidents and four secretaries. It is elected on the first day.'],
    grupo: ['Parliamentary group (grupo parlamentario)', "A party's deputies organised as a group in Congress. As a rule fifteen are needed; there is another route with five if a minimum share of the vote is reached."],
    funciones: ['Caretaker government (Gobierno en funciones)', 'The government that has already left office and stays in charge, with limited powers, until the new one comes in.'],
    escrutinio: ['General count (escrutinio general)', 'The official count, carried out by the electoral boards five days after polling day.'],
    censura: ['Motion of no confidence (moción de censura)', 'The way to change prime minister without an election: it needs an absolute majority and proposes an alternative candidate.'],
    designacion: ['Appointed senator (senador por designación)', 'A senator chosen not by voters but by the parliament of each autonomous community.'],
    cortes: ['Cortes Generales', "Spain's parliament: Congress and the Senate together. They make laws, approve the budget and hold the government to account."],
    censo: ['Electoral register (censo electoral)', 'The official list of those who can vote. To vote, a person has to be on it.'],
    mesael: ['Polling station board (mesa electoral)', "The team in charge of a ballot box: a chair and two members, drawn by lot from among that station's voters."],
    junta: ['Electoral board (junta electoral)', 'The body that sees that elections are clean and carries out the official count. There is a central one, one per province and others at district level.'],
    lista: ['List (lista)', "A party's candidates in a province: as many candidates as there are seats, in a fixed order, plus up to ten substitutes."],
    suplente: ['Substitute (suplente)', 'A candidate placed at the end of the list, behind the main names, who comes in only if a seat falls vacant and no candidates are left ahead. In the Senate, each candidate has two.'],
    quorum: ['Quorum', 'The minimum attendance for a vote to be valid: more than half the chamber.'],
    organica: ['Organic law (ley orgánica)', 'A law on weightier matters, such as fundamental rights or the electoral rules. It needs an absolute majority in Congress.'],
    decretoley: ['Decree-law (decreto-ley)', 'A measure the government passes on grounds of urgency. Congress has thirty days to uphold it or strike it down.'],
    confianza: ['Confidence vote (cuestión de confianza)', 'The vote a prime minister calls to check that Congress still backs them. A simple majority is enough; if it is lost, the prime minister resigns.'],
    veto: ['Senate veto', "The Senate's rejection of a bill that comes from Congress. Congress can override it."],
    permanente: ["Permanent Deputation (Diputación Permanente)", "The small group that stays on duty in each chamber when they are dissolved or not sitting. There is one in Congress and one in the Senate."],
    validos: ["Valid votes (votos válidos)", "Votes for a party plus blank votes. Spoilt votes do not count."],
    hemiciclo: ["The chamber (hemiciclo)", "The debating chamber of Congress, with the seats laid out in a half-circle."]
  },
  fecha: f => { const x = parteFecha(f); return x ? x.d + ' ' + MESES[x.m - 1] + ' ' + x.a : f; },
  // la etiqueta de la noche lleva el porcentaje escrutado: «…, with 99.9% of the vote counted»
  dato: s => { const e = parteEscrutado(s); return e ? (DATOS[e.t.toLowerCase()] || e.t) + ', with ' + e.n.replace(',', '.') + '% of the vote counted' : DATOS[String(s).toLowerCase()] || s; },

  /* el escenario */
  ariaEscenario: 'The 350 seats in Congress, which change shape at every step. The gold hexagon is the vote being followed.',
  tuVoto: 'One vote',
  primerEscano: i => '1st seat in ' + prov(i),
  rotulo: (k, i, n, revelado) => ({
    0: '350 seats: one hexagon per seat',
    1: may(prov(i)) + ': ' + n + ' of 350',
    2: revelado ? may(prov(i)) + ": how D'Hondt shares out " + (n === 1 ? 'its seat' : 'its ' + n + ' seats') : may(prov(i)) + ': ' + escanos(n) + ' to share out',
    3: 'Darker: fewer inhabitants per seat',
    4: 'Senate: 209 elected, four per province',
    5: '176 of 350: the absolute majority',
    7: 'The Congress that will choose the prime minister<small>The two-month deadline starts with the first vote.</small>',
    8: '350 seats',
    9: 'Each seat in the colour of its party',
    10: may(prov(i)) + ': ' + escanos(n),
    11: 'The Congress that came out of the ballot boxes',
    13: 'The Congress that came out of the ballot boxes',
    14: '350 seats' }[k] || ''),
  rotuloPacto: c => 'Yes ' + c.si + ' · Abst. ' + c.abs + ' · No ' + c.no + '<small>' + (c.si >= 176 ? 'Elected at the first vote: 176 yes votes or more.'
    : c.si > c.no ? 'Short of 176, but elected at the second vote.'
    : c.si === 0 ? 'Tap the parties to build a majority.'
    : 'Not elected: ' + sies(176 - c.si) + ' short of 176.') + '</small>',
  piePacto: "Each seat in its party's colour. The vote being followed stands apart: which bloc it would be in depends on the party it went to.",
  piePactoRes: "Each seat in its party's colour. The yes votes gather on the left, then the abstentions, then the no votes.",

  /* la frase del voto que se sigue, en cada paso */
  islas: {
    7: 'Mallorca elects three senators and voters mark two names; Menorca, Ibiza and Formentera elect one each',
    35: 'Gran Canaria elects three senators and voters mark two names; Lanzarote and Fuerteventura elect one each',
    39: 'Tenerife elects three senators and voters mark two names; La Palma, La Gomera and El Hierro elect one each' },
  frase(k, { i, n, entran, soria, madrid, primero }) {
    const nom = prov(i), uno = n === 1;
    switch (k) {
      case 0: return 'The gold hexagon is one vote. Choose where it is cast and follow it to the end.';
      case 1: return (uno ? 'The gold hexagon is one vote cast in ' + nom + ': it sits on the only seat there.' : 'The gold hexagon is one vote cast in ' + nom + ': it sits among the seats of that province, in terracotta.') + ' The white ballot paper, the one for Congress, goes into its own ballot box.';
      case 2: return uno ? 'That vote is added to its party\'s total in ' + nom + '. There is a single seat there: it goes to the party with most votes.'
        : 'That vote is added to its party\'s total in ' + nom + ', and it only enters the share-out if the party reaches 3% of the valid votes in the province.';
      case 3:
        if (uno) return 'In ' + nom + ' there is a single seat: with the five made-up parties from step 2, only the one with most votes would get in.';
        if (n === 2 || n === 38) return 'With the five made-up parties from step 2, <b>' + entran + '</b> get in in ' + nom + '. It is one of the two extremes of the table.';
        return 'With the five made-up parties from step 2, the ' + n + ' seats in ' + nom + ' give a seat to <b>' + entran + '</b> of them: ' + (entran > soria ? 'more than' : 'as many as') + ' in Soria (' + soria + ') and ' + (entran < madrid ? 'fewer than' : 'as many as') + ' in Madrid (' + madrid + ').';
      case 4:
        if (this.islas[i]) return 'The second ballot paper, the sepia one, is for the Senate. In ' + nom + ' it depends on the island: ' + this.islas[i] + '.';
        if (uno) return 'The second ballot paper, the sepia one, is for the Senate. ' + may(nom) + ' goes from one deputy to <b>two</b> senators.';
        return 'The second ballot paper, the sepia one, is for the Senate. On the map, ' + nom + ' goes from ' + n + ' deputies to <b>four</b> senators, like every province on the mainland.';
      case 5: return diputados(i, n) + (uno ? ' sits' : ' sit') + ' with the other ' + (350 - n) + '. ' + (uno ? 'The vote being followed counts towards that seat only if its party comes first there.' : 'The vote being followed counts towards one of those seats only if its party wins a seat there.');
      case 6: return diputados(i, n) + (uno ? ' usually votes with their party.' : ' usually vote with their party.') + ' The vote being followed stands apart, below the chamber: which bloc it would be in depends on the party it went to.';
      case 7: return 'On the night of 29 November, that ballot paper is counted at its polling station in ' + nom + ', in public and out loud.';
      case 8: return 'That is the path of one ballot paper cast in ' + nom + ': from the ballot box to La Moncloa.';
      case 10: return primero ? 'The gold hexagon is the first seat shared out in ' + nom + ': it went to ' + theP(primero, true) + '.' : '';
      case 11: case 12: return primero ? 'The gold hexagon is the first seat in ' + nom + ': it went to ' + theP(primero, true) + ', the party with most votes there.' : '';
      default: return '';
    }
  },

  /* navegación */
  estacion: (k, ultima) => k === 0 ? 'Start' : k === 14 ? 'Finish' : 'Step ' + k + ' of ' + ultima,
  donde: (k, ultima, lectura) => lectura ? 'Contents' : k === 0 ? 'Start' : k === 14 ? 'La Moncloa' : 'Step ' + k + ' of ' + ultima,
  dondeVotas: 'Choose a province',
  tocaMapa: 'You can also tap a province on the map.',
  fase2Cerrada: 'Steps 9 to 13 open on 30 November, with the results.',
  abre30N: '30 Nov',   // junto a cada paso cerrado, en el menú
  sigueMiVoto: 'Follow the vote: ',
  siguiente: 'Next: ',
  verEscanos: 'Back to the 350 seats',
  verTexto: 'Text only',
  tapa: {
    banda: 'Spanish general election · 29 November 2026',
    titulo: 'From the ballot box to La Moncloa',
    sub: "Millions of ballot papers become 350 seats, and the seats become a government in La Moncloa, the prime minister's residence. This is how Spain does it.",
    como: 'How to follow it',
    pasos: ['Choose a province: the gold hexagon is one vote cast there.', 'Scroll down: at each step, the 350 seats change shape.', 'Follow the gold hexagon to the end.'],
    boton: 'Click here to start',
    texto: 'or just read the text' },

  /* paso 1 */
  provElige: (i, n) => 'Voters in ' + prov(i) + ' elect ' + n + ' of the 350 deputies.',

  /* paso 2 */
  apuestaIntro: (i, n) => 'In ' + prov(i) + ' there ' + (n === 1 ? 'is ' : 'are ') + escanos(n) + ' to share out among five made-up parties. How many would you give each one?',
  ariaApuesta: letra => 'Seats for party ' + letra,
  resto: q => q === 0 ? 'All shared out.' : q === 1 ? 'You have 1 seat left to share out.' : 'You have ' + q + ' seats left to share out.',
  dhondtDa: n => "D'Hondt gives it " + n,
  acierto: (aciertos, total) => 'You got ' + aciertos + ' of ' + total + ' right.',
  partido: 'Party',
  fuera: ' (out)',
  repartoPaso: (orden, total, letra, cociente, division) => 'Seat ' + orden + ' of ' + total + ': goes to ' + letra + ', with ' + cociente + (division ? ' (division ÷' + division + ', off the table).' : '.'),
  repartoEmpieza: 'The share-out begins…',
  repartoFin: lista => 'Share-out complete: ' + lista + '.',

  /* paso 3 */
  habitantes: (i, porEscano, puesto, media) => 'In ' + prov(i) + ' there is one seat for every ' + miles(porEscano) + ' inhabitants (number ' + puesto + ' of 52, from fewest to most). The average for Spain is one for every ' + miles(media) + '.',
  comparacion: (soria, madrid) => soria + ' of 2 in Soria · ' + madrid + ' of 38 in Madrid',
  tamanos: (pequenas, medianas, grandes) => 'Of the 52 constituencies, ' + pequenas + ' elect five seats or fewer, ' + medianas + ' elect between six and nine and only ' + grandes + ' elect ten or more.',

  /* paso 4 */
  senTope: 'Three at most. Untick one to change it.',
  senMarcadas: n => 'You have marked ' + n + ' of 3.',

  /* calculadoras de pactos */
  voto: { no: 'No', si: 'Yes', abs: 'Abst.' },
  votoLargo: { no: 'votes no', si: 'votes yes', abs: 'abstains' },
  ariaBarra: 'Bar of 350 seats with the 176 mark',
  votacion1: '1st vote · absolute majority',
  votacion2: '2nd vote · more yes than no',
  copiar: 'Copy a link to this combination',
  copiado: 'Link copied.',
  copiaManual: "Copy the address from the browser: it already carries the combination.",
  copiaDireccion: 'Copy the address from the browser',
  ariaPartido: (nombre, n, voto) => nombre + ', ' + escanos(n) + ', ' + voto + '. Tap to change',
  cuentaSi: n => 'Yes: ' + n,
  cuentaAbs: n => 'Abst.: ' + n,
  cuentaNo: n => 'No: ' + n,
  primera: si => si >= 176 ? 'Elected: ' + sies(si) + '.' : 'Not elected: ' + sies(176 - si) + ' short.',
  segunda: (si, no) => (si > no ? 'Elected: ' : 'Not elected: ') + si + ' yes to ' + no + ' no.',
  anuncioPacto: (si, abs, no, primera, segunda) => 'Yes ' + si + ', abstentions ' + abs + ', no ' + no + '. First vote: ' + primera + ' Second: ' + segunda,
  calcNota: fecha => 'Seats each party won at the general election of ' + fecha + ', the last one before the 29 November vote. It is neither a poll nor a result of the 29 November election.',

  /* fase 2 */
  avisoPrueba: etiqueta => 'Preview with test data: ' + etiqueta + '. These are not the results of 29 November.',
  masEscanos: (nombre, n, pctVotos, absoluta) => may(theP(nombre)) + ' is the party with most seats: ' + n + ', with ' + pctVotos + ' of the vote. ' + (absoluta ? 'That is more than the 176 of an absolute majority.' : 'No party reaches the 176 of an absolute majority on its own.'),
  participacion: p => ' Turnout was ' + p + ' of the electoral register.',
  provisionalRes: ' These are provisional results until the general count on 4 December, which adds the votes from abroad.',
  thVotos: 'Votes',
  thEscanos: 'Seats',
  thPorEscano: 'Votes per seat',
  fuenteRes: (prueba, etiqueta, fuente) => (prueba ? 'Test data: ' + etiqueta : may(etiqueta)) + '. Source: ' + fuente + '. The seats are calculated here from the votes in each province; the official ones are proclaimed by the electoral boards.',
  /* paso 9: frente a 2023 */
  lista: xs => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1],
  frente2023(gana, mas, pierde, menos, todos) {
    if (!gana.length && !pierde.length) return todos ? 'Every party has the same number of seats as at the 2023 general election.' : 'The parties that can be compared with 2023 have the same number of seats as then.';
    const g = gana.length ? (gana.length > 1 ? 'the parties gaining most seats are ' : 'the party gaining most seats is ') + this.lista(gana) + ' (+' + mas + ')' : '';
    const p = pierde.length ? (pierde.length > 1 ? (g ? 'those losing most are ' : 'the parties losing most seats are ') : (g ? 'the one losing most is ' : 'the party losing most seats is ')) + this.lista(pierde) + ' (−' + menos + ')' : '';
    return 'Compared with the 2023 general election, ' + [g, p].filter(Boolean).join('; ') + '.' + (todos && !p ? ' No party loses seats.' : todos && !g ? ' No party gains seats.' : '');
  },
  tabla2023: 'Seats for each party in 2023 and on 29 November',
  th2023: '2023',
  th29N: '29 Nov',
  thDif: 'Change',
  nuevo: 'new',
  sinCifra: { nuevo: 'did not stand in 2023', falta: 'no equivalent in 2023', solo2023: 'no equivalent on 29 November', dentro: ref => 'in 2023, part of ' + ref },
  notas2023: {
    faSumar: 'Frente Amplio is compared with Sumar, which in 2023 included Podemos.',
    faNuevo: 'Frente Amplio did not stand in 2023.',
    sumar: 'In 2023, Sumar included Podemos.',
    podemos: 'In 2023, Podemos stood as part of Sumar: it has no figure of its own to compare with.',
    aa: 'In 2023, Adelante Andalucía stood only in Cádiz, and won no seat.',
    salf: 'SALF did not stand in 2023.' },
  fuente2023: '2023 seats: as declared by the <a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907">Central Electoral Board</a>.',
  frase2023(i, { e, e23, cambios, iguales, sin, antes }) {
    const nom = prov(i), d = e - e23, b = c => '<b>' + c.nombre + '</b>', o = [];
    if (!cambios.length && !sin.length && !antes.length) return e === 1 ? 'In ' + nom + ', the seat goes to the same party as in 2023.' : 'In ' + nom + ', the ' + e + ' seats are shared out as in 2023.';
    if (d) o.push('There ' + (e === 1 ? 'is ' : 'are ') + escanos(e) + ' in ' + nom + ', ' + (Math.abs(d) === 1 ? 'one' : Math.abs(d)) + (d > 0 ? ' more' : ' fewer') + ' than in 2023.');
    const cm = this.lista(cambios.map(c => b(c) + ' ' + c.signo)), ig = iguales.length ? this.lista(iguales) + ' unchanged' : '';
    if (cm || ig) o.push((d ? 'By party: ' : 'In ' + nom + ', compared with 2023: ') + [cm, ig].filter(Boolean).join('; ') + '.');
    if (sin.length) o.push('Cannot be compared with 2023: ' + this.lista(sin.map(c => b(c) + ' (' + escanos(c.n) + ')')) + '.');
    if (antes.length) o.push('No equivalent on 29 November: ' + this.lista(antes.map(c => b(c) + ' (' + escanos(c.n) + ' in 2023)')) + '.');
    return o.join(' ');
  },
  repartia: (i, n) => 'There ' + (n === 1 ? 'was ' : 'were ') + escanos(n) + ' to share out in ' + prov(i) + '.',
  ultimo: (ganador, rival, votos) => 'The last seat went to ' + theP(ganador) + '. ' + may(theP(rival)) + ' fell ' + (votos === 1 ? '1 vote' : miles(votos) + ' votes') + ' short of taking it.',
  provisionalUltimo: ' This is the provisional count: the votes from abroad, added on 4 December, could change it.',
  unico: ganador => 'The seat went to ' + theP(ganador) + '.',
  provisional12: 'These are the seats from the provisional count. The general count on 4 December adds the votes from abroad and could move some of them.',
  votos: n => miles(n) + ' votes',
  ysiIguales: 'Choose two different parties.',
  ysiCambia: (n, de, a, ultimo) => 'With ' + miles(n) + ' votes moved from ' + theP(de) + ' to ' + theP(a) + ', the share-out changes. The last seat would go to ' + theP(ultimo) + '.',
  ysiNoCambia: (n, ultimo) => 'With ' + miles(n) + ' votes moved, the share-out does not change. The last seat still goes to ' + theP(ultimo) + '.',
  votosYEscanos: "A party's share of the seats almost never matches its share of the votes.",
  sinEscano: (n, p) => miles(n) + ' votes (' + p + ') went to candidacies that won no seat in their province.',
  loSiguiente: t => 'Next: ' + min(t),
  calendarioCompleto: 'The calendar is complete.'
};
idioma(textos);
