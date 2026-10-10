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
 * EN-пары продуктовых лендингов (tools/landing-en/<slug>.html, соглашение —
 * scripts/lib/en-landings.js) патчатся здесь же и тем же rel, что их
 * RU-страница: пара написана «по пути RU-страницы». Нет пары — молча мимо;
 * пара есть, а маркеров нет — ошибка (иначе EN-шапка тихо протухнет).
 *
 * Usage:
 *   node scripts/build-tools-headers.js            # patch all tools/*.html
 *   node scripts/build-tools-headers.js --dry-run  # report only
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');
const { pairFileFor, LANDINGS } = require('./lib/en-landings');

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
  { relPath: 'tools/extensions/tilda-helper/index.html', rel: '../../../' },
  { relPath: 'tools/extensions/taptop-helper/index.html', rel: '../../../' },
  { relPath: 'tools/extensions/trace-typograf/index.html', rel: '../../../' },
  { relPath: 'tools/figma-plugins/typograf/index.html', rel: '../../../' },
  { relPath: 'tools/figma-plugins/photo-editor/index.html', rel: '../../../' },
  { relPath: 'tools/figma-plugins/clean-layers/index.html', rel: '../../../' },
  { relPath: 'tools/figma-plugins/style-scanner/index.html', rel: '../../../' },
  { relPath: 'tools/figma-plugins/pdf-to-svg/index.html', rel: '../../../' },
];

const MARKER = (name) => new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);

function partial(name, rel) {
  return loadTemplate(path.join(ROOT, 'templates', 'partials', `${name}.html`)).trimEnd()
    .replace(/\{\{REL\}\}/g, rel).replace(/\{\{HOME_REL\}\}/g, rel);
}

// requireFooter: у RU-страницы подвал-маркеры опциональны (у инструмента может
// быть свой короткий подвал); у EN-пары они обязаны быть ровно там же, где у
// её RU-страницы, — чтобы EN не разъехался с RU молча.
function patchFile(filePath, label, rel, { requireFooter = false } = {}) {
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;

  if (!MARKER('HEADER').test(html)) {
    throw new Error(`${label}: не найдены маркеры HEADER:START/END`);
  }
  html = html.replace(MARKER('HEADER'), `$1\n${partial('nav-header', rel)}\n$2`);

  // Подвал — тот же приём и тот же принцип: единственный источник разметки
  // templates/partials/site-footer.html, страница получает его копию между
  // маркерами. Маркеры опциональны: у страницы-инструмента может быть свой
  // короткий подвал, тогда FOOTER:START/END в ней просто нет и шаг молчит.
  if (MARKER('FOOTER').test(html)) {
    html = html.replace(MARKER('FOOTER'), `$1\n${partial('site-footer', rel)}\n$2`);
  } else if (requireFooter) {
    throw new Error(`${label}: не найдены маркеры FOOTER:START/END (у RU-страницы они есть — EN-пара обязана их повторять)`);
  }

  if (html === before) return false;
  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

// Возвращает список изменённых файлов (rel от корня).
function patchPage({ relPath, rel }) {
  const changed = [];
  const ruFile = path.join(ROOT, relPath);
  if (patchFile(ruFile, relPath, rel)) changed.push(relPath);

  const pairFile = pairFileFor(relPath);
  if (pairFile) {
    const pairRel = path.relative(ROOT, pairFile).split(path.sep).join('/');
    const ruHasFooter = MARKER('FOOTER').test(fs.readFileSync(ruFile, 'utf8'));
    if (patchFile(pairFile, `${pairRel} (EN-пара ${relPath})`, rel, { requireFooter: ruHasFooter })) changed.push(pairRel);
  }
  return changed;
}

function main() {
  const missing = LANDINGS.filter(l => !PAGES.some(p => p.relPath === l.relPath)).map(l => l.relPath);
  if (missing.length) throw new Error(`лендинги из scripts/lib/en-landings.js без записи в PAGES: ${missing.join(', ')}`);
  let changed = 0;
  for (const page of PAGES) {
    for (const rel of patchPage(page)) {
      changed++;
      console.log(`  ${DRY_RUN ? '[dry-run] would patch' : '✓'} ${rel}`);
    }
  }
  console.log(`✓ tools/*.html — хедер обновлён (${changed} файлов; страниц ${PAGES.length} + их EN-пары)`);
}

main();
