/**
 * Shared catalog-date resolution for a logo item.
 *
 * `dateAdded` and optional `dateModified` in logos/categories/*.json are the
 * sole sources of truth. Build output must never depend on Git availability,
 * file timestamps or the day on which a builder happened to run.
 *
 * Used by build-seo-pages.js (visible metadata + structured data) and
 * build-sitemap.js (per-URL <lastmod>), so every generated surface agrees.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assetExt(file) {
  return String(file || '').split('.').pop().toLowerCase();
}

function itemDate(item) {
  if (item.dateModified !== undefined) {
    if (ISO_DATE_RE.test(item.dateModified || '')) return item.dateModified;
    throw new Error(`Logo ${item.figma || item.name || item.file || '(unknown)'} has invalid dateModified`);
  }
  return itemPublishedDate(item);
}

function itemPublishedDate(item) {
  if (ISO_DATE_RE.test(item.dateAdded || '')) return item.dateAdded;
  throw new Error(`Logo ${item.figma || item.name || item.file || '(unknown)'} has no valid dateAdded`);
}

module.exports = { itemDate, itemPublishedDate, assetExt };
