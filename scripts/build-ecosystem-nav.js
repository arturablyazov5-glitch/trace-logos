#!/usr/bin/env node
/**
 * Синхронизирует блок ECOSYSTEMS в js/data.js (ecosystemLogoMap,
 * ecosystemLabels, ecosystemLabelsEn, ecosystemSectionLabels,
 * ecosystemSectionLabelsEn) с logos/ecosystems.json.
 *
 * logos/ecosystems.json — источник истины. До этого скрипта пять объектов
 * в js/data.js были ручной копией того же самого списка — новую экосистему
 * (или новую иконку для существующей) нужно было прописывать в двух местах,
 * и второе легко забывалось: `gwm` и `litres` попали в ecosystems.json, но
 * не в js/data.js, из-за чего сайдбар показывал сырой ключ вместо лейбла и
 * букву-заглушку вместо иконки (обнаружено 2026-08-04).
 *
 * Патчит js/data.js между маркерами // ECOSYSTEMS:START / // ECOSYSTEMS:END —
 * никогда не редактируй этот блок руками, он будет переписан следующим билдом.
 *
 * Опциональные поля записи ecosystems.json, которые читает только этот скрипт
 * (build-ecosystem-pages.js / build-seo-pages.js их не используют):
 *   - `icon`     — файл в assets/logos/svgs/, 16×16 иконка для сайдбара;
 *                  экосистема без иконки просто не попадает в ecosystemLogoMap
 *                  (в сайдбаре рендерится буква-заглушка — существующее
 *                  поведение для x5/kontur/adobe/PlayStation)
 *   - `navLabel` — { ru, en } короткая подпись для сайдбара, когда полное
 *                  `ru`/`en` (используется в <title>/<h1> страницы экосистемы)
 *                  для узкого списка слишком длинное, напр. artlebedev
 *
 * Usage:
 *   node scripts/build-ecosystem-nav.js            # записать js/data.js
 *   node scripts/build-ecosystem-nav.js --dry-run  # только показать статистику
 */

const fs   = require('fs');
const path = require('path');
const { generateEcosystemsBlock } = require('./lib/ecosystem-nav');

const ROOT           = path.resolve(__dirname, '..');
const ECOSYSTEMS_JSON = path.join(ROOT, 'logos', 'ecosystems.json');
const DATA_JS         = path.join(ROOT, 'js', 'data.js');
const DRY_RUN          = process.argv.includes('--dry-run');

const MARKER_RE = /([ \t]*)(\/\/ ECOSYSTEMS:START)[\s\S]*?([ \t]*)(\/\/ ECOSYSTEMS:END)/;

function main() {
  const ecosystems = JSON.parse(fs.readFileSync(ECOSYSTEMS_JSON, 'utf8'));
  const block = generateEcosystemsBlock(ecosystems);

  const src = fs.readFileSync(DATA_JS, 'utf8');
  if (!MARKER_RE.test(src)) {
    throw new Error('js/data.js: не найдены маркеры // ECOSYSTEMS:START / // ECOSYSTEMS:END');
  }

  const patched = src.replace(MARKER_RE, (...m) => {
    const [, p1, p2, p3, p4] = m;
    return `${p1}${p2}\n${block}\n${p3}${p4}`;
  });

  const changed = patched !== src;

  if (DRY_RUN) {
    console.log(`ecosystems: ${Object.keys(ecosystems).length}, с иконкой: ${Object.values(ecosystems).filter(e => e.icon).length}`);
    console.log(changed ? '  → js/data.js изменится' : '  · js/data.js уже синхронизирован');
    return;
  }

  if (changed) {
    fs.writeFileSync(DATA_JS, patched, 'utf8');
    console.log(`✓ js/data.js — блок ECOSYSTEMS синхронизирован (${Object.keys(ecosystems).length} экосистем)`);
  } else {
    console.log(`· js/data.js уже синхронизирован (${Object.keys(ecosystems).length} экосистем)`);
  }
}

main();
