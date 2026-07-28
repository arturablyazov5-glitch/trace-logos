#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// test-i18n.js — паритет словарей js/i18n-dict-<lang>.js. Ничего не пишет.
//
// Зачем: рантайм (js/i18n.js) грузит ТОЛЬКО словарь текущего языка и больше не
// подставляет русскую строку вместо отсутствующей английской — межъязыкового
// фолбэка нет. Раньше пропущенный ключ молча деградировал в русский текст на
// английской странице; теперь он отрендерится как сырой ключ ("copySvg"), что
// заметно хуже. Эта проверка — то, что заменило фолбэк: расхождение роняет сборку
// ДО деплоя, а не всплывает на живой странице.
//
// Что проверяем:
//   1. LANGS в js/i18n.js и в scripts/lib/en-transform.js совпадают, и на каждый
//      язык есть файл словаря (иначе рантайм упадёт на динамическом импорте).
//   2. Набор ключей в каждом языке идентичен языку по умолчанию (ru).
//   3. Тип значения совпадает: строка везде строка, функция везде функция —
//      t('showMore')(n) вызывается как функция, строка вместо неё = TypeError.
//   4. Арность функций совпадает (n => ... против () => ... — молчаливый "undefined"
//      в интерфейсе).
//   5. Нет пустых строк — пустой перевод визуально неотличим от вёрстки без текста.
//   6. Каждый ключ, который реально используется — data-i18n* в готовом HTML и
//      партиалах, t('key') в js/ и components/ — есть в словаре. Пункты 2-5
//      сравнивают словари между собой; этот пункт сравнивает словарь с кодом:
//      опечатка в data-i18n или удалённый ключ рендерятся сырой строкой на всех
//      языках сразу, паритет при этом идеальный.
//
// Запуск: node scripts/test-i18n.js  (входит в fast tier build-all.js)
//   --strict  — предупреждения тоже роняют сборку
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');
const { loadDict, LANGS, DEFAULT } = require('./lib/en-transform');

const ROOT   = path.join(__dirname, '..');
const STRICT = process.argv.includes('--strict');

let errors = 0;
let warns  = 0;
const fail = msg => { console.error(`  ✗ ${msg}`); errors++; };
const warn = msg => { console.warn(`  ! ${msg}`); warns++; };

// ── 1. LANGS синхронны между рантаймом и билдом, файлы на месте ──────────────
function checkLangsInSync() {
  const runtimeSrc = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
  const m = runtimeSrc.match(/export\s+const\s+LANGS\s*=\s*\[([^\]]*)\]/);
  if (!m) {
    fail('js/i18n.js — не найден `export const LANGS = [...]`; проверка языков невозможна');
    return;
  }
  const runtimeLangs = m[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  const a = [...runtimeLangs].sort().join(',');
  const b = [...LANGS].sort().join(',');
  if (a !== b) {
    fail(`LANGS разошлись: js/i18n.js = [${runtimeLangs}], scripts/lib/en-transform.js = [${LANGS}]`);
  }

  const dm = runtimeSrc.match(/export\s+const\s+DEFAULT\s*=\s*['"]([^'"]+)['"]/);
  if (dm && dm[1] !== DEFAULT) {
    fail(`DEFAULT разошёлся: js/i18n.js = '${dm[1]}', scripts/lib/en-transform.js = '${DEFAULT}'`);
  }

  for (const lang of LANGS) {
    const f = path.join(ROOT, 'js', `i18n-dict-${lang}.js`);
    if (!fs.existsSync(f)) fail(`нет файла словаря js/i18n-dict-${lang}.js для языка '${lang}' из LANGS`);
  }

  // Рантайм импортирует словари статическими литералами — убедимся, что для
  // каждого языка такой импорт реально есть (опечатка = 404 на проде).
  for (const lang of LANGS) {
    if (!runtimeSrc.includes(`./i18n-dict-${lang}.js`)) {
      fail(`js/i18n.js не импортирует './i18n-dict-${lang}.js' — язык '${lang}' недостижим в рантайме`);
    }
  }
}

