#!/usr/bin/env node
// Публичный GEO-экспорт эмодзи-каталога для LLM-ботов (описан в llms.txt):
//   emoji-index.json  — сводка по 9 категориям
//   emoji/<slug>.json — плоский список эмодзи категории (appleUrl/googleUrl/microsoftUrl)
//
// Заменяет удалённый scripts/build-icons-data.js (см. CLAUDE.md, «⚠️ Скрейпера
// scripts/scrape-emoji.js в репозитории НЕТ» — build-icons-data.js удалён тем же
// коммитом). Прежний артефакт не пересобирался с 10 июня и содержал 12 мёртвых
// googleUrl во flags.json (флаги без реального google-варианта) — Яндекс нашёл их
// как 404. Этот скрипт читает variants[] из emoji/categories/*.json напрямую —
// googleUrl/microsoftUrl попадают в вывод только если такой вариант реально есть
// в источнике, поэтому тот класс расхождения больше не может повториться.
const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const BASE_URL = 'https://trace-logos.ru';

// file → geo-slug + отображаемое имя категории. Значения зафиксированы так, как
// уже опубликованы в emoji-index.json/emoji/<slug>.json и задокументированы в
// llms.txt — менять их означает менять уже проиндексированные URL.
const CATEGORY_META = {
  'smileys-emotion': { slug: 'smileys',    name: 'Смайлы и эмоции' },
  'people-body':     { slug: 'people',     name: 'Люди и жесты' },
  'animals-nature':  { slug: 'animals',    name: 'Животные и природа' },
  'food-drink':      { slug: 'food',       name: 'Еда и напитки' },
  'travel-places':   { slug: 'travel',     name: 'Путешествия и места' },
  'activities':      { slug: 'activities', name: 'Активности' },
  'objects':         { slug: 'objects',    name: 'Объекты' },
  'symbols':         { slug: 'symbols',    name: 'Символы' },
  'flags':           { slug: 'flags',      name: 'Флаги' },
};

function assetExt(file) {
  return (file || '').split('.').pop().toLowerCase();
}

function assetUrl(file) {
  const ext = assetExt(file);
  return ext === 'svg'
    ? `${BASE_URL}/assets/emoji/svgs/${file}`
    : `${BASE_URL}/assets/emoji/pngs/${file}`;
}

// Первый токен tags — эмодзи-символ (см. build-emoji-json.js: та же конвенция).
function emojiChar(tags) {
  return (tags || '').trim().split(/\s+/)[0] || '';
}

function findVariant(variants, label) {
  return (variants || []).find(v => v.label === label && v.file);
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', 'manifest.json'), 'utf8'));

  const indexCategories = [];
  let totalEmoji = 0;
  let microsoftCount = 0;
  const written = [];

  for (const cat of manifest.categories) {
    const baseSlug = path.basename(cat.file, '.json');
    const meta = CATEGORY_META[baseSlug];
    if (!meta) throw new Error(`build-emoji-category-json.js: нет CATEGORY_META для "${baseSlug}" — добавь запись в маппинг`);

    const data  = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', cat.file), 'utf8'));
    const items = data.items || [];

    const outItems = items.map(item => {
      const entry = {
        name:  item.name,
        emoji: emojiChar(item.tags),
        figma: item.figma,
        appleUrl: assetUrl(item.file),
      };
      const google = findVariant(item.variants, 'Google');
      if (google) entry.googleUrl = assetUrl(google.file);
      const microsoft = findVariant(item.variants, 'Microsoft');
      if (microsoft) {
        entry.microsoftUrl = assetUrl(microsoft.file);
        microsoftCount++;
      }
      return entry;
    });

    totalEmoji += outItems.length;
    indexCategories.push({ name: meta.name, slug: meta.slug, count: outItems.length, url: `${BASE_URL}/emoji/${meta.slug}.json` });

    const outPath = path.join(ROOT, 'emoji', `${meta.slug}.json`);
    const out = { category: meta.name, slug: meta.slug, total: outItems.length, items: outItems };
    written.push({ path: outPath, size: outItems.length });
    if (!dryRun) {
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const indexOut = {
    total: totalEmoji,
    updated: today,
    vendors: ['apple', 'google', 'microsoft'],
    microsoftCount,
    note: 'Fetch /emoji/{slug}.json for category details. Each emoji has Apple PNG (primary), Google PNG, and Microsoft Fluent Emoji SVG variants.',
    categories: indexCategories,
  };
  const indexPath = path.join(ROOT, 'emoji-index.json');
  if (!dryRun) {
    fs.writeFileSync(indexPath, JSON.stringify(indexOut, null, 2) + '\n', 'utf8');
  }

  if (dryRun) {
    console.log(`(dry-run) emoji-index.json + ${written.length} категорийных JSON:`);
    for (const w of written) console.log(`  emoji/${path.basename(w.path)}  ${w.size} items`);
    console.log(`  total: ${totalEmoji} эмодзи, microsoftCount: ${microsoftCount}`);
  } else {
    console.log(`✓ emoji-index.json + ${written.length} × emoji/<slug>.json  (${totalEmoji} эмодзи, microsoft: ${microsoftCount})`);
  }
}

main();
