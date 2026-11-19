// Textos del JavaScript en euskera. Mismas entradas que js/textos.js.
import { idioma, parteFecha } from '../textos.js';

// Las 52 circunscripciones, en el mismo orden que PROV (js/datos.js), con los exónimos de Euskaltzaindia y las formas
// declinadas que usan las frases: [NOR (absoluto), NON (inesivo), NONGO (genitivo locativo), NORK (ergativo)].
// Se escriben una a una, sin regla, porque las excepciones son muchas (plural, consonante final, -n/-l → -go…).
const PROB = [
  ['Albacete', 'Albaceten', 'Albaceteko', 'Albacetek'],
  ['Alacant', 'Alacanten', 'Alacanteko', 'Alacantek'],
  ['Almeria', 'Almerian', 'Almeriako', 'Almeriak'],
  ['Araba', 'Araban', 'Arabako', 'Arabak'],
  ['Asturias', 'Asturiasen', 'Asturiasko', 'Asturiasek'],
  ['Avila', 'Avilan', 'Avilako', 'Avilak'],
  ['Badajoz', 'Badajozen', 'Badajozko', 'Badajozek'],
  ['Balear Uharteak', 'Balear Uharteetan', 'Balear Uharteetako', 'Balear Uharteek'],
  ['Bartzelona', 'Bartzelonan', 'Bartzelonako', 'Bartzelonak'],
  ['Bizkaia', 'Bizkaian', 'Bizkaiko', 'Bizkaiak'],
  ['Burgos', 'Burgosen', 'Burgosko', 'Burgosek'],
  ['Caceres', 'Caceresen', 'Caceresko', 'Caceresek'],
  ['Cadiz', 'Cadizen', 'Cadizko', 'Cadizek'],
  ['Kantabria', 'Kantabrian', 'Kantabriako', 'Kantabriak'],
  ['Castelló', 'Castellón', 'Castellóko', 'Castellók'],
  ['Ciudad Real', 'Ciudad Realen', 'Ciudad Realgo', 'Ciudad Realek'],
  ['Kordoba', 'Kordoban', 'Kordobako', 'Kordobak'],
  ['Coruña', 'Coruñan', 'Coruñako', 'Coruñak'],
  ['Cuenca', 'Cuencan', 'Cuencako', 'Cuencak'],
  ['Gipuzkoa', 'Gipuzkoan', 'Gipuzkoako', 'Gipuzkoak'],
  ['Girona', 'Gironan', 'Gironako', 'Gironak'],
  ['Granada', 'Granadan', 'Granadako', 'Granadak'],
  ['Guadalajara', 'Guadalajaran', 'Guadalajarako', 'Guadalajarak'],
  ['Huelva', 'Huelvan', 'Huelvako', 'Huelvak'],
  ['Huesca', 'Huescan', 'Huescako', 'Huescak'],
  ['Jaen', 'Jaenen', 'Jaengo', 'Jaenek'],
  ['Leon', 'Leonen', 'Leongo', 'Leonek'],
  ['Lleida', 'Lleidan', 'Lleidako', 'Lleidak'],
  ['Lugo', 'Lugon', 'Lugoko', 'Lugok'],
  ['Madril', 'Madrilen', 'Madrilgo', 'Madrilek'],
  ['Malaga', 'Malagan', 'Malagako', 'Malagak'],
  ['Murtzia', 'Murtzian', 'Murtziako', 'Murtziak'],
  ['Nafarroa', 'Nafarroan', 'Nafarroako', 'Nafarroak'],
  ['Ourense', 'Ourensen', 'Ourenseko', 'Ourensek'],
  ['Palentzia', 'Palentzian', 'Palentziako', 'Palentziak'],
  ['Las Palmas', 'Las Palmasen', 'Las Palmasko', 'Las Palmasek'],
  ['Pontevedra', 'Pontevedran', 'Pontevedrako', 'Pontevedrak'],
  ['Errioxa', 'Errioxan', 'Errioxako', 'Errioxak'],
  ['Salamanca', 'Salamancan', 'Salamancako', 'Salamancak'],
  ['Santa Cruz Tenerifekoa', 'Santa Cruz Tenerifekoan', 'Santa Cruz Tenerifekoko', 'Santa Cruz Tenerifekoak'],
  ['Segovia', 'Segovian', 'Segoviako', 'Segoviak'],
  ['Sevilla', 'Sevillan', 'Sevillako', 'Sevillak'],
  ['Soria', 'Sorian', 'Soriako', 'Soriak'],
  ['Tarragona', 'Tarragonan', 'Tarragonako', 'Tarragonak'],
  ['Teruel', 'Teruelen', 'Teruelgo', 'Teruelek'],
  ['Toledo', 'Toledon', 'Toledoko', 'Toledok'],
  ['Valentzia', 'Valentzian', 'Valentziako', 'Valentziak'],
  ['Valladolid', 'Valladoliden', 'Valladolideko', 'Valladolidek'],
  ['Zamora', 'Zamoran', 'Zamorako', 'Zamorak'],
  ['Zaragoza', 'Zaragozan', 'Zaragozako', 'Zaragozak'],
  ['Ceuta', 'Ceutan', 'Ceutako', 'Ceutak'],
  ['Melilla', 'Melillan', 'Melillako', 'Melillak']
];
const PLURALA = [7];   // «Balear Uharteak» es plural: como sujeto pide el verbo en plural
const nor = i => PROB[i][0], non = i => PROB[i][1], nongo = i => PROB[i][2], nork = i => PROB[i][3];

