// Стенд: сравнить текущий DP-дифф с диффом Майерса на РЕАЛЬНЫХ правках типографа.
const fs = require('fs');
const path = require('path');

const SRC = '/Users/rafael/Documents/trace-logos/tools/figma-plugins/typograf/code.js';
const lines = fs.readFileSync(SRC, 'utf8').split('\n');

// Чистые строковые правила: со строки 5 (после figma.showUI) по конец
// capitalizeListParagraphs/getListParagraphFlags — до блока работы с Figma.
const pureStart = 4;                 // 0-based → строка 5
const pureEnd = 332;                 // включительно строка 332
const pureSrc = lines.slice(pureStart, pureEnd).join('\n');

// Текущий diffHunks (DP) — строки 392..457
const dpSrc = fs.readFileSync('./dp-reference.txt','utf8');

const sandbox = new Function(`
  ${pureSrc}
  ${dpSrc}
  return { typografize, stripListMarkers, capitalizeListParagraphs, diffHunksDP: diffHunks };
`)();

const { typografize, diffHunksDP } = sandbox;

const diffHunksMyers = require('./live-diff.js');

// ─── Проверки корректности ───
function applyHunks(oldText, hunks) {
  let out = '';
  let pos = 0;
  for (const h of hunks) {
    out += oldText.slice(pos, h.oldStart);
    out += h.insertText;
    pos = h.oldEnd;
  }
  out += oldText.slice(pos);
  return out;
}

function validate(hunks, oldLen) {
  let prevEnd = -1;
  for (const h of hunks) {
    if (h.oldStart < 0 || h.oldEnd > oldLen || h.oldStart > h.oldEnd) return 'диапазон вне текста';
    if (h.oldStart < prevEnd) return 'хунки пересекаются';
    if (h.oldStart === h.oldEnd && !h.insertText) return 'пустой хунк';
    prevEnd = h.oldEnd;
  }
  return null;
}

function cost(hunks) {
  return hunks.reduce((s, h) => s + (h.oldEnd - h.oldStart) + h.insertText.length, 0);
}

// ─── Генерация реалистичных русских текстов ───
const WORDS = ('логотип бренд вектор растр макет типографика шрифт начертание кегль интерлиньяж ' +
  'компания студия дизайн айдентика фирменный стиль знак эмблема монограмма палитра цвет ' +
  'носитель визитка баннер сайт страница экран интерфейс кнопка форма поле подпись заголовок').split(' ');
const PREPS = ['в', 'с', 'на', 'по', 'из', 'к', 'о', 'для', 'при', 'над', 'не', 'и', 'а'];

function makeText(targetLen, seed) {
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const parts = [];
  let len = 0;
  while (len < targetLen) {
    const r = rnd();
    let chunk;
    if (r < 0.18) chunk = PREPS[Math.floor(rnd() * PREPS.length)];
    else if (r < 0.24) chunk = String(1990 + Math.floor(rnd() * 40));
    else if (r < 0.28) chunk = '"' + WORDS[Math.floor(rnd() * WORDS.length)] + '"';
    else if (r < 0.31) chunk = '-';
    else if (r < 0.34) chunk = '...';
    else if (r < 0.37) chunk = Math.floor(rnd() * 90 + 5) + ' кг';
    else chunk = WORDS[Math.floor(rnd() * WORDS.length)];
    parts.push(chunk);
    len += chunk.length + 1;
  }
  return parts.join(' ');
}

const OPTS = { nbsp: true, dashes: true, quotes: true, ellipsis: true, spaces: true, lists: true };

console.log('длина | D (правок) | хунков | DP мс | Myers мс | ускорение | DP память');
console.log('------|------------|--------|-------|----------|-----------|----------');

for (const L of [200, 600, 1000, 2000, 3000, 5000]) {
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const oldT = makeText(L, i * 7919 + 13);
    samples.push([oldT, typografize(oldT, OPTS)]);
  }

  let tDP = 0, tMy = 0, hunkCount = 0, dSum = 0, bad = 0, worse = 0;

  for (const [oldT, newT] of samples) {
    let t0 = process.hrtime.bigint();
    const hDP = diffHunksDP(oldT, newT);
    tDP += Number(process.hrtime.bigint() - t0) / 1e6;

    t0 = process.hrtime.bigint();
    const hMy = diffHunksMyers(oldT, newT);
    tMy += Number(process.hrtime.bigint() - t0) / 1e6;

    if (applyHunks(oldT, hMy) !== newT) bad++;
    if (validate(hMy, oldT.length)) bad++;
    if (cost(hMy) > cost(hDP)) worse++;
    hunkCount += hMy.length;
    dSum += cost(hMy);
  }

  const mem = ((L + 1) * (L + 1) * 4 / 1048576).toFixed(1);
  console.log(
    `${String(L).padStart(5)} | ${String(Math.round(dSum / 5)).padStart(10)} | ${String(Math.round(hunkCount / 5)).padStart(6)} | ` +
    `${tDP.toFixed(1).padStart(5)} | ${tMy.toFixed(2).padStart(8)} | ${(tDP / tMy).toFixed(0).padStart(8)}× | ${mem.padStart(6)} МБ` +
    (bad ? `  ❌ ОШИБОК: ${bad}` : '') + (worse ? `  ⚠️ дороже DP: ${worse}` : '')
  );
}
