#!/usr/bin/env node
'use strict';

/**
 * Запекает словарь ёфикатора из единственного источника
 * `tools/figma-plugins/typograf/resources/yo.js` в `code.js` того же плагина
 * между маркерами `// YO_WORDS:START` / `// YO_WORDS:END`.
 *
 * Зачем запекать, а не подключать: плагин выполняется в песочнице Figma, у
 * него нет ни `require()`, ни файловой системы, а `code.js` грузится как один
 * файл. Тот же приём, что у `build-figma-typograf.js` с правилами типографики
 * и у `build-figma-promo.js` с промо-блоком.
 *
 * В отличие от `build-figma-typograf.js` источник здесь НЕ используется на
 * сайте — ёфикатор сознательно только плагин (см. `code.js`, блок над
 * `YO_WORDS:START`), поэтому нет второго потребителя и нет
 * `scripts/lib/*.js`-обёртки для Node. Отдельный скрипт — не расширение
 * `build-figma-typograf.js`, потому что источники и правила запекания у двух
 * блоков разные (словарь данных против чистых функций), общий генератор
 * усложнил бы оба случая без выгоды.
 *
 * `--dry-run` — сказать, изменится ли блок, ничего не записывая.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'tools/figma-plugins/typograf/resources/yo.js');
const DEST = path.join(ROOT, 'tools/figma-plugins/typograf/code.js');

const START = '// YO_WORDS:START';
const END = '// YO_WORDS:END';

const HEADER = [
  '// YO_WORDS:START — сгенерировано scripts/build-figma-yo.js из',
  '// tools/figma-plugins/typograf/resources/yo.js. РУКАМИ НЕ ПРАВИТЬ: правка',
  '// здесь будет затёрта следующим `npm run build`, а до того поймана',
  '// scripts/test-yo-sync.js. Список слов меняется в файле-источнике.',
].join('\n');

/**
 * Собирает содержимое блока — то, что должно лежать между маркерами
 * включительно. Общая с тестом функция: генератор и проверка физически не
 * могут разойтись между собой, только оба разом с источником (тот же приём,
 * что у `build-figma-typograf.js`).
 */
function buildBlock() {
  const words = fs.readFileSync(SRC, 'utf8').replace(/\n+$/, '');
  return `${HEADER}\n${words}\n${END}`;
}

// Маркеры ищутся ТОЛЬКО как строка целиком (^…$ с флагом m) — см.
// build-figma-typograf.js про то, почему indexOf здесь ловушка (заголовок
// источника сам мог бы упомянуть эти же слова).
const START_RE = /^\/\/ YO_WORDS:START.*$/m;
const END_RE = /^\/\/ YO_WORDS:END$/m;

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
    console.log('✓ Словарь ёфикатора в плагине уже совпадает с источником');
    return;
  }

  if (dryRun) {
    console.log('[dry-run] Блок словаря ёфикатора в плагине обновился бы');
    return;
  }

  // Замена ФУНКЦИЕЙ, а не строкой — строковый второй аргумент replace()
  // разбирает `$1`-подобные подстроки как ссылки на группы совпадения.
  fs.writeFileSync(DEST, code.replace(current, () => next));
  console.log(`✓ Словарь ёфикатора запечён в ${path.relative(ROOT, DEST)}`);
}

if (require.main === module) main();

module.exports = { buildBlock, currentBlock, SRC, DEST, START, END };
