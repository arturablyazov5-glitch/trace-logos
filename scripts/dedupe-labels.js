#!/usr/bin/env node
/**
 * One-off cleanup pass over logos/labels.json, run after extract-labels.js.
 *
 * Two kinds of fixes, both mechanical (no new translations invented beyond
 * what's listed below, all reviewed by hand):
 *
 *  1. MERGES — keys that mean the same thing but got split by language or by
 *     a near-duplicate string during extraction (e.g. "alternativa"/"Альтернатива"
 *     vs "alternative"/"Alternative", or "Старая иконка"/"Old Icon" vs a second
 *     "old-icon-2" that only had the English half). Re-points every variant's
 *     labelKey from the loser to the winner, then drops the loser from
 *     labels.json.
 *
 *  2. FILLS — a key that's missing label_en (Russian-only) or missing a
 *     Russian label (English-only) where the missing half is an unambiguous,
 *     short UI word. Anything where the right translation isn't obvious from
 *     the label text alone (Figma product names, ambiguous short words like
 *     "Detail"/"Form"/"Group") is left untouched on purpose — see the report
 *     printed at the end.
 *
 * Usage: node scripts/dedupe-labels.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const MERGES = {
  // loser key -> { winner, label, label_en }
  'alternativa':  { winner: 'alternative',   label: 'Альтернатива',   label_en: 'Alternative' },
  'old-icon-2':   { winner: 'old-icon',      label: 'Старая иконка',  label_en: 'Old Icon' },
  'old-logo-2':   { winner: 'old-logo',      label: 'Старый логотип', label_en: 'Old Logo' },
  // "старая иконка" / "старый логотип" were kept as two concepts (icon-only
  // vs full lockup) — user asked to collapse them into one: "старый логотип".
  'old-icon':     { winner: 'old-logo',      label: 'Старый логотип', label_en: 'Old Logo' },
  // Bare-year variants — no need for a "старый"/"old" qualifier, just the year.
  'old-2025':     { winner: '2025',          label: '2025' },
  'png-2026':     { winner: '2026',          label: '2026' },
  // "Litres"/"Litres Abonement" are just the EN-lettering variant of the same
  // Cyrillic logo — same concept as Yandex's bare "EN" marker.
  'litres':           { winner: 'en', label: 'EN' },
  'litres-abonement': { winner: 'en', label: 'EN' },
  'broken-2026':      { winner: '2026', label: '2026' },
  // "Доп."/"Alt." was a separate abbreviated form of the same "Alternative" concept.
  'alt':              { winner: 'alternative', label: 'Альтернатива', label_en: 'Alternative' },
  // "Detail"/"Detail Full" were the same "детальный" concept split by shape (icon vs wide lockup).
  'detail-full':      { winner: 'detail', label: 'Детальный', label_en: 'Detail' },
};

// Winner keys not covered by a merge above, but still needing a translated
// label/label_en filled in (both sides already agree, just incomplete).
const FILLS = {
  'alternative-2':    { label: 'Альтернатива 2',      label_en: 'Alternative 2' },
  'avto':             { label_en: 'Auto' },
  'biznes':           { label_en: 'Business' },
  'klassicheskiy':    { label_en: 'Classic' },
  'krupnyy':          { label_en: 'Large' },
  'uspeh':            { label_en: 'Success' },
  'vertikalnyy':      { label_en: 'Vertical' },
  'reklama':          { label_en: 'Ad' },
  'promo':            { label_en: 'Promo' },
  'kartochka-svetlaya': { label_en: 'Light Card' },
  'kartochka-temnaya':  { label_en: 'Dark Card' },
  '3d-logo':          { label: '3D-логотип', label_en: '3D Logo' },
  '2009-alternative':    { label: '2009 Альтернативный',    label_en: '2009 Alternative' },
  '2009-alternative-2':  { label: '2009 Альтернативный 2',  label_en: '2009 Alternative 2' },
  '2009-alternative-en': { label: '2009 Альтернативный EN', label_en: '2009 Alternative EN' },
  // Generic design/style words, confirmed by checking what they sit next to
  // on their item (contrasted with a primary/mono/wide sibling variant).
  'white':       { label: 'Белый', label_en: 'White' },               // Claude, vs the colored primary mark
  'text':        { label: 'Текстовый', label_en: 'Text' },            // GigaChat, text-only wordmark
  'short':       { label: 'Короткий', label_en: 'Short' },            // Yandex AI Studio, shortened wordmark
  'stroke':      { label: 'Обводка', label_en: 'Stroke' },            // Google Fonts, outlined style
  'minimal':     { label: 'Минималистичный', label_en: 'Minimal' },   // Reddit, simplified mark
  'form':        { label: 'Форма', label_en: 'Form' },                // Reddit, abstract shape-only mark
  'group':       { label: 'Группа', label_en: 'Group' },              // HiTech, holding-company sub-brand
  'computer':    { label: 'Десктоп', label_en: 'Computer' },          // Perplexity, desktop-app icon
  'detail':      { label: 'Детальный', label_en: 'Detail' },          // Золотое яблоко — desc says "детальный вариант"
  'color':       { label: 'Цветной', label_en: 'Color' },             // Messenger, vs its flat/mono primary
  // Product/feature names — user asked to translate these too rather than
  // leave in English, despite being brand-specific (Figma/Telegram/Duolingo).
  'design':              { label: 'Дизайн', label_en: 'Design' },                 // Figma
  'premium':             { label: 'Премиум', label_en: 'Premium' },               // Telegram
  'huff':                { label: 'Обида', label_en: 'Huff' },                    // Duolingo mascot mood
  'portrait':            { label: 'Портретный', label_en: 'Portrait' },           // Duolingo orientation
  'reaction-angry':      { label: 'Реакция: Злость', label_en: 'Reaction: Angry' },
  'reaction-sunglasses': { label: 'Реакция: Крутые очки', label_en: 'Reaction: Sunglasses' },
  'streak-saver':        { label: 'Спасатель стрика', label_en: 'Streak Saver' },
  'streak-saver-2':      { label: 'Спасатель стрика 2', label_en: 'Streak Saver 2' },
  'streak-saver-3':      { label: 'Спасатель стрика 3', label_en: 'Streak Saver 3' },
  'streak-saver-4':      { label: 'Спасатель стрика 4', label_en: 'Streak Saver 4' },
  'streak-saver-5':      { label: 'Спасатель стрика 5', label_en: 'Streak Saver 5' },
  'streak-saver-6':      { label: 'Спасатель стрика 6', label_en: 'Streak Saver 6' },
  'streak-saver-7':      { label: 'Спасатель стрика 7', label_en: 'Streak Saver 7' },
  'pre-streak-saver-3':  { label: 'Пред-спасатель стрика 3', label_en: 'Pre-Streak Saver 3' },
  'pre-streak-saver-4':  { label: 'Пред-спасатель стрика 4', label_en: 'Pre-Streak Saver 4' },
  'pre-streak-saver-5':  { label: 'Пред-спасатель стрика 5', label_en: 'Pre-Streak Saver 5' },
  'pre-streak-saver-6':  { label: 'Пред-спасатель стрика 6', label_en: 'Pre-Streak Saver 6' },
  'pre-streak-saver-7':  { label: 'Пред-спасатель стрика 7', label_en: 'Pre-Streak Saver 7' },
  'pre-streak-saver-8':  { label: 'Пред-спасатель стрика 8', label_en: 'Pre-Streak Saver 8' },
  'pre-streak-saver-9':  { label: 'Пред-спасатель стрика 9', label_en: 'Pre-Streak Saver 9' },
  'streak-frozen-1':     { label: 'Замороженный стрик 1', label_en: 'Streak Frozen 1' },
  'streak-frozen-2':     { label: 'Замороженный стрик 2', label_en: 'Streak Frozen 2' },
  'streak-frozen-3':     { label: 'Замороженный стрик 3', label_en: 'Streak Frozen 3' },
  'streak-repair-1':     { label: 'Восстановление стрика 1', label_en: 'Streak Repair 1' },
  'streak-repair-2':     { label: 'Восстановление стрика 2', label_en: 'Streak Repair 2' },
  'streak-repair-3':     { label: 'Восстановление стрика 3', label_en: 'Streak Repair 3' },
};

// Left untouched — proper nouns (app names/versions) with no real translation,
// or ones the user confirmed should stay English:
//  - link: Stripe's own product name ("Stripe Link")
//  - telegram-lite/telegram-x-2019: literal app-version names
//  - twitter, cs-go: former official names of X and Counter-Strike 2
//  - amongus, gta-vi-2026, tblocks, telecom-en: game/product proper nouns
//  - yandex-art/yandex-gpt: Yandex's own AI product names
//  - outline-icon/dev-mode: Figma's own product names (siblings of
//    FigJam/Figma Slides/Figma Buzz, already left in English)
//  - extended/spa/max-avatar/unhinged-*: remaining Duolingo meme-mascot names
//    not covered by the FILLS translations above
const LEFT_AMBIGUOUS = [
  'flatten-full', // Monopoly — technical export-state term ("flattened" SVG), not a display concept
];

function loadCategoryFiles() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));
  return manifest.categories.map(cat => path.join(ROOT, 'logos', cat.file));
}

function main() {
  const labelsPath = path.join(ROOT, 'logos', 'labels.json');
  const labels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

  for (const [loser, { winner, label, label_en }] of Object.entries(MERGES)) {
    const loserExists = loser in labels;
    if (!loserExists && !(winner in labels)) { console.warn(`merge: neither "${loser}" nor "${winner}" found, skipping`); continue; }
    labels[winner] = label_en ? { label, label_en } : { label };
    if (loserExists && loser !== winner) delete labels[loser];
  }

  for (const [key, patch] of Object.entries(FILLS)) {
    if (!(key in labels)) { console.warn(`fill: key "${key}" not found, skipping`); continue; }
    labels[key] = { ...labels[key], ...patch };
  }

  const sorted = Object.fromEntries(Object.keys(labels).sort().map(k => [k, labels[k]]));
  if (!DRY_RUN) fs.writeFileSync(labelsPath, JSON.stringify(sorted, null, 2) + '\n');

  const files = loadCategoryFiles();
  let repointed = 0;
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changed = false;
    for (const item of data.items || []) {
      for (const v of item.variants || []) {
        if (v.labelKey && MERGES[v.labelKey]) {
          v.labelKey = MERGES[v.labelKey].winner;
          changed = true;
          repointed++;
        }
      }
    }
    if (changed && !DRY_RUN) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  }

  console.log(`${DRY_RUN ? '[dry-run] would merge' : 'merged'} ${Object.keys(MERGES).length} duplicate keys, repointed ${repointed} variant(s)`);
  console.log(`${DRY_RUN ? '[dry-run] would fill' : 'filled'} ${Object.keys(FILLS).length} incomplete entries`);
  console.log(`\nLeft as-is (English-only, needs a human call on translation):`);
  for (const k of LEFT_AMBIGUOUS) {
    if (labels[k]) console.log(`  ${k.padEnd(16)} "${labels[k].label}"`);
  }
}

main();
