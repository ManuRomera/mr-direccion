/** Paquete de dirección: JSON versionado con validación y normalización. Lógica pura. */
export const SCHEMA=1;
export const AMBIENT_KEYS=['light','dim','dark'];
const UUID=/^(Compendium\.|[A-Z][A-Za-z]+\.[A-Za-z0-9]{16})/;
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const str=(v,d='')=>typeof v==='string'?v:d;
const num=(v,d,min,max)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):d;};
/** Ref: {uuid} | {src} | {flag:[scope,key,value]} | {name} | {sceneFlag:[scope,key]}. Una cadena se interpreta como uuid o como ruta de archivo. */
export function normalizeRef(r){
 if(typeof r==='string'&&r)return UUID.test(r)?{uuid:r}:{src:r};
 if(!isObj(r))return null;
 if(typeof r.uuid==='string'&&r.uuid)return {uuid:r.uuid};
 if(typeof r.src==='string'&&r.src)return {src:r.src};
 if(Array.isArray(r.flag)&&r.flag.length===3)return {flag:r.flag.map(String)};
 if(Array.isArray(r.sceneFlag)&&r.sceneFlag.length===2)return {sceneFlag:r.sceneFlag.map(String)};
 if(typeof r.name==='string'&&r.name)return {name:r.name};
 return null;
}
export const DEFAULT_MOTIFS=Object.freeze([['batalla','Batalla','Battle','swords'],['tension','Tensión','Tension','eye'],['persecucion','Persecución','Chase','person-running'],['sigilo','Sigilo','Stealth','user-secret'],['horror','Horror','Horror','ghost'],['duelo','Duelo','Mourning','cross'],['esperanza','Esperanza','Hope','dove'],['misterio','Misterio','Mystery','magnifying-glass']]);
function cue(c,i,w){
 if(!isObj(c)){w.push(`cue ${i}: no es un objeto`);return null;}
 const sound=normalizeRef(c.sound);if(!sound){w.push(`cue ${i}: falta sound`);return null;}
 return {label:str(c.label),icon:str(c.icon,'wave-square'),sound};
}
function sceneCfg(s,i,w,ids){
 const p=`scenes[${i}]`;if(!isObj(s)){w.push(`${p}: no es un objeto`);return null;}
 const ref=normalizeRef(s.ref);if(!ref){w.push(`${p}.ref: falta (uuid, flag o name)`);return null;}
 const st=isObj(s.stage)?s.stage:{};
 const anchors=(Array.isArray(st.anchors)?st.anchors:[]).filter(a=>Array.isArray(a)&&a.length===2&&a.every(Number.isFinite)).map(a=>[num(a[0],.5,0,1),num(a[1],.9,0,1)]);
 if(s.ambient!=null&&!AMBIENT_KEYS.includes(s.ambient))w.push(`${p}.ambient: «${s.ambient}» no válido`);
 return {ref,order:num(s.order,i,-9999,9999),name:str(s.name),reading:normalizeRef(s.reading),music:normalizeRef(s.music),
  motifs:Array.isArray(s.motifs)?s.motifs.map(String):null,cues:(Array.isArray(s.cues)?s.cues:[]).map((c,k)=>cue(c,k,w)).filter(Boolean),
  ambient:AMBIENT_KEYS.includes(s.ambient)?s.ambient:null,
  figures:(Array.isArray(s.figures)?s.figures:[]).map(f=>({ref:normalizeRef(f?.ref??f),label:str(f?.label)})).filter(f=>f.ref),
  handouts:(Array.isArray(s.handouts)?s.handouts:[]).map(h=>({ref:normalizeRef(h?.ref??h),label:str(h?.label)})).filter(h=>h.ref),
  notes:str(s.notes),thumb:str(s.thumb),stage:{eye:num(st.eye,.5,0,1),anchors}};
}
export function normalizeSettings(raw){
 const s=isObj(raw)?raw:{},m=isObj(s.markers)?s.markers:{};
 const seen=new Set(),uniq=(a,k)=>a.filter(x=>x&&x.id&&!seen.has(k+x.id)&&seen.add(k+x.id));
 return {fade:s.fade==null?null:num(s.fade,3.5,.3,10),
  motifs:uniq((Array.isArray(s.motifs)?s.motifs:[]).map(x=>isObj(x)&&x.id?{id:String(x.id),label:str(x.label,String(x.id)),icon:str(x.icon,'music'),music:normalizeRef(x.music)}:null),'m'),
  effects:uniq((Array.isArray(s.effects)?s.effects:[]).map(x=>isObj(x)&&x.id&&normalizeRef(x.sound)?{id:String(x.id),label:str(x.label),icon:str(x.icon,'wave-square'),sound:normalizeRef(x.sound)}:null),'e'),
  markers:{milestones:uniq((Array.isArray(m.milestones)?m.milestones:[]).map(x=>isObj(x)&&x.id?{id:String(x.id),label:str(x.label,String(x.id))}:null),'h'),
   clocks:uniq((Array.isArray(m.clocks)?m.clocks:[]).map(x=>isObj(x)&&x.id?{id:String(x.id),label:str(x.label,String(x.id)),segments:Math.round(num(x.segments,6,2,12))}:null),'c')}};
}
export const normalizeSceneConfig=(s,w=[])=>sceneCfg(s,0,w,new Set());
/** Migra a la versión actual (hoy solo existe la 1). */
export function migratePack(raw){
 if(!isObj(raw))throw new Error('El paquete debe ser un objeto JSON');
 if(raw.schema===undefined)return {...raw,schema:SCHEMA};
 if(!Number.isInteger(raw.schema)||raw.schema<1)throw new Error('schema no válido');
 if(raw.schema>SCHEMA)throw new Error(`El paquete usa el esquema ${raw.schema}; este módulo entiende hasta el ${SCHEMA}. Actualiza MR- Dirección.`);
 return raw;
}
export function validatePack(raw){
 const errors=[],warnings=[];let src;
 try{src=migratePack(typeof raw==='string'?JSON.parse(raw):raw);}catch(e){return {ok:false,errors:[e.message],warnings,pack:null};}
 if(!str(src.id))errors.push('id: falta');
 if(!Array.isArray(src.scenes))errors.push('scenes: debe ser una lista');
 const settings=normalizeSettings(src.settings),scenes=(Array.isArray(src.scenes)?src.scenes:[]).map((s,i)=>sceneCfg(s,i,warnings));
 const known=new Set(settings.motifs.map(m=>m.id));
 scenes.forEach((s,i)=>{if(!s){errors.push(`scenes[${i}]: no válida`);return;}for(const m of s.motifs??[])if(!known.has(m))warnings.push(`scenes[${i}].motifs: «${m}» no está definido en settings.motifs`);});
 if(errors.length)return {ok:false,errors,warnings,pack:null};
 return {ok:true,errors,warnings,pack:{schema:SCHEMA,id:String(src.id),title:str(src.title,String(src.id)),version:str(src.version,'1.0.0'),author:str(src.author),license:str(src.license),settings,scenes}};
}
/** ¿Esta escena (con sus datos) coincide con la ref? Se usa tanto en runtime como en tests. */
export function sceneMatches(ref,scene){
 if(ref.uuid)return scene.uuid===ref.uuid;
 if(ref.flag)return String(scene.flags?.[ref.flag[0]]?.[ref.flag[1]])===ref.flag[2];
 if(ref.name)return scene.name===ref.name;
 return false;
}
