import {validatePack,sceneMatches,normalizeSettings,normalizeSceneConfig,SCHEMA} from './core/schema.mjs';
/** Configuración: flags de escena (viaja con la escena) + ajuste de mundo + paquetes registrados en memoria por otros módulos. */
export const ID='mr-direccion';
const registry=new Map();
export const packs=()=>[...registry.values()];
export function registerPack(raw){
 const v=validatePack(raw);if(!v.ok)throw new Error(`${ID} | paquete no válido: ${v.errors.join('; ')}`);
 registry.set(v.pack.id,v.pack);reindex();Hooks.callAll('mrDireccion.packRegistered',v.pack);return v.pack;
}
const byId=(a,b)=>{const m=new Map(a.map(x=>[x.id,x]));for(const x of b)m.set(x.id,x);return [...m.values()];};
export function mergeSettings(a,b){
 return {fade:b.fade??a.fade,motifs:byId(a.motifs,b.motifs),effects:byId(a.effects,b.effects),
  markers:{milestones:byId(a.markers.milestones,b.markers.milestones),clocks:byId(a.markers.clocks,b.markers.clocks)}};
}
export function globalSettings(){
 let s=normalizeSettings({});for(const p of registry.values())s=mergeSettings(s,p.settings);
 return mergeSettings(s,normalizeSettings(game.settings.get(ID,'global')));
}
export async function saveGlobal(patch){
 const cur=normalizeSettings(game.settings.get(ID,'global'));
 return game.settings.set(ID,'global',normalizeSettings({...cur,...patch}));
}
const sceneData=s=>({uuid:s.uuid,name:s.name,flags:s.flags});
/** Índice de las escenas de los paquetes registrados (se reconstruye al registrar): evita recorrerlos entero en cada consulta. */
let index={uuid:new Map(),name:new Map(),flags:new Map()};
function reindex(){
 index={uuid:new Map(),name:new Map(),flags:new Map()};
 for(const p of registry.values())for(const c of p.scenes){
  const r=c.ref;
  if(r.uuid)index.uuid.set(r.uuid,c);
  else if(r.flag){const k=r.flag[0]+'\0'+r.flag[1];if(!index.flags.has(k))index.flags.set(k,new Map());index.flags.get(k).set(r.flag[2],c);}
  else if(r.name)index.name.set(r.name,c);
 }
}
export function sceneConfig(scene){
 if(!scene)return null; // acciones sin escena (parar audio, volumen, opciones de figuras…)
 const f=scene.getFlag?.(ID,'config');
 if(f)return normalizeSceneConfig(f);
 if(!registry.size)return null;
 const byUuid=index.uuid.get(scene.uuid);if(byUuid)return byUuid;
 for(const [k,vals] of index.flags){const [scope,key]=k.split('\0');const hit=vals.get(String(scene.flags?.[scope]?.[key]));if(hit)return hit;}
 return index.name.get(scene.name)??null;
}
export function configuredScenes(){
 return game.scenes.contents.map(s=>({scene:s,cfg:sceneConfig(s)})).filter(x=>x.cfg).sort((a,b)=>a.cfg.order-b.cfg.order||a.scene.name.localeCompare(b.scene.name));
}
export const saveSceneConfig=(scene,cfg)=>scene.setFlag(ID,'config',{...cfg,ref:{uuid:scene.uuid}});
export const clearSceneConfig=scene=>scene.unsetFlag(ID,'config');
/** Importa un paquete: ajustes al mundo y cada escena que encaje con su ref recibe su configuración. */
export async function importPack(raw,{replace=false}={}){
 const v=validatePack(raw);if(!v.ok)throw new Error(v.errors.join('; '));
 const {pack}=v,done=[],missing=[];
 await saveGlobal(replace?pack.settings:mergeSettings(normalizeSettings(game.settings.get(ID,'global')),pack.settings));
 for(const c of pack.scenes){
  const scene=game.scenes.contents.find(s=>sceneMatches(c.ref,sceneData(s)));
  if(!scene){missing.push(c.name||JSON.stringify(c.ref));continue;}
  await saveSceneConfig(scene,c);done.push(scene.name);
 }
 Hooks.callAll('mrDireccion.packImported',pack,{done,missing});return {pack,done,missing,warnings:v.warnings};
}
export function exportPack(title='MR- Dirección'){
 const scenes=configuredScenes().map(({scene,cfg})=>({...cfg,ref:{uuid:scene.uuid},name:cfg.name||scene.name}));
 return {schema:SCHEMA,id:'export-'+(game.world?.id??'mundo'),title,version:'1.0.0',author:game.user.name,license:'',settings:globalSettings(),scenes};
}
