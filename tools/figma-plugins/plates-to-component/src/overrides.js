const {copy,equal,children,ROLE_KEY,errorText,workSteps}=require('./util');
const {read}=require('./snapshot');
const {FIELDS:GRID_FIELDS,assign,restoreGrid}=require('./grid');
const OUTER=new Set(['x','y','layoutAlign','layoutGrow','layoutPositioning','constraints','layoutSizingHorizontal','layoutSizingVertical','gridRowAnchorIndex','gridColumnAnchorIndex','gridRowSpan','gridColumnSpan','gridChildHorizontalAlign','gridChildVerticalAlign']);
const SPECIAL=new Set(['width','height','x','y','name','boundVariables','explicitVariableModes','vectorNetwork','vectorPaths','booleanOperation','isMask','maskType']);
const ASYNC={fills:'setFillsAsync',strokes:'setStrokesAsync',fillStyleId:'setFillStyleIdAsync',strokeStyleId:'setStrokeStyleIdAsync',effectStyleId:'setEffectStyleIdAsync',textStyleId:'setTextStyleIdAsync',gridStyleId:'setGridStyleIdAsync',reactions:'setReactionsAsync'};
const RANGES={textStyleId:'setRangeTextStyleIdAsync',fontName:'setRangeFontName',fontSize:'setRangeFontSize',textCase:'setRangeTextCase',textDecoration:'setRangeTextDecoration',letterSpacing:'setRangeLetterSpacing',lineHeight:'setRangeLineHeight',fills:'setRangeFills',hyperlink:'setRangeHyperlink',listOptions:'setRangeListOptions',indentation:'setRangeIndentation',openTypeFeatures:'setRangeOpenTypeFeatures'};
const fontCache=new Map();
async function load(font) {const key=JSON.stringify(font);if(!fontCache.has(key))fontCache.set(key,figma.loadFontAsync(font).catch(e=>{fontCache.delete(key);throw e;}));await fontCache.get(key);}
async function text(source,target) {
  const value=source.text; if(!value)return;
  const fonts=value.fonts.concat(target.characters.length?target.getRangeAllFontNames(0,target.characters.length):(typeof target.fontName==='object'?[target.fontName]:[]));
  await Promise.all(fonts.map(load));
  const style=source.props.textStyleId;
  if(style!==undefined && !equal(read(target,'textStyleId'),style)) {
    if(target.setTextStyleIdAsync)await target.setTextStyleIdAsync(style);else target.textStyleId=style;
  }
  if(target.characters!==value.characters)target.characters=value.characters;
  for(const segment of value.segments) {
    for(const key of Object.keys(RANGES)) {if(segment[key]===undefined || typeof segment[key]==='symbol')continue;const method=RANGES[key];
      const getter=method.replace(/^set/,'get').replace(/Async$/,'');
      if(typeof target[getter]==='function' && equal(target[getter](segment.start,segment.end),segment[key]))continue;
      if(typeof target[method]!=='function')throw new Error('API не поддерживает '+method+' для «'+source.name+'»');
      await target[method](segment.start,segment.end,copy(segment[key]));
    }
  }
}
async function properties(source,target,root=false) {
  if(source.text)await text(source,target);
  for(const key of Object.keys(source.props)) {
    if(GRID_FIELDS.has(key) || SPECIAL.has(key) || (source.text&&key==='textStyleId') || (root&&OUTER.has(key)))continue;
    const value=source.props[key];if(value===undefined || equal(read(target,key),value))continue;
    try {const method=ASYNC[key];if(method && typeof target[method]==='function')await target[method](copy(value));else assign(target,key,value);}
    catch(err){throw new Error('«'+source.name+'»: Figma не позволяет сохранить '+key+' ('+errorText(err)+')');}
  }
  // Restore bindings after raw values. Paint-level bindings travel with copied paints.
  const bindings=source.props.boundVariables||{};
  for(const field of Object.keys(bindings)) {
    const binding=bindings[field];if(equal(read(target,'boundVariables')?.[field],binding))continue;
    if(Array.isArray(binding))continue;
    if(binding && binding.id && typeof target.setBoundVariable==='function')target.setBoundVariable(field,await figma.variables.getVariableByIdAsync(binding.id));
    else if(binding)throw new Error('Не удалось перенести привязку переменной '+field+' в «'+source.name+'»');
  }
  const modes=source.props.explicitVariableModes||{};
  for(const id of Object.keys(modes))if(target.explicitVariableModes?.[id]!==modes[id])target.setExplicitVariableModeForCollection(id,modes[id]);
  if(typeof target.resizeWithoutConstraints==='function' && (!equal(target.width,source.props.width)||!equal(target.height,source.props.height)))target.resizeWithoutConstraints(Math.max(.01,source.props.width),Math.max(.01,source.props.height));
  if(!root) {
    restoreGrid(target,source.props);
    const parent=target.parent;const auto=parent&&parent.layoutMode&&parent.layoutMode!=='NONE';
    if(!auto || source.props.layoutPositioning==='ABSOLUTE') {assign(target,'x',source.props.x);assign(target,'y',source.props.y);}
  }
  assign(target,'name',source.name);
}
function roleChild(target,role,index,sourceOrder=false,owner=0) {
  const list=children(target);
  return list.find(n=>n.getPluginData(ROLE_KEY)===role.id) || list[sourceOrder && role.members[owner] ? role.members[owner].index : index];
}
function propertyKey(key,value,available) {
  if(available[key]&&available[key].type===value.type)return key;
  const name=key.split('#')[0];
  const candidates=Object.keys(available).filter(k=>k.split('#')[0]===name&&available[k].type===value.type);
  if(candidates.length!==1)throw new Error('Не удалось однозначно перенести Component Property «'+name+'»');
  return candidates[0];
}
function componentProperties(source,target) {
  if(!source.componentProperties)return;
  const available=target.type==='COMPONENT'?target.componentPropertyDefinitions:target.componentProperties;
  if(!available)return;
  const values={};
  for(const [key,value]of Object.entries(source.componentProperties)) {
    if(!['TEXT','BOOLEAN','INSTANCE_SWAP'].includes(value.type))continue;
    if(!Object.keys(available).length)continue;
    const mapped=propertyKey(key,value,available);
    const current=target.type==='COMPONENT'?available[mapped].defaultValue:available[mapped].value;
    if(equal(current,value.value))continue;
    if(target.type==='COMPONENT')target.editComponentProperty(mapped,{defaultValue:copy(value.value)});
    else values[mapped]=copy(value.value);
  }
  if(Object.keys(values).length)target.setProperties(values);
}
async function applyTree(role,target,owner,root=false,step=workSteps()) {
  const source=role.members[owner];if(!source){target.visible=false;await step();return;}
  let swapped=false;
  if(!root && target.type==='INSTANCE' && source.type==='INSTANCE' && !role.nestedRebuild) {
    const current=await target.getMainComponentAsync();
    if(source.main && current?.id!==source.main.id) {target.swapComponent(source.main.node);swapped=true;}
  }
  if(target.type==='INSTANCE'||(root&&target.type==='COMPONENT'))componentProperties(source,target);
  await properties(source,target,root);
  await step(source);
  for(let i=0;i<role.children.length;i++) {const child=roleChild(target,role.children[i],i,swapped,owner);if(!child)throw new Error('Пропал слой «'+role.children[i].sample.name+'» после переноса');await applyTree(role.children[i],child,owner,false,step);}
}
function auditTree(role,target,owner,root=false,issues=[]) {
  const source=role.members[owner];if(!source){if(target.visible!==false)issues.push('Отсутствующий слой «'+role.sample.name+'» не скрыт');return issues;}
  for(const key of Object.keys(source.props)) {
    if((GRID_FIELDS.has(key)&&target.parent?.layoutMode!=='GRID')||key==='name'||key==='exportSettings'||key==='reactions'||key==='explicitVariableModes'||(root&&OUTER.has(key)))continue;
    const actual=read(target,key);if(!equal(actual,source.props[key]))issues.push('«'+source.name+'»: не сохранилось '+key);
  }
  if(source.componentProperties) {
    const available=target.type==='COMPONENT'?target.componentPropertyDefinitions:target.componentProperties;
    if(available&&Object.keys(available).length)for(const [key,value]of Object.entries(source.componentProperties)) {
      if(!['TEXT','BOOLEAN','INSTANCE_SWAP'].includes(value.type))continue;
      try {
        const mapped=propertyKey(key,value,available);
        const actual=target.type==='COMPONENT'?available[mapped].defaultValue:available[mapped].value;
        if(!equal(actual,value.value))issues.push('«'+source.name+'»: не сохранилось Component Property '+key);
      }catch(error){issues.push(errorText(error));}
    }
  }
  if(source.text) {
    if(target.characters!==source.text.characters)issues.push('«'+source.name+'»: изменился текст');
    try {const segments=target.characters.length?target.getStyledTextSegments(require('./snapshot').SEGMENT_FIELDS):[];if(!equal(segments,source.text.segments))issues.push('«'+source.name+'»: различается форматирование текста');}catch(e){issues.push('Не удалось проверить текст «'+source.name+'»');}
  }
  let swapped=false;
  // A swap onto the source component can use source order when inherited role IDs disappear.
  if(target.type==='INSTANCE'&&!role.nestedRebuild&&source.type==='INSTANCE')swapped=true;
  role.children.forEach((r,i)=>{const child=roleChild(target,r,i,swapped,owner);if(child)auditTree(r,child,owner,false,issues);else issues.push('Нет слоя «'+r.sample.name+'»');});return issues;
}
module.exports={properties,applyTree,auditTree,roleChild,OUTER};
