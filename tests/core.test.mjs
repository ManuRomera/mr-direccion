import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {sizePatch,figureSize,stageLayout,depthPatch,rowLayout,coverPosition,figureOptions,missingCast,isExplicitResize,FIGURE_DEFAULTS} from '../js/core/perspective.mjs';
import {crossfadeGain,crossfadePlan,audioVolume,fadeMs,ambientFor,soundKey,baseName} from '../js/core/crossfade.mjs';
import {clampPos,previewPlace,panelSide,facingAngle} from '../js/core/geometry.mjs';
import {validatePack,migratePack,normalizeRef,sceneMatches,SCHEMA} from '../js/core/schema.mjs';
import {convertTrono} from '../js/core/trono.mjs';
import {proposeConfig} from '../js/core/autoconfig.mjs';
import {clockAfterClick,clampSeg,milestonesProgress,clockState} from '../js/core/markers.mjs';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const scene={width:1600,height:900,grid:{size:100}};
test('perspectiva: más cerca del frente = figura más grande; el horizonte limita la altura',()=>{
 const st={eye:.5};const far=figureSize(st,.6*900,900),near=figureSize(st,.95*900,900);
 assert.ok(near>far);assert.ok(Math.abs(figureSize(st,.95*900,900,360)-(.45*900)/FIGURE_DEFAULTS.visible)<1e-9);
 assert.ok(figureSize(st,.5*900,900)<21); // pies en el horizonte: tamaño mínimo // pies en el horizonte: tamaño mínimo
});
test('perspectiva: el tamaño escala con los píxeles del reparto y respeta límites',()=>{
 const st={eye:.5},a=figureSize(st,.9*900,900,360),b=figureSize(st,.9*900,900,720);
 assert.ok(b>a);assert.ok(figureSize(st,.9*900,900,9999)<=900);assert.ok(figureSize(st,.9*900,900,1)>=20);
});
test('stageLayout coloca los pies sobre los puntos de apoyo y recoloca al mover',()=>{
 const st={eye:.5,anchors:[[.5,.9],[.25,.7]]};const [p]=stageLayout(scene,1,0,360,st);
 const size=p.width*100;assert.ok(Math.abs(p.x+size/2-800)<1);assert.ok(Math.abs(p.y+size*(1-FIGURE_DEFAULTS.foot)-810)<1);
 const moved=depthPatch(scene,{width:p.width,height:p.height,x:p.x,y:p.y},360,st,{y:p.y-120});
 assert.ok(moved.width<p.width); // hacia el fondo se encoge
});
test('stageLayout: más figuras que puntos no salen de la escena',()=>{
 const st={eye:.4,anchors:[[.5,.9]]};for(const p of stageLayout(scene,5,0,360,st)){assert.ok(p.x>=0&&p.x+p.width*100<=1600);assert.ok(p.y>=0&&p.y+p.height*100<=900);}
});
test('rowLayout y cover',()=>{
 assert.equal(rowLayout(scene,3).length,3);
 const c=coverPosition({x:0,y:0,width:1600,height:900},[1000,1000],{},true);assert.ok(Math.abs(c.scale-1000/900)<1e-9);
 assert.equal(coverPosition({x:0,y:0,width:0,height:9},[1,1]),null);
});
test('opciones de figuras y reparto',()=>{
 assert.deepEqual(figureOptions({tokenPixels:5000,cover:true}),{tokenPixels:4000,lockRotation:true,hideTrails:true,cover:true,depthScale:true});
 assert.equal(figureOptions({}).cover,false);assert.deepEqual(missingCast([{actorId:'a'}],[{id:'a'},{id:'b'}]),[{id:'b'}]);
});
test('fundido cruzado: la suma de volúmenes es constante en todo el fundido',()=>{
 for(let t=0;t<=1.0001;t+=.05){const g=crossfadeGain(t,.4);assert.ok(Math.abs(g.in+g.out-.4)<1e-12);}
 assert.deepEqual(crossfadeGain(-3,1),{in:0,out:1});assert.deepEqual(crossfadeGain(9,1),{in:1,out:0});
});
test('plan de fundido: la misma pista no se corta; las demás salen a la vez',()=>{
 assert.deepEqual(crossfadePlan(['a','b'],'a'),{leaving:['b'],starting:false});
 assert.deepEqual(crossfadePlan(['a','b'],'c'),{leaving:['a','b'],starting:true});
 assert.deepEqual(crossfadePlan([],'c'),{leaving:[],starting:true});
});
test('volumen, fundido y ambientes',()=>{
 assert.equal(audioVolume(.5,true),.14);assert.equal(audioVolume(3,false),1);assert.equal(audioVolume('x',false),.3);
 assert.equal(fadeMs(3.5),3500);assert.equal(fadeMs(0),3500);assert.equal(fadeMs(99),10000);assert.equal(fadeMs(.01),300);
 assert.deepEqual(ambientFor('dim'),{dark:.38,level:.3});assert.equal(ambientFor('x'),null);
});
test('geometría: clamp de barra y vista previa dentro de pantalla',()=>{
 assert.deepEqual(clampPos({x:-5,y:-5},[600,90],[1600,900]),{x:0,y:0});
 assert.deepEqual(clampPos({x:5000,y:5000},[600,90],[1600,900]),{x:1000,y:810});
 const item={left:100,right:420,top:200,height:24},box={width:260,height:180};
 assert.equal(previewPlace(item,box,[1600,900]).x,430);
 assert.equal(previewPlace({...item,left:1300,right:1620},box,[1600,900]).x,1300-10-260); // no cabe a la derecha → izquierda
 assert.equal(previewPlace({...item,top:-50},box,[1600,900]).y,8);
 assert.equal(panelSide({y:700},[1600,900]),'above');assert.equal(panelSide({y:100},[1600,900]),'below');
});
test('refs: cadenas, uuid, flag y descartes',()=>{
 assert.deepEqual(normalizeRef('Scene.abcdefghijklmnop'),{uuid:'Scene.abcdefghijklmnop'});
 assert.deepEqual(normalizeRef('sounds/viento.ogg'),{src:'sounds/viento.ogg'});
 assert.equal(normalizeRef({flag:['a','b']}),null);assert.equal(normalizeRef(7),null);
 assert.ok(sceneMatches({flag:['m','slug','x']},{flags:{m:{slug:'x'}}}));assert.ok(!sceneMatches({flag:['m','slug','x']},{flags:{}}));
});
const pack=()=>({id:'p',scenes:[{ref:{name:'Sala'},music:'sounds/a.ogg',cues:[{sound:'sounds/b.ogg',label:'B'},{label:'sin sonido'}],ambient:'dim',stage:{eye:3,anchors:[[2,-1],[.5,.5],['x',1]]}}],settings:{motifs:[{id:'m1',label:'M'},{id:'m1'}],markers:{clocks:[{id:'r',segments:99}]}}});
test('esquema: normaliza, recorta y avisa',()=>{
 const v=validatePack(pack());assert.ok(v.ok);const s=v.pack.scenes[0];
 assert.equal(s.stage.eye,1);assert.deepEqual(s.stage.anchors,[[1,0],[.5,.5]]);assert.equal(s.cues.length,1);assert.equal(v.pack.settings.motifs.length,1);assert.equal(v.pack.settings.markers.clocks[0].segments,12);
 assert.ok(v.warnings.some(w=>w.includes('cue 1')));
});
test('esquema: errores claros y versión futura',()=>{
 assert.equal(validatePack({scenes:[]}).ok,false);assert.equal(validatePack({id:'x'}).ok,false);assert.equal(validatePack('{no json').ok,false);
 const f=validatePack({id:'x',schema:SCHEMA+1,scenes:[]});assert.equal(f.ok,false);assert.match(f.errors[0],/esquema/);
 assert.equal(validatePack({id:'x',scenes:[{music:'a.ogg'}]}).ok,false);
 assert.equal(migratePack({scenes:[]}).schema,SCHEMA);
});
test('esquema: ida y vuelta estable (normalizar dos veces da lo mismo)',()=>{const a=validatePack(pack()).pack;assert.deepEqual(validatePack(JSON.parse(JSON.stringify(a))).pack,a);});
test('migración desde Trono de la Sed: 29 escenas con música, efectos, actores y suelo',()=>{
 const direction=json('./fixtures/trono-direction.json'),stage=json('./fixtures/trono-stage.json');delete stage._nota;
 const p=convertTrono({direction,stage,motifs:[['batalla','Batalla'],['tension','Tensión']]});
 const v=validatePack(p);assert.ok(v.ok,v.errors.join());assert.equal(v.pack.scenes.length,direction.length);
 const f=v.pack.scenes.find(s=>s.ref.flag[2]==='funeral');
 assert.deepEqual(f.music,{flag:['mr-trono-de-la-sed','slug','procesion']});assert.equal(f.cues.length,3);assert.equal(f.figures.length,4);assert.equal(f.stage.eye,stage.funeral.eye);assert.equal(f.stage.anchors.length,stage.funeral.anchors.length);
 assert.deepEqual(f.reading,{sceneFlag:['mr-trono-de-la-sed','direction']});assert.equal(v.pack.settings.motifs.length,2);
});
test('autoconfigurar propone música, lectura y figuras por nombre',()=>{
 const r=proposeConfig({sceneName:'La Bodega',tokenActorIds:['a1'],playlists:[{name:'Bodega',sounds:[{name:'x',uuid:'PlaylistSound.1'}]},{name:'Otra',sounds:[]}],journals:[{name:'Lectura la bodega',uuid:'JournalEntry.1',pages:[{name:'Intro',uuid:'JournalEntry.1.JournalEntryPage.1'}]}],actors:[{id:'a1',name:'Tía',uuid:'Actor.a1'},{id:'a2',name:'Otro',uuid:'Actor.a2'}]});
 assert.deepEqual(r.music,{uuid:'PlaylistSound.1'});assert.equal(r.reading.uuid,'JournalEntry.1.JournalEntryPage.1');assert.equal(r.figures.length,1);
 assert.deepEqual(proposeConfig({sceneName:'Nada'}).found,{music:false,reading:false,figures:0});
});
test('marcadores: relojes y progreso',()=>{
 assert.equal(clockAfterClick(0,2,6),3);assert.equal(clockAfterClick(3,2,6),2);assert.equal(clampSeg(99,6),6);assert.equal(clampSeg('x',6),0);
 assert.deepEqual(milestonesProgress([{id:'a'},{id:'b'}],{a:true}),{done:1,total:2});assert.deepEqual(clockState([{id:'r',segments:4}],{r:9}),{r:4});
});
test('paquete de ejemplo válido, con textos y ficheros existentes',()=>{
 const v=validatePack(json('../examples/posada/pack.json'));assert.ok(v.ok,v.errors.join());assert.equal(v.warnings.length,0);assert.equal(v.pack.scenes.length,3);
 for(const s of v.pack.scenes){assert.ok(s.stage.anchors.length>=4);readFileSync(new URL('../'+s.thumb.replace('modules/mr-direccion/',''),import.meta.url));}
});
test('idiomas: es y en tienen las mismas claves; versión de module.json coherente',()=>{
 const es=json('../lang/es.json'),en=json('../lang/en.json');assert.deepEqual(Object.keys(es).sort(),Object.keys(en).sort());
 const m=json('../module.json');assert.match(m.version,/^\d+\.\d+\.\d+$/);assert.ok(m.download.includes(`v${m.version}`));assert.equal(m.id,'mr-direccion');
});

