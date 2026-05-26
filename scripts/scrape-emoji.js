#!/usr/bin/env node
// Scrapes all emoji from emojigraph.org
// Usage: node scripts/scrape-emoji.js
// Options:
//   --vendors apple,google,twitter  (default: all)
//   --concurrent 3                  (default: 3)
//   --dry-run                       (print what would be downloaded, no files)
//   --rebuild-only                  (skip downloads, just regenerate JSON from existing files)

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const ROOT      = path.join(__dirname, '..');
const PNGS_DIR  = path.join(ROOT, 'assets/emoji/pngs');
const EMOJI_DIR = path.join(ROOT, 'emoji');

const ALL_VENDORS = ['apple','google','facebook','twitter','samsung','microsoft','whatsapp','messenger','joypixels','openmoji','emojidex'];

const CATEGORIES = [
  { slug: 'smileys-emotion',  name: 'Смайлы и эмоции' },
  { slug: 'people-body',      name: 'Люди и жесты' },
  { slug: 'animals-nature',   name: 'Животные и природа' },
  { slug: 'food-drink',       name: 'Еда и напитки' },
  { slug: 'travel-places',    name: 'Путешествия и места' },
  { slug: 'activities',       name: 'Активности' },
  { slug: 'objects',          name: 'Объекты' },
  { slug: 'symbols',          name: 'Символы' },
  { slug: 'flags',            name: 'Флаги' },
  // emoji-16.0 управляется вручную, не перезаписывать через --rebuild-only
];

// ── Filename corrections ─────────────────────────────────────────────────────
// emojigraph uses different filenames than what's stored on disk (e.g. from font extraction).
// Map: emojigraph filename → actual filename on disk.
const FILENAME_CORRECTIONS = {
  'copyright_a9-fe0f.png':              'copyright_00a9-fe0f.png',
  'registered_ae-fe0f.png':             'registered_00ae-fe0f.png',
  'keycap-number-sign_23-fe0f-20e3.png': 'hash_0023-fe0f-20e3.png',
  'keycap-asterisk_2a-fe0f-20e3.png':   'keycap_star_002a-fe0f-20e3.png',
  'keycap-digit-zero_30-fe0f-20e3.png':  'zero_0030-fe0f-20e3.png',
  'keycap-digit-one_31-fe0f-20e3.png':   'one_0031-fe0f-20e3.png',
  'keycap-digit-two_32-fe0f-20e3.png':   'two_0032-fe0f-20e3.png',
  'keycap-digit-three_33-fe0f-20e3.png': 'three_0033-fe0f-20e3.png',
  'keycap-digit-four_34-fe0f-20e3.png':  'four_0034-fe0f-20e3.png',
  'keycap-digit-five_35-fe0f-20e3.png':  'five_0035-fe0f-20e3.png',
  'keycap-digit-six_36-fe0f-20e3.png':   'six_0036-fe0f-20e3.png',
  'keycap-digit-seven_37-fe0f-20e3.png': 'seven_0037-fe0f-20e3.png',
  'keycap-digit-eight_38-fe0f-20e3.png': 'eight_0038-fe0f-20e3.png',
  'keycap-digit-nine_39-fe0f-20e3.png':  'nine_0039-fe0f-20e3.png',
};


// ── Parse args ──────────────────────────────────────────────────────────────
const argv       = process.argv.slice(2);
const getArg     = key => { const i = argv.indexOf(key); return i !== -1 ? argv[i + 1] : null; };
const DRY_RUN    = argv.includes('--dry-run');
const REBUILD    = argv.includes('--rebuild-only');
const CONCURRENT = parseInt(getArg('--concurrent') || '3', 10);
const vendorArg  = getArg('--vendors');
const VENDORS    = vendorArg ? vendorArg.split(',') : ALL_VENDORS;

