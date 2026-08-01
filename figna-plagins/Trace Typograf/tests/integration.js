// Интеграционный тест на РЕАЛЬНОМ code.js плагина: поддельная текстовая нода
// Figma, которая помнит стиль КАЖДОГО символа. Проверяем две вещи сразу:
// 1) текст типографируется в точности как раньше (эталон — старый DP-дифф);
// 2) символы, которые не менялись, сохраняют свой стиль — это то, ради чего
//    дифф вообще делится на хунки.
const fs = require('fs');
const SRC = '/Users/rafael/Documents/trace-logos/figna-plagins/Trace Typograf/code.js';
const src = fs.readFileSync(SRC, 'utf8');

// Отрезаем строку figma.showUI и хвост с обработчиками — берём всё остальное.
const body = src
  .split('\n')
  .filter((l) => !l.startsWith('figma.showUI'))
  .join('\n')
  .split('figma.on(')[0]
  .replace(/const postSelection[\s\S]*$/, '');

const api = new Function('figma', `${body}
  return { typografize, stripListMarkers, capitalizeListParagraphs, getListParagraphFlags,
           applyListMarkers, applyTypography, diffHunks };`)({
  loadFontAsync: async () => {},
  currentPage: { selection: [] },
  clientStorage: { getAsync: async () => null, setAsync: async () => {} },
  notify: () => {},
  ui: { postMessage: () => {} },
});

// ── Поддельная текстовая нода: массив символов + параллельный массив стилей ──
class FakeText {
  constructor(text, styles) {
    this.type = 'TEXT';
    this.chars = Array.from(text);
    // Стиль на символ: если не задан — по позиции, чтобы любая потеря была видна.
    this.styles = styles || this.chars.map((_, i) => (i < text.length / 2 ? 'A' : 'B'));
    this.lists = new Map();
  }
  get characters() { return this.chars.join(''); }
  getStyledTextSegments() { return [{ fontName: { family: 'Inter', style: 'Regular' } }]; }
  deleteCharacters(start, end) {
    this.chars.splice(start, end - start);
    this.styles.splice(start, end - start);
  }
  insertCharacters(start, text, useStyle) {
    const arr = Array.from(text);
    // Figma наследует стиль соседа: BEFORE — символа слева, AFTER — справа.
    const inherit = useStyle === 'AFTER' ? this.styles[start] : this.styles[start - 1];
    this.chars.splice(start, 0, ...arr);
    this.styles.splice(start, 0, ...arr.map(() => inherit === undefined ? '?' : inherit));
  }
  getRangeListOptions(start) { return this.lists.get(start) || { type: 'NONE' }; }
  setRangeListOptions(start, end, opts) { this.lists.set(start, opts); }
}

const OPTS = { nbsp: true, dashes: true, quotes: true, ellipsis: true, spaces: true, lists: true };

// Повторяет конвейер из обработчика 'run' в code.js
async function runOnNode(node, opts) {
  const oldText = node.characters;
  let workingText = oldText;
  let manualTypes = null;
  if (opts.lists) {
    const stripped = api.stripListMarkers(workingText);
    workingText = stripped.text;
    manualTypes = stripped.types;
  }
  const nativeFlags = opts.lists ? api.getListParagraphFlags(node, oldText) : null;
  let newText = api.typografize(workingText, opts);
  if (opts.lists) {
    const combined = manualTypes.map((t, i) => !!t || (nativeFlags && nativeFlags[i]));
    newText = api.capitalizeListParagraphs(newText, combined);
  }
  await api.applyTypography(node, newText);
  if (opts.lists && manualTypes.some(Boolean)) api.applyListMarkers(node, newText, manualTypes);
  return newText;
}

