const {ROLE_KEY,copy,children,pause} = require('./util');
const PROPS = ['visible','opacity','blendMode','name','x','y','rotation','fills','strokes','effects','strokeWeight','strokeAlign','strokeCap','strokeJoin','strokeMiterLimit','dashPattern','strokeTopWeight','strokeBottomWeight','strokeLeftWeight','strokeRightWeight','cornerRadius','topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius','cornerSmoothing','clipsContent','isMask','maskType','booleanOperation','vectorPaths','vectorNetwork','arcData','pointCount','innerRadius','layoutMode','layoutWrap','primaryAxisSizingMode','counterAxisSizingMode','primaryAxisAlignItems','counterAxisAlignItems','counterAxisAlignContent','itemSpacing','counterAxisSpacing','paddingLeft','paddingRight','paddingTop','paddingBottom','itemReverseZIndex','strokesIncludedInLayout','layoutAlign','layoutGrow','layoutPositioning','layoutSizingHorizontal','layoutSizingVertical','minWidth','maxWidth','minHeight','maxHeight','constraints','textAutoResize','textAlignHorizontal','textAlignVertical','textTruncation','maxLines','paragraphIndent','paragraphSpacing','hangingPunctuation','hangingList','leadingTrim','textStyleId','fillStyleId','strokeStyleId','effectStyleId','gridStyleId','layoutGrids','boundVariables','explicitVariableModes','reactions','exportSettings','gridRowAnchorIndex','gridColumnAnchorIndex','gridRowSpan','gridColumnSpan','gridChildHorizontalAlign','gridChildVerticalAlign'];
const SEGMENT_FIELDS = ['fontName','fontSize','textCase','textDecoration','letterSpacing','lineHeight','fills','textStyleId','hyperlink','listOptions','indentation','openTypeFeatures'];
function read(node,key) { try { const value=node[key]; return typeof value==='symbol' || value===undefined ? undefined : copy(value); } catch (_) { return undefined; } }
function placement(node) {
  const parent=node.parent;
  const props={}; ['x','y','width','height','rotation','relativeTransform','layoutAlign','layoutGrow','layoutPositioning','layoutSizingHorizontal','layoutSizingVertical','constraints','minWidth','maxWidth','minHeight','maxHeight','visible','gridRowAnchorIndex','gridColumnAnchorIndex','gridRowSpan','gridColumnSpan','gridChildHorizontalAlign','gridChildVerticalAlign'].forEach(k=>{ const v=read(node,k); if(v!==undefined) props[k]=v; });
  return {parent,index:parent ? children(parent).indexOf(node) : -1,props};
}
async function capture(node, context={count:0}, index=0, path='') {
  if (++context.count % 100===0) { await pause(); if(context.cancelled && context.cancelled()) throw new Error('Анализ отменён: выделение изменилось'); }
  const props={}; PROPS.forEach(k=>{ if(k in node) { const v=read(node,k); if(v!==undefined) props[k]=v; } });
  props.width=read(node,'width'); props.height=read(node,'height');
  const out={node,id:node.id,type:node.type,name:node.name,index,path,roleId:node.getPluginData(ROLE_KEY),props,children:[],main:null,text:null};
  if(node.type==='INSTANCE') { out.componentProperties=read(node,'componentProperties'); const main=await node.getMainComponentAsync(); if(main) out.main={id:main.id,key:main.key,name:main.name,remote:main.remote,node:main}; }
  if(node.type==='COMPONENT')out.componentPropertyDefinitions=read(node,'componentPropertyDefinitions');
  if(node.type==='TEXT') {
    let segments=[];
    if(node.characters.length) segments=node.getStyledTextSegments(SEGMENT_FIELDS).map(copy);
    out.text={characters:node.characters,segments,fonts:node.characters.length ? node.getRangeAllFontNames(0,node.characters.length).map(copy) : (typeof node.fontName==='object' ? [copy(node.fontName)] : []),hasMissingFont:node.hasMissingFont};
  }
  const list=children(node); for(let i=0;i<list.length;i++) out.children.push(await capture(list[i],context,i,path+'/'+node.name));
  return out;
}
function stage(node, index=0) {
  let temp;
  try {
    if(node.type==='COMPONENT') { temp=node.createInstance(); temp.visible=false; temp=temp.detachInstance(); }
    else { temp=node.clone(); temp.visible=false; if(temp.type==='INSTANCE') temp=temp.detachInstance(); }
    temp.visible=false; figma.currentPage.appendChild(temp); temp.x=-100000-index*2000; temp.y=-100000; return temp;
  }catch(error){if(temp&&!temp.removed)temp.remove();throw error;}
}
async function snapshots(roots,cancelled) {
  const staged=[]; const trees=[];
  try { for(let i=0;i<roots.length;i++) { const temp=stage(roots[i],i); staged.push(temp); const tree=await capture(temp,{count:0,cancelled}); PROPS.forEach(k=>{const v=read(roots[i],k);if(v!==undefined)tree.props[k]=v;}); tree.props.width=roots[i].width;tree.props.height=roots[i].height; trees.push(tree); } return {staged,trees}; }
  catch(err) { staged.forEach(n=>{if(!n.removed)n.remove();}); throw err; }
}
function clean(staged) { staged.forEach(n=>{if(n && !n.removed)n.remove();}); }
function signature(tree) {
  return JSON.stringify({type:tree.type,name:tree.name,props:tree.props,text:tree.text,main:tree.main&&tree.main.id,origin:tree.origin,componentProperties:tree.componentProperties,componentPropertyDefinitions:tree.componentPropertyDefinitions,children:tree.children.map(signature)});
}
module.exports={PROPS,SEGMENT_FIELDS,read,placement,capture,stage,snapshots,clean,signature};
