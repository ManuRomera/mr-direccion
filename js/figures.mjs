import {ID,sceneConfig} from './store.mjs';
import {find} from './refs.mjs';
import {facingAngle} from './core/geometry.mjs';
import {figureOptions,stageLayout,rowLayout,depthPatch,sizePatch,coverPosition,missingCast} from './core/perspective.mjs';
/** Módulos que ajustan fichas por su cuenta: se les avisa de que estas ya están colocadas para que no las reajusten. */
const FOREIGN=['mr-trono-de-la-sed'];
const foreignFlags=()=>Object.fromEntries(FOREIGN.filter(id=>game.modules.get(id)?.active).map(id=>[id,{placed:true}]));
const activeGM=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const options=()=>figureOptions(game.settings.get(ID,'figures'));
const stageOf=scene=>{const c=sceneConfig(scene);return c&&c.stage.anchors.length?c.stage:null;};
/** Las opciones (giro, línea de desplazamiento, escala por profundidad, tamaño) valen para TODAS las fichas de una escena configurada. */
const managed=scene=>!!sceneConfig(scene);
/** Solo las fichas colocadas por la barra (o de actores de la lista) reciben el tamaño inicial al crearse. */
const isCast=(scene,token)=>{
 if(token.getFlag?.(ID,'placed')||token._source?.flags?.[ID]?.placed)return true;
 const c=sceneConfig(scene);return !!c&&c.figures.some(f=>find(f.ref,'actor')?.id===token.actorId);
};
export function visibleBounds(scene){
 if(!globalThis.canvas?.ready||canvas.scene?.id!==scene.id)return undefined;
 const rect=canvas.dimensions.sceneRect,k=canvas.stage.scale.x,sc=canvas.screenDimensions;
 const x=Math.max(0,canvas.stage.pivot.x-sc[0]/(2*k)-rect.x),y=Math.max(0,canvas.stage.pivot.y-sc[1]/(2*k)-rect.y);
 return {x,y,width:Math.min(scene.width-x,sc[0]/k),height:Math.min(scene.height-y,sc[1]/k)};
}
export async function placeActors(scene,actors){
 const o=options(),stage=o.depthScale?stageOf(scene):null,pending=missingCast(scene.tokens.contents,actors);
 if(!pending.length)return 0;
 const b=visibleBounds(scene),pos=stage?stageLayout(scene,pending.length,scene.tokens.size,o.tokenPixels,stage,b):rowLayout(scene,pending.length,scene.tokens.size,o.tokenPixels,b);
 const docs=[];
 for(let i=0;i<pending.length;i++){
  const t=await pending[i].getTokenDocument({...pos[i],lockRotation:o.lockRotation,flags:{...foreignFlags(),[ID]:{placed:true}}});docs.push(t.toObject());
 }
 await scene.createEmbeddedDocuments('Token',docs);return docs.length;
}
/** Actores de la escena como documentos completos (un uuid de compendio da solo una entrada de índice: se carga entero). */
export async function resolveActors(refs){
 const out=[];
 for(const ref of refs){
  let a=find(ref,'actor');
  if(a&&typeof a.getTokenDocument!=='function'&&a.uuid)a=await fromUuid(a.uuid).catch(()=>null);
  if(a&&typeof a.getTokenDocument==='function')out.push(a);
 }
 return out;
}
export const castOf=scene=>resolveActors((sceneConfig(scene)?.figures??[]).map(f=>f.ref));
/** Fichas sobre las que actúa la barra de tamaño: todas las de la escena o solo las seleccionadas (en la escena que se está viendo). */
export function targetTokens(scene,target){
 if(!scene)return [];
 if(target!=='selected')return scene.tokens.contents;
 if(!globalThis.canvas?.ready||canvas.scene?.id!==scene.id)return [];
 const ids=new Set((canvas.tokens?.controlled??[]).map(t=>t.id));
 return scene.tokens.contents.filter(t=>ids.has(t.id));
}
/** Pone las fichas elegidas a `pixels` (con suelo marcado y escala por profundidad, ese es el tamaño en primer plano). */
export async function resizeTokens(scene,target,pixels){
 if(!activeGM())return 0;const o=options(),stage=o.depthScale?stageOf(scene):null;
 const ch=targetTokens(scene,target).map(t=>({_id:t.id,...sizePatch(scene,{x:t._source.x,y:t._source.y,width:t._source.width,height:t._source.height},pixels,stage)}));
 if(ch.length)await scene.updateEmbeddedDocuments('Token',ch,{mrdDepth:true,animate:false});return ch.length;
}
export const resizeFigures=(scene,selectedOnly=false)=>resizeTokens(scene,selectedOnly?'selected':'all',options().tokenPixels);
export async function setOption(key,value){
 if(!activeGM())return;const next=figureOptions({...options(),[key]:value});await game.settings.set(ID,'figures',next);
 if(key==='lockRotation')for(const s of game.scenes){
  if(!managed(s))continue;
  const up=s.tokens.contents.filter(t=>t.lockRotation!==next.lockRotation).map(t=>({_id:t.id,lockRotation:next.lockRotation}));
  if(up.length)await s.updateEmbeddedDocuments('Token',up);
 }
}
let adjusting=false;
export function fitScreen(center=true){
 if(adjusting||!canvas?.ready||!sceneConfig(canvas.scene)||!options().cover)return;
 const old={x:canvas.stage.pivot.x,y:canvas.stage.pivot.y,scale:canvas.stage.scale.x};
 const p=coverPosition(canvas.dimensions.sceneRect,canvas.screenDimensions,old,center);if(!p)return;
 if(['x','y','scale'].every(k=>Math.abs(old[k]-p[k])<1e-5))return;
 adjusting=true;try{canvas.pan(p);}finally{adjusting=false;}
}
export function registerFigureHooks(){
 // Giro y línea de desplazamiento: todas las fichas de las escenas configuradas.
 // Otros módulos (p. ej. MR Token Stage) pueden quitar el giro automático del movimiento: el giro se aplica también aquí, tras el movimiento.
 const facing=new Map();
 Hooks.on('preMoveToken',(token,mv,opts)=>{
  if(!managed(token.parent))return;const o=options();
  // Los reajustes de tamaño del propio módulo mueven la ficha unos píxeles: ni giran ni dibujan regla.
  if(opts?.mrdDepth){mv.autoRotate=false;mv.showRuler=false;return;}
  mv.autoRotate=!o.lockRotation;if(o.hideTrails)mv.showRuler=false;
  facing.delete(token.id);
  if(o.lockRotation||token.lockRotation)return;
  try{const a=facingAngle(token.getCenterPoint(mv.origin),token.getCenterPoint(mv.destination));if(a!==null)facing.set(token.id,a);}catch(e){console.warn(`${ID} | giro`,e);}
 });
 Hooks.on('updateToken',(token,ch,opts,userId)=>{
  if(userId!==game.user.id||!facing.has(token.id)||opts?.mrdRot||(ch.x===undefined&&ch.y===undefined))return;
  const rot=facing.get(token.id);facing.delete(token.id);
  if(Math.abs((((token._source.rotation-rot)%360)+540)%360-180)<.5)return;
  token.update({rotation:rot},{mrdRot:true,animate:true}).catch(e=>console.warn(`${ID} | giro`,e));
 });
 Hooks.on('preCreateToken',token=>{
  const scene=token.parent;if(!managed(scene))return;const o=options();
  token.updateSource({lockRotation:o.lockRotation});
  const stage=o.depthScale?stageOf(scene):null;if(!stage||token._source.flags?.[ID]?.placed||!isCast(scene,token))return;
  const unit=scene.grid.size||100,n=Math.min(o.tokenPixels,scene.height,scene.width)/unit;
  token.updateSource(depthPatch(scene,{width:n,height:n,x:token.x,y:token.y},o.tokenPixels,stage));
 });
 // Al arrastrar una figura hacia el fondo se empequeñece; hacia el frente, crece. En v13 el movimiento fija width/height durante
 // la propia actualización, así que el reajuste es una segunda actualización, hecha por quien movió la ficha.
 Hooks.on('updateToken',(token,ch,opts,userId)=>{
  if(opts?.mrdDepth||userId!==game.user.id||!token.isOwner||(ch.x===undefined&&ch.y===undefined))return;
  const scene=token.parent,stage=options().depthScale?stageOf(scene):null;
  if(!stage)return;
  // token.x/y puede ir por detrás (posición animada): la destino está en el cambio y en _source.
  const patch=depthPatch(scene,token,options().tokenPixels,stage,{x:ch.x??token._source.x,y:ch.y??token._source.y});
  if(Math.abs(patch.width-token._source.width)<.01)return;
  token.update(patch,{mrdDepth:true,animate:false}).catch(e=>console.warn(`${ID} | reajuste por profundidad`,e));
 });
 Hooks.on('canvasReady',()=>fitScreen());Hooks.on('canvasPan',()=>fitScreen(false));
}
