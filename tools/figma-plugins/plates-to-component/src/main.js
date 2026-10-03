const {selection}=require('./selection');
const {analyze}=require('./plan');
const {commit}=require('./transaction');
figma.skipInvisibleInstanceChildren=false;
figma.showUI(__html__,{width:360,height:260});
let generation=0,working=false;
function send(type,data={}){figma.ui.postMessage(Object.assign({type},data));}
function selectionHint(state) {
  if(state.roots.length<2)return 'Выдели две или больше похожих плашек.';
  if(state.roots.some(n=>!['FRAME','COMPONENT','INSTANCE'].includes(n.type)))return 'Выдели плашки целиком, без отдельных слоёв.';
  return 'Выдели отдельные плашки одного уровня.';
}
function update(){generation++;const state=selection();if(!working)send('selection',{ready:state.errors.length===0,message:state.errors.length?selectionHint(state):''});}
figma.on('selectionchange',update);figma.on('currentpagechange',update);
figma.ui.onmessage=async msg=>{
  if(!msg||typeof msg.type!=='string')return;
  if(msg.type==='open-url'){if(typeof msg.url==='string'&&/^https:\/\/(trace-logos\.ru|app\.lava\.top)\//.test(msg.url))figma.openExternal(msg.url);return;}
  if(msg.type==='ready'){if(!working)update();return;}
  if(msg.type==='resize'){if(Number.isFinite(msg.height))figma.ui.resize(360,Math.max(180,Math.min(850,msg.height)));return;}
  if(msg.type==='close'){if(!working)figma.closePlugin();return;}
  if(working||msg.type!=='convert')return;
  const state=selection();if(state.errors.length){send('error',{message:selectionHint(state)});return;}
  const base=0;
  working=true;const token=generation;send('working');
  try {
    const plan=await analyze(state.roots,base,()=>{},()=>token!==generation);
    if(token!==generation||selection().key!==state.key)throw Object.assign(new Error('Выделение изменилось.'),{userMessage:'Выделение изменилось. Нажми «Собрать компонент» ещё раз.'});
    const conflicts=plan.conflicts.filter(c=>c.severity==='error');
    if(conflicts.length) {
      const error=new Error(conflicts.map(c=>c.message+(c.path?'\n'+c.path:'')).join('\n\n'));
      error.userMessage=conflicts.some(c=>c.kind==='font')?'Не удалось загрузить шрифт. Установи используемые шрифты и попробуй снова.':'Не удалось объединить эти плашки. Выбери плашки с похожим содержимым.';
      throw error;
    }
    await commit(state.roots,plan);
    send('success');figma.notify('Плашки собраны.');
  }catch(e){
    console.error('plates-to-component:',e);
    working=false;update();
    const message=e.rollbackComplete===false?'Не удалось завершить сборку. Отмени действие через ⌘Z.':e.rollbackComplete===true?'Не удалось собрать плашки. Исходные плашки восстановлены.':e.userMessage||'Не удалось собрать выбранные плашки. Попробуй другое выделение.';
    send('error',{message});
  }
  finally{working=false;}
};
update();
