import {slug} from './ids.mjs';
/** «Autoconfigurar»: propone un borrador a partir de nombres. Datos planos de entrada para poder probarlo. */
const has=(a,b)=>{const x=slug(a),y=slug(b);return x&&y&&(x.includes(y)||y.includes(x));};
export function proposeConfig({sceneName,playlists=[],journals=[],actors=[],tokenActorIds=[]}){
 const pl=playlists.find(p=>has(p.name,sceneName));
 const sound=pl?.sounds?.[0]??playlists.flatMap(p=>p.sounds??[]).find(s=>has(s.name,sceneName));
 const journal=journals.find(j=>has(j.name,sceneName));
 const page=journal?.pages?.find(p=>has(p.name,sceneName))??journal?.pages?.[0];
 const cast=actors.filter(a=>tokenActorIds.includes(a.id)||has(a.name,sceneName));
 return {
  music:sound?{uuid:sound.uuid}:null,
  reading:page?{uuid:page.uuid}:journal?{uuid:journal.uuid}:null,
  figures:cast.map(a=>({ref:{uuid:a.uuid},label:a.name})),
  found:{music:!!sound,reading:!!journal,figures:cast.length}
 };
}
