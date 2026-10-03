const {copy,equal,errorText}=require('./util');
const ANCHORS=new Set(['gridRowAnchorIndex','gridColumnAnchorIndex']);
const FIELDS=new Set([...ANCHORS,'gridRowSpan','gridColumnSpan','gridChildHorizontalAlign','gridChildVerticalAlign']);
function assign(node,key,value) {
  if(value===undefined||!(key in node)||equal(node[key],value))return;
  try{node[key]=copy(value);}
  catch(error){throw new Error('«'+node.name+'» ('+node.type+', '+node.id+'): не удалось записать '+key+' — '+errorText(error));}
}
function restoreGrid(node,props) {
  const parent=node.parent;if(!parent||parent.layoutMode!=='GRID')return;
  const row=props.gridRowAnchorIndex,column=props.gridColumnAnchorIndex;
  if(parent.gridItemsPositioning!=='ROW_AUTO_FLOW'&&Number.isInteger(row)&&row>=0&&Number.isInteger(column)&&column>=0&&
     (node.gridRowAnchorIndex!==row||node.gridColumnAnchorIndex!==column)) {
    try {
      if(typeof node.setGridChildPosition!=='function')throw new Error('API не поддерживает setGridChildPosition');
      node.setGridChildPosition(row,column);
    }catch(error){throw new Error('«'+node.name+'» ('+node.type+', '+node.id+'): setGridChildPosition('+row+', '+column+') — '+errorText(error));}
  }
  for(const key of FIELDS)if(!ANCHORS.has(key))assign(node,key,props[key]);
}
function checkGrid(node,props) {
  if(node.parent?.layoutMode!=='GRID')return;
  for(const key of FIELDS)if(props[key]!==undefined&&!equal(node[key],props[key]))throw new Error('«'+node.name+'» ('+node.id+'): после размещения изменилось '+key);
}
module.exports={ANCHORS,FIELDS,assign,restoreGrid,checkGrid};
