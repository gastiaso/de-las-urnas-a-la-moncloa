// Textos del JavaScript en gallego. Mismas entradas que js/textos.js.
import { idioma, parteFecha } from '../textos.js';

const escanos = n => n + (n === 1 ? ' escano' : ' escanos');
const sies = n => n + (n === 1 ? ' si' : ' sis');
const noes = n => n + (n === 1 ? ' non' : ' nons');
const miles = n => Math.round(n).toLocaleString('es-ES');   // miles con punto, igual que en castellano
const dec = x => x.toFixed(1).replace('.', ',');
const nvotos = n => miles(n) + (Math.round(n) === 1 ? ' voto' : ' votos');
const faltan = n => (n === 1 ? 'falta ' : 'faltan ') + sies(n);
const mai = s => s.charAt(0).toUpperCase() + s.slice(1);
const PORRA = '<a href="https://gastiaso.github.io/porra-electoral/">Porra Electoral</a>';

/* provincias: las 52 circunscripciones en el mismo orden que PROV (js/datos.js), con las formas que recomienda la RAG */
const NOMES = ['Albacete', 'Alacante', 'Almería', 'Áraba', 'Asturias', 'Ávila', 'Badaxoz', 'Illas Baleares', 'Barcelona', 'Biscaia', 'Burgos', 'Cáceres', 'Cádiz',
  'Cantabria', 'Castelló', 'Cidade Real', 'Córdoba', 'A Coruña', 'Cuenca', 'Guipúscoa', 'Xirona', 'Granada', 'Guadalaxara', 'Huelva', 'Huesca', 'Xaén', 'León',
  'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'As Palmas', 'Pontevedra', 'A Rioxa', 'Salamanca', 'Santa Cruz de Tenerife',
  'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Zamora', 'Zaragoza', 'Ceuta', 'Melilla'];
// Las cuatro que llevan artículo. lista: cómo salen en los desplegables; nome: el nombre sin el artículo; art: el artículo;
// propio: el artículo es parte del nombre y va siempre con mayúscula («A Coruña»); plural: el verbo concuerda en plural
const ARTIGO = {
  7: { lista: 'Baleares (Illas)', nome: 'Illas Baleares', art: 'as', plural: true },
  17: { lista: 'Coruña (A)', nome: 'Coruña', art: 'a', propio: true },
  35: { lista: 'Palmas (As)', nome: 'Palmas', art: 'as', propio: true },
  37: { lista: 'Rioxa (A)', nome: 'Rioxa', art: 'a', propio: true } };
const CONTRACCION = { en: { a: 'na', as: 'nas' }, de: { a: 'da', as: 'das' }, a: { a: 'á', as: 'ás' } };
const prov = i => NOMES[i];
const provLista = i => ARTIGO[i] ? ARTIGO[i].lista : NOMES[i];
// preposición + provincia: «na Coruña», «das Illas Baleares», «á Rioxa»; sin artículo, «en Soria», «de Soria», «a Soria»
const con = (prep, i) => ARTIGO[i] ? CONTRACCION[prep][ARTIGO[i].art] + ' ' + ARTIGO[i].nome : prep + ' ' + NOMES[i];
const en = i => con('en', i), de = i => con('de', i);
const En = i => mai(en(i));
// la provincia de sujeto: al empezar la frase («As Illas Baleares», «A Coruña») o en medio («as Illas Baleares», «A Coruña»)
const suxeito = (i, inicio) => { const p = ARTIGO[i]; return !p ? NOMES[i] : (p.propio || inicio ? mai(p.art) : p.art) + ' ' + p.nome; };
const verbo = (i, singular, plural) => ARTIGO[i] && ARTIGO[i].plural ? plural : singular;

/* textos que en castellano viven en js/datos.js */
const TITULOS = ['Saída', 'Que se vota', 'Do voto ao escano', 'Onde votas', 'O Senado', 'As maiorías', 'Pactos', 'Do 29N ao Goberno', 'Peche',
  'Que pasou', 'Na túa provincia', 'Votos e escanos', 'Quen goberna?', 'O que vén', 'A Moncloa'];
