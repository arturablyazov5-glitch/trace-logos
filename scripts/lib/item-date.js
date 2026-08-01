/**
 * Shared "last modified" resolution for a logo item.
 *
 * Priority: item.dateModified (explicit override) → git log mtime of the
 * asset file → today (fallback for files git has no history for, e.g. new
 * additions in the same commit as this build).
 *
 * Used by build-seo-pages.js (per-page <time> + ImageObject.dateModified)
 * and build-sitemap.js (per-URL <lastmod>) — both must agree, otherwise the
 * page claims one update date while the sitemap advertises another.
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT       = path.resolve(__dirname, '..', '..');
const BUILD_DATE = new Date().toISOString().split('T')[0];

function assetExt(file) {
  return String(file || '').split('.').pop().toLowerCase();
}

// `git log` lists commits newest-first, so within one pass over one file's
// occurrences: the first line seen is the newest (last-modified) date, the
// last line seen is the oldest (first-added, i.e. "published") date.
function buildFileDateMaps() {
  try {
    const out = execSync(
      'git log --pretty=format:"%ad" --date=short --name-only -- assets/logos/svgs/ assets/logos/pngs/',
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    const modified = {}, published = {};
    let date = '';
    for (const line of out.split('\n')) {
      const t = line.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) { date = t; }
      else if (t && date) {
        if (!modified[t]) modified[t] = date;
        published[t] = date; // keeps being overwritten — last write wins = oldest commit
      }
    }
    return { modified, published };
  } catch { return { modified: {}, published: {} }; }
}

const { modified: FILE_MOD_MAP, published: FILE_PUBLISH_MAP } = buildFileDateMaps();

function itemDate(item) {
  if (item.dateModified) return item.dateModified;
  const ext = assetExt(item.file);
  const dir = ext === 'png' ? 'pngs' : 'svgs';
  return FILE_MOD_MAP[`assets/logos/${dir}/${item.file}`] || BUILD_DATE;
}

// Best-effort "first added" date — falls back to itemDate() (i.e. today) for
// files git has no history for, same as itemDate()'s own fallback.
function itemPublishedDate(item) {
  const ext = assetExt(item.file);
  const dir = ext === 'png' ? 'pngs' : 'svgs';
  return FILE_PUBLISH_MAP[`assets/logos/${dir}/${item.file}`] || itemDate(item);
}

module.exports = { itemDate, itemPublishedDate, assetExt, BUILD_DATE };