/* números: miles con punto y decimales con coma, como en castellano; el símbolo del porcentaje, delante */
const miles = n => Math.round(n).toLocaleString('es-ES');
const dec = x => x.toFixed(1).replace('.', ',');
// ¿El número, leído en euskera, acaba en consonante? (bat, bost, hamar, hamabost y sus compuestos; ehun). De eso depende el sufijo.
const kons = n => { const u = n % 100; return u === 0 ? n % 1000 !== 0 : [1, 5, 10, 15].includes(u % 20); };
const tik = n => n + (kons(n) ? 'etik' : 'tik');                                   // «16tik», «5etik»
const tan = n => n + (n % 20 === 1 && n % 100 !== 11 ? 'ean' : kons(n) ? 'etan' : 'tan');   // «29tan», «5etan», «1ean»
// «bat» va detrás del nombre; se escribe con cifra («eserleku 1») para que las frases lleven las mismas cifras que en castellano
const eserleku = n => n === 1 ? 'eserleku bat' : n + ' eserleku';
const bai = n => n === 1 ? 'aldeko boto bat' : 'aldeko ' + n + ' boto';
const kontra = n => n === 1 ? 'kontrako bat' : 'kontrako ' + n;
const boto = n => n === 1 ? 'boto bat' : miles(n) + ' boto';
const falta = n => bai(n) + (n === 1 ? ' falta da' : ' falta dira');
const HIL = ['urtarril', 'otsail', 'martxo', 'apiril', 'maiatz', 'ekain', 'uztail', 'abuztu', 'irail', 'urri', 'azaro', 'abendu'];

// Los textos que vienen dentro de js/resultados.js (etiqueta, fuente e hitos). Se buscan sin mirar la mayúscula inicial.
const DATUAK = {
  'resultados del 23 de julio de 2023': '2023ko uztailaren 23ko emaitzak',
  'ministerio del Interior, escrutinio del 23J (datos reunidos en Porra Electoral)': 'Barne Ministerioa, uztailaren 23ko zenbaketa (Porra Electoralen bildutako datuak)',
  'escrutinio provisional del 29 de noviembre de 2026': '2026ko azaroaren 29ko behin-behineko zenbaketa',
  'ministerio del Interior': 'Barne Ministerioa',
  '29 nov': 'aza. 29',
  '4 dic': 'abe. 4',
  '23 dic': 'abe. 23',
  'sin fecha': 'Datarik gabe',
  '1.ª votación': '1. bozketa',
  '48 h después': '48 h geroago',
  'gobierno': 'Gobernua',
  'votación.': 'Bozketa.',
  'escrutinio general: el recuento oficial.': 'Zenbaketa orokorra: kontaketa ofiziala.',
  'se constituyen el Congreso y el Senado.': 'Kongresua eta Senatua eratzen dira.',
  'el Rey consulta a los grupos y propone un candidato.': 'Erregeak taldeei kontsulta egiten die eta hautagai bat proposatzen du.',
  'hacen falta 176 síes. Arranca el reloj de dos meses.': 'Aldeko 176 boto behar dira. Bi hilabeteko erlojua martxan jartzen da.',
  '2.ª votación: más síes que noes.': '2. bozketa: ezezkoak baino baiezko gehiago.',
  'el Rey nombra al presidente.': 'Erregeak presidentea izendatzen du.'
};
const txikiz = s => s.charAt(0).toLowerCase() + s.slice(1);
// Tras «Hurrengoa: » la frase sigue en minúscula, salvo que empiece por el nombre de una institución.
const jarraian = t => /^(Kongresu|Senatu|Gobernu|Gorte|Moncloa)/.test(t) ? t : txikiz(t);

