// Paquete alternativo para evaluación en el catálogo oficial de Foundry.
// NO publica ni modifica la release habitual; NO certifica autoría de los textos.
// Ejecutar desde la raíz: node scripts/zip-catalog.mjs
import {readFileSync, writeFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createHash} from 'node:crypto';

const original = JSON.parse(readFileSync('module.json', 'utf8'));
if (original.id !== 'mr-direccion') throw Error('Identificador de módulo incorrecto');
if (!/^\d+\.\d+\.\d+$/.test(original.version)) throw Error('Versión semántica inválida');
const repo = 'https://github.com/ManuRomera/mr-direccion';
const asset = 'mr-direccion-v' + original.version + '-catalog.zip';
const manifestFile = 'module-catalog.json';
const outputDir = resolve('dist/catalog');
const archive = join(outputDir, asset);
const stage = mkdtempSync(join(tmpdir(), 'mr-direccion-catalog-'));

function replaceRequired(path, needle, replacement) {
  const text = readFileSync(path, 'utf8');
  if (!text.includes(needle)) throw Error('No se ha encontrado el fragmento esperado de ' + path);
  writeFileSync(path, text.replace(needle, replacement), 'utf8');
}
try {
  mkdirSync(outputDir, {recursive: true});
  for (const name of ['js', 'lang', 'styles', 'tours']) {
    cpSync(name, join(stage, name), {recursive: true});
  }
  // El ejemplo de la Posada incluye imágenes generadas con IA. No se distribuye
  // ni se ofrece como instalación en la edición destinada al catálogo oficial.
  unlinkSync(join(stage, 'js/example.mjs'));
  replaceRequired(join(stage, 'js/api.mjs'),
    "import {installExample} from './example.mjs';\n", '');
  replaceRequired(join(stage, 'js/api.mjs'),
    'openEditor,startTutorial,installExample,converters:',
    'openEditor,startTutorial,converters:');
  replaceRequired(join(stage, 'js/editor.mjs'),
    "import {installExample} from './example.mjs';\n", '');
  const editorPath = join(stage, 'js/editor.mjs');
  let editor = readFileSync(editorPath, 'utf8');
  const button = /<button type="button" data-act="example">[\s\S]*?<\/button>/;
  const handler = /^\s*case 'example':.*\n/m;
  if (!button.test(editor) || !handler.test(editor)) {
    throw Error('No se han podido desactivar íntegramente los controles del ejemplo');
  }
  editor = editor.replace(button, '').replace(handler, '\n');
  writeFileSync(editorPath, editor);

  // La licencia común incorpora una declaración de los recursos del ejemplo.
  // Este paquete sólo incluye código MIT: conservar sólo el texto MIT.
  const mit = readFileSync('LICENSE', 'utf8').split(/\r?\n---\r?\n/)[0].trimEnd();
  if (!mit.startsWith('MIT License') || !mit.includes('Copyright (c) 2026 Manu Romera')) {
    throw Error('No se ha podido verificar el texto de licencia MIT');
  }
  writeFileSync(join(stage, 'LICENSE'), mit + '\n');
  const catalogManifest = {
    ...original,
    manifest: repo + '/releases/latest/download/' + manifestFile,
    download: repo + '/releases/download/v' + original.version + '/' + asset,
    license: 'LICENSE'
  };
  delete catalogManifest.readme;
  writeFileSync(join(stage, 'module.json'),
    JSON.stringify(catalogManifest, null, 2) + '\n');
  writeFileSync(join(outputDir, manifestFile),
    JSON.stringify(catalogManifest, null, 2) + '\n');
  execFileSync('zip',
    ['-q', '-r', '-X', archive, 'module.json', 'LICENSE', 'js', 'lang', 'styles', 'tours'],
    {cwd: stage, stdio: 'pipe'});
  const contents = execFileSync('unzip', ['-Z1', archive], {encoding: 'utf8'});
  for (const must of ['module.json', 'js/main.mjs', 'js/core/schema.mjs', 'lang/es.json', 'tours/direccion.json']) {
    if (!contents.split('\n').includes(must)) throw Error('Falta archivo obligatorio: ' + must);
  }
  if (/^(examples\/|brand\/|docs\/|README\.md)/m.test(contents) || contents.includes('js/example.mjs')) {
    throw Error('El paquete de catálogo contiene recursos promocionales o del ejemplo');
  }
  const api = readFileSync(join(stage, 'js/api.mjs'), 'utf8');
  if (api.includes('installExample') || editor.includes("data-act=\"example\"")) {
    throw Error('Persisten referencias al instalador de ejemplo');
  }
  const sha = createHash('sha256').update(readFileSync(archive)).digest('hex');
  console.log('Paquete de revisión preparado:', archive);
  console.log('Manifiesto:', join(outputDir, manifestFile));
  console.log('sha256:', sha);
  console.log('PENDIENTE: validar autoría de las cadenas, recursos restantes y descripción humana.');
} finally {
  rmSync(stage, {recursive: true, force: true});
}
