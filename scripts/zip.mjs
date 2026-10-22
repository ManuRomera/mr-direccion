// Empaqueta el módulo (mismo script en local y en CI). Uso: node scripts/zip.mjs → dist/mr-direccion-vX.Y.Z.zip + dist/module.json
import {readFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const m=JSON.parse(readFileSync('module.json','utf8')),out=`dist/mr-direccion-v${m.version}.zip`;
if(!m.download.endsWith(`v${m.version}/mr-direccion-v${m.version}.zip`))throw new Error('module.json: «download» no coincide con la versión');
mkdirSync('dist',{recursive:true});
const files=['module.json','LICENSE','README.md','CHANGELOG.md','js','lang','styles','tours','brand','examples','art/icon.webp'];
execFileSync('zip',['-qr','-X',out,...files.filter(f=>existsSync(f))],{stdio:'inherit'});
copyFileSync('module.json','dist/module.json');
const list=execFileSync('unzip',['-Z1',out]).toString();
for(const need of ['module.json','js/main.mjs','js/core/schema.mjs','tours/direccion.json','examples/posada/pack.json','examples/posada/audio/viento.ogg','lang/es.json'])
 if(!list.split('\n').includes(need))throw new Error('Falta en el zip: '+need);
console.log('OK',out);
