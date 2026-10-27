import test from 'node:test';import assert from 'node:assert/strict';
globalThis.Hooks={callAll(){}};
const {registerPack,sceneConfig}=await import('../js/store.mjs');
const scene=(o)=>({uuid:'Scene.'+(o.id??'x'),name:o.name??'',flags:o.flags??{},getFlag:()=>undefined});
test('paquete registrado: las escenas se enlazan por flag, uuid o nombre',()=>{
 registerPack({id:'p',scenes:[{ref:{flag:['mod','slug','a']},music:'a.ogg'},{ref:{uuid:'Scene.zzz'},music:'b.ogg'},{ref:{name:'Sala'},music:'c.ogg'}]});
 assert.equal(sceneConfig(scene({flags:{mod:{slug:'a'}}})).music.src,'a.ogg');
 assert.equal(sceneConfig(scene({id:'zzz'})).music.src,'b.ogg');
 assert.equal(sceneConfig(scene({name:'Sala'})).music.src,'c.ogg');
 assert.equal(sceneConfig(scene({name:'Otra',flags:{mod:{slug:'q'}}})),null);
});
test('regresión: acciones sin escena (parar audio, volumen, opciones) no lanzan con un paquete registrado',()=>{
 assert.equal(sceneConfig(undefined),null);assert.equal(sceneConfig(null),null);
});