// ── Helpers ──────────────────────────────────────────────────────────────────
function toCodepoint(emoji) {
  return [...emoji].map(c => c.codePointAt(0).toString(16)).join('-');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  if (fs.existsSync(dest)) return Promise.resolve('skip');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  return new Promise((resolve) => {
    const tmp = dest + '.tmp';
    const file = fs.createWriteStream(tmp);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
        return resolve('skip');
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        fs.renameSync(tmp, dest);
        resolve('ok');
      });
    }).on('error', () => {
      file.close();
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      resolve('err');
    });
  });
}

async function withConcurrency(items, fn, n) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
}

// ── Parse category page ───────────────────────────────────────────────────
function parseEmojiList(html) {
  const items = [];
  // <a href="/grinning-face/"><span class="category__emoji">😀</span>Grinning Face</a>
  const linkRe = /href="\/([a-z0-9-]+)\/"[^>]*><span class="category__emoji">([^<]+)<\/span>([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const slug      = m[1];
    const emojiChar = m[2].trim();
    const name      = m[3].trim();
    if (!name || !emojiChar) continue;
    const codepoint = toCodepoint(emojiChar);
    const filename  = `${slug}_${codepoint}.png`;
    items.push({ slug, name, emojiChar, codepoint, filename });
  }
  const seen = new Set();
  return items.filter(item => { if (seen.has(item.slug)) return false; seen.add(item.slug); return true; });
}

function parseRuNames(html) {
  // <a href="/ru/grinning-face/"><span class="category__emoji">😀</span>Широко улыбается</a>
  const map = {};
  const linkRe = /href="\/ru\/([a-z0-9-]+)\/"[^>]*><span class="category__emoji">([^<]+)<\/span>([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const slug   = m[1];
    const ruName = m[3].trim();
    if (slug && ruName) map[slug] = ruName;
  }
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  if (REBUILD) {
    console.log('REBUILD-ONLY mode — regenerating JSON from existing files\n');
    await rebuildManifest();
    return;
  }

  console.log(`Vendors: ${VENDORS.join(', ')}`);
  console.log(`Concurrent: ${CONCURRENT}`);
  if (DRY_RUN) console.log('DRY RUN — files will not be downloaded\n');

  const allCategories = [];
  let totalEmoji = 0;

  // Step 1: scrape category pages (EN + RU in parallel)
  for (const cat of CATEGORIES) {
    process.stdout.write(`Fetching category: ${cat.name}... `);
    const [html, ruHtml] = await Promise.all([
      fetchText(`https://emojigraph.org/${cat.slug}/`),
      fetchText(`https://emojigraph.org/ru/${cat.slug}/`),
    ]);
    const items  = parseEmojiList(html);
    const ruMap  = parseRuNames(ruHtml);
    for (const item of items) {
      item.ruName = ruMap[item.slug] || '';
    }
    console.log(`${items.length} emoji (${Object.keys(ruMap).length} RU names)`);
    allCategories.push({ ...cat, items });
    totalEmoji += items.length;
    await sleep(300);
  }

  console.log(`\nTotal: ${totalEmoji} emoji × ${VENDORS.length} vendors = ${totalEmoji * VENDORS.length} files\n`);

  if (DRY_RUN) {
    console.log('Sample URLs:');
    const sample = allCategories[0].items.slice(0, 3);
    for (const item of sample) {
      for (const v of VENDORS.slice(0, 2)) {
        console.log(`  https://emojigraph.org/media/${v}/${item.filename}`);
      }
    }
    return;
  }

  // Step 2: download images
  const tasks = [];
  for (const cat of allCategories) {
    for (const item of cat.items) {
      for (const vendor of VENDORS) {
        const url  = `https://emojigraph.org/media/${vendor}/${item.filename}`;
        const dest = path.join(PNGS_DIR, vendor, item.filename);
        tasks.push({ url, dest, vendor, item });
      }
    }
  }

  let done = 0, skipped = 0, errors = 0;
  const total = tasks.length;

  await withConcurrency(tasks, async (task) => {
    const result = await downloadFile(task.url, task.dest);
    if (result === 'ok')   done++;
    if (result === 'skip') skipped++;
    if (result === 'err')  errors++;
    const pct = Math.round(((done + skipped + errors) / total) * 100);
    process.stdout.write(`\r  ${pct}% — ${done} downloaded, ${skipped} skipped, ${errors} errors   `);
    await sleep(50);
  }, CONCURRENT);

  console.log('\n');

  // Step 3: build manifest
  buildJsonFiles(allCategories);
}

async function rebuildManifest() {
  const allCategories = [];

  for (const cat of CATEGORIES) {
    process.stdout.write(`Fetching RU names for: ${cat.name}... `);
    const [html, ruHtml] = await Promise.all([
      fetchText(`https://emojigraph.org/${cat.slug}/`),
      fetchText(`https://emojigraph.org/ru/${cat.slug}/`),
    ]);
    const items = parseEmojiList(html);
    const ruMap = parseRuNames(ruHtml);
    for (const item of items) {
      item.ruName = ruMap[item.slug] || '';
    }
    console.log(`${items.length} items, ${Object.keys(ruMap).length} RU names`);
    allCategories.push({ ...cat, items });
    await sleep(200);
  }

  buildJsonFiles(allCategories);
}

function buildJsonFiles(allCategories) {
  console.log('\nBuilding manifest...');
  fs.mkdirSync(path.join(EMOJI_DIR, 'categories'), { recursive: true });

  const primaryVendor = VENDORS[0];
  const otherVendors  = VENDORS.slice(1);
  const manifestCategories = [];

  for (const cat of allCategories) {
    if (cat.items.length === 0) continue;

    const catItems = cat.items.map(item => {
      const displayName = item.ruName || item.name;
      const tags = [
        item.emojiChar,
        item.name.toLowerCase(),
        item.ruName ? item.ruName.toLowerCase() : '',
      ].filter(Boolean).join(' ');

      const correctedFilename = FILENAME_CORRECTIONS[item.filename] || item.filename;

      const entry = {
        name:    displayName,
        tags,
        figma:   `Emoji/${item.name.replace(/\s+/g, '')}`,
        file:    `${primaryVendor}/${correctedFilename}`,
      };
      if (otherVendors.length > 0) {
        entry.variants = otherVendors.map(v => ({
          label: v.charAt(0).toUpperCase() + v.slice(1),
          file:  `${v}/${correctedFilename}`,
        }));
      }
      return entry;
    });

    const catFile = `categories/${cat.slug}.json`;
    fs.writeFileSync(
      path.join(EMOJI_DIR, catFile),
      JSON.stringify({ section: cat.name, items: catItems }, null, 2)
    );
    manifestCategories.push({ file: catFile });
    console.log(`  Wrote ${catFile} (${catItems.length} items)`);
  }

  // Merge custom.json — ручные добавления, не перезаписываются rebuild'ом
  const customPath = path.join(EMOJI_DIR, 'custom.json');
  if (fs.existsSync(customPath)) {
    const custom = JSON.parse(fs.readFileSync(customPath));
    for (const [slug, items] of Object.entries(custom)) {
      const catFile = `categories/${slug}.json`;
      const fullPath = path.join(EMOJI_DIR, catFile);
      // Мержим в конец существующего файла (дедупликация по file)
      if (fs.existsSync(fullPath)) {
        const existing = JSON.parse(fs.readFileSync(fullPath));
        const existingFiles = new Set(existing.items.map(i => i.file));
        const toAdd = items.filter(i => !existingFiles.has(i.file));
        for (const item of toAdd) {
          if (item.insertAfter) {
            const idx = existing.items.findIndex(i => i.file.includes(item.insertAfter));
            if (idx !== -1) { existing.items.splice(idx + 1, 0, item); continue; }
          }
          existing.items.push(item);
        }
        fs.writeFileSync(fullPath, JSON.stringify(existing, null, 2));
        console.log(`  Merged ${toAdd.length} custom items → ${catFile}`);
      }
    }
  }

  fs.writeFileSync(
    path.join(EMOJI_DIR, 'manifest.json'),
    JSON.stringify({ categories: manifestCategories }, null, 2)
  );
  console.log('\nDone! manifest.json updated.');
}

main().catch(err => { console.error(err); process.exit(1); });
