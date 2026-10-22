import {ID,sceneConfig,saveSceneConfig,clearSceneConfig,globalSettings,saveGlobal,importPack,exportPack,configuredScenes} from './store.mjs';
import {normalizeSceneConfig,normalizeSettings,DEFAULT_MOTIFS} from './core/schema.mjs';
import {proposeConfig} from './core/autoconfig.mjs';
import {find,labelOf} from './refs.mjs';
import {playRef,playEffect} from './audio.mjs';
import {installExample} from './example.mjs';
import {E} from './core/ids.mjs';
import {L} from './ui.mjs';
const {ApplicationV2}=foundry.applications.api;
const getPath=(o,p)=>p.split('.').reduce((a,k)=>a?.[k],o);
const setPath=(o,p,v)=>{const ks=p.split('.'),last=ks.pop();ks.reduce((a,k)=>a[k],o)[last]=v;};
const dragData=e=>{try{return foundry.applications.ux.TextEditor.implementation.getDragEventData(e);}catch{try{return JSON.parse(e.dataTransfer.getData('text/plain'));}catch{return null;}}};
/** Convierte lo arrastrado en una ref según lo que acepta la zona. */
export function refFromDrop(data,accept){
 if(!data?.uuid&&!data?.src)return null;if(data.src)return {src:data.src};
 const t=data.type;
 if(accept==='sound'){if(t==='PlaylistSound')return {uuid:data.uuid};if(t==='Playlist'){const p=fromUuidSync(data.uuid);const s=p?.sounds?.contents[0];return s?{uuid:s.uuid}:null;}return null;}
 if(accept==='actor')return t==='Actor'?{uuid:data.uuid}:null;
 if(accept==='journal')return ['JournalEntry','JournalEntryPage'].includes(t)?{uuid:data.uuid}:null;
 if(accept==='handout')return ['JournalEntry','JournalEntryPage','Actor'].includes(t)?{uuid:data.uuid}:null;
 return null;
}
const KIND={sound:'sound',actor:'actor',journal:'journal',handout:'journal'};
export class DirectionEditor extends ApplicationV2{
 static DEFAULT_OPTIONS={id:'mr-direccion-editor',classes:['mrd-editor'],tag:'div',window:{title:'MRDIR.Ed.Title',icon:'fa-solid fa-pen-ruler',resizable:true},position:{width:1000,height:720}};
 constructor(options={}){
  const st=game.settings.get(ID,'editorState')??{};
  super(foundry.utils.mergeObject({position:{...(st.left!=null?{left:st.left,top:st.top}:{}),width:st.width??1000,height:st.height??720}},options));
  this.sceneId=options.sceneId??st.sceneId??null;this.tab=st.tab??'scene';this.filter='';
 }
 get scene(){return game.scenes.get(this.sceneId)??configuredScenes()[0]?.scene??game.scenes.contents[0]??null;}
 get cfg(){const s=this.scene;return s?sceneConfig(s)??normalizeSceneConfig({ref:{uuid:s.uuid}}):null;}
 async _prepareContext(){return {};}
 async _renderHTML(){return this.html();}
 _replaceHTML(result,content){content.innerHTML=result;this.bind(content);}
 async close(o){const p=this.position;await game.settings.set(ID,'editorState',{left:p.left,top:p.top,width:p.width,height:p.height,sceneId:this.sceneId,tab:this.tab});return super.close(o);}
 /* ---------- HTML ---------- */
 refField(path,accept,ref,{test=null}={}){
  const name=labelOf(ref,KIND[accept],this.scene),src=ref?.src??'';
  return `<div class="mrd-ref ${ref?'has':''}" data-drop="${path}" data-accept="${accept}"><span class="mrd-ref-name">${E(name||L('Ed.DropHere'))}</span>${accept==='sound'||accept==='handout'?`<input class="mrd-ref-src" data-path="${path}" data-src placeholder="${E(L('Ed.FilePath'))}" value="${E(src)}">`:''}${accept==='sound'||accept==='handout'?`<button type="button" data-act="pick" data-path="${path}" data-type="${accept==='sound'?'audio':'image'}" title="${E(L('Ed.Browse'))}"><i class="fa-solid fa-folder-open"></i></button>`:''}${test&&ref?`<button type="button" data-act="test" data-path="${path}" data-mode="${test}" title="${E(L('Ed.Test'))}"><i class="fa-solid fa-play"></i></button>`:''}${ref?`<button type="button" data-act="clear" data-path="${path}" title="${E(L('Ed.Clear'))}"><i class="fa-solid fa-xmark"></i></button>`:''}</div>`;
 }
 sceneTab(c,g){
  const others=configuredScenes().filter(x=>x.scene.id!==this.scene.id);
  return `<div class="mrd-cols">
  <fieldset><legend>${E(L('Ed.Reading'))}</legend>${this.refField('reading','journal',c.reading)}</fieldset>
  <fieldset><legend>${E(L('Ed.Music'))}</legend>${this.refField('music','sound',c.music,{test:'music'})}</fieldset>
  <fieldset><legend>${E(L('Ed.Motifs'))}</legend><p class="mrd-hint">${E(L('Ed.MotifsHint'))}</p><div class="mrd-checks">${g.motifs.length?g.motifs.map(m=>`<label><input type="checkbox" data-motif="${E(m.id)}" ${c.motifs===null||c.motifs.includes(m.id)?'checked':''}> ${E(m.label)}${m.music?'':' <em>('+E(L('Ed.NoMusic'))+')</em>'}</label>`).join(''):`<em>${E(L('Ed.NoMotifs'))}</em>`}</div></fieldset>
  <fieldset><legend>${E(L('Ed.Ambient'))}</legend><select data-path="ambient" data-null><option value="">—</option>${['light','dim','dark'].map(k=>`<option value="${k}" ${c.ambient===k?'selected':''}>${E(L('Amb_'+k))}</option>`).join('')}</select></fieldset>
  <fieldset class="wide"><legend>${E(L('Ed.Cues'))}</legend>${c.cues.map((q,i)=>`<div class="mrd-row"><input data-path="cues.${i}.label" placeholder="${E(L('Ed.Label'))}" value="${E(q.label)}"><input class="icon" data-path="cues.${i}.icon" title="Font Awesome" value="${E(q.icon)}">${this.refField(`cues.${i}.sound`,'sound',q.sound,{test:'fx'})}<button type="button" data-act="del" data-list="cues" data-i="${i}"><i class="fa-solid fa-trash"></i></button></div>`).join('')}<div class="mrd-dropzone" data-drop-add="cues" data-accept="sound">${E(L('Ed.DropSounds'))}</div></fieldset>
  <fieldset><legend>${E(L('Ed.Figures'))}</legend>${c.figures.map((f,i)=>`<div class="mrd-row"><input data-path="figures.${i}.label" placeholder="${E(L('Ed.Label'))}" value="${E(f.label)}">${this.refField(`figures.${i}.ref`,'actor',f.ref)}<button type="button" data-act="del" data-list="figures" data-i="${i}"><i class="fa-solid fa-trash"></i></button></div>`).join('')}<div class="mrd-dropzone" data-drop-add="figures" data-accept="actor">${E(L('Ed.DropActors'))}</div></fieldset>
  <fieldset><legend>${E(L('Ed.Handouts'))}</legend>${c.handouts.map((f,i)=>`<div class="mrd-row"><input data-path="handouts.${i}.label" placeholder="${E(L('Ed.Label'))}" value="${E(f.label)}">${this.refField(`handouts.${i}.ref`,'handout',f.ref)}<button type="button" data-act="del" data-list="handouts" data-i="${i}"><i class="fa-solid fa-trash"></i></button></div>`).join('')}<div class="mrd-dropzone" data-drop-add="handouts" data-accept="handout">${E(L('Ed.DropHandouts'))}</div></fieldset>
  <fieldset><legend>${E(L('Ed.Thumb'))}</legend><div class="mrd-row"><input data-path="thumb" value="${E(c.thumb)}" placeholder="${E(L('Ed.ThumbAuto'))}"><button type="button" data-act="pick" data-path="thumb" data-type="image"><i class="fa-solid fa-folder-open"></i></button></div></fieldset>
  <fieldset class="wide"><legend>${E(L('Ed.Notes'))}</legend><textarea data-path="notes" rows="3">${E(c.notes)}</textarea></fieldset>
  <fieldset class="wide mrd-tools"><legend>${E(L('Ed.Tools'))}</legend><button type="button" data-act="auto"><i class="fa-solid fa-wand-magic-sparkles"></i> ${E(L('Ed.Auto'))}</button> ${others.length?`<select class="copy-from">${others.map(x=>`<option value="${x.scene.id}">${E(x.scene.name)}</option>`).join('')}</select><button type="button" data-act="copy"><i class="fa-solid fa-copy"></i> ${E(L('Ed.Copy'))}</button>`:''} <button type="button" data-act="unconfig" class="danger"><i class="fa-solid fa-eraser"></i> ${E(L('Ed.Unconfig'))}</button></fieldset></div>`;
 }
 floorTab(c){
  const s=this.scene,src=s.background?.src,eye=c.stage.eye,W=s.width||1600,H=s.height||900;
  if(!src)return `<p>${E(L('Ed.NoBackground'))}</p>`;
  return `<p class="mrd-hint">${E(L('Ed.FloorHint'))}</p><div class="mrd-floor-bar"><label>${E(L('Ed.Eye'))} <input type="number" step=".01" min="0" max="1" data-path="stage.eye" data-num value="${eye}"></label><button type="button" data-act="clear-anchors"><i class="fa-solid fa-eraser"></i> ${E(L('Ed.ClearAnchors'))}</button></div>
  <div class="mrd-floor" style="aspect-ratio:${W}/${H}"><img src="${E(src)}" alt="" draggable="false"><div class="mrd-horizon" style="top:${eye*100}%"><span>${E(L('Ed.Horizon'))}</span></div>${c.stage.anchors.map(([x,y],i)=>`<div class="mrd-anchor" data-i="${i}" style="left:${x*100}%;top:${y*100}%"><div class="mrd-anchor-fig" style="height:${Math.max(0,(y-eye)*100)}cqh"></div><b>${i+1}</b></div>`).join('')}</div>`;
 }
 globalTab(g){
  const row=(kind,i,it,extra='')=>`<div class="mrd-row"><input data-gpath="${kind}.${i}.label" placeholder="${E(L('Ed.Label'))}" value="${E(it.label)}">${extra}<button type="button" data-act="gdel" data-list="${kind}" data-i="${i}"><i class="fa-solid fa-trash"></i></button></div>`;
  return `<div class="mrd-cols"><fieldset><legend>${E(L('Ed.Fade'))}</legend><label><input type="number" min="0.3" max="10" step=".5" data-gpath="fade" data-num value="${g.fade??3.5}"> s</label></fieldset>
  <fieldset class="wide"><legend>${E(L('Ed.GMotifs'))}</legend>${g.motifs.map((m,i)=>row('motifs',i,m,`<input class="icon" data-gpath="motifs.${i}.icon" value="${E(m.icon)}">${this.refField('g:motifs.'+i+'.music','sound',m.music,{test:'music'})}`)).join('')}<button type="button" data-act="gadd-motif"><i class="fa-solid fa-plus"></i> ${E(L('Ed.AddMotif'))}</button> <button type="button" data-act="gdefault-motifs">${E(L('Ed.DefaultMotifs'))}</button></fieldset>
  <fieldset class="wide"><legend>${E(L('Ed.GEffects'))}</legend>${g.effects.map((m,i)=>row('effects',i,m,`<input class="icon" data-gpath="effects.${i}.icon" value="${E(m.icon)}">${this.refField('g:effects.'+i+'.sound','sound',m.sound,{test:'fx'})}`)).join('')}<div class="mrd-dropzone" data-drop-add="g:effects" data-accept="sound">${E(L('Ed.DropSounds'))}</div></fieldset>
  <fieldset><legend>${E(L('Ed.Milestones'))}</legend>${g.markers.milestones.map((m,i)=>row('markers.milestones',i,m)).join('')}<button type="button" data-act="gadd-milestone"><i class="fa-solid fa-plus"></i> ${E(L('Ed.Add'))}</button></fieldset>
  <fieldset><legend>${E(L('Ed.Clocks'))}</legend>${g.markers.clocks.map((m,i)=>row('markers.clocks',i,m,`<input type="number" min="2" max="12" data-gpath="markers.clocks.${i}.segments" data-num value="${m.segments}" title="${E(L('Ed.Segments'))}">`)).join('')}<button type="button" data-act="gadd-clock"><i class="fa-solid fa-plus"></i> ${E(L('Ed.Add'))}</button></fieldset></div>`;
 }
 html(){
  const scenes=game.scenes.contents,cur=this.scene,cfgd=new Set(configuredScenes().map(x=>x.scene.id)),g=globalSettings();
  const list=scenes.filter(s=>s.name.toLowerCase().includes(this.filter.toLowerCase())).map(s=>`<button type="button" class="mrd-ed-item ${cur?.id===s.id?'is-current':''} ${cfgd.has(s.id)?'':'no-cfg'}" data-scene="${s.id}"><i class="fa-solid fa-${cfgd.has(s.id)?'circle-check':'circle'}" aria-hidden="true"></i> ${E(s.name)}</button>`).join('');
  const tabs=['scene','floor','global'].map(t=>`<button type="button" role="tab" class="${this.tab===t?'is-on':''}" data-tab="${t}" aria-selected="${this.tab===t}">${E(L('Ed.Tab_'+t))}</button>`).join('');
  let body='';
  if(this.tab==='global')body=this.globalTab(g);else if(!cur)body=`<p>${E(L('Ed.NoScenes'))}</p>`;else body=this.tab==='floor'?this.floorTab(this.cfg):this.sceneTab(this.cfg,g);
  return `<div class="mrd-ed"><nav class="mrd-ed-list" aria-label="${E(L('Ed.Scenes'))}"><input type="search" class="mrd-filter" placeholder="${E(L('Ed.Filter'))}" value="${E(this.filter)}"><div class="mrd-ed-items">${list}</div><div class="mrd-ed-actions"><button type="button" data-act="import"><i class="fa-solid fa-file-import"></i> ${E(L('Ed.Import'))}</button><button type="button" data-act="export"><i class="fa-solid fa-file-export"></i> ${E(L('Ed.Export'))}</button><button type="button" data-act="example"><i class="fa-solid fa-flask"></i> ${E(L('Ed.Example'))}</button><button type="button" data-act="tutorial"><i class="fa-solid fa-graduation-cap"></i> ${E(L('Tutorial'))}</button><input type="file" accept="application/json,.json" hidden class="mrd-file"></div></nav><section class="mrd-ed-main"><header><h2>${E(this.tab==='global'?L('Ed.Tab_global'):cur?.name??'')}</h2><div role="tablist" class="mrd-tabs">${tabs}</div></header><div class="mrd-ed-body">${body}</div></section></div>`;
 }
 /* ---------- eventos ---------- */
 async commit(mut,{rerender=true}={}){
  const s=this.scene;if(!s)return;const c=structuredClone(this.cfg);mut(c);await saveSceneConfig(s,normalizeSceneConfig(c));if(rerender)this.render();
 }
 async commitGlobal(mut,{rerender=true}={}){const g=structuredClone(globalSettings());mut(g);await saveGlobal(g);if(rerender)this.render();}
 bind(root){
  root.querySelector('.mrd-filter')?.addEventListener('input',e=>{this.filter=e.target.value;const pos=e.target.selectionStart;this.render().then(()=>{const i=this.element.querySelector('.mrd-filter');i?.focus();i?.setSelectionRange(pos,pos);});});
  root.addEventListener('click',e=>this.onClick(e));
  root.addEventListener('change',e=>this.onChange(e));
  root.addEventListener('dragover',e=>{if(e.target.closest('[data-drop],[data-drop-add]')){e.preventDefault();e.target.closest('[data-drop],[data-drop-add]').classList.add('over');}});
  root.addEventListener('dragleave',e=>e.target.closest?.('[data-drop],[data-drop-add]')?.classList.remove('over'));
  root.addEventListener('drop',e=>this.onDrop(e));
  this.bindFloor(root.querySelector('.mrd-floor'));
 }
 async onDrop(e){
  const z=e.target.closest('[data-drop],[data-drop-add]');if(!z)return;e.preventDefault();z.classList.remove('over');
  const ref=refFromDrop(dragData(e),z.dataset.accept);if(!ref)return ui.notifications.warn(L('Ed.BadDrop'));
  if(z.dataset.dropAdd){const k=z.dataset.dropAdd;
   if(k==='g:effects')return this.commitGlobal(g=>g.effects.push({id:'e'+Date.now().toString(36),label:'',icon:'wave-square',sound:ref}));
   return this.commit(c=>c[k].push(k==='cues'?{label:'',icon:'wave-square',sound:ref}:{ref,label:''}));}
  const p=z.dataset.drop;if(p.startsWith('g:'))return this.commitGlobal(g=>setPath(g,p.slice(2),ref));
  return this.commit(c=>setPath(c,p,ref));
 }
 async onChange(e){
  const t=e.target;
  if(t.matches('[data-motif]'))return this.commit(c=>{const all=globalSettings().motifs.map(m=>m.id),on=new Set(c.motifs??all);t.checked?on.add(t.dataset.motif):on.delete(t.dataset.motif);c.motifs=all.every(x=>on.has(x))?null:[...on];},{rerender:false});
  if(t.matches('[data-gpath]')){const v=t.dataset.num!==undefined?Number(t.value):t.value;return this.commitGlobal(g=>setPath(g,t.dataset.gpath,v),{rerender:false});}
  if(t.matches('[data-path]')){
   const p=t.dataset.path;
   if(t.dataset.src!==undefined)return this.commit(c=>setPath(c,p,t.value.trim()?{src:t.value.trim()}:null));
   const v=t.dataset.num!==undefined?Number(t.value):(t.dataset.null!==undefined&&!t.value?null:t.value);
   return this.commit(c=>setPath(c,p,v),{rerender:t.dataset.path.startsWith('stage')});
  }
 }
 async onClick(e){
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.scene){this.sceneId=b.dataset.scene;return this.render();}
  if(b.dataset.tab){this.tab=b.dataset.tab;return this.render();}
  const a=b.dataset.act;if(!a)return;
  const refAt=p=>p.startsWith('g:')?getPath(globalSettings(),p.slice(2)):getPath(this.cfg,p);
  switch(a){
   case 'clear':{const p=b.dataset.path;return p.startsWith('g:')?this.commitGlobal(g=>setPath(g,p.slice(2),null)):this.commit(c=>setPath(c,p,null));}
   case 'del':return this.commit(c=>c[b.dataset.list].splice(Number(b.dataset.i),1));
   case 'gdel':return this.commitGlobal(g=>getPath(g,b.dataset.list).splice(Number(b.dataset.i),1));
   case 'pick':{const p=b.dataset.path;const fp=new foundry.applications.apps.FilePicker.implementation({type:b.dataset.type,callback:path=>p==='thumb'?this.commit(c=>{c.thumb=path;}):p.startsWith('g:')?this.commitGlobal(g=>setPath(g,p.slice(2),{src:path})):this.commit(c=>setPath(c,p,{src:path}))});return fp.render(true);}
   case 'test':{const r=refAt(b.dataset.path);return b.dataset.mode==='fx'?playEffect(r,this.scene):playRef(r,this.scene);}
   case 'auto':return this.autoconfigure();
   case 'copy':{const src=sceneConfig(game.scenes.get(this.element.querySelector('.copy-from').value));if(!src)return;return this.commit(c=>{Object.assign(c,structuredClone({...src,ref:c.ref,thumb:c.thumb,name:c.name}));});}
   case 'unconfig':await clearSceneConfig(this.scene);return this.render();
   case 'clear-anchors':return this.commit(c=>{c.stage.anchors=[];});
   case 'gadd-motif':return this.commitGlobal(g=>g.motifs.push({id:'m'+Date.now().toString(36),label:L('Ed.NewMotif'),icon:'music',music:null}));
   case 'gdefault-motifs':return this.commitGlobal(g=>{const have=new Set(g.motifs.map(m=>m.id));for(const [id,es,en,icon] of DEFAULT_MOTIFS)if(!have.has(id))g.motifs.push({id,label:game.i18n.lang==='es'?es:en,icon,music:null});});
   case 'gadd-milestone':return this.commitGlobal(g=>g.markers.milestones.push({id:'h'+Date.now().toString(36),label:L('Ed.NewMilestone')}));
   case 'gadd-clock':return this.commitGlobal(g=>g.markers.clocks.push({id:'r'+Date.now().toString(36),label:L('Ed.NewClock'),segments:6}));
   case 'import':return this.element.querySelector('.mrd-file').click();
   case 'export':{const p=exportPack();return foundry.utils.saveDataToFile(JSON.stringify(p,null,1),'application/json',`mr-direccion-${game.world.id}.json`);}
   case 'example':{const r=await installExample();ui.notifications.info(L('Ed.ExampleDone',{n:r.done.length}));this.sceneId=game.scenes.find(s=>s.getFlag(ID,'example')==='camino')?.id??this.sceneId;return this.render();}
   case 'tutorial':return game.modules.get(ID).api.startTutorial();
  }
 }
 async autoconfigure(){
  const s=this.scene,tokenActorIds=s.tokens.contents.map(t=>t.actorId).filter(Boolean);
  const prop=proposeConfig({sceneName:s.name,tokenActorIds,
   playlists:game.playlists.contents.map(p=>({name:p.name,sounds:p.sounds.contents.map(x=>({name:x.name,uuid:x.uuid}))})),
   journals:game.journal.contents.map(j=>({name:j.name,uuid:j.uuid,pages:j.pages.contents.map(p=>({name:p.name,uuid:p.uuid}))})),
   actors:game.actors.contents.map(a=>({id:a.id,name:a.name,uuid:a.uuid}))});
  await this.commit(c=>{if(!c.music&&prop.music)c.music=prop.music;if(!c.reading&&prop.reading)c.reading=prop.reading;if(!c.figures.length)c.figures=prop.figures;});
  ui.notifications.info(L('Ed.AutoDone',{m:prop.found.music?'✓':'✗',r:prop.found.reading?'✓':'✗',f:prop.found.figures}));
 }
 bindFloor(floor){
  if(!floor)return;let drag=null;
  const frac=e=>{const r=floor.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))];};
  floor.addEventListener('pointerdown',e=>{
   if(e.button===2){const a=e.target.closest('.mrd-anchor');if(a){e.preventDefault();this.commit(c=>c.stage.anchors.splice(Number(a.dataset.i),1));}return;}
   if(e.button!==0)return;
   const a=e.target.closest('.mrd-anchor'),h=e.target.closest('.mrd-horizon');
   if(a)drag={kind:'a',i:Number(a.dataset.i),el:a};else if(h)drag={kind:'h',el:h};else{const [x,y]=frac(e);return void this.commit(c=>c.stage.anchors.push([+x.toFixed(3),+y.toFixed(3)]));}
   try{floor.setPointerCapture(e.pointerId);}catch{}e.preventDefault();
  });
  floor.addEventListener('contextmenu',e=>e.preventDefault());
  floor.addEventListener('pointermove',e=>{if(!drag)return;const [x,y]=frac(e);drag.v=[+x.toFixed(3),+y.toFixed(3)];if(drag.kind==='a'){drag.el.style.left=x*100+'%';drag.el.style.top=y*100+'%';}else drag.el.style.top=y*100+'%';});
  floor.addEventListener('pointerup',()=>{const d=drag;drag=null;if(!d?.v)return;this.commit(c=>{if(d.kind==='a')c.stage.anchors[d.i]=d.v;else c.stage.eye=d.v[1];});});
 }
 async importFile(file){
  try{const r=await importPack(await file.text());ui.notifications.info(L('Ed.Imported',{n:r.done.length,m:r.missing.length}));if(r.missing.length)console.warn(`${ID} | escenas sin encontrar`,r.missing);this.render();}
  catch(err){ui.notifications.error(L('Ed.ImportError',{e:err.message}));}
 }
 _onRender(ctx,o){super._onRender?.(ctx,o);this.element.querySelector('.mrd-file')?.addEventListener('change',e=>{const f=e.target.files[0];if(f)this.importFile(f);});}
}
let instance=null;
export function openEditor(sceneId){
 if(!game.user.isGM)return null;
 if(instance?.rendered){if(sceneId){instance.sceneId=sceneId;instance.render();}instance.bringToFront?.();return instance;}
 instance=new DirectionEditor(sceneId?{sceneId}:{});instance.render({force:true});return instance;
}
export class EditorMenu extends ApplicationV2{
 static DEFAULT_OPTIONS={id:'mr-direccion-menu',window:{title:'MRDIR.Ed.Title'},position:{width:10,height:10}};
 async render(){openEditor();return this;}
}
