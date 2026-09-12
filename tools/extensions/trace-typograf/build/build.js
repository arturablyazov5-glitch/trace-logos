#!/usr/bin/env node
'use strict';

// Склеивает файлы из src/**/*.js в один content-script (dist/content.js).
//
// Почему конкатенация, а не ES-модули: content_scripts в MV3 можно объявить
// с "type": "module", но тогда каждый относительный import — это отдельный
// сетевой/дисковый запрос ДО того, как скрипт начнёт слушать сообщения от
// попапа, и на страницах со своим importmap/CSP (частый случай у
// конструкторов сайтов) это источник тихих поломок. Плоская конкатенация в
// один файл — тот же приём, что build-js-minify.js использует для сайта
// (но здесь без минификации: расширение маленькое, а читаемый dist/content.js
// проще смотреть в chrome://extensions при отладке).
//
// Файлы внутри одной группы (core/rules, dom, content) не оборачиваются в
// собственную область видимости — они специально пишутся как плоские
// верхнеуровневые function/const и ссылаются друг на друга по имени
// напрямую, как если бы все были одним файлом. ВЕСЬ склеенный результат
// оборачивается в один IIFE, чтобы не утекать в глобальную область видимости
// страницы, на которой выполняется content script.
//
// Порядок ВАЖЕН и задан явно (а не подобран через readdir):
// constants.js должен быть первым, typografize.js/typografizeProtected.js —
// после всех fix*-правил, platform/ — после core/rules (использует NBSP из
// constants.js) и до dom/ (applyTypografToElement.js читает detectPlatform),
// content/ — последним.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist', 'content.js');
// MAIN-world мост (platformMain/taptopMainBridge.js) — единственный файл,
// который НЕ входит в dist/content.js: у него отдельный content_scripts
// блок в manifest.json с "world": "MAIN" (chrome.runtime недоступен там,
// а ISOLATED-мир, где живёт dist/content.js, не видит их внутренний API —
// см. комментарий в самом файле). Копируется как есть, конкатенировать не
// с чем — он один.
const MAIN_BRIDGE_SRC = path.join(SRC, 'platformMain', 'taptopMainBridge.js');
const MAIN_BRIDGE_OUT = path.join(ROOT, 'dist', 'taptop-main-bridge.js');

const CORE_RULES_ORDER = [
  'constants.js',
  'fixEllipsis.js',
  'fixSpaces.js',
  'fixEmojiSpacing.js',
  'fixEmoticons.js',
  'fixDashes.js',
  'fixQuotes.js',
  'fixAbbreviations.js',
  'fixAddressAbbreviations.js',
  'fixPhone.js',
  'fixNumbers.js',
  'fixIdCodes.js',
  'fixInitials.js',
  'fixShortWords.js',
  'fixCompoundConjunctions.js',
  'abbreviationHelpers.js',
  'stripQuoteTrailingPeriod.js',
  'typografize.js',
  'typografizeProtected.js',
];

const UI_ORDER = [
  'waitForDocumentFocus.js',
  'progressOverlay.js',
];

const PLATFORM_ORDER = [
  'detectPlatform.js',
  'taptopQuirks.js',
  'taptopApiBridge.js',
  'waitForStableEditable.js',
  'focusTaptopEditable.js',
  'applyTaptopNoBreakRuns.js',
  'enterTaptopEditModeIfNeeded.js',
  'exitTaptopEditing.js',
  'collectTaptopTextRows.js',
  'applyTypografToTaptopSelection.js',
];

const DOM_ORDER = [
  'isEditableElement.js',
  'getEditableRoot.js',
  'normalizeBrToSpace.js',
  'getElementText.js',
  'myersDiff.js',
  'diffToHunks.js',
  'textNodeOffsetMap.js',
  'rangeFromOffsets.js',
  'applyHunksToContentEditable.js',
  'applyHunksToInput.js',
  'applyTypografToElement.js',
];

const CONTENT_ORDER = [
  'trackFocusedEditable.js',
  'contentEntry.js',
];

function readGroup(dirName, files) {
  const dir = path.join(SRC, dirName);
  return files.map((name) => {
    const abs = path.join(dir, name);
    if (!fs.existsSync(abs)) {
      throw new Error(`Ожидаемый файл сборки отсутствует: src/${dirName}/${name}`);
    }
    const code = fs.readFileSync(abs, 'utf8').trimEnd();
    return `// ---- src/${dirName}/${name} ----\n${code}`;
  });
}

function build() {
  const dryRun = process.argv.includes('--dry-run');

  const parts = [
    ...readGroup('core/rules', CORE_RULES_ORDER),
    ...readGroup('ui', UI_ORDER),
    ...readGroup('platform', PLATFORM_ORDER),
    ...readGroup('dom', DOM_ORDER),
    ...readGroup('content', CONTENT_ORDER),
  ];

  // Просто дата сборки в шапке файла, для чтения глазами при отладке — не
  // логика. Раньше эта же дата шла ещё и в рантайм-константу BUILD_STAMP,
  // на которой был построен пинг/автовпрыскивание/дедуп слушателей между
  // попапом и content script'ом — весь этот механизм убран 2026-08-22:
  // он должен был чинить единственную реальную проблему (Chrome не
  // переинжектит content script в уже открытую вкладку после reload
  // расширения), но вместо этого сам стал источником непредсказуемых
  // сбоев. Починка одна и простая: обновить страницу (Cmd+R) — popup.js
  // прямо об этом просит, когда сообщение не доходит до вкладки.
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const header = [
    '// АВТОСГЕНЕРИРОВАНО build/build.js — не редактировать руками.',
    '// Правь файлы в src/ и запусти `node build/build.js` заново.',
    `// Собрано: ${stamp}`,
  ].join('\n');

  const body = parts.join('\n\n');
  const bundle = `${header}\n\n(function () {\n'use strict';\n\n${body}\n\n})();\n`;

  if (dryRun) {
    const totalFiles = CORE_RULES_ORDER.length + UI_ORDER.length + PLATFORM_ORDER.length + DOM_ORDER.length + CONTENT_ORDER.length;
    console.log(`[dry-run] собрал бы ${totalFiles} файлов → ${OUT} (${bundle.length} байт)`);
    console.log(`[dry-run] скопировал бы ${path.relative(ROOT, MAIN_BRIDGE_SRC)} → ${MAIN_BRIDGE_OUT}`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, bundle);
  console.log(`✓ dist/content.js собран из ${parts.length} файлов (${bundle.length} байт), штамп ${stamp}`);

  if (!fs.existsSync(MAIN_BRIDGE_SRC)) {
    throw new Error(`Ожидаемый файл сборки отсутствует: ${path.relative(ROOT, MAIN_BRIDGE_SRC)}`);
  }
  fs.copyFileSync(MAIN_BRIDGE_SRC, MAIN_BRIDGE_OUT);
  console.log(`✓ dist/taptop-main-bridge.js скопирован`);
}

build();
