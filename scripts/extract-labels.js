#!/usr/bin/env node
/**
 * One-off migration: pulls every literal variants[].label (+ label_en) out of
 * logos/categories/*.json into a shared dictionary, logos/labels.json, and
 * replaces the inline text with a "labelKey" pointer into that dictionary.
 *
 * Why: the same concept ("Old Icon", "Альтернатива", "Windows 7"...) was
 * typed out by hand on every variant that needed it, so near-duplicates
 * drifted apart with no way to see or fix them as one thing. This does NOT
 * rename/merge any label text (that's a separate follow-up) — it only moves
 * the existing strings into one file and points variants at them by key.
 *
 * Safe to re-run: variants that already carry `labelKey` are left alone, and
 * a label whose text already exists in labels.json reuses that key instead
 * of minting a new one.
 *
 * Usage: node scripts/extract-labels.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const TRANSLIT = {
  а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'e', ж:'zh', з:'z', и:'i',
  й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t',
  у:'u', ф:'f', х:'h', ц:'c', ч:'ch', ш:'sh', щ:'sch', ъ:'', ы:'y', ь:'',
  э:'e', ю:'yu', я:'ya',
};

function transliterate(str) {
  return str.toLowerCase().split('').map(ch => TRANSLIT[ch] ?? ch).join('');
}

function slugify(str) {
  return transliterate(str)
    .replace(/[«»"']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeKey(label, labelEn, used) {
  let base = slugify(labelEn || label) || 'label';
  let key = base;
  let n = 2;
  while (used.has(key)) {
    key = `${base}-${n}`;
    n++;
  }
  used.add(key);
  return key;
}

function loadCategoryFiles() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));
  return manifest.categories.map(cat => path.join(ROOT, 'logos', cat.file));
}

function main() {
  const files = loadCategoryFiles();

  // Pass 1: collect every unique label text -> {label, label_en}, build labels.json.
  const labels = {};
  const byText = new Map(); // label text -> key
  const usedKeys = new Set();

  const outPath = path.join(ROOT, 'logos', 'labels.json');
  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    for (const [key, entry] of Object.entries(existing)) {
      labels[key] = entry;
      byText.set(entry.label, key);
      usedKeys.add(key);
    }
  }

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const item of data.items || []) {
      for (const v of item.variants || []) {
        if (v.labelKey || v.label === undefined) continue;
        const existingKey = byText.get(v.label);
        if (existingKey) {
          // Fill in a missing label_en from a sibling variant sharing the same text.
          if (v.label_en && !labels[existingKey].label_en) {
            labels[existingKey].label_en = v.label_en;
          }
          continue;
        }
        const key = makeKey(v.label, v.label_en, usedKeys);
        labels[key] = v.label_en ? { label: v.label, label_en: v.label_en } : { label: v.label };
        byText.set(v.label, key);
      }
    }
  }

  const sortedLabels = Object.fromEntries(
    Object.keys(labels).sort().map(k => [k, labels[k]])
  );

  console.log(`labels.json: ${Object.keys(sortedLabels).length} unique labels`);
  if (!DRY_RUN) {
    fs.writeFileSync(outPath, JSON.stringify(sortedLabels, null, 2) + '\n');
  }

  // Pass 2: rewrite each category file, replacing label/label_en with labelKey.
  let touchedFiles = 0;
  let touchedVariants = 0;
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changed = false;
    for (const item of data.items || []) {
      for (const v of item.variants || []) {
        if (v.labelKey || v.label === undefined) continue;
        const key = byText.get(v.label);
        const rebuilt = {};
        for (const [k, val] of Object.entries(v)) {
          if (k === 'label') { rebuilt.labelKey = key; continue; }
          if (k === 'label_en') continue; // now lives in labels.json
          rebuilt[k] = val;
        }
        // Replace variant contents in place, preserving object identity.
        for (const k of Object.keys(v)) delete v[k];
        Object.assign(v, rebuilt);
        changed = true;
        touchedVariants++;
      }
    }
    if (changed) {
      touchedFiles++;
      if (!DRY_RUN) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
      }
    }
  }

  console.log(`${DRY_RUN ? '[dry-run] would touch' : 'touched'} ${touchedFiles} category files, ${touchedVariants} variants`);
}

main();
