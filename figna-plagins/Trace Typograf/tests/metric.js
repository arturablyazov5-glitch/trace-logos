// Что на самом деле важно для сохранения оформления: сколько ИСХОДНЫХ символов
// удалено. Удалённый символ теряет свой стиль; вставленный наследует соседний.
const fs = require('fs');
const diffMyers = require('./live-diff.js');
const diffDP = new Function(`${fs.readFileSync('./dp-reference.txt','utf8')}; return diffHunks;`)();

const SRC = '/Users/rafael/Documents/trace-logos/figna-plagins/Trace Typograf/code.js';
const body = fs.readFileSync(SRC,'utf8').split('\n').filter(l=>!l.startsWith('figma.showUI')).join('\n').split('figma.on(')[0].replace(/const postSelection[\s\S]*$/,'');
const { typografize } = new Function('figma', `${body}; return { typografize };`)({loadFontAsync:async()=>{},currentPage:{selection:[]},clientStorage:{getAsync:async()=>null,setAsync:async()=>{}},notify:()=>{},ui:{postMessage:()=>{}}});

const deleted = (hs) => hs.reduce((s,h)=>s+(h.oldEnd-h.oldStart),0);
const touched = (hs) => hs.reduce((s,h)=>s+(h.oldEnd-h.oldStart)+h.insertText.length,0);

const WORDS='логотип бренд вектор растр макет типографика шрифт компания студия дизайн айдентика знак эмблема палитра цвет визитка баннер сайт страница экран интерфейс кнопка форма поле подпись заголовок'.split(' ');
const PREPS=['в','с','на','по','из','к','о','для','при','над','не','и','а'];
let s=99; const rnd=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;
function mk(L){const p=[];let n=0;while(n<L){const r=rnd();let c;
  if(r<0.18)c=PREPS[Math.floor(rnd()*PREPS.length)];
  else if(r<0.24)c=String(1990+Math.floor(rnd()*40));
  else if(r<0.28)c='"'+WORDS[Math.floor(rnd()*WORDS.length)]+'"';
  else if(r<0.31)c='-'; else if(r<0.34)c='...';
  else if(r<0.37)c=Math.floor(rnd()*90+5)+' кг';
  else c=WORDS[Math.floor(rnd()*WORDS.length)];
  p.push(c);n+=c.length+1;} return p.join(' ');}

const OPTS={nbsp:true,dashes:true,quotes:true,ellipsis:true,spaces:true,lists:true};
let dM=0,dD=0,tM=0,tD=0,worseDel=0,worseTouch=0,n=0;
for(let i=0;i<400;i++){
  const A=mk(200+Math.floor(rnd()*2000));
  const B=typografize(A,OPTS);
  if(A===B) continue;
  const hM=diffMyers(A,B), hD=diffDP(A,B);
  dM+=deleted(hM); dD+=deleted(hD); tM+=touched(hM); tD+=touched(hD);
  if(deleted(hM)>deleted(hD))worseDel++;
  if(touched(hM)>touched(hD))worseTouch++;
  n++;
}
console.log(`Реальная типографика, ${n} текстов:`);
console.log(`  удалено исходных символов: Myers ${dM}, DP ${dD}  (хуже DP в ${worseDel} текстах)`);
console.log(`  всего затронуто символов:  Myers ${tM}, DP ${tD}  (хуже DP в ${worseTouch} текстах)`);
