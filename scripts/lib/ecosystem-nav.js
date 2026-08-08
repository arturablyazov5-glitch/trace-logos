// Generates the ECOSYSTEMS block that scripts/build-ecosystem-nav.js writes into
// js/data.js, and that scripts/test-ecosystem-sync.js verifies is up to date.
// Shared so the generator and its test can never drift from each other — only
// from logos/ecosystems.json, which is exactly the drift we want caught.
'use strict';

function keyLiteral(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : `'${key}'`;
}

function jsStr(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function alignedBlock(entries) {
  const width = Math.max(...entries.map(([k]) => `${keyLiteral(k)}:`.length));
  return entries
    .map(([k, v]) => `  ${(`${keyLiteral(k)}:`).padEnd(width)} ${jsStr(v)},`)
    .join('\n');
}

// entries: [key, ecoDef][] in the order they appear in logos/ecosystems.json —
// object insertion order is preserved by JSON.parse, and reusing it keeps the
// generated file's ordering stable (minimal diffs on unrelated edits).
function generateEcosystemsBlock(ecosystems) {
  const entries = Object.entries(ecosystems);

  const logoMap = entries.filter(([, e]) => e.icon).map(([k, e]) => [k, e.icon]);

  const labels = entries.map(([k, e]) => [k, (e.navLabel && e.navLabel.ru) || e.ru]);

  // English label omitted when it's identical to the Russian one (brand names
  // already in Latin script, e.g. Google/Apple) — matches the source file's
  // existing convention, kept here so the generator doesn't grow the block.
  const labelsEn = entries
    .filter(([, e]) => {
      const en = (e.navLabel && e.navLabel.en) || e.en;
      const ru = (e.navLabel && e.navLabel.ru) || e.ru;
      return en !== ru;
    })
    .map(([k, e]) => [k, (e.navLabel && e.navLabel.en) || e.en]);

  const sectionLabels = entries
    .filter(([, e]) => e.sectionLabel)
    .map(([k, e]) => [k, e.sectionLabel.ru]);

  const sectionLabelsEn = entries
    .filter(([, e]) => e.sectionLabel)
    .map(([k, e]) => [k, e.sectionLabel.en]);

  return `export const ecosystemLogoMap = {
${alignedBlock(logoMap)}
};

export const ecosystemLabels = {
${alignedBlock(labels)}
};

export const ecosystemLabelsEn = {
${alignedBlock(labelsEn)}
};

// Custom caption for the detail-panel ecosystem section, when the plain
// ecosystem name (above) reads oddly without an "Экосистема" prefix —
// e.g. a design studio isn't itself a "logo ecosystem" like Yandex or Sber.
export const ecosystemSectionLabels = {
${alignedBlock(sectionLabels)}
};

export const ecosystemSectionLabelsEn = {
${alignedBlock(sectionLabelsEn)}
};`;
}

module.exports = { generateEcosystemsBlock };
