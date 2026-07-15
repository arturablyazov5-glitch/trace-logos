#!/usr/bin/env node
/**
 * Generates SEO ecosystem pages for the logo catalog.
 *
 * Each ecosystem gets its own page at /logos/ecosystem/<key>/index.html
 * (e.g. /logos/ecosystem/yandex/, /logos/ecosystem/apple/).
 * The page loads the full catalog JS and auto-filters to that ecosystem.
 *
 * Usage:
 *   node scripts/build-ecosystem-pages.js            # build all
 *   node scripts/build-ecosystem-pages.js --dry-run  # print paths only
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');
const { loadDict, bakeI18n, makePathsAbsolute, hreflangBlock } = require('./lib/en-transform');

const BASE_URL = 'https://trace-logos.ru';
const ROOT     = path.resolve(__dirname, '..');
const TEMPLATE = loadTemplate(path.join(ROOT, 'templates', 'category-page.html'));
const DRY_RUN  = process.argv.includes('--dry-run');
const EN       = loadDict().en;

const ECO_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'ecosystems.json'), 'utf8'));
const ecoLabel = (key, lang = 'ru') => (ECO_DATA[key] && ECO_DATA[key][lang]) || (ECO_DATA[key] && ECO_DATA[key].ru) || key;

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

function itemUrl(item) {
  const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return null;
  return `${BASE_URL}/logos/${parts.slice(1).join('/')}/`;
}

function buildJsonLd(label, ecoKey, fullUrl, items) {
  const readyItems = items.filter(i => !i.comingSoon && i.file && i.file !== 'placeholder.svg');
  const listItems = readyItems
    .map((item, i) => {
      const url = itemUrl(item);
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
          { '@type': 'ListItem', position: 3, name: `Экосистема ${label}`, item: fullUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `Логотипы экосистемы ${label}`,
        description: `Все SVG и PNG логотипы экосистемы ${label}. Скачать бесплатно.`,
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

function buildJsonLdEn(labelEn, ecoKey, fullUrl, items) {
  const readyItems = items.filter(i => !i.comingSoon && i.file && i.file !== 'placeholder.svg');
  const listItems = readyItems
    .map((item, i) => {
      const url = itemUrl(item);
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
          { '@type': 'ListItem', position: 3, name: `${labelEn} Ecosystem`, item: fullUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${labelEn} Ecosystem Logos`,
        description: `All SVG and PNG logos from the ${labelEn} ecosystem. Download free.`,
        url: fullUrl,
        ...(listItems.length > 0 ? {
          mainEntity: { '@type': 'ItemList', numberOfItems: listItems.length, itemListElement: listItems },
        } : {}),
      },
    ],
  }, null, 2);
}

function applyEnChrome(html, ecoKey) {
  html = makePathsAbsolute(html, `logos/ecosystem/${ecoKey}/index.html`);
  html = html.replace(/<html(\s+lang="[^"]*")?(\s*)>/, (m, _l, sp) => `<html lang="en"${sp || ' '}>`);
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n  <script>window.__LANG__='en';</script>`);
  html = html.replace(/\bcontent="ru_RU"/g, 'content="en_US"');
  return html;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));

  // Collect all items by ecosystem
  const ecoItems = {};
  for (const cat of manifest.categories) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8'));
    for (const item of data.items) {
      const ecos = Array.isArray(item.ecosystem) ? item.ecosystem : item.ecosystem ? [item.ecosystem] : [];
      for (const eco of ecos) {
        if (!ecoItems[eco]) ecoItems[eco] = [];
        ecoItems[eco].push(item);
      }
    }
  }

  let written = 0, unchanged = 0;

  for (const [ecoKey, items] of Object.entries(ecoItems)) {
    const label   = ecoLabel(ecoKey, 'ru');
    const labelEn = ecoLabel(ecoKey, 'en');
    const count   = items.filter(i => !i.comingSoon).length;
    if (count === 0) continue;

    const fullUrl  = `${BASE_URL}/logos/ecosystem/${ecoKey}/`;
    const title    = `Логотипы экосистемы ${label} · Trace Logo's`;
    const metaDesc = `${count} SVG и PNG логотипов экосистемы ${label}. Скачивайте бесплатно, редактируйте цвета, экспортируйте в Figma.`;

    const outPath = path.join(ROOT, 'logos', 'ecosystem', ecoKey, 'index.html');

    if (DRY_RUN) { console.log(`  /logos/ecosystem/${ecoKey}/ (${count})`); continue; }

    // ── RU page ──
    const vars = {
      REL:           '../../../',
      HOME_REL:      '../../../',
      DATA_BASE:     '../../../',
      TITLE:         esc(title),
      META_DESC:     esc(metaDesc),
      CANONICAL_URL: fullUrl,
      HREFLANG_TAGS: hreflangBlock(fullUrl, `${BASE_URL}/en/logos/ecosystem/${ecoKey}/`),
      OG_TITLE:      esc(`Логотипы экосистемы ${label}`),
      OG_DESC:       esc(metaDesc),
      OG_IMAGE:      `${BASE_URL}/favicon-512.png`,
      JSON_LD:       buildJsonLd(label, ecoKey, fullUrl, items),
      MANIFEST_BASE: '../../',
      CAT_SLUG:      '',
      ECO_SLUG:      ecoKey,
    };

    const html = TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in vars)) { console.warn(`Unknown placeholder: {{${key}}}`); return ''; }
      return vars[key];
    });

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (prev !== html) { fs.writeFileSync(outPath, html, 'utf8'); written++; console.log(`  ✓ /logos/ecosystem/${ecoKey}/`); }
    else { unchanged++; }

    // ── EN page ──
    const fullUrlEn  = `${BASE_URL}/en/logos/ecosystem/${ecoKey}/`;
    const titleEn    = `${labelEn} Ecosystem Logos · Trace Logo's`;
    const metaDescEn = `${count} SVG and PNG logos from the ${labelEn} ecosystem. Download free, edit colors, export to Figma.`;
    const enVars = {
      REL:           '../../../',
      HOME_REL:      '/en/',
      DATA_BASE:     '/',
      TITLE:         esc(titleEn),
      META_DESC:     esc(metaDescEn),
      CANONICAL_URL: fullUrlEn,
      HREFLANG_TAGS: hreflangBlock(fullUrl, fullUrlEn),
      OG_TITLE:      esc(`${labelEn} Ecosystem Logos`),
      OG_DESC:       esc(metaDescEn),
      OG_IMAGE:      `${BASE_URL}/favicon-512.png`,
      JSON_LD:       buildJsonLdEn(labelEn, ecoKey, fullUrlEn, items),
      MANIFEST_BASE: '../../',
      CAT_SLUG:      '',
      ECO_SLUG:      ecoKey,
    };
    let htmlEn = TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key) => enVars[key] ?? '');
    htmlEn = bakeI18n(htmlEn, EN);
    htmlEn = applyEnChrome(htmlEn, ecoKey);
    const outEn = path.join(ROOT, 'en', 'logos', 'ecosystem', ecoKey, 'index.html');
    fs.mkdirSync(path.dirname(outEn), { recursive: true });
    fs.writeFileSync(outEn, htmlEn, 'utf8');
    written++;
  }

  if (DRY_RUN) return;
  console.log(`\n✓ Ecosystem pages: ${written} (RU + EN)`);
  if (unchanged) console.log(`  Unchanged: ${unchanged}`);
}

main();
