// Keep component provenance before any clone/detach can replace inherited IDs.
const {capture,snapshots,signature,clean}=require('./snapshot');
const {buildSchema}=require('./schema');

function relativeId(id,rootId,instance) {
  if(id===rootId)return '$';
  const prefix='I'+rootId+';';
  if(instance)return id.startsWith(prefix)?id.slice(prefix.length):null;
  return id.replace(/^I/,'');
}
function identify(tree,rootId,mainId,instance) {
  tree.origin={mainId,path:relativeId(tree.id,rootId,instance)};
  if(tree.origin.path)tree.roleId='origin:'+mainId+':'+tree.origin.path;
  tree.children.forEach(child=>identify(child,rootId,mainId,instance));
}
async function collect(roots,base,cancelled) {
  figma.skipInvisibleInstanceChildren=false;
  const mains=roots.every(n=>n.type==='INSTANCE')?await Promise.all(roots.map(n=>n.getMainComponentAsync())):[];
  const main=mains[0];
  if(!main||main.remote||mains.some(n=>!n||n.id!==main.id))return snapshots(roots,cancelled);
  const staged=[];
  try {
    const trees=[];
    for(const node of roots) {
      const tree=await capture(node,{count:0,cancelled});identify(tree,node.id,main.id,true);trees.push(tree);
    }
    const source=await capture(main,{count:0,cancelled});identify(source,main.id,main.id,false);
    if(cancelled&&cancelled())throw new Error('Выделение изменилось. Повтори анализ.');
    const template=main.clone();staged[base]=template;template.visible=false;
    figma.currentPage.appendChild(template);template.x=-100000;template.y=-100000;
    return {trees,staged,common:{source,main,signature:signature(source)}};
  }catch(error){clean(staged);throw error;}
}
function schemaFor(input,base) {
  if(!input.common)return buildSchema(input.trees,base);
  // The complete source component, including hidden slots, owns canonical order.
  const templateOwner=input.trees.length;
  const schema=buildSchema(input.trees.concat(input.common.source),templateOwner);
  schema.templateOwner=templateOwner;schema.commonSource=input.common.main;
  schema.conflicts.push({kind:'provenance',severity:'info',message:'Все плашки — инстансы одного компонента. Слои сопоставлены по исходным ID; скрытые слои и существующие Component Properties сохраняются.'});
  // Unknown ID formats must never silently fall back to fuzzy matching here.
  schema.flat.forEach(role=>role.members.forEach(member=>{
    if(member&&member.origin&&!member.origin.path)schema.conflicts.push({kind:'provenance',severity:'error',message:'Не удалось определить исходный путь слоя «'+member.name+'»',path:member.path});
  }));
  return schema;
}
module.exports={collect,schemaFor,relativeId,identify};
