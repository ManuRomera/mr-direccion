/** Perspectiva de figuras sobre el suelo real del fondo. Lógica pura (sin Foundry) para poder probarla con node --test. */
export const FIGURE_DEFAULTS=Object.freeze({foot:.055,visible:.885,base:360,min:20,max:4000});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
/** La cabeza de una persona de pie queda en la línea de horizonte (eye): su altura en pantalla es (pies − eye) × alto.
 *  `visible` es la parte útil del token (margen transparente); `pixels` escala todo el reparto a la vez. */
export function figureSize(stage,footY,height,pixels=360,width=Infinity,o=FIGURE_DEFAULTS){
 const base=Math.max(.02,footY/height-stage.eye)*height/o.visible*(stage.k??1); // k: calibración por el rectángulo de referencia (1 sin él)
 return Math.min(o.max,width,height,Math.max(o.min,base*(pixels/o.base)));
}
export const depthFactor=(stage,footY,height,o=FIGURE_DEFAULTS)=>figureSize(stage,footY,height,o.base,Infinity,o)/o.base;
export const STAGE_MODES=Object.freeze(['horizon','vanishing','none']);
/** Punto de fuga a partir del RECTÁNGULO DE SALIDA `box`=[x0,y0,x1,y1] (fracciones): donde acaba la perspectiva (el fondo de un pasillo, el final de una calle).
 *  Como en un dibujo de perspectiva con un punto de fuga, cada esquina del cuadro (de la imagen) se une con su esquina del rectángulo y las cuatro líneas se cruzan
 *  en el punto de fuga. Si el rectángulo no es exacto las líneas no se cruzan en un solo punto: se toma el punto que minimiza la distancia a las cuatro
 *  (mínimos cuadrados, en proporciones reales: `aspect` = ancho/alto de la imagen). null si las líneas son paralelas o el rectángulo ocupa todo el cuadro. */
export function vpFromBox(box,aspect=16/9){
 if(!Array.isArray(box)||box.length!==4||!box.every(Number.isFinite))return null;
 const [x0,y0,x1,y1]=box,pairs=[[[0,0],[x0,y0]],[[1,0],[x1,y0]],[[0,1],[x0,y1]],[[1,1],[x1,y1]]];
 let a=0,b=0,c=0,e=0,f=0;
 for(const [p,q] of pairs){
  const dx=(q[0]-p[0])*aspect,dy=q[1]-p[1],n=Math.hypot(dx,dy);if(n<1e-6)continue;
  const ux=dx/n,uy=dy/n,m11=1-ux*ux,m12=-ux*uy,m22=1-uy*uy,px=p[0]*aspect,py=p[1];
  a+=m11;b+=m12;c+=m22;e+=m11*px+m12*py;f+=m12*px+m22*py;
 }
 const det=a*c-b*b;if(Math.abs(det)<1e-6)return null;
 return [clamp((c*e-b*f)/det/aspect,0,1),clamp((a*f-b*e)/det,0,1)].map(v=>+v.toFixed(4));
}
/** Punto de fuga de una escena en modo `vanishing`: el que sale del rectángulo de salida y, sin él, el colocado a mano. */
export const derivedVp=(st,aspect=16/9)=>st?.mode==='vanishing'?((st.ref&&vpFromBox(st.ref,aspect))||st.vp||null):null;
/** Perspectiva efectiva de una escena (la que usa el resto del módulo, que solo conoce `eye` y `anchors`), o null si no hay que escalar por profundidad.
 *  - horizon: línea de horizonte (`eye`); cuenta como configurada cuando hay puntos de apoyo.
 *  - vanishing: punto de fuga (del rectángulo de salida o a mano); con la cámara a nivel cae en el horizonte, así que su altura (`vp[1]`) hace de `eye`.
 *  - none: sin perspectiva (vista cenital): las figuras no cambian de tamaño según dónde estén. */
