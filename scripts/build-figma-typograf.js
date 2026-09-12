#!/usr/bin/env node
'use strict';

/**
 * Запекает правила типографики из единственного источника
 * `tools/figma-plugins/_shared/typograf-rules.js` в `code.js` плагина Figma
 * между маркерами `// RULES:START` / `// RULES:END`.
 *
 * Зачем запекать, а не подключать: плагин выполняется в песочнице Figma, у
 * него нет ни `require()`, ни файловой системы, а `code.js` грузится как один
 * файл. Тот же приём, что у `build-figma-promo.js` с промо-блоком и у
 * `build-ecosystem-nav.js` с блоком экосистем в `js/data.js`.
 *
 * Node-сторона (`scripts/lib/typograf.js` → `apply-typography.js`) тот же файл
 * просто `require()`-ит, поэтому блог, JSON каталога и словари i18n гоняются
 * ровно теми же правилами, что и макеты в Figma. Расхождение запечённого
 * блока с источником ловит `scripts/test-typograf-sync.js` и роняет сборку.
 *
 * `--dry-run` — сказать, изменится ли блок, ничего не записывая.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'tools/figma-plugins/_shared/typograf-rules.js');
const DEST = path.join(ROOT, 'tools/figma-plugins/typograf/code.js');

const START = '// RULES:START';
const END = '// RULES:END';

const HEADER = [
  '// RULES:START — сгенерировано scripts/build-figma-typograf.js из',
  '// tools/figma-plugins/_shared/typograf-rules.js. РУКАМИ НЕ ПРАВИТЬ: правка',
  '// здесь будет затёрта следующим `npm run build`, а до того поймана',
  '// scripts/test-typograf-sync.js. Правила меняются в файле-источнике —',
  '// он же питает scripts/lib/typograf.js (блог, JSON каталога, i18n).',
].join('\n');

/**
 * Собирает содержимое блока — то, что должно лежать между маркерами
 * включительно. Общая с тестом функция: генератор и проверка физически не
 * могут разойтись между собой, только оба разом с источником (тот же приём,
 * что у `scripts/lib/ecosystem-nav.js`).
 */
function buildBlock() {
  const rules = fs.readFileSync(SRC, 'utf8').replace(/\n+$/, '');
  return `${HEADER}\n${rules}\n${END}`;
}

// Маркеры ищутся ТОЛЬКО как строка целиком (^…$ с флагом m), а не через
// indexOf: сам файл-источник упоминает эти же слова в своём заголовке, и
// indexOf находил вхождение ВНУТРИ уже запечённого блока — «конец» блока
// оказывался на 30-й строке от его начала, замена вставляла полный блок
// поверх куска, а хвост старого оставался в файле. Плагин после этого не
// запускался вообще: `const NBSP` объявлялся дважды, SyntaxError на старте.
const START_RE = /^\/\/ RULES:START.*$/m;
const END_RE = /^\/\/ RULES:END$/m;

function currentBlock(code) {
  const from = START_RE.exec(code);
  const to = END_RE.exec(code);
  if (!from || !to || to.index < from.index) return null;
  return code.slice(from.index, to.index + to[0].length);
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const code = fs.readFileSync(DEST, 'utf8');
  const current = currentBlock(code);

  if (current === null) {
    console.error(`✗ В ${path.relative(ROOT, DEST)} нет маркеров ${START} / ${END}`);
    process.exit(1);
  }

  const next = buildBlock();
  if (current === next) {
    console.log('✓ Правила типографики в плагине уже совпадают с источником');
    return;
  }

  if (dryRun) {
    console.log('[dry-run] Блок правил в плагине обновился бы');
    return;
  }

  // Замена ФУНКЦИЕЙ, а не строкой: в правилах полно replace-шаблонов вида
  // `$1`/`  fs.writeFileSync(DEST, code.replace(current, next));`, и в строковом аргументе replace() они были бы поняты как
  // ссылки на группы совпадения — блок уехал бы в плагин покорёженным
  // (поймано на первом же прогоне: `$1` превратился в текст маркеров).
  fs.writeFileSync(DEST, code.replace(current, () => next));
  console.log(`✓ Правила запечены в ${path.relative(ROOT, DEST)}`);
}

if (require.main === module) main();

module.exports = { buildBlock, currentBlock, SRC, DEST, START, END };
