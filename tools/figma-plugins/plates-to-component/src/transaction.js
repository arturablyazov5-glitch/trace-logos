const {clean,signature,placement,capture}=require('./snapshot');
const {collect,schemaFor}=require('./input');
const {prepare,restore}=require('./component');
const {checkGrid}=require('./grid');
const {applyTree,auditTree}=require('./overrides');
const {externalInstances}=require('./selection');
const {children,errorText,equal,pause,workSteps}=require('./util');
const {visual,verifyExternal}=require('./plan');
async function commit(roots,plan,onProgress=()=>{},hooks={}) {
  const positions=roots.map(placement),created=[],backups=[],swapped=[],moved=[];let staged=[];let outputs=[];let finalized=false;const selectedInstances=[];
  try {
    for(let i=0;i<roots.length;i++)if(roots[i].type==='INSTANCE')selectedInstances.push({index:i,main:await roots[i].getMainComponentAsync(),before:await capture(roots[i])});
    onProgress('Повторная проверка');const snap=await collect(roots,plan.base);staged=snap.staged;
    if(snap.trees.some((t,i)=>signature(t)!==plan.signatures[i]))throw new Error('Макет изменился после анализа. Выполни анализ ещё раз.');
    if((snap.common?.signature||null)!==plan.commonSignature)throw new Error('Исходный компонент изменился после анализа. Повтори анализ.');
    const external=await externalInstances(roots);if(external.map(e=>e.node.id).sort().join('|')!==plan.external.map(e=>e.node.id).sort().join('|'))throw new Error('Связи компонентов изменились после анализа. Повтори анализ.');
    const schema=schemaFor(snap,plan.base);if(schema.conflicts.some(c=>c.severity==='error'))throw new Error('В новом анализе обнаружен конфликт');
    onProgress('Создание компонента');const prepared=await prepare(schema,staged,plan.base,created,{mainOnly:true});outputs=prepared.outputs;staged[plan.base]=null;if(prepared.failures.length)throw new Error(prepared.failures.join('\n'));
    // Recovery clones preserve FRAME / COMPONENT / INSTANCE types and all original properties.
    for(let i=0;i<roots.length;i++){const backup=roots[i].clone();backups.push(backup);backup.visible=false;figma.currentPage.appendChild(backup);backup.x=-180000-i*2000;backup.y=-180000;await pause();}
    for(const entry of external) {
      const before=await capture(entry.node);swapped.push({entry,before,position:placement(entry.node)});entry.node.swapComponent(prepared.main);
      const after=await capture(entry.node),bv=visual(before),av=visual(after);bv.main=null;av.main=null;
      await pause();
      if(!verifyExternal(before,after))throw new Error('Изменились overrides внешнего инстанса «'+entry.node.name+'»');
    }
    if(hooks.afterSwaps)hooks.afterSwaps();
    onProgress('Размещение плашек');
    // Originals stay alive in an off-canvas holding frame until every replacement has been placed.
    const holding=figma.createFrame();created.push(holding);holding.name='Плашки: временная транзакция';holding.visible=false;holding.x=-200000;holding.y=-200000;
    // Replace one sibling at a time, keeping all sibling indexes stable. Create
    // each instance only when it is about to be placed, then copy on the canvas.
    for(let i=0;i<roots.length;i++) {
      if(i!==plan.base) {
        outputs[i]=prepared.main.createInstance();created.push(outputs[i]);
        outputs[i].visible=false;
      }
      holding.appendChild(roots[i]);moved.push(i);
      restore(outputs[i],positions[i]);
      await pause(120);
      if(i!==plan.base) {
        await applyTree(schema.root,outputs[i],i,true,workSteps(true));
        restore(outputs[i],positions[i],false);
        const failures=auditTree(schema.root,outputs[i],i,true);
        if(failures.length)throw new Error(failures.join('\n'));
      }
      if(hooks.afterPlacement)hooks.afterPlacement(i);
      await pause(120);
    }
    for(let i=0;i<roots.length;i++) {
      const output=prepared.outputs[i],p=positions[i].props;
      checkGrid(output,p);
      if(!equal(output.width,p.width)||!equal(output.height,p.height))throw new Error('Auto Layout изменил размер «'+roots[i].name+'»');
      if((!positions[i].parent.layoutMode||positions[i].parent.layoutMode==='NONE'||p.layoutPositioning==='ABSOLUTE')&&(!equal(output.x,p.x)||!equal(output.y,p.y)))throw new Error('Не сохранилось положение «'+roots[i].name+'»');
    }
    const anchor=prepared.main.absoluteBoundingBox || {x:prepared.main.x,y:prepared.main.y,width:prepared.main.width};
    prepared.helpers.forEach((n,i)=>{n.x=anchor.x+anchor.width+120+i*360;n.y=anchor.y;});
    if(hooks.beforeFinalize)hooks.beforeFinalize();
    // No fallible asynchronous operation is performed after final removal of originals.
    for(const node of roots)node.remove();finalized=true;
    clean(backups);holding.remove();
    const result=prepared.outputs.slice();
    try{figma.currentPage.selection=result;figma.viewport.scrollAndZoomIntoView(result);}catch(e){console.warn('plates-to-component: selection/viewport',e);}
    return {outputs:result,helpers:prepared.helpers.length};
  }catch(err) {
    const rollbackErrors=[];
    // Release occupied grid cells before originals are reinserted. Keep the new
    // component alive until external instances have been relinked to the old one.
    for(const output of outputs)try {
      if(output&&!output.removed){figma.currentPage.appendChild(output);output.visible=false;}
    }catch(e){rollbackErrors.push('Не удалось освободить место для отката: '+errorText(e));}
    // Restore components before relinking their external instances.
    for(const i of moved.slice().sort((a,b)=>positions[a].index-positions[b].index)) {
      try {const original=roots[i].removed?backups[i]:roots[i];restore(original,positions[i]);}catch(e){rollbackErrors.push(errorText(e));}
    }
    function recovery(tree){return {id:tree.roleId||'',sample:tree,members:[tree],children:tree.children.map(recovery),nestedRebuild:false};}
    for(const item of selectedInstances)try {
      const oldIndex=roots.indexOf(item.main);
      if(oldIndex>=0&&item.main.removed){
        const restored=roots[item.index].removed?backups[item.index]:roots[item.index];
        restored.swapComponent(backups[oldIndex]);await applyTree(recovery(item.before),restored,0,true);restore(restored,positions[item.index],false);
      }
    }catch(e){rollbackErrors.push(errorText(e));}
    for(const item of swapped.reverse())try {
      const index=roots.indexOf(item.entry.component);const old=item.entry.component.removed?backups[index]:item.entry.component;
      item.entry.node.swapComponent(old);
      await applyTree(recovery(item.before),item.entry.node,0,true);restore(item.entry.node,item.position,false);
    }catch(e){rollbackErrors.push(errorText(e));}
    clean(created.reverse());
    backups.forEach((n,i)=>{if(n&&!n.removed&&n!==roots[i]&&(!roots[i].removed||!moved.includes(i)))n.remove();});
    try{figma.currentPage.selection=roots.map((n,i)=>n.removed?backups[i]:n).filter(n=>n&&!n.removed);}catch(_){}
    const error=new Error(errorText(err)+(rollbackErrors.length?'\nПроблемы отката: '+rollbackErrors.join('; '):'\nИсходные плашки восстановлены.'));error.rollbackComplete=rollbackErrors.length===0;throw error;
  }finally {clean(staged);if(finalized)clean(backups);}
}
module.exports={commit};
