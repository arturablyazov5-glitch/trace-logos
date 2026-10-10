#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// test-en-landings.js — английские версии продуктовых лендингов. Read-only.
//
// У каждого лендинга из scripts/lib/en-landings.js есть EN-пара
// tools/landing-en/<slug>.html; build-en-pages.js собирает из неё
// en/<путь RU>/index.html. Раньше /en/tools/… был копией русской страницы с
// переведённой шапкой — дубль в sitemap-en.xml без hreflang. Этот тест держит:
//
//   1. RU-страница лендинга есть.
//   2. EN-пара есть. Пока не все переведены — warning «нет EN-пары»
//      (по умолчанию фатально; --allow-missing делает warning), и остальные проверки лендинга пропускаются:
//      без пары EN-страница — заведомо русская копия.
//   3. Собранная EN-страница: <html lang="en">; <title> и <meta description>
//      непустые и без кириллицы; видимый текст <body> (без <script>/<style>/
//      комментариев) и атрибуты aria-label/alt/placeholder/title, а также
//      og:/twitter:-мета и текст JSON-LD — без кириллицы (кроме ALLOWED_CYRILLIC).
//   4. JSON-LD парсится; inLanguage, где указан, — en.
//   5. hreflang ru/en/x-default — в RU и в EN, одинаковый, с абсолютными URL
//      (формат hreflangBlock() из scripts/lib/en-transform.js), en-цель на диске.
//   6. canonical EN = https://trace-logos.ru/en/<путь>/.
//   7. FAQPage: вопросов в JSON-LD столько же, сколько видимых details>summary
//      (без «История изменений» / changelog).
//
// Запуск: node scripts/test-en-landings.js  (build-all.js: после build-en-pages.js)
//   --warn-only — только отчёт, без exit 1
//   --allow-missing — отсутствие EN-пары только warning (по умолчанию фатально)
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');
const { LANDINGS, pairRelFor, pairFileFor } = require('./lib/en-landings');
const { BASE_ORIGIN } = require('./lib/en-transform');

const ROOT      = path.resolve(__dirname, '..');
const WARN_ONLY = process.argv.includes('--warn-only');
// Все 9 EN-пар написаны, поэтому отсутствие пары фатально по умолчанию;
// --allow-missing возвращает прежнее мягкое поведение (warning) на время добавления нового лендинга.
const STRICT    = !process.argv.includes('--allow-missing');

// Кириллица, которая на EN-странице обязана остаться кириллицей (имена
// собственные площадок и т.п.). Точные подстроки; вырезаются перед проверкой.
// По умолчанию пусто — каждое исключение добавляется осознанно.
const ALLOWED_CYRILLIC = [];

const CYR = /[А-Яа-яЁё]/;

let errors = 0, warns = 0;
const fail = msg => { if (WARN_ONLY) { console.warn(`  ! ${msg}`); warns++; } else { console.error(`  ✗ ${msg}`); errors++; } };
const warn = msg => { console.warn(`  ! ${msg}`); warns++; };

const decode = s => s
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&hellip;/g, '…')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&');

const stripAllowed = s => ALLOWED_CYRILLIC.reduce((acc, a) => acc.split(a).join(''), s);

// Кириллические фразы (буквы + пробелы/цифры/пунктуация между ними) → фрагменты.
function cyrSnippets(text) {
  const t = stripAllowed(text).replace(/\s+/g, ' ');
  return [...t.matchAll(/[А-Яа-яЁё][А-Яа-яЁё\s\d.,:;!?«»"'()\u2010-\u2014-]*/g)]
    .map(m => m[0].trim())
    .map(h => (h.length > 60 ? `${h.slice(0, 60)}…` : h));
}

function reportCyr(at, where, text) {
  const hits = cyrSnippets(text);
  if (!hits.length) return;
  const shown = hits.slice(0, 5).map(h => `«${h}»`).join('; ');
  at(`кириллица в ${where}: ${shown}${hits.length > 5 ? ` …и ещё ${hits.length - 5}` : ''}`);
}

const attr = (html, re) => { const m = html.match(re); return m ? decode(m[1]).trim() : null; };

function hreflangs(html) {
  const out = {};
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/\brel="alternate"/i.test(tag)) continue;
    const lang = tag.match(/\bhreflang="([^"]*)"/i);
    const href = tag.match(/\bhref="([^"]*)"/i);
    if (lang && href) out[lang[1]] = href[1];
  }
  return out;
}

