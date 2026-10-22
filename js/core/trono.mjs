/** Conversor de los archivos de dirección de «MR · El Trono de la Sed» (content/direction.json y stage.json) a paquete v1. */
const MOD='mr-trono-de-la-sed';
export function convertTrono({direction,stage={},motifs=[],effectLabels={},sceneNames={}}){
 const flag=(key,value)=>({flag:[MOD,key,value]});
 const scenes=direction.map((d,i)=>{
  const st=stage[d.slug]??{};
  return {ref:flag('slug',d.slug),order:i,name:sceneNames[d.slug]??'',reading:{sceneFlag:[MOD,'direction']},music:d.music?flag('slug',d.music):null,
   motifs:null,cues:(d.effects??[]).map(e=>({label:effectLabels[e]??'',icon:'wave-square',sound:flag('slug',e)})),ambient:null,
   figures:(d.actors??[]).map(a=>({ref:flag('slug',String(a).toLowerCase()),label:a})),handouts:[],notes:'',thumb:'',stage:{eye:st.eye??.5,anchors:st.anchors??[]}};
 });
 return {schema:1,id:'trono-de-la-sed',title:'MR · El Trono de la Sed',version:'1.0.0',author:'Manu Romera',license:'CC BY-NC-SA',
  settings:{fade:3.5,motifs:motifs.map(([id,label])=>({id,label,icon:'music',music:flag('slug',id)})),effects:[],markers:{milestones:[],clocks:[]}},scenes};
}
