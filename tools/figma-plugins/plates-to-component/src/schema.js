const {match}=require('./matching');
const {uid,equal}=require('./util');
function buildSchema(trees,base) {
  const conflicts=[]; const total=trees.length;
  function role(sample,owner) {const members=Array(total).fill(null);members[owner]=sample;return {id:sample.roleId||uid(),sample,members,children:[],nestedRebuild:false};}
  const root=role(trees[base],base);root.members=trees.slice();
  function merge(parent) {
    const baseNode=parent.members[base]; let roles=(baseNode?baseNode.children:[]).map(n=>role(n,base));
    const order=[base].concat(trees.map((_,i)=>i).filter(i=>i!==base));
    for(const owner of order) {if(owner===base && baseNode)continue; const node=parent.members[owner];if(!node)continue;
      const existingRoles=roles.slice(); const result=match(node.children,existingRoles);conflicts.push(...result.conflicts);
      const mapped=[];
      node.children.forEach((n,i)=>{let r=result.matches[i]>=0?existingRoles[result.matches[i]]:null;if(!r){r=role(n,owner); let pos=roles.length;
        // Place new content before the next matched sibling (Badge before Button).
        for(let k=i+1;k<node.children.length;k++){if(result.matches[k]>=0){pos=roles.indexOf(existingRoles[result.matches[k]]);break;}}
        roles.splice(pos,0,r);
      }else r.members[owner]=n;mapped.push(r);});
      // Preserve order explicitly; reordering real content cannot be a visibility override.
      const existing=mapped.filter(r=>r.members[base]);const canonical=roles.filter(r=>existing.includes(r));
      if(existing.some((r,i)=>canonical[i]!==r)) conflicts.push({kind:'order',severity:'error',message:'Разный порядок слоёв внутри «'+node.name+'»',path:node.path});
    }
    parent.children=roles;
    const ids=new Set();roles.forEach(r=>{if(ids.has(r.id))conflicts.push({kind:'id',severity:'error',message:'Повторяющийся plate-role-id внутри «'+parent.sample.name+'»'});ids.add(r.id);r.additionRoot=!r.members[base]&&!!parent.members[base];merge(r);});
    parent.structureChanged=roles.some(r=>parent.members.some((n,i)=>n&&!r.members[i]) || r.structureChanged);
    if(parent.sample.type==='INSTANCE') {
      const present=parent.members.map((n,i)=>n?i:-1).filter(i=>i>=0);
      parent.nestedRebuild=parent.structureChanged || roles.some(r=>r.nestedRebuild);
      if(parent.nestedRebuild) conflicts.push({kind:'nested',severity:'info',message:'«'+parent.sample.name+'»: будет создан локальный вложенный компонент с общей структурой. Исходные библиотеки сохраняются.'});
    }
  }
  merge(root);
  const flat=[];(function visit(r){flat.push(r);r.children.forEach(visit);})(root);
  // Geometry that cannot be expressed with ordinary instance overrides is detected before mutation.
  for(const r of flat) for(const member of r.members) {if(!member)continue;
    if(member.text&&member.text.hasMissingFont)conflicts.push({kind:'font',severity:'error',message:'Недоступен шрифт в «'+member.name+'»',path:member.path});
    for(const k of ['vectorPaths','vectorNetwork','booleanOperation','isMask','maskType','pointCount','innerRadius','arcData']) {
      if(!equal(member.props[k],r.sample.props[k]))conflicts.push({kind:'geometry',severity:'error',message:'«'+member.name+'»: различается '+k+'. Это изменение структуры/контура, а не безопасный override.',path:member.path});
    }
  }
  const unique=[];const seen=new Set();conflicts.forEach(c=>{const key=c.kind+c.message+(c.path||'');if(!seen.has(key)){seen.add(key);unique.push(c);}});
  return {root,flat,conflicts:unique,added:flat.filter(r=>r.additionRoot).length,nested:flat.filter(r=>r.nestedRebuild).length,matched:flat.reduce((sum,r)=>sum+r.members.filter(Boolean).length,0)};
}
module.exports={buildSchema};
