/** Marcadores de la partida: hitos (públicos o secretos al lograrlos) y relojes de N segmentos (del GM, o públicos si se decide). */
export const clampSeg=(v,max)=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(max,Math.max(0,n)):0;};
export function milestonesState(defs,value){const out={};for(const d of defs)out[d.id]=!!value?.[d.id];return out;}
export function milestonesProgress(defs,value){const s=milestonesState(defs,value);return {done:defs.filter(d=>s[d.id]).length,total:defs.length};}
/** Pulsar el segmento i: si ya está lleno y es el último, baja; si no, sube hasta él. */
export function clockAfterClick(current,index,segments){const c=clampSeg(current,segments);return index+1===c?index:index+1;}
export const clockState=(defs,value)=>Object.fromEntries(defs.map(d=>[d.id,clampSeg(value?.[d.id],d.segments)]));
/** Hitos que ve la mesa: los que se revelan al lograrse (por defecto, todos). Los secretos solo los ve el GM. */
export const publicMilestones=defs=>defs.filter(d=>d.public!==false);
/** Relojes que ve la mesa: solo los marcados como públicos. */
export const publicClocks=defs=>defs.filter(d=>d.public===true);
/** Frase de sabor al llegar a `to` casillas: una por casilla (la 1.ª al llegar a 1…); con una sola línea se usa siempre. */
export function phraseFor(phrases,to){
 const p=Array.isArray(phrases)?phrases.filter(x=>typeof x==='string'):[];
 if(!p.length)return '';
 return (p.length===1?p[0]:(p[to-1]??'')).trim();
}
/** Aviso a la mesa al avanzar un reloj de `from` a `to`: solo si sube y el reloj avisa (o el GM lo fuerza con una frase propia). null si no hay aviso. */
export function clockEvent(c,from,to,{phrase=null,force=false,now=Date.now()}={}){
 if(!(to>from)||!(c.announce===true||force))return null;
 return {id:c.id,label:c.label,segments:c.segments,from,to,phrase:(typeof phrase==='string'&&phrase.trim()?phrase.trim():phraseFor(c.phrases,to)),t:now};
}
