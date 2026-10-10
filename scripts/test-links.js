#!/usr/bin/env node
/**
 * Проверка внутренних ссылок в СГЕНЕРЁННОМ HTML. Read-only, ничего не пишет.
 *
 * Проверяет ВСЕ внутренние href/src/content-ссылки в готовом HTML — и на
 * страницы, и на ассеты (svg/png/webp/css/js/…) — тем, что реально лежит
 * на диске после сборки. test-data.js проверяет другой слой: что file/
 * variants[].file в ИСХОДНОМ JSON резолвятся в реальные ассеты. Здесь же
 * проверяется РЕЗУЛЬТАТ рендеринга — путь, который билд-скрипт фактически
 * записал в HTML, мог быть искажён (лишний префикс, не тот rel, опечатка
 * в шаблоне) даже если сам ассет на диске в порядке.
 *
 * Ловит, например:
 *   • about-текст ссылается на /logos/ecosystem/<key>/, а страницы нет
 *   • перекрёстная ссылка на /logos/<cat>/<slug>/ с опечаткой в слаге
 *   • canonical / og:image указывает на удалённую страницу или картинку
 *   • билд-скрипт EN-зеркала подставляет /en/ в путь ассета (assets/ не
 *     зеркалируется под /en/ — .../en/assets/... всегда 404)
 *
 * Резолв ссылок:
 *   • внешние (http(s):// на чужой домен), //, #, mailto:/tel:/data:/js:  — пропуск
 *   • https://trace-logos.ru/<x>  → <ROOT>/<x>   (внутренний абсолют по домену)
 *   • /<x>                        → <ROOT>/<x>   (корне-абсолютный путь)
 *   • ../<x>, <x>                 → относительно папки самой страницы
 *   • ?query и #hash отбрасываются; %XX декодируется; путь на "/" → index.html
 *
 * Любая битая внутренняя ссылка = ошибка (exit 1), как в test-data.js.
 * Исключение по запросу пользователя: badge-dark.svg — только предупреждение.
 *
 * Флаги: --warn-only (все находки как предупреждения, без exit 1), --dry-run (игнор).
 *
 * Usage:
 *   node scripts/test-links.js
 *   node scripts/test-links.js --warn-only
 */

const fs = require('fs');
const path = require('path');
const { PAIR_DIR_NAME } = require('./lib/en-landings');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const WARN_ONLY = argv.includes('--warn-only');

const SITE_ORIGIN = 'trace-logos.ru'; // внутренний прод-домен

// Каталоги, куда не заходим: служебное, шаблоны с {{...}}, чужие зеркала.
const PRUNE_DIRS = new Set([
  'node_modules', '.git', '.claude', 'cdn-dist', 'templates',
  'figma-plugins', 'supabase', 'sanitizer', 'upptime', 'trace-typograf',
  PAIR_DIR_NAME, // tools/landing-en/ — EN-пары лендингов, не страницы (scripts/lib/en-landings.js)
]);

// По явному запросу пользователя отсутствие тёмного бейджа партнёрства
// не блокирует сборку. Остальные отсутствующие цели остаются ошибками.
const isSoftWarn = (siteAbs) => siteAbs === '/assets/partnership/badge-dark.svg';

// Кэш "существует ли цель на диске" — одну и ту же ссылку резолвим сотни раз.
const existsCache = new Map();
function targetExists(absPath) {
  if (existsCache.has(absPath)) return existsCache.get(absPath);
  let ok;
  try {
    const st = fs.statSync(absPath);
    // Путь-директория валиден только если внутри есть index.html.
    ok = st.isDirectory() ? fs.existsSync(path.join(absPath, 'index.html')) : true;
  } catch {
    ok = false;
  }
  existsCache.set(absPath, ok);
  return ok;
}

// Папки Figma-плагинов и расширения trace-typograf — исходники продукта
// (ui.html, popup.html…), их не проверяем. Но внутри лежит лендинг
// <slug>/index.html: он обычная страница сайта и обязан проходить проверки.
const LANDING_DIR = /^(?:en\/)?tools\/(?:figma-plugins(?:\/(?!_)[^/]+)?|extensions\/trace-typograf)$/;
const isLandingTree = (abs) => LANDING_DIR.test(path.relative(ROOT, abs).split(path.sep).join('/'));

function walkHtml(dir, out = []) {
  const inLandingDir = isLandingTree(dir) && !/figma-plugins$/.test(dir);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (PRUNE_DIRS.has(entry.name) && !isLandingTree(abs)) continue;
      walkHtml(abs, out);
    } else if (entry.name.endsWith('.html')) {
      if (PRUNE_DIRS_SOURCE.test(path.relative(ROOT, dir).split(path.sep).join('/')) && !inLandingDir) continue;
      if (inLandingDir && entry.name !== 'index.html') continue;
      out.push(abs);
    }
  }
  return out;
}
const PRUNE_DIRS_SOURCE = /^(?:en\/)?tools\/(?:figma-plugins|extensions\/trace-typograf)(?:\/|$)/;

