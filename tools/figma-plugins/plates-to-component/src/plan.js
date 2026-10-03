const {clean,signature,capture}=require('./snapshot');
const {collect,schemaFor}=require('./input');
const {externalInstances}=require('./selection');
const {prepare}=require('./component');
const {copy,equal}=require('./util');
const {match}=require('./matching');
function visual(tree) {
  const props=copy(tree.props);delete props.name;delete props.exportSettings;
  return {type:tree.type,props,text:tree.text,main:tree.main&&tree.main.id,children:tree.children.map(visual)};
}
function verifyExternal(before,after) {
  const bp=copy(before.props),ap=copy(after.props);delete bp.name;delete ap.name;
  if(before.type!==after.type || !equal(bp,ap) || !equal(before.text,after.text))return false;
  const result=match(before.children,after.children.map(sample=>({sample})));
  if(result.conflicts.length || result.matches.some(i=>i<0))return false;
  const used=new Set(result.matches);
  if(after.children.some((n,i)=>!used.has(i)&&n.props.visible!==false))return false;
  return before.children.every((n,i)=>verifyExternal(n,after.children[result.matches[i]]));
}
async function analyze(roots,base,onProgress=()=>{},cancelled) {
  let staged=[];const created=[];
  try {
    onProgress('Снимки плашек');const snap=await collect(roots,base,cancelled);staged=snap.staged;
    const signatures=snap.trees.map(signature);onProgress('Сопоставление слоёв');const schema=schemaFor(snap,base);
    const external=await externalInstances(roots);
    const problems=schema.conflicts.slice();
    if(!problems.some(c=>c.severity==='error')) {
      onProgress('Проверка overrides на копиях');const prepared=await prepare(schema,staged,base,created,{discardInstances:true});
      prepared.failures.forEach(message=>problems.push({kind:'override',severity:'error',message}));
      for(const entry of external) {
        onProgress('Проверка связанных инстансов');const temp=entry.node.clone();temp.visible=false;created.push(temp);
        const before=await capture(temp);temp.swapComponent(prepared.main);const after=await capture(temp);
        // Names/IDs are not visual evidence. Compare all captured appearance/layout/text fields.
        const bv=visual(before),av=visual(after);bv.main=null;av.main=null;
        if(!verifyExternal(before,after))problems.push({kind:'external',severity:'error',message:'«'+entry.node.name+'»: swapComponent не сохраняет все overrides внешнего инстанса. Старый компонент нельзя безопасно удалить.'});
        temp.remove();created.pop();
      }
      if(external.length&&!problems.some(c=>c.kind==='external'))problems.push({kind:'external',severity:'warning',message:'Связанные инстансы: '+external.length+'. Figma swapComponent проверен на копиях; перед удалением старых компонентов будут перенесены связи.'});
    }
    return {base,signatures,commonSignature:snap.common?.signature||null,external,conflicts:problems,summary:{selected:roots.length,instances:roots.length-1,components:1+schema.nested,added:schema.added,matched:schema.matched,replacedComponents:roots.filter(n=>n.type==='COMPONENT').length,replacedInstances:roots.filter(n=>n.type==='INSTANCE').length,external:external.length,ambiguous:problems.filter(c=>c.kind==='ambiguous').length,errors:problems.filter(c=>c.severity==='error').length},schema};
  }finally {clean(created.reverse());clean(staged);}
}
module.exports={analyze,visual,verifyExternal};
