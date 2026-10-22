import {ID,globalSettings} from './store.mjs';
import {E} from './core/ids.mjs';
import {panelSide} from './core/geometry.mjs';
import {milestonesState,milestonesProgress,clockState,clockAfterClick} from './core/markers.mjs';
import {L,enableRightDrag} from './ui.mjs';
const MARK=`modules/${ID}/brand/MR_09_Monograma_Marfil_Transparente.png`;
let pill,panel,applyPos=()=>{};
const state=()=>game.settings.get(ID,'markerState')??{};
async function patch(key,id,value){
 const cur=state(),next={milestones:{...cur.milestones},clocks:{...cur.clocks}};next[key][id]=value;
 await game.settings.set(ID,'markerState',next);Hooks.callAll('mrDireccion.marker',key==='milestones'?'milestone':'clock',id,value);
}
export const toggleMilestone=id=>patch('milestones',id,!state().milestones?.[id]);
export const setClock=async(id,i)=>{const c=globalSettings().markers.clocks.find(x=>x.id===id);if(c)await patch('clocks',id,clockAfterClick(state().clocks?.[id],i,c.segments));};
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
export function renderMarkers(){
 const {milestones,clocks}=globalSettings().markers,gm=game.user.isGM;
 if(!milestones.length&&!(gm&&clocks.length)){pill?.remove();panel?.remove();pill=panel=null;return;}
 const ms=milestonesState(milestones,state().milestones),pr=milestonesProgress(milestones,state().milestones),cs=clockState(clocks,state().clocks);
 if(!pill){
  pill=document.createElement('button');pill.type='button';pill.id='mr-direccion-badge';document.body.append(pill);
  panel=document.createElement('aside');panel.id='mr-direccion-panel';panel.hidden=true;panel.setAttribute('role','region');document.body.append(panel);
  pill.addEventListener('click',()=>toggleMarkersPanel());
  applyPos=enableRightDrag(pill,{get:()=>game.settings.get(ID,'badgePos'),save:p=>game.settings.set(ID,'badgePos',p),onMove:placePanel});
  panel.addEventListener('click',async e=>{
   if(e.target.closest('[data-reset-pos]')){e.preventDefault();await game.settings.set(ID,'badgePos',null);applyPos();return;}
   if(!gm)return;
   const seg=e.target.closest('[data-seg]');if(seg){await setClock(seg.dataset.clock,Number(seg.dataset.seg));return;}
   const li=e.target.closest('[data-milestone]');if(li)await toggleMilestone(li.dataset.milestone);
  });
  panel.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('[data-milestone]')){e.preventDefault();e.target.click();}});
  document.addEventListener('pointerdown',e=>{if(!panel||panel.hidden||pill.contains(e.target)||panel.contains(e.target))return;toggleMarkersPanel(true);},true);
 }
 pill.setAttribute('aria-expanded',String(!panel.hidden));pill.setAttribute('aria-label',L('Markers'));
 const pct=pr.total?Math.round(100*pr.done/pr.total):0;
 pill.innerHTML=`<img src="${MARK}" alt="" draggable="false"><span>${E(L('Markers'))}</span>${pr.total?`<b>${pr.done}/${pr.total}</b>`:''}<i style="--p:${pct}%"></i>`;
 const clockHtml=gm?clocks.map(c=>`<div class="mrd-clock"><h4>${E(c.label)}</h4><div class="mrd-seg-row" style="--n:${c.segments}">${Array.from({length:c.segments},(_,i)=>`<button type="button" class="mrd-seg ${i<cs[c.id]?'is-on':''}" data-clock="${E(c.id)}" data-seg="${i}" aria-label="${i+1}" aria-pressed="${i<cs[c.id]}"></button>`).join('')}</div><p class="mrd-help"><b>${cs[c.id]}/${c.segments}</b></p></div>`).join(''):'';
 panel.innerHTML=clockHtml+(milestones.length?`<h3>${E(L('Milestones'))}</h3><p class="mrd-help">${E(L(gm?'MilestonesGM':'MilestonesPlayer'))}</p><ol>${milestones.map(h=>`<li data-milestone="${E(h.id)}" class="${ms[h.id]?'is-done':''}" ${gm?'tabindex="0" role="button"':''} aria-pressed="${ms[h.id]}"><span class="mrd-mark-dot" aria-hidden="true">${ms[h.id]?'✦':'·'}</span><span>${E(ms[h.id]||gm?h.label:L('Hidden'))}</span></li>`).join('')}</ol>`:'')+`<p class="mrd-help mrd-drag">${E(L('BadgeDrag'))} <a href="#" data-reset-pos>${E(L('ResetPos'))}</a></p>`;
 applyPos();placePanel();
}
export function setupMarkers(){
 renderMarkers();
 for(const h of ['canvasReady','mrDireccion.packRegistered','mrDireccion.packImported'])Hooks.on(h,renderMarkers);
 let last=milestonesState(globalSettings().markers.milestones,state().milestones);
 // Aviso a la mesa cuando se desbloquea un hito nuevo.
 Hooks.on('updateSetting',s=>{
  if(s.key===`${ID}.global`||s.key===`${ID}.markerState`){renderMarkers();}
  if(s.key!==`${ID}.markerState`)return;
  const defs=globalSettings().markers.milestones,now=milestonesState(defs,s.value?.milestones);
  for(const d of defs)if(now[d.id]&&!last[d.id])ui.notifications.info(`${L('Unlocked')}: ${d.label}`);
  last=now;
 });
}
