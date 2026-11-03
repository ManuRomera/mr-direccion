import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {sizePatch,figureSize,stageLayout,depthPatch,rowLayout,coverPosition,figureOptions,missingCast,isExplicitResize,FIGURE_DEFAULTS,effectiveStage,vpAnchors,refScale,eyeFromRef,vpFromBox,derivedVp} from '../js/core/perspective.mjs';
import {crossfadeGain,crossfadePlan,audioVolume,fadeMs,ambientFor,soundKey,baseName} from '../js/core/crossfade.mjs';
import {clampPos,previewPlace,panelSide,facingAngle} from '../js/core/geometry.mjs';
import {validatePack,migratePack,normalizeRef,sceneMatches,SCHEMA} from '../js/core/schema.mjs';
import {convertTrono} from '../js/core/trono.mjs';
import {proposeConfig} from '../js/core/autoconfig.mjs';
import {clockAfterClick,clampSeg,milestonesProgress,clockState,publicMilestones,publicClocks,phraseFor,clockEvent} from '../js/core/markers.mjs';
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

test('effectiveStage: horizonte, punto de fuga y sin perspectiva',()=>{
 assert.equal(effectiveStage({mode:'none',eye:.5,anchors:[[.5,.9]],vp:[.5,.4]}),null);          // cenital: nunca escala
 assert.equal(effectiveStage({mode:'horizon',eye:.5,anchors:[]}),null);                          // sin apoyos no está configurado (como antes)
 assert.equal(effectiveStage({mode:'horizon',eye:.4,anchors:[[.5,.9]]}).eye,.4);
 assert.equal(effectiveStage({eye:.4,anchors:[[.5,.9]]}).eye,.4);                                // configuraciones antiguas, sin mode
 assert.equal(effectiveStage({mode:'vanishing',eye:.5,vp:[.3,.42],anchors:[]}).eye,.42);         // la altura del punto de fuga hace de horizonte
 assert.equal(effectiveStage({mode:'vanishing',eye:.5,vp:null,anchors:[[.5,.9]]}),null);         // sin punto no hay perspectiva
});
test('punto de fuga y horizonte a la misma altura dan el mismo tamaño',()=>{
 const h=effectiveStage({mode:'horizon',eye:.45,anchors:[[.5,.9]]}),v=effectiveStage({mode:'vanishing',eye:.9,vp:[.2,.45],anchors:[]});
 for(const y of [.6,.8,.95])assert.equal(figureSize(h,y*900,900),figureSize(v,y*900,900));
});
test('vpAnchors: apoyos sobre rayos del punto de fuga, bajo el horizonte y dentro de la escena',()=>{
 const vp=[.35,.45],pts=vpAnchors(vp,6);assert.equal(pts.length,6);
 for(const [x,y] of pts){assert.ok(x>=0&&x<=1&&y>vp[1]&&y<=1);}
 assert.ok(pts.every((p,i)=>i===0||p[0]>pts[i-1][0]-.02),'de izquierda a derecha');
 assert.ok(new Set(pts.map(p=>p[1])).size>3,'a distintas profundidades');
 const [lo]=vpAnchors([.5,.97],1);assert.ok(lo[1]>.97||lo[1]<=1);                               // punto de fuga muy bajo: no se sale
});
test('esquema: stage.mode y stage.vp se normalizan y lo antiguo sigue siendo horizonte',()=>{
 const n=st=>validatePack({id:'p',scenes:[{ref:{name:'S'},stage:st}]}).pack.scenes[0].stage;
 assert.equal(n({eye:.4,anchors:[[.5,.9]]}).mode,'horizon');
 assert.equal(n({mode:'raro'}).mode,'horizon');
 assert.deepEqual(n({mode:'vanishing',vp:[2,-1]}).vp,[1,0]);
 assert.equal(n({mode:'vanishing',vp:['x',1]}).vp,null);
 assert.equal(n({mode:'none'}).mode,'none');
});

