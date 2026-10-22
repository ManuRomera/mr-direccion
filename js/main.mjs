import {ID} from './store.mjs';
import {registerSettings} from './settings.mjs';
import {setupDirector,dispatch} from './director.mjs';
import {setupMarkers} from './markers.mjs';
import {registerFigureHooks} from './figures.mjs';
import {registerTutorial,offerTutorial} from './tutorial.mjs';
import {buildApi} from './api.mjs';
import {DirectionEditor,openEditor,EditorMenu} from './editor.mjs';
Hooks.once('init',()=>{
 registerSettings(EditorMenu);registerFigureHooks();
 game.modules.get(ID).api=buildApi(openEditor);
 // @Dir[accion|argumento]{etiqueta}: pista clicable en diarios (solo GM). «@» = escena actual.
 const enrichers=CONFIG.TextEditor?.enrichers;
 if(enrichers){
  enrichers.push({id:ID,pattern:/@Dir\[([^|\]]+)\|([^\]]*)\](?:\{([^}]+)\})?/g,enricher:async m=>{
   const a=document.createElement('a');if(!game.user.isGM){a.textContent=m[3]??m[1];return a;}
   a.className='mrd-cue';a.dataset.mrdAction=m[1];a.dataset.mrdArg=m[2];a.setAttribute('role','button');a.tabIndex=0;a.textContent=m[3]??m[1];return a;
  }});
  const act=e=>{const a=e.target.closest?.('.mrd-cue');if(!a)return;if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;e.preventDefault();e.stopPropagation();dispatch(a.dataset.mrdAction,a.dataset.mrdArg).catch(console.error);};
  document.addEventListener('click',act,true);document.addEventListener('keydown',act,true);
 }
});
Hooks.once('ready',async()=>{
 await registerTutorial();setupDirector();setupMarkers();
 Hooks.callAll('mrDireccion.ready',game.modules.get(ID).api);
 setTimeout(offerTutorial,2500);
});