// ── 2-5. Паритет ключей, типов, арности; пустые строки ───────────────────────
function checkDicts() {
  let DICT;
  try {
    DICT = loadDict();
  } catch (e) {
    fail(`не удалось прочитать словари: ${e.message}`);
    return;
  }

  const base     = DICT[DEFAULT];
  const baseKeys = Object.keys(base);
  if (!base) { fail(`нет словаря для языка по умолчанию '${DEFAULT}'`); return; }
  console.log(`  словарь '${DEFAULT}': ${baseKeys.length} ключей`);

  for (const lang of LANGS) {
    if (lang === DEFAULT) continue;
    const other = DICT[lang];
    if (!other) { fail(`нет словаря для '${lang}'`); continue; }

    const otherKeys = Object.keys(other);
    const baseSet   = new Set(baseKeys);
    const otherSet  = new Set(otherKeys);

    const missing = baseKeys.filter(k => !otherSet.has(k));
    const extra   = otherKeys.filter(k => !baseSet.has(k));

    if (missing.length) {
      fail(`'${lang}': не хватает ${missing.length} ключей (есть в '${DEFAULT}'):`);
      missing.forEach(k => console.error(`      ${k}  →  ${JSON.stringify(String(base[k])).slice(0, 70)}`));
    }
    if (extra.length) {
      fail(`'${lang}': ${extra.length} лишних ключей (нет в '${DEFAULT}'): ${extra.join(', ')}`);
    }

    for (const k of baseKeys) {
      if (!otherSet.has(k)) continue;
      const tb = typeof base[k], to = typeof other[k];
      if (tb !== to) {
        fail(`'${lang}.${k}': тип не совпадает — '${DEFAULT}' даёт ${tb}, '${lang}' даёт ${to}`);
        continue;
      }
      if (tb === 'function' && base[k].length !== other[k].length) {
        fail(`'${lang}.${k}': арность не совпадает — '${DEFAULT}' принимает ${base[k].length} арг., '${lang}' ${other[k].length}`);
      }
      if (tb === 'string' && other[k].trim() === '') {
        warn(`'${lang}.${k}': пустая строка`);
      }
    }

    if (!missing.length && !extra.length) {
      console.log(`  словарь '${lang}': ${otherKeys.length} ключей — паритет с '${DEFAULT}' ✓`);
    }
  }

  for (const k of baseKeys) {
    if (typeof base[k] === 'string' && base[k].trim() === '') warn(`'${DEFAULT}.${k}': пустая строка`);
  }
}

// ── 6. Ключи, используемые в коде, существуют в словаре ──────────────────────
// Словари могут быть идеально согласованы между собой и при этом не содержать
// ключа, на который ссылается вёрстка: data-i18n="copySvgg" отрендерится сырым
// текстом на ОБОИХ языках. Ловится только сверкой с потребителями ключей.
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.claude', 'cdn-dist', 'figma-plugin',
  'supabase', 'sanitizer', 'upptime', 'assets',
]);

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(abs, exts, out);
    } else if (exts.some(e => entry.name.endsWith(e))) {
      out.push(abs);
    }
  }
  return out;
}

// data-i18n / data-i18n-content / data-i18n-aria / data-i18n-placeholder / …
const ATTR_RE = /\bdata-i18n(?:-[a-z-]+)?\s*=\s*"([^"]*)"/g;
// t('key') / t("key") — только литералы; t(`…${x}`) и t(varName) динамические,
// их из статики не проверить.
const T_CALL_RE = /\bt\(\s*(['"])([A-Za-z0-9_$-]+)\1\s*\)/g;

function checkUsedKeys() {
  let base;
  try { base = loadDict()[DEFAULT]; } catch { return; }
  if (!base) return;

  const known = new Set(Object.keys(base));
  const unknown = new Map(); // key → { count, sample }
  const note = (key, file) => {
    const hit = unknown.get(key);
    if (hit) hit.count++;
    else unknown.set(key, { count: 1, sample: path.relative(ROOT, file) });
  };

  const htmlFiles = walk(ROOT, ['.html']);
  const jsFiles   = [
    ...walk(path.join(ROOT, 'js'), ['.js']),
    ...walk(path.join(ROOT, 'components'), ['.js']),
  ];

  for (const file of htmlFiles) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(ATTR_RE)) {
      const key = m[1].trim();
      // Плейсхолдеры шаблонов подставляются билдом/рантаймом — статикой не проверить.
      if (!key || key.includes('{{') || key.includes('${')) continue;
      if (!known.has(key)) note(key, file);
    }
  }

  for (const file of jsFiles) {
    // Сам словарь и i18n.js оперируют ключами как данными, а не ссылаются на них.
    if (/i18n(-dict-[a-z]+)?\.js$/.test(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(T_CALL_RE)) {
      if (!known.has(m[2])) note(m[2], file);
    }
  }

  if (unknown.size) {
    fail(`${unknown.size} ключей используются, но их нет в словаре '${DEFAULT}':`);
    for (const [key, { count, sample }] of unknown) {
      console.error(`      ${key}  —  ${count}× (напр. ${sample})`);
    }
  } else {
    console.log(`  использование: ${htmlFiles.length} HTML + ${jsFiles.length} JS — все ключи найдены ✓`);
  }
}

console.log('i18n: проверка словарей');
checkLangsInSync();
checkDicts();
checkUsedKeys();

if (warns)  console.warn(`\n${warns} предупреждений`);
if (errors) {
  console.error(`\n✗ i18n: ${errors} ошибок — сборка остановлена`);
  process.exit(1);
}
if (STRICT && warns) {
  console.error('\n✗ i18n: предупреждения фатальны из-за --strict');
  process.exit(1);
}
console.log('\n✓ i18n: словари согласованы');
