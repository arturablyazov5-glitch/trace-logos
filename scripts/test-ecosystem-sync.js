#!/usr/bin/env node
/**
 * Read-only проверка: блок ECOSYSTEMS в js/data.js (ecosystemLogoMap/Labels/
 * LabelsEn/SectionLabels/SectionLabelsEn) действительно сгенерирован из
 * ТЕКУЩЕГО logos/ecosystems.json, а не отредактирован руками и не устарел.
 *
 * Использует тот же генератор (scripts/lib/ecosystem-nav.js), что и
 * build-ecosystem-nav.js, — сравнение байт-в-байт, так что тест и генератор
 * не могут разойтись между собой, только оба разойтись с ecosystems.json,
 * а это ровно тот дрейф, который нужно ловить.
 *
 * Дополнительно проверяет:
 *   - каждый `icon` в ecosystems.json указывает на реально существующий файл
 *     в assets/logos/svgs/ — опечатка в имени файла не всплывёт как
 *     синтаксическая ошибка, только как немая буква-заглушка в сайдбаре;
 *   - у КАЖДОЙ экосистемы, в которой есть хотя бы один не-comingSoon логотип,
 *     задан `icon` — иначе сайдбар рисует букву вместо иконки для реального,
 *     давно живого раздела каталога (найдено на `x5` 2026-08-04: у Пятёрочки,
 *     Чижика и Перекрёстка давно есть логотипы, иконки экосистемы не было —
 *     сихронизация ключей/лейблов это не ловила, потому что `icon` — опциональное
 *     поле и его отсутствие само по себе не ошибка, только для *пустых*
 *     (comingSoon) экосистем).
 *
 * Fails the build (exit 1) при расхождении. --warn-only — отчёт без exit 1.
 */

const fs   = require('fs');
const path = require('path');
const { generateEcosystemsBlock } = require('./lib/ecosystem-nav');

const ROOT             = path.resolve(__dirname, '..');
const ECOSYSTEMS_JSON  = path.join(ROOT, 'logos', 'ecosystems.json');
const DATA_JS           = path.join(ROOT, 'js', 'data.js');
const SVGS_DIR           = path.join(ROOT, 'assets', 'logos', 'svgs');
const MANIFEST_JSON      = path.join(ROOT, 'logos', 'manifest.json');
const WARN_ONLY          = process.argv.includes('--warn-only');

const MARKER_RE = /\/\/ ECOSYSTEMS:START\n([\s\S]*?)\n[ \t]*\/\/ ECOSYSTEMS:END/;

function itemEcosystems(item) {
  return Array.isArray(item.ecosystem) ? item.ecosystem : item.ecosystem ? [item.ecosystem] : [];
}

// key → count of non-comingSoon items using it, across every logos/categories/*.json
function countRealItemsByEcosystem() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_JSON, 'utf8'));
  const counts = new Map();
  for (const cat of manifest.categories) {
    const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8')).items || [];
    for (const item of items) {
      if (item.comingSoon) continue;
      for (const eco of itemEcosystems(item)) {
        counts.set(eco, (counts.get(eco) || 0) + 1);
      }
    }
  }
  return counts;
}

function main() {
  const errors = [];
  const warnings = [];

  const ecosystems = JSON.parse(fs.readFileSync(ECOSYSTEMS_JSON, 'utf8'));
  const expected = generateEcosystemsBlock(ecosystems);

  const src = fs.readFileSync(DATA_JS, 'utf8');
  const m = src.match(MARKER_RE);
  if (!m) {
    errors.push('js/data.js: не найдены маркеры // ECOSYSTEMS:START / // ECOSYSTEMS:END');
  } else if (m[1] !== expected) {
    errors.push(
      'js/data.js: блок ECOSYSTEMS разошёлся с logos/ecosystems.json — ' +
      'запусти `node scripts/build-ecosystem-nav.js` (входит в build-all.js)'
    );
  }

  for (const [key, def] of Object.entries(ecosystems)) {
    if (!def.icon) continue;
    const iconPath = path.join(SVGS_DIR, def.icon);
    if (!fs.existsSync(iconPath)) {
      errors.push(`logos/ecosystems.json: "${key}".icon = "${def.icon}" — файл не найден в assets/logos/svgs/`);
    }
  }

  // Предупреждение, не ошибка: для x5/adobe на 2026-08-04 нет готового SVG
  // логотипа-«зонтика» (Х5 Group / Adobe corporate) — это не опечатка, а
  // недостающий ассет, который приходится добывать/рисовать отдельно, а не
  // чинить прямо здесь. Не блокирует build-all, но остаётся видимым в выводе.
  const realCounts = countRealItemsByEcosystem();
  for (const [key, count] of realCounts) {
    const def = ecosystems[key];
    if (def && !def.icon) {
      warnings.push(
        `logos/ecosystems.json: "${key}" — ${count} готовых логотип(ов) в этой экосистеме, а поля "icon" нет. ` +
        `Добавь SVG в assets/logos/svgs/ и пропиши "icon" в ecosystems.json.`
      );
    }
  }

  console.log(`[ecosystem-sync] экосистем: ${Object.keys(ecosystems).length}, с иконкой: ${Object.values(ecosystems).filter(e => e.icon).length}`);

  if (warnings.length) {
    console.log(`\nПредупреждения (${warnings.length}):`);
    warnings.forEach(w => console.log('  ⚠ ' + w));
  }

  if (errors.length) {
    console.log(`\nОшибки (${errors.length}):`);
    errors.forEach(e => console.log('  ✗ ' + e));
    console.log(`\nОшибок: ${errors.length}, предупреждений: ${warnings.length}`);
    if (!WARN_ONLY) process.exit(1);
  } else {
    console.log(`\n✓ ecosystem-sync: js/data.js синхронизирован с logos/ecosystems.json`);
  }
}

main();
