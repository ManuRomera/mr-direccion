#!/usr/bin/env node
// Convierte content/direction.json + stage.json de «MR · El Trono de la Sed» en un paquete de MR- Dirección.
// Uso: node tools/convert_trono.mjs <carpeta-de-trono> > examples/trono-de-la-sed.pack.json
import {readFileSync} from 'node:fs';
import {convertTrono} from '../js/core/trono.mjs';
import {validatePack} from '../js/core/schema.mjs';
const dir=process.argv[2];if(!dir){console.error('Falta la carpeta de Trono');process.exit(1);}
const j=f=>JSON.parse(readFileSync(`${dir}/content/${f}`,'utf8'));
const stage=j('stage.json');delete stage._nota;
const motifs=[['batalla','Batalla'],['batalla-oscura','Combate oscuro'],['persecucion','Persecución'],['sigilo','Sigilo e infiltración'],['tension','Tensión'],['horror','Horror'],['rey','El rey sin nombre'],['amenaza','Amenaza creciente'],['misterio','Misterio'],['duelo','Duelo'],['esperanza','Esperanza'],['bestia','Latido del corazón']];
const pack=convertTrono({direction:j('direction.json'),stage,motifs});
const v=validatePack(pack);if(!v.ok){console.error(v.errors.join('\n'));process.exit(1);}
console.log(JSON.stringify(v.pack,null,1));
