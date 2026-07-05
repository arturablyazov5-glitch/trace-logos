// ─────────────────────────────────────────────────────────────────────────────
// en-transform.js — запекание английской статики в /en/ на этапе сборки.
//
// Перевод НЕ должен зависеть от JS в рантайме (поисковики, особенно Яндекс,
// плохо рендерят JS). Поэтому /en/ страницы получают английский текст прямо
// в HTML. Источник переводов — js/i18n-dict.js (тот же, что и у рантайма).
//
// Две операции:
//   enChrome(html, relPath) — lang=en, window.__LANG__, абсолютные пути,
//                             canonical/og:url с префиксом /en/.
//   bakeI18n(html, EN)      — заменяет текст элементов с data-i18n / data-label
//                             на английский из словаря; placeholder/aria-атрибуты;
//                             разворачивает data-*-en подсказки (h1/faq/section).
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT        = path.join(__dirname, '..', '..');
const BASE_ORIGIN = 'https://trace-logos.ru';

// js/i18n-dict.js — браузерный ESM (нет build-step), Node не может его require().
// Читаем исходник и исполняем тело модуля в изолированной функции: `export const`
// → `const`, затем возвращаем DICT/DEFAULT. Файл наш и доверенный (без import-ов
// и сайд-эффектов), поэтому eval здесь безопасен и даёт ОДИН источник переводов.
function loadDict() {
  const src  = fs.readFileSync(path.join(ROOT, 'js', 'i18n-dict.js'), 'utf8');
  const body = src.replace(/export\s+const\s+/g, 'const ') + '\nreturn { DICT, DEFAULT };';
  return new Function(body)().DICT;
}

const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// ── chrome: lang / paths / canonical ──────────────────────────────────────────

function makePathsAbsolute(html, sourceRelPath) {
  const baseUrl = `${BASE_ORIGIN}/${sourceRelPath}`;
  const resolve = (rel) => {
    if (!rel.startsWith('../') && !rel.startsWith('./')) return null;
    try { return new URL(rel, baseUrl).pathname; } catch { return null; }
  };
  html = html.replace(
    /(<(?:link|script|img|source)[^>]*?\s(?:href|src))="((?:\.\.\/|\.\/)[^"?#]*)([?#][^"]*)?"([^>]*>)/gi,
    (m, pre, rel, qs = '', post) => {
      const abs = resolve(rel);
      return abs ? `${pre}="${abs}${qs}"${post}` : m;
    }
  );
  html = html.replace(
    /(window\.__\w+__\s*=\s*['"])((?:\.\.\/|\.\/)[^'"]*)(['"]\s*;)/g,
    (m, pre, rel, post) => {
      const abs = resolve(rel);
      return abs ? `${pre}${abs}${post}` : m;
    }
  );
  return html;
}

function enChrome(html, sourceRelPath) {
  html = html.replace(/<html(\s+lang="[^"]*")?(\s*)>/,
    (m, _lang, sp) => `<html lang="en"${sp || ' '}>`);
  html = makePathsAbsolute(html, sourceRelPath);
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")https:\/\/trace-logos\.ru\//,
    `$1${BASE_ORIGIN}/en/`
  );
  html = html.replace(
    /(<meta\s+property="og:url"\s+content=")https:\/\/trace-logos\.ru\//,
    `$1${BASE_ORIGIN}/en/`
  );
  html = html.replace('<meta charset="UTF-8">',
    '<meta charset="UTF-8">\n  <script>window.__LANG__=\'en\';</script>');
  html = html.replace(/\bcontent="ru_RU"/g, 'content="en_US"');
  return html;
}

// ── bake: data-i18n / data-label inner text + placeholder/aria attrs ──────────

function bakeI18n(html, EN) {
  // Inner text for [data-i18n] and [data-label] (elements contain plain text only).
  for (const attr of ['data-i18n', 'data-label']) {
    const re = new RegExp(`(<(\\w+)\\b[^>]*\\b${attr}="([^"]+)"[^>]*>)([\\s\\S]*?)(</\\2>)`, 'g');
    html = html.replace(re, (m, open, tag, key, inner, close) => {
      const v = EN[key];
      if (v == null || typeof v === 'function') return m;
      return open + escHtml(v) + close;
    });
  }
  // placeholder attribute for [data-i18n-placeholder]
  html = html.replace(/<[a-zA-Z][^>]*\bdata-i18n-placeholder="[^"]+"[^>]*>/g, (tag) => {
    const key = tag.match(/data-i18n-placeholder="([^"]+)"/)[1];
    const v = EN[key];
    if (v == null || typeof v === 'function') return tag;
    if (/ placeholder="/.test(tag)) return tag.replace(/ placeholder="[^"]*"/, ` placeholder="${escAttr(v)}"`);
    return tag.replace(/\s*>$/, ` placeholder="${escAttr(v)}">`);
  });
  // aria-label attribute for [data-i18n-aria]
  html = html.replace(/<[a-zA-Z][^>]*\bdata-i18n-aria="[^"]+"[^>]*>/g, (tag) => {
    const key = tag.match(/data-i18n-aria="([^"]+)"/)[1];
    const v = EN[key];
    if (v == null || typeof v === 'function') return tag;
    if (/\baria-label="/.test(tag)) return tag.replace(/\baria-label="[^"]*"/, `aria-label="${escAttr(v)}"`);
    return tag.replace(/\s*>$/, ` aria-label="${escAttr(v)}">`);
  });
  // content attribute for [data-i18n-content] (meta description, og tags)
  html = html.replace(/<[a-zA-Z][^>]*\bdata-i18n-content="[^"]+"[^>]*>/g, (tag) => {
    const key = tag.match(/data-i18n-content="([^"]+)"/)[1];
    const v = EN[key];
    if (v == null || typeof v === 'function') return tag;
    if (/ content="/.test(tag)) return tag.replace(/ content="[^"]*"/, ` content="${escAttr(v)}"`);
    return tag.replace(/\s*>$/, ` content="${escAttr(v)}">`);
  });
  // title attribute for [data-i18n-title] (link rel=alternate, etc.)
  html = html.replace(/<[a-zA-Z][^>]*\bdata-i18n-title="[^"]+"[^>]*>/g, (tag) => {
    const key = tag.match(/data-i18n-title="([^"]+)"/)[1];
    const v = EN[key];
    if (v == null || typeof v === 'function') return tag;
    if (/ title="/.test(tag)) return tag.replace(/ title="[^"]*"/, ` title="${escAttr(v)}"`);
    return tag.replace(/\s*>$/, ` title="${escAttr(v)}">`);
  });
  return html;
}

function transformToEn(html, sourceRelPath, EN) {
  return bakeI18n(enChrome(html, sourceRelPath), EN);
}

module.exports = { loadDict, enChrome, bakeI18n, transformToEn, makePathsAbsolute, escHtml, escAttr, BASE_ORIGIN };
