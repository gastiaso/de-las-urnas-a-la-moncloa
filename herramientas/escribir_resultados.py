"""Ejecuta resultados.py y guarda lo que escribe en js/resultados.js, en UTF-8 y sin BOM.

En PowerShell, «py herramientas/resultados.py ... > js/resultados.js» puede estropear los acentos (Álava, Cádiz)
o guardar el archivo en UTF-16, según la versión y la configuración de la consola. Este script evita la
redirección: recibe los mismos argumentos que resultados.py y solo toca js/resultados.js si resultados.py
termina sin errores. Con --salida se escribe en otro sitio (para ensayar sin tocar la web).

Uso (desde la carpeta del repositorio):
  py herramientas/escribir_resultados.py datos/resultados_29N.csv --abierta --etiqueta "..." --fuente "..."
  py herramientas/escribir_resultados.py datos/prueba_23J.csv --escanos escanos_2023 --prueba --salida C:/temp/r.js
"""
import os, pathlib, subprocess, sys
import escrutinio   # noqa: F401 (solo por los acentos en la consola de Windows)

RAIZ = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]
salida = RAIZ / 'js' / 'resultados.js'
if '--salida' in args:
    k = args.index('--salida'); salida = pathlib.Path(args[k + 1]); del args[k:k + 2]
entorno = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONUTF8='1')
r = subprocess.run([sys.executable, str(RAIZ / 'herramientas' / 'resultados.py')] + args, capture_output=True, env=entorno)
sys.stderr.write(r.stderr.decode('utf-8', 'replace'))
if r.returncode != 0:
    print('resultados.py ha fallado (código %d): %s sin cambios.' % (r.returncode, salida), file=sys.stderr)
    sys.exit(r.returncode)
texto = r.stdout.decode('utf-8').replace('\r\n', '\n')
assert texto.count('export const RES = ') == 1, 'La salida de resultados.py no tiene la forma esperada'
salida.write_bytes(texto.encode('utf-8'))
print('Escrito %s (%d bytes).' % (salida, len(texto.encode('utf-8'))), file=sys.stderr)
