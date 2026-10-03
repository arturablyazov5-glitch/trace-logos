const {ROLE_KEY,children,copy,pause,workSteps}=require('./util');
const {placement}=require('./snapshot');
const {assign,restoreGrid}=require('./grid');
const {applyTree,auditTree}=require('./overrides');
function restore(node,position,insert=true) {
  const p=position.props;
  if(insert)position.parent.insertChild(Math.min(position.index,children(position.parent).length),node);
  for(const key of ['minWidth','maxWidth','minHeight','maxHeight','constraints','layoutAlign','layoutGrow','layoutPositioning'])assign(node,key,p[key]);
  restoreGrid(node,p);
  if(node.resizeWithoutConstraints)node.resizeWithoutConstraints(Math.max(.01,p.width),Math.max(.01,p.height));
  for(const key of ['layoutSizingHorizontal','layoutSizingVertical'])if(p[key]!==undefined&&key in node) {
    if(p[key]!=='FILL'||position.parent.layoutMode&&position.parent.layoutMode!=='NONE')assign(node,key,p[key]);
  }
  assign(node,'rotation',p.rotation);
  if(!position.parent.layoutMode||position.parent.layoutMode==='NONE'||p.layoutPositioning==='ABSOLUTE') {
    if(p.relativeTransform)assign(node,'relativeTransform',p.relativeTransform);else {assign(node,'x',p.x);assign(node,'y',p.y);}
  }
  assign(node,'visible',p.visible);
}
async function materialize(role,target,owner,created,helpers,inheritedLock=false,step=workSteps()) {
  await step();
  const source=role.members[owner]||role.sample;
  if(target.type==='INSTANCE' && role.nestedRebuild)target=target.detachInstance();
  const original=children(target);const mapping=new Map();
  role.children.forEach(r=>{const member=r.members[owner];if(member)mapping.set(r,original[member.index]);});
  const lockedStructure=inheritedLock || target.type==='INSTANCE';
  for(let i=0;i<role.children.length;i++) {
    const r=role.children[i];let child=mapping.get(r);let childOwner=owner;
    if(!child) {
      if(lockedStructure)throw new Error('Нельзя добавить слой внутрь неразобранного инстанса');
      child=r.sample.node.clone();created.push(child);childOwner=r.members.indexOf(r.sample);target.insertChild(i,child);child.visible=false;
    }else if(!lockedStructure)target.insertChild(i,child);
    child=await materialize(r,child,childOwner,created,helpers,lockedStructure,step);
    if(!r.members[owner])child.visible=false;
    child.setPluginData(ROLE_KEY,r.id);
  }
  target.setPluginData(ROLE_KEY,role.id);
  if(role.nestedRebuild) {
    const position=placement(target);figma.currentPage.appendChild(target);
    const helper=figma.createComponentFromNode(target);created.push(helper);helper.name=source.name+' / Общая структура';helper.visible=true;helper.x=-150000-helpers.length*2000;helper.y=-150000;helpers.push(helper);
    const instance=helper.createInstance();created.push(instance);restore(instance,position);instance.setPluginData(ROLE_KEY,role.id);role.helper=helper;return instance;
  }
  return target;
}
async function prepare(schema,staged,base,created=[],options={}) {
  const helpers=[];let template=staged[base];
  template=await materialize(schema.root,template,schema.templateOwner??base,created,helpers);template.visible=schema.root.members[base].props.visible;
  const main=schema.commonSource?template:figma.createComponentFromNode(template);created.push(main);main.name=schema.root.members[base].name;main.setPluginData(ROLE_KEY,schema.root.id);
  const outputs=[];const failures=[];
  if(schema.commonSource) {
    await applyTree(schema.root,main,base,true);
    failures.push(...auditTree(schema.root,main,base,true));
  }
  for(let i=0;i<(schema.templateOwner??staged.length);i++) {
    if(i===base){outputs[i]=main;continue;}
    if(options.mainOnly)continue;
    await pause();
    const instance=main.createInstance();created.push(instance);instance.x=-120000-i*2000;instance.y=-120000;
    try {await applyTree(schema.root,instance,i,true);failures.push(...auditTree(schema.root,instance,i,true));}
    catch(err){failures.push(err.message||String(err));}
    if(options.discardInstances){instance.remove();created.pop();}
    else outputs[i]=instance;
  }
  // Hidden additions must leave the base visually identical, including Auto Layout geometry.
  failures.push(...auditTree(schema.root,main,base,true));
  return {main,outputs,helpers,created,failures:Array.from(new Set(failures))};
}
module.exports={restore,materialize,prepare};
