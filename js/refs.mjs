import {ID} from './store.mjs';
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
/** Para {src} se crea (una vez) un sonido en la lista gestionada «MR- Dirección». */
export async function ensureSound(ref,{repeat=false}={}){
 const hit=find(ref,'sound');if(hit||!ref?.src)return hit;
 let pl=game.playlists.find(p=>p.getFlag(ID,'managed'));
 if(!pl)pl=await Playlist.create({name:'MR- Dirección',flags:{[ID]:{managed:true}},mode:-1,sorting:'m'});
 const name=decodeURIComponent(ref.src.split('/').pop()).replace(/\.[^.]+$/,'');
 const [snd]=await pl.createEmbeddedDocuments('PlaylistSound',[{name,path:ref.src,repeat,volume:.3,flags:{[ID]:{src:ref.src}}}]);
 return snd;
}
export const labelOf=(ref,kind,scene)=>{const d=find(ref,kind,scene);return d?.name??(ref?.src?decodeURIComponent(ref.src.split('/').pop()):'');};
