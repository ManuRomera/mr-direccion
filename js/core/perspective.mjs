/** Perspectiva de figuras sobre el suelo real del fondo. Lógica pura (sin Foundry) para poder probarla con node --test. */
export const FIGURE_DEFAULTS=Object.freeze({foot:.055,visible:.885,base:360,min:60,max:900});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
/** La cabeza de una persona de pie queda en la línea de horizonte (eye): su altura en pantalla es (pies − eye) × alto.
 *  `visible` es la parte útil del token (margen transparente); `pixels` escala todo el reparto a la vez. */
export function figureSize(stage,footY,height,pixels=360,width=Infinity,o=FIGURE_DEFAULTS){
 const base=Math.max(.02,footY/height-stage.eye)*height/o.visible;
 return Math.min(o.max,width,height,Math.max(o.min,base*(pixels/o.base)));
}
export const depthFactor=(stage,footY,height,o=FIGURE_DEFAULTS)=>figureSize(stage,footY,height,o.base,Infinity,o)/o.base;
/** Posiciones iniciales sobre los puntos de apoyo; si hay más figuras que puntos se desplazan un poco sin salir del suelo. */
export function stageLayout(scene,count,start,pixels,stage,bounds={x:0,y:0,width:scene.width,height:scene.height},o=FIGURE_DEFAULTS){
 const unit=scene.grid?.size||100,anchors=stage.anchors??[];
 return Array.from({length:count},(_,i)=>{
  const j=start+i,a=anchors[j%Math.max(1,anchors.length)],jitter=Math.floor(j/Math.max(1,anchors.length))*.035;
  const fx=a?a[0]+jitter:.3+((j*.137)%.5),fy=a?a[1]:.9,feet=fy*scene.height,cx=fx*scene.width;
  const size=figureSize(stage,feet,scene.height,pixels,bounds.width,o);
  return {x:clamp(cx-size/2,bounds.x,bounds.x+bounds.width-size),y:clamp(feet-size*(1-o.foot),bounds.y,bounds.y+bounds.height-size),width:size/unit,height:size/unit};
 });
}
/** Reajusta una figura a su profundidad conservando el centro y la línea de los pies. */
export function depthPatch(scene,token,pixels,stage,pos={},o=FIGURE_DEFAULTS){
 const unit=scene.grid?.size||100,size0=token.width*unit,h0=token.height*unit;
 const x=pos.x??token.x,y=pos.y??token.y,cx=x+size0/2,feet=y+h0*(1-o.foot);
 const size=figureSize(stage,feet,scene.height,pixels,scene.width,o);
 return {width:size/unit,height:size/unit,x:cx-size/2,y:feet-size*(1-o.foot)};
}
/** Sin datos de suelo: fila de figuras al pie de la escena. */
export function rowLayout(scene,count,start=0,pixels=360,bounds={x:0,y:0,width:scene.width,height:scene.height}){
 const unit=scene.grid?.size||100,size=Math.min(clamp(pixels,60,900),bounds.width,bounds.height);
 const gap=Math.max(12,size*.08),slots=Math.max(6,start+count),step=(bounds.width-size)/Math.max(1,slots-1);
 return Array.from({length:count},(_,i)=>({x:bounds.x+Math.min(bounds.width-size,(start+i)*step),y:bounds.y+Math.max(0,bounds.height-size-gap),width:size/unit,height:size/unit}));
}
/** Zoom de cobertura: conserva proporciones y el paneo queda dentro de la ilustración. */
export function coverPosition(rect,screen,position={},center=false){
 if(!(rect.width>0&&rect.height>0&&screen[0]>0&&screen[1]>0))return null;
 const minimum=Math.max(screen[0]/rect.width,screen[1]/rect.height),scale=center?minimum:Math.max(minimum,Number(position.scale)||minimum);
 const hx=screen[0]/(2*scale),hy=screen[1]/(2*scale),fin=v=>Number.isFinite(Number(v));
 return {scale,x:clamp(center||!fin(position.x)?rect.x+rect.width/2:Number(position.x),rect.x+hx,rect.x+rect.width-hx),y:clamp(center||!fin(position.y)?rect.y+rect.height/2:Number(position.y),rect.y+hy,rect.y+rect.height-hy)};
}
export const figureOptions=(v={})=>{const px=Number(v.tokenPixels);return {tokenPixels:Math.round(clamp(Number.isFinite(px)?px:360,60,900)),lockRotation:v.lockRotation!==false,hideTrails:v.hideTrails!==false,cover:v.cover===true,depthScale:v.depthScale!==false};};
export const missingCast=(existing,actors)=>{const ids=new Set(existing.map(t=>t.actorId));return actors.filter(a=>!ids.has(a.id));};
