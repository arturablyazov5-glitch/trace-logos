#!/usr/bin/env node
/**
 * Generates the human-readable HTML sitemap page: sitemap/index.html
 *
 * Mirrors the XML sitemap structure (build-sitemap.js) but as a crawlable,
 * browsable page linked from the homepage footer. Sources are the same
 * manifests/JSON, so it stays in sync.
 *
 * Groups: Логотипы (all categories) · Эмодзи (9 categories) ·
 *         Подборки (collections.json) · Разделы (static + blog posts).
 *
 * Usage:
 *   node scripts/build-home-sitemap.js            # write sitemap/index.html
 *   node scripts/build-home-sitemap.js --dry-run  # print stats only
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');

const ROOT     = path.resolve(__dirname, '..');
const OUT      = path.join(ROOT, 'sitemap', 'index.html');
const TEMPLATE = loadTemplate(path.join(ROOT, 'templates', 'sitemap-page.html'));
const DRY_RUN  = process.argv.includes('--dry-run');

const EMOJI_CATS = {
  'smileys-emotion': { slug: 'smileys',    name: 'Смайлы' },
  'people-body':     { slug: 'people',     name: 'Люди' },
  'animals-nature':  { slug: 'animals',    name: 'Животные' },
  'food-drink':      { slug: 'food',       name: 'Еда' },
  'travel-places':   { slug: 'travel',     name: 'Путешествия' },
  'activities':      { slug: 'activities', name: 'Активности' },
  'objects':         { slug: 'objects',    name: 'Предметы' },
  'symbols':         { slug: 'symbols',    name: 'Символы' },
  'flags':           { slug: 'flags',      name: 'Флаги' },
};

const REL = '../';   // sitemap/index.html → repo root

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function group(title, titleHref, links) {
  const head = titleHref ? `<a href="${titleHref}">${esc(title)}</a>` : esc(title);
  const items = links.map(l => `<a href="${l.href}">${esc(l.name)}</a>`).join('\n          ');
  return `      <div class="sitemap-group">
        <h2 class="sitemap-group-title">${head}</h2>
        <div class="sitemap-links">
          ${items}
        </div>
      </div>`;
}

function main() {
  const logoManifest  = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));
  const emojiManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', 'manifest.json'), 'utf8'));

  // Логотипы — все категории каталога
  const logoLinks = logoManifest.categories.map(c => ({ name: c.section, href: `${REL}logos/${c.slug}/` }));

  // Эмодзи — 9 категорий
  const emojiLinks = emojiManifest.categories
    .map(ref => EMOJI_CATS[path.basename(ref.file, '.json')])
    .filter(Boolean)
    .map(c => ({ name: c.name, href: `${REL}emoji/${c.slug}/` }));

  // Подборки
  let collLinks = [];
  try {
    const cols = JSON.parse(fs.readFileSync(path.join(ROOT, 'collections.json'), 'utf8')).collections;
    collLinks = cols.map(c => ({ name: c.h1 || c.title, href: `${REL}collections/${c.slug}/` }));
  } catch {}

  // Разделы — статические страницы (без отдельных статей блога)
  const sectionLinks = [
    { name: 'Главная', href: REL },
    { name: 'Все логотипы', href: `${REL}logos/` },
    { name: 'Все эмодзи', href: `${REL}emoji/` },
    { name: 'Блог', href: `${REL}blog/` },
  ];

  const cols = [
    group('Логотипы', `${REL}logos/`, logoLinks),
    group('Эмодзи', `${REL}emoji/`, emojiLinks),
    group('Подборки', null, collLinks),
    group('Разделы', null, sectionLinks),
  ].join('\n');

  if (DRY_RUN) {
    console.log(`logos:${logoLinks.length} emoji:${emojiLinks.length} collections:${collLinks.length} sections:${sectionLinks.length}`);
    return;
  }

  const html = TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (k === 'REL') return REL;
    if (k === 'GROUPS') return cols;
    console.warn(`Unknown placeholder {{${k}}}`); return '';
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html, 'utf8');
  console.log(`✓ sitemap/index.html → logos:${logoLinks.length} emoji:${emojiLinks.length} collections:${collLinks.length} sections:${sectionLinks.length}`);
}

main();
