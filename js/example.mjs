import {ID,importPack} from './store.mjs';
const BASE=`modules/${ID}/examples/posada`;
const EN=()=>!game.i18n.lang?.startsWith('es');
const SOUNDS=()=>EN()?[['viento','Wind',true],['hogar','Hearth',true],['sotano','Cellar',true],['tension','Tension',true],['esperanza','Hope',true],['campana','Bell',false],['puerta','Door',false],['trueno','Thunder',false]]
 :[['viento','Viento',true],['hogar','Hogar',true],['sotano','Sótano',true],['tension','Tensión',true],['esperanza','Esperanza',true],['campana','Campana',false],['puerta','Puerta',false],['trueno','Trueno',false]];
const SCENES=()=>EN()?[['camino','The road to the inn'],['sala','The common room'],['bodega','The cellar']]:[['camino','El camino de la posada'],['sala','La sala común'],['bodega','La bodega']];
const ACTORS=()=>EN()?[['posadera','The innkeeper'],['viajero','The traveler'],['sombra','The Shadow']]:[['posadera','La posadera'],['viajero','El viajero'],['sombra','La Sombra']];
const READ_ES={camino:'<p><em>La nieve cae sin prisa. Al final del camino, una posada de piedra enciende cuatro ventanas.</em></p><p>@Dir[effect|g~campana]{Campana}  @Dir[motif|tension~@]{Tensión}  @Dir[ambient|@~dim]{Penumbra}</p>',
 sala:'<p><em>El fuego crepita. Nadie habla cuando entráis.</em></p><p>@Dir[effect|g~puerta]{Puerta}  @Dir[motif|esperanza~@]{Esperanza}</p>',
 bodega:'<p><em>Los barriles huelen a vino viejo. Algo se mueve tras la trampilla.</em></p><p>@Dir[effect|g~trueno]{Trueno lejano}  @Dir[ambient|@~dark]{Oscuridad}</p>'};
const READ_EN={camino:'<p><em>Snow falls without hurry. At the end of the road, a stone inn lights four windows.</em></p><p>@Dir[effect|g~campana]{Bell}  @Dir[motif|tension~@]{Tension}  @Dir[ambient|@~dim]{Dim}</p>',
 sala:'<p><em>The fire crackles. No one speaks when you walk in.</em></p><p>@Dir[effect|g~puerta]{Door}  @Dir[motif|esperanza~@]{Hope}</p>',
 bodega:'<p><em>The barrels smell of old wine. Something moves behind the trapdoor.</em></p><p>@Dir[effect|g~trueno]{Distant thunder}  @Dir[ambient|@~dark]{Darkness}</p>'};
const READ=()=>EN()?READ_EN:READ_ES;
const mark=(kind,slug)=>({[ID]:{example:slug,kind}});
/** Crea escenas, actores, lista de reproducción y diarios del paquete de ejemplo y lo importa. */
export async function installExample(){
 const have=(coll,slug)=>coll.find(d=>d.getFlag(ID,'example')===slug);
 let pl=game.playlists.find(p=>p.getFlag(ID,'example')==='lista');
 if(!pl)pl=await Playlist.create({name:EN()?'MR- Dirección · Raven Inn (example)':'MR- Dirección · Posada (ejemplo)',flags:{[ID]:{example:'lista'}},mode:-1,sorting:'m'});
 const sounds=SOUNDS().filter(([k])=>!have(pl.sounds,k)).map(([k,name,repeat])=>({name,path:`${BASE}/audio/${k}.ogg`,repeat,volume:.3,flags:{[ID]:{example:k}}}));
 if(sounds.length)await pl.createEmbeddedDocuments('PlaylistSound',sounds);
 const type=(game.documentTypes?.Actor??[]).find(t=>t!=='base')??'base';
 for(const [k,name] of ACTORS())if(!have(game.actors,k))await Actor.create({name,type,img:`${BASE}/assets/${k}.webp`,prototypeToken:{texture:{src:`${BASE}/assets/${k}.webp`}},flags:mark('actor',k)});
 for(const [k] of SCENES())if(!have(game.journal,'lectura-'+k))await JournalEntry.create({name:(EN()?'Read-aloud · ':'Lectura · ')+SCENES().find(s=>s[0]===k)[1],pages:[{name:EN()?'Read-aloud':'Lectura',type:'text',text:{content:READ()[k],format:1}}],flags:mark('journal','lectura-'+k)});
 for(const [k,name] of SCENES())if(!have(game.scenes,k))await Scene.create({name,background:{src:`${BASE}/assets/${k}.webp`},thumb:`${BASE}/assets/${k}-thumb.webp`,width:1600,height:900,padding:0,grid:{type:0,size:100},tokenVision:false,fog:{exploration:false},flags:mark('scene',k)});
 const pack=await (await fetch(`${BASE}/${EN()?'pack.en.json':'pack.json'}`)).json();
 return importPack(pack);
}