const SEN = ['Persoa 1 · Partido A', 'Persoa 2 · Partido A', 'Persoa 3 · Partido A', 'Persoa 4 · Partido B', 'Persoa 5 · Partido B', 'Persoa 6 · Partido C'];
const GLOS = {
  escano: ['Escano', 'Cada un dos 350 asentos do Congreso. Quen o ocupa é deputado ou deputada.'],
  circ: ['Circunscrición', 'A zona na que se contan os votos e se reparten os escanos. Nas xerais é a provincia; Ceuta e Melilla son unha cada unha.'],
  dhondt: ["Regra D'Hondt", 'A forma de repartir os escanos de cada provincia: divídense os votos de cada partido entre 1, 2, 3… e os escanos van para os resultados máis altos.'],
  barrera: ['Barreira electoral', 'O mínimo para entrar no reparto: o 3 % dos votos válidos da provincia.'],
  blanco: ['Voto en branco', 'Un sobre sen papeleta. É un voto válido: non vai para ningún partido, pero conta no total.'],
  nulo: ['Voto nulo', 'Un voto que non vale: por exemplo, unha papeleta con algo riscado ou engadido, ou un sobre que non é o oficial.'],
  absoluta: ['Maioría absoluta', 'Máis da metade de todos os deputados, voten ou non: 176 de 350.'],
  simple: ['Maioría simple', 'Máis votos a favor que en contra. As abstencións non contan.'],
  investidura: ['Investidura', 'A votación na que o Congreso lle dá a súa confianza a un candidato a presidente do Goberno.'],
  abstencion: ['Abstención', 'Nin si nin non. Non suma a favor, pero tampouco en contra.'],
  mesa: ['Mesa do Congreso', 'O órgano que dirixe a Cámara: unha presidencia, catro vicepresidencias e catro secretarías. Elíxese o primeiro día.'],
  grupo: ['Grupo parlamentario', 'A agrupación dos deputados dun partido no Congreso. Por regra xeral fan falta quince; hai outra vía con cinco se se supera un mínimo de votos.'],
  funciones: ['Goberno en funcións', 'O Goberno que xa cesou e segue á fronte ata que entra o novo, con poderes limitados.'],
  escrutinio: ['Escrutinio xeral', 'O reconto oficial, que fan as xuntas electorais cinco días despois de votar.'],
  censura: ['Moción de censura', 'A vía para cambiar de presidente sen eleccións: necesita maioría absoluta e propón un candidato alternativo.'],
  designacion: ['Senador por designación', 'O que non elixen os votantes, senón o parlamento de cada comunidade autónoma.'],
  cortes: ['Cortes Xerais', 'O Congreso e o Senado xuntos. Fan as leis, aproban os Orzamentos e controlan o Goberno.'],
  censo: ['Censo electoral', 'A lista oficial de quen pode votar. Para votar hai que estar inscrito nela.'],
  mesael: ['Mesa electoral', 'O equipo que atende a urna: un presidente e dous vogais, elixidos por sorteo entre os votantes desa mesa.'],
  junta: ['Xunta electoral', 'O órgano que vixía que as eleccións sexan limpas e fai o reconto oficial. Hai unha central, unha por provincia e outras de zona.'],
  lista: ['Lista', 'A candidatura dun partido nunha provincia: tantos nomes como escanos se reparten, nunha orde fixa.'],
  suplente: ['Suplente', 'Quen vai na lista por detrás dos titulares e entra se algún deles deixa o escano.'],
  quorum: ['Quórum', 'O mínimo de asistentes para que unha votación valla: máis da metade da Cámara.'],
  organica: ['Lei orgánica', 'Unha lei sobre asuntos de máis peso, como os dereitos fundamentais ou as regras electorais. Necesita maioría absoluta do Congreso.'],
  decretoley: ['Decreto lei', 'Unha norma que o Goberno aproba por urxencia. O Congreso ten trinta días para mantela ou tombala.'],
  confianza: ['Cuestión de confianza', 'A votación que pide o propio presidente para comprobar que o Congreso o segue apoiando. Abóndalle a maioría simple; se a perde, dimite.'],
  veto: ['Veto do Senado', 'O rexeitamento do Senado a unha lei que vén do Congreso. O Congreso pode levantalo.'],
  permanente: ['Deputación Permanente', 'O grupo reducido de deputados (e outro de senadores) que queda de garda cando as Cámaras están disoltas ou non se reúnen.']
};

