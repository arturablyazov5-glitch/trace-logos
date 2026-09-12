#!/usr/bin/env node
/**
 * build-kb.js — собирает kb/data.json из markdown-статей в kb/articles/.
 *
 * Источник правды — kb/articles/**\/*.md (+ опциональные kb/articles/**\/_section.json
 * для метаданных папки-раздела). kb/data.json — СГЕНЕРИРОВАННЫЙ файл, как
 * logos/<cat>/<slug>/index.html: не редактировать руками, правки потрёт
 * следующий запуск.
 *
 * Дерево = файловая структура kb/articles/:
 *   - каждая ПОДПАПКА = раздел (section). Может содержать _section.json
 *     ({ "title", "icon"?, "order"? }) — без него заголовок берётся из
 *     имени папки (humanize), иконки не будет.
 *   - каждый .md файл = статья (article). Frontmatter: title (обязательно),
 *     excerpt?, icon?, order?.
 *   - вложенность любая: kb/articles/a/b/c/статья.md — раздел a → раздел b →
 *     раздел c → статья.
 *
 * id раздела = имя папки, id статьи = имя файла без .md — должны быть
 * уникальны по всему дереву (на них строится прямая ссылка #/<id> в kb.js).
 * Дубликат — сборка падает с понятной ошибкой, а не тихой перезаписью.
 *
 * Markdown-движок — самостоятельный, не reuse scripts/build-blog.js: тот
 * заточен под виджеты/каталог-ссылки/TOC блога, здесь нужен компактный
 * подмножество (заголовки, списки, ссылки, код, цитаты, callout, таблицы).
 * Callout-разметка (:::note/tip/warning/success/danger) визуально совпадает
 * с блогом — те же иконки/подписи, те же CSS-классы css/blog.css.
 *
 * Usage: node scripts/build-kb.js [--dry-run]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'kb', 'articles');
const OUT_FILE = path.join(ROOT, 'kb', 'data.json');
const DRY = process.argv.includes('--dry-run');

function fail(msg) {
  console.error(`✗ build-kb: ${msg}`);
  process.exit(1);
}

function esc(str) {
  return String(str).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function humanize(name) {
  return name.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

// ── Inline markdown (bold/italic/code/links) ──
function inline(text) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const external = /^https?:\/\//.test(href);
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${esc(href)}"${attrs}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  return s;
}

const CALLOUT_ICONS = {
  note:    '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
  tip:     '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3Z"/>',
  warning: '<path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  success: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  danger:  '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
};
const CALLOUT_LABELS = { note: 'Заметка', tip: 'Совет', warning: 'Важно', success: 'Можно', danger: 'Нельзя' };

function calloutHead(type, title) {
  const icon = CALLOUT_ICONS[type] || CALLOUT_ICONS.note;
  const label = title || CALLOUT_LABELS[type] || CALLOUT_LABELS.note;
  const svg = `<svg class="callout-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>`;
  return `<div class="callout-head">${svg}<span>${inline(label)}</span></div>`;
}

// ── Block-level markdown → HTML ──
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  function flushParagraph(buf) {
    if (buf.length) out.push(`<p>${inline(buf.join(' ').trim())}</p>`);
  }

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      i++; // skip closing ```
      const cls = lang ? ` class="language-${esc(lang)}"` : '';
      out.push(`<pre><code${cls}>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }

    // Callout: :::type Optional title
    const calloutStart = line.match(/^:::(note|tip|warning|success|danger)\s*(.*)$/);
    if (calloutStart) {
      const [, type, title] = calloutStart;
      const body = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') { body.push(lines[i]); i++; }
      i++; // skip closing :::
      out.push(`<div class="callout callout-${type}">${calloutHead(type, title.trim())}<div class="callout-body">${mdToHtml(body.join('\n'))}</div></div>`);
      continue;
    }

    // Heading
    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) { out.push('<hr>'); i++; continue; }

    // Blockquote
    if (line.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('>')) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${mdToHtml(buf.join('\n'))}</blockquote>`);
      continue;
    }

    // Table (pipe syntax, second line = separator)
    if (line.includes('|') && lines[i + 1] && /^\s*\|?[\s:-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const headCells = line.split('|').map(c => c.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean));
        i++;
      }
      const thead = `<tr>${headCells.map(c => `<th>${inline(c)}</th>`).join('')}</tr>`;
      const tbody = rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      out.push(`<div class="blog-table-wrap"><table class="blog-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`);
      continue;
    }

    // Lists (- / * / 1.)
    const isUl = /^\s*[-*]\s+/.test(line);
    const isOl = /^\s*\d+\.\s+/.test(line);
    if (isUl || isOl) {
      const tag = isUl ? 'ul' : 'ol';
      const re = isUl ? /^\s*[-*]\s+(.*)$/ : /^\s*\d+\.\s+(.*)$/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(lines[i].match(re)[1]);
        i++;
      }
      out.push(`<${tag}>${items.map(it => `<li>${inline(it)}</li>`).join('')}</${tag}>`);
      continue;
    }

    // Paragraph — collect consecutive non-blank plain lines
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|```|:::|>|-{3,}$|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    flushParagraph(buf);
  }

  return out.join('\n');
}

// ── Walk kb/articles/ into the tree ──
const seenIds = new Map(); // id -> relative path, for duplicate detection

function claimId(id, rel) {
  if (seenIds.has(id)) fail(`дублирующийся id "${id}": ${seenIds.get(id)} и ${rel} — id должен быть уникален во всём дереве`);
  seenIds.set(id, rel);
}

function readSectionMeta(dirAbs) {
  const metaPath = path.join(dirAbs, '_section.json');
  if (!fs.existsSync(metaPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch (e) {
    fail(`битый JSON в ${path.relative(ROOT, metaPath)}: ${e.message}`);
  }
}

function walkDir(dirAbs) {
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  const nodes = [];

  for (const entry of entries) {
    if (entry.name === '_section.json' || entry.name.startsWith('.')) continue;
    const abs = path.join(dirAbs, entry.name);
    const rel = path.relative(ROOT, abs);

    if (entry.isDirectory()) {
      const id = entry.name;
      claimId(id, rel);
      const meta = readSectionMeta(abs);
      const children = walkDir(abs);
      nodes.push({
        type: 'section',
        id,
        title: meta.title || humanize(entry.name),
        icon: meta.icon,
        _order: meta.order ?? 999,
        children,
      });
    } else if (entry.name.endsWith('.md')) {
      const id = entry.name.slice(0, -3);
      claimId(id, rel);
      const raw = fs.readFileSync(abs, 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      if (!meta.title) fail(`нет "title" во frontmatter: ${rel}`);
      nodes.push({
        type: 'article',
        id,
        title: meta.title,
        excerpt: meta.excerpt,
        icon: meta.icon,
        _order: meta.order != null ? Number(meta.order) : 999,
        content: mdToHtml(body),
      });
    }
  }

  nodes.sort((a, b) => (a._order - b._order) || a.title.localeCompare(b.title, 'ru'));
  for (const n of nodes) delete n._order;
  return nodes;
}

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) fail(`нет папки ${path.relative(ROOT, ARTICLES_DIR)}`);
  const tree = walkDir(ARTICLES_DIR);

  const countArticles = n => n.type === 'article' ? 1 : (n.children || []).reduce((s, c) => s + countArticles(c), 0);
  const total = tree.reduce((s, n) => s + countArticles(n), 0);

  if (DRY) {
    console.log(`[build-kb] --dry-run: ${tree.length} разделов верхнего уровня, ${total} статей всего. Ничего не записано.`);
    return;
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(tree, null, 2) + '\n');
  console.log(`✓ build-kb: kb/data.json обновлён — ${tree.length} разделов верхнего уровня, ${total} статей всего`);
}

main();
