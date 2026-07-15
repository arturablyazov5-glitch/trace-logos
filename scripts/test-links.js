#!/usr/bin/env node
/**
 * Проверка внутренних ссылок в СГЕНЕРЁННОМ HTML. Read-only, ничего не пишет.
 *
 * test-data.js проверяет ассеты, на которые ссылается JSON. Этот скрипт
 * проверяет другое: ссылки МЕЖДУ готовыми страницами. Проходит по всем
 * *.html сайта, вытаскивает href/src (и URL-подобные content — canonical,
 * og:image) и убеждается, что цель существует на диске.
 *
 * Ловит ровно тот класс багов, что раньше отлавливался вручную через `find`:
 *   • about-текст ссылается на /logos/ecosystem/<key>/, а страницы нет
 *   • перекрёстная ссылка на /logos/<cat>/<slug>/ с опечаткой в слаге
 *   • canonical / og:image указывает на удалённую страницу или картинку
 *
 * Резолв ссылок:
 *   • внешние (http(s):// на чужой домен), //, #, mailto:/tel:/data:/js:  — пропуск
 *   • https://trace-logos.ru/<x>  → <ROOT>/<x>   (внутренний абсолют по домену)
 *   • /<x>                        → <ROOT>/<x>   (корне-абсолютный путь)
 *   • ../<x>, <x>                 → относительно папки самой страницы
 *   • ?query и #hash отбрасываются; путь на "/" → добавляется index.html
 *
 * Битая внутренняя ссылка = ошибка (exit 1), как в test-data.js.
 * Флаги: --warn-only (не валить сборку, только предупредить), --dry-run (игнор).
 *
 * Usage:
 *   node scripts/test-links.js
 *   node scripts/test-links.js --warn-only
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const WARN_ONLY = argv.includes('--warn-only');

const SITE_ORIGIN = 'trace-logos.ru'; // внутренний прод-домен

// Каталоги, куда не заходим: служебное, шаблоны с {{...}}, чужие зеркала.
const PRUNE_DIRS = new Set([
  'node_modules', '.git', '.claude', 'cdn-dist', 'templates',
  'figma-plugin', 'supabase', 'sanitizer', 'upptime',
]);

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

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (PRUNE_DIRS.has(entry.name)) continue;
      walkHtml(abs, out);
    } else if (entry.name.endsWith('.html')) {
      out.push(abs);
    }
  }
  return out;
}

// Из значения атрибута получить абсолютный путь на диске, который должен
// существовать. Возвращает null для ссылок, которые проверять не нужно.
function resolveTarget(rawValue, pageAbsPath) {
  let value = rawValue.trim();
  if (!value) return null;

  // Схемы и якоря, которые не резолвятся в файл на диске.
  if (/^(#|mailto:|tel:|data:|javascript:|blob:)/i.test(value)) return null;
  if (value.startsWith('//')) return null; // протокол-относительная — внешняя
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

  // Отбрасываем query и hash.
  value = value.replace(/[?#].*$/, '');
  if (!value) return null;

  // Этот скрипт проверяет ТОЛЬКО навигационные ссылки между страницами
  // (…/  или  ….html). Ассеты (png/svg/css/js/json/…) — забота test-data.js;
  // сюда они попадать не должны, иначе дублируем проверку и ловим
  // сознательно терпимые промахи (напр. отсутствующие google-флаги эмодзи).
  const base = value.split('/').pop();
  const isPageLink = value.endsWith('/') || !base.includes('.') || /\.html$/i.test(base);
  if (!isPageLink) return null;

  let abs;
  if (value.startsWith('/')) {
    abs = path.join(ROOT, value);
  } else {
    abs = path.resolve(path.dirname(pageAbsPath), value);
  }

  // Ссылка-директория ("…/") означает …/index.html.
  if (value.endsWith('/') || abs === ROOT) abs = path.join(abs, 'index.html');

  return abs;
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
    const abs = resolveTarget(value, pageAbsPath);
    if (abs) targets.push({ value: value.trim(), abs });
  }
  return targets;
}

function main() {
  const pages = walkHtml(ROOT);

  // Группируем битые ссылки по цели: одна дохлая страница обычно линкуется
  // с десятков карточек — показываем цель + счётчик + пример источника.
  const broken = new Map(); // value → { count, sample }
  let linksChecked = 0;

  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    for (const { value, abs } of extractTargets(html, page)) {
      linksChecked++;
      if (targetExists(abs)) continue;
      const rel = path.relative(ROOT, page);
      const hit = broken.get(value);
      if (hit) hit.count++;
      else broken.set(value, { count: 1, sample: rel });
    }
  }

  const entries = [...broken.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [value, { count, sample }] of entries) {
    const mark = WARN_ONLY ? '\x1b[33m⚠' : '\x1b[31m✗';
    console.error(`${mark} битая ссылка: ${value}\x1b[0m — ${count}× (напр. ${sample})`);
  }

  console.log(
    `\n[links] страниц: ${pages.length}, проверено ссылок: ${linksChecked}, ` +
    `битых целей: ${entries.length}`,
  );

  process.exit(entries.length && !WARN_ONLY ? 1 : 0);
}

main();