test('v13: un movimiento trae width/height actuales y NO es un reajuste explícito',()=>{
 const doc={width:3.5,height:3.5};
 assert.equal(isExplicitResize({x:10,y:20,width:3.5,height:3.5,shape:4},doc),false);
 assert.equal(isExplicitResize({x:10},doc),false);
 assert.equal(isExplicitResize({width:2},doc),true);assert.equal(isExplicitResize({height:5},doc),true);
});
test('sonidos gestionados: la clave separa música y efecto del mismo archivo; nombre legible',()=>{
 assert.notEqual(soundKey('music','a.ogg'),soundKey('fx','a.ogg'));
 assert.equal(baseName('sounds/El%20viento.ogg'),'El viento');assert.equal(baseName('x'),'x');
});

test('tamaño de ficha sin suelo: cuadrado de N px que conserva centro y pies; con suelo, por perspectiva',()=>{
 const tk={x:700,y:400,width:2,height:2}; // 200 px
 const p=sizePatch(scene,tk,300,null);
 assert.equal(p.width,3);assert.ok(Math.abs(p.x+150-800)<1e-9); // mismo centro
 assert.ok(Math.abs(p.y+300*(1-FIGURE_DEFAULTS.foot)-(400+200*(1-FIGURE_DEFAULTS.foot)))<1e-9); // mismos pies
 const big=sizePatch(scene,tk,5000,null);assert.equal(big.width*100,900); // no supera la escena
 const a=sizePatch(scene,{...tk,y:300},300,{eye:.4,anchors:[]}),b=sizePatch(scene,{...tk,y:700},300,{eye:.4,anchors:[]});
 assert.ok(b.width>a.width);
 assert.ok(sizePatch(scene,{x:-500,y:-500,width:1,height:1},100,null).x>=0);
});

test('giro hacia el movimiento: misma convención que Foundry (0 = mirando hacia abajo)',()=>{
 const o={x:100,y:100};
 assert.equal(facingAngle(o,{x:100,y:200}),0);      // abajo
 assert.equal(facingAngle(o,{x:200,y:100}),270);    // derecha
 assert.equal(facingAngle(o,{x:100,y:0}),180);      // arriba
 assert.equal(facingAngle(o,{x:0,y:100}),90);       // izquierda
 assert.equal(facingAngle(o,o),null);
});
