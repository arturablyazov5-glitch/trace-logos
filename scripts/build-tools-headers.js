#!/usr/bin/env node
/**
 * Patches the shared header into tools/*.html — hand-written static pages
 * (no build pipeline / no JSON manifest, unlike logos/emoji/blog). Same
 * pattern as patchHomepageHeader() in build-home-sitemap.js: single source
 * of truth is templates/partials/nav-header.html, expanded here and spliced
 * between HEADER:START/END markers because these pages can't use {{> }}
 * directly. Edit the header ONLY in the partial, never in these files.
 *
 * en/tools/*.html are NOT touched here — they're auto-generated from these
 * RU sources by build-en-pages.js (generic transformToEn pass, using the
 * partial's data-i18n attributes).
 *
 * Usage:
 *   node scripts/build-tools-headers.js            # patch all tools/*.html
 *   node scripts/build-tools-headers.js --dry-run  # report only
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');

const ROOT     = path.resolve(__dirname, '..');
const DRY_RUN  = process.argv.includes('--dry-run');

// relPath → depth from repo root (used to resolve {{REL}}/{{HOME_REL}})
const PAGES = [
  { relPath: 'tools/index.html',                  rel: '../' },
  { relPath: 'tools/compress-webp/index.html',     rel: '../../' },
  { relPath: 'tools/edit-image/index.html',        rel: '../../' },
  { relPath: 'tools/ios-call-screen/index.html',   rel: '../../' },
  { relPath: 'tools/merge-pdf/index.html',         rel: '../../' },
  { relPath: 'tools/watermark/index.html',         rel: '../../' },
  { relPath: 'tools/extensions/reviews-exporter/index.html', rel: '../../../' },
];

function patchPage({ relPath, rel }) {
  const filePath = path.join(ROOT, relPath);
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;

  let header = loadTemplate(path.join(ROOT, 'templates', 'partials', 'nav-header.html')).trimEnd();
  header = header.replace(/\{\{REL\}\}/g, rel).replace(/\{\{HOME_REL\}\}/g, rel);

  if (!/<!-- HEADER:START -->[\s\S]*?<!-- HEADER:END -->/.test(html)) {
    throw new Error(`${relPath}: не найдены маркеры HEADER:START/END`);
  }

  html = html.replace(
    /(<!-- HEADER:START -->)[\s\S]*?(<!-- HEADER:END -->)/,
    `$1\n${header}\n$2`
  );

  // Подвал — тот же приём и тот же принцип: единственный источник разметки
  // templates/partials/site-footer.html, страница получает его копию между
  // маркерами. Маркеры опциональны: у страницы-инструмента может быть свой
  // короткий подвал, тогда FOOTER:START/END в ней просто нет и шаг молчит.
  if (/<!-- FOOTER:START -->[\s\S]*?<!-- FOOTER:END -->/.test(html)) {
    let footer = loadTemplate(path.join(ROOT, 'templates', 'partials', 'site-footer.html')).trimEnd();
    footer = footer.replace(/\{\{REL\}\}/g, rel).replace(/\{\{HOME_REL\}\}/g, rel);
    html = html.replace(
      /(<!-- FOOTER:START -->)[\s\S]*?(<!-- FOOTER:END -->)/,
      `$1\n${footer}\n$2`
    );
  }

  if (html === before) return false;
  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

function main() {
  let changed = 0;
  for (const page of PAGES) {
    if (patchPage(page)) {
      changed++;
      console.log(`  ${DRY_RUN ? '[dry-run] would patch' : '✓'} ${page.relPath}`);
    }
  }
  console.log(`✓ tools/*.html — хедер обновлён (${changed}/${PAGES.length})`);
}

main();
