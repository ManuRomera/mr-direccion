// Verifica las ventanas del módulo en 9 pantallas emuladas. Requiere Foundry de prueba con un GM dentro y Chrome con --remote-debugging-port=9333.
// node tools/pantallas.mjs [1280x650,1440x780] [shots]   (con «shots» guarda pant-<pantalla>.png en el directorio actual)
import fs from 'node:fs';
const PORT=9333,SCREENS=(process.argv[2]||'1024x640,1280x650,1366x657,1440x780,1512x860,1536x730,1680x900,1920x950,2560x1300').split(',');
const list=await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();const t=list.find(x=>x.type==='page');
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));
let id=0;const pend=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);}});
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}));});
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,awaitPromise:true,returnByValue:true});if(r.result?.exceptionDetails)throw new Error(r.result.exceptionDetails.exception?.description);return r.result.result.value;};
const PAGE=`(async()=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));const ID='mr-direccion',api=game.modules.get(ID).api;
 for(const a of [...foundry.applications.instances.values()])if(/mr-direccion-editor|dialog/.test(a.id||'')||a.element?.classList.contains('mrd-win'))await a.close();
 const doc=document.documentElement,hot=parseFloat(getComputedStyle(document.body).getPropertyValue('--hotbar-height'))||0,out=[];
 const m=(name,el,sel)=>{const r=el.getBoundingClientRect(),b=el.querySelector(sel),rb=b?.getBoundingClientRect(),W=doc.clientWidth,H=doc.clientHeight,small=H<950||W<1920,lim=small?.92:1;
  const fh=r.height/H,fw=r.width/W,inside=r.left>=-.5&&r.top>=-.5&&r.right<=W+.5&&r.bottom<=H+.5,btn=rb?rb.top>=-.5&&rb.bottom<=H+.5&&rb.height>0:null;
  out.push({name,view:W+'×'+H,scale:+(parseFloat(el.style.getPropertyValue('--mrd-win-scale'))||1).toFixed(2),box:[r.left,r.top,r.width,r.height].map(Math.round),h:Math.round(fh*100),w:Math.round(fw*100),inside,btn,ok:inside&&btn!==false&&fh<=lim&&fw<=lim});};
 const scene=game.scenes.contents.find(s=>api.sceneConfig?.(s))||game.scenes.contents[0];
 const ed=api.openEditor(scene.id);await sleep(1200);ed.tab='scene';await ed.render();await sleep(500);m('editor-escena',ed.element,'button:not(.header-control)');
 ed.tab='floor';await ed.render();await sleep(500);m('editor-perspectiva',ed.element,'.mrd-floor');
 await ed.close();await sleep(300);
 const {pickSound}=await import('/modules/mr-direccion/js/picker.mjs');pickSound({title:'Sonido'});await sleep(1000);
 const pk=[...foundry.applications.instances.values()].find(a=>a.element?.classList.contains('mrd-win'));if(pk){m('selector',pk.element,'.form-footer button');await pk.close();}
 await sleep(300);
 foundry.applications.api.DialogV2.confirm({classes:['mrd-win'],window:{title:'Tutorial',resizable:true},content:'<p>¿?</p>',rejectClose:false});await sleep(800);
 const cf=[...foundry.applications.instances.values()].find(a=>a.element?.classList.contains('mrd-win'));if(cf){m('diálogo',cf.element,'.form-footer button');await cf.close();}
 const bar=document.querySelector('#mr-direccion-bar');if(bar){const r=bar.getBoundingClientRect(),W=doc.clientWidth;out.push({name:'barra',view:W+'×'+doc.clientHeight,box:[r.left,r.top,r.width,r.height].map(Math.round),inside:r.left>=-.5&&r.right<=W+.5,ok:r.left>=-.5&&r.right<=W+.5});}
 return out;})()`;
const OPEN=process.argv[3]==='shots';let fails=0;
for(const s of SCREENS){const [w,h]=s.split('x').map(Number);
 await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await new Promise(r=>setTimeout(r,900));
 const out=await ev(PAGE);console.log(`\n${s}`);
 for(const e of out){fails+=!e.ok;console.log(`  ${e.name.padEnd(20)} esc ${String(e.scale??'-').padStart(4)} alto ${String(e.h??'-').padStart(3)}% ancho ${String(e.w??'-').padStart(3)}%  [${e.box}] ${e.ok?'✓':'✗'}${e.btn===false?' sin botón':''}${e.inside===false?' fuera':''}`);}
 if(OPEN){await ev(`(async()=>{const api=game.modules.get('mr-direccion').api;const sc=game.scenes.contents.find(s=>api.sceneConfig?.(s))||game.scenes.contents[0];const ed=api.openEditor(sc.id);await new Promise(r=>setTimeout(r,1200));ed.tab='floor';await ed.render();await new Promise(r=>setTimeout(r,600));})()`);
  const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`pant-${s}.png`,Buffer.from(r.result.data,'base64'));await ev(`foundry.applications.instances.get('mr-direccion-editor')?.close()`);}
}
console.log(fails?`\n${fails} con problemas`:'\nTodo en orden');ws.close();process.exit(0);
