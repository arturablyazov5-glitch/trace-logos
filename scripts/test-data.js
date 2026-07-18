#!/usr/bin/env node
/**
 * Data-integrity tests for the catalog. Read-only, writes nothing.
 *
 * Two tiers, matching where they belong in the build-all pipeline:
 *
 *   --pre   (before any builder) — source data must be valid before building:
 *           • required fields (name, tags, figma, file) in logos/emoji items
 *           • duplicate `file` / `figma` within a category
 *           • every file/variants[].file resolves to a real asset on disk
 *           • every `ecosystem` key exists in logos/ecosystems.json
 *           • orphan assets in assets/logos/svgs|pngs unreferenced by any JSON (warning)
 *
 *   --post  (after build-webp-previews) — build artifacts must be in sync:
 *           • every PNG logo has an up-to-date WebP preview
 *           • every non-comingSoon logo has assets/og/<slug>.png
 *             (warning by default — OG is the opt-in slow tier; --strict makes it fatal)
 *
 * Exit code 1 on any error (build-all stops). Warnings don't fail the build
 * unless --strict. --dry-run is accepted and ignored (the script never writes).
 *
 * Usage:
 *   node scripts/test-data.js --pre
 *   node scripts/test-data.js --post
 *   node scripts/test-data.js           # both tiers
 *   node scripts/test-data.js --strict  # warnings become errors
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const RUN_PRE  = argv.includes('--pre')  || !argv.includes('--post');
const RUN_POST = argv.includes('--post') || !argv.includes('--pre');
const STRICT = argv.includes('--strict');

const errors = [];
const warnings = [];
const err  = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, rel), 'utf8'));
}

// Mirrors seoSlug in build-og-images.js / build-seo-pages.js
function slugify(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}
function seoSlug(item) {
  const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return '';
  return parts.slice(1).join('-');
}

// Some logo items point outside assets/logos via a root-absolute path
// (e.g. flagi.json → "/assets/emoji/pngs/apple/…") — resolve those from ROOT.
function logoAssetPath(file) {
  if (file.startsWith('/')) return path.join(ROOT, file);
  const dir = file.toLowerCase().endsWith('.svg') ? 'svgs' : 'pngs';
  return path.join(ROOT, 'assets', 'logos', dir, file);
}
function emojiAssetPath(file) {
  const dir = file.toLowerCase().endsWith('.svg') ? 'svgs' : 'pngs';
  return path.join(ROOT, 'assets', 'emoji', dir, file);
}

// item.ecosystem is a string or an array of keys (see itemEcosystems in main.js)
function itemEcosystems(item) {
  return Array.isArray(item.ecosystem) ? item.ecosystem : item.ecosystem ? [item.ecosystem] : [];
}

// All asset files an entry (item or variant) references: file + macos_styles.{dark,light}
function entryFiles(entry) {
  const styles = entry.macos_styles && typeof entry.macos_styles === 'object'
    ? Object.values(entry.macos_styles) : [];
  return [entry.file, ...styles];
}

function loadCategories(manifestRel, baseDir) {
  const manifest = readJson(manifestRel);
  return manifest.categories.map(cat => ({
    ...cat,
    items: readJson(path.join(baseDir, cat.file)).items || [],
  }));
}

const REQUIRED_FIELDS = ['name', 'tags', 'figma', 'file'];

function checkItems(cats, { label, assetPath, referenced, ecosystems }) {
  for (const cat of cats) {
    const where = `${label}/${path.basename(cat.file)}`;
    const seenFiles = new Map();
    const seenFigma = new Map();

    cat.items.forEach((item, i) => {
      const id = item.name || item.figma || `#${i}`;

      for (const f of REQUIRED_FIELDS) {
        if (typeof item[f] !== 'string' || !item[f].trim()) {
          err(`${where}: «${id}» — отсутствует или пустое поле "${f}"`);
        }
      }
      if (item.variants !== undefined && !Array.isArray(item.variants)) {
        err(`${where}: «${id}» — "variants" не массив`);
      }

      const variants = Array.isArray(item.variants) ? item.variants.filter(Boolean) : [];
      const primaryFiles = entryFiles(item);
      const variantFiles = variants.flatMap(v => (v.file ? entryFiles(v) : (err(`${where}: «${id}» — вариант без поля "file"`), [])));
      for (const [files, isVariant] of [[primaryFiles, false], [variantFiles, true]]) {
        for (const f of files) {
          if (!f || typeof f !== 'string') continue;
          if (referenced) referenced.add(f);
          if (!item.comingSoon && !fs.existsSync(assetPath(f))) {
            // Emoji vendor variants (google/microsoft) are optional extras from the
            // scraper — a dangling ref is worth flagging but shouldn't block a build.
            const report = (label === 'emoji' && isVariant) ? warn : err;
            report(`${where}: «${id}» — файл не найден: ${f}`);
          }
        }
      }

      if (item.file) {
        if (seenFiles.has(item.file) && item.file !== 'placeholder.svg') {
          err(`${where}: дубль file "${item.file}" — «${seenFiles.get(item.file)}» и «${id}»`);
        }
        seenFiles.set(item.file, id);
      }
      if (item.figma) {
        if (seenFigma.has(item.figma)) {
          // The emoji scraper reuses one Figma component name across skin/family
          // variations (e.g. Emoji/Family ×14) — noisy but not a build blocker.
          const report = label === 'emoji' ? warn : err;
          report(`${where}: дубль figma "${item.figma}" — «${seenFigma.get(item.figma)}» и «${id}»`);
        }
        seenFigma.set(item.figma, id);
      }

      if (ecosystems) {
        for (const eco of itemEcosystems(item)) {
          if (!ecosystems.has(eco)) {
            const hint = eco.includes(',') ? ' (несколько экосистем задаются массивом, не строкой через запятую)' : '';
            err(`${where}: «${id}» — ecosystem "${eco}" отсутствует в logos/ecosystems.json${hint}`);
          }
        }
      }
    });
  }
}

function listFilesRecursive(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(abs, base));
    else if (!entry.name.startsWith('.')) out.push(path.relative(base, abs));
  }
  return out;
}

function runPre() {
  const logoCats  = loadCategories('logos/manifest.json', path.join(ROOT, 'logos'));
  const emojiCats = loadCategories('emoji/manifest.json', path.join(ROOT, 'emoji'));
  const ecosystems = new Set(Object.keys(readJson('logos/ecosystems.json')));

  const referencedLogos = new Set();
  checkItems(logoCats,  { label: 'logos', assetPath: logoAssetPath, referenced: referencedLogos, ecosystems });
  checkItems(emojiCats, { label: 'emoji', assetPath: emojiAssetPath });

  // Orphans: assets present on disk but referenced by no logo item.
  for (const dir of ['svgs', 'pngs']) {
    const base = path.join(ROOT, 'assets', 'logos', dir);
    for (const rel of listFilesRecursive(base)) {
      if (!referencedLogos.has(rel)) warn(`сирота: assets/logos/${dir}/${rel} не упомянут ни в одном category JSON`);
    }
  }

  const total = logoCats.reduce((n, c) => n + c.items.length, 0);
  console.log(`[pre] проверено логотипов: ${total}, эмодзи: ${emojiCats.reduce((n, c) => n + c.items.length, 0)}`);
}

function runPost() {
  const logoCats = loadCategories('logos/manifest.json', path.join(ROOT, 'logos'));

  // WebP previews: mirror the sections of build-webp-previews.js
  const previewSections = [
    { src: 'assets/logos/pngs', out: 'assets/logos/previews' },
    { src: 'assets/emoji/pngs/apple', out: 'assets/emoji/previews/apple' },
  ];
  let checked = 0;
  for (const { src, out } of previewSections) {
    for (const rel of listFilesRecursive(path.join(ROOT, src))) {
      if (!/\.png$/i.test(rel)) continue;
      checked++;
      const srcAbs = path.join(ROOT, src, rel);
      const outAbs = path.join(ROOT, out, rel.replace(/\.png$/i, '.webp'));
      if (!fs.existsSync(outAbs)) {
        err(`нет WebP-превью: ${out}/${rel.replace(/\.png$/i, '.webp')} (запустить build-webp-previews.js)`);
      } else if (fs.statSync(outAbs).mtimeMs < fs.statSync(srcAbs).mtimeMs) {
        err(`WebP-превью устарело: ${out}/${rel.replace(/\.png$/i, '.webp')} старше исходника`);
      }
    }
  }

  // Search images: every SVG logo needs an up-to-date PNG render
  // (build-search-images.js) — it's the image Яндекс.Картинки indexes,
  // referenced by the page preview <img> and the image sitemap.
  let searchChecked = 0;
  for (const rel of listFilesRecursive(path.join(ROOT, 'assets/logos/svgs'))) {
    if (!/\.svg$/i.test(rel)) continue;
    searchChecked++;
    const srcAbs = path.join(ROOT, 'assets/logos/svgs', rel);
    const outRel = `assets/logos/search/${rel.replace(/\.svg$/i, '.png')}`;
    const outAbs = path.join(ROOT, outRel);
    if (!fs.existsSync(outAbs)) {
      err(`нет PNG-рендера для поиска: ${outRel} (запустить build-search-images.js)`);
    } else if (fs.statSync(outAbs).mtimeMs < fs.statSync(srcAbs).mtimeMs) {
      err(`PNG-рендер для поиска устарел: ${outRel} старше исходника`);
    }
  }

  // OG images: every buildable logo should have assets/og/<slug>.png.
  // Warning, not error: build-og-images.js is the opt-in slow tier.
  let ogChecked = 0;
  for (const cat of logoCats) {
    for (const item of cat.items) {
      if (item.comingSoon || !item.file || item.file === 'placeholder.svg') continue;
      const slug = seoSlug(item);
      if (!slug) continue;
      ogChecked++;
      if (!fs.existsSync(path.join(ROOT, 'assets', 'og', `${slug}.png`))) {
        warn(`нет OG-картинки: assets/og/${slug}.png («${item.name}») — запустить build-og-images.js или npm run build -- --with-og`);
      }
    }
  }
  console.log(`[post] проверено WebP: ${checked}, OG: ${ogChecked}`);
}

if (RUN_PRE) runPre();
if (RUN_POST) runPost();

for (const w of warnings) console.warn(`\x1b[33m⚠ ${w}\x1b[0m`);
for (const e of errors)   console.error(`\x1b[31m✗ ${e}\x1b[0m`);

const fatal = errors.length + (STRICT ? warnings.length : 0);
console.log(`\nОшибок: ${errors.length}, предупреждений: ${warnings.length}${STRICT ? ' (strict: предупреждения фатальны)' : ''}`);
process.exit(fatal ? 1 : 0);
