// Build-time pre-rendered card grid («SSR» for the static site) injected into
// #content of /logos/ and category pages.
//
// Why: the live grid is built by main.js, and Yandex renders JS poorly — the
// crawler used to see an empty catalog. This module emits the SAME markup the
// JS grid produces (same classes → pixel-identical), except each card is a
// real <a href="/logos/<cat>/<slug>/"> link. main.js removes the whole
// .ssr-grid wrapper before building the live grid, so users never interact
// with the static copy — it exists for crawlers and the first paint.
//
// Keep the card markup in sync with buildCard() in js/main.js (classes: card,
// icon-wrap, label, card-path; img: 48×48 lazy, .prerendered for PNG).

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// Same cache-buster the runtime appends (js/utils.js svgUrl/previewUrl) — the
// static <img> must hit the same cache entry as the live grid, or every asset
// downloads twice.
const ASSET_VERSION = (() => {
  try {
    return fs.readFileSync(path.join(ROOT, 'js', 'version.js'), 'utf8')
      .match(/ASSET_VERSION\s*=\s*'([^']+)'/)[1];
  } catch { return ''; }
})();

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Mirrors js/utils.js svgUrl()/previewUrl(): PNG logos use the lightweight
// WebP preview when it exists, SVG logos load the SVG directly.
function imgSrc(file, assetBase) {
  const v = ASSET_VERSION ? `?v=${ASSET_VERSION}` : '';
  if (file.startsWith('/')) return `${file}${v}`;
  if (file.endsWith('.png')) {
    const webp = file.replace(/\.png$/, '.webp');
    if (fs.existsSync(path.join(ROOT, 'assets', 'logos', 'previews', webp))) {
      return `${assetBase}assets/logos/previews/${webp}${v}`;
    }
    return `${assetBase}assets/logos/pngs/${file}${v}`;
  }
  return `${assetBase}assets/logos/svgs/${file}${v}`;
}

function card(item, { assetBase, hrefFor, lang }) {
  const href = hrefFor(item);
  if (!href) return '';
  const en   = lang === 'en';
  const name = en ? (item.name_en || item.name) : item.name;
  const alt  = en ? `Logo ${name}` : `Логотип ${name}`;
  // Mirrors buildCard() in js/main.js: `thumb` overrides the grid thumbnail
  // only, so a brand with no official square mark still gets a square tile
  // while `file` stays the real (horizontal) primary everywhere else.
  const thumbFile = item.thumb || item.file;
  const png  = thumbFile.endsWith('.png');
  return `<a class="card" href="${href}">` +
    `<div class="icon-wrap"><img src="${imgSrc(thumbFile, assetBase)}" width="48" height="48" loading="lazy" decoding="async"${png ? ' class="prerendered"' : ''} alt="${esc(alt)}" title="${esc(item.figma)}"></div>` +
    `<div class="label">${esc(name)}</div>` +
    `<div class="card-path">${esc(item.figma)}</div>` +
    `</a>`;
}

/**
 * sections: [{ label, heading ('h1'|'h2'), titleAttrs (extra attrs string), items }]
 * assetBase: prefix for asset URLs ('../../', '/', '../', …)
 * hrefFor:  item → href (or null to skip); caller controls RU//en/relative form
 * lang:     'ru' | 'en'
 */
function buildStaticGrid(sections, { assetBase, hrefFor, lang = 'ru' }) {
  const parts = sections.map(({ label, heading = 'h2', titleAttrs = '', items }) => {
    const ready = items.filter(i => !i.comingSoon && i.file && i.file !== 'placeholder.svg');
    const cards = ready.map(i => card(i, { assetBase, hrefFor, lang })).filter(Boolean);
    if (!cards.length) return '';
    return `<div class="section">` +
      `<${heading} class="section-title"${titleAttrs ? ' ' + titleAttrs : ''}>${esc(label)}</${heading}>` +
      `<div class="grid">${cards.join('')}</div>` +
      `</div>`;
  }).filter(Boolean);
  if (!parts.length) return '';
  return `<div class="ssr-grid">${parts.join('\n')}</div>`;
}

module.exports = { buildStaticGrid };
