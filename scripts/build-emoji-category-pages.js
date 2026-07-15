#!/usr/bin/env node
/**
 * Generates emoji category landing pages:
 *   emoji/<slug>/index.html     (RU)
 *   en/emoji/<slug>/index.html  (EN)
 *
 * Slug + per-emoji URLs come from emoji/_url-map.json (produced by
 * build-emoji-seo-pages.js) — single source of slug truth.
 *
 * JSON-LD: BreadcrumbList + CollectionPage + ItemList + FAQPage.
 *
 * Usage:
 *   node scripts/build-emoji-category-pages.js            # build all
 *   node scripts/build-emoji-category-pages.js --dry-run
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');
const { loadDict, bakeI18n, makePathsAbsolute, hreflangBlock } = require('./lib/en-transform');

const BASE_URL = 'https://trace-logos.ru';
const ROOT     = path.resolve(__dirname, '..');
const TEMPLATE = loadTemplate(path.join(ROOT, 'templates', 'emoji-category-page.html'));
const DRY_RUN  = process.argv.includes('--dry-run');
const EN       = loadDict().en;

const CATEGORIES = {
  'smileys-emotion': { slug: 'smileys',    name: 'Смайлы и эмоции',       nameEn: 'Smileys & Emotion',  icon: '😀' },
  'people-body':     { slug: 'people',     name: 'Люди и жесты',          nameEn: 'People & Body',      icon: '🧑' },
  'animals-nature':  { slug: 'animals',    name: 'Животные и природа',    nameEn: 'Animals & Nature',   icon: '🐶' },
  'food-drink':      { slug: 'food',       name: 'Еда и напитки',         nameEn: 'Food & Drink',       icon: '🍔' },
  'travel-places':   { slug: 'travel',     name: 'Путешествия и места',   nameEn: 'Travel & Places',    icon: '✈️' },
  'activities':      { slug: 'activities', name: 'Активности',            nameEn: 'Activities',         icon: '⚽' },
  'objects':         { slug: 'objects',    name: 'Предметы',              nameEn: 'Objects',            icon: '💡' },
  'symbols':         { slug: 'symbols',    name: 'Символы',               nameEn: 'Symbols',            icon: '❤️' },
  'flags':           { slug: 'flags',      name: 'Флаги',                 nameEn: 'Flags',              icon: '🏁' },
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function emojiChar(item) { return (item.tags || '').trim().split(/\s+/)[0] || ''; }

// Extract English name from tags: "<emoji> english name русское название"
function englishName(item) {
  const toks = (item.tags || '').trim().split(/\s+/).slice(1);
  return toks.filter(t => /[a-z]/i.test(t) && !/[а-яё]/i.test(t)).join(' ');
}

function buildCards(items, urlMap, lang = 'ru') {
  return items.map(item => {
    const pageUrl = urlMap[item.file];
    if (!pageUrl) return '';
    const href = pageUrl.split('/').filter(Boolean).at(-1) + '/';
    const name = lang === 'en' ? (englishName(item) || item.name) : item.name;
    return `<a class="emoji-cat-card" href="${href}" title="${esc(name)}">
        <span class="emoji-cat-glyph" aria-hidden="true">${esc(emojiChar(item))}</span>
        <span class="emoji-cat-name">${esc(name)}</span>
      </a>`;
  }).filter(Boolean).join('\n      ');
}

function buildFaqItems(cat, count, lang = 'ru') {
  if (lang === 'en') {
    return [
      {
        q: `How many emoji are in the "${cat.nameEn}" category?`,
        a: `The "${cat.nameEn}" category has ${count} emoji in Apple, Google and Microsoft versions. You can copy or download each as PNG, free and without signup.`,
      },
      {
        q: `How do I copy an emoji from the "${cat.nameEn}" category?`,
        a: `Open the emoji page and click "Copy emoji" — the character will be ready to paste in any text, message or document.`,
      },
      {
        q: `Can I download emoji as PNG?`,
        a: `Yes. Apple and Google PNG versions are available for every emoji, plus Microsoft Fluent SVG — all free, no signup required.`,
      },
    ];
  }
  return [
    {
      q: `Сколько эмодзи в категории «${cat.name}»?`,
      a: `В категории «${cat.name}» собрано ${count} эмодзи в версиях Apple, Google и Microsoft. Каждый можно скопировать или скачать в PNG.`,
    },
    {
      q: `Как скопировать эмодзи из категории «${cat.name}»?`,
      a: `Откройте страницу нужного эмодзи и нажмите «Скопировать эмодзи» — символ вставится в любой текст, сообщение или документ.`,
    },
    {
      q: `Можно ли скачать эмодзи в PNG?`,
      a: `Да. Для каждого эмодзи доступны PNG-версии Apple и Google, а также SVG Microsoft Fluent — бесплатно и без регистрации.`,
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

function buildJsonLd(cat, fullUrl, items, urlMap, faq, lang = 'ru') {
  const isEn = lang === 'en';
  const list = items
    .map((it, i) => {
      const u = urlMap[it.file];
      const name = isEn ? (englishName(it) || it.name) : it.name;
      return u ? { "@type": "ListItem", "position": i + 1, "name": name, "url": BASE_URL + u } : null;
    })
    .filter(Boolean)
    .slice(0, 100);

  const graph = [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Trace Logo's", "item": `${BASE_URL}/` },
        { "@type": "ListItem", "position": 2,
          "name": isEn ? "Emoji" : "Эмодзи",
          "item": isEn ? `${BASE_URL}/en/emoji/` : `${BASE_URL}/emoji/` },
        { "@type": "ListItem", "position": 3, "name": isEn ? cat.nameEn : cat.name, "item": fullUrl },
      ],
    },
    {
      "@type": "CollectionPage",
      "name": isEn ? `${cat.nameEn} emoji` : `Эмодзи — ${cat.name}`,
      "description": isEn
        ? `${cat.nameEn} emoji in Apple, Google and Microsoft versions.`
        : `Эмодзи категории «${cat.name}» в Apple, Google и Microsoft.`,
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

// Apply EN chrome: absolute asset paths + lang=en + __LANG__ + og:locale
function applyEnChrome(html, catSlug) {
  html = makePathsAbsolute(html, `emoji/${catSlug}/index.html`);
  html = html.replace(/<html(\s+lang="[^"]*")?(\s*)>/, (m, _l, sp) => `<html lang="en"${sp || ' '}>`);
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n  <script>window.__LANG__='en';</script>`);
  html = html.replace(/content="ru_RU"/, 'content="en_US"');
  return html;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', 'manifest.json'), 'utf8'));
  let urlMap = {};
  try { urlMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', '_url-map.json'), 'utf8')); }
  catch { console.error('✗ emoji/_url-map.json not found — run build-emoji-seo-pages.js first'); process.exit(1); }

  const rel = '../../';
  let written = 0;

  for (const catRef of manifest.categories) {
    const base = path.basename(catRef.file, '.json');
    const cat  = CATEGORIES[base];
    if (!cat) { console.warn(`⚠ no mapping for ${base}`); continue; }

    const data  = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', catRef.file), 'utf8'));
    const items = (data.items || []).filter(i => i.file && urlMap[i.file]);
    const fullUrlRu = `${BASE_URL}/emoji/${cat.slug}/`;
    const fullUrlEn = `${BASE_URL}/en/emoji/${cat.slug}/`;

    if (DRY_RUN) {
      console.log(`emoji/${cat.slug}/index.html  (${items.length} emoji)`);
      console.log(`en/emoji/${cat.slug}/index.html  (${items.length} emoji)`);
      continue;
    }

    // ── RU page ──
    const faqRu     = buildFaqItems(cat, items.length, 'ru');
    const metaDescRu = `${items.length} эмодзи категории «${cat.name}» в Apple, Google и Microsoft. Копируйте и скачивайте PNG бесплатно.`;
    const leadRu     = `Все эмодзи категории «${cat.name}» — ${items.length} символов в версиях Apple, Google и Microsoft. Нажмите на любой, чтобы скопировать или скачать.`;

    const htmlRu = renderTemplate({
      REL: rel, HOME_REL: rel, DATA_BASE: rel,
      BREADCRUMB_EMOJI: 'Эмодзи',
      TITLE: `Эмодзи — ${cat.name}: копировать и скачать · Trace Logo's`,
      META_DESC: esc(metaDescRu),
      CANONICAL_URL: fullUrlRu,
      HREFLANG_TAGS: hreflangBlock(fullUrlRu, fullUrlEn),
      OG_TITLE: esc(`Эмодзи — ${cat.name}`),
      OG_DESC: esc(metaDescRu),
      OG_IMAGE: `${BASE_URL}/favicon-512.png`,
      JSON_LD: buildJsonLd(cat, fullUrlRu, items, urlMap, faqRu, 'ru'),
      CATEGORY_ICON: cat.icon,
      CATEGORY_NAME: esc(cat.name),
      H1: esc(`Эмодзи: ${cat.name}`),
      LEAD: esc(leadRu),
      CARDS: buildCards(items, urlMap, 'ru'),
      EMOJI_CAT_CTA_TITLE: '1918 эмодзи в каталоге',
      EMOJI_CAT_CTA_SUB: 'Apple, Google и Microsoft — поиск на русском',
      EMOJI_CAT_OPEN: 'Открыть каталог',
      FAQ_SECTION: buildFaqSection(faqRu, 'ru'),
    });

    const outRu = path.join(ROOT, 'emoji', cat.slug, 'index.html');
    fs.mkdirSync(path.dirname(outRu), { recursive: true });
    fs.writeFileSync(outRu, htmlRu, 'utf8');
    written++;

    // ── EN page ──
    const faqEn     = buildFaqItems(cat, items.length, 'en');
    const metaDescEn = `${items.length} ${cat.nameEn} emoji in Apple, Google and Microsoft versions. Copy and download PNG for free.`;
    const leadEn     = `All ${cat.nameEn} emoji — ${items.length} characters in Apple, Google and Microsoft versions. Click any to copy or download.`;

    let htmlEn = renderTemplate({
      REL: rel, HOME_REL: '/en/', DATA_BASE: '/',
      BREADCRUMB_EMOJI: 'Emoji',
      TITLE: `${cat.nameEn} Emoji — copy and download · Trace Logo's`,
      META_DESC: esc(metaDescEn),
      CANONICAL_URL: fullUrlEn,
      HREFLANG_TAGS: hreflangBlock(fullUrlRu, fullUrlEn),
      OG_TITLE: esc(`${cat.nameEn} emoji`),
      OG_DESC: esc(metaDescEn),
      OG_IMAGE: `${BASE_URL}/favicon-512.png`,
      JSON_LD: buildJsonLd(cat, fullUrlEn, items, urlMap, faqEn, 'en'),
      CATEGORY_ICON: cat.icon,
      CATEGORY_NAME: esc(cat.nameEn),
      H1: esc(`${cat.nameEn} emoji`),
      LEAD: esc(leadEn),
      CARDS: buildCards(items, urlMap, 'en'),
      EMOJI_CAT_CTA_TITLE: '1918 emoji in the catalog',
      EMOJI_CAT_CTA_SUB: esc('Apple, Google & Microsoft'),
      EMOJI_CAT_OPEN: 'Open catalog',
      FAQ_SECTION: buildFaqSection(faqEn, 'en'),
    });
    htmlEn = bakeI18n(htmlEn, EN);
    htmlEn = applyEnChrome(htmlEn, cat.slug);

    const outEn = path.join(ROOT, 'en', 'emoji', cat.slug, 'index.html');
    fs.mkdirSync(path.dirname(outEn), { recursive: true });
    fs.writeFileSync(outEn, htmlEn, 'utf8');
    written++;
  }

  if (DRY_RUN) console.log('\nDry run complete.');
  else console.log(`✓ Emoji category pages: ${written} (RU + EN)`);
}

main();