test('referencia de escala: una persona al pie de la puerta mide PERSON/puerta de su alto',()=>{
 const ref=[.45,.4,.55,.7],eye=.45,k=refScale(eye,ref,2.1);
 assert.ok(Math.abs(k-1.75/2.1*.3/(.7-eye))<1e-9);
 const st=effectiveStage({mode:'horizon',eye,ref,refM:2.1,anchors:[[.5,.9]]});
 const token=figureSize(st,.7*900,900,360),person=token*FIGURE_DEFAULTS.visible;          // píxeles de la persona
 assert.ok(Math.abs(person-(1.75/2.1)*.3*900)<.5,`persona ${person}`);                      // 0,8333 × la altura de la puerta (270 px)
 assert.ok(figureSize(st,.9*900,900)>figureSize(st,.6*900,900));                           // sigue creciendo hacia el frente
 const doble=effectiveStage({mode:'horizon',eye,ref,refM:4.2,anchors:[[.5,.9]]});  // la misma puerta, pero de 4,2 m: la gente es la mitad
 assert.ok(Math.abs(figureSize(doble,.7*900,900)*2-token)<1);
});
test('referencia: sin referencia o inválida el modelo base no cambia (k=1)',()=>{
 const base={mode:'horizon',eye:.45,anchors:[[.5,.9]]};
 assert.equal(effectiveStage(base).k,undefined);
 assert.equal(effectiveStage({...base,ref:[.1,.5,.2,.5],refM:2.1}).k,undefined);              // sin altura
 assert.equal(effectiveStage({...base,ref:[.1,.2,.2,.4],refM:2.1}).k,undefined);              // base por encima del horizonte
 assert.equal(refScale(.5,null),null);
});
test('eyeFromRef: el horizonte cae a la altura de los ojos medida sobre la puerta',()=>{
 const y=eyeFromRef([.4,.4,.6,.7],2.1);assert.ok(Math.abs(y-(.7-1.6/2.1*.3))<1e-9);
 assert.ok(y>.4&&y<.7);
});
test('esquema: stage.ref se ordena y se acota; refM por defecto 2,1',()=>{
 const n=st=>validatePack({id:'p',scenes:[{ref:{name:'S'},stage:st}]}).pack.scenes[0].stage;
 assert.deepEqual(n({ref:[.8,.9,.2,.3]}).ref,[.2,.3,.8,.9]);
 assert.deepEqual(n({ref:[2,-1,0,0]}).ref,[0,0,1,0]);
 assert.equal(n({ref:[1,2,3]}).ref,null);assert.equal(n({}).ref,null);
 assert.equal(n({}).refM,2.1);assert.equal(n({refM:999}).refM,50);
});

test('vpFromBox: las cuatro líneas esquina→esquina de un rectángulo de salida se cruzan en el punto de fuga',()=>{
 const v=[.5,.4],s=.3,box=[v[0]+s*(0-v[0]),v[1]+s*(0-v[1]),v[0]+s*(1-v[0]),v[1]+s*(1-v[1])];   // la imagen reducida al 30 % hacia el punto de fuga
 for(const a of [16/9,1,2.4]){const p=vpFromBox(box,a);assert.ok(Math.abs(p[0]-.5)<1e-3&&Math.abs(p[1]-.4)<1e-3,`aspect ${a}: ${p}`);}
 const q=vpFromBox([.4,.3,.62,.58],16/9);assert.ok(q[0]>=0&&q[0]<=1&&q[1]>=0&&q[1]<=1);           // rectángulo a ojo: queda un punto razonable dentro de la imagen
 assert.equal(vpFromBox([0,0,1,1]),null);assert.equal(vpFromBox(null),null);assert.equal(vpFromBox([.1,.1,.2]),null);
});
test('derivedVp / effectiveStage: con rectángulo de salida el punto de fuga sale de él; sin él manda el punto manual',()=>{
 const box=[.35,.28,.65,.58],st={mode:'vanishing',eye:.9,vp:[.1,.1],ref:box,refM:2.7,anchors:[]};
 const vp=derivedVp(st,16/9);assert.ok(Math.abs(vp[0]-.5)<1e-3&&Math.abs(vp[1]-.4)<1e-3);
 const e=effectiveStage(st,16/9);assert.equal(e.eye,vp[1]);assert.deepEqual(e.vp,vp);assert.ok(e.k>0);
 assert.deepEqual(derivedVp({mode:'vanishing',vp:[.3,.4],ref:null},16/9),[.3,.4]);
 assert.equal(derivedVp({mode:'horizon',vp:[.3,.4],ref:box},16/9),null);
 // la escala coherente: una persona al pie del rectángulo (techo de 2,7 m) mide 1,75/2,7 de su alto
 const person=figureSize(e,.58*900,900,360)*FIGURE_DEFAULTS.visible;assert.ok(Math.abs(person-(1.75/2.7)*.30*900)<1,`persona ${person}`);
});

