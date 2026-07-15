#!/usr/bin/env node
/**
 * Generates the blog: blog/index.html + blog/<slug>/index.html
 *
 * Source of truth:
 *   blog/posts/*.md             — markdown posts with YAML-ish frontmatter
 *   templates/blog-index.html, templates/blog-post.html
 *
 * Frontmatter keys: title, description, date (YYYY-MM-DD), slug.
 * Minimal self-contained markdown → HTML (no deps): headings, paragraphs,
 * lists, bold, inline code, links, hr. JSON-LD: BlogPosting + Breadcrumb (post),
 * Blog + Breadcrumb (index).
 *
 * Usage:
 *   node scripts/build-blog.js            # build all
 *   node scripts/build-blog.js --dry-run
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');
const { loadDict, transformToEn, hreflangBlock } = require('./lib/en-transform');

const BASE_URL  = 'https://trace-logos.ru';
const ROOT      = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const T_INDEX   = loadTemplate(path.join(ROOT, 'templates', 'blog-index.html'));
const T_POST    = loadTemplate(path.join(ROOT, 'templates', 'blog-post.html'));
const DRY_RUN   = process.argv.includes('--dry-run');
const EN        = loadDict().en;

const MONTHS    = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Preset cover gradients — cycled by post index
const COVER_GRADIENTS = [
  'linear-gradient(135deg, #bfcfff 0%, #8fa8f8 50%, #c4b5fd 100%)',
  'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 50%, #34d399 100%)',
  'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #f59e0b 100%)',
  'linear-gradient(135deg, #fecaca 0%, #f87171 50%, #ef4444 100%)',
  'linear-gradient(135deg, #bfdbfe 0%, #60a5fa 50%, #3b82f6 100%)',
];

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Frontmatter: --- ... --- at top of file
// Supports optional EN body section after a `---EN---` line
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw, body_en: null };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const parts = m[2].split(/\n---EN---\n/);
  return { meta, body: parts[0], body_en: parts[1] || null };
}

// Inline: bold, inline code, links. Input is already-escaped text.
function inline(text) {
  return text
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, href) => `<a href="${href}">${t}</a>`);
}

// Minimal block-level markdown → HTML.
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let listType = null;
  const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t) { closeList(); i++; continue; }

    if (t === '---') { closeList(); out.push('<hr>'); i++; continue; }

    let h = t.match(/^(#{2,3})\s+(.*)$/);
    if (h) { closeList(); const lvl = h[1].length; out.push(`<h${lvl}>${inline(esc(h[2]))}</h${lvl}>`); i++; continue; }

    const ul = t.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (listType !== 'ul') { closeList(); listType = 'ul'; out.push('<ul>'); }
      out.push(`<li>${inline(esc(ul[1]))}</li>`); i++; continue;
    }
    const ol = t.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (listType !== 'ol') { closeList(); listType = 'ol'; out.push('<ol>'); }
      out.push(`<li>${inline(esc(ol[1]))}</li>`); i++; continue;
    }

    // paragraph: gather until blank line
    closeList();
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|[-*]\s|\d+\.\s|---$)/.test(lines[i].trim())) {
      para.push(lines[i].trim()); i++;
    }
    out.push(`<p>${inline(esc(para.join(' ')))}</p>`);
  }
  closeList();
  return out.join('\n      ');
}

function humanDate(iso, lang = 'ru') {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang === 'en') return `${MONTHS_EN[m - 1]} ${d}, ${y}`;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function shortDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// Strip inline markdown markers for plain-text excerpts/descriptions.
function stripMd(text) {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function firstParagraph(md) {
  for (const block of md.split(/\n\s*\n/)) {
    const t = block.trim();
    if (t && !/^(#|---|[-*]\s|\d+\.\s)/.test(t)) return stripMd(t.replace(/\s+/g, ' '));
  }
  return '';
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) { console.error('✗ blog/posts/ not found'); process.exit(1); }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map(f => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    const { meta, body, body_en } = parseFrontmatter(raw);
    const slug = meta.slug || path.basename(f, '.md');
    const tags = meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const tags_en = meta.tags_en ? meta.tags_en.split(',').map(t => t.trim()).filter(Boolean) : tags;
    return {
      slug,
      title: meta.title || slug,
      title_en: meta.title_en || meta.title || slug,
      description: meta.description || firstParagraph(body).slice(0, 160),
      description_en: meta.description_en || meta.description || firstParagraph(body).slice(0, 160),
      date: meta.date || '1970-01-01',
      excerpt: firstParagraph(body).slice(0, 180),
      tags,
      tags_en,
      cover: meta.cover || '',
      body,
      body_en: body_en || null,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));   // newest first

  if (DRY_RUN) {
    posts.forEach(p => console.log(`blog/${p.slug}/index.html  — ${p.title}`));
    console.log(`\nblog/index.html  (${posts.length} posts)`);
    return;
  }

  // ── Post pages ──
  for (const p of posts) {
    const rel = '../../';
    const fullUrl = `${BASE_URL}/blog/${p.slug}/`;
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Trace Logo's", "item": `${BASE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Блог", "item": `${BASE_URL}/blog/` },
            { "@type": "ListItem", "position": 3, "name": p.title, "item": fullUrl },
          ],
        },
        {
          "@type": "BlogPosting",
          "headline": p.title,
          "description": p.description,
          "datePublished": p.date,
          "dateModified": p.date,
          "url": fullUrl,
          "inLanguage": "ru",
          "image": `${BASE_URL}/assets/og/home.png`,
          "author": { "@type": "Organization", "name": "Trace Logo's" },
          "publisher": { "@type": "Organization", "name": "Trace Logo's" },
          "mainEntityOfPage": fullUrl,
        },
      ],
    }, null, 2);

    const vars = {
      REL: rel,
      HOME_REL: rel,
      DATA_BASE: rel,
      TITLE: `${p.title} · Trace Logo's`,
      META_DESC: esc(p.description),
      CANONICAL_URL: fullUrl,
      HREFLANG_TAGS: hreflangBlock(fullUrl, `${BASE_URL}/en/blog/${p.slug}/`),
      OG_TITLE: esc(p.title),
      OG_IMAGE: `${BASE_URL}/assets/og/home.png`,
      DATE_ISO: p.date,
      DATE_HUMAN: humanDate(p.date),
      JSON_LD: jsonLd,
      H1: esc(p.title),
      BODY: mdToHtml(p.body),
    };
    const html = T_POST.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      if (!(k in vars)) { console.warn(`Unknown placeholder {{${k}}}`); return ''; }
      return vars[k];
    });
    const outPath = path.join(ROOT, 'blog', p.slug, 'index.html');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');

    // EN page — English title/meta/JSON-LD + EN body when available
    const enFullUrl = `${BASE_URL}/en/blog/${p.slug}/`;
    const enJsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Trace Logo's", "item": `${BASE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${BASE_URL}/en/blog/` },
            { "@type": "ListItem", "position": 3, "name": p.title_en, "item": enFullUrl },
          ],
        },
        {
          "@type": "BlogPosting",
          "headline": p.title_en,
          "description": p.description_en,
          "datePublished": p.date,
          "dateModified": p.date,
          "url": enFullUrl,
          "inLanguage": "en",
          "image": `${BASE_URL}/assets/og/home.png`,
          "author": { "@type": "Organization", "name": "Trace Logo's" },
          "publisher": { "@type": "Organization", "name": "Trace Logo's" },
          "mainEntityOfPage": enFullUrl,
        },
      ],
    }, null, 2);
    const enVars = {
      ...vars,
      HOME_REL: '/en/',
      DATA_BASE: '/',
      TITLE: `${p.title_en} · Trace Logo's`,
      META_DESC: esc(p.description_en),
      OG_TITLE: esc(p.title_en),
      H1: esc(p.title_en),
      DATE_HUMAN: humanDate(p.date, 'en'),
      JSON_LD: enJsonLd,
      BODY: p.body_en ? mdToHtml(p.body_en) : mdToHtml(p.body),
    };
    const htmlEn = transformToEn(
      T_POST.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in enVars ? enVars[k] : '')),
      `blog/${p.slug}/index.html`,
      EN
    );
    const enOutPath = path.join(ROOT, 'en', 'blog', p.slug, 'index.html');
    fs.mkdirSync(path.dirname(enOutPath), { recursive: true });
    fs.writeFileSync(enOutPath, htmlEn, 'utf8');
  }

  // ── Index page ──
  const cards = posts.map((p, i) => {
    const coverStyle = p.cover
      ? `background-image: url('${esc(p.cover)}'); background-size: cover; background-position: center;`
      : `background: ${COVER_GRADIENTS[i % COVER_GRADIENTS.length]};`;
    const tagsHtml = p.tags.length
      ? `<div class="blog-card-tags">${p.tags.map(t => `<span class="blog-card-tag">${esc(t)}</span>`).join('')}</div>`
      : '';
    return `<a class="blog-card" href="${p.slug}/">
        <div class="blog-card-cover" style="${coverStyle}" aria-hidden="true"></div>
        <div class="blog-card-body">
          <div class="blog-card-date">${shortDate(p.date)}</div>
          <div class="blog-card-title">${esc(p.title)}</div>
          ${tagsHtml}
        </div>
      </a>`;
  }).join('\n      ');

  const indexJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Trace Logo's", "item": `${BASE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Блог", "item": `${BASE_URL}/blog/` },
        ],
      },
      {
        "@type": "Blog",
        "name": "Блог Trace Logo's",
        "url": `${BASE_URL}/blog/`,
        "inLanguage": "ru",
        "blogPost": posts.map(p => ({
          "@type": "BlogPosting",
          "headline": p.title,
          "url": `${BASE_URL}/blog/${p.slug}/`,
          "datePublished": p.date,
        })),
      },
    ],
  }, null, 2);

  const indexHtml = T_INDEX.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (k === 'REL' || k === 'HOME_REL' || k === 'DATA_BASE') return '../';
    if (k === 'JSON_LD') return indexJsonLd;
    if (k === 'POST_CARDS') return cards;
    console.warn(`Unknown placeholder {{${k}}}`); return '';
  });
  fs.writeFileSync(path.join(ROOT, 'blog', 'index.html'), indexHtml, 'utf8');

  // ── EN blog index — same structure, English card titles ──
  const enCards = posts.map((p, i) => {
    const coverStyle = p.cover
      ? `background-image: url('${esc(p.cover)}'); background-size: cover; background-position: center;`
      : `background: ${COVER_GRADIENTS[i % COVER_GRADIENTS.length]};`;
    const tagsHtml = p.tags_en.length
      ? `<div class="blog-card-tags">${p.tags_en.map(t => `<span class="blog-card-tag">${esc(t)}</span>`).join('')}</div>`
      : '';
    return `<a class="blog-card" href="${p.slug}/">
        <div class="blog-card-cover" style="${coverStyle}" aria-hidden="true"></div>
        <div class="blog-card-body">
          <div class="blog-card-date">${shortDate(p.date)}</div>
          <div class="blog-card-title">${esc(p.title_en)}</div>
          ${tagsHtml}
        </div>
      </a>`;
  }).join('\n      ');
  const enIndexJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Trace Logo's", "item": `${BASE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${BASE_URL}/en/blog/` },
        ],
      },
      {
        "@type": "Blog",
        "name": "Trace Logo's Blog",
        "url": `${BASE_URL}/en/blog/`,
        "inLanguage": "en",
        "blogPost": posts.map(p => ({
          "@type": "BlogPosting",
          "headline": p.title_en,
          "url": `${BASE_URL}/en/blog/${p.slug}/`,
          "datePublished": p.date,
        })),
      },
    ],
  }, null, 2);
  const enIndexHtml = transformToEn(
    T_INDEX.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      if (k === 'REL' || k === 'HOME_REL' || k === 'DATA_BASE') return '/';
      if (k === 'JSON_LD') return enIndexJsonLd;
      if (k === 'POST_CARDS') return enCards;
      return '';
    }),
    'blog/index.html',
    EN
  );
  fs.mkdirSync(path.join(ROOT, 'en', 'blog'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'en', 'blog', 'index.html'), enIndexHtml, 'utf8');

  console.log(`✓ Blog: ${posts.length} posts + index (RU + EN)`);
}

main();
