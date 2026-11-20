/** Pestaña «Perspectiva» del editor: un selector de MÉTODO de calibración (cada uno con su explicación y sus pasos), las herramientas de ese método
 *  sobre la imagen y una parte común a todos (resultado, ajuste fino, silueta de prueba, puntos de colocación y planos elevados).
 *  Se mezcla en DirectionEditor (Object.assign sobre su prototipo): `this` es el editor. */
import {ID} from './store.mjs';
import {METHODS,stageMethod,effectiveStage,personHeight,syncPlanes,calibrate,calibrateFloor,defaultFloorQuad,defaultSilhouettes,eyeFromRef,figureOptions} from './core/perspective.mjs';
import {E} from './core/ids.mjs';
import {L} from './ui.mjs';
const ICON={floor:'border-all',exit:'road',people:'people-arrows',ref:'door-closed',manual:'sliders',none:'map'};
const SIL='<svg viewBox="0 0 40 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><circle cx="20" cy="8" r="7"/><path d="M12 17h16l5 30-4 2-3-18v22l3 30h-7l-3-28-3 28h-7l3-30V31l-3 18-4-2z"/></svg>';
const pct=v=>+(v*100).toFixed(2);
const clamp01=v=>Math.min(1,Math.max(0,v));
export const PerspectiveTab={
 aspect(){const s=this.scene;return (s.width||16)/(s.height||9);},
 px(){return figureOptions(game.settings.get(ID,'figures')).tokenPixels;},
 /** Escena resuelta con el borrador de lo que aún se arrastra (this.live) para el resultado, la silueta de prueba y las líneas. */
 liveStage(){const st=this.cfg.stage,l=this.live&&!this.live.error?this.live:null;return effectiveStage(l?{...st,...l}:st,this.aspect());},
 /** Guarda cambios de la perspectiva y recalcula los planos elevados con el horizonte resultante. */
 stageCommit(mut){const a=this.aspect(),px=this.px();this.live=null;return this.commit(c=>{mut(c.stage);c.stage.mode=c.stage.method==='none'?'none':c.stage.method==='exit'?'vanishing':'horizon';c.stage.planes=syncPlanes(c.stage,a,px);});},
 /** Borradores de cada método al entrar en él (sin tocarlos no cambian nada: parten de la perspectiva actual). */
 perspInit(){
  const s=this.scene,st=this.cfg.stage,m=stageMethod(st),cur=effectiveStage(st,this.aspect()),eye=cur?.eye??st.eye,k=cur?.k??1,kp=this.px()/360;
  this.pScene=s.id;this.pMethod=m;this.live=null;this.planeSel=null;this.pq=null;
  if(m==='floor'){
   let q=st.floor?.quad,w=st.floor?.widthM;
   if(!q){q=defaultFloorQuad(eye);const r=calibrateFloor(q,1,{aspect:this.aspect()});w=r.error?2:+Math.max(.05,(1.75/(k*kp))/r.hc).toFixed(2);}
   this.fq={quad:structuredClone(q),widthM:w};
  }
  if(m==='people')this.sil=structuredClone(st.people??defaultSilhouettes(eye,k,this.px()));
  this.refDraw=(m==='exit'||m==='ref')&&!st.ref;
 },
 floorTab(c){
  const s=this.scene,st=c.stage,m=stageMethod(st),src=s.background?.src,W=s.width||1600,H=s.height||900;
  if(this.pScene!==s.id||this.pMethod!==m)this.perspInit();
  const card=x=>`<button type="button" role="radio" aria-checked="${m===x}" class="mrd-method ${m===x?'is-on':''}" data-act="p-method" data-m="${x}" title="${E(L('Ed.M_'+x+'_for'))}"><i class="fa-solid fa-${ICON[x]}" aria-hidden="true"></i><b>${E(L('Ed.M_'+x))}</b>${x==='floor'?`<small>${E(L('Ed.Recommended'))}</small>`:''}</button>`;
  const picker=`<div class="mrd-methods" role="radiogroup" aria-label="${E(L('Ed.Method'))}">${METHODS.map(card).join('')}</div>`;
  const steps=L('Ed.M_'+m+'_how').split('|');
  const how=`<details class="mrd-how" ${this.howClosed?'':'open'}><summary><b>${E(L('Ed.M_'+m))}</b> · ${E(L('Ed.M_'+m+'_for'))} <span>${E(L('Ed.HowTo'))}</span></summary><ol>${steps.map(t=>`<li>${E(t)}</li>`).join('')}</ol></details>`;
  if(m==='none')return `<div class="mrd-persp">${picker}${how}</div>`;
  if(!src)return `<div class="mrd-persp">${picker}${how}<p>${E(L('Ed.NoBackground'))}</p></div>`;
  return `<div class="mrd-persp">${picker}${how}<div class="mrd-floor-bar">${this.methodTools(m,st)}<p class="mrd-calib-note" role="status"></p></div>
   <div class="mrd-floor ${this.refDraw?'is-drawing':''}" style="aspect-ratio:${W}/${H}"><img src="${E(src)}" alt="" draggable="false">${this.overlays(m,st)}<div class="mrd-sil is-ghost" hidden>${SIL}</div></div>
   ${this.commonTools(st)}</div>`;
 },
 /** Controles propios del método elegido. */
 methodTools(m,st){
  const num=(key,path,v,attrs)=>`<label>${E(L(key))} <input type="number" ${attrs} data-ppath="${path}" value="${v}"></label>`;
  const btn=(act,icon,key,on)=>`<button type="button" data-act="${act}" ${on!==undefined?`class="${on?'is-on':''}" aria-pressed="${!!on}"`:''}><i class="fa-solid fa-${icon}" aria-hidden="true"></i> ${E(L(key))}</button>`;
  switch(m){
   case 'floor':return `<label>${E(L('Ed.FqWidth'))} <input type="number" step=".05" min=".05" max="200" data-fw value="${this.fq.widthM}"> m</label>${btn('p-reset','rotate-left','Ed.Reset')}`;
   case 'exit':return num('Ed.ExitHeight','refM',st.refM,'step=".05" min=".3" max="50"')+' m '+btn('p-draw','vector-square',st.ref?'Ed.Redraw':'Ed.ExitDraw',this.refDraw);
   case 'people':return btn('p-reset','rotate-left','Ed.Reset');
   case 'ref':return num('Ed.RefHeight','refM',st.refM,'step=".05" min=".3" max="50"')+' m '+btn('p-draw','vector-square',st.ref?'Ed.Redraw':'Ed.RefDraw',this.refDraw)+(st.ref?btn('p-ref-eye','eye','Ed.RefEye'):'')+num('Ed.Eye','eye',st.eye,'step=".01" min="-3" max="1.5"');
   case 'manual':return num('Ed.Eye','eye',st.eye,'step=".01" min="-3" max="1.5"')+num('Ed.Scale','k',st.k>0?st.k:1,'step=".05" min=".05" max="20"');
  }
  return '';
 },
 /** Lo que se dibuja sobre la imagen: líneas y asas del método, planos elevados y puntos de colocación. */
 overlays(m,st){
  const cur=effectiveStage(st,this.aspect()),eye=cur?.eye??st.eye,fixed=m==='floor'||m==='people';let h='';
  h+=`<svg class="mrd-rays" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${this.raysSvg(m,cur)}</svg>`;
  if(m==='exit'){if(cur)h+=`<div class="mrd-vp ${st.ref?'is-derived':''}" style="left:${cur.vp[0]*100}%;top:${cur.vp[1]*100}%"><span>${E(L('Ed.VP'))}</span></div>`;}
  else h+=`<div class="mrd-horizon ${fixed?'is-fixed':''}" style="top:${eye*100}%"><span>${E(L('Ed.Horizon'))}</span></div>`;
  if((m==='exit'||m==='ref')&&st.ref){const r=st.ref;h+=`<div class="mrd-ref-box" style="left:${r[0]*100}%;top:${r[1]*100}%;width:${(r[2]-r[0])*100}%;height:${(r[3]-r[1])*100}%"><em>${E(L(m==='exit'?'Ed.ExitLabel':'Ed.RefLabel',{m:st.refM}))}</em><span class="mrd-ref-h" data-corner="0"></span><span class="mrd-ref-h" data-corner="1"></span></div>`;}
  h+=`<svg class="mrd-fq-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${this.quadSvg(m,st,eye)}</svg>`;
  const q=this.planeSel!=null?this.pq?.quad:m==='floor'?this.fq?.quad:null;
  if(q)h+=q.map((p,i)=>`<span class="mrd-fq-h ${this.planeSel!=null?'is-plane':''}" data-c="${i}" style="left:${p[0]*100}%;top:${p[1]*100}%"><i>${i+1}</i></span>`).join('');
  if(m==='people'&&this.planeSel==null)h+=this.sil.map((s,i)=>`<div class="mrd-sil ${i?'is-near':'is-far'}" data-i="${i}" style="left:${s.x*100}%;top:${(s.y-s.h)*100}%;height:${s.h*100}%">${SIL}<span class="mrd-sil-head" aria-label="${E(L('Ed.CalibHead'))}"></span><b>${i+1}</b></div>`).join('');
  h+=st.anchors.map(([x,y],i)=>`<div class="mrd-anchor" data-i="${i}" style="left:${x*100}%;top:${y*100}%"><div class="mrd-anchor-fig" style="height:${Math.min(.95,personHeight(cur,x,y,this.px()))*100}cqh"></div><b>${i+1}</b></div>`).join('');
  return h;
 },
 /** Líneas guía: en «pasillo», de cada esquina de la imagen a la del rectángulo de salida y su prolongación hasta el punto de fuga. */
 raysSvg(m,cur){
  if(m!=='exit'||!cur?.vp)return '';
  const ln=(x1,y1,x2,y2,c='')=>`<line${c?` class="${c}"`:''} x1="${pct(x1)}" y1="${pct(y1)}" x2="${pct(x2)}" y2="${pct(y2)}"/>`,vp=cur.vp,r=cur.ref;
  let g=ln(0,vp[1],1,vp[1],'h');
  if(r){const [x0,y0,x1,y1]=r,w=x1-x0,h=y1-y0;
   for(const u of [.25,.5,.75])g+=ln(u,1,x0+u*w,y1,'g')+ln(u,0,x0+u*w,y0,'g')+ln(0,u,x0,y0+u*h,'g')+ln(1,u,x1,y0+u*h,'g');
   g+=ln(0,0,x0,y0,'c')+ln(1,0,x1,y0,'c')+ln(0,1,x0,y1,'c')+ln(1,1,x1,y1,'c');
   for(const [cx,cy] of [[x0,y0],[x1,y0],[x0,y1],[x1,y1]])g+=ln(cx,cy,vp[0],vp[1],'x');
  }else g+=[0,.2,.4,.6,.8,1].map(x=>ln(vp[0],vp[1],x,1)).join('');
  return g;
 },
 /** Rectángulo de suelo (método «suelo») y planos elevados; el que se edita, resaltado y con sus lados prolongados hasta el horizonte. */
 quadSvg(m,st,eye){
  const pts=q=>q.map(p=>pct(p[0])+','+pct(p[1])).join(' '),shapes=[];
  if(m==='floor'&&this.fq)shapes.push([this.fq.quad,this.planeSel==null,false]);
  st.planes.forEach((p,i)=>shapes.push([this.planeSel===i&&this.pq?this.pq.quad:p.quad,this.planeSel===i,true]));
  let g=shapes.map(([q,on,pl])=>`<polygon class="${on?'on':''} ${pl?'plane':''}" points="${pts(q)}"/>`).join('');
  const sel=shapes.find(x=>x[1])?.[0];
  if(sel){const [A,B,C,D]=sel;for(const [P,Q] of [[A,D],[B,C]])if(eye<P[1]-.005&&Q[1]>P[1])g+=`<line x1="${pct(Q[0])}" y1="${pct(Q[1])}" x2="${pct(P[0]+(P[0]-Q[0])*(P[1]-eye)/(Q[1]-P[1]))}" y2="${pct(eye)}"/>`;}
  return g;
 },
 /** Parte común: ajuste fino, puntos de colocación y planos elevados. */
 commonTools(st){
  const cur=effectiveStage(st,this.aspect()),fine=Math.round((st.fine??1)*100);
  const chips=st.planes.map((p,i)=>`<button type="button" data-act="p-plane" data-i="${i}" class="${this.planeSel===i?'is-on':''}" aria-pressed="${this.planeSel===i}">${E(L('Ed.FqPlane',{n:i+1}))}</button>`).join('');
  const planeCtl=this.planeSel!=null?`<label>${E(L('Ed.FqWidth'))} <input type="number" step=".05" min=".05" max="200" data-pw value="${this.pq.widthM}"> m</label><button type="button" data-act="p-plane-del" class="danger"><i class="fa-solid fa-trash" aria-hidden="true"></i> ${E(L('Ed.FqDel'))}</button><button type="button" data-act="p-plane" data-i="${this.planeSel}"><i class="fa-solid fa-check" aria-hidden="true"></i> ${E(L('Ed.Done'))}</button>`:'';
  return `<div class="mrd-common">
   <div class="mrd-floor-bar"><label title="${E(L('Ed.FineTip'))}">${E(L('Ed.Fine'))} <input type="range" min="50" max="200" step="5" data-fine value="${fine}"> <output>${fine} %</output></label>
    <span class="mrd-sep" aria-hidden="true"></span><span title="${E(L('Ed.AnchorsTip'))}">${E(L('Ed.Anchors',{n:st.anchors.length}))}</span>${st.anchors.length?`<button type="button" data-act="clear-anchors"><i class="fa-solid fa-eraser" aria-hidden="true"></i> ${E(L('Ed.ClearAnchors'))}</button>`:''}</div>
   <div class="mrd-floor-bar"><b title="${E(L('Ed.PlanesTip'))}">${E(L('Ed.Planes'))}</b>${chips}${st.planes.length<8&&this.planeSel==null?`<button type="button" data-act="p-plane-add" ${cur?'':`disabled title="${E(L('Ed.PlanesNeed'))}"`}><i class="fa-solid fa-plus" aria-hidden="true"></i> ${E(L('Ed.FqAdd'))}</button>`:''}${planeCtl}</div>
   <p class="mrd-hint">${E(L(this.planeSel!=null?'Ed.PlaneEditing':'Ed.CommonHint'))}</p></div>`;
 },
 /** Recalcula el borrador del método (o del plano en edición) y refresca resultado, horizonte, líneas y asas sin rehacer la ventana. */
 perspLive(floor){
  if(!floor)return;
  const st=this.cfg.stage,m=stageMethod(st),a=this.aspect(),px=this.px();
  let r=null;
  if(this.planeSel!=null){const cur=effectiveStage(st,a);r=cur?calibrateFloor(this.pq.quad,this.pq.widthM,{aspect:a,pixels:px,eye:cur.eye}):{error:'count'};this.planeLive=r;}
  else if(m==='floor'){r=calibrateFloor(this.fq.quad,this.fq.widthM,{aspect:a,pixels:px});this.live=r.error?r:{eye:r.eye,k:r.k};}
  else if(m==='people'){r=calibrate(this.sil.map(v=>({y:v.y,h:v.h*(this.scene.height||900)})),this.scene.height||900,px);this.live=r.error?r:{eye:r.eye,k:r.k};}
  const cur=this.liveStage(),note=floor.parentElement.querySelector('.mrd-calib-note');
  if(note){
   const bad=r?.error;
   let t=bad?L((m==='people'&&this.planeSel==null?'CalErr_':'FloorErr_')+bad):!cur?L('Ed.ResNone'):this.planeSel!=null?L('Ed.FqLivePlane',{k:r.k,hc:r.hc}):L('Ed.Res',{eye:cur.eye.toFixed(2),k:+cur.k.toFixed(3),p:Math.round(personHeight(cur,.5,1,px)*100)})+(r?.hc?' '+L('Ed.ResCam',{hc:r.hc}):'');
   if(cur&&!bad&&this.planeSel==null&&(cur.eye<0||cur.eye>1))t+=' '+L('Ed.CalibOff');
   note.textContent=t;note.classList.toggle('is-bad',!!bad);
  }
  const eye=cur?.eye??st.eye,hz=floor.querySelector('.mrd-horizon');if(hz)hz.style.top=eye*100+'%';
  const vp=floor.querySelector('.mrd-vp');if(vp&&cur?.vp){vp.style.left=cur.vp[0]*100+'%';vp.style.top=cur.vp[1]*100+'%';}
  const rays=floor.querySelector('.mrd-rays');if(rays)rays.innerHTML=this.raysSvg(m,cur);
  const fq=floor.querySelector('.mrd-fq-svg');if(fq)fq.innerHTML=this.quadSvg(m,st,eye);
  const q=this.planeSel!=null?this.pq.quad:this.fq?.quad;
  if(q)for(const h of floor.querySelectorAll('.mrd-fq-h')){const p=q[h.dataset.c];h.style.left=p[0]*100+'%';h.style.top=p[1]*100+'%';}
  for(const el of floor.querySelectorAll('.mrd-anchor')){const [x,y]=st.anchors[el.dataset.i]??[];const f=el.querySelector('.mrd-anchor-fig');if(f&&Number.isFinite(y))f.style.height=Math.min(.95,personHeight(cur,x,y,px))*100+'cqh';}
  return r;
 },
 /** Guarda lo que se acaba de soltar en el método (o en el plano en edición). */
 async perspSave(){
  const st=this.cfg.stage,m=stageMethod(st);
  if(this.planeSel!=null){const r=this.planeLive;if(!r||r.error)return;const i=this.planeSel,pq=structuredClone(this.pq);return this.stageCommit(s=>{Object.assign(s.planes[i],{quad:pq.quad,widthM:pq.widthM});});}
  const l=this.live;if(!l||l.error)return;
  if(m==='floor'){const fq=structuredClone(this.fq);return this.stageCommit(s=>{s.eye=l.eye;s.k=l.k;s.floor=fq;});}
  if(m==='people'){const sil=structuredClone(this.sil);return this.stageCommit(s=>{s.eye=l.eye;s.k=l.k;s.people=sil;});}
 },
 async perspAction(a,b){
  const st=this.cfg.stage;
  switch(a){
   case 'p-method':{const m=b.dataset.m;this.pMethod=null;return this.stageCommit(s=>{s.method=m;});}
   case 'p-reset':{const m=stageMethod(st);this.pMethod=null;return this.stageCommit(s=>{if(m==='floor')s.floor=null;if(m==='people')s.people=null;});}
   case 'p-draw':this.refDraw=!this.refDraw;return this.render();
   case 'p-ref-eye':return this.stageCommit(s=>{s.eye=+eyeFromRef(s.ref,s.refM).toFixed(3);});
   case 'p-plane':{const i=Number(b.dataset.i);if(this.planeSel===i){this.planeSel=null;this.pq=null;}else{this.planeSel=i;this.pq=structuredClone({quad:st.planes[i].quad,widthM:st.planes[i].widthM});}this.planeLive=null;return this.render();}
   case 'p-plane-add':{const cur=effectiveStage(st,this.aspect());if(!cur)return;const quad=defaultFloorQuad(cur.eye,{near:.78,spread:.14,cx:.72,depth:.4}),i=st.planes.length;
    await this.stageCommit(s=>{s.planes.push({quad,widthM:1,k:null});});this.planeSel=i;this.pq={quad:structuredClone(quad),widthM:1};return this.render();}
   case 'p-plane-del':{const i=this.planeSel;this.planeSel=null;this.pq=null;return this.stageCommit(s=>{s.planes.splice(i,1);});}
  }
 },
 /** Cambios de los campos de la pestaña: devuelve true si los ha atendido. */
 perspChange(t){
  if(t.matches('[data-fw]')){this.fq.widthM=Math.max(.05,Math.min(200,Number(t.value)||2));this.perspLive(this.element.querySelector('.mrd-floor'));this.perspSave();return true;}
  if(t.matches('[data-pw]')){this.pq.widthM=Math.max(.05,Math.min(200,Number(t.value)||1));this.perspLive(this.element.querySelector('.mrd-floor'));this.perspSave();return true;}
  if(t.matches('[data-fine]')){const v=Number(t.value)/100;this.stageCommit(s=>{s.fine=v;});return true;}
  if(t.matches('[data-ppath]')){const p=t.dataset.ppath,v=Number(t.value);if(Number.isFinite(v))this.stageCommit(s=>{s[p]=v;});return true;}
  if(t.closest('.mrd-how'))return true;
  return false;
 },
 bindFloor(root){
  const persp=root.querySelector('.mrd-persp');if(!persp)return;
  persp.querySelector('.mrd-how')?.addEventListener('toggle',e=>{this.howClosed=!e.target.open;});
  const fine=persp.querySelector('[data-fine]');fine?.addEventListener('input',()=>{fine.nextElementSibling.textContent=fine.value+' %';});
  const floor=persp.querySelector('.mrd-floor');if(!floor)return;
  let drag=null;
  const frac=e=>{const r=floor.getBoundingClientRect();return [clamp01((e.clientX-r.left)/r.width),clamp01((e.clientY-r.top)/r.height)];};
  const m=()=>stageMethod(this.cfg.stage);
  floor.addEventListener('contextmenu',e=>e.preventDefault());
  floor.addEventListener('pointerdown',e=>{
   if(e.button===2){const a=e.target.closest('.mrd-anchor');if(a){e.preventDefault();this.stageCommit(s=>{s.anchors.splice(Number(a.dataset.i),1);});}return;}
   if(e.button!==0)return;
   const [x,y]=frac(e),t=e.target;
   const qh=t.closest('.mrd-fq-h'),sil=t.closest('.mrd-sil:not(.is-ghost)'),rh=t.closest('.mrd-ref-h'),hz=t.closest('.mrd-horizon:not(.is-fixed)'),vp=t.closest('.mrd-vp:not(.is-derived)'),an=t.closest('.mrd-anchor');
   if(qh)drag={kind:'q',c:Number(qh.dataset.c)};
   else if(sil){const i=Number(sil.dataset.i),s=this.sil[i];drag={kind:t.closest('.mrd-sil-head')?'sh':'sf',i,dx:x-s.x,dy:y-s.y};}
   else if(rh)drag={kind:'r',corner:Number(rh.dataset.corner)};
   else if(hz)drag={kind:'h'};
   else if(vp)drag={kind:'v'};
   else if(an)drag={kind:'a',i:Number(an.dataset.i),el:an};
   else if(this.refDraw&&(m()==='exit'||m()==='ref'))drag={kind:'rn',o:[x,y]};
   else if(this.planeSel==null)return void this.stageCommit(s=>{s.anchors.push([+x.toFixed(3),+y.toFixed(3)]);});
   else return;
   try{floor.setPointerCapture(e.pointerId);}catch{}e.preventDefault();
  });
  const box=()=>{let b=floor.querySelector('.mrd-ref-box');if(!b){b=document.createElement('div');b.className='mrd-ref-box is-new';floor.append(b);}return b;};
  floor.addEventListener('pointermove',e=>{
   const [x,y]=frac(e);
   if(!drag){this.ghostAt(floor,x,y);return;}
   drag.moved=true;const st=this.cfg.stage;
   switch(drag.kind){
    case 'q':{const q=this.planeSel!=null?this.pq.quad:this.fq.quad;q[drag.c]=[+x.toFixed(4),+y.toFixed(4)];break;}
    case 'sf':case 'sh':{const s=this.sil[drag.i];
     if(drag.kind==='sh')s.h=Math.max(.02,Math.min(s.y-.01,s.y-y));else{s.x=clamp01(x-drag.dx);s.y=Math.min(1,Math.max(s.h+.01,y-drag.dy));}
     Object.assign(floor.querySelector(`.mrd-sil[data-i="${drag.i}"]`).style,{left:s.x*100+'%',top:(s.y-s.h)*100+'%',height:s.h*100+'%'});break;}
    case 'r':case 'rn':{const r=st.ref,o=drag.kind==='rn'?drag.o:(drag.corner===0?[r[2],r[3]]:[r[0],r[1]]);
     drag.ref=[Math.min(o[0],x),Math.min(o[1],y),Math.max(o[0],x),Math.max(o[1],y)].map(n=>+n.toFixed(4));
     Object.assign(box().style,{left:drag.ref[0]*100+'%',top:drag.ref[1]*100+'%',width:(drag.ref[2]-drag.ref[0])*100+'%',height:(drag.ref[3]-drag.ref[1])*100+'%'});
     if(drag.ref[2]-drag.ref[0]>.01&&drag.ref[3]-drag.ref[1]>.01)this.live={ref:drag.ref};break;}
    case 'h':drag.y=+y.toFixed(4);this.live={eye:drag.y};break;
    case 'v':drag.v=[+x.toFixed(4),+y.toFixed(4)];this.live={vp:drag.v};break;
    case 'a':drag.v=[+x.toFixed(3),+y.toFixed(3)];drag.el.style.left=x*100+'%';drag.el.style.top=y*100+'%';break;
   }
   this.perspLive(floor);
  });
  floor.addEventListener('pointerleave',()=>{const g=floor.querySelector('.mrd-sil.is-ghost');if(g)g.hidden=true;});
  floor.addEventListener('pointerup',()=>{
   const d=drag;drag=null;if(!d?.moved)return;
   switch(d.kind){
    case 'q':case 'sf':case 'sh':return void this.perspSave();
    case 'r':case 'rn':if(!d.ref||d.ref[2]-d.ref[0]<.01||d.ref[3]-d.ref[1]<.01){this.live=null;return void this.render();}this.refDraw=false;return void this.stageCommit(s=>{s.ref=d.ref;});
    case 'h':return void this.stageCommit(s=>{s.eye=d.y;});
    case 'v':return void this.stageCommit(s=>{s.vp=d.v;});
    case 'a':return void this.stageCommit(s=>{s.anchors[d.i]=d.v;});
   }
  });
  this.perspLive(floor);
  // Recién elegido «suelo» o «siluetas» en una escena sin escala: el punto de partida ya cuenta, para que las figuras escalen desde el primer momento.
  if((m()==='floor'||m()==='people')&&!(this.cfg.stage.k>0)&&this.live&&!this.live.error)this.perspSave();
 },
 /** Silueta de prueba: sigue al cursor con el tamaño que tendría una persona en ese punto (con planos elevados y ajuste fino). */
 ghostAt(floor,x,y){
  const g=floor.querySelector('.mrd-sil.is-ghost');if(!g)return;
  const cur=this.liveStage(),h=Math.min(.95,personHeight(cur,x,y,this.px()));
  if(!cur||h<.01){g.hidden=true;return;}
  Object.assign(g.style,{left:x*100+'%',top:(y-h)*100+'%',height:h*100+'%'});g.hidden=false;
 }
};