test('hitos y relojes: qué ve la mesa (hitos públicos por defecto, relojes solo si son públicos)',()=>{
 const ms=[{id:'a'},{id:'b',public:false},{id:'c',public:true}],cl=[{id:'r'},{id:'s',public:true},{id:'t',public:false}];
 assert.deepEqual(publicMilestones(ms).map(m=>m.id),['a','c']);
 assert.deepEqual(publicClocks(cl).map(c=>c.id),['s']);
 assert.deepEqual(milestonesProgress(publicMilestones(ms),{a:true,b:true}),{done:1,total:2});   // el secreto no cuenta ni se filtra en el contador
});
test('phraseFor: una frase por casilla; con una sola línea se usa siempre',()=>{
 assert.equal(phraseFor(['uno','dos','tres'],2),'dos');
 assert.equal(phraseFor(['uno','','tres'],2),'');
 assert.equal(phraseFor(['siempre'],4),'siempre');
 assert.equal(phraseFor([],1),'');assert.equal(phraseFor(undefined,1),'');assert.equal(phraseFor(['a','b'],5),'');
 assert.equal(phraseFor(['  hola  '],1),'hola');
});
test('clockEvent: solo avisa al subir y si el reloj avisa (o se fuerza); la frase propia manda sobre la preparada',()=>{
 const c={id:'r',label:'La puerta cede',segments:6,announce:true,phrases:['crujido','golpe']};
 const e=clockEvent(c,1,2,{now:7});assert.deepEqual({...e},{id:'r',label:'La puerta cede',segments:6,from:1,to:2,phrase:'golpe',t:7});
 assert.equal(clockEvent(c,3,2),null);assert.equal(clockEvent(c,2,2),null);                       // bajar o no mover: nada
 assert.equal(clockEvent({...c,announce:false},1,2),null);                                          // no avisa
 assert.equal(clockEvent({...c,announce:false},1,2,{force:true,phrase:'¡Voces!'}).phrase,'¡Voces!'); // Mayús + clic
 assert.equal(clockEvent(c,0,1,{phrase:'a mano'}).phrase,'a mano');
 assert.equal(clockEvent(c,0,1,{phrase:'  '}).phrase,'crujido');                                      // vacío: cae a la preparada
});
test('esquema: public/announce/phrases de hitos y relojes se normalizan y lo anterior sigue igual',()=>{
 const n=m=>validatePack({id:'p',settings:{markers:m},scenes:[]}).pack.settings.markers;
 const k=n({milestones:[{id:'h',label:'H'},{id:'i',label:'I',public:false}],clocks:[{id:'r',label:'R',segments:4},{id:'s',label:'S',public:true,announce:true,phrases:' a \n\n b \n\n'}]});
 assert.equal(k.milestones[0].public,true);assert.equal(k.milestones[1].public,false);
 assert.equal(k.clocks[0].public,false);assert.equal(k.clocks[0].announce,false);assert.deepEqual(k.clocks[0].phrases,[]);
 assert.equal(k.clocks[1].public,true);assert.equal(k.clocks[1].announce,true);assert.deepEqual(k.clocks[1].phrases,['a','','b']);
 assert.equal(n({clocks:[{id:'x',label:'X',phrases:Array(30).fill('z')}]}).clocks[0].phrases.length,12);
});
