import {clampPos} from './core/geometry.mjs';
export const L=(key,data)=>data?game.i18n.format('MRDIR.'+key,data):game.i18n.localize('MRDIR.'+key);
/** Botón derecho + arrastrar. La posición se guarda desde el cálculo (no desde getBoundingClientRect: hay transición CSS). */
export function enableRightDrag(el,{get,save,onMove=()=>{}}){
 let drag=null;
 const place=pos=>{el.style.left=pos.x+'px';el.style.top=pos.y+'px';el.style.bottom='auto';el.style.transform='none';el.classList.add('is-placed');};
 const apply=()=>{
  const pos=get();
  if(!pos||!Number.isFinite(pos.x)||!Number.isFinite(pos.y)){for(const k of ['left','top','bottom','transform'])el.style[k]='';el.classList.remove('is-placed');}
  else{const r=el.getBoundingClientRect();place(clampPos(pos,[r.width,r.height],[innerWidth,innerHeight]));}
  onMove();
 };
 el.addEventListener('contextmenu',e=>e.preventDefault());
 el.addEventListener('pointerdown',e=>{
  if(e.button!==2)return;e.preventDefault();const r=el.getBoundingClientRect();
  drag={dx:e.clientX-r.left,dy:e.clientY-r.top,id:e.pointerId,moved:false,pos:null};
  try{el.setPointerCapture(e.pointerId);}catch{}el.classList.add('is-dragging');
 });
 el.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;drag.moved=true;const r=el.getBoundingClientRect();
  drag.pos=clampPos({x:e.clientX-drag.dx,y:e.clientY-drag.dy},[r.width,r.height],[innerWidth,innerHeight]);place(drag.pos);onMove();
 });
 const end=e=>{
  if(!drag||(e.pointerId!==undefined&&e.pointerId!==drag.id))return;const d=drag;drag=null;el.classList.remove('is-dragging');
  if(d.moved&&d.pos)save(d.pos);
 };
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
 addEventListener('resize',apply);
 return apply;
}
/** Cierra los menús abiertos al hacer clic fuera (fase de captura). */
export function closeOnOutside(root,selector='details[open]',close=d=>{d.open=false;}){
 const h=e=>{const r=root();if(!r)return;for(const d of r.querySelectorAll(selector))if(!d.contains(e.target))close(d);};
 document.addEventListener('pointerdown',h,true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')h({target:document.body});},true);
}
