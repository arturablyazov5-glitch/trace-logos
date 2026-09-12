// Фаззинг: Myers обязан давать РОВНО тот же результат применения, что DP,
// и не дороже по числу тронутых символов. Плюс худший случай — текст переписан целиком.
const fs = require('fs');
const dpSrc = fs.readFileSync('./dp-reference.txt', 'utf8');
const diffHunksDP = new Function(`${dpSrc}; return diffHunks;`)();
const diffHunksMyers = require('./live-diff.js');

function applyHunks(oldText, hunks) {
  let out = '', pos = 0;
  for (const h of hunks) { out += oldText.slice(pos, h.oldStart); out += h.insertText; pos = h.oldEnd; }
  return out + oldText.slice(pos);
}
function validate(hunks, oldLen) {
  let prevEnd = -1;
  for (const h of hunks) {
    if (h.oldStart < 0 || h.oldEnd > oldLen || h.oldStart > h.oldEnd) return 'вне диапазона';
    if (h.oldStart < prevEnd) return 'пересечение';
    if (h.oldStart === h.oldEnd && !h.insertText) return 'пустой хунк';
    prevEnd = h.oldEnd;
  }
  return null;
}
const cost = (hs) => hs.reduce((s, h) => s + (h.oldEnd - h.oldStart) + h.insertText.length, 0);

let s = 42;
const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

// 1) Полностью случайные пары из маленького алфавита — максимум пограничных случаев
const ALPHABET = 'аб  —"…';
let fails = 0, worse = 0, checked = 0;
for (let iter = 0; iter < 20000; iter++) {
  const la = Math.floor(rnd() * 14), lb = Math.floor(rnd() * 14);
  let A = '', B = '';
  for (let i = 0; i < la; i++) A += ALPHABET[Math.floor(rnd() * ALPHABET.length)];
  for (let i = 0; i < lb; i++) B += ALPHABET[Math.floor(rnd() * ALPHABET.length)];
  const hM = diffHunksMyers(A, B);
  const err = validate(hM, A.length);
  if (err || applyHunks(A, hM) !== B) { fails++; if (fails < 4) console.log('❌', JSON.stringify(A), '→', JSON.stringify(B), err || 'результат не совпал'); }
  if (cost(hM) > cost(diffHunksDP(A, B))) { worse++; if (worse < 4) console.log('⚠️ дороже DP:', JSON.stringify(A), '→', JSON.stringify(B)); }
  checked++;
}
console.log(`Случайные пары: проверено ${checked}, ошибок ${fails}, дороже DP ${worse}`);

// 2) Точечные правки в длинном тексте — профиль реальной типографики
fails = 0; worse = 0; checked = 0;
for (let iter = 0; iter < 2000; iter++) {
  const len = 50 + Math.floor(rnd() * 400);
  let A = '';
  for (let i = 0; i < len; i++) A += 'абвгде ежзий'[Math.floor(rnd() * 12)];
  let B = A;
  const edits = 1 + Math.floor(rnd() * 6);
  for (let e = 0; e < edits; e++) {
    const p = Math.floor(rnd() * B.length);
    const kind = rnd();
    if (kind < 0.34) B = B.slice(0, p) + ' ' + B.slice(p + 1);       // замена
    else if (kind < 0.67) B = B.slice(0, p) + '—' + B.slice(p);            // вставка
    else B = B.slice(0, p) + B.slice(p + 1);                               // удаление
  }
  const hM = diffHunksMyers(A, B);
  const err = validate(hM, A.length);
  if (err || applyHunks(A, hM) !== B) { fails++; if (fails < 4) console.log('❌ точечная правка:', err || 'результат не совпал'); }
  if (cost(hM) > cost(diffHunksDP(A, B))) worse++;
  checked++;
}
console.log(`Точечные правки: проверено ${checked}, ошибок ${fails}, дороже DP ${worse}`);

// 3) Худший случай — два НЕСВЯЗАННЫХ текста одинаковой длины (D ≈ n+m)
console.log('\nХудший случай (текст переписан целиком, общего почти нет):');
for (const L of [500, 1000, 2000, 3000]) {
  let A = '', B = '';
  for (let i = 0; i < L; i++) { A += 'абвгдежзий'[Math.floor(rnd() * 10)]; B += 'клмнопрсту'[Math.floor(rnd() * 10)]; }
  let t0 = process.hrtime.bigint();
  const hM = diffHunksMyers(A, B);
  const tM = Number(process.hrtime.bigint() - t0) / 1e6;
  t0 = process.hrtime.bigint();
  const hD = diffHunksDP(A, B);
  const tD = Number(process.hrtime.bigint() - t0) / 1e6;
  const ok = applyHunks(A, hM) === B && !validate(hM, A.length);
  console.log(`  L=${L}: Myers ${tM.toFixed(0)} мс (D=${cost(hM)}), DP ${tD.toFixed(0)} мс (D=${cost(hD)}) ${ok ? '✓' : '❌'}`);
}