/* la fecha de corte de la estimación: «8 de noviembre de 2026» o «2026-11-08» → «8 de novembro de 2026» */
const MESES = ['xaneiro', 'febreiro', 'marzo', 'abril', 'maio', 'xuño', 'xullo', 'agosto', 'setembro', 'outubro', 'novembro', 'decembro'];
const fecha = f => { const p = parteFecha(f); return p ? p.d + ' de ' + MESES[p.m - 1] + ' de ' + p.a : f; };

/* los textos que vienen dentro de js/resultados.js (etiqueta, fuente e hitos): castellano → gallego */
const DATOS = {
  'resultados del 23 de julio de 2023': 'resultados do 23 de xullo de 2023',
  'Ministerio del Interior, escrutinio del 23J (datos reunidos en Porra Electoral)': 'Ministerio do Interior, escrutinio do 23J (datos reunidos en Porra Electoral)',
  'Escrutinio provisional del 29 de noviembre de 2026': 'Escrutinio provisional do 29 de novembro de 2026',
  'Ministerio del Interior': 'Ministerio do Interior',
  '29 nov': '29 nov',
  '4 dic': '4 dec',
  '23 dic': '23 dec',
  'Sin fecha': 'Sen data',
  '1.ª votación': '1.ª votación',
  '48 h después': '48 h despois',
  'Gobierno': 'Goberno',
  'Votación.': 'Votación.',
  'Escrutinio general: el recuento oficial.': 'Escrutinio xeral: o reconto oficial.',
  'Se constituyen el Congreso y el Senado.': 'Constitúense o Congreso e o Senado.',
  'El Rey consulta a los grupos y propone un candidato.': 'O Rei consulta os grupos e propón un candidato.',
  'Hacen falta 176 síes. Arranca el reloj de dos meses.': 'Fan falta 176 sis. Arrinca o reloxo de dous meses.',
  '2.ª votación: más síes que noes.': '2.ª votación: máis sis que nons.',
  'El Rey nombra al presidente.': 'O Rei nomea o presidente.'
};
// Busca sin distinguir si la primera letra llega en mayúscula o en minúscula, y la devuelve como llegó. Si no está, deja el texto igual.
const dato = s => {
  if (typeof s !== 'string' || !s) return s;
  if (s in DATOS) return DATOS[s];
  const c = s.charAt(0), resto = s.slice(1), mayuscula = c !== c.toLowerCase();
  const otra = (mayuscula ? c.toLowerCase() : c.toUpperCase()) + resto;
  if (!(otra in DATOS)) return s;
  const t = DATOS[otra];
  return (mayuscula ? t.charAt(0).toUpperCase() : t.charAt(0).toLowerCase()) + t.slice(1);
};

const ISLAS = {
  7: 'Mallorca elixe tres senadores e márcanse dous nomes; Menorca, Ibiza e Formentera elixen un cada unha',
  35: 'Gran Canaria elixe tres senadores e márcanse dous nomes; Lanzarote e Fuerteventura elixen un cada unha',
  39: 'Tenerife elixe tres senadores e márcanse dous nomes; A Palma, A Gomera e O Hierro elixen un cada unha' };

