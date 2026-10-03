const ROLE_KEY = 'plate-role-id';
function copy(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(copy);
  const out = {}; Object.keys(value).forEach(k => { if (typeof value[k] !== 'symbol' && typeof value[k] !== 'undefined') out[k] = copy(value[k]); }); return out;
}
function equal(a, b, tolerance = 0.02) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a-b) <= tolerance;
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const keys = Object.keys(a); return keys.length === Object.keys(b).length && keys.every(k => equal(a[k],b[k],tolerance));
}
function normalize(name) { return String(name || '').normalize('NFKC').toLowerCase().replace(/[_\-\/]+/g,' ').replace(/\s+/g,' ').trim(); }
function uid() { return 'plate-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10); }
function pause(ms=0) { return new Promise(resolve => setTimeout(resolve,ms)); }
// Yield to the editor between batches; visible text changes get a readable beat.
function workSteps(visible=false) {
  let count=0,last=Date.now();
  return async source=>{
    count++;
    if(visible&&source?.text){await pause(80);count=0;last=Date.now();}
    else if(count>=24||Date.now()-last>=32){await pause(visible?16:0);count=0;last=Date.now();}
  };
}
function children(node) { return 'children' in node ? Array.from(node.children) : []; }
function walk(node, fn) { fn(node); children(node).forEach(n => walk(n,fn)); }
function inside(node, roots) { for (let n=node;n;n=n.parent) if (roots.includes(n)) return true; return false; }
function errorText(err) { return err && err.message ? err.message : String(err); }
module.exports = {ROLE_KEY,copy,equal,normalize,uid,pause,workSteps,children,walk,inside,errorText};
