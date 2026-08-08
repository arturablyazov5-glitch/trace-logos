#!/usr/bin/env node
/**
 * Патчит блок «Категории логотипов» на главной (index.html) — заменяет
 * прежнюю ручную сетку `.cat-grid`/`.cat-tile` (иконка Lucide + статичный
 * счётчик, дописывался руками при каждой новой категории и стабильно
 * отставал — на момент этого скрипта в разметке было 35 плиток при 43
 * реальных категориях) на ту же сетку `.catalog-cats`/`.catalog-cat`, что
 * строит buildCatalogGridSection() в build-seo-pages.js для блока
 * «Остальные категории» на SEO-страницах логотипов: превью первых логотипов
 * категории вместо иконки + живой счётчик. Общий CSS — css/catalog-grid.css.
 *
 * Источник данных — logos/manifest.json + logos/categories/*.json, как и
 * везде на сайте; ничего не хардкодится, поэтому список плиток больше не
 * может отстать от реального числа категорий.
 *
 * Заголовок блока (h2, подзаголовок, ссылка «Открыть каталог →») остаётся
 * ручным в index.html — этот скрипт патчит только саму сетку, между
 * маркерами CATEGORIES:START/END. Подзаголовок «N разделов» синхронизирует
 * отдельный скрипт (build-home-sitemap.js's patchHomepageCounts()).
 *
 * Usage:
 *   node scripts/build-home-categories.js            # записать
 *   node scripts/build-home-categories.js --dry-run  # только посчитать
 */

const fs   = require('fs');
const path = require('path');

const ROOT         = path.resolve(__dirname, '..');
const MANIFEST     = path.join(ROOT, 'logos', 'manifest.json');
const CATEGORY_DIR = path.join(ROOT, 'logos', 'categories');
const INDEX_HTML   = path.join(ROOT, 'index.html');
const DRY_RUN      = process.argv.includes('--dry-run');

const HTML_MARKER_RE = /([ \t]*)(<!-- CATEGORIES:START -->)[\s\S]*?([ \t]*)(<!-- CATEGORIES:END -->)/;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function assetExt(file) { return file.split('.').pop().toLowerCase(); }

// Same 48×48 "previews-mini" tier build-seo-pages.js's miniThumbSrc() uses for
// this exact grid — one shared preview tier for every "по категориям" block
// on the site, not a second one just for the homepage.
function miniThumbSrc(file, ext) {
  if (ext !== 'png' && ext !== 'svg') return `assets/logos/${ext === 'png' ? 'pngs' : 'svgs'}/${file}`;
  const webpRel = `assets/logos/previews-mini/${file.replace(new RegExp(`\\.${ext}$`, 'i'), '.webp')}`;
  return fs.existsSync(path.join(ROOT, webpRel)) ? webpRel : `assets/logos/${ext === 'png' ? 'pngs' : 'svgs'}/${file}`;
}

function patchBetweenMarkers(filePath, re, body) {
  const src = fs.readFileSync(filePath, 'utf8');
  if (!re.test(src)) throw new Error(`${path.relative(ROOT, filePath)}: не найдены маркеры CATEGORIES:START/END`);
  const patched = src.replace(re, (m, p1, p2, p3, p4) => `${p1}${p2}\n${body}\n${p3}${p4}`);
  if (patched === src) return false;
  if (!DRY_RUN) fs.writeFileSync(filePath, patched, 'utf8');
  return true;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

  const isReady = it => !it.comingSoon && it.file && it.file !== 'placeholder.svg';
  const itemsByCat = {};
  for (const cat of manifest.categories) {
    const data = JSON.parse(fs.readFileSync(path.join(CATEGORY_DIR, path.basename(cat.file)), 'utf8'));
    itemsByCat[cat.slug] = data.items.filter(isReady);
  }

  const categories = manifest.categories
    .map(cat => ({ slug: cat.slug, section: cat.section, count: (itemsByCat[cat.slug] || []).length }))
    .filter(c => c.count > 0);

  const cards = categories.map(c => {
    const all      = itemsByCat[c.slug] || [];
    const previews = all.slice(0, 4);
    const thumbs = previews.map(m => {
      const tf  = m.thumb || m.file;
      const src = miniThumbSrc(tf, assetExt(tf));
      return `<img src="${src}" alt="" width="20" height="20" loading="lazy">`;
    }).join('');
    const more = all.length > 4
      ? `<span class="catalog-cat-more" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg></span>`
      : '';
    // No `.catalog-cat-count-label` (SEO pages' mobile "N логотипов" text) —
    // the homepage has no per-item i18n hook to translate it on /en/ (SEO
    // pages swap it via js/seo-page.js's data-en, which the homepage never
    // loads); translateHome()'s literal-string pairs would need brittle
    // one-off entries for a purely cosmetic mobile nicety. Bare number only.
    return `        <a class="catalog-cat" href="logos/${c.slug}/">
          <span class="catalog-cat-thumbs" aria-hidden="true">${thumbs}${more}</span>
          <span class="catalog-cat-bottom">
            <span class="catalog-cat-name">${esc(c.section)}</span>
            <span class="catalog-cat-count">${c.count}</span>
          </span>
        </a>`;
  }).join('\n');

  if (DRY_RUN) {
    console.log(`categories: ${categories.length}`);
    console.log(categories.map(c => `  ${c.slug} — ${c.count}`).join('\n'));
    return;
  }

  const changed = patchBetweenMarkers(INDEX_HTML, HTML_MARKER_RE, cards);
  console.log(changed
    ? `✓ index.html — блок «Категории логотипов» синхронизирован (${categories.length} категорий)`
    : '  · «Категории логотипов» уже синхронизирован, изменений нет');
}

main();
