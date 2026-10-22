import {ID} from './store.mjs';
import {toggleBar} from './director.mjs';
import {toggleMarkersPanel,renderMarkers} from './markers.mjs';
import {refreshDirector} from './director.mjs';
import {DEFAULT_FIGURES} from './figures-defaults.mjs';
export function registerSettings(EditorMenu){
 const S=(k,d)=>game.settings.register(ID,k,d);
 S('showBar',{name:'MRDIR.Set.ShowBar',hint:'MRDIR.Set.ShowBarHint',scope:'client',config:true,type:Boolean,default:true,onChange:refreshDirector});
 S('bg',{name:'MRDIR.Set.Bg',hint:'MRDIR.Set.BgHint',scope:'client',config:true,type:Boolean,default:true,onChange:refreshDirector});
 S('style',{name:'MRDIR.Set.Style',hint:'MRDIR.Set.StyleHint',scope:'client',config:true,type:String,default:'glass',choices:{glass:'MRDIR.Set.StyleGlass',classic:'MRDIR.Set.StyleClassic'},onChange:refreshDirector});
 S('fade',{name:'MRDIR.Set.Fade',hint:'MRDIR.Set.FadeHint',scope:'client',config:true,type:new foundry.data.fields.NumberField({min:0,max:10,step:.5,initial:0,nullable:false}),default:0});
 S('compact',{scope:'client',config:false,type:Boolean,default:false});
 S('pos',{scope:'client',config:false,type:Object,default:null});
 S('badgePos',{scope:'client',config:false,type:Object,default:null});
 S('editorState',{scope:'client',config:false,type:Object,default:{}});
 S('tutorialOffered',{scope:'client',config:false,type:Boolean,default:false});
 S('global',{scope:'world',config:false,type:Object,default:{},onChange:()=>renderMarkers()});
 S('mix',{scope:'world',config:false,type:Object,default:{level:.3,quiet:false}});
 S('figures',{scope:'world',config:false,type:Object,default:DEFAULT_FIGURES});
 S('markerState',{scope:'world',config:false,type:Object,default:{milestones:{},clocks:{}},onChange:()=>renderMarkers()});
 game.settings.registerMenu(ID,'editor',{name:'MRDIR.Set.Editor',label:'MRDIR.Set.EditorLabel',hint:'MRDIR.Set.EditorHint',icon:'fa-solid fa-pen-ruler',type:EditorMenu,restricted:true});
 const K=foundry.helpers?.interaction?.KeyboardManager?.MODIFIER_KEYS?.ALT??'Alt';
 const key=(id,code,fn)=>game.keybindings.register(ID,id,{name:`MRDIR.Key.${id}`,editable:[{key:code,modifiers:[K]}],restricted:true,onDown:()=>{fn();return true;}});
 key('bar','KeyB',toggleBar);key('markers','KeyH',()=>toggleMarkersPanel());
}
