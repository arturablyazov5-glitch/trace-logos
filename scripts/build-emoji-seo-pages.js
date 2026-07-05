#!/usr/bin/env node
/**
 * Generates per-emoji SEO pages: emoji/<category>/<slug>/index.html
 *
 * Source of truth:
 *   templates/emoji-seo-page.html
 *   emoji/manifest.json + emoji/categories/*.json
 *   assets/emoji/pngs|svgs/<vendor>/<slug>_<codepoints>.<ext>
 *
 * URL:  /emoji/<category-slug>/<emoji-slug>/   (e.g. /emoji/smileys/grinning-face/)
 * Slug: filename basename without the trailing _<codepoints> (deduped within a category).
 * JSON-LD: BreadcrumbList + ImageObject + FAQPage.
 *
 * Also emits emoji/_urls.json (for build-sitemap.js) and
 * emoji/_url-map.json (file → page URL, for build-emoji-json.js).
 *
 * Usage:
 *   node scripts/build-emoji-seo-pages.js            # build all
 *   node scripts/build-emoji-seo-pages.js --dry-run  # preview
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');
const { loadDict, bakeI18n } = require('./lib/en-transform');

const BASE_URL = 'https://trace-logos.ru';
const ROOT     = path.resolve(__dirname, '..');
const TEMPLATE = loadTemplate(path.join(ROOT, 'templates', 'emoji-seo-page.html'));
const DRY_RUN  = process.argv.includes('--dry-run');
const EN       = loadDict().en;

// category file basename → { slug (URL), name (RU), nameEn (EN) }
const CATEGORIES = {
  'smileys-emotion': { slug: 'smileys',    name: 'Смайлы и эмоции',       nameEn: 'Smileys & Emotion' },
  'people-body':     { slug: 'people',     name: 'Люди и жесты',           nameEn: 'People & Body' },
  'animals-nature':  { slug: 'animals',    name: 'Животные и природа',     nameEn: 'Animals & Nature' },
  'food-drink':      { slug: 'food',       name: 'Еда и напитки',          nameEn: 'Food & Drink' },
  'travel-places':   { slug: 'travel',     name: 'Путешествия и места',    nameEn: 'Travel & Places' },
  'activities':      { slug: 'activities', name: 'Активности',             nameEn: 'Activities' },
  'objects':         { slug: 'objects',    name: 'Предметы',               nameEn: 'Objects' },
  'symbols':         { slug: 'symbols',    name: 'Символы',                nameEn: 'Symbols' },
  'flags':           { slug: 'flags',      name: 'Флаги',                  nameEn: 'Flags' },
};

const CATEGORY_ICONS = {
  smileys: '😀', people: '🧑', animals: '🐶', food: '🍔', travel: '✈️',
  activities: '⚽', objects: '💡', symbols: '❤️', flags: '🏁',
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const DL_ICON   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const ZIP_ICON  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><path d="M10 12h4"/></svg>`;

function fileSize(relPath, lang = 'ru') {
  try {
    const { size } = fs.statSync(path.join(ROOT, 'assets', 'emoji', relPath));
    if (size < 1000) return lang === 'en' ? `${size} B` : `${size} Б`;
    const kb = size / 1024;
    const unit = lang === 'en' ? 'KB' : 'КБ';
    return kb < 100 ? `${kb.toFixed(1)} ${unit}` : `${Math.round(kb)} ${unit}`;
  } catch { return ''; }
}

function assetExt(file) { return (file || '').split('.').pop().toLowerCase(); }

// "apple/grinning-face_1f600.png" → { slug:"grinning-face", codes:["1f600"] }
function parseFile(file) {
  const base = (file || '').split('/').pop().replace(/\.[^.]+$/, '');
  const us = base.lastIndexOf('_');
  if (us === -1) return { slug: base, codes: [] };
  const slug = base.slice(0, us);
  const codes = base.slice(us + 1).split('-').filter(Boolean);
  return { slug, codes };
}

function codepointsLabel(codes) {
  return codes.map(c => 'U+' + c.toUpperCase()).join(' ');
}

// First whitespace-token of tags is the emoji character (per data convention).
function emojiChar(item) {
  return (item.tags || '').trim().split(/\s+/)[0] || '';
}

// tags = "<char> english name русское название" → english name (middle, latin words)
function englishName(item) {
  const toks = (item.tags || '').trim().split(/\s+/).slice(1);
  const en = toks.filter(t => /[a-z]/i.test(t) && !/[а-яё]/i.test(t));
  return en.join(' ');
}

function assetUrlRel(file, rel) {
  const ext = assetExt(file);
  return `${rel}assets/emoji/${ext === 'svg' ? 'svgs' : 'pngs'}/${file}`;
}
function assetUrlAbs(file) {
  const ext = assetExt(file);
  return `${BASE_URL}/assets/emoji/${ext === 'svg' ? 'svgs' : 'pngs'}/${file}`;
}

function buildVariantCards(item, rel, lang = 'ru') {
  const primaryExt = assetExt(item.file);
  const primary = { label: 'Apple', file: item.file, type: primaryExt };
  const all = [primary, ...(item.variants || []).map(v => ({ label: v.label || 'Вариант', file: v.file, type: assetExt(v.file) }))];
  return all.map((v, i) => {
    const src  = assetUrlRel(v.file, rel);
    const subdir = v.type === 'svg' ? 'svgs' : 'pngs';
    const size = fileSize(`${subdir}/${v.file}`, lang);
    const filename = v.file.split('/').pop();
    return `<div class="evar-card${i === 0 ? ' active' : ''}" data-src="${src}" data-label="${esc(v.label)}" data-ext="${esc(v.type.toUpperCase())}" data-size="${esc(size)}" data-filename="${esc(filename)}" data-vendor="${esc(v.label)}">
            <span class="evar-preview"><img src="${src}" alt="${esc(item.name)} — ${esc(v.label)}" width="48" height="48" loading="lazy"></span>
            <span class="evar-label">${esc(v.label)} · ${v.type.toUpperCase()}</span>
          </div>`;
  }).join('\n          ');
}

function buildDownloadButtons(item, rel, lang = 'ru') {
  const char = emojiChar(item);
  const copyBtn = `<button class="btn btn-primary" id="btn-copy-char" type="button" data-char="${esc(char)}">${COPY_ICON} <span id="btn-copy-lbl" data-label="copyEmojiPage">Скопировать эмодзи</span></button>`;

  // Initial state — Apple (first variant)
  const ext      = assetExt(item.file);
  const subdir   = ext === 'svg' ? 'svgs' : 'pngs';
  const size     = fileSize(`${subdir}/${item.file}`, lang);
  const sizeSpan = size ? ` <span class="btn-size">${size}</span>` : '';
  const filename = item.file.split('/').pop();
  const dlBtn = `<a class="btn btn-secondary" id="btn-dl" href="${assetUrlRel(item.file, rel)}" download="${filename}">${DL_ICON} <span id="btn-dl-lbl">${ext.toUpperCase()} (Apple)</span>${sizeSpan}</a>`;

  const allFiles = [item.file, ...(item.variants || []).map(v => v.file)];
  const zipBtn = allFiles.length > 1
    ? `<button class="btn btn-zip" id="btn-zip" type="button">${ZIP_ICON} <span id="btn-zip-label" data-label="dlZipAll">Скачать всё (.zip)</span><span class="btn-progress" id="btn-zip-progress"></span></button>`
    : '';

  return [copyBtn, dlBtn, zipBtn].filter(Boolean).join('\n          ');
}

function buildEmojiPageData(item, rel) {
  const allFiles = [item.file, ...(item.variants || []).map(v => v.file)];
  const zipFiles = allFiles.map(f => {
    const ext      = assetExt(f);
    const subdir   = ext === 'svg' ? 'svgs' : 'pngs';
    const filename = f.split('/').pop();
    return `    { url: '${rel}assets/emoji/${subdir}/${f}', name: '${filename}' }`;
  }).join(',\n');
  const zipName = item.file.replace(/\.[^.]+$/, '') + '.zip';
  return `window.__EMOJI_PAGE__ = {\n  zipName: '${zipName}',\n  zipFiles: [\n${zipFiles}\n  ],\n};`;
}

function buildFaqItems(item, catName, codesLabel, lang) {
  const name = item.name;
  const en = englishName(item);
  const char = emojiChar(item);
  const hasVariants = (item.variants || []).length > 0;
  if (lang === 'en') {
    const enName = en || name;
    return [
      {
        q: `What does the ${enName} ${char} emoji mean?`,
        a: `The ${char} ${enName} emoji belongs to the "${catName}" category. Unicode: ${codesLabel}.`,
      },
      {
        q: `How do I insert the ${enName} emoji?`,
        a: `Click "Copy emoji" on this page and paste ${char} into any text, message, or document — it displays on all modern devices.`,
      },
      {
        q: `Where can I download the ${enName} PNG emoji?`,
        a: `Download the ${enName} PNG emoji in Apple version${hasVariants ? ' and other variants' : ''} directly on this page — free, no sign-up required.`,
      },
    ];
  }
  return [
    {
      q: `Что означает эмодзи «${name}»?`,
      a: `Эмодзи ${char} «${name}»${en ? ` (${en})` : ''} относится к категории «${catName}». Юникод: ${codesLabel}.`,
    },
    {
      q: `Как вставить эмодзи «${name}»?`,
      a: `Нажмите «Скопировать эмодзи» на этой странице и вставьте символ ${char} в любой текст, сообщение или документ — он отображается на всех современных устройствах.`,
    },
    {
      q: `Где скачать PNG эмодзи «${name}»?`,
      a: `Скачайте PNG эмодзи «${name}» в версии Apple${hasVariants ? ', а также в других вариантах,' : ''} прямо на этой странице — бесплатно и без регистрации.`,
    },
  ];
}

function buildFaqSection(faq, lang) {
  const title = lang === 'en' ? 'Frequently asked questions' : 'Частые вопросы';
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

function buildJsonLd(item, catName, catSlug, slug, fullUrl, faq, lang = 'ru') {
  const isEn = lang === 'en';
  const char = emojiChar(item);
  const en   = englishName(item);
  const displayName = isEn ? (en || item.name) : item.name;
  const emojiLabel  = isEn ? 'Emoji' : 'Эмодзи';
  const emojiBase   = isEn ? `${BASE_URL}/en/emoji/` : `${BASE_URL}/emoji/`;
  const catBase     = isEn ? `${BASE_URL}/en/emoji/${catSlug}/` : `${BASE_URL}/emoji/${catSlug}/`;
  const breadcrumb = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Trace Logo's", "item": `${BASE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": emojiLabel,     "item": emojiBase },
      { "@type": "ListItem", "position": 3, "name": catName,        "item": catBase },
      { "@type": "ListItem", "position": 4, "name": displayName,    "item": fullUrl },
    ],
  };
  const imageObj = {
    "@type": "ImageObject",
    "name": isEn ? `${displayName} Emoji` : `Эмодзи ${item.name}`,
    "description": isEn
      ? `${displayName} ${char} emoji in PNG (Apple)`
      : `Эмодзи ${item.name} ${char} в PNG (Apple)`,
    "contentUrl": assetUrlAbs(item.file),
    "encodingFormat": assetExt(item.file) === 'svg' ? 'image/svg+xml' : 'image/png',
  };
  const faqPage = {
    "@type": "FAQPage",
    "mainEntity": faq.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
  };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [breadcrumb, imageObj, faqPage] }, null, 2);
}

function buildPage(item, cat, slug, lang) {
  const isEn    = lang === 'en';
  const rel     = isEn ? '../../../../' : '../../../';
  const homeRel = isEn ? '/en/' : rel;
  const catSlug = cat.slug;
  const ruUrl   = `${BASE_URL}/emoji/${catSlug}/${slug}/`;
  const fullUrl = isEn ? `${BASE_URL}/en/emoji/${catSlug}/${slug}/` : ruUrl;
  const char    = emojiChar(item);
  const en      = englishName(item);
  const { codes } = parseFile(item.file);
  const codesLabel = codepointsLabel(codes) || '—';
  const catName = isEn ? cat.nameEn : cat.name;
  const faq     = buildFaqItems(item, catName, codesLabel, lang);

  const enName  = en || item.name;
  const metaDesc = isEn
    ? `${enName} ${char}${en ? ` (${en})` : ''} — Download PNG Apple, Google and Microsoft for free. Meaning, Unicode ${codesLabel}, copy in one click.`
    : `Эмодзи ${item.name} ${char}${en ? ` (${en})` : ''} — скачать PNG Apple, Google и Microsoft бесплатно. Значение, Юникод ${codesLabel}, копировать в один клик.`;

  const enRow = en
    ? `<div class="meta-row"><span class="meta-key">English</span><span class="meta-val">${esc(en)}</span></div>`
    : '';

  const vars = {
    LANG_ATTR:      isEn ? 'en' : 'ru',
    LANG_SCRIPT:    isEn ? `<script>window.__LANG__='en';</script>\n` : '',
    REL:            rel,
    HOME_REL:       homeRel,
    DATA_BASE:      isEn ? '/' : rel,
    TITLE:          isEn
      ? `${enName} ${char} Emoji — Meaning, Download PNG · Trace Logo's`
      : `Эмодзи ${item.name} ${char} — значение, скачать PNG · Trace Logo's`,
    META_DESC:      esc(metaDesc),
    CANONICAL_URL:  fullUrl,
    OG_TITLE:       esc(isEn ? `${enName} ${char} Emoji — Download PNG` : `Эмодзи ${item.name} ${char} — скачать PNG`),
    OG_DESC:        esc(metaDesc),
    OG_IMAGE:       assetUrlAbs(item.file),
    JSON_LD:        buildJsonLd(item, catName, catSlug, slug, fullUrl, faq, lang),
    LABEL_EMOJI_CRUMB: isEn ? 'Emoji' : 'Эмодзи',
    LABEL_DOWNLOAD:    isEn ? 'Download & Copy' : 'Скачать и копировать',
    LABEL_VARIANTS:    isEn ? 'Variants' : 'Варианты',
    LABEL_SYMBOL:      isEn ? 'Symbol' : 'Символ',
    LABEL_UNICODE:     'Unicode',
    LABEL_CATEGORY:    isEn ? 'Category' : 'Категория',
    CATALOG_CTA_TITLE: isEn ? '1918 emoji in the catalog' : '1918 эмодзи в каталоге',
    CATALOG_CTA_SUB:   isEn ? 'Apple, Google and Microsoft — search in English' : 'Apple, Google и Microsoft — поиск на русском',
    LABEL_OPEN_CATALOG: isEn ? 'Open catalog' : 'Открыть каталог',
    BREADCRUMB_CAT:       esc(catName),
    BREADCRUMB_CAT_SLUG:  catSlug,
    BREADCRUMB_CURRENT:   esc(isEn ? enName : item.name),
    CATEGORY_ICON:  CATEGORY_ICONS[catSlug] || '🙂',
    CATEGORY_NAME:  esc(catName),
    EMOJI_CHAR:     esc(char),
    PREVIEW_SRC:    assetUrlRel(item.file, rel),
    PREVIEW_ALT:    esc(isEn ? `${enName} Emoji` : `Эмодзи ${item.name}`),
    H1:             esc(isEn ? `${enName} Emoji` : `Эмодзи ${item.name}`),
    EMOJI_DESC:     esc(`${char} ${isEn ? enName : item.name}${en && !isEn ? ` · ${en}` : ''}`),
    DOWNLOAD_BUTTONS:  buildDownloadButtons(item, rel, lang),
    VARIANT_CARDS:     buildVariantCards(item, rel, lang),
    EMOJI_PAGE_DATA:   buildEmojiPageData(item, rel),
    CODEPOINTS:     esc(codesLabel),
    EN_ROW:         enRow,
    FAQ_SECTION:    buildFaqSection(faq, lang),
  };

  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) { console.warn(`Unknown placeholder {{${k}}}`); return ''; }
    return vars[k];
  });
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', 'manifest.json'), 'utf8'));
  const builtUrls = [];
  const urlMap = {};   // item.file (globally unique) → page URL — shared with build-emoji-json.js
  let written = 0, skipped = 0;

  for (const catRef of manifest.categories) {
    const base = path.basename(catRef.file, '.json');
    const cat  = CATEGORIES[base];
    if (!cat) { console.warn(`⚠ no slug mapping for ${base} — skipped`); continue; }

    const data  = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', catRef.file), 'utf8'));
    const items = data.items || [];
    const usedSlugs = new Set();

    for (const item of items) {
      if (!item.file) { skipped++; continue; }
      let { slug, codes } = parseFile(item.file);
      if (!slug) { skipped++; continue; }
      if (usedSlugs.has(slug)) slug = slug + '-' + codes.join('-');   // dedupe collisions
      usedSlugs.add(slug);

      const url = `/emoji/${cat.slug}/${slug}/`;
      builtUrls.push(url);
      urlMap[item.file] = url;

      if (DRY_RUN) continue;

      // RU page
      const html    = buildPage(item, cat, slug, 'ru');
      const outPath = path.join(ROOT, 'emoji', cat.slug, slug, 'index.html');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
      if (prev !== html) { fs.writeFileSync(outPath, html, 'utf8'); written++; }

      // EN page — apply bakeI18n to translate data-i18n / data-label elements
      const htmlEn    = bakeI18n(buildPage(item, cat, slug, 'en'), EN);
      const outPathEn = path.join(ROOT, 'en', 'emoji', cat.slug, slug, 'index.html');
      fs.mkdirSync(path.dirname(outPathEn), { recursive: true });
      const prevEn = fs.existsSync(outPathEn) ? fs.readFileSync(outPathEn, 'utf8') : '';
      if (prevEn !== htmlEn) { fs.writeFileSync(outPathEn, htmlEn, 'utf8'); written++; }
    }
  }

  if (DRY_RUN) {
    console.log(`Dry run: ${builtUrls.length} emoji pages would be generated.`);
    return;
  }

  console.log(`✓ Emoji pages written: ${written}  (total ${builtUrls.length * 2}, skipped ${skipped})`);

  // Emit URL list for the sitemap builder + file→url map for build-emoji-json.js.
  fs.writeFileSync(path.join(ROOT, 'emoji', '_urls.json'), JSON.stringify(builtUrls), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'emoji', '_url-map.json'), JSON.stringify(urlMap), 'utf8');
}

main();