const CASES = [
  ['Логотип - лицо бренда, в 2020 году.', 'дефис, предлог, число'],
  ['Он сказал "привет" и ушёл...', 'кавычки и многоточие'],
  ['И. И. Иванов, 10 кг, № 5, г. Москва', 'инициалы, единицы, адрес'],
  ['- вектор\n- растр\n- макет', 'маркированный список'],
  ['1. вектор\n2. растр', 'нумерованный список'],
  ['Текст  с   лишними    пробелами', 'схлопывание пробелов'],
  ['Первый абзац в 2020.\n\nТретий абзац - тоже с правкой.', 'правки в разных абзацах'],
  ['Всё уже по типографике — и менять нечего', 'нечего менять'],
  ['', 'пустая строка'],
  ['а', 'один символ'],
  ['«уже ёлочки» и — тире', 'уже правильный текст'],
  ['[ желаемый доход]÷[ участников ]', 'пробел после открывающей скобки'],
  ['гонорар    с одного участника', 'серия из обычного и неразрывного пробела'],
  ['В 2024 году', 'год не группируется по разрядам'],
  ['20202', '5 цифр группируются, 4 — нет'],
  ['+79538371429', 'телефон: +7 без разделителей'],
  ['89538371429', 'телефон: 8 без разделителей'],
  ['8 (953) 837-14-29', 'телефон: 8 (…) …-…-…'],
  ['8 (953) 837 14 29', 'телефон: 8 (…) … … …'],
  ['+7(953)837-14-29', 'телефон: +7(…)…-…-…'],
  ['+7 (953) 837 14 29', 'телефон: +7 (…) … … …'],
  ['+7 953 837 14 29', 'телефон: +7 … … … … без скобок'],
  ['+7(953)837-1429', 'телефон: неровное разбиение 4-1'],
  ['+7(953)837-142-9', 'телефон: неровное разбиение 3-1'],
  ['+7(953)8371-429', 'телефон: неровное разбиение 4-3'],
  ['+7 (953) 8371-429', 'телефон: неровное разбиение со скобками'],
  ['+79538371429\n89538371429\n8 (953) 837-14-29', 'телефоны на разных строках не склеиваются через "+"'],
  ['или в 12 часов ночи в субботу:)', 'смайл приклеен к слову'],
  ['8) сделать это', 'смайл-подобный номер списка не трогаем'],
  ['по 9 параметрам', 'число не отрывается от параметра (неразрывный пробел)'],
  ['по 9\nпараметрам', 'настоящий перенос абзаца не склеивается через unit-правило'],
  ['5 котиков', 'общее правило: любое слово после числа, не только из UNITS'],
  ['в 3D формате', 'слитный акроним "3D" не расклеивается пробелом'],
  ['ее в банк, чтобы повысить', '"чтобы" не отрывается от следующего слова (неразрывный пробел)'],
  ['на рынке  в Белогорске\nи Амурской области', 'намеренный перенос строки не склеивается'],
  ['Активация системы, так как таз выше головы', 'составной союз "так как" не разрывается'],
  ['Так получилось, что мы опоздали', '"так" само по себе (не часть союза) не трогается'],
  ['ИНН: 280 403 620 684\nОГРНИП: 316 280 100 058 921', 'ИНН/ОГРНИП не группируются по разрядам'],
  ['Адрес: 676 805, Амурская область, г. Белогорск, ул. Ленина, д. 48', 'почтовый индекс не группируется по разрядам'],
  ['676 805, Амурская область, г. Белогорск, ул. Ленина, д. 48', 'индекс в начале адреса без метки "Адрес:" тоже не группируется'],
  ['123456 рублей на счету', 'обычное 6-значное число (не индекс) по-прежнему группируется'],
];

const PHONE_CASES = CASES.filter(([, label]) => label.startsWith('телефон:'));

