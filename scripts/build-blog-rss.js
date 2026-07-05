#!/usr/bin/env node
/**
 * Generates RSS 2.0 feed for the blog: blog/rss.xml
 *
 * Required by Yandex Webmaster for article indexing.
 * Namespaces: xmlns:yandex (full-text), xmlns:media (mrss).
 *
 * Usage:
 *   node scripts/build-blog-rss.js
 *   node scripts/build-blog-rss.js --dry-run
 */

const fs   = require('fs');
const path = require('path');

const BASE_URL  = 'https://trace-logos.ru';
const ROOT      = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const DRY_RUN   = process.argv.includes('--dry-run');

const DAYS_EN   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ISO date → RFC-822, 09:00 MSK
function toRfc822(iso) {
  const [y, mo, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  const day = DAYS_EN[date.getUTCDay()];
  return `${day}, ${String(d).padStart(2, '0')} ${MONTHS_EN[mo - 1]} ${y} 09:00:00 +0300`;
}

function stripMd(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^---\s*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Markdown → simple HTML for yandex:full-text (wrapped in CDATA)
function mdToHtml(md) {
  return md.split(/\n\s*\n/).map(block => {
    const t = block.trim();
    if (!t || t === '---') return '';
    const hMatch = t.match(/^(#{2,3})\s+(.*)/);
    if (hMatch) return `<h${hMatch[1].length}>${hMatch[2]}</h${hMatch[1].length}>`;
    const lines = t.split('\n');
    if (/^[-*]\s/.test(lines[0].trim())) {
      const lis = lines.filter(l => /^[-*]\s/.test(l.trim())).map(l => `<li>${l.trim().replace(/^[-*]\s+/, '')}</li>`).join('');
      return `<ul>${lis}</ul>`;
    }
    if (/^\d+\.\s/.test(lines[0].trim())) {
      const lis = lines.filter(l => /^\d+\.\s/.test(l.trim())).map(l => `<li>${l.trim().replace(/^\d+\.\s+/, '')}</li>`).join('');
      return `<ol>${lis}</ol>`;
    }
    const inline = t
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return `<p>${inline}</p>`;
  }).filter(Boolean).join('\n');
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) { console.error('✗ blog/posts/ not found'); process.exit(1); }

  const posts = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      const slug = meta.slug || path.basename(f, '.md');
      return {
        slug,
        title: meta.title || slug,
        description: meta.description || stripMd(body).slice(0, 200),
        date: meta.date || '1970-01-01',
        body,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const items = posts.map(p => {
    const url = `${BASE_URL}/blog/${p.slug}/`;
    return `
  <item>
    <title>${escXml(p.title)}</title>
    <link>${url}</link>
    <pubDate>${toRfc822(p.date)}</pubDate>
    <description>${escXml(p.description)}</description>
    <yandex:full-text><![CDATA[${mdToHtml(p.body)}]]></yandex:full-text>
  </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:yandex="http://news.yandex.ru"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Блог Trace Logo's</title>
    <link>${BASE_URL}/blog/</link>
    <description>Статьи о логотипах, форматах SVG и PNG, эмодзи и брендах</description>
    <language>ru</language>
    <lastBuildDate>${toRfc822(posts[0]?.date || '2026-01-01')}</lastBuildDate>
${items}
  </channel>
</rss>`;

  if (DRY_RUN) { console.log(rss); return; }

  const out = path.join(ROOT, 'blog', 'rss.xml');
  fs.writeFileSync(out, rss, 'utf8');
  console.log(`✓ blog/rss.xml (${posts.length} posts)`);
}

main();
