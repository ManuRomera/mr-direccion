import {ID,sceneConfig} from './store.mjs';
import {find} from './refs.mjs';
import {figureOptions,stageLayout,rowLayout,depthPatch,coverPosition,missingCast} from './core/perspective.mjs';
const activeGM=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const options=()=>figureOptions(game.settings.get(ID,'figures'));
const stageOf=scene=>{const c=sceneConfig(scene);return c&&c.stage.anchors.length?c.stage:null;};
const isFigure=(scene,token)=>{
 if(!sceneConfig(scene))return false;if(token.getFlag?.(ID,'placed')||token._source?.flags?.[ID]?.placed)return true;
 const c=sceneConfig(scene);return c.figures.some(f=>find(f.ref,'actor')?.id===token.actorId);
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
  const t=await pending[i].getTokenDocument({...pos[i],lockRotation:o.lockRotation,flags:{[ID]:{placed:true}}});docs.push(t.toObject());
 }
 await scene.createEmbeddedDocuments('Token',docs);return docs.length;
}
export const castOf=scene=>(sceneConfig(scene)?.figures??[]).map(f=>find(f.ref,'actor')).filter(Boolean);
export async function resizeFigures(scene,selectedOnly=false){
 if(!activeGM())return 0;const o=options(),stage=o.depthScale?stageOf(scene):null,unit=scene.grid.size||100;
 const ids=selectedOnly?new Set((canvas.tokens?.controlled??[]).map(t=>t.id)):null;
 const ch=scene.tokens.contents.filter(t=>(!ids||ids.has(t.id))&&isFigure(scene,t)).map(t=>{
  if(stage)return {_id:t.id,...depthPatch(scene,t,o.tokenPixels,stage)};
  const size=Math.min(o.tokenPixels,scene.height,scene.width);
  return {_id:t.id,width:size/unit,height:size/unit};
 });
 if(ch.length)await scene.updateEmbeddedDocuments('Token',ch);return ch.length;
}
export async function setOption(key,value){
 if(!activeGM())return;const next=figureOptions({...options(),[key]:value});await game.settings.set(ID,'figures',next);
 if(key==='lockRotation')for(const s of game.scenes){
  const up=s.tokens.contents.filter(t=>isFigure(s,t)&&t.lockRotation!==next.lockRotation).map(t=>({_id:t.id,lockRotation:next.lockRotation}));
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
 Hooks.on('preMoveToken',(token,mv)=>{if(!isFigure(token.parent,token))return;const o=options();if(o.lockRotation)mv.autoRotate=false;if(o.hideTrails)mv.showRuler=false;});
 Hooks.on('preCreateToken',token=>{
  const scene=token.parent,stage=options().depthScale?stageOf(scene):null;if(!stage||token._source.flags?.[ID]?.placed||!isFigure(scene,token))return;
  const unit=scene.grid.size||100,n=Math.min(options().tokenPixels,scene.height,scene.width)/unit;
  token.updateSource(depthPatch(scene,{width:n,height:n,x:token.x,y:token.y},options().tokenPixels,stage));
 });
 // Al arrastrar una figura hacia el fondo se empequeñece; hacia el frente, crece (una sola actualización).
 Hooks.on('preUpdateToken',(token,ch)=>{
  const scene=token.parent,stage=options().depthScale&&game.user.isGM?stageOf(scene):null;
  if(!stage||!isFigure(scene,token)||ch.width!==undefined||ch.height!==undefined||(ch.x===undefined&&ch.y===undefined))return;
  Object.assign(ch,depthPatch(scene,token,options().tokenPixels,stage,{x:ch.x,y:ch.y}));
 });
 Hooks.on('canvasReady',()=>fitScreen());Hooks.on('canvasPan',()=>fitScreen(false));
}
