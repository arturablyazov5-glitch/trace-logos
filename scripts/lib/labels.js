/**
 * Shared resolver for variants[].labelKey -> the dictionary in logos/labels.json.
 * Call resolveCategoryLabels() right after reading a category JSON file and
 * before any other code looks at v.label/v.label_en — every downstream
 * consumer (build-seo-pages, build-api-json, build-cdn, build-blog) keeps
 * reading v.label/v.label_en exactly as before.
 */
const fs = require('fs');
const path = require('path');

let _labels = null;

function loadLabelsMap(root) {
  if (_labels) return _labels;
  const p = path.join(root, 'logos', 'labels.json');
  _labels = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
  return _labels;
}

function resolveCategoryLabels(data, root) {
  const labels = loadLabelsMap(root);
  for (const item of data.items || []) {
    for (const v of item.variants || []) {
      if (!v.labelKey) continue;
      const entry = labels[v.labelKey];
      if (!entry) throw new Error(`Unknown labelKey "${v.labelKey}" (item "${item.name}") — not found in logos/labels.json`);
      v.label = entry.label;
      if (entry.label_en) v.label_en = entry.label_en;
    }
  }
  return data;
}

module.exports = { loadLabelsMap, resolveCategoryLabels };
