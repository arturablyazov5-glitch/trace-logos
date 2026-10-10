// ─────────────────────────────────────────────────────────────────────────────
// en-landings.js — ЕДИНСТВЕННОЕ место соглашения «RU-лендинг ↔ EN-пара».
//
// Продуктовые лендинги (tools/extensions/<slug>/, tools/figma-plugins/<slug>/)
// рукописные, data-i18n у них только в шапке/подвале. Чтобы /en/ не отдавал
// русский текст, у лендинга есть «EN-пара» — полностью переведённый HTML
// tools/landing-en/<slug>.html, написанный «как будто лежит по пути
// RU-страницы» (те же относительные пути ../../../css/…).
//
// Кто читает пару: build-tools-headers.js (шапка/подвал из партиалов),
// build-extension-zip.js (VERSION/CHANGELOG), build-en-pages.js (основа
// en/<путь RU>/index.html), test-en-landings.js. Больше НИКТО: пара — не
// страница сайта; обходчики *.html пропускают каталог PAIR_DIR_NAME.
//
// Новый лендинг: добавь строку в LANDINGS, положи пару — всё остальное
// (сборка, хедер, тест, sitemap) берёт список отсюда.
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

const PAIR_DIR_NAME = 'landing-en';
const PAIR_DIR      = `tools/${PAIR_DIR_NAME}`;

// RU-путь лендинга (от корня репозитория). slug пары = последний сегмент пути.
// Порядок = порядок в sitemap-pages.xml (build-sitemap.js берёт список отсюда).
const LANDINGS = [
  'tools/extensions/reviews-exporter/index.html',
  'tools/extensions/tilda-helper/index.html',
  'tools/extensions/taptop-helper/index.html',
  'tools/extensions/trace-typograf/index.html',
  'tools/figma-plugins/typograf/index.html',
  'tools/figma-plugins/photo-editor/index.html',
  'tools/figma-plugins/clean-layers/index.html',
  'tools/figma-plugins/style-scanner/index.html',
  'tools/figma-plugins/pdf-to-svg/index.html',
].map(relPath => ({ relPath, slug: relPath.split('/').slice(-2, -1)[0] }));

const BY_REL = new Map(LANDINGS.map(l => [l.relPath, l]));

// RU relPath → relPath пары (или null, если страница не лендинг из списка).
// Существование файла не проверяет — для этого pairFileFor().
function pairRelFor(relPath) {
  const l = BY_REL.get(relPath);
  return l ? `${PAIR_DIR}/${l.slug}.html` : null;
}

// RU relPath → абсолютный путь существующей пары, иначе null.
function pairFileFor(relPath) {
  const rel = pairRelFor(relPath);
  if (!rel) return null;
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? abs : null;
}

// rel-путь (от корня, с '/' или path.sep) лежит в каталоге пар.
function isPairPath(rel) {
  const p = String(rel).split(path.sep).join('/');
  return p === PAIR_DIR || p.startsWith(`${PAIR_DIR}/`);
}

module.exports = { PAIR_DIR_NAME, PAIR_DIR, LANDINGS, pairRelFor, pairFileFor, isPairPath };
