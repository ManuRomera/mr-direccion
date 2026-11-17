/** Escala de una ventana según la pantalla (lógica pura, probada con node --test). Estándar de la casa «mr-pantallas».
 *  Referencia 1920×950 (monitor 1080p con el navegador abierto): ahí todo va a 1; en pantallas menores se escala en proporción y con aire. */
export const WIN_MARGIN=8,WIN_MIN=.5,WIN_AIR=.92,WIN_REF=Object.freeze({width:1920,height:950});
/** `width`/`height`: lo que mide la ventana; `view`: {width, height (útil, sin la reserva de la barra de macros), total}; `manual`: % elegido en Ajustes (0 = automático). */
export function windowScale(width,height,view,manual=0){
 if(manual>0)return Math.min(1.5,Math.max(.5,manual/100));
 if(!(width>0)||!(height>0))return 1;
 const prop=Math.min(1,view.width/WIN_REF.width,(view.total??view.height)/WIN_REF.height),air=prop<1?WIN_AIR:1;
 const fit=air*Math.min((view.width-WIN_MARGIN)/width,(view.height-WIN_MARGIN)/height);
 return Math.max(WIN_MIN,Math.floor(Math.min(1,prop,fit)*100)/100);
}