const ISLAS = {
  7: 'Mallorcan hiru senatari aukeratzen dira eta bi izen markatzen dira; Menorcan, Eivissan eta Formenteran, senatari bana',
  35: 'Kanaria Handian hiru senatari aukeratzen dira eta bi izen markatzen dira; Lanzaroten eta Fuerteventuran, senatari bana',
  39: 'Tenerifen hiru senatari aukeratzen dira eta bi izen markatzen dira; La Palman, La Gomeran eta El Hierron, senatari bana' };
const BLOKEA = 'zein bloketan egongo litzatekeen, nori ematen diozun botoa, horren araberakoa da.';

export const textos = {
  cod: 'eu',
  locale: 'eu',

  /* números y provincias */
  miles, dec,
  pct: x => '% ' + dec(x * 100),          // de una proporción: 0,402 → «% 40,2»
  pctEntero: n => '% ' + n,
  provLista: nor,                         // en los desplegables y en las barras
  prov: nor,                              // dentro de una frase, en caso absoluto; las demás formas, en PROB
  escanos: eserleku, sies: bai,

  /* textos que en castellano viven en js/datos.js */
  titulos: ['Irteera', 'Zer bozkatzen den', 'Bototik eserlekura', 'Non bozkatzen duzun', 'Senatua', 'Gehiengoak', 'Itunak', 'Azaroaren 29tik Gobernura', 'Itxiera',
    'Zer gertatu den', 'Zure probintzian', 'Botoak eta eserlekuak', 'Nork gobernatzen du?', 'Datorrena', 'Moncloa'],
  sen: ['1. pertsona · A alderdia', '2. pertsona · A alderdia', '3. pertsona · A alderdia', '4. pertsona · B alderdia', '5. pertsona · B alderdia', '6. pertsona · C alderdia'],
  glos: {
    escano: ['Eserlekua', 'Kongresuko 350 eserlekuetako bakoitza. Eserlekua betetzen duena diputatua da.'],
    circ: ['Hautesbarrutia', 'Botoak zenbatzen eta eserlekuak banatzen diren eremua. Hauteskunde orokorretan probintzia da; Ceuta eta Melilla hautesbarruti bana dira.'],
    dhondt: ["D'Hondt legea", 'Probintzia bakoitzeko eserlekuak banatzeko modua: alderdi bakoitzaren botoak zati 1, 2, 3… egiten dira, eta eserlekuak emaitza handienentzat dira.'],
    barrera: ['Hauteskunde-langa', 'Banaketan sartzeko gutxienekoa: probintziako baliozko botoen % 3.'],
    blanco: ['Boto zuria', 'Boto-paperik gabeko gutun-azala. Baliozko botoa da: ez doa alderdi bakar batera ere, baina guztizkoan zenbatzen da.'],
    nulo: ['Boto baliogabea', 'Balio ez duen botoa: adibidez, zerbait ezabatuta edo erantsita duen boto-papera, edo ofiziala ez den gutun-azala.'],
    absoluta: ['Gehiengo osoa', 'Diputatu guztien erdia baino gehiago, bozkatu ala ez: 350etik 176.'],
    simple: ['Gehiengo soila', 'Kontrako botoak baino aldeko gehiago. Abstentzioak ez dira zenbatzen.'],
    investidura: ['Inbestidura', 'Kongresuak Gobernuko presidente izateko hautagai bati konfiantza ematen dion bozketa.'],
    abstencion: ['Abstentzioa', 'Ez baiezkoa, ez ezezkoa. Ez du alde zenbatzen, baina kontra ere ez.'],
    mesa: ['Kongresuko Mahaia', 'Ganbera zuzentzen duen organoa: presidentetza bat, lau presidenteordetza eta lau idazkaritza. Lehen egunean aukeratzen da.'],
    grupo: ['Talde parlamentarioa', 'Alderdi bateko diputatuek Kongresuan osatzen duten taldea. Oro har, hamabost behar dira; bada beste bide bat bostekin, gutxieneko boto kopuru bat gaindituz gero.'],
    funciones: ['Jarduneko Gobernua', 'Kargua utzi duen eta, berria sartu arte, agintean jarraitzen duen Gobernua, ahalmen mugatuekin.'],
    escrutinio: ['Zenbaketa orokorra', 'Kontaketa ofiziala; hauteskunde-batzordeek egiten dute, bozketatik bost egunera.'],
    censura: ['Zentsura-mozioa', 'Hauteskunderik gabe presidentea aldatzeko bidea: gehiengo osoa behar du, eta beste hautagai bat proposatzen du.'],
    designacion: ['Izendapen bidezko senataria', 'Hautesleek aukeratzen ez dutena; autonomia-erkidego bakoitzeko parlamentuak aukeratzen du.'],
    cortes: ['Gorte Nagusiak', 'Kongresua eta Senatua, biak batera. Legeak egiten dituzte, Aurrekontuak onartzen dituzte eta Gobernua kontrolatzen dute.'],
    censo: ['Hautesle-errolda', 'Bozkatu dezaketenen zerrenda ofiziala. Bozkatzeko, zerrenda horretan inskribatuta egon behar da.'],
    mesael: ['Hauteskunde-mahaia', 'Hautetsontziaz arduratzen den taldea: mahaiburu bat eta bi mahaikide, mahai horretako hautesleen artean zozketaz aukeratuak.'],
    junta: ['Hauteskunde-batzordea', 'Hauteskundeak garbiak izan daitezen zaintzen duen eta kontaketa ofiziala egiten duen organoa. Zentral bat dago, probintzia bakoitzeko bat eta eskualdeko beste batzuk.'],
    lista: ['Zerrenda', 'Alderdi batek probintzia batean aurkezten duen hautagaitza: banatzen diren eserlekuak adina hautagai, ordena finko batean, eta gehienez hamar ordezko.'],
    suplente: ['Ordezkoa', 'Zerrendaren amaieran doana, hautagaien atzetik. Eserleku bat libre geratzen bada eta aurretik hautagairik geratzen ez bada bakarrik sartzen da. Senatuan, hautagai bakoitzak bi ditu.'],
    quorum: ['Quoruma', 'Bozketa batek balio izateko gutxienez bertan egon behar dutenak: Ganberaren erdia baino gehiago.'],
    organica: ['Lege organikoa', 'Garrantzi handieneko gaiei buruzko legea, hala nola oinarrizko eskubideei edo hauteskunde-arauei buruzkoa. Kongresuaren gehiengo osoa behar du.'],
    decretoley: ['Lege-dekretua', 'Gobernuak presako kasuetan onartzen duen araua. Kongresuak hogeita hamar egun ditu hari eusteko edo bertan behera uzteko.'],
    confianza: ['Konfiantza-mozioa', 'Presidenteak berak eskatzen duen bozketa, Kongresuak babesten jarraitzen duela egiaztatzeko. Gehiengo soila aski du; galtzen badu, dimisioa ematen du.'],
    veto: ['Senatuaren betoa', 'Senatuak Kongresutik datorren lege bati ematen dion ezezkoa. Kongresuak kendu dezake.'],
    permanente: ['Diputazio Iraunkorra', 'Ganberak deseginda daudenean edo biltzen ez direnean guardian geratzen den diputatu talde txikia (eta senatarien beste bat).']
  },
  // La fecha de las elecciones, ya en el caso que pide calcNota («… hauteskundeetan»): «2023ko uztailaren 23ko». El sufijo depende del día y del año.
  fecha: f => { const x = parteFecha(f); return x ? x.a + (kons(x.a) ? 'eko ' : 'ko ') + HIL[x.m - 1] + 'aren ' + x.d + (kons(x.d) ? 'eko' : 'ko') : f; },
  dato: s => DATUAK[txikiz(String(s))] || s,

  /* el escenario */
  ariaEscenario: 'Kongresuko 350 eserlekuak, urrats bakoitzean forma aldatzen dutenak. Hexagono urrekara zure botoa da.',
  tuVoto: 'Zure botoa',
  primerEscano: i => nongo(i) + ' 1. eserlekua',
  // k: paso; i: provincia; n: sus escaños; revelado: si ya se ha hecho la apuesta del paso 2
  rotulo: (k, i, n, revelado) => ({
    0: '350 eserleku: hexagono bat eserleku bakoitzeko',
    1: nor(i) + ': 350etik ' + n,
    2: revelado ? nor(i) + ': horrela banatzen ' + (n === 1 ? "du D'Hondt legeak eserlekua" : "ditu D'Hondt legeak " + n + ' eserlekuak') : nor(i) + ': ' + eserleku(n) + ' banatzeko',
    3: 'Ilunago: biztanle gutxiago eserleku bakoitzeko',
    4: 'Senatua: 209 hautetsi, lau probintzia bakoitzeko',
    5: '350etik 176: gehiengo osoa',
    7: 'Presidentea aukeratuko duen Kongresua<small>Bi hilabeteko epea lehen bozketarekin hasten da.</small>',
    8: '350 eserleku',
    9: 'Eserleku bakoitza, irabazi duenaren kolorez',
    10: nor(i) + ': ' + eserleku(n),
    11: 'Hautetsontzietatik ateratzen den Kongresua',
    13: 'Hautetsontzietatik ateratzen den Kongresua',
    14: '350 eserleku' }[k] || ''),
  // c: { si, abs, no }, en escaños
  rotuloPacto: c => 'Bai ' + c.si + ' · Abst. ' + c.abs + ' · Ez ' + c.no + '<small>' + (c.si >= 176 ? 'Lehen bozketan lortzen du: aldeko 176 boto edo gehiago.'
    : c.si > c.no ? 'Ez da 176ra iristen, baina bigarren bozketan lortzen du.'
    : c.si === 0 ? 'Ukitu alderdiak gehiengo bat osatzeko.'
    : 'Ez du lortzen: ' + falta(176 - c.si) + ' 176ra iristeko.') + '</small>',
  piePacto: 'Eserleku bakoitza, bere alderdiaren kolorez. Zure botoa, aparte: ' + BLOKEA,
  piePactoRes: 'Eserleku bakoitza, bere alderdiaren kolorez. Baiezkoak ezkerrean biltzen dira; gero, abstentzioak, eta gero, ezezkoak.',

  /* la frase de «Tu voto» de cada paso. i: provincia; n: sus escaños; entran, soria, madrid: cuántos de los cinco partidos
     inventados sacan escaño en la provincia, con 2 escaños y con 38; primero: el partido que se llevó el primer escaño (fase 2).
     El nombre del partido va siempre en caso absoluto («PSOE alderdiarentzat»), para no tener que declinarlo. */
  islas: ISLAS,
  frase(k, { i, n, entran, soria, madrid, primero }) {
    const uno = n === 1, senatua = 'Zure bigarren boto-papera, sepia kolorekoa, Senatukoa da. ';
    switch (k) {
      case 0: return 'Zure botoa hexagono urrekara da. Aukeratu non bozkatzen duzun, eta jarrai iezaiozu amaieraraino.';
      case 1: return (uno ? 'Zure botoa hexagono urrekara da: ' + nongo(i) + ' eserleku bakarra da.' : 'Zure botoa hexagono urrekara da: ' + non(i) + ' dago, zure probintziako eserlekuen artean, teila-kolorez.') + ' Zure boto-paper zuria, Kongresukoa, bere hautetsontzira doa.';
      case 2: return uno ? 'Zure botoa zure alderdiak ' + non(i) + ' dituen botoei gehitzen zaie. Han eserleku bakarra dago: boto gehien lortzen dituenarentzat da.'
        : 'Zure botoa zure alderdiak ' + non(i) + ' dituen botoei gehitzen zaie, eta alderdi hori probintziako baliozko botoen % 3ra iristen bada bakarrik sartzen da banaketan.';
      case 3:
        if (uno) return non(i) + ' eserleku bakarra dago: 2. urratseko asmatutako bost alderdiekin, boto gehien dituena bakarrik sartuko litzateke.';
        if (n === 2 || n === 38) return '2. urratseko asmatutako bost alderdietatik, ' + non(i) + ' <b>' + entran + '</b> sartzen dira. Taularen bi muturretako bat da.';
        return '2. urratseko asmatutako bost alderdiekin, ' + nongo(i) + ' ' + n + ' eserlekuak <b>' + entran + '</b> alderdiren artean banatzen dira: ' + (entran > soria ? 'Sorian baino gehiago (' : 'Sorian adina (') + soria + ') eta ' + (entran < madrid ? 'Madrilen baino gutxiago (' : 'Madrilen adina (') + madrid + ').';
      case 4:
        if (ISLAS[i]) return senatua + non(i) + ', zure uhartearen araberakoa da: ' + ISLAS[i] + '.';
        if (uno) return senatua + nor(i) + ' diputatu bat izatetik <b>bi</b> senatari izatera igarotzen da.';
        return senatua + 'Mapan, ' + nor(i) + ' ' + n + ' diputatu izatetik <b>lau</b> senatari izatera igarotzen da, Penintsulako beste edozein probintzia bezala.';
      case 5: return (uno ? nongo(i) + ' diputatua beste ' + (350 - n) + ' diputatuekin batera esertzen da.' : nongo(i) + ' ' + n + ' diputatuak beste ' + (350 - n) + ' diputatuekin batera esertzen dira.') + (uno ? ' Zure botoak eserleku horretarako balio du zure alderdia han bozkatuena bada soilik.' : ' Zure botoak eserleku horietako baterako balio du zure alderdiak han eserlekurik lortzen badu soilik.');
      case 6: return (uno ? nongo(i) + ' diputatuak bere alderdiarekin bozkatu ohi du.' : nongo(i) + ' ' + n + ' diputatuek beren alderdiarekin bozkatu ohi dute.') + ' Zure botoa aparte geratzen da, hemizikloaren azpian: ' + BLOKEA;
      case 7: return 'Azaroaren 29ko gauean, zure boto-papera ' + nongo(i) + ' zure mahaian zenbatzen da, jendaurrean eta ozen.';
      case 8: return 'Hori da zure boto-paperaren bidea ' + non(i) + ': hautetsontzitik Moncloara.';
      case 10: return primero ? 'Hexagono urrekara ' + non(i) + ' banatu zen lehen eserlekua da: <b>' + primero + '</b> alderdiarentzat izan zen.' : '';
      case 11: case 12: return primero ? 'Hexagono urrekara ' + nongo(i) + ' lehen eserlekua da: <b>' + primero + '</b> alderdiarentzat izan zen, han boto gehien lortu zituenarentzat.' : '';
      default: return '';
    }
  },

  /* navegación */
  estacion: (k, ultima) => k === 0 ? 'Irteera' : k === 14 ? 'Helmuga' : tik(ultima) + ' ' + k + '. urratsa',
  donde: (k, ultima, lectura) => lectura ? 'Aurkibidea' : k === 0 ? 'Irteera' : k === 14 ? 'Moncloa' : tik(ultima) + ' ' + k + '. urratsa',
  dondeVotas: 'Non bozkatzen duzu?',
  tocaMapa: 'Zure probintzia mapan ere uki dezakezu.',
  fase2Cerrada: '9. urratsetik 13.era artekoak azaroaren 30ean irekiko dira, emaitzekin.',
  sigueMiVoto: 'Jarraitu nire botoari: ',
  siguiente: 'Hurrengoa: ',
  verEscanos: 'Itzuli 350 eserlekuetara',
  verTexto: 'Testua bakarrik ikusi',
  tapa: {
    banda: 'Hauteskunde orokorrak · 2026ko azaroaren 29a',
    titulo: 'Hautetsontzietatik Moncloara',
    sub: 'Milioika boto-paper 350 eserleku bihurtzen dira, eta eserlekuak, Gobernu. Horrela funtzionatzen du.',
    como: 'Nola jarraitu',
    pasos: ['Aukeratu zein probintziatan bozkatzen duzun.', 'Jaitsi: urrats bakoitzean, 350 eserlekuek forma aldatzen dute.', 'Zure botoa hexagono urrekara da: jarrai iezaiozu amaieraraino.'],
    boton: 'Egin klik hemen hasteko',
    texto: 'edo irakurri testua bakarrik' },

  /* paso 1 */
  provElige: (i, n) => nork(i) + ' 350 eserlekuetatik ' + n + ' aukeratzen ' + (PLURALA.includes(i) ? (n === 1 ? 'dute' : 'dituzte') : (n === 1 ? 'du' : 'ditu')) + '.',

  /* paso 2: la apuesta y la tabla de divisiones */
  apuestaIntro: (i, n) => non(i) + ' ' + eserleku(n) + (n === 1 ? ' banatzen da' : ' banatzen dira') + ' asmatutako bost alderdiren artean. Zenbat emango dizkiozu bakoitzari?',
  ariaApuesta: letra => letra + ' alderdiarentzako eserlekuak',
  resto: q => q === 0 ? 'Dena banatuta.' : q === 1 ? 'Eserleku bat geratzen zaizu banatzeko.' : q + ' eserleku geratzen zaizkizu banatzeko.',
  dhondtDa: n => "D'Hondt legearen arabera: " + n,
  acierto: (aciertos, total) => tik(total) + ' ' + aciertos + ' asmatu ' + (aciertos === 1 ? 'duzu' : 'dituzu') + '.',
  partido: 'Alderdia',
  fuera: ' (kanpoan)',
  // escaño número «orden» de «total», para el partido «letra» con el cociente ya escrito; division: si la casilla no cabe en la tabla, cuál es
  repartoPaso: (orden, total, letra, cociente, division) => tik(total) + ' ' + orden + '. eserlekua: ' + letra + ' alderdiarentzat, ' + cociente + ' zatidurarekin' + (division ? ' (÷' + division + ' zatiketa, taulatik kanpo).' : '.'),
  repartoEmpieza: 'Banaketa hasten da…',
  repartoFin: lista => 'Banaketa amaituta: ' + lista + '.',

  /* paso 3 */
  habitantes: (i, porEscano, puesto, media) => non(i) + ' eserleku bat dago ' + miles(porEscano) + ' biztanleko (52tik ' + puesto + '. postua, gutxienetik gehienera). Espainiako batezbestekoa: eserleku bat ' + miles(media) + ' biztanleko.',
  comparacion: (soria, madrid) => 'Sorian, 2tik ' + soria + ' · Madrilen, 38tik ' + madrid,
  tamanos: (pequenas, medianas, grandes) => '52 hautesbarrutietatik ' + tan(pequenas) + ' bost eserleku edo gutxiago banatzen dira; ' + tan(medianas) + ', sei eta bederatzi artean; eta ' + tan(grandes) + ' bakarrik, hamar edo gehiago.',

  /* paso 4 */
  senTope: 'Hiru bakarrik. Kendu marka bat aldatzeko.',
  senMarcadas: n => '3tik ' + n + ' markatu ' + (n === 1 ? 'duzu' : 'dituzu') + '.',

  /* calculadoras de pactos (pasos 6 y 12) */
  voto: { no: 'Ez', si: 'Bai', abs: 'Abst.' },
  votoLargo: { no: 'ez', si: 'bai', abs: 'abstentzioa' },
  ariaBarra: '350 eserlekuko barra, 176ko markarekin',
  votacion1: '1. bozketa · gehiengo osoa',
  votacion2: '2. bozketa · ezezkoak baino baiezko gehiago',
  copiar: 'Kopiatu konbinazio honen esteka',
  copiado: 'Esteka kopiatuta.',
  copiaManual: 'Kopiatu nabigatzaileko helbidea: konbinazioa barruan darama.',
  copiaDireccion: 'Kopiatu nabigatzaileko helbidea',
  ariaPartido: (nombre, n, voto) => nombre + ', ' + eserleku(n) + ', botoa: ' + voto + '. Ukitu aldatzeko',
  cuentaSi: n => 'Bai: ' + n,
  cuentaAbs: n => 'Abst.: ' + n,
  cuentaNo: n => 'Ez: ' + n,
  primera: si => si >= 176 ? 'Inbestidura lortzen du: ' + bai(si) + '.' : 'Ez du lortzen: ' + falta(176 - si) + '.',
  segunda: (si, no) => (si > no ? 'Inbestidura lortzen du: ' : 'Ez du lortzen: ') + bai(si) + ' eta ' + kontra(no) + '.',
  anuncioPacto: (si, abs, no, primera, segunda) => 'Aldeko ' + si + ', abstentzioa ' + abs + ', kontrako ' + no + '. Lehen bozketa: ' + primera + ' Bigarrena: ' + segunda,
  // corte: la fecha tal como la da fecha(), en adlativo («2026ko azaroaren 8ra»)
  calcNota: data => data + ' hauteskundeetan alderdi bakoitzak lortutako eserlekuak, azaroaren 29aren aurreko azkenak. Ez da inkesta bat, ezta azaroaren 29ko emaitza bat ere.',

  /* fase 2: los resultados */
  avisoPrueba: etiqueta => 'Aurrebista, probako datuekin: ' + etiqueta + '. Ez dira azaroaren 29ko emaitzak.',
  masEscanos: (nombre, n, pctVotos, absoluta) => nombre + ' da eserleku gehien dituen alderdia: ' + n + ' eserleku, botoen ' + pctVotos + ' lortuta. ' + (absoluta ? 'Gehiengo osoaren 176 eserlekuetara iristen da.' : 'Alderdi bakar bat ere ez da bere kabuz iristen gehiengo osoaren 176 eserlekuetara.'),
  participacion: p => ' Parte-hartzea: erroldaren ' + p + '.',
  thVotos: 'Botoak',
  thEscanos: 'Eserlekuak',
  thPorEscano: 'Eserlekuko',
  fuenteRes: (prueba, etiqueta, fuente) => (prueba ? 'Probako datuak: ' : '') + etiqueta + '. Iturria: ' + fuente + '. Eserlekuak hemen kalkulatzen dira, probintzia bakoitzeko botoekin.',
  repartia: (i, n) => non(i) + ' ' + eserleku(n) + (n === 1 ? ' banatzen zen.' : ' banatzen ziren.'),
  ultimo: (ganador, rival, votos) => 'Azken eserlekua ' + ganador + ' alderdiarentzat izan zen. ' + rival + ' alderdiari ' + boto(votos) + (votos === 1 ? ' falta izan zitzaion' : ' falta izan zitzaizkion') + ' eserleku hori kentzeko.',
  unico: ganador => 'Eserlekua ' + ganador + ' alderdiarentzat izan zen.',
  votos: boto,
  ysiIguales: 'Aukeratu bi alderdi desberdin.',
  ysiCambia: (n, de, a, ultimo) => de + ' alderditik ' + a + ' alderdira ' + boto(n) + ' pasatuta, banaketa aldatu egiten da. Azken eserlekua ' + ultimo + ' alderdiarentzat izango litzateke.',
  ysiNoCambia: (n, ultimo) => 'Banaketa ez da aldatzen ' + boto(n) + ' pasatuta. Azken eserlekua ' + ultimo + ' alderdiarentzat da oraindik.',
  votosYEscanos: 'Alderdi baten eserlekuen ehunekoa ia inoiz ez dator bat haren botoen ehunekoarekin.',
  sinEscano: (n, p) => boto(n) + ' (' + p + ') beren probintzian eserlekurik lortu ez zuten hautagaitzentzat izan ziren.',
  loSiguiente: t => 'Hurrengoa: ' + jarraian(t),
  calendarioCompleto: 'Egutegia osatuta dago.'
};
idioma(textos);
