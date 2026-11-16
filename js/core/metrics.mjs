/** Medidas reales de una figura de cuerpo entero a partir de su transparencia: el margen bajo los pies y la parte visible (de la coronilla a la suela).
 *  Sin ellas se suponen las del token estándar (FIGURE_DEFAULTS), y un PNG recortado al borde o con aire debajo no apoya donde se pide ni mide lo previsto. */
export const ALPHA_MIN=16;
/** `data`: RGBA (Uint8ClampedArray) de una imagen de `w`×`h`. null si no hay ningún píxel opaco. */
export function alphaMetrics(data,w,h,min=ALPHA_MIN){
 if(!data||!(w>=2)||!(h>=2))return null;
 let top=-1,bottom=-1;
 for(let y=0;y<h;y++){
  const row=y*w*4;let any=false;
  for(let x=0;x<w;x++)if(data[row+x*4+3]>min){any=true;break;}
  if(any){if(top<0)top=y;bottom=y;}
 }
 if(top<0)return null;
 return {foot:+((h-(bottom+1))/h).toFixed(4),visible:+(((bottom+1)-top)/h).toFixed(4)};
}
/** Mezcla las medidas con las de por defecto; si no son creíbles (p. ej. un icono diminuto), se ignoran. */
export function figureMetrics(base,m){
 if(!m||!(m.visible>=.3&&m.visible<=1)||!(m.foot>=0&&m.foot<=.4))return base;
 return {...base,foot:m.foot,visible:m.visible};
}
