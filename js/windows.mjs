/** Ventanas que caben en cualquier pantalla (estándar «mr-pantallas»): cada ventana `.mrd-win` se escala en proporción a la pantalla, nunca se sale
 *  y se desplaza por dentro si no cabe (tope y scroll en el CSS). El ajuste «Tamaño de las ventanas» fija una escala propia en vez de la automática. */
import {ID} from './store.mjs';
import {windowScale} from './core/windows.mjs';
const ours=app=>Boolean(app?.element?.classList?.contains('mrd-win'));
export function fitWindow(app){
 if(!ours(app)||!app.rendered||app.minimized)return;
 const el=app.element,doc=document.documentElement;
 const hotbar=parseFloat(getComputedStyle(document.body).getPropertyValue('--hotbar-height'))||0; // Foundry deja libre 1,5 veces su alto bajo las ventanas
 const view={width:doc.clientWidth,height:doc.clientHeight-1.5*hotbar,total:doc.clientHeight};
 const first=!app._mrdFitted;app._mrdFitted=true;
 const ask=app.options?.position??{},now=app.position??{};
 const pick=(asked,has,measure)=>first&&Number.isFinite(asked)?asked:Number.isFinite(has)?has:measure();
 const width=pick(ask.width,now.width,()=>el.offsetWidth);
 const height=pick(ask.height,now.height,()=>{const cap=el.style.maxHeight;el.style.maxHeight='none';const h=el.offsetHeight;el.style.maxHeight=cap;return h;});
 const scale=windowScale(width,height,view,Number(game.settings.get(ID,'windowScale'))||0);
 el.style.setProperty('--mrd-win-scale',String(scale));
 if(!first&&Math.abs((now.scale??1)-scale)<.004)return;
 const change={scale};if(first&&Number.isFinite(ask.width))change.width=ask.width;if(first&&Number.isFinite(ask.height))change.height=ask.height;
 app.setPosition(change);
}
let wait=0;
export function refitWindows(){clearTimeout(wait);wait=setTimeout(()=>{for(const app of foundry.applications.instances.values())fitWindow(app);},150);}
export function registerWindows(){
 game.settings.register(ID,'windowScale',{name:'MRDIR.Set.WinScale',hint:'MRDIR.Set.WinScaleHint',scope:'client',config:true,type:Number,default:0,range:{min:0,max:150,step:5},onChange:refitWindows});
 Hooks.on('renderApplicationV2',fitWindow);window.addEventListener('resize',refitWindows);
}
