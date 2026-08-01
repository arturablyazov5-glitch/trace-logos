// Фирменные цвета логотипа, извлечённые из исходного SVG.
//
// Источник истины — сам SVG-файл (тот же принцип, что и в рантайме: цвета
// всегда выводятся из разметки, а не из отдельного поля в JSON, которое можно
// забыть обновить). Общий модуль для двух потребителей:
//   • build-seo-pages.js — блок «Цвета бренда» на странице логотипа
//   • build-blog.js      — виджет `:::widget logo-colors` в статьях
// Держать копию логики в каждом из них означало бы, что палитра в статье
// однажды разойдётся с палитрой на странице того же логотипа.

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function assetExt(file) { return String(file || '').split('.').pop().toLowerCase(); }

/**
 * @param {object} item — элемент каталога (logos/categories/*.json)
 * @returns {string[]} до 6 hex-цветов, самые частые в файле первыми
 */
function extractBrandColors(item) {
  const primaryExt = assetExt(item.file);
  const svgFile = primaryExt === 'svg'
    ? item.file
    : (item.variants || []).find(v => assetExt(v.file) === 'svg')?.file;
  if (!svgFile) return [];

  let svg;
  try { svg = fs.readFileSync(path.join(ROOT, 'assets', 'logos', 'svgs', svgFile), 'utf8'); }
  catch { return []; }

  const counts = new Map();
  const add = h => { h = h.toLowerCase(); counts.set(h, (counts.get(h) || 0) + 1); };

  for (const m of svg.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g)) {
    let h = m[1];
    if (h.length === 8) h = h.slice(0, 6);            // strip alpha
    else if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length === 6) add('#' + h);
  }
  for (const m of svg.matchAll(/rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/gi)) {
    add('#' + [m[1], m[2], m[3]].map(n => Math.min(255, +n).toString(16).padStart(2, '0')).join(''));
  }

  // Most frequent first; drop pure white (usually background / negative space).
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0])
    .filter(c => c !== '#ffffff')
    .slice(0, 6);
}

/**
 * @param {string} hex — "#rrggbb"
 * @returns {string} "R, G, B" — same components CSS rgb() and print/CMYK
 * conversion tools expect as input, without the model deciding what a
 * "printable" color format looks like.
 */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

module.exports = { extractBrandColors, hexToRgb };
