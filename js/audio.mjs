import {ID,globalSettings} from './store.mjs';
import {audioVolume,fadeMs,ambientFor,crossfadePlan} from './core/crossfade.mjs';
import {soundInfo,ensureManaged} from './refs.mjs';
import {L} from './ui.mjs';
export const mix=()=>game.settings.get(ID,'mix')??{level:.3,quiet:false};
export function fadeSeconds(){const c=Number(game.settings.get(ID,'fade'));return c>0?c:(globalSettings().fade??3.5);}
const channelPlaying=ch=>game.playlists.contents.flatMap(p=>p.sounds.contents).filter(s=>s.playing&&(!ch||s.getFlag(ID,'ch')===ch));
/** Foundry bloquea el audio hasta el primer gesto: se espera a que se desbloquee (sin colgarse si no llega). */
async function unlocked(){
 if(!game.audio?.locked)return true;
 await Promise.race([game.audio.unlock,new Promise(r=>setTimeout(r,2500))]);
 if(game.audio.locked){ui.notifications.warn(L('AudioLocked'));return false;}
 return true;
}
/** Fundido cruzado sin hueco: la entrante arranca sin await, las salientes paran a la vez y la entrante se rampa a mano. */
async function crossfadeTo(sound){
 const pl=sound.parent,ms=fadeMs(fadeSeconds()),V=audioVolume(mix().level,mix().quiet);
 const leaving=channelPlaying('music').filter(s=>s.id!==sound.id);
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
/** Música: devuelve false si la ref no se puede resolver o el audio sigue bloqueado. */
export async function playRef(ref,scene){
 const info=soundInfo(ref,scene);if(!info)return false;
 if(!await unlocked())return false;
 await crossfadeTo(await ensureManaged(info,'music'));return true;
}
export async function stopAudio(){
 for(const s of channelPlaying())if(['music','fx'].includes(s.getFlag(ID,'ch')))await s.parent.stopSound(s);
}
export async function stopEffects(){for(const s of channelPlaying('fx'))await s.parent.stopSound(s);}
export async function playEffect(ref,scene){
 const info=soundInfo(ref,scene);if(!info)return false;
 if(!await unlocked())return false;
 const s=await ensureManaged(info,'fx');
 if(s.playing){await s.parent.stopSound(s);if(s.repeat)return true;}
 await s.update({[`flags.${ID}.ch`]:'fx'});await s.parent.playSound(s);return true;
}
/** Al activar una escena con lista de reproducción enlazada, Foundry arranca esa pista a su manera: se para para no duplicarla. */
export async function quiesceNative(scene){
 const pl=scene?.playlist;if(!pl)return;
 for(const s of pl.sounds.contents)if(s.playing&&!s.getFlag(ID,'ch'))await pl.stopSound(s);
}
export async function applyMix(level,quiet){
 await game.settings.set(ID,'mix',{level,quiet});
 const playing=channelPlaying('music');
 // Actualizar el volumen de un sonido que suena obliga a Foundry a crear su audio: antes hay que esperar al desbloqueo.
 if(!playing.length||!await unlocked())return;
 const v=audioVolume(level,quiet);
 for(const s of playing)await s.update({volume:v});
}
export async function setAmbient(scene,key){
 const a=ambientFor(key);if(!a)return;
 await scene.update({'environment.darknessLevel':a.dark,[`flags.${ID}.ambient`]:key});await applyMix(a.level,false);
}
