#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');

// Absolute public-API URLs — see the note in build-api-json.js. The site is on
// GitHub project pages (…/trace-logos/), so root-relative paths break.
const BASE_URL = 'https://trace-logos.ru';

const CATEGORY_NAMES = {
  'smileys-emotion':  'Смайлы и эмоции',
  'people-body':      'Люди и тело',
  'animals-nature':   'Животные и природа',
  'food-drink':       'Еда и напитки',
  'travel-places':    'Путешествия и места',
  'activities':       'Активности',
  'objects':          'Предметы',
  'symbols':          'Символы',
  'flags':            'Флаги',
};

function assetExt(file) {
  return (file || '').split('.').pop().toLowerCase();
}

// Extract English name from tags: "😀 grinning face широко улыбается" → "Grinning face"
function nameEnFromTags(tags) {
  const words = (tags || '').trim().split(/\s+/);
  const en = [];
  for (const w of words) {
    if (/[а-яёА-ЯЁ]/.test(w)) break;   // stop at first Russian word
    if (/\p{Emoji}/u.test(w) && !/[a-zA-Z0-9]/.test(w)) continue; // skip emoji chars
    if (w) en.push(w);
  }
  const result = en.join(' ');
  return result ? result.charAt(0).toUpperCase() + result.slice(1) : '';
}

function itemUrl(file, ext) {
  return ext === 'svg'
    ? `${BASE_URL}/assets/emoji/svgs/${file}`
    : `${BASE_URL}/assets/emoji/pngs/${file}`;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', 'manifest.json'), 'utf8'));
  const today    = new Date().toISOString().slice(0, 10);
  const allEmoji = [];

  // file → page URL map produced by build-emoji-seo-pages.js (single source of slug truth).
  let urlMap = {};
  try { urlMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', '_url-map.json'), 'utf8')); }
  catch { console.warn('⚠ emoji/_url-map.json not found — run build-emoji-seo-pages.js first for page URLs'); }

  for (const cat of manifest.categories) {
    const slug = path.basename(cat.file, '.json');
    const categoryName = CATEGORY_NAMES[slug] || slug;
    const data  = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', cat.file), 'utf8'));
    const items = data.items || [];

    for (const item of items) {
      if (!item.file) continue;

      const ext = assetExt(item.file);
      const primaryUrl = itemUrl(item.file, ext);

      const variants = (item.variants || [])
        .filter(v => v.file)
        .map(v => {
          const vext = assetExt(v.file);
          const url = itemUrl(v.file, vext);
          return vext === 'svg'
            ? { label: v.label || 'Вариант', svgUrl: url, wide: false }
            : { label: v.label || 'Вариант', pngUrl: url, wide: false };
        });

      const pageUrl = urlMap[item.file];
      const nameEn = nameEnFromTags(item.tags);
      const entry = {
        name:         item.name,
        ...(nameEn ? { name_en: nameEn } : {}),
        tags:         item.tags || '',
        url:          pageUrl ? `${BASE_URL}${pageUrl}` : null,
        categorySlug: slug,
        categoryName,
        ecosystem:    null,
        variants:     variants.length ? variants : undefined,
      };

      if (ext === 'svg') {
        entry.svgUrl = primaryUrl;
        entry.pngUrl = null;
      } else {
        entry.svgUrl = null;
        entry.pngUrl = primaryUrl;
      }

      allEmoji.push(entry);
    }
  }

  const out = JSON.stringify({ total: allEmoji.length, updated: today, emoji: allEmoji });
  // build-all.js прокидывает --dry-run в КАЖДЫЙ шаг — скрипт, игнорирующий флаг,
  // превращает «preview, write nothing» в ложь и пишет файлы на диск.
  if (process.argv.includes('--dry-run')) {
    console.log(`(dry-run) emoji.json  ${allEmoji.length} items`);
    return;
  }
  fs.writeFileSync(path.join(ROOT, 'emoji.json'), out, 'utf8');
  console.log(`✓ emoji.json  ${allEmoji.length} items`);
}

main();
