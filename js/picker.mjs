import {ID} from './store.mjs';
import {E} from './core/ids.mjs';
import {L} from './ui.mjs';
/** Selector rápido de sonido: busca entre todas las listas de reproducción (con ▶ para oír) o elige un archivo. Devuelve una ref o null. */
export async function pickSound({title}){
 const {DialogV2}=foundry.applications.api;let chosen=null,preview=null;
 const stop=()=>{try{preview?.stop();}catch{}preview=null;};
 const groups=game.playlists.contents.filter(p=>!p.getFlag(ID,'managed')).map(p=>({name:p.name,sounds:p.sounds.contents.filter(s=>s.path)})).filter(g=>g.sounds.length);
 const rows=groups.map(g=>`<section class="mrd-pick-group"><h4>${E(g.name)}</h4>${g.sounds.map(s=>`<div class="mrd-pick-row" data-uuid="${s.uuid}" data-q="${E((g.name+' '+s.name).toLowerCase())}"><button type="button" class="mrd-pick-play" data-path="${E(s.path)}" title="${E(L('Ed.Test'))}" aria-label="${E(L('Ed.Test'))}"><i class="fa-solid fa-play" aria-hidden="true"></i></button><button type="button" class="mrd-pick-name">${E(s.name)}</button></div>`).join('')}</section>`).join('');
 const content=`<div class="mrd-picker"><input type="search" class="mrd-pick-q" placeholder="${E(L('Pick.Search'))}" autofocus><div class="mrd-pick-list">${rows||`<p class="mrd-hint">${E(L('Pick.None'))}</p>`}</div></div>`;
 const result=await DialogV2.wait({
  window:{title,icon:'fa-solid fa-music'},position:{width:440},content,rejectClose:false,
  buttons:[{action:'file',label:L('Pick.File'),icon:'fa-solid fa-folder-open'},{action:'cancel',label:L('Cancel'),icon:'fa-solid fa-xmark',default:true}],
  render:(event,dialog)=>{
   const root=dialog.element;const q=root.querySelector('.mrd-pick-q');
   q?.addEventListener('input',()=>{const t=q.value.trim().toLowerCase();for(const g of root.querySelectorAll('.mrd-pick-group')){let any=false;for(const r of g.querySelectorAll('.mrd-pick-row')){const ok=!t||r.dataset.q.includes(t);r.hidden=!ok;any||=ok;}g.hidden=!any;}});
   root.addEventListener('click',async e=>{
    const play=e.target.closest('.mrd-pick-play');
    if(play){stop();try{await game.audio.unlock;preview=await foundry.audio.AudioHelper.play({src:play.dataset.path,volume:.5,loop:false},false);}catch(err){console.warn(`${ID} | vista previa`,err);}return;}
    const row=e.target.closest('.mrd-pick-name')?.closest('.mrd-pick-row');
    if(row){chosen={uuid:row.dataset.uuid};dialog.close();}
   });
  }
 });
 stop();
 if(chosen)return chosen;
 if(result!=='file')return null;
 return new Promise(resolve=>{
  let done=false;const fin=v=>{if(!done){done=true;resolve(v);}};
  const fp=new foundry.applications.apps.FilePicker.implementation({type:'audio',callback:p=>fin(p?{src:p}:null)});
  const close=fp.close.bind(fp);fp.close=async o=>{fin(null);return close(o);};fp.render(true);
 });
}