export function effectiveStage(st,aspect=16/9){
 if(!st||st.mode==='none')return null;
 let s=null;
 if(st.mode==='vanishing'){const vp=derivedVp(st,aspect);s=vp?{...st,vp,eye:vp[1]}:null;}
 else if(st.anchors?.length)s=st;
 if(!s||!s.ref)return s;
 const k=refScale(s.eye,s.ref,s.refM);return k?{...s,k}:s;
}
/** Referencia de escala: un rectángulo dibujado sobre algo de medida conocida (la puerta del fondo, una mesa…), `ref`=[x0,y0,x1,y1] en fracciones.
 *  Con una cámara a nivel, una persona al pie del rectángulo mide PERSON_M/refM de su alto; el resto sigue la regla de (pies − horizonte).
 *  `k` es el factor sobre el modelo base (cabeza de la figura en el horizonte): sin referencia vale 1. */
export const PERSON_M=1.75,EYE_M=1.6;
export function refScale(eye,ref,refM=2.1){
 if(!Array.isArray(ref)||ref.length!==4)return null;
 const top=Math.min(ref[1],ref[3]),base=Math.max(ref[1],ref[3]),h=base-top;
 if(!(h>.01)||!(base-eye>.02))return null;
 return clamp(PERSON_M/clamp(refM,.3,50)*h/(base-eye),.25,4);
}
/** Horizonte a la altura de los ojos (EYE_M) medida sobre la referencia: la línea de los ojos cae a ese tanto de su altura. */
export function eyeFromRef(ref,refM=2.1){
 const top=Math.min(ref[1],ref[3]),base=Math.max(ref[1],ref[3]);
 return clamp(base-EYE_M/clamp(refM,.3,50)*(base-top),0,1);
}
/** Puntos de apoyo repartidos a lo largo de rayos que salen del punto de fuga (como figuras alejándose por un pasillo):
 *  cada uno a distinta profundidad, de izquierda a derecha. Se usan cuando la escena tiene punto de fuga pero aún no puntos de apoyo. */
export function vpAnchors(vp,count,bottom=.94){
 const n=Math.max(1,Math.round(count)),floor=Math.max(bottom,vp[1]+.1);
 return Array.from({length:n},(_,i)=>{
  const bx=.14+.72*((i+.5)/n),t=.5+.42*((i*.618)%1);
  return [+clamp(vp[0]+(bx-vp[0])*t,0,1).toFixed(3),+clamp(vp[1]+(floor-vp[1])*t,0,1).toFixed(3)];
 });
}
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
export const figureOptions=(v={})=>{const px=Number(v.tokenPixels);return {tokenPixels:Math.round(clamp(Number.isFinite(px)?px:360,20,4000)),lockRotation:v.lockRotation!==false,hideTrails:v.hideTrails!==false,cover:v.cover===true,depthScale:v.depthScale!==false};};
export const missingCast=(existing,actors)=>{const ids=new Set(existing.map(t=>t.actorId));return actors.filter(a=>!ids.has(a.id));};
/** En v13 un movimiento llega con width/height/shape ya dentro del cambio (con los valores actuales): solo es un reajuste explícito si difieren. */
export function isExplicitResize(changes,doc,eps=1e-6){
 const diff=(k)=>changes[k]!==undefined&&Math.abs(Number(changes[k])-Number(doc[k]))>eps;
 return diff('width')||diff('height');
}
/** Parche de tamaño de una ficha (`token` = {x,y,width,height} en casillas/píxeles de documento): con suelo, por perspectiva; sin él,
 *  un cuadrado de `pixels` que conserva el centro y la línea de los pies. */
export function sizePatch(scene,token,pixels,stage,o=FIGURE_DEFAULTS){
 if(stage)return depthPatch(scene,token,pixels,stage,{x:token.x,y:token.y},o);
 const unit=scene.grid?.size||100,size=Math.min(pixels,scene.height,scene.width);
 const cx=token.x+token.width*unit/2,feet=token.y+token.height*unit*(1-o.foot);
 return {width:size/unit,height:size/unit,x:clamp(cx-size/2,0,Math.max(0,scene.width-size)),y:clamp(feet-size*(1-o.foot),0,Math.max(0,scene.height-size))};
}
