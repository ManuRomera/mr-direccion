import {ID,registerPack,importPack,exportPack,packs,sceneConfig,globalSettings} from './store.mjs';
import {dispatch} from './director.mjs';
import {validatePack,SCHEMA} from './core/schema.mjs';
import {convertTrono} from './core/trono.mjs';
import {installExample} from './example.mjs';
import {startTutorial} from './tutorial.mjs';
/** game.modules.get('mr-direccion').api */
export function buildApi(openEditor){
 return {version:game.modules.get(ID)?.version,schema:SCHEMA,registerPack,importPack,exportPack,packs,validatePack,dispatch,
  sceneConfig,globalSettings,openEditor,startTutorial,installExample,converters:{trono:convertTrono}};
}
