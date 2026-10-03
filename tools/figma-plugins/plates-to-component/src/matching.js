const {normalize} = require('./util');
function ratio(a,b) { a=Math.abs(a||0); b=Math.abs(b||0); return Math.max(a,b)<0.01 ? 1 : Math.min(a,b)/Math.max(a,b); }
function childTypes(n) { return n.children.map(c=>c.type).sort().join('|'); }
function score(a,b,ai=0,bi=0,count=1) {
  if(a.type!==b.type) return -10000;
  if(a.origin&&b.origin&&a.origin.mainId===b.origin.mainId) {
    if(!a.origin.path||!b.origin.path)return -10000;
    return a.origin.path===b.origin.path?10000:-10000;
  }
  if(a.roleId && b.roleId) return a.roleId===b.roleId ? 1000 : -10000;
  const ap=a.props||{},bp=b.props||{}; const an=normalize(a.name),bn=normalize(b.name);
  let s=18;
  if(an===bn && an) s+=32;
  else { const at=an.split(' '),bt=bn.split(' '); s+=12*at.filter(t=>t && bt.includes(t)).length/Math.max(at.length,bt.length,1); }
  s+=7*ratio(ap.width,bp.width)+7*ratio(ap.height,bp.height);
  s+=5*ratio((ap.width||1)/(ap.height||1),(bp.width||1)/(bp.height||1));
  s+=a.children.length===b.children.length ? 7 : 4*ratio(a.children.length+1,b.children.length+1);
  if(childTypes(a)===childTypes(b)) s+=7;
  if(ap.layoutMode===bp.layoutMode) s+=4;
  if(ap.layoutPositioning===bp.layoutPositioning) s+=3;
  if(ap.isMask===bp.isMask) s+=3;
  if(ap.booleanOperation===bp.booleanOperation) s+=2;
  if(a.main && b.main && a.main.id===b.main.id) s+=24;
  const distance=Math.abs((ap.x||0)-(bp.x||0))+Math.abs((ap.y||0)-(bp.y||0));
  s+=7/(1+distance/Math.max(ap.width||1,ap.height||1,bp.width||1,bp.height||1));
  s+=4*Math.max(0,1-Math.abs(ai-bi)/Math.max(count,1));
  return s;
}
// Maximum weight one-to-one assignment; dummy columns represent new structural roles.
function assignment(weights) {
  const n=weights.length; if(!n)return [];
  const m=Math.max(n,weights[0].length); const u=Array(n+1).fill(0),v=Array(m+1).fill(0),p=Array(m+1).fill(0),way=Array(m+1).fill(0);
  for(let i=1;i<=n;i++) { p[0]=i; let j0=0; const min=Array(m+1).fill(Infinity),used=Array(m+1).fill(false);
    do {used[j0]=true; const i0=p[j0]; let delta=Infinity,j1=0;
      for(let j=1;j<=m;j++) if(!used[j]) {const cur=-(weights[i0-1][j-1]||0)-u[i0]-v[j]; if(cur<min[j]){min[j]=cur;way[j]=j0;} if(min[j]<delta){delta=min[j];j1=j;}}
      for(let j=0;j<=m;j++) if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else min[j]-=delta; j0=j1;
    }while(p[j0]!==0);
    do { const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0!==0);
  }
  const result=Array(n).fill(-1); for(let j=1;j<=m;j++)if(p[j])result[p[j]-1]=j-1; return result;
}
function match(incoming,roles) {
  const weights=incoming.map((n,i)=>roles.map((r,j)=>score(n,r.sample,i,j,Math.max(incoming.length,roles.length))));
  const matrix=weights.map(row=>row.concat(incoming.map(()=>50)));
  const chosen=assignment(matrix); const conflicts=[];
  const matches=chosen.map((j,i)=>j<roles.length && weights[i][j]>=54 ? j : -1);
  matches.forEach((j,i)=>{if(j<0)return;
    const alternatives=weights[i].map((s,k)=>({s,k})).filter(x=>x.k!==j&&x.s>=54).sort((a,b)=>b.s-a.s);
    // Order/position must not silently resolve indistinguishable repeated layers.
    if(alternatives.length && Math.abs(weights[i][j]-alternatives[0].s)<5) conflicts.push({kind:'ambiguous',severity:'error',message:'Неоднозначное сопоставление: «'+incoming[i].name+'»',path:incoming[i].path});
    for(let k=0;k<incoming.length;k++) if(k!==i && weights[k][j]>=54 && Math.abs(weights[i][j]-weights[k][j])<5 && matches[k]!==j) conflicts.push({kind:'ambiguous',severity:'error',message:'Несколько слоёв подходят к «'+roles[j].sample.name+'»',path:incoming[i].path});
  });
  return {matches,conflicts};
}
module.exports={score,assignment,match};
