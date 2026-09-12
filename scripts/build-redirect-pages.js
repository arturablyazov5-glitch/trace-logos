#!/usr/bin/env node
/**
 * Generates physical meta-refresh redirect pages for GitHub Pages hosting,
 * from the same source files build-redirects.js uses for vercel.json:
 * logos/url-aliases.json + redirects-extra.json.
 *
 * Why this exists: GitHub Pages has no server-side redirect mechanism (no
 * vercel.json-style "redirects" array) — a moved/renamed page just 404s
 * unless something physically exists at the old path. This script writes
 * that "something": a tiny static HTML file at <source>/index.html with
 * `<link rel="canonical">` (permanent moves only) + `<meta http-equiv="refresh"
 * content="0;url=...">` + a plain-text fallback link for crawlers/clients
 * that don't run the refresh.
 *
 * Runs AFTER cleanup-orphaned-pages.js in build-all.js (same slot as
 * build-redirects.js, right before build-sitemap.js) — cleanup-orphaned-pages.js
 * doesn't know about url-aliases.json and would delete these pages as
 * "orphans" (a from-slug is by definition not in any category's current
 * JSON) if it ran after this script. Running after cleanup instead means
 * every build just regenerates them fresh; nothing is ever permanently lost.
 *
 * `permanent: true` (a real content move, e.g. a logo recategorized) gets a
 * canonical tag pointing at the destination — this is the SEO-preserving
 * signal, the closest static-HTML equivalent to a 301. `permanent: false`
 * (destination isn't really "the same content", e.g. /credits/ → /) skips
 * the canonical — asserting canonical there would wrongly tell crawlers the
 * homepage and /credits/ are the same page.
 *
 * Usage: node scripts/build-redirect-pages.js [--dry-run] [--strict]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALIASES_PATH = path.join(ROOT, 'logos', 'url-aliases.json');
const EXTRA_PATH = path.join(ROOT, 'redirects-extra.json');

const DRY_RUN = process.argv.includes('--dry-run');
const STRICT = process.argv.includes('--strict');

function pageExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath, 'index.html'));
}

function redirectHtml(destination, { permanent, title }) {
  // permanent: true (a real content move) gets canonical, no noindex — noindex
  // would override canonical in Google's processing and drop the URL instead
  // of consolidating its signals onto the destination, the opposite of what
  // a redirect stub should do. canonical + refresh(0) alone is the closest
  // static-HTML equivalent to a 301 (Google documents treating a 0-delay
  // meta refresh similarly to a permanent redirect).
  //
  // permanent: false (destination isn't really "the same content", e.g.
  // /credits/ → /) gets noindex instead of canonical — asserting canonical
  // there would wrongly claim the two pages are equivalent. It still needs
  // ONE of the two (test-html.js's rule 5: canonical or explicit noindex,
  // or the page is flagged as an unintentional index-as-dupe risk).
  const meta = permanent
    ? `  <link rel="canonical" href="https://trace-logos.ru${destination}">\n`
    : '  <meta name="robots" content="noindex">\n';
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${title}</title>
${meta}  <meta http-equiv="refresh" content="0; url=${destination}">
</head>
<body>
<p>Страница переехала — <a href="${destination}">перейти на новый адрес</a>.</p>
</body>
</html>
`;
}

function writeRedirectPage(source, destination, opts) {
  // source/destination are absolute paths like "/logos/social/vkdonut/"
  const relDir = source.replace(/^\/+/, '').replace(/\/+$/, '');
  const outDir = path.join(ROOT, relDir);
  const outFile = path.join(outDir, 'index.html');
  const html = redirectHtml(destination, opts);

  if (DRY_RUN) return;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, html);
}

function main() {
  const aliases = JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf8'));
  const extras = fs.existsSync(EXTRA_PATH) ? JSON.parse(fs.readFileSync(EXTRA_PATH, 'utf8')) : [];

  let errors = 0;
  let warnings = 0;
  let written = 0;

  for (const { from, to } of aliases) {
    const destRu = `logos/${to}`;
    const destEn = `en/logos/${to}`;

    if (!pageExists(destRu)) {
      console.error(`✗ битый алиас: "${from}" -> "${to}" — logos/${to}/index.html не найден`);
      errors++;
    }
    if (!pageExists(destEn)) {
      console.error(`✗ битый алиас: "${from}" -> "${to}" — en/logos/${to}/index.html не найден`);
      errors++;
    }
    // No "does the source page still exist" warning here, unlike
    // build-redirects.js: for a physical redirect stub, the source path
    // existing is the whole point — this script is what puts a file there.
    // (build-redirects.js's version of that check guards against Vercel's
    // very different mechanism, where NOTHING should exist on disk at the
    // source path — its redirect intercepts the request before the
    // filesystem is touched, so a real file there means the slug came back
    // into live use, or the move never happened.)

    const destPathRu = to ? `/logos/${to}/` : '/logos/';
    const destPathEn = to ? `/en/logos/${to}/` : '/en/logos/';
    writeRedirectPage(`/logos/${from}/`, destPathRu, { permanent: true, title: 'Страница переехала' });
    writeRedirectPage(`/en/logos/${from}/`, destPathEn, { permanent: true, title: 'Page moved' });
    written += 2;
  }

  for (const { source, destination, permanent } of extras) {
    if (!/^\/.*\/$/.test(source)) {
      console.error(`✗ redirects-extra.json: "source" должен быть абсолютным путём с завершающим слэшем: "${source}"`);
      errors++;
      continue;
    }
    if (!pageExists(destination.replace(/^\//, ''))) {
      console.error(`✗ redirects-extra.json: destination "${destination}" — ${destination.replace(/^\//, '')}index.html не найден`);
      errors++;
      continue;
    }
    writeRedirectPage(source, destination, { permanent: permanent !== false, title: 'Redirect' });
    written++;
  }

  if (errors > 0 || (STRICT && warnings > 0)) {
    console.error(`\nredirect pages: ${errors} ошибок, ${warnings} предупреждений`);
    process.exit(1);
  }

  console.log(`${DRY_RUN ? '[dry-run] ' : '✓ '}redirect pages: ${written} файлов (${aliases.length} алиасов ×2 + ${extras.length} extra)${warnings ? `, ${warnings} предупреждений` : ''}`);
}

main();
