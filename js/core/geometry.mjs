/** Geometría de la barra y de los paneles flotantes. */
export const clampPos=(pos,size,view)=>({x:Math.round(Math.min(Math.max(0,view[0]-size[0]),Math.max(0,pos.x))),y:Math.round(Math.min(Math.max(0,view[1]-size[1]),Math.max(0,pos.y)))});
/** Vista previa junto a un elemento: a la derecha si cabe, si no a la izquierda; clamp vertical para no salir de pantalla. */
export function previewPlace(item,box,view,gap=10,pad=8){
 let x=item.right+gap;if(x+box.width>view[0]-pad)x=item.left-gap-box.width;
 if(x<pad)x=Math.max(pad,Math.min(view[0]-box.width-pad,item.left));
 const y=Math.max(pad,Math.min(view[1]-box.height-pad,item.top+item.height/2-box.height/2));
 return {x,y};
}
export const panelSide=(pill,view)=>pill.y>view[1]/2?'above':'below';
/** Rotación de una ficha que mira hacia donde se mueve (misma convención que Foundry: 0 = mirando hacia abajo). null si no hay desplazamiento. */
export function facingAngle(from,to){
 const dx=to.x-from.x,dy=to.y-from.y;if(!(Math.hypot(dx,dy)>0))return null;
 const deg=Math.atan2(dy,dx)*180/Math.PI-90;return ((deg%360)+360)%360;
}