export const textos = {
  cod: 'gl',
  locale: 'gl',

  /* números y provincias */
  miles, dec,
  pct: x => dec(x * 100) + ' %',
  pctEntero: n => n + ' %',
  provLista,
  prov,
  escanos, sies,

  /* textos que en castellano viven en js/datos.js */
  titulos: TITULOS, sen: SEN, glos: GLOS,
  fecha,
  dato,

  /* el escenario */
  ariaEscenario: 'Os 350 escanos do Congreso, que cambian de forma en cada paso. O hexágono dourado é o teu voto.',
  tuVoto: 'O teu voto',
  primerEscano: i => '1.º escano ' + de(i),
  rotulo: (k, i, n, revelado) => ({
    0: '350 escanos: un hexágono por escano',
    1: prov(i) + ': ' + n + ' de 350',
    2: revelado ? prov(i) + ": así reparte D'Hondt " + (n === 1 ? 'o seu escano' : 'os seus ' + n) : prov(i) + ': ' + escanos(n) + ' por repartir',
    3: 'Máis escuro: menos habitantes por escano',
    4: 'Senado: 209 elixidos, catro por provincia',
    5: '176 de 350: a maioría absoluta',
    8: '350 escanos',
    9: 'Cada escano, da cor de quen o gañou',
    10: prov(i) + ': ' + escanos(n),
    11: 'O Congreso que sae das urnas',
    13: 'O Congreso que sae das urnas',
    14: '350 escanos' }[k] || ''),
  rotuloPacto: c => 'Si ' + c.si + ' · Abst. ' + c.abs + ' · Non ' + c.no + '<small>' + (c.si >= 176 ? 'Sae á primeira: 176 sis ou máis.'
    : c.si > c.no ? 'Non chega a 176, pero sae na segunda votación.'
    : c.si === 0 ? 'Toca os partidos para formar unha maioría.'
    : 'Non sae: ' + faltan(176 - c.si) + ' para chegar a 176.') + '</small>',
  piePacto: 'Cada escano, da cor do seu partido. O teu voto, á parte: en que bloque estaría depende de a quen votes.',
  piePactoRes: 'Cada escano, da cor do seu partido. Os sis xúntanse á esquerda, despois as abstencións e despois os nons.',

  /* la frase de «Tu voto» de cada paso */
  islas: ISLAS,
  frase(k, { i, n, entran, soria, madrid, primero }) {
    const uno = n === 1;
    switch (k) {
      case 0: return 'O teu voto é o hexágono dourado. Elixe onde votas e ségueo ata o final.';
      case 1: return (uno ? 'O teu voto é o hexágono dourado: é o único escano ' + de(i) + '.' : 'O teu voto é o hexágono dourado: está ' + en(i) + ', entre os escanos da túa provincia, en cor tella.') + ' A túa papeleta branca, a do Congreso, vai á súa urna.';
      case 2: return uno ? 'O teu voto súmase ao do teu partido ' + en(i) + '. Alí hai un só escano: é para o máis votado.'
        : 'O teu voto súmase ao do teu partido ' + en(i) + ', e só entra no reparto se ese partido chega ao 3 % dos votos válidos da provincia.';
      case 3:
        if (uno) return En(i) + ' hai un só escano: cos cinco partidos inventados do paso 2, só entraría o máis votado.';
        if (n === 2 || n === 38) return 'Cos cinco partidos inventados do paso 2, ' + en(i) + ' entran <b>' + entran + '</b>. É un dos dous extremos da táboa.';
        return 'Cos cinco partidos inventados do paso 2, os ' + n + ' escanos ' + de(i) + (entran === 1 ? ' danlle' : ' danlles') + ' escano a <b>' + entran + '</b> deles: ' + (entran > soria ? 'máis que' : 'tantos coma') + ' en Soria (' + soria + ') e ' + (entran < madrid ? 'menos que' : 'tantos coma') + ' en Madrid (' + madrid + ').';
      case 4:
        if (ISLAS[i]) return 'A túa segunda papeleta, a sepia, é a do Senado. ' + En(i) + ' depende da túa illa: ' + ISLAS[i] + '.';
        if (uno) return 'A túa segunda papeleta, a sepia, é a do Senado. ' + suxeito(i, true) + ' ' + verbo(i, 'pasa', 'pasan') + ' dun deputado a <b>dous</b> senadores.';
        return 'A túa segunda papeleta, a sepia, é a do Senado. No mapa, ' + suxeito(i) + ' ' + verbo(i, 'pasa', 'pasan') + ' de ' + n + ' deputados a <b>catro</b> senadores, como calquera provincia da Península.';
      case 5: return (uno ? 'O deputado ' + de(i) + ' senta' : 'Os ' + n + ' deputados ' + de(i) + ' sentan') + ' cos outros ' + (350 - n) + '. No hemiciclo, o teu voto é un deses asentos.';
      case 6: return (uno ? 'O deputado ' + de(i) + ' vota co seu partido.' : 'Os ' + n + ' deputados ' + de(i) + ' votan cada un co seu partido.') + ' O teu voto queda á parte, debaixo do hemiciclo: en que bloque estaría depende de a quen votes.';
      case 7: return 'A noite do 29N, a túa papeleta cóntase na túa mesa ' + de(i) + ', en público e en voz alta.';
      case 8: return 'Ese é o camiño da túa papeleta ' + en(i) + ': da urna á Moncloa.';
      case 10: return primero ? 'O hexágono dourado é o primeiro escano que se repartiu ' + en(i) + ': foi para <b>' + primero + '</b>.' : '';
      case 11: case 12: return primero ? 'O hexágono dourado é o primeiro escano ' + de(i) + ': foi para <b>' + primero + '</b>, o partido máis votado alí.' : '';
      default: return '';
    }
  },

  /* navegación */
  estacion: (k, ultima) => k === 0 ? 'Saída' : k === 14 ? 'Meta' : 'Paso ' + k + ' de ' + ultima,
  donde: (k, ultima, lectura) => lectura ? 'Índice' : k === 0 ? 'Saída' : k === 14 ? 'A Moncloa' : 'Paso ' + k + ' de ' + ultima,
  dondeVotas: 'Onde votas?',
  tocaMapa: 'Tamén podes tocar a túa provincia no mapa.',
  fase2Cerrada: 'Os pasos 9 a 13 ábrense o 30N, cos resultados.',
  sigueMiVoto: 'Segue o meu voto: ',
  siguiente: 'Seguinte: ',
  verEscanos: 'Volver aos 350 escanos',
  verTexto: 'Ver só o texto',
  tapa: {
    banda: 'Eleccións xerais · 29 de novembro de 2026',
    titulo: 'Das urnas á Moncloa',
    sub: 'Millóns de papeletas convértense en 350 escanos, e os escanos, nun Goberno. Así funciona.',
    como: 'Como se segue',
    pasos: ['Elixe a provincia na que votas.', 'Baixa: en cada paso, os 350 escanos cambian de forma.', 'O teu voto é o hexágono dourado: ségueo ata o final.'],
    boton: 'Preme aquí para comezar',
    texto: 'ou le só o texto' },

  /* paso 1 */
  provElige: (i, n) => suxeito(i, true) + ' ' + verbo(i, 'elixe', 'elixen') + ' ' + escanos(n) + ' dos 350.',

  /* paso 2: la apuesta y la tabla de divisiones */
  apuestaIntro: (i, n) => suxeito(i, true) + ' ' + verbo(i, 'reparte', 'reparten') + ' ' + escanos(n) + ' entre cinco partidos inventados. Cantos lle dás a cada un?',
  ariaApuesta: letra => 'Escanos para o partido ' + letra,
  resto: q => q === 0 ? 'Todo repartido.' : q === 1 ? 'Quédache 1 escano por repartir.' : 'Quédanche ' + q + ' escanos por repartir.',
  dhondtDa: n => "D'Hondt dálle " + n,
  acierto: (aciertos, total) => 'Acertaches ' + aciertos + ' de ' + total + '.',
  partido: 'Partido',
  fuera: ' (fóra)',
  repartoPaso: (orden, total, letra, cociente, division) => 'Escano ' + orden + ' de ' + total + ': para ' + letra + ', con ' + cociente + (division ? ' (división ÷' + division + ', fóra da táboa).' : '.'),
  repartoEmpieza: 'Comeza o reparto…',
  repartoFin: lista => 'Reparto rematado: ' + lista + '.',

  /* paso 3 */
  habitantes: (i, porEscano, puesto, media) => En(i) + ' hai un escano por cada ' + miles(porEscano) + ' habitantes (posto ' + puesto + ' de 52, de menos a máis). A media de España é un por cada ' + miles(media) + '.',
  comparacion: (soria, madrid) => soria + ' de 2 en Soria · ' + madrid + ' de 38 en Madrid',
  tamanos: (pequenas, medianas, grandes) => 'Das 52 circunscricións, ' + pequenas + ' reparten cinco escanos ou menos, ' + medianas + ' reparten entre seis e nove e só ' + grandes + ' reparten dez ou máis.',

  /* paso 4 */
  senTope: 'Só tres. Quita unha marca para cambiala.',
  senMarcadas: n => 'Marcaches ' + n + ' de 3.',

  /* calculadoras de pactos (pasos 6 y 12) */
  voto: { no: 'Non', si: 'Si', abs: 'Abst.' },
  votoLargo: { no: 'non', si: 'si', abs: 'abstención' },
  ariaBarra: 'Barra de 350 escanos coa marca de 176',
  votacion1: '1.ª votación · maioría absoluta',
  votacion2: '2.ª votación · máis sis que nons',
  copiar: 'Copiar a ligazón a esta combinación',
  copiado: 'Ligazón copiada.',
  copiaManual: 'Copia o enderezo do navegador: xa leva a combinación.',
  ariaPartido: (nombre, n, voto) => nombre + ', ' + escanos(n) + ', vota ' + voto + '. Toca para cambiar',
  cuentaSi: n => 'Si: ' + n,
  cuentaAbs: n => 'Abst.: ' + n,
  cuentaNo: n => 'Non: ' + n,
  primera: si => si >= 176 ? 'Sae: ten ' + sies(si) + '.' : 'Non sae: ' + faltan(176 - si) + '.',
  segunda: (si, no) => (si > no ? 'Sae: ' : 'Non sae: ') + sies(si) + ' fronte a ' + noes(no) + '.',
  anuncioPacto: (si, abs, no, primera, segunda) => 'Si ' + si + ', abstención ' + abs + ', non ' + no + '. Primeira votación: ' + primera + ' Segunda: ' + segunda,
  porraNota: corte => 'Escanos calculados a partir das últimas enquisas, ata o ' + corte + ' (' + PORRA + '). É unha estimación, non un resultado.',

  /* fase 2: los resultados */
  avisoPrueba: etiqueta => 'Vista previa con datos de proba: ' + etiqueta + '. Non son os resultados do 29N.',
  masEscanos: (nombre, n, pctVotos, absoluta) => nombre + ' é o partido con máis escanos: ' + n + ', co ' + pctVotos + ' dos votos. ' + (absoluta ? 'Supera os 176 da maioría absoluta.' : 'Ningún partido chega el só aos 176 da maioría absoluta.'),
  participacion: p => ' Votou o ' + p + ' do censo.',
  thVotos: 'Votos',
  thEscanos: 'Escanos',
  thPorEscano: 'Por escano',
  fuenteRes: (prueba, etiqueta, fuente) => (prueba ? 'Datos de proba: ' : '') + etiqueta + '. Fonte: ' + fuente + '. Os escanos calcúlanse aquí cos votos de cada provincia.',
  repartia: (i, n) => suxeito(i, true) + ' ' + verbo(i, 'repartía', 'repartían') + ' ' + escanos(n) + '.',
  ultimo: (ganador, rival, votos) => 'O último escano foi para ' + ganador + '. A ' + rival + (Math.round(votos) === 1 ? ' faltoulle ' : ' faltáronlle ') + nvotos(votos) + ' para quitarllo.',
  unico: ganador => 'O escano foi para ' + ganador + '.',
  votos: nvotos,
  ysiIguales: 'Elixe dous partidos distintos.',
  ysiCambia: (n, orixe, destino, ultimo) => 'Con ' + nvotos(n) + ' de ' + orixe + ' a ' + destino + ', cambia o reparto. O último escano sería para ' + ultimo + '.',
  ysiNoCambia: (n, ultimo) => 'Con ' + nvotos(n) + ', o reparto non cambia. O último escano segue sendo para ' + ultimo + '.',
  votosYEscanos: 'A porcentaxe de escanos dun partido case nunca coincide coa súa porcentaxe de votos.',
  sinEscano: (n, p) => miles(n) + ' votos (' + p + ') foron para candidaturas que non lograron escano na súa provincia.',
  loSiguiente: t => 'O seguinte: ' + t.charAt(0).toLowerCase() + t.slice(1),
  calendarioCompleto: 'O calendario está completo.'
};

idioma(textos);
