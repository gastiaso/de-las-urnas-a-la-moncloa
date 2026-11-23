// Genera img/compartir.jpg (1200 × 630), la imagen que sale al compartir el enlace, a partir de herramientas/compartir.html.
// Sirve el repositorio en un puerto libre, abre la plantilla en Edge sin ventana (protocolo de depuración) y guarda la foto.
// Sin dependencias: Node 22 o posterior y Microsoft Edge (o Chrome: su ruta, en la variable EDGE).
//
// Uso, desde cualquier carpeta:
//   node herramientas/compartir.mjs                    escribe img/compartir.jpg
//   node herramientas/compartir.mjs --calidad 90       calidad del JPEG, de 1 a 100 (por defecto, 88)
//   node herramientas/compartir.mjs --salida prueba.jpg
//
// Hay que regenerarla si cambian el mapa (js/cartograma.js), los colores, las letras o el título. Mismo nombre y tamaño:
// los citan las etiquetas og:image de las seis ediciones. Para ver la plantilla en el navegador, con el sitio servido:
// http://localhost:8000/herramientas/compartir.html
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve, sep } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const ANCHO = 1200, ALTO = 630, AVISO_KB = 300;
const arg = (n, def) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : def; };
const SALIDA = resolve(arg('salida', join(RAIZ, 'img', 'compartir.jpg')));
const CALIDAD = Math.round(Math.max(1, Math.min(100, +arg('calidad', 88) || 88)));
const EDGE = [process.env.EDGE, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/usr/bin/microsoft-edge', '/usr/bin/google-chrome'].find(r => r && existsSync(r));
if (!EDGE) { console.error('No encuentro Edge ni Chrome: pon su ruta en la variable EDGE.'); process.exit(1); }
const espera = ms => new Promise(r => setTimeout(r, ms));

// 1. El repositorio, servido solo en esta máquina (los módulos de JavaScript no cargan desde file://).
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const servidor = createServer(async (pet, res) => {
  const ruta = resolve(RAIZ, '.' + decodeURIComponent(new URL(pet.url, 'http://x').pathname));
  if (!ruta.startsWith(RAIZ + sep)) { res.writeHead(403).end(); return; }
  try { const b = await readFile(ruta); res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' }).end(b); }
  catch { res.writeHead(404).end(); }
});
await new Promise(ok => servidor.listen(0, '127.0.0.1', ok));
const PLANTILLA = 'http://127.0.0.1:' + servidor.address().port + '/herramientas/compartir.html';

// 2. Edge sin ventana, con un perfil temporal y un puerto de depuración libre (lo apunta en DevToolsActivePort).
const perfil = await mkdtemp(join(tmpdir(), 'compartir-'));
const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + perfil, '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
let ws = null, id = 0;
const pend = new Map(), oyentes = [], errores = [];
const envia = (method, params = {}) => new Promise((ok, mal) => { const i = ++id; pend.set(i, [ok, mal]); ws.send(JSON.stringify({ id: i, method, params })); });
const js = async expr => (await envia('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;

try {
  let puerto = null;
  for (let i = 0; i < 100 && !puerto; i++) {
    await espera(100);
    try { puerto = (await readFile(join(perfil, 'DevToolsActivePort'), 'utf8')).split('\n')[0].trim(); } catch {}
  }
  if (!puerto) throw new Error('Edge no ha abierto el puerto de depuración');
  let pag = null;
  for (let i = 0; i < 50 && !pag; i++) {
    try { pag = (await (await fetch('http://127.0.0.1:' + puerto + '/json/list')).json()).find(t => t.type === 'page'); } catch {}
    if (!pag) await espera(100);
  }
  if (!pag) throw new Error('Edge no ha abierto ninguna pestaña');
  ws = new WebSocket(pag.webSocketDebuggerUrl);
  await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const [ok, mal] = pend.get(d.id); pend.delete(d.id); d.error ? mal(new Error(JSON.stringify(d.error))) : ok(d.result); return; }
    if (d.method === 'Runtime.exceptionThrown') errores.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errores.push(d.params.args.map(a => a.value ?? a.description).join(' '));
    if (d.method === 'Network.loadingFailed') errores.push('no carga: ' + d.params.errorText);
    if (d.method === 'Network.responseReceived' && d.params.response.status >= 400 && !d.params.response.url.endsWith('/favicon.ico'))
      errores.push(d.params.response.status + ': ' + d.params.response.url);
    oyentes.forEach(f => f(d));
  };

  // 3. La plantilla a 1200 × 630, sin animaciones; espera a que el mapa y las letras estén listos.
  await envia('Page.enable'); await envia('Runtime.enable'); await envia('Network.enable');
  await envia('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: false });
  await envia('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const cargada = new Promise(ok => oyentes.push(d => d.method === 'Page.loadEventFired' && ok()));
  await envia('Page.navigate', { url: PLANTILLA });
  await cargada;
  for (let i = 0; i < 100 && !(await js('window.listo === true')); i++) await espera(100);
  if (!(await js('window.listo === true'))) errores.push('la plantilla no ha terminado (¿no cargan las letras?)');
  if (errores.length) throw new Error('la plantilla tiene errores:\n  ' + errores.join('\n  '));
  await espera(200);

  // 4. La foto, ya en JPEG.
  const foto = await envia('Page.captureScreenshot', { format: 'jpeg', quality: CALIDAD, clip: { x: 0, y: 0, width: ANCHO, height: ALTO, scale: 1 } });
  const b = Buffer.from(foto.data, 'base64');
  await writeFile(SALIDA, b);
  const kb = Math.round(b.length / 1024);
  console.log(SALIDA + ': ' + ANCHO + ' x ' + ALTO + ', calidad ' + CALIDAD + ', ' + kb + ' KB');
  if (kb > AVISO_KB) console.warn('Aviso: pasa de ' + AVISO_KB + ' KB y WhatsApp puede no enseñarla. Baja la calidad con --calidad.');
} catch (e) {
  console.error('Error: ' + e.message); process.exitCode = 1;
} finally {
  if (ws) { try { await Promise.race([envia('Browser.close'), espera(2000)]); } catch {} try { ws.close(); } catch {} }
  edge.kill(); servidor.close();
  for (let i = 0; i < 10; i++) { try { await rm(perfil, { recursive: true, force: true }); break; } catch { await espera(300); } }
}
