/** Imágenes de escena: dónde aparece una imagen en la pantalla (lógica pura, probada con node --test). */
export const IMAGE_POS=Object.freeze(['c','tl','tr','bl','br']);
/** Rectángulo en px de escena para una imagen de proporción `ratio` (ancho/alto) dentro del área visible `b` ({x,y,width,height}):
 *  en el centro, hasta el 60 % del área; en un cuadrante, su cuarto de pantalla menos un margen. Conserva la proporción. */
export function imageRect(ratio,b,pos='c'){
 const r=ratio>0&&Number.isFinite(ratio)?ratio:16/9,m=Math.min(b.width,b.height)*.03,c=pos==='c'||!IMAGE_POS.includes(pos);
 const bw=c?b.width*.6:b.width/2-1.5*m,bh=c?b.height*.6:b.height/2-1.5*m;
 let w=bw,h=w/r;if(h>bh){h=bh;w=h*r;}
 const x=c?b.x+(b.width-w)/2:pos[1]==='l'?b.x+m:b.x+b.width-m-w,y=c?b.y+(b.height-h)/2:pos[0]==='t'?b.y+m:b.y+b.height-m-h;
 return {x:Math.round(x),y:Math.round(y),width:Math.round(w),height:Math.round(h)};
}
