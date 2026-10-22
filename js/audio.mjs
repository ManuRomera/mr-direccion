import {ID,globalSettings} from './store.mjs';
import {audioVolume,fadeMs,ambientFor,crossfadePlan} from './core/crossfade.mjs';
import {find,ensureSound} from './refs.mjs';
export const mix=()=>game.settings.get(ID,'mix')??{level:.3,quiet:false};
export function fadeSeconds(){const c=Number(game.settings.get(ID,'fade'));return c>0?c:(globalSettings().fade??3.5);}
const musicPlaying=()=>game.playlists.contents.flatMap(p=>p.sounds.contents).filter(s=>s.playing&&s.getFlag(ID,'ch')==='music');
/** Fundido cruzado sin hueco: la entrante arranca sin await, las salientes paran a la vez y la entrante se rampa a mano. */
export async function crossfadeTo(sound){
 const pl=sound.parent,ms=fadeMs(fadeSeconds()),V=audioVolume(mix().level,mix().quiet);
 const leaving=[...new Set([...musicPlaying(),...pl.sounds.contents.filter(s=>s.playing)])].filter(s=>s.id!==sound.id);
 const plan=crossfadePlan(leaving.map(s=>s.id),sound.id);
 await Promise.all(leaving.map(s=>s.update({fade:ms})));
 await sound.update({volume:V,fade:ms,[`flags.${ID}.ch`]:'music'});
 // playSound() espera a que acabe su fundido de entrada: no se espera para que entrada y salida corran a la vez.
 const entering=plan.starting?pl.playSound(sound):Promise.resolve();
 const out=leaving.map(o=>o.parent.stopSound(o));
 if(plan.starting&&leaving.length){
  for(let i=0;i<40&&!sound.sound?.playing;i++)await new Promise(r=>setTimeout(r,25));
  if(sound.sound){sound.sound.volume=0;sound.sound.fade(V,{duration:Math.max(300,sound.fadeDuration||ms)});}
 }
 await Promise.all([entering,...out]);
}
export async function playRef(ref,scene){
 const s=ref?.src?await ensureSound(ref,{repeat:true}):find(ref,'sound',scene);
 if(!s)return false;await crossfadeTo(s);return true;
}
export async function stopAudio(){
 for(const p of game.playlists)for(const s of p.sounds)if(s.playing&&['music','fx'].includes(s.getFlag(ID,'ch')))await p.stopSound(s);
}
export async function stopEffects(){
 for(const p of game.playlists)for(const s of p.sounds)if(s.playing&&s.getFlag(ID,'ch')==='fx')await p.stopSound(s);
}
export async function playEffect(ref,scene){
 const s=ref?.src?await ensureSound(ref):find(ref,'sound',scene);if(!s)return false;
 if(s.playing){await s.parent.stopSound(s);if(s.repeat)return true;}
 await s.update({[`flags.${ID}.ch`]:'fx'});await s.parent.playSound(s);return true;
}
export async function applyMix(level,quiet){
 await game.settings.set(ID,'mix',{level,quiet});
 const v=audioVolume(level,quiet),up=musicPlaying().map(s=>({_id:s.id,parent:s.parent,volume:v}));
 for(const p of new Set(up.map(u=>u.parent)))await p.updateEmbeddedDocuments('PlaylistSound',up.filter(u=>u.parent===p).map(({_id,volume})=>({_id,volume})));
}
export async function setAmbient(scene,key){
 const a=ambientFor(key);if(!a)return;
 await scene.update({'environment.darknessLevel':a.dark,[`flags.${ID}.ambient`]:key});await applyMix(a.level,false);
}
