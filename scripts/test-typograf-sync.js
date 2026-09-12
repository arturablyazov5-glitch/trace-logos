#!/usr/bin/env node
'use strict';

/**
 * Read-only проверка: блок правил, запечённый в `code.js` плагина Figma,
 * совпадает байт в байт с источником
 * `tools/figma-plugins/_shared/typograf-rules.js`, который тот же `require()`-ит
 * Node-сторона (`scripts/lib/typograf.js` → `apply-typography.js`).
 *
 * Зачем: до 2026-08-19 правила жили двумя независимыми копиями, а синхронность
 * держалась на строчке в CLAUDE.md «правь оба файла». Копии молча разъехались —
 * плагин умел «кв. м. → м²», «10 градусов → 10°», НБСП после «рис./табл./гл.»
 * и «10+ шт», а сайт прогонялся через версию без этого. Заметить это было
 * нечем: оба файла валидны, оба работают, тестов на совпадение не было.
 * Теперь расхождение роняет сборку — ровно как `test-ecosystem-sync.js`
 * стережёт сгенерированный блок в `js/data.js`.
 *
 * Ожидаемый блок собирается той же функцией `buildBlock()`, что и пишет
 * `build-figma-typograf.js`, — генератор и тест физически не могут разойтись
 * между собой, только оба разом с источником.
 *
 * Дополнительно проверяется, что источник парсится (`node --check` смысла не
 * имеет — файл и так `require()`-ится) и что он не тянет ничего из Figma:
 * попадание `figma.` в общий файл сломало бы Node-сборку сайта.
 *
 * `--warn-only` — отчёт без exit 1.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { buildBlock, currentBlock, SRC, DEST } = require('./build-figma-typograf.js');

const rel = (p) => path.relative(ROOT, p);
const warnOnly = process.argv.includes('--warn-only');

let failed = 0;
const fail = (msg) => { console.error(`✗ ${msg}`); failed++; };

// 1. Источник вообще загружается и отдаёт то, чем пользуются оба потребителя.
let rules = null;
try {
  rules = require(SRC);
} catch (e) {
  fail(`${rel(SRC)} не загружается: ${e.message}`);
}

if (rules) {
  const REQUIRED = ['typografize', 'typografizeProtected', 'stripSingleSentenceTrailingPeriod', 'fixQuotes', 'DEFAULT_OPTS'];
  for (const name of REQUIRED) {
    if (!(name in rules)) fail(`${rel(SRC)} не экспортирует ${name} — сломается scripts/lib/typograf.js`);
  }
}

// 2. В общем файле нет ничего от Figma API. Такая строка означала бы, что
//    правило написали «по месту» в плагине и оно не заработает в Node.
const srcText = fs.readFileSync(SRC, 'utf8');
const figmaHit = srcText.split('\n').findIndex((l) => /(^|[^\w.])figma\./.test(l) && !/^\s*(\/\/|\*)/.test(l));
if (figmaHit !== -1) {
  fail(`${rel(SRC)}:${figmaHit + 1} обращается к figma.* — общий файл должен быть чистым от Figma API`);
}

// 3. Главное: запечённый блок совпадает с источником.
const code = fs.readFileSync(DEST, 'utf8');
const current = currentBlock(code);
if (current === null) {
  fail(`${rel(DEST)}: не найдены маркеры RULES:START / RULES:END`);
} else {
  const expected = buildBlock();
  if (current !== expected) {
    const a = current.split('\n');
    const b = expected.split('\n');
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    fail(
      `${rel(DEST)} разошёлся с ${rel(SRC)} на строке ${i + 1} блока правил.\n` +
      `  в плагине: ${JSON.stringify(a[i] === undefined ? '(конец блока)' : a[i])}\n` +
      `  в источнике: ${JSON.stringify(b[i] === undefined ? '(конец блока)' : b[i])}\n` +
      '  Правила правятся в источнике; запечь — node scripts/build-figma-typograf.js'
    );
  }
}

if (failed && !warnOnly) {
  console.error(`\n${failed} проблем(ы) синхронизации типографики`);
  process.exit(1);
}
if (failed) {
  console.log(`\n${failed} проблем(ы), но --warn-only`);
} else {
  console.log('✓ Правила типографики: плагин и сайт из одного источника');
}