(async () => {
  let fails = 0;

  console.log('── Совпадение текста с эталоном (старый DP-дифф) ──');
  // Эталон: тот же code.js, но с прежним DP-диффом вместо Майерса.
  const dpRef = fs.readFileSync('./dp-reference.txt', 'utf8');
  const oldBody = body.slice(0, body.indexOf('const MYERS_MAX_D'))
    + dpRef
    + body.slice(body.indexOf('async function applyTypography'));
  const oldApi = new Function('figma', `${oldBody}
    return { typografize, stripListMarkers, capitalizeListParagraphs, getListParagraphFlags, applyListMarkers, applyTypography };`)({
    loadFontAsync: async () => {}, currentPage: { selection: [] },
    clientStorage: { getAsync: async () => null, setAsync: async () => {} },
    notify: () => {}, ui: { postMessage: () => {} },
  });

  async function runOld(node, opts) {
    const oldText = node.characters;
    let w = oldText, mt = null;
    if (opts.lists) { const s = oldApi.stripListMarkers(w); w = s.text; mt = s.types; }
    const nf = opts.lists ? oldApi.getListParagraphFlags(node, oldText) : null;
    let nt = oldApi.typografize(w, opts);
    if (opts.lists) nt = oldApi.capitalizeListParagraphs(nt, mt.map((t, i) => !!t || (nf && nf[i])));
    await oldApi.applyTypography(node, nt);
    if (opts.lists && mt.some(Boolean)) oldApi.applyListMarkers(node, nt, mt);
    return nt;
  }

  for (const [text, label] of CASES) {
    const a = new FakeText(text);
    const b = new FakeText(text);
    await runOnNode(a, OPTS);
    await runOld(b, OPTS);
    const same = a.characters === b.characters;
    const stylesSame = a.styles.join('') === b.styles.join('');
    if (!same || !stylesSame) {
      fails++;
      console.log(`  ❌ ${label}`);
      if (!same) console.log(`     новый: ${JSON.stringify(a.characters)}\n     старый: ${JSON.stringify(b.characters)}`);
      if (!stylesSame) console.log(`     стили новый: ${a.styles.join('')}\n     стили старый: ${b.styles.join('')}`);
    } else {
      console.log(`  ✓ ${label} → ${JSON.stringify(a.characters)}`);
    }
  }

  console.log('\n── Телефоны: все варианты сводятся к одному написанию ──');
  const PHONE_EXPECTED = '+7 (953) 837-14-29';
  for (const [text, label] of PHONE_CASES) {
    const got = api.typografize(text, OPTS);
    if (got !== PHONE_EXPECTED) {
      fails++;
      console.log(`  ❌ ${label}: получено ${JSON.stringify(got)}, ожидалось ${JSON.stringify(PHONE_EXPECTED)}`);
    } else {
      console.log(`  ✓ ${label}`);
    }
  }

  console.log('\n── Сохранение оформления: сколько исходных символов теряет стиль ──');
  // Точное совпадение позиций стилей с DP требовать нельзя: при равной цене
  // существует несколько одинаково минимальных выравниваний, и Myers может
  // сохранить не тот из ДВУХ ОДИНАКОВЫХ соседних символов (два пробела подряд,
  // пробел до/после тире). Значимо другое — не стало ли переписанных символов
  // больше: именно они теряют своё оформление.
  const dpRefDiff = new Function(`${dpRef}; return diffHunks;`)();
  const del = (hs) => hs.reduce((a, h) => a + (h.oldEnd - h.oldStart), 0);
  const ins = (hs) => hs.reduce((a, h) => a + h.insertText.length, 0);
  for (const [text, label] of CASES) {
    if (!text) continue;
    const after = api.typografize(text, OPTS);
    let dM = 0, dD = 0, iM = 0, iD = 0;
    const oldParas = text.split('\n');
    const newParas = after.split('\n');
    for (let i = 0; i < oldParas.length; i++) {
      if (newParas[i] === undefined || oldParas[i] === newParas[i]) continue;
      const hM = api.diffHunks(oldParas[i], newParas[i]);
      const hD = dpRefDiff(oldParas[i], newParas[i]);
      dM += del(hM); dD += del(hD); iM += ins(hM); iD += ins(hD);
    }
    const ok = dM <= dD && iM <= iD;
    if (!ok) { fails++; console.log(`  ❌ ${label}: удалено ${dM} против ${dD} у DP, вставлено ${iM} против ${iD}`); }
    else console.log(`  ✓ ${label}: удалено ${dM} (DP ${dD}), вставлено ${iM} (DP ${iD})`);
  }

  console.log('\n── Списки Figma переживают правку ──');
  {
    const node = new FakeText('- вектор\n- растр');
    node.lists.set(0, { type: 'UNORDERED' });
    await runOnNode(node, OPTS);
    const ok = node.lists.size > 0;
    console.log(`  ${ok ? '✓' : '❌'} listOptions выставлены: ${JSON.stringify([...node.lists.values()])}`);
    if (!ok) fails++;
  }

  console.log(`\n${fails ? '❌ ПРОВАЛОВ: ' + fails : '✅ Все интеграционные проверки пройдены'}`);
  process.exit(fails ? 1 : 0);
})();
