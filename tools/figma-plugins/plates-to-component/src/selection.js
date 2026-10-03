const {inside}=require('./util');
function selection() {
  const roots=figma.currentPage.selection.slice();const errors=[];
  if(roots.length<2)errors.push('Выдели минимум две плашки');
  if(roots.some(n=>!['FRAME','COMPONENT','INSTANCE'].includes(n.type)))errors.push('Поддерживаются только Frame, Component и Instance');
  roots.forEach(n=>{
    if(n.type==='COMPONENT'&&n.remote)errors.push('Библиотечный Component доступен только для чтения');
    if(inside(n.parent,roots))errors.push('Выделение содержит плашку и её потомка');
    for(let p=n.parent;p&&p.type!=='PAGE';p=p.parent)if(['INSTANCE','COMPONENT','COMPONENT_SET'].includes(p.type)){errors.push('«'+n.name+'»: плашка внутри компонента/инстанса. Выдели внешний Frame.');break;}
    if(!n.parent || typeof n.parent.insertChild!=='function')errors.push('Нельзя заменить «'+n.name+'» в его родителе');
  });
  return {roots,errors:Array.from(new Set(errors)),key:roots.map(n=>n.id).join('|')};
}
async function externalInstances(roots) {
  const external=[];
  for(const component of roots.filter(n=>n.type==='COMPONENT'))for(const instance of await component.getInstancesAsync())if(!inside(instance,roots))external.push({node:instance,component});
  const seen=new Set();return external.filter(e=>{if(seen.has(e.node.id))return false;seen.add(e.node.id);return true;});
}
module.exports={selection,externalInstances};