// Из значения атрибута получить абсолютный путь на диске, который должен
// существовать, плюс сайт-абсолютный путь (для SOFT_WARN_RE / отчёта).
// Возвращает null для ссылок, которые проверять не нужно.
function resolveTarget(rawValue, pageAbsPath) {
  let value = rawValue.trim();
  if (!value) return null;

  // Схемы и якоря, которые не резолвятся в файл на диске.
  if (/^(#|mailto:|tel:|data:|javascript:|blob:)/i.test(value)) return null;
  if (value.startsWith('//')) return null; // протокол-относительная — внешняя
  // Vercel-платформенные роуты (Speed Insights, Web Analytics): обслуживаются
  // рантаймом хостинга, файла в репо нет и не будет.
  if (value.startsWith('/_vercel/')) return null;
  // Плейсхолдеры клиентских шаблонов (`${…}` в <script>, `{{…}}` в partial) —
  // интерполируются в рантайме, статической цели на диске у них нет.
  if (value.includes('${') || value.includes('{{')) return null;

  // Абсолютный URL: пропускаем чужие домены, свой — сводим к пути от корня.
  const m = value.match(/^https?:\/\/([^/]+)(\/.*)?$/i);
  if (m) {
    const host = m[1].toLowerCase();
    if (host !== SITE_ORIGIN && host !== `www.${SITE_ORIGIN}`) return null; // внешняя
    value = m[2] || '/';
  }

  // Отбрасываем query и hash, декодируем %XX (иначе "File%20Name.svg" не
  // совпадёт с реальным файлом "File Name.svg" на диске).
  value = value.replace(/[?#].*$/, '');
  if (!value) return null;
  try { value = decodeURIComponent(value); } catch { /* оставляем как есть */ }

  let siteAbs; // путь от корня сайта, для SOFT_WARN_RE
  let abs;
  if (value.startsWith('/')) {
    siteAbs = value;
    abs = path.join(ROOT, value);
  } else {
    abs = path.resolve(path.dirname(pageAbsPath), value);
    siteAbs = '/' + path.relative(ROOT, abs).split(path.sep).join('/');
  }

  // Ссылка-директория ("…/") означает …/index.html.
  if (value.endsWith('/') || abs === ROOT) abs = path.join(abs, 'index.html');

  return { abs, siteAbs };
}

// href="…", src="…", и content="…" только если значение похоже на URL/путь
// (canonical, og:image, og:url) — текстовые description так отсекаются.
const ATTR_RE = /(href|src|content)\s*=\s*"([^"]*)"/gi;

function extractTargets(html, pageAbsPath) {
  const targets = [];
  let m;
  while ((m = ATTR_RE.exec(html)) !== null) {
    const attr = m[1].toLowerCase();
    const value = m[2];
    if (attr === 'content') {
      // content резолвим только когда это URL/путь, а не произвольный текст.
      if (!/^(https?:\/\/|\/)/i.test(value.trim())) continue;
    }
    const resolved = resolveTarget(value, pageAbsPath);
    if (resolved) targets.push({ value: value.trim(), ...resolved });
  }
  return targets;
}

function main() {
  const pages = walkHtml(ROOT);

  // Группируем битые ссылки по цели: одна дохлая страница обычно линкуется
  // с десятков карточек — показываем цель + счётчик + пример источника.
  const broken = new Map();     // value → { count, sample, soft }
  let linksChecked = 0;

  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    for (const { value, abs, siteAbs } of extractTargets(html, page)) {
      linksChecked++;
      if (targetExists(abs)) continue;
      const rel = path.relative(ROOT, page);
      const hit = broken.get(value);
      if (hit) hit.count++;
      else broken.set(value, { count: 1, sample: rel, soft: isSoftWarn(siteAbs) });
    }
  }

  const entries = [...broken.entries()].sort((a, b) => b[1].count - a[1].count);
  let hardCount = 0;
  for (const [value, { count, sample, soft }] of entries) {
    const isHard = !soft && !WARN_ONLY;
    if (isHard) hardCount++;
    const mark = isHard ? '\x1b[31m✗' : '\x1b[33m⚠';
    console.error(`${mark} битая ссылка: ${value}\x1b[0m — ${count}× (напр. ${sample})`);
  }

  console.log(
    `\n[links] страниц: ${pages.length}, проверено ссылок: ${linksChecked}, ` +
    `битых целей: ${entries.length} (из них жёстких: ${hardCount})`,
  );

  process.exit(hardCount ? 1 : 0);
}

main();
