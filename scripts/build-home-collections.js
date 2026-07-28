#!/usr/bin/env node
/**
 * Синхронизирует блок «Подборки» на главной, в футере и в EN-словаре с
 * collections.json.
 *
 * collections.json — источник истины. Каждая запись обязана нести:
 *   - `lucide`         — имя иконки lucide для плитки на главной
 *   - `home_label` / `home_label_en` — короткая RU/EN подпись для футера
 *     (в отличие от h1/h1_en, которые длиннее и предназначены для <title>/<h1>
 *     страницы подборки)
 *
 * Патчит три места, каждое между маркерами COLLECTIONS:START / COLLECTIONS:END:
 *   - index.html                — сетка .cat-grid в секции «Подборки логотипов»
 *   - templates/partials/site-footer.html — список <li> в колонке «Подборки»
 *     (каждая ссылка обёрнута в <span data-i18n="footerColl_<slug>">, текст
 *     на EN-зеркале подставляется из словаря — см. ниже)
 *   - js/i18n-dict-ru.js / js/i18n-dict-en.js — ключи footerColl_<slug> в каждом
 *
 * Почему это отдельный скрипт, а не расширение build-home-sitemap.js: тот
 * скрипт владеет страницей /sitemap/ и лишь патчит счётчики + инъецирует
 * FOOTER целиком из партиала. Этот скрипт — единственный источник истины
 * именно для содержимого блока «Подборки» во всех трёх местах, чтобы новая
 * коллекция в collections.json никогда больше не терялась ни на главной, ни
 * в футере, ни на EN-зеркале (как случилось с video-streaming — она осталась
 * без английского текста в подвале, потому что список был на 100% ручным и
 * не имел data-i18n вовсе).
 *
 * Usage:
 *   node scripts/build-home-collections.js            # записать все файлы
 *   node scripts/build-home-collections.js --dry-run  # только показать статистику
 */

const fs   = require('fs');
const path = require('path');

const ROOT             = path.resolve(__dirname, '..');
const COLLECTIONS_JSON = path.join(ROOT, 'collections.json');
const INDEX_HTML       = path.join(ROOT, 'index.html');
const FOOTER_PARTIAL   = path.join(ROOT, 'templates', 'partials', 'site-footer.html');
// Словарь разделён по языкам (js/i18n-dict-ru.js / -en.js) — в каждом файле ровно
// одна пара маркеров, поэтому патчим их по отдельности, а не одним /g-проходом.
const I18N_DICT_RU     = path.join(ROOT, 'js', 'i18n-dict-ru.js');
const I18N_DICT_EN     = path.join(ROOT, 'js', 'i18n-dict-en.js');
const DRY_RUN          = process.argv.includes('--dry-run');

const HTML_MARKER_RE = /([ \t]*)(<!-- COLLECTIONS:START -->)[\s\S]*?([ \t]*)(<!-- COLLECTIONS:END -->)/;
const JS_MARKER_RE   = /([ \t]*)(\/\/ COLLECTIONS:START)[\s\S]*?([ \t]*)(\/\/ COLLECTIONS:END)/;

function patchBetweenMarkers(filePath, re, bodyOrBodies) {
  const src = fs.readFileSync(filePath, 'utf8');
  if (!new RegExp(re.source).test(src)) {
    throw new Error(`${path.relative(ROOT, filePath)}: не найдены маркеры COLLECTIONS:START/END`);
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
  const { collections } = JSON.parse(fs.readFileSync(COLLECTIONS_JSON, 'utf8'));

  const missing = collections.filter(c => !c.lucide || !c.home_label || !c.home_label_en);
  if (missing.length) {
    throw new Error(
      `collections.json: у следующих подборок нет lucide/home_label/home_label_en — ${missing.map(c => c.slug).join(', ')}`
    );
  }

  const tiles = collections.map(c => `        <a class="cat-tile" href="collections/${c.slug}/">
          <i data-lucide="${c.lucide}" class="cat-ico" aria-hidden="true"></i>
          <span class="cat-name">${c.h1 || c.title}</span>
        </a>`).join('\n');

  const items = collections.map(c =>
    `          <li><a href="{{REL}}collections/${c.slug}/"><span data-i18n="footerColl_${c.slug}">${c.home_label}</span></a></li>`
  ).join('\n');

  const dictKeyWidth = Math.max(...collections.map(c => `'footerColl_${c.slug}':`.length));
  const dictRu = collections.map(c =>
    `  ${(`'footerColl_${c.slug}':`).padEnd(dictKeyWidth)} ${jsStr(c.home_label)},`
  ).join('\n');
  const dictEn = collections.map(c =>
    `  ${(`'footerColl_${c.slug}':`).padEnd(dictKeyWidth)} ${jsStr(c.home_label_en)},`
  ).join('\n');

  if (DRY_RUN) {
    console.log(`collections: ${collections.length}`);
    console.log(collections.map(c => `  ${c.slug} → ${c.lucide} / "${c.home_label}" / "${c.home_label_en}"`).join('\n'));
    return;
  }

  const changedIndex  = patchBetweenMarkers(INDEX_HTML, HTML_MARKER_RE, tiles);
  const changedFooter = patchBetweenMarkers(FOOTER_PARTIAL, HTML_MARKER_RE, items);
  const changedRu     = patchBetweenMarkers(I18N_DICT_RU, JS_MARKER_RE, dictRu);
  const changedEn     = patchBetweenMarkers(I18N_DICT_EN, JS_MARKER_RE, dictEn);
  const changedDict   = changedRu || changedEn;

  if (changedIndex)  console.log('  ✓ index.html — блок «Подборки логотипов» синхронизирован');
  if (changedFooter) console.log('  ✓ templates/partials/site-footer.html — список «Подборки» синхронизирован');
  if (changedDict)   console.log('  ✓ js/i18n-dict-ru.js + js/i18n-dict-en.js — footerColl_* ключи синхронизированы');
  if (!changedIndex && !changedFooter && !changedDict) console.log('  · подборки уже синхронизированы, изменений нет');

  console.log(`✓ build-home-collections.js → collections: ${collections.length}`);
}

main();
