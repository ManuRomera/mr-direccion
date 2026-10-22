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
