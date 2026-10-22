/** Marcadores de la partida: hitos secretos y relojes de N segmentos (solo GM). */
export const clampSeg=(v,max)=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(max,Math.max(0,n)):0;};
export function milestonesState(defs,value){const out={};for(const d of defs)out[d.id]=!!value?.[d.id];return out;}
export function milestonesProgress(defs,value){const s=milestonesState(defs,value);return {done:defs.filter(d=>s[d.id]).length,total:defs.length};}
/** Pulsar el segmento i: si ya está lleno y es el último, baja; si no, sube hasta él. */
export function clockAfterClick(current,index,segments){const c=clampSeg(current,segments);return index+1===c?index:index+1;}
export const clockState=(defs,value)=>Object.fromEntries(defs.map(d=>[d.id,clampSeg(value?.[d.id],d.segments)]));
