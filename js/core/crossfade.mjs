/** Fundido cruzado: la entrante sube y las salientes bajan a la vez, de modo que la suma de volúmenes es constante. */
export const DEFAULT_FADE=3.5;
export const AMBIENTS=Object.freeze({light:{dark:0,level:.35},dim:{dark:.38,level:.3},dark:{dark:.72,level:.22}});
export const ambientFor=key=>AMBIENTS[key]??null;
export const audioVolume=(level,quiet)=>{const n=Number(level);return Math.min(1,Math.max(0,Number.isFinite(n)?n:.3))*(quiet?.28:1);};
export const fadeMs=(seconds,fallback=DEFAULT_FADE)=>{const n=Number(seconds);return Math.round(Math.min(10,Math.max(.3,Number.isFinite(n)&&n>0?n:fallback))*1000);};
/** Ganancia de entrada y de salida en el instante t∈[0,1] para un volumen objetivo V. */
export function crossfadeGain(t,V){const x=Math.min(1,Math.max(0,t));return {in:V*x,out:V*(1-x)};}
/** Qué suena y qué debe salir: todo lo que suena y no es la pista pedida (también si se repite la misma: no hay hueco). */
export function crossfadePlan(playing,target){return {leaving:playing.filter(s=>s!==target),starting:!playing.includes(target)};}