function jsonLdBlocks(html, at) {
  const blocks = [];
  for (const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { blocks.push(JSON.parse(m[1])); } catch (e) { at(`JSON-LD не парсится: ${e.message}`); }
  }
  return blocks;
}

// Обход всех объектов JSON-LD (включая @graph и вложенные).
function walkJson(node, fn) {
  if (Array.isArray(node)) { node.forEach(n => walkJson(n, fn)); return; }
  if (node && typeof node === 'object') { fn(node); Object.values(node).forEach(v => walkJson(v, fn)); }
}

// Видимые вопросы FAQ: details>summary в <body> (без <script>/<style>), кроме
// секций журнала версий — <section>, внутри которой маркер CHANGELOG:START
// (build-extension-zip.js). Признак — маркер, а не текст заголовка: он один на
// обоих языках. Поэтому html — с комментариями.
function visibleFaqSummaries(html) {
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  const body = (bodyMatch ? bodyMatch[1] : html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    // самые внутренние <section>…</section> с маркером журнала версий
    .replace(/<section\b(?:(?!<section\b)[\s\S])*?<\/section>/gi, sec => (/<!-- CHANGELOG:START -->/.test(sec) ? ' ' : sec))
    .replace(/<!--[\s\S]*?-->/g, ' ');
  return [...body.matchAll(/<details\b[^>]*>[\s\S]*?<summary\b/gi)].length;
}

function faqQuestionCount(blocks) {
  let n = null;
  walkJson(blocks, node => {
    if ([].concat(node['@type']).includes('FAQPage')) n = (n || 0) + [].concat(node.mainEntity || []).length;
  });
  return n;
}

function checkLanding({ relPath, slug }) {
  const dir     = relPath.replace(/index\.html$/, '');
  const ruUrl   = `${BASE_ORIGIN}/${dir}`;
  const enUrl   = `${BASE_ORIGIN}/en/${dir}`;
  const ruFile  = path.join(ROOT, relPath);
  const enRel   = `en/${relPath}`;
  const enFile  = path.join(ROOT, enRel);

  if (!fs.existsSync(ruFile)) { fail(`${relPath}: RU-страницы лендинга нет`); return; }
  if (!pairFileFor(relPath)) {
    const msg = `${relPath}: нет EN-пары ${pairRelFor(relPath)} — /en/${dir} остаётся русской копией`;
    if (STRICT) fail(msg); else warn(msg);
    return;
  }
  if (!fs.existsSync(enFile)) { fail(`${enRel}: EN-страница не собрана (build-en-pages.js)`); return; }

  const errorsBefore = errors + warns;
  const ru = fs.readFileSync(ruFile, 'utf8');
  const en = fs.readFileSync(enFile, 'utf8');
  const at = msg => fail(`${enRel}: ${msg}`);

  // 3. lang, title, description
  if (!/<html\b[^>]*\blang="en"/i.test(en)) at('нет <html lang="en">');
  const titles = [...en.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map(m => decode(m[1]).trim());
  if (titles.length !== 1 || !titles[0]) at(`<title>: ожидался ровно один непустой, найдено ${titles.length}`);
  else reportCyr(at, '<title>', titles[0]);
  const desc = attr(en, /<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!desc) at('нет непустого <meta name="description">');
  else reportCyr(at, '<meta description>', desc);

  // og:/twitter: — то, что покажут превью соцсетей.
  for (const m of en.matchAll(/<meta\s+(?:property|name)="((?:og|twitter):[^"]+)"\s+content="([^"]*)"/gi)) {
    reportCyr(at, `<meta ${m[1]}>`, decode(m[2]));
  }

  // 3. Видимый текст body и текстовые атрибуты.
  const bodyMatch = en.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  const body = (bodyMatch ? bodyMatch[1] : en)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  reportCyr(at, 'видимом тексте', decode(body.replace(/<[^>]+>/g, ' ')));
  for (const m of body.matchAll(/\s(aria-label|alt|placeholder|title)="([^"]*)"/gi)) {
    reportCyr(at, `атрибуте ${m[1]}`, decode(m[2]));
  }

  // 4. JSON-LD
  const blocks = jsonLdBlocks(en, at);
  walkJson(blocks, node => {
    if ('inLanguage' in node) {
      const langs = [].concat(node.inLanguage).map(String);
      if (!langs.every(l => /^en(?:-|$)/i.test(l))) at(`JSON-LD ${node['@type'] || ''}: inLanguage=${JSON.stringify(node.inLanguage)}, ожидался en`);
    }
  });
  reportCyr(at, 'JSON-LD', JSON.stringify(blocks));

  // 5. hreflang
  const expected = { ru: ruUrl, en: enUrl, 'x-default': ruUrl };
  for (const [label, html, file] of [['RU', ru, relPath], ['EN', en, enRel]]) {
    const alts = hreflangs(html);
    for (const [lang, href] of Object.entries(expected)) {
      if (alts[lang] !== href) fail(`${file}: hreflang="${lang}" ${alts[lang] ? `= ${alts[lang]}` : 'отсутствует'}, ожидалось ${href} (${label})`);
    }
  }
  if (!fs.existsSync(path.join(ROOT, 'en', dir, 'index.html'))) fail(`${relPath}: hreflang="en" ведёт на ${enUrl}, файла en/${dir}index.html нет`);

  // 6. canonical
  const canon = [...en.matchAll(/<link\s+rel="canonical"\s+href="([^"]*)"/gi)].map(m => m[1]);
  if (canon.length !== 1 || canon[0] !== enUrl) at(`canonical ${canon.length ? canon.join(', ') : 'отсутствует'}, ожидался ровно один ${enUrl}`);

  // 7. FAQPage ↔ видимые вопросы (RU и EN)
  // RU проверяется тем же правилом: пара переводит RU, расхождение там — тот же баг.
  for (const [html, file] of [[ru, relPath], [en, enRel]]) {
    const q = faqQuestionCount(jsonLdBlocks(html, msg => fail(`${file}: ${msg}`)));
    if (q === null) continue;
    const visible = visibleFaqSummaries(html);
    if (visible !== q) fail(`${file}: FAQPage — вопросов в JSON-LD ${q}, видимых details>summary ${visible} (без секции CHANGELOG)`);
  }

  if (errors + warns === errorsBefore) console.log(`  ✓ ${enRel} (EN-пара ${slug})`);
}

function main() {
  if (!LANDINGS.length) { console.error('✗ en-landings: SELF-CHECK — список лендингов пуст (scripts/lib/en-landings.js)'); process.exit(1); }
  for (const landing of LANDINGS) checkLanding(landing);
  const paired = LANDINGS.filter(l => pairFileFor(l.relPath)).length;

  console.log(`\n[en-landings] лендингов: ${LANDINGS.length}, с EN-парой: ${paired}${STRICT ? ' (strict)' : ''}`);
  if (warns)  console.warn(`${warns} предупреждений`);
  if (errors) { console.error(`\n✗ en-landings: ${errors} ошибок — сборка остановлена`); process.exit(1); }
  console.log('✓ en-landings: проверки пройдены');
}

main();
