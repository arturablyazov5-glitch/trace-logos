// counts.js — single source for catalog stats (logo/emoji totals) used across
// homepage marketing copy, OG images, and the Figma plugin promo assets.
// Reading these straight from the manifests instead of hardcoding them is
// what keeps "288 логотипов" from drifting away from the real catalog size.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function getLogoReadyCount() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));
  let total = 0;
  for (const cat of manifest.categories) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8'));
    total += data.items.filter(i => !i.comingSoon && i.file && i.file !== 'placeholder.svg').length;
  }
  return total;
}

function getLogoCategoryCount() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));
  return manifest.categories.length;
}

function getEmojiCount() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', 'manifest.json'), 'utf8'));
  let total = 0;
  for (const cat of manifest.categories) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', cat.file), 'utf8'));
    total += data.items.length;
  }
  return total;
}

module.exports = { getLogoReadyCount, getLogoCategoryCount, getEmojiCount };
