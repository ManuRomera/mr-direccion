import {ID} from './store.mjs';
const KEY='tour';
class DirTour extends foundry.nue.Tour{
 async _preStep(){
  await super._preStep();const step=this.currentStep;
  // Un elemento que no existe (p. ej. aún no hay escenas configuradas) no debe romper el tour: el paso sale centrado.
  if(step.selector&&!document.querySelector(step.selector))step.selector='';
 }
}
export async function registerTutorial(){
 try{const file=game.i18n.lang?.startsWith('es')?'direccion.json':'direccion.en.json';game.tours.register(ID,KEY,await DirTour.fromJSON(`modules/${ID}/tours/${file}`));}
 catch(e){console.error(`${ID} | no se pudo registrar el tutorial`,e);}
}
export const startTutorial=()=>game.tours.get(`${ID}.${KEY}`)?.start();
export async function offerTutorial(){
 if(!game.user.isGM||game.settings.get(ID,'tutorialOffered'))return;
 await game.settings.set(ID,'tutorialOffered',true);
 const yes=await foundry.applications.api.DialogV2.confirm({window:{title:game.i18n.localize('MRDIR.Tour.OfferTitle'),icon:'fa-solid fa-graduation-cap'},content:`<p>${game.i18n.localize('MRDIR.Tour.OfferText')}</p>`,yes:{label:game.i18n.localize('MRDIR.Tour.Start'),icon:'fa-solid fa-graduation-cap'},no:{label:game.i18n.localize('MRDIR.Tour.Later')},rejectClose:false});
 if(yes)startTutorial();
}
