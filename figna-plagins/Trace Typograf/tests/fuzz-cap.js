const diffHunks = require('./live-diff.js');
function applyHunks(o, hs){let r='',p=0;for(const h of hs){r+=o.slice(p,h.oldStart);r+=h.insertText;p=h.oldEnd;}return r+o.slice(p);}
function validate(hs,len){let pe=-1;for(const h of hs){if(h.oldStart<0||h.oldEnd>len||h.oldStart>h.oldEnd)return'вне диапазона';if(h.oldStart<pe)return'пересечение';if(h.oldStart===h.oldEnd&&!h.insertText)return'пустой хунк';pe=h.oldEnd;}return null;}
let s=7;const rnd=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;

for (const cap of [1, 2, 3, 8]) {
  diffHunks.setMaxD(cap);
  let fails=0;
  for(let i=0;i<8000;i++){
    const la=Math.floor(rnd()*30),lb=Math.floor(rnd()*30);
    let A='',B='';
    for(let j=0;j<la;j++)A+='абв г'[Math.floor(rnd()*5)];
    for(let j=0;j<lb;j++)B+='абв г—'[Math.floor(rnd()*6)];
    const h=diffHunks(A,B);
    const err=validate(h,A.length);
    if(err||applyHunks(A,h)!==B){fails++;if(fails<3)console.log('❌ cap='+cap,JSON.stringify(A),'→',JSON.stringify(B),err||'не совпал');}
  }
  // длинные тексты через рекурсию
  for(let i=0;i<200;i++){
    let A='',B='';
    for(let j=0;j<600;j++){A+='абвгд'[Math.floor(rnd()*5)];B+='вгдеж'[Math.floor(rnd()*5)];}
    const h=diffHunks(A,B);
    const err=validate(h,A.length);
    if(err||applyHunks(A,h)!==B){fails++;if(fails<3)console.log('❌ cap='+cap+' длинный:',err||'не совпал');}
  }
  console.log(`лимит D=${cap}: 8200 случаев, ошибок ${fails}`);
}

// память и время худшего случая при боевом лимите
diffHunks.setMaxD(2000);
for (const L of [3000, 8000]) {
  let A='',B='';
  for(let j=0;j<L;j++){A+='абвгдежзий'[Math.floor(rnd()*10)];B+='клмнопрсту'[Math.floor(rnd()*10)];}
  const before=process.memoryUsage().heapUsed;
  const t0=process.hrtime.bigint();
  const h=diffHunks(A,B);
  const t=Number(process.hrtime.bigint()-t0)/1e6;
  const peak=(process.memoryUsage().heapUsed-before)/1048576;
  console.log(`худший случай L=${L}: ${t.toFixed(0)} мс, куча +${peak.toFixed(0)} МБ, применяется верно: ${applyHunks(A,h)===B}`);
}
