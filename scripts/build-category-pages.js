#!/usr/bin/env node
/**
 * Generates SEO category pages for the logo catalog.
 *
 * Each category gets its own page at /logos/<slug>/index.html
 * (e.g. /logos/bank/, /logos/social/) with proper title, meta, canonical.
 * The page loads the full catalog JS and auto-filters to that category.
 *
 * Slug comes from manifest.json cat.slug — explicit, unique, no derivation.
 *
 * Usage:
 *   node scripts/build-category-pages.js            # build all
 *   node scripts/build-category-pages.js --dry-run  # print paths only
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');
const { loadDict, bakeI18n, makePathsAbsolute, hreflangBlock } = require('./lib/en-transform');
const { buildStaticGrid } = require('./lib/static-grid');

const BASE_URL = 'https://trace-logos.ru';
const ROOT     = path.resolve(__dirname, '..');
const TEMPLATE = loadTemplate(path.join(ROOT, 'templates', 'category-page.html'));
const DRY_RUN  = process.argv.includes('--dry-run');
const EN       = loadDict().en;

// Per-category SEO copy: genitive for the title («Логотипы банков»), unique
// intro text, optional full title/h1 override (flags). Missing slug → the page
// falls back to the old generic «Логотипы — {section}» wording.
const CAT_SEO  = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'category-seo.json'), 'utf8'));

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function itemUrl(item, slug) {
  const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return null;
  return `${BASE_URL}/logos/${parts.slice(1).join('/')}/`;
}

function buildJsonLd(section, slug, fullUrl, items, pageName, pageDesc) {
  const readyItems = items.filter(i => !i.comingSoon && i.file && i.file !== 'placeholder.svg');

  const listItems = readyItems
    .map((item, i) => {
      const url = itemUrl(item, slug);
      if (!url) return null;
      return { '@type': 'ListItem', position: i + 1, name: item.name, url };
    })
    .filter(Boolean);

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: "Trace Logo's", item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Логотипы',     item: `${BASE_URL}/logos/` },
          { '@type': 'ListItem', position: 3, name: section,        item: fullUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: pageName || `Логотипы — ${section}`,
        description: pageDesc || `SVG и PNG логотипы: ${section}. Скачать бесплатно.`,
        url: fullUrl,
        ...(listItems.length > 0 ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: listItems.length,
            itemListElement: listItems,
          },
        } : {}),
      },
    ],
  }, null, 2);
}

function buildJsonLdEn(sectionEn, slug, fullUrl, items, pageName, pageDesc) {
  const readyItems = items.filter(i => !i.comingSoon && i.file && i.file !== 'placeholder.svg');
  const listItems = readyItems
    .map((item, i) => {
      const url = itemUrl(item, slug);
      if (!url) return null;
      const enUrl = url.replace(BASE_URL + '/', BASE_URL + '/en/');
      const name = item.name_en || item.name;
      return { '@type': 'ListItem', position: i + 1, name, url: enUrl };
    })
    .filter(Boolean);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: "Trace Logo's", item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Logos',        item: `${BASE_URL}/en/logos/` },
          { '@type': 'ListItem', position: 3, name: sectionEn,      item: fullUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: pageName || `Logos — ${sectionEn}`,
        description: pageDesc || `SVG and PNG logos: ${sectionEn}. Download free.`,
        url: fullUrl,
        ...(listItems.length > 0 ? {
          mainEntity: { '@type': 'ItemList', numberOfItems: listItems.length, itemListElement: listItems },
        } : {}),
      },
    ],
  }, null, 2);
}

function applyEnChrome(html, slug) {
  html = makePathsAbsolute(html, `logos/${slug}/index.html`);
  html = html.replace(/<html(\s+lang="[^"]*")?(\s*)>/, (m, _l, sp) => `<html lang="en"${sp || ' '}>`);
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n  <script>window.__LANG__='en';</script>`);
  html = html.replace(/\bcontent="ru_RU"/g, 'content="en_US"');
  return html;
}

function buildPage({ section, sectionEn, slug, count, items }) {
  const fullUrl  = `${BASE_URL}/logos/${slug}/`;
  const seo      = CAT_SEO[slug] || {};

  // «Логотипы банков России — скачать SVG и PNG бесплатно» beats the old
  // «Логотипы — Банки»: the genitive phrase is what people actually type.
  const titleBase = seo.title || (seo.gen ? `Логотипы ${seo.gen} — скачать SVG и PNG бесплатно` : `Логотипы — ${section}`);
  const title     = `${titleBase} · Trace Logo's`;
  const topNames  = items.filter(i => !i.comingSoon && i.file && i.file !== 'placeholder.svg').slice(0, 3).map(i => i.name).join(', ');
  const metaDesc  = seo.gen
    ? `${count}+ логотипов ${seo.gen}: ${topNames} и другие. SVG и PNG бесплатно, фирменные цвета, редактор и экспорт в Figma.`
    : `${count}+ SVG и PNG логотипов: ${section}. Скачивайте бесплатно, редактируйте цвета, экспортируйте в Figma.`;

  const vars = {
    REL:           '../../',
    HOME_REL:      '../../',
    DATA_BASE:     '../../',
    TITLE:         esc(title),
    META_DESC:     esc(metaDesc),
    CANONICAL_URL: fullUrl,
    HREFLANG_TAGS: hreflangBlock(fullUrl, `${BASE_URL}/en/logos/${slug}/`),
    OG_TITLE:      esc(titleBase),
    OG_DESC:       esc(metaDesc),
    OG_IMAGE:      `${BASE_URL}/assets/og/home.png`,
    JSON_LD:       buildJsonLd(section, slug, fullUrl, items, titleBase, metaDesc),
    // Pre-rendered grid: same label as the live grid's section title (no
    // visual flash when JS re-renders), h1 tag for SEO, cards = real links.
    STATIC_GRID:   buildStaticGrid(
      [{ label: section, heading: 'h1', items }],
      { assetBase: '../../', hrefFor: it => { const u = itemUrl(it, slug); return u ? u.replace(BASE_URL, '') : null; }, lang: 'ru' }
    ),
    MANIFEST_BASE: '../',
    CAT_SLUG:      slug,
    ECO_SLUG:      '',
  };

  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) { console.warn(`Unknown placeholder: {{${key}}}`); return ''; }
    return vars[key];
  });
}

// logos/index.html is hand-maintained, so it can't use {{> }} — instead we keep the
// shared download dropdown between markers and re-inject it here (same pattern as the
// home-sitemap block). Single source: templates/partials/download-dropdown.html.
function patchIndex(readyTotal, cats) {
  const indexPath = path.join(ROOT, 'logos', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const before = html;

  html = html.replace(/\d+\+ SVG-логотип/g, `${readyTotal}+ SVG-логотип`);

  // Pre-rendered full grid inside #content: the live grid is JS-built (Yandex
  // renders JS poorly), so this static copy — identical markup, cards as real
  // <a> links — is what the crawler sees. main.js removes .ssr-grid on init.
  // Hrefs are RELATIVE on purpose: en-transform resolves them into /en/logos/…
  // on the EN mirror. data-i18n="sitemapCat_*" bakes EN section titles there.
  const grid = buildStaticGrid(
    cats.map(({ slug, section, items }) => ({
      label: section,
      heading: 'h2',
      titleAttrs: `data-i18n="sitemapCat_${slug}"`,
      items,
    })),
    { assetBase: '../', hrefFor: it => { const u = itemUrl(it, ''); return u ? u.replace(`${BASE_URL}/logos/`, '') : null; }, lang: 'ru' }
  );
  html = html.replace(
    /(<!-- CATLINKS:START[^>]*-->)[\s\S]*?(<!-- CATLINKS:END -->)/,
    `$1${grid}$2`
  );

  // Inject the shared detail panel; loadTemplate expands its nested {{> download-dropdown}}.
  const detail = loadTemplate(
    path.join(ROOT, 'templates', 'partials', 'detail-panel.html')).trimEnd();
  html = html.replace(
    /(<!-- DETAIL:START[\s\S]*?-->)[\s\S]*?(<!-- DETAIL:END -->)/,
    `$1\n${detail}\n    $2`
  );

  if (html !== before) {
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log(`  ✓ logos/index.html — счётчик + detail-панель обновлены`);
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));

  let written = 0, unchanged = 0, readyTotal = 0;
  const catCounts = [];

  for (const cat of manifest.categories) {
    const { slug, section, section_en, file } = cat;
    const sectionEn = section_en || section;
    const data    = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', file), 'utf8'));
    const items   = data.items;
    const count   = items.filter(i => !i.comingSoon).length;
    const readyCount = items.filter(i => !i.comingSoon && i.file && i.file !== 'placeholder.svg').length;
    readyTotal   += readyCount;
    if (readyCount > 0) catCounts.push({ slug, section, count: readyCount, items });
    const outPath = path.join(ROOT, 'logos', slug, 'index.html');

    if (DRY_RUN) { console.log(`/logos/${slug}/`); console.log(`/en/logos/${slug}/`); continue; }

    // ── RU page ──
    const html = buildPage({ section, sectionEn, slug, count, items });
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (prev !== html) { fs.writeFileSync(outPath, html, 'utf8'); written++; console.log(`  ✓ /logos/${slug}/`); }
    else { unchanged++; }

    // ── EN page ──
    const fullUrlEn  = `${BASE_URL}/en/logos/${slug}/`;
    const seo        = CAT_SEO[slug] || {};
    const titleBaseEn = seo.title_en
      || (seo.gen_en ? `${seo.gen_en.charAt(0).toUpperCase()}${seo.gen_en.slice(1)} logos — download SVG & PNG free` : `Logos — ${sectionEn}`);
    const titleEn    = `${titleBaseEn} · Trace Logo's`;
    const topNamesEn = items.filter(i => !i.comingSoon && i.file && i.file !== 'placeholder.svg').slice(0, 3).map(i => i.name_en || i.name).join(', ');
    const metaDescEn = seo.gen_en
      ? `${count}+ ${seo.gen_en} logos: ${topNamesEn} and more. Free SVG and PNG, brand colors, color editor, Figma export.`
      : `${count}+ SVG and PNG logos: ${sectionEn}. Download free, edit colors, export to Figma.`;
    const enVars = {
      REL:           '../../',
      HOME_REL:      '/en/',
      DATA_BASE:     '/',
      TITLE:         esc(titleEn),
      META_DESC:     esc(metaDescEn),
      CANONICAL_URL: fullUrlEn,
      HREFLANG_TAGS: hreflangBlock(`${BASE_URL}/logos/${slug}/`, fullUrlEn),
      OG_TITLE:      esc(titleBaseEn),
      OG_DESC:       esc(metaDescEn),
      OG_IMAGE:      `${BASE_URL}/assets/og/home.png`,
      JSON_LD:       buildJsonLdEn(sectionEn, slug, fullUrlEn, items, titleBaseEn, metaDescEn),
      STATIC_GRID:   buildStaticGrid(
        [{ label: sectionEn, heading: 'h1', items }],
        { assetBase: '/', hrefFor: it => { const u = itemUrl(it, slug); return u ? u.replace(BASE_URL, '/en') : null; }, lang: 'en' }
      ),
      MANIFEST_BASE: '../',
      CAT_SLUG:      slug,
      ECO_SLUG:      '',
    };
    let htmlEn = TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key) => enVars[key] ?? '');
    htmlEn = bakeI18n(htmlEn, EN);
    htmlEn = applyEnChrome(htmlEn, slug);
    const outEn = path.join(ROOT, 'en', 'logos', slug, 'index.html');
    fs.mkdirSync(path.dirname(outEn), { recursive: true });
    fs.writeFileSync(outEn, htmlEn, 'utf8');
    written++;
  }

  if (!DRY_RUN) {
    patchIndex(readyTotal, catCounts);
    console.log(`\n✓ Written:   ${written}`);
    console.log(`  Unchanged: ${unchanged}`);
  }
}

main();
