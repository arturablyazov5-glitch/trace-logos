#!/usr/bin/env node
'use strict';

/**
 * Read-only проверка: блок словаря ёфикатора, запечённый в `code.js` плагина
 * Figma, совпадает байт в байт с источником
 * `tools/figma-plugins/typograf/resources/yo.js`.
 *
 * Тот же приём, что и `test-typograf-sync.js` для блока правил типографики:
 * ожидаемый блок собирается той же функцией `buildBlock()`, что пишет
 * `build-figma-yo.js`, — генератор и тест физически не могут разойтись между
 * собой, только оба разом с источником.
 *
 * `--warn-only` — отчёт без exit 1.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { buildBlock, currentBlock, SRC, DEST } = require('./build-figma-yo.js');

const rel = (p) => path.relative(ROOT, p);
const warnOnly = process.argv.includes('--warn-only');

let failed = 0;
const fail = (msg) => { console.error(`✗ ${msg}`); failed++; };

// 1. Источник — плоский `const WORDS = [...]` без module.exports (в отличие
//    от typograf-rules.js у него нет Node-потребителя, поэтому require()
//    здесь не подходит — вернул бы пустой module.exports, а не массив).
//    Синтаксис проверяем через node --check на временной копии, форму — по
//    исходному тексту.
const srcText = fs.readFileSync(SRC, 'utf8');
if (!/^const WORDS = \[/.test(srcText)) {
  fail(`${rel(SRC)} должен начинаться с "const WORDS = ["`);
}
if (!srcText.includes('ё')) {
  fail(`${rel(SRC)} не содержит ни одной буквы «ё» — похоже на пустой список`);
}
try {
  const os = require('os');
  const tmp = path.join(os.tmpdir(), 'yo-src-check.mjs');
  fs.writeFileSync(tmp, srcText);
  require('child_process').execFileSync(process.execPath, ['--check', tmp]);
  fs.unlinkSync(tmp);
} catch (e) {
  fail(`${rel(SRC)} не проходит синтаксическую проверку: ${e.message}`);
}

// 2. Главное: запечённый блок совпадает с источником.
const code = fs.readFileSync(DEST, 'utf8');
const current = currentBlock(code);
if (current === null) {
  fail(`${rel(DEST)}: не найдены маркеры YO_WORDS:START / YO_WORDS:END`);
} else {
  const expected = buildBlock();
  if (current !== expected) {
    const a = current.split('\n');
    const b = expected.split('\n');
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    fail(
      `${rel(DEST)} разошёлся с ${rel(SRC)} на строке ${i + 1} блока словаря.\n` +
      `  в плагине: ${JSON.stringify(a[i] === undefined ? '(конец блока)' : a[i])}\n` +
      `  в источнике: ${JSON.stringify(b[i] === undefined ? '(конец блока)' : b[i])}\n` +
      '  Словарь правится в источнике; запечь — node scripts/build-figma-yo.js'
    );
  }
}

if (failed && !warnOnly) {
  console.error(`\n${failed} проблем(ы) синхронизации словаря ёфикатора`);
  process.exit(1);
}
if (failed) {
  console.log(`\n${failed} проблем(ы), но --warn-only`);
} else {
  console.log('✓ Словарь ёфикатора в плагине совпадает с источником');
}
