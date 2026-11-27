/** Explorador de archivos de Foundry que deja elegir varias imágenes de golpe: cada clic marca o desmarca una, «Todas las de la carpeta»
 *  marca la carpeta entera y la selección se conserva al cambiar de carpeta. Al confirmar llama a `onPick(rutas)`. */
import {L} from './ui.mjs';
import {E} from './core/ids.mjs';
let Picker=null;
function makeClass(){
 const Base=foundry.applications.apps.FilePicker.implementation;
 return class MultiImagePicker extends Base{
  static DEFAULT_OPTIONS={classes:['mrd-multipick'],
   actions:{pickFile:MultiImagePicker.#toggle,mrdAll:MultiImagePicker.#all,mrdNone:MultiImagePicker.#none},form:{handler:MultiImagePicker.#submit}};
  constructor(options={}){super(options);this.picked=new Set();this.onPick=options.onPick??(()=>{});}
  static #toggle(_e,row){const p=row.dataset.path;if(this.picked.has(p))this.picked.delete(p);else this.picked.add(p);this.mark();}
  static #all(){for(const li of this.element.querySelectorAll('li.file[data-path]'))this.picked.add(li.dataset.path);this.mark();}
  static #none(){this.picked.clear();this.mark();}
  static async #submit(){
   if(!this.picked.size){const v=this.element.querySelector('input[name=file]')?.value;if(v)this.picked.add(v);}
   if(!this.picked.size)return ui.notifications.warn(L('Pick.NoneSelected'));
   await this.onPick([...this.picked]);await this.close();
  }
  mark(){
   const el=this.element;if(!el)return;
   for(const li of el.querySelectorAll('li.file[data-path]'))li.classList.toggle('picked',this.picked.has(li.dataset.path));
   const n=this.picked.size,c=el.querySelector('.mrd-multibar output');if(c)c.textContent=L('Pick.Count',{n});
   const b=el.querySelector('.form-footer button[type=submit]');if(b){b.disabled=!n&&!el.querySelector('input[name=file]')?.value;const s=b.querySelector('span')??b;s.textContent=L('Pick.LinkN',{n});}
  }
  async _onRender(context,options){
   await super._onRender(context,options);
   const el=this.element;if(!el.querySelector('.mrd-multibar')){
    const bar=document.createElement('div');bar.className='mrd-multibar';
    bar.innerHTML=`<p class="hint">${E(L('Pick.MultiHint'))}</p><div class="mrd-multirow"><output></output><button type="button" data-action="mrdAll"><i class="fa-solid fa-check-double" inert></i> ${E(L('Pick.AllFolder'))}</button><button type="button" data-action="mrdNone"><i class="fa-solid fa-xmark" inert></i> ${E(L('Pick.Clear'))}</button></div>`;
    (el.querySelector('.form-footer')??el.querySelector('.window-content'))?.before(bar);
   }
   this.mark();
  }
 };
}
/** Abre el explorador para elegir varias imágenes; `current` = carpeta donde empezar. */
export function pickImages({current='',onPick}){
 Picker??=makeClass();
 return new Picker({type:'image',current,onPick}).render({force:true});
}
