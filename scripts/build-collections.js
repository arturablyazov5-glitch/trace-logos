#!/usr/bin/env node
/**
 * Generates cross-category collection landing pages:
 *   collections/<slug>/index.html     (RU)
 *   en/collections/<slug>/index.html  (EN)
 *
 * Source of truth:
 *   collections.json            — collection definitions (slug, title, h1, lead, match[],
 *                                 title_en, h1_en, lead_en)
 *   logos.json                  — built logo list (name, url, svgUrl/pngUrl)
 *   templates/collection-page.html
 *
 * Each collection picks logos from logos.json whose name matches any `match`
 * substring (case-insensitive). JSON-LD: BreadcrumbList + CollectionPage + ItemList + FAQPage.
 *
 * Run AFTER build-api-json.js (needs a fresh logos.json).
 *
 * Usage:
 *   node scripts/build-collections.js            # build all
 *   node scripts/build-collections.js --dry-run
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');
const { loadDict, bakeI18n, makePathsAbsolute } = require('./lib/en-transform');

const BASE_URL = 'https://trace-logos.ru';
const ROOT     = path.resolve(__dirname, '..');
const TEMPLATE = loadTemplate(path.join(ROOT, 'templates', 'collection-page.html'));
const DRY_RUN  = process.argv.includes('--dry-run');
const EN       = loadDict().en;

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const relPath = u => (u || '').replace(BASE_URL + '/', '');
const norm = s => (s || '').toLowerCase().replace(/ё/g, 'е');

function pickLogos(logos, matches) {
  const wants = matches.map(norm);
  const seen = new Set();
  const picked = [];
  for (const w of wants) {
    for (const l of logos) {
      if (seen.has(l.url)) continue;
      if (!norm(l.name).includes(w)) continue;
      const asset = l.svgUrl || l.pngUrl || '';
      if (!asset || asset.includes('placeholder')) continue;
      seen.add(l.url);
      picked.push(l);
    }
  }
  return picked;
}

const REL_TO_ROOT = '../../';

function buildCards(items, lang = 'ru') {
  const altPrefix = lang === 'en' ? 'Logo' : 'Логотип';
  return items.map(l => {
    const asset = relPath(l.svgUrl || l.pngUrl);
    const href  = lang === 'en'
      ? `/en/${relPath(l.url)}`
      : `${REL_TO_ROOT}${relPath(l.url)}`;
    const displayName = (lang === 'en' && l.name_en) ? l.name_en : l.name;
    return `<a class="logo-card" href="${href}">
        <img src="${REL_TO_ROOT}${asset}" alt="${altPrefix} ${esc(displayName)}" width="32" height="32" loading="lazy">
        <span class="logo-card-name">${esc(displayName)}</span>
      </a>`;
  }).join('\n      ');
}

function buildFaqItems(col, count, lang = 'ru') {
  if (lang === 'en') {
    return [
      {
        q: `How many logos are in the "${col.h1_en}" collection?`,
        a: `The "${col.h1_en}" collection has ${count} logos in SVG and PNG formats. Download them for free and open in the color editor.`,
      },
      {
        q: `Can I use these logos for free?`,
        a: `Yes, all logos are available for download free of charge and without registration. Note that brands may be protected by copyright of their respective owners — please follow brand usage guidelines.`,
      },
      {
        q: `What format can I download the logos in?`,
        a: `Most logos are available in vector SVG (scales without quality loss) and PNG. You can edit colors online and export to Figma.`,
      },
    ];
  }
  return [
    {
      q: `Сколько логотипов в подборке «${col.title}»?`,
      a: `В подборке «${col.title}» собрано ${count} логотипов в форматах SVG и PNG. Каждый можно скачать бесплатно и открыть в редакторе цвета.`,
    },
    {
      q: `Можно ли использовать эти логотипы бесплатно?`,
      a: `Да, все логотипы доступны для скачивания бесплатно и без регистрации. Учитывайте, что бренды могут быть защищены авторским правом их владельцев — соблюдайте правила использования бренда.`,
    },
    {
      q: `В каком формате скачать логотипы?`,
      a: `Большинство логотипов доступны в векторном SVG (масштабируется без потери качества) и в PNG. Можно изменить цвета онлайн и экспортировать в Figma.`,
    },
  ];
}

function buildFaqSection(faq, lang = 'ru') {
  const title = lang === 'en' ? 'FAQ' : 'Частые вопросы';
  const rows = faq.map(f =>
    `<details class="faq-item">
          <summary class="faq-q">${esc(f.q)}</summary>
          <p class="faq-a">${esc(f.a)}</p>
        </details>`).join('\n        ');
  return `
  <section class="faq-section" aria-labelledby="faq-title">
    <h2 id="faq-title" class="faq-title">${title}</h2>
    <div class="faq-list">
        ${rows}
    </div>
  </section>`;
}

function buildJsonLd(col, fullUrl, items, faq, lang = 'ru') {
  const isEn = lang === 'en';
  const list = items.slice(0, 100).map((l, i) => ({
    "@type": "ListItem", "position": i + 1, "name": (isEn && l.name_en) ? l.name_en : l.name,
    "url": isEn ? l.url.replace(BASE_URL + '/', BASE_URL + '/en/') : l.url,
  }));
  const graph = [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Trace Logo's", "item": `${BASE_URL}/` },
        {
          "@type": "ListItem", "position": 2,
          "name": isEn ? "Logos" : "Логотипы",
          "item": isEn ? `${BASE_URL}/en/logos/` : `${BASE_URL}/logos/`,
        },
        { "@type": "ListItem", "position": 3, "name": isEn ? col.h1_en : col.h1, "item": fullUrl },
      ],
    },
    {
      "@type": "CollectionPage",
      "name": isEn ? col.title_en : col.title,
      "description": isEn ? col.lead_en : col.lead,
      "url": fullUrl,
      "mainEntity": { "@type": "ItemList", "numberOfItems": items.length, "itemListElement": list },
    },
    {
      "@type": "FAQPage",
      "mainEntity": faq.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
    },
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

function renderTemplate(vars) {
  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) { console.warn(`Unknown placeholder {{${k}}}`); return ''; }
    return vars[k];
  });
}

function applyEnChrome(html, slug) {
  html = makePathsAbsolute(html, `collections/${slug}/index.html`);
  html = html.replace(/<html(\s+lang="[^"]*")?(\s*)>/, (m, _l, sp) => `<html lang="en"${sp || ' '}>`);
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n  <script>window.__LANG__='en';</script>`);
  html = html.replace(/content="ru_RU"/, 'content="en_US"');
  return html;
}

function main() {
  const collections = JSON.parse(fs.readFileSync(path.join(ROOT, 'collections.json'), 'utf8')).collections;
  const logosJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos.json'), 'utf8'));
  const logos = logosJson.logos;
  const catalogCount = logosJson.total ?? logos.length;
  let written = 0;

  for (const col of collections) {
    const items = pickLogos(logos, col.match);
    const fullUrlRu = `${BASE_URL}/collections/${col.slug}/`;
    const fullUrlEn = `${BASE_URL}/en/collections/${col.slug}/`;

    if (DRY_RUN) {
      console.log(`collections/${col.slug}/index.html  (${items.length} logos)`);
      console.log(`en/collections/${col.slug}/index.html  (${items.length} logos)`);
      continue;
    }

    if (!items.length) { console.warn(`⚠ ${col.slug}: 0 logos matched — skipped`); continue; }

    // ── RU page ──
    const faqRu = buildFaqItems(col, items.length, 'ru');
    const htmlRu = renderTemplate({
      REL: REL_TO_ROOT,
      HOME_REL: REL_TO_ROOT,
      DATA_BASE: REL_TO_ROOT,
      BREADCRUMB_LOGOS: 'Логотипы',
      TITLE: `${col.title} — скачать SVG и PNG · Trace Logo's`,
      META_DESC: esc(col.lead),
      CANONICAL_URL: fullUrlRu,
      OG_TITLE: esc(col.title),
      OG_DESC: esc(col.lead),
      OG_IMAGE: `${BASE_URL}/assets/og/home.png`,
      JSON_LD: buildJsonLd(col, fullUrlRu, items, faqRu, 'ru'),
      ICON: col.icon || '🏷',
      H1: esc(col.h1),
      LEAD: esc(col.lead),
      CARDS: buildCards(items, 'ru'),
      CATALOG_CTA_TITLE_FULL: `${catalogCount}+ логотипов в каталоге`,
      CATALOG_CTA_SUB: 'SVG, PNG, редактор цвета, экспорт в Figma',
      CATALOG_OPEN: 'Открыть каталог',
      FAQ_SECTION: buildFaqSection(faqRu, 'ru'),
    });

    const outRu = path.join(ROOT, 'collections', col.slug, 'index.html');
    fs.mkdirSync(path.dirname(outRu), { recursive: true });
    fs.writeFileSync(outRu, htmlRu, 'utf8');
    written++;
    console.log(`  ${col.slug}: ${items.length} logos`);

    // ── EN page ──
    const faqEn = buildFaqItems(col, items.length, 'en');
    let htmlEn = renderTemplate({
      REL: REL_TO_ROOT,
      HOME_REL: '/en/',
      DATA_BASE: '/',
      BREADCRUMB_LOGOS: 'Logos',
      TITLE: `${col.title_en || col.title} · Trace Logo's`,
      META_DESC: esc(col.lead_en || col.lead),
      CANONICAL_URL: fullUrlEn,
      OG_TITLE: esc(col.h1_en || col.h1),
      OG_DESC: esc(col.lead_en || col.lead),
      OG_IMAGE: `${BASE_URL}/assets/og/home.png`,
      JSON_LD: buildJsonLd(col, fullUrlEn, items, faqEn, 'en'),
      ICON: col.icon || '🏷',
      H1: esc(col.h1_en || col.h1),
      LEAD: esc(col.lead_en || col.lead),
      CARDS: buildCards(items, 'en'),
      CATALOG_CTA_TITLE_FULL: `${catalogCount}+ logos in the catalog`,
      CATALOG_CTA_SUB: 'SVG, PNG, color editor, Figma export',
      CATALOG_OPEN: 'Open catalog',
      FAQ_SECTION: buildFaqSection(faqEn, 'en'),
    });
    htmlEn = bakeI18n(htmlEn, EN);
    htmlEn = applyEnChrome(htmlEn, col.slug);

    const outEn = path.join(ROOT, 'en', 'collections', col.slug, 'index.html');
    fs.mkdirSync(path.dirname(outEn), { recursive: true });
    fs.writeFileSync(outEn, htmlEn, 'utf8');
    written++;
  }

  if (DRY_RUN) console.log('\nDry run complete.');
  else console.log(`✓ Collection pages: ${written} (RU + EN)`);
}

main();
