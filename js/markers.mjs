import {ID,globalSettings,saveGlobal} from './store.mjs';
import {E} from './core/ids.mjs';
import {panelSide} from './core/geometry.mjs';
import {normalizeSettings} from './core/schema.mjs';
import {milestonesState,milestonesProgress,clockState,clockAfterClick,clockEvent,publicMilestones,publicClocks} from './core/markers.mjs';
import {L,enableRightDrag} from './ui.mjs';
const MARK=`modules/${ID}/brand/MR_09_Monograma_Marfil_Transparente.png`;
let pill,panel,applyPos=()=>{};
const state=()=>game.settings.get(ID,'markerState')??{};
/** `event`: aviso a la mesa (último movimiento de reloj); viaja en el propio ajuste para que lo vea cada cliente sin sockets. */
async function patch(key,id,value,event=null){
 const cur=state(),next={...cur,milestones:{...cur.milestones},clocks:{...cur.clocks}};next[key][id]=value;if(event)next.event=event;
 await game.settings.set(ID,'markerState',next);Hooks.callAll('mrDireccion.marker',key==='milestones'?'milestone':'clock',id,value);
}
export const toggleMilestone=id=>patch('milestones',id,!state().milestones?.[id]);
/** Frase propia para este movimiento (Mayús + clic): null si se cancela. */
async function askPhrase(c){
 return foundry.applications.api.DialogV2.prompt({window:{title:c.label},content:`<p>${E(L('PhraseAsk'))}</p><input type="text" name="phrase" autofocus placeholder="${E(L('PhrasePlaceholder'))}">`,ok:{label:L('Announce'),callback:(ev,btn)=>btn.form.elements.phrase.value.trim()},rejectClose:false});
}
/** Pulsa la casilla `i`. `ask`: el GM pidió avisar con una frase propia (aunque el reloj no avise de por sí). */
export const setClock=async(id,i,{ask=false}={})=>{
 const c=globalSettings().markers.clocks.find(x=>x.id===id);if(!c)return;
 const from=clockState([c],state().clocks)[id],to=clockAfterClick(from,i,c.segments);
 let phrase=null;if(ask&&to>from){phrase=await askPhrase(c);if(phrase===null)return;}
 await patch('clocks',id,to,clockEvent(c,from,to,{phrase,force:ask}));
};
/** Cambia una propiedad (público, avisar…) de un hito o un reloj, también si viene de un paquete (se guarda como ajuste propio que lo sobrescribe). */
export async function setMarkerFlag(kind,id,change){
 const merged=globalSettings().markers[kind].find(x=>x.id===id);if(!merged)return;
 const g=normalizeSettings(game.settings.get(ID,'global')),list=g.markers[kind],i=list.findIndex(x=>x.id===id),def={...merged,...change};
 if(i>=0)list[i]=def;else list.push(def);
 await saveGlobal({markers:g.markers});
}
/** Aviso en pantalla (a toda la mesa) cuando avanza un reloj: título, casillas y, debajo, una frase opcional. */
export function showClockToast(ev){
 let host=document.getElementById('mr-direccion-toasts');
 if(!host){host=document.createElement('div');host.id='mr-direccion-toasts';host.setAttribute('role','status');host.setAttribute('aria-live','polite');document.body.append(host);}
 // El GM tiene su barra arriba y al centro: su aviso va debajo para no taparla.
 host.classList.toggle('is-gm',game.user.isGM);
 const full=ev.to>=ev.segments,el=document.createElement('div');el.className='mrd-toast'+(full?' is-full':'');
 el.innerHTML=`<div class="mrd-toast-head"><span class="mrd-toast-kicker">${E(L(full?'ClockFull':'ClockAdvanced'))}</span><b>${E(ev.label)}</b><small>${ev.to}/${ev.segments}</small></div><div class="mrd-toast-seg" aria-hidden="true">${Array.from({length:ev.segments},(_,i)=>`<span class="${i<ev.to?'is-on':''} ${i>=ev.from&&i<ev.to?'is-new':''}"></span>`).join('')}</div>${ev.phrase?`<p class="mrd-toast-phrase">${E(ev.phrase)}</p>`:''}`;
 host.append(el);
 const close=()=>{el.classList.add('is-out');setTimeout(()=>el.remove(),400);};
 el.addEventListener('click',close);setTimeout(close,7000+(ev.phrase?.length??0)*45);
}
export function toggleMarkersPanel(force){
 if(!pill){ui.notifications.info(L('NoMarkers'));return;}
 panel.hidden=force??!panel.hidden;pill.setAttribute('aria-expanded',String(!panel.hidden));placePanel();
}
function placePanel(){
 if(!pill||!panel)return;const r=pill.getBoundingClientRect(),pw=panel.offsetWidth||310;
 panel.style.left=Math.min(Math.max(8,r.left),Math.max(8,innerWidth-pw-8))+'px';
 if(panelSide({x:r.left,y:r.top},[innerWidth,innerHeight])==='above'){panel.style.bottom=(innerHeight-r.top+8)+'px';panel.style.top='auto';}
 else{panel.style.top=(r.bottom+8)+'px';panel.style.bottom='auto';}
}
const flagBtn=(kind,id,key,on,tip,icon)=>`<button type="button" class="mrd-mini ${on?'is-on':''}" data-flag="${kind}" data-flag-id="${E(id)}" data-flag-key="${key}" aria-pressed="${on}" title="${E(tip)}" aria-label="${E(tip)}"><i class="fa-solid fa-${icon}" aria-hidden="true"></i></button>`;
export function renderMarkers(){
 const {milestones:allMs,clocks:allClocks}=globalSettings().markers,gm=game.user.isGM;
 // La mesa solo ve los hitos que se revelan al lograrse y los relojes marcados como públicos.
 const milestones=gm?allMs:publicMilestones(allMs),clocks=gm?allClocks:publicClocks(allClocks);
 if(!milestones.length&&!clocks.length){pill?.remove();panel?.remove();pill=panel=null;return;}
 const ms=milestonesState(milestones,state().milestones),pr=milestonesProgress(milestones,state().milestones),cs=clockState(clocks,state().clocks);
 if(!pill){
  pill=document.createElement('button');pill.type='button';pill.id='mr-direccion-badge';document.body.append(pill);
  panel=document.createElement('aside');panel.id='mr-direccion-panel';panel.hidden=true;panel.setAttribute('role','region');document.body.append(panel);
  pill.addEventListener('click',()=>toggleMarkersPanel());
  applyPos=enableRightDrag(pill,{get:()=>game.settings.get(ID,'badgePos'),save:p=>game.settings.set(ID,'badgePos',p),onMove:placePanel});
  panel.addEventListener('click',async e=>{
   if(e.target.closest('[data-reset-pos]')){e.preventDefault();await game.settings.set(ID,'badgePos',null);applyPos();return;}
   if(!game.user.isGM)return;
   const fl=e.target.closest('[data-flag]');if(fl){await setMarkerFlag(fl.dataset.flag,fl.dataset.flagId,{[fl.dataset.flagKey]:fl.getAttribute('aria-pressed')!=='true'});return;}
   const seg=e.target.closest('[data-seg]');if(seg){await setClock(seg.dataset.clock,Number(seg.dataset.seg),{ask:e.shiftKey});return;}
   const li=e.target.closest('[data-milestone]');if(li)await toggleMilestone(li.dataset.milestone);
  });
  panel.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('[data-milestone]')){e.preventDefault();e.target.click();}});
  document.addEventListener('pointerdown',e=>{if(!panel||panel.hidden||pill.contains(e.target)||panel.contains(e.target))return;toggleMarkersPanel(true);},true);
 }
 pill.setAttribute('aria-expanded',String(!panel.hidden));pill.setAttribute('aria-label',L('Markers'));
 const pct=pr.total?Math.round(100*pr.done/pr.total):0;
 pill.innerHTML=`<img src="${MARK}" alt="" draggable="false"><span>${E(L('Markers'))}</span>${pr.total?`<b>${pr.done}/${pr.total}</b>`:''}<i style="--p:${pct}%"></i>`;
 const clockHtml=clocks.map(c=>{
  const n=cs[c.id],pub=c.public===true,ann=c.announce===true;
  const segs=Array.from({length:c.segments},(_,i)=>gm?`<button type="button" class="mrd-seg ${i<n?'is-on':''}" data-clock="${E(c.id)}" data-seg="${i}" aria-label="${i+1}" aria-pressed="${i<n}"></button>`:`<span class="mrd-seg ${i<n?'is-on':''}"></span>`).join('');
  const tools=gm?`<span class="mrd-clock-tools">${flagBtn('clocks',c.id,'public',pub,L(pub?'ClockPublicTip':'ClockHiddenTip'),pub?'eye':'eye-slash')}${flagBtn('clocks',c.id,'announce',ann,L(ann?'ClockAnnounceOnTip':'ClockAnnounceOffTip'),'bullhorn')}</span>`:'';
  return `<div class="mrd-clock"><h4><span class="mrd-clock-name">${E(c.label)}</span>${tools}</h4><div class="mrd-seg-row ${gm?'':'is-ro'}" style="--n:${c.segments}">${segs}</div><p class="mrd-help"><b>${n}/${c.segments}</b></p></div>`;
 }).join('');
 const clockHelp=gm&&clocks.length?`<p class="mrd-help">${E(L('ClockHelpGM'))}</p>`:'';
 const msItem=h=>{
  const done=ms[h.id],secret=h.public===false,label=E(done||gm?h.label:L('Hidden')),dot=`<span class="mrd-mark-dot" aria-hidden="true">${done?'✦':'·'}</span><span>${label}</span>`;
  return gm?`<li class="${done?'is-done':''} ${secret?'is-secret':''}"><span class="mrd-ms-main" data-milestone="${E(h.id)}" role="button" tabindex="0" aria-pressed="${!!done}">${dot}</span>${flagBtn('milestones',h.id,'public',!secret,L(secret?'MsSecretTip':'MsPublicTip'),secret?'eye-slash':'eye')}</li>`
   :`<li class="${done?'is-done':''}" aria-pressed="${!!done}">${dot}</li>`;
 };
 panel.innerHTML=clockHelp+clockHtml+(milestones.length?`<h3>${E(L('Milestones'))}</h3><p class="mrd-help">${E(L(gm?'MilestonesGM':'MilestonesPlayer'))}</p><ol>${milestones.map(msItem).join('')}</ol>`:'')+`<p class="mrd-help mrd-drag">${E(L('BadgeDrag'))} <a href="#" data-reset-pos>${E(L('ResetPos'))}</a></p>`;
 applyPos();placePanel();
}
export function setupMarkers(){
 renderMarkers();
 for(const h of ['canvasReady','mrDireccion.packRegistered','mrDireccion.packImported'])Hooks.on(h,renderMarkers);
 let last=milestonesState(globalSettings().markers.milestones,state().milestones),lastEvent=state().event?.t??0;
 // Aviso a la mesa cuando se desbloquea un hito público o avanza un reloj que avisa. Los hitos secretos solo se avisan al GM.
 Hooks.on('updateSetting',s=>{
  if(s.key!==`${ID}.markerState`)return;
  const defs=globalSettings().markers.milestones,now=milestonesState(defs,s.value?.milestones),gm=game.user.isGM;
  for(const d of defs)if(now[d.id]&&!last[d.id]){
   if(d.public!==false)ui.notifications.info(`${L('Unlocked')}: ${d.label}`);
   else if(gm)ui.notifications.info(`${L('Unlocked')} (${L('SecretTag')}): ${d.label}`);
  }
  last=now;
  const ev=s.value?.event;if(ev&&ev.t>lastEvent){lastEvent=ev.t;showClockToast(ev);}
 });
}
