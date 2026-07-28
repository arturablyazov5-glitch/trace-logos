#!/usr/bin/env node
/**
 * Синхронизирует список инструментов в футере («Инструменты» колонка) и в
 * EN-словаре с tools.json.
 *
 * tools.json — источник истины для отдельных браузерных инструментов
 * (tools/<slug>/, каждый — самостоятельная страница со своим UI). Плагин для
 * Figma — единственная запись в колонке, которая НЕ приходит из tools.json:
 * это внешняя ссылка на Figma Community, а не страница на сайте, и остаётся
 * захардкоженной первой строкой в партиале.
 *
 * Патчит два места, оба между маркерами TOOLS:START / TOOLS:END:
 *   - templates/partials/site-footer.html — список <li> в колонке «Инструменты»
 *     (каждая ссылка обёрнута в <span data-i18n="footerTool_<slug>">)
 *   - js/i18n-dict-ru.js / js/i18n-dict-en.js — ключи footerTool_<slug> в каждом
 *
 * Почему отдельный скрипт, а не часть build-home-collections.js: разный
 * источник данных (tools.json vs collections.json) и разная колонка футера —
 * держим один скрипт на одну зону ответственности, как и с подборками.
 *
 * Usage:
 *   node scripts/build-home-tools.js            # записать оба файла
 *   node scripts/build-home-tools.js --dry-run  # только показать статистику
 */

const fs   = require('fs');
const path = require('path');

const ROOT           = path.resolve(__dirname, '..');
const TOOLS_JSON      = path.join(ROOT, 'tools.json');
const FOOTER_PARTIAL  = path.join(ROOT, 'templates', 'partials', 'site-footer.html');
// Словарь разделён по языкам (js/i18n-dict-ru.js / -en.js) — в каждом файле ровно
// одна пара маркеров, поэтому патчим их по отдельности, а не одним /g-проходом.
const I18N_DICT_RU    = path.join(ROOT, 'js', 'i18n-dict-ru.js');
const I18N_DICT_EN    = path.join(ROOT, 'js', 'i18n-dict-en.js');
const DRY_RUN         = process.argv.includes('--dry-run');

const HTML_MARKER_RE = /([ \t]*)(<!-- TOOLS:START -->)[\s\S]*?([ \t]*)(<!-- TOOLS:END -->)/;
const JS_MARKER_RE   = /([ \t]*)(\/\/ TOOLS:START)[\s\S]*?([ \t]*)(\/\/ TOOLS:END)/;

function patchBetweenMarkers(filePath, re, bodyOrBodies) {
  const src = fs.readFileSync(filePath, 'utf8');
  if (!new RegExp(re.source).test(src)) {
    throw new Error(`${path.relative(ROOT, filePath)}: не найдены маркеры TOOLS:START/END`);
  }
  let i = 0;
  const bodies = Array.isArray(bodyOrBodies) ? bodyOrBodies : [bodyOrBodies];
  const patched = src.replace(re, (...m) => {
    const [, p1, p2, p3, p4] = m;
    const body = bodies[Math.min(i, bodies.length - 1)];
    i++;
    return `${p1}${p2}\n${body}\n${p3}${p4}`;
  });
  if (patched === src) return false;
  if (!DRY_RUN) fs.writeFileSync(filePath, patched, 'utf8');
  return true;
}

function jsStr(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function main() {
  const { tools } = JSON.parse(fs.readFileSync(TOOLS_JSON, 'utf8'));

  const missing = tools.filter(t => !t.slug || !t.label || !t.label_en);
  if (missing.length) {
    throw new Error(`tools.json: у следующих инструментов нет slug/label/label_en — ${missing.map(t => t.slug || '?').join(', ')}`);
  }

  const items = tools.map(t =>
    `          <li><a href="{{REL}}tools/${t.slug}/"><span data-i18n="footerTool_${t.slug}">${t.label}</span></a></li>`
  ).join('\n');

  const dictKeyWidth = Math.max(...tools.map(t => `'footerTool_${t.slug}':`.length));
  const dictRu = tools.map(t =>
    `  ${(`'footerTool_${t.slug}':`).padEnd(dictKeyWidth)} ${jsStr(t.label)},`
  ).join('\n');
  const dictEn = tools.map(t =>
    `  ${(`'footerTool_${t.slug}':`).padEnd(dictKeyWidth)} ${jsStr(t.label_en)},`
  ).join('\n');

  if (DRY_RUN) {
    console.log(`tools: ${tools.length}`);
    console.log(tools.map(t => `  ${t.slug} → "${t.label}" / "${t.label_en}"`).join('\n'));
    return;
  }

  const changedFooter = patchBetweenMarkers(FOOTER_PARTIAL, HTML_MARKER_RE, items);
  const changedRu     = patchBetweenMarkers(I18N_DICT_RU, JS_MARKER_RE, dictRu);
  const changedEn     = patchBetweenMarkers(I18N_DICT_EN, JS_MARKER_RE, dictEn);
  const changedDict   = changedRu || changedEn;

  if (changedFooter) console.log('  ✓ templates/partials/site-footer.html — список «Инструменты» синхронизирован');
  if (changedDict)   console.log('  ✓ js/i18n-dict-ru.js + js/i18n-dict-en.js — footerTool_* ключи синхронизированы');
  if (!changedFooter && !changedDict) console.log('  · инструменты уже синхронизированы, изменений нет');

  console.log(`✓ build-home-tools.js → tools: ${tools.length}`);
}

main();
