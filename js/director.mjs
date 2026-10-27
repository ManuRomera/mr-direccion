import {ID,configuredScenes,sceneConfig,globalSettings,saveSceneConfig,saveGlobal} from './store.mjs';
import {find,labelOf,soundInfo,isPlaying} from './refs.mjs';
import {pickSound} from './picker.mjs';
import {DEFAULT_MOTIFS} from './core/schema.mjs';
import {E} from './core/ids.mjs';
import {previewPlace} from './core/geometry.mjs';
import {AMBIENTS} from './core/crossfade.mjs';
import {mix,applyMix,playRef,stopAudio,stopEffects,playEffect,setAmbient,quiesceNative,fadeSeconds} from './audio.mjs';
import {options,placeActors,castOf,resolveActors,resizeFigures,setOption,fitScreen} from './figures.mjs';
import {L,enableRightDrag,closeOnOutside} from './ui.mjs';
import {toggleMarkersPanel,toggleMilestone,setClock} from './markers.mjs';
const MARK=`modules/${ID}/brand/MR_09_Monograma_Marfil_Transparente.png`;
let bar,queue=Promise.resolve(),queued=false,selectedId=null,applyPos=()=>{};
const activeGM=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const warn=k=>ui.notifications.warn(L(k));
const enqueue=fn=>(queue=queue.catch(()=>{}).then(fn));
function subject(){
 const list=configuredScenes();if(canvas?.scene&&list.some(x=>x.scene.id===canvas.scene.id))return canvas.scene;
 return list.find(x=>x.scene.id===selectedId)?.scene??list[0]?.scene??null;
}
const sceneById=id=>game.scenes.get(id);
const pressed=(s,v)=>`aria-pressed="${!!v}"`;
function btn(action,arg,text,icon,extra='',cls=''){return `<button type="button" class="mrd-btn ${cls}" data-mrd-action="${action}" data-mrd-arg="${E(arg)}" title="${E(text)}" ${extra}><i class="fa-solid fa-${icon}" aria-hidden="true"></i><span>${E(text)}</span></button>`;}
export async function dispatch(action,arg=''){
 if(!game.user.isGM)return false;
 const free=['read','fit','recenter','compact','editor','tutorial','markers','handout','view','assign','default-motifs'];
 if(!free.includes(action)&&!activeGM()){warn('ActiveGM');return false;}
 arg=arg.replace(/(^|~)@(?=~|$)/g,'$1'+(subject()?.id??''));
 const scene=sceneById(arg.split('~')[0]);
 switch(action){
  case 'fit':fitScreen();return true;
  case 'recenter':await game.settings.set(ID,'pos',null);applyPos();return true;
  case 'compact':await game.settings.set(ID,'compact',!game.settings.get(ID,'compact'));refresh();return true;
  case 'editor':game.modules.get(ID).api.openEditor(arg);return true;
  case 'tutorial':game.modules.get(ID).api.startTutorial();return true;
  case 'markers':toggleMarkersPanel();return true;
  case 'view':if(scene){selectedId=scene.id;await scene.view();refresh();}return true;
  case 'read':{const d=find(sceneConfig(scene)?.reading,'journal',scene);if(!d)return warn('NoReading'),false;
   const doc=d.sheet||d.parent?.sheet?d:await fromUuid(d.uuid);if(!doc)return warn('NoReading'),false;const page=doc.documentName==='JournalEntryPage'?doc:null,j=page?page.parent:doc;await j.sheet.render(true,page?{pageId:page.id}:{});return true;}
  case 'handout':{const idx=Number(arg.split('~')[1]),h=sceneConfig(scene)?.handouts[idx];if(h)await showHandout(h.ref,scene);return !!h;}
  case 'assign':return assign(arg);
  case 'default-motifs':{const have=new Set(globalSettings().motifs.map(m=>m.id));await saveGlobal({motifs:[...globalSettings().motifs,...DEFAULT_MOTIFS.filter(m=>!have.has(m[0])).map(([id,es,en,icon])=>({id,label:game.i18n.lang==='es'?es:en,icon,music:null}))]});refresh();return true;}
  case 'marker':await toggleMilestone(arg);return true;
  case 'clock':{const [id,i]=arg.split('~');await setClock(id,Number(i));return true;}
 }
 return enqueue(async()=>{
  if(!activeGM())return false;const cfg=sceneConfig(scene),g=globalSettings();
  switch(action){
   case 'activate':{if(!scene)return false;activating.add(scene.id);
    try{await scene.activate();}finally{setTimeout(()=>activating.delete(scene.id),1500);}
    Hooks.callAll('mrDireccion.sceneChanged',scene,cfg);
    if(cfg?.music){await quiesceNative(scene);if(await playRef(cfg.music,scene)){setTimeout(()=>quiesceNative(scene).catch(()=>{}),700);}else if(!soundInfo(cfg.music,scene))warn('NoSound');}
    if(cfg?.ambient)await setAmbient(scene,cfg.ambient);break;}
   case 'music':if(!(cfg?.music&&await playRef(cfg.music,scene))&&!soundInfo(cfg?.music,scene))warn('NoSound');break;
   case 'motif':{const [id]=arg.split('~'),m=g.motifs.find(x=>x.id===id);const sc=sceneById(arg.split('~')[1]);
    if(!m||!soundInfo(m.music))return warn('NoSound'),false;
    if(isPlaying(m.music,'music')){const back=sc&&sceneConfig(sc)?.music;if(back&&soundInfo(back,sc))await playRef(back,sc);else await stopAudio();}
    else await playRef(m.music,sc);
    Hooks.callAll('mrDireccion.motif',m.id,sc);break;}
   case 'effect':{const [k,i]=arg.split('~');const item=k==='g'?g.effects.find(e=>e.id===i):sceneConfig(scene)?.cues[Number(i)];if(!(item&&await playEffect(item.sound,scene))&&!soundInfo(item?.sound,scene))warn('NoSound');break;}
   case 'quiet':await applyMix(mix().level,!mix().quiet);break;
   case 'level':await applyMix(Number(arg),mix().quiet);break;
   case 'ambient':{const [,key]=arg.split('~');if(scene&&AMBIENTS[key])await setAmbient(scene,key);break;}
   case 'stop':await stopAudio();break;
   case 'stop-effects':await stopEffects();break;
   case 'figures':{if(!cfg?.figures.length)return warn('NoFigures'),false;const cast=await castOf(scene);if(!cast.length)return warn('NoActors'),false;const n=await placeActors(scene,cast);if(!n)ui.notifications.info(L('AlreadyPlaced'));break;}
   case 'figure':{const [a]=await resolveActors([cfg?.figures[Number(arg.split('~')[1])]?.ref].filter(Boolean));if(!a)return warn('NoActors'),false;if(!await placeActors(scene,[a]))ui.notifications.info(L('AlreadyPlaced'));break;}
   case 'presentation':{const [k,v]=arg.split('~');await setOption(k,k==='tokenPixels'?Number(v):v==='true');break;}
   case 'resize':case 'resize-selected':await resizeFigures(scene,action==='resize-selected');break;
   default:return false;
  }
  refresh();return true;
 });
}
const activating=new Set();
/** Asignación rápida: elige un sonido y lo guarda donde corresponda (música de escena, motivo, efecto de escena o efecto global). */
async function assign(arg){
 const [kind,a,b]=arg.split('~'),g=globalSettings();
 const scene=kind==='motif'||kind==='geffect'?null:sceneById(a);
 const title=L('Pick.Title_'+kind,{n:kind==='motif'?g.motifs.find(m=>m.id===a)?.label??a:''});
 const ref=await pickSound({title});if(!ref)return false;
 if(kind==='music'){const cfg=structuredClone(sceneConfig(scene));cfg.music=ref;await saveSceneConfig(scene,cfg);}
 else if(kind==='cue'){const cfg=structuredClone(sceneConfig(scene));if(b==='new')cfg.cues.push({label:'',icon:'wave-square',sound:ref});else cfg.cues[Number(b)].sound=ref;await saveSceneConfig(scene,cfg);}
 else if(kind==='motif')await saveGlobal({motifs:g.motifs.map(m=>m.id===a?{...m,music:ref}:m)});
 else if(kind==='geffect')await saveGlobal({effects:g.effects.map(e=>e.id===a?{...e,sound:ref}:e)});
 else return false;
 ui.notifications.info(L('Assigned'));refresh();return true;
}
async function showHandout(ref,scene){
 let d=find(ref,'journal',scene)??find(ref,'actor',scene);
 if(d&&!d.sheet&&!d.parent?.sheet&&d.uuid)d=await fromUuid(d.uuid).catch(()=>null);
 if(d){const j=d.documentName==='JournalEntryPage'?d.parent:d;return j.show?.(undefined,true)??j.sheet.render(true);}
 const src=ref.src;if(!src)return warn('NoHandout');
 const pop=new foundry.applications.apps.ImagePopout({src,window:{title:labelOf(ref,'journal')||src}});await pop.render({force:true});pop.shareImage?.();
}
export function refresh(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;render();});}
function sceneMenu(list,sel){
 return `<details data-menu="scenes" class="mrd-scenes"><summary class="mrd-btn mrd-scene-pick" aria-label="${E(L('ChooseScene'))}" title="${E(L('ChooseScene'))}"><span class="mrd-scene-name">${E(sel.name)}</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary><div class="mrd-menu mrd-scene-list" role="listbox">${list.map(({scene:s})=>`<button type="button" role="option" class="mrd-scene-item ${s.id===sel.id?'is-current':''}" aria-selected="${s.id===sel.id}" data-mrd-action="view" data-mrd-arg="${s.id}" data-thumb="${E(sceneConfig(s)?.thumb||s.thumb||s.background?.src||'')}">${E(s.name)}</button>`).join('')}</div></details>`;
}
function render(){
 if(!game.user.isGM||!game.settings.get(ID,'showBar')){bar?.remove();bar=null;return;}
 if(!bar)build();
 const list=configuredScenes(),compact=!!game.settings.get(ID,'compact');
 bar.classList.toggle('is-compact',compact);bar.classList.toggle('no-bg',!game.settings.get(ID,'bg'));bar.classList.toggle('is-glass',game.settings.get(ID,'style')==='glass');
 const open=new Set([...bar.querySelectorAll('details[open]')].map(x=>x.dataset.menu));
 const grip=`<div class="mrd-grip" title="${E(L('DragHint'))}"><img class="mrd-mark" src="${MARK}" alt="MR" draggable="false"><span class="mrd-title"><b>${E(L('Direction'))}</b><small>${E(L('Subtitle'))}</small></span></div>`;
 const collapse=`<button type="button" class="mrd-btn mrd-icon mrd-collapse" data-mrd-action="compact" data-mrd-arg="" aria-pressed="${compact}" title="${E(L(compact?'Expand':'Compact'))}"><i class="fa-solid fa-chevron-${compact?'down':'up'}" aria-hidden="true"></i></button>`;
 if(!list.length){
  bar.innerHTML=`<div class="mrd-head">${grip}<span class="mrd-empty">${E(L('Empty'))}</span>${btn('editor','',L('OpenEditor'),'pen-ruler','','is-primary')}${btn('tutorial','',L('Tutorial'),'graduation-cap')}${collapse}</div>`;
  applyPos();return;
 }
 const sel=subject()??list[0].scene,cfg=sceneConfig(sel),g=globalSettings(),m=mix(),o=options();
 const music=find(cfg.music,'sound',sel),hasMusic=!!soundInfo(cfg.music,sel),playing=isPlaying(cfg.music,'music',sel);
 const motifs=g.motifs.filter(x=>cfg.motifs===null||cfg.motifs.includes(x.id));
 const noAudio=L('NoAudioHint');
 const motifMenu=`<details data-menu="motifs"><summary class="mrd-btn"><i class="fa-solid fa-wave-square" aria-hidden="true"></i><span>${E(L('Motifs'))}</span></summary><div class="mrd-menu mrd-motifs-menu"><p><strong>${E(L('Motifs'))}</strong></p><p class="mrd-status">${E(L('MotifsHelp'))}</p>${motifs.length?`<div class="mrd-motif-grid">${motifs.map(x=>soundInfo(x.music)?btn('motif',x.id+'~'+sel.id,x.label,x.icon||'music',pressed(0,isPlaying(x.music,'music')),'mrd-motif'):btn('assign','motif~'+x.id,x.label,x.icon||'music',`aria-disabled="true"`,'mrd-motif mrd-off').replace(/title="[^"]*"/,`title="${E(x.label+' · '+noAudio)}"`)).join('')}</div>`:`<p class="mrd-status">${E(L('NoMotifsYet'))}</p><p>${btn('default-motifs','',L('AddMotifs'),'plus')}</p>`}</div></details>`;
 const handouts=cfg.handouts.length?`<details data-menu="handouts"><summary class="mrd-btn mrd-icon" aria-label="${E(L('Handouts'))}" title="${E(L('Handouts'))}"><i class="fa-solid fa-file-image" aria-hidden="true"></i></summary><div class="mrd-menu"><p><strong>${E(L('Handouts'))}</strong></p><p class="mrd-status">${E(L('HandoutsHelp'))}</p>${cfg.handouts.map((h,i)=>btn('handout',sel.id+'~'+i,h.label||labelOf(h.ref,'journal',sel)||`#${i+1}`,'share-from-square')).join('')}</div></details>`:'';
 const notes=cfg.notes?`<details data-menu="notes"><summary class="mrd-btn mrd-icon" aria-label="${E(L('Notes'))}" title="${E(L('Notes'))}"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i></summary><div class="mrd-menu"><p><strong>${E(L('Notes'))}</strong></p><p class="mrd-notes">${E(cfg.notes)}</p></div></details>`:'';
 const figs=`<details data-menu="figures"><summary class="mrd-btn"><i class="fa-solid fa-people-group" aria-hidden="true"></i><span>${E(L('Figures'))}</span></summary><div class="mrd-menu mrd-figures-menu"><p><strong>${E(L('Figures'))}</strong></p>${cfg.figures.length?`<p>${btn('figures',sel.id,L('PlaceAll'),'people-group')}</p><p>${cfg.figures.map((f,i)=>btn('figure',sel.id+'~'+i,f.label||labelOf(f.ref,'actor'),'person')).join('')}</p>`:`<p class="mrd-status">${E(L('NoFigures'))}</p>`}<label>${E(L('TokenSize'))}<input type="number" data-mrd-option="tokenPixels" min="60" max="900" step="10" value="${o.tokenPixels}"></label><p class="mrd-status">${E(L('TokenSizeHelp'))}</p><p>${[240,360,480].map(n=>btn('presentation','tokenPixels~'+n,n+' px','person')).join(' ')}</p><p>${btn('resize-selected',sel.id,L('ResizeSelected'),'up-right-and-down-left-from-center')} ${btn('resize',sel.id,L('ResizeAll'),'people-group')}</p>${[['depthScale'],['lockRotation'],['hideTrails'],['cover']].map(([k])=>`<label><input type="checkbox" data-mrd-option="${k}" ${o[k]?'checked':''}> ${E(L('Opt_'+k))}</label>`).join('')}<p class="mrd-status">${E(L('DepthScaleHelp'))}</p></div></details>`;
 const mixMenu=`<details data-menu="mix"><summary class="mrd-btn mrd-icon" aria-label="${E(L('More'))}" title="${E(L('More'))}"><i class="fa-solid fa-sliders" aria-hidden="true"></i></summary><div class="mrd-menu"><p>${E(L('Mix'))}</p><label>${E(L('Level'))}<input type="range" min="0" max="1" step=".05" value="${E(m.level)}"></label><p class="mrd-status">${E(music?.name??'')} · ${E(L(playing?'Playing':'Stopped'))} · ${E(L('FadeInfo',{s:fadeSeconds()}))}</p><p><strong>${E(L('Ambient'))}</strong></p><p>${['light','dim','dark'].map(k=>btn('ambient',sel.id+'~'+k,L('Amb_'+k),{light:'sun',dim:'cloud-moon',dark:'moon'}[k],pressed(0,sel.getFlag(ID,'ambient')===k||(!sel.getFlag(ID,'ambient')&&cfg.ambient===k)))).join('')}</p><p>${btn('stop-effects',sel.id,L('StopEffects'),'stop')}${btn('recenter','',L('Recenter'),'arrows-to-dot')}</p><p>${btn('editor',sel.id,L('Editor'),'pen-ruler')}${btn('markers','',L('Markers'),'list-check')}${btn('tutorial','',L('Tutorial'),'graduation-cap')}</p><p class="mrd-status">${E(L('DragHint'))}</p></div></details>`;
 const cueBtn=(ok,playArg,assignArg,label,icon,on)=>ok?btn('effect',playArg,label,icon,pressed(0,on),'mrd-chip'):btn('assign',assignArg,label,icon,'aria-disabled="true"','mrd-chip mrd-off').replace(/title="[^"]*"/,`title="${E(label+' · '+noAudio)}"`);
 const chips=[...cfg.cues.map((c,i)=>cueBtn(!!soundInfo(c.sound,sel),sel.id+'~'+i,'cue~'+sel.id+'~'+i,c.label||find(c.sound,'sound',sel)?.name||'—',c.icon||'wave-square',isPlaying(c.sound,'fx',sel))),
  ...g.effects.map(e=>cueBtn(!!soundInfo(e.sound,sel),'g~'+e.id,'geffect~'+e.id,e.label||find(e.sound,'sound',sel)?.name||'—',e.icon||'wave-square',isPlaying(e.sound,'fx',sel))),
  btn('assign','cue~'+sel.id+'~new',L('AddEffect'),'plus','','mrd-chip mrd-add')].join('');
 bar.innerHTML=`<div class="mrd-head">${grip}${sceneMenu(list,sel)}<div class="mrd-grp">${btn('read',sel.id,L('Read'),'book-open')}${btn('activate',sel.id,L('Show'),'panorama','','is-primary')}</div><div class="mrd-grp mrd-secondary">${hasMusic?btn('music',sel.id,L(playing?'Resume':'Music'),'music'):btn('assign','music~'+sel.id,L('Music'),'music','aria-disabled="true"','mrd-off').replace(/title="[^"]*"/,`title="${E(L('Music')+' · '+noAudio)}"`)}${motifMenu}${btn('quiet',sel.id,L('Quiet'),'volume-low',pressed(0,m.quiet))}${btn('stop',sel.id,L('Stop'),'volume-xmark')}</div><div class="mrd-grp mrd-secondary">${btn('fit',sel.id,L('Fit'),'expand')}${figs}${handouts}${notes}${mixMenu}</div>${collapse}</div><div class="mrd-cues">${chips}</div>`;
 for(const d of bar.querySelectorAll('details'))d.open=open.has(d.dataset.menu);
 for(const b of bar.querySelectorAll('.mrd-btn:not([title])')){const t=b.textContent.trim();if(t)b.title=t;}
 applyPos();
}
function build(){
 bar=document.createElement('aside');bar.id='mr-direccion-bar';bar.setAttribute('role','region');bar.setAttribute('aria-label',L('Direction'));document.body.append(bar);
 let timer=null,preview=null;
 const hide=()=>{clearTimeout(timer);timer=null;preview?.remove();preview=null;};
 bar.addEventListener('pointerover',e=>{
  const it=e.target.closest('.mrd-scene-item');if(!it||it.contains(e.relatedTarget))return;hide();
  timer=setTimeout(()=>{
   const src=it.dataset.thumb;if(!src||!it.isConnected)return;
   preview=document.createElement('div');preview.className='mrd-scene-preview';preview.innerHTML=`<img src="${E(src)}" alt=""><span>${E(it.textContent)}</span>`;document.body.append(preview);
   const place=()=>{const r=it.getBoundingClientRect(),b=preview.getBoundingClientRect(),p=previewPlace(r,b,[innerWidth,innerHeight]);preview.style.left=p.x+'px';preview.style.top=p.y+'px';};
   place();preview.querySelector('img').addEventListener('load',place);
  },2000);
 });
 bar.addEventListener('pointerout',e=>{const it=e.target.closest('.mrd-scene-item');if(it&&!it.contains(e.relatedTarget))hide();});
 bar.addEventListener('click',e=>{if(e.target.closest('.mrd-scene-item')){hide();bar.querySelector('details[data-menu=scenes]')?.removeAttribute('open');}},true);
 bar.addEventListener('toggle',e=>{if(!e.target.open)hide();},true);
 closeOnOutside(()=>bar);
 bar.addEventListener('click',e=>{const b=e.target.closest('[data-mrd-action]');if(!b)return;e.preventDefault();if(b.dataset.mrdAction==='assign')for(const d of bar.querySelectorAll('details[open]'))d.open=false;dispatch(b.dataset.mrdAction,b.dataset.mrdArg).catch(fail);});
 bar.addEventListener('change',e=>{
  if(e.target.matches('input[type=range]'))dispatch('level',e.target.value).catch(fail);
  if(e.target.dataset.mrdOption)dispatch('presentation',e.target.dataset.mrdOption+'~'+(e.target.type==='checkbox'?e.target.checked:e.target.value)).catch(fail);
 });
 applyPos=enableRightDrag(bar,{get:()=>game.settings.get(ID,'pos'),save:p=>game.settings.set(ID,'pos',p)});
}
const fail=e=>{console.error(`${ID} | director`,e);ui.notifications.error(`${L('Error')} ${e?.message??''}`.trim());};
export function setupDirector(){
 refresh();
 for(const h of ['canvasReady','updateScene','createScene','deleteScene','updatePlaylist','updatePlaylistSound','createPlaylist','mrDireccion.packRegistered','mrDireccion.packImported'])Hooks.on(h,refresh);
 // El volumen de lectura también se sincroniza cuando la escena arranca su música por enlace nativo.
 Hooks.on('updateScene',(scene,ch)=>{const cfg=sceneConfig(scene);if(ch.active&&cfg?.music&&activeGM()&&!scene.playlist&&!activating.has(scene.id))dispatch('music',scene.id).catch(fail);});
}
export const toggleBar=()=>game.settings.set(ID,'showBar',!game.settings.get(ID,'showBar'));
export {refresh as refreshDirector};
