const {capture}=require('./snapshot');
const {selection}=require('./selection');
const {buildSchema}=require('./schema');
const {identify}=require('./input');
const {score}=require('./matching');
function plain(tree){
  const {node,main,children,...rest}=tree;
  return {...rest,main:main?{id:main.id,key:main.key,name:main.name,remote:main.remote}:null,children:children.map(plain)};
}
function candidates(schema){
  const result=[];
  for(const parent of schema.flat)for(let owner=1;owner<parent.members.length;owner++){
    const member=parent.members[owner];if(!member)continue;
    member.children.forEach((child,i)=>{
      const ranked=parent.children.map((role,j)=>({id:role.sample.id,name:role.sample.name,type:role.sample.type,score:score(child,role.sample,i,j,Math.max(member.children.length,parent.children.length))})).sort((a,b)=>b.score-a.score).slice(0,3);
      result.push({owner,nodeId:child.id,path:child.path+'/'+child.name,candidates:ranked});
    });
  }
  return result;
}
async function diagnosticReport(cancelled=()=>false) {
    const state=selection(),trees=[];
    if(!state.roots.length)throw new Error('Выдели плашки в макете и нажми «Исследовать выделение».');
    for(const root of state.roots)trees.push(await capture(root,{count:0,cancelled:cancelled}));
    let common=null;
    if(state.roots.every(n=>n.type==='INSTANCE')){
      const mains=await Promise.all(state.roots.map(n=>n.getMainComponentAsync()));
      if(mains[0]&&!mains[0].remote&&mains.every(n=>n&&n.id===mains[0].id)){
        trees.forEach((tree,i)=>identify(tree,state.roots[i].id,mains[0].id,true));
        common=await capture(mains[0],{count:0,cancelled:cancelled});identify(common,mains[0].id,mains[0].id,false);
      }
    }
    const schema=buildSchema(common?trees.concat(common):trees,common?trees.length:0);
    if(cancelled()||selection().key!==state.key)throw new Error('Выделение изменилось во время анализа. Повтори запуск.');
    const report={version:1,createdAt:new Date().toISOString(),page:{id:figma.currentPage.id,name:figma.currentPage.name},selectionErrors:state.errors,
      scope:'Только чтение. Проверены структура и сопоставление; создание компонента, загрузка шрифтов и перенос overrides не выполнялись. Баллы кандидатов справочные: итоговое сопоставление выполняет buildSchema.',
      conflicts:schema.conflicts,summary:{selected:trees.length,layers:trees.reduce((n,t)=>{const count=x=>1+x.children.reduce((s,c)=>s+count(c),0);return n+count(t);},0),roles:schema.flat.length,commonComponent:common&&common.id},
      roots:trees.map(plain),commonSource:common&&plain(common),roles:schema.flat.map(r=>({id:r.id,sampleId:r.sample.id,members:r.members.map(m=>m&&m.id),structureChanged:r.structureChanged})),candidates:candidates(schema)};
    return report;
}
module.exports={diagnosticReport};
