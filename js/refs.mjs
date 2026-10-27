import {ID} from './store.mjs';
import {soundKey,baseName} from './core/crossfade.mjs';
/** Resuelve refs ({uuid}|{flag}|{name}|{src}|{sceneFlag}) a documentos. `kind`: scene|sound|actor|journal. */
const collection={scene:()=>game.scenes.contents,actor:()=>game.actors.contents,journal:()=>game.journal.contents,sound:()=>game.playlists.contents.flatMap(p=>p.sounds.contents)};
export function find(ref,kind,scene=null){
 if(!ref)return null;
 if(ref.uuid){try{return fromUuidSync(ref.uuid)??null;}catch{return null;}}
 if(ref.sceneFlag&&scene){
  const d=scene.getFlag(ref.sceneFlag[0],ref.sceneFlag[1]);const j=game.journal.get(d?.journalId);
  return j?(j.pages.get(d.pageId)??j):null;
 }
 const all=collection[kind]?.()??[];
 if(ref.flag)return all.find(d=>String(d.getFlag?.(ref.flag[0],ref.flag[1]))===ref.flag[2])??null;
 if(ref.name)return all.find(d=>d.name===ref.name)??null;
 if(ref.src&&kind==='sound')return all.find(d=>d.path===ref.src)??null;
 return null;
}
/** Datos reproducibles de una ref de sonido (sin tocar documentos): null si no se puede resolver. */
export function soundInfo(ref,scene=null){
 if(!ref)return null;
 if(ref.src)return {path:ref.src,name:baseName(ref.src),volume:.5,repeat:false};
 const d=find(ref,'sound',scene);
 return d?.path?{path:d.path,name:d.name,volume:d.volume??.5,repeat:!!d.repeat}:null;
}
/* ---- sonidos gestionados ----
 * Todo lo que suena desde la barra se reproduce con una copia en la lista «MR- Dirección» (modo desactivado): así no importa
 * el modo de la lista de origen (en secuencial, reproducir uno corta a los demás y al acabar arranca el siguiente). */
export const managedPlaylist=()=>game.playlists.find(p=>p.getFlag(ID,'managed'))??null;
export const managedSound=(info,channel)=>info?managedPlaylist()?.sounds.find(s=>s.getFlag(ID,'key')===soundKey(channel,info.path))??null:null;
let chain=Promise.resolve();
export function ensureManaged(info,channel){
 const run=chain.catch(()=>{}).then(async()=>{
  const hit=managedSound(info,channel);if(hit)return hit;
  let pl=managedPlaylist();
  if(!pl)pl=await Playlist.create({name:'MR- Dirección',flags:{[ID]:{managed:true}},mode:-1,sorting:'m'});
  const [snd]=await pl.createEmbeddedDocuments('PlaylistSound',[{name:info.name,path:info.path,repeat:channel==='music'?true:info.repeat,volume:channel==='music'?.3:info.volume,flags:{[ID]:{key:soundKey(channel,info.path)}}}]);
  return snd;
 });
 chain=run;return run;
}
export const isPlaying=(ref,channel,scene)=>!!managedSound(soundInfo(ref,scene),channel)?.playing;
export const labelOf=(ref,kind,scene)=>{const d=find(ref,kind,scene);return d?.name??(ref?.src?baseName(ref.src):'');};
