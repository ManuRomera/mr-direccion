import {alphaMetrics} from './core/metrics.mjs';
/** Medidas reales (pies y parte visible) de cada imagen de ficha, leídas una vez de su transparencia y guardadas en memoria. */
const cache=new Map(),pending=new Map();
const MAXH=384;
/** Lo ya medido (síncrono, para los ganchos de movimiento): null si aún no se midió o no se pudo. */
export const metricsOf=src=>(src&&cache.get(src))||null;
async function measure(src){
 try{
  const img=new Image();img.decoding='async';img.src=src;await img.decode();
  const H=Math.min(MAXH,img.naturalHeight||MAXH),W=Math.max(2,Math.round(H*(img.naturalWidth/(img.naturalHeight||1))));
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,W,H);
  return alphaMetrics(ctx.getImageData(0,0,W,H).data,W,H);
 }catch(e){return null;}   // imagen externa, vídeo o ilegible: se usan las medidas por defecto
}
/** Mide (si hace falta) las imágenes dadas. Los vídeos se saltan. */
export function ensureMetrics(srcs){
 const todo=[...new Set((srcs??[]).filter(s=>s&&typeof s==='string'&&!cache.has(s)&&!/\.(webm|mp4|m4v|ogv)(\?|$)/i.test(s)))];
 return Promise.all(todo.map(s=>{
  if(!pending.has(s))pending.set(s,measure(s).then(m=>{cache.set(s,m);pending.delete(s);return m;}));
  return pending.get(s);
 }));
}
