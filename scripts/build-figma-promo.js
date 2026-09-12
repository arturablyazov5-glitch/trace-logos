#!/usr/bin/env node
/**
 * Запекает промо-блок Trace Logo's в ui.html плагинов Figma.
 *
 *   Источник разметки:  tools/figma-plugins/_shared/promo-banner.html
 *   Картинки:           tools/extensions/reviews-exporter/promo-assets/*.svg
 *                       + assets/logos/svgs/trace-logos.svg (иконка)
 *   Счётчики:           scripts/lib/counts.js (те же, что у build-plugin-assets.js)
 *   Куда:               tools/figma-plugins/<plugin>/ui.html, между
 *                       <!-- PROMO:START --> и <!-- PROMO:END -->
 *
 * Плагин trace-logos намеренно не в списке: он сам и есть каталог.
 *
 * Почему отдельный скрипт, а не три копии блока руками: у плагинов нет
 * сборки, ui.html у каждого свой единственный файл — без генератора одна
 * и та же разметка жила бы в трёх местах и разъехалась бы на первой же
 * правке (ровно то, от чего build-home-collections.js спасает подборки).
 *
 * Флаги: --dry-run — показать, что изменится, ничего не писать.
 */

const fs = require('fs');
const path = require('path');
const { getLogoReadyCount, getEmojiCount } = require('./lib/counts');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'tools/figma-plugins/_shared/promo-banner.html');
const ASSETS = path.join(ROOT, 'tools/extensions/reviews-exporter/promo-assets');
const BRAND_ICON = path.join(ROOT, 'assets/logos/svgs/trace-logos.svg');

const START = '<!-- PROMO:START -->';
const END = '<!-- PROMO:END -->';

// utm_source у каждого плагина свой — иначе в аналитике не отличить,
// какой из них реально приводит людей на сайт.
const PLUGINS = [
  { dir: 'clean-layers', utm: 'figma-clean-layers' },
  { dir: 'photo-editor', utm: 'figma-photo-editor' },
  { dir: 'typograf', utm: 'figma-typograf' },
  { dir: 'style-scanner', utm: 'figma-style-scanner' },
  { dir: 'pdf-to-svg', utm: 'figma-pdf-to-svg' },
];

// Те же шесть брендов, что в промо-блоке расширений (reviews-exporter,
// taptop-helper) — узнаваемые и на маркетплейсах, и в дизайне.
const STRIP = [
  ['ozon', 'Ozon'],
  ['wildberries', 'Wildberries'],
  ['2gis', '2ГИС'],
  ['yandex', 'Яндекс'],
  ['sber', 'Сбер'],
  ['vk', 'ВКонтакте'],
];

const dryRun = process.argv.includes('--dry-run');

function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

function svgDataUri(file) {
  const svg = fs.readFileSync(file, 'utf8').trim();
  return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
}

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

if (!fs.existsSync(SRC)) fail('нет источника: ' + path.relative(ROOT, SRC));
if (!fs.existsSync(BRAND_ICON)) fail('нет иконки: ' + path.relative(ROOT, BRAND_ICON));

const logoCount = getLogoReadyCount();
const emojiCount = getEmojiCount();

const logoStrip = STRIP.map(([slug, name]) => {
  const file = path.join(ASSETS, slug + '.svg');
  if (!fs.existsSync(file)) fail('нет логотипа для полоски: ' + path.relative(ROOT, file));
  return `<img class="tlp-logo" src="${svgDataUri(file)}" alt="${name}" title="${name}" />`;
}).join('\n    ');

const replacements = {
  BRAND_ICON: svgDataUri(BRAND_ICON),
  LOGO_STRIP: logoStrip,
  LOGO_COUNT: `${logoCount} ${plural(logoCount, 'логотип', 'логотипа', 'логотипов')}`,
  EMOJI_COUNT: `${emojiCount} ${plural(emojiCount, 'эмодзи', 'эмодзи', 'эмодзи')}`,
  MORE_COUNT: `${logoCount - STRIP.length} ${plural(logoCount - STRIP.length, 'бренд', 'бренда', 'брендов')}`,
};

// Комментарий-шапка источника объясняет устройство самого источника — в
// ui.html плагина ему делать нечего. Режем по первому <style>, а не
// регуляркой по комментарию: внутри шапки упоминаются маркеры, и
// «нежадный» поиск закрывающего --> обрывал её на середине, вываливая
// хвост шапки прямо в разметку плагина.
const rawTemplate = fs.readFileSync(SRC, 'utf8');
const styleAt = rawTemplate.indexOf('<style>');
if (styleAt === -1) fail('в источнике нет тега <style> — не от чего отрезать шапку');
const template = rawTemplate.slice(styleAt);

let written = 0;
for (const plugin of PLUGINS) {
  const file = path.join(ROOT, 'tools/figma-plugins', plugin.dir, 'ui.html');
  if (!fs.existsSync(file)) fail('нет ui.html: ' + path.relative(ROOT, file));

  const html = fs.readFileSync(file, 'utf8');
  const from = html.indexOf(START);
  const to = html.indexOf(END);
  if (from === -1 || to === -1 || to < from) {
    fail(`в ${plugin.dir}/ui.html нет маркеров ${START} … ${END}`);
  }

  let block = template.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    if (key === 'UTM') return plugin.utm;
    if (!(key in replacements)) fail(`неизвестный плейсхолдер {{${key}}} в источнике`);
    return replacements[key];
  });

  const next = html.slice(0, from + START.length) + '\n' + block.trim() + '\n' + html.slice(to);
  if (next === html) {
    console.log(`= ${plugin.dir}/ui.html — без изменений`);
    continue;
  }
  written++;
  if (dryRun) {
    console.log(`~ ${plugin.dir}/ui.html — обновился бы (${block.length} симв.)`);
  } else {
    fs.writeFileSync(file, next);
    console.log(`✓ ${plugin.dir}/ui.html — промо-блок обновлён`);
  }
}

console.log(
  dryRun
    ? `\n[dry-run] изменилось бы файлов: ${written}`
    : `\nГотово. Изменено файлов: ${written}. Логотипов: ${logoCount}, эмодзи: ${emojiCount}.`
);
