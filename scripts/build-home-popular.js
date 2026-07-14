#!/usr/bin/env node
/**
 * Generates the «Популярные логотипы» card grid on the homepage (index.html)
 * from real popularity stats, replacing the previously hand-maintained list.
 *
 * Data source (in priority order):
 *   1. Live Supabase stats — ONLY if process.env.ADMIN_KEY is set. Fetched from
 *      the track function's admin GET endpoint; on success the snapshot below is
 *      refreshed so the fallback stays current. Network/timeout errors never
 *      fail the build — they fall through to the snapshot.
 *   2. logos/popular-stats.json — committed snapshot (figma → views). This is
 *      the deterministic, offline- and CI-safe source used on every normal build.
 *
 * The top-N ready (non-comingSoon) logos by views are rendered as .logo-card
 * links and injected into index.html between the
 *   <!-- POPULAR:START --> … <!-- POPULAR:END -->
 * markers, the same marker pattern used by build-home-sitemap.js. The exact card
 * markup mirrors the original hand-written cards (SVG → <img>, PNG → <picture>
 * with a WebP preview source), so no CSS changes are needed.
 *
 * Also writes logos/_popular.json — the picked list with RU + EN names — which
 * build-en-pages.js (via lib/home-i18n.js) reads to translate the card names and
 * alt text for the /en/ mirror. That keeps names single-sourced from the
 * category JSON (name / name_en) instead of a hardcoded list.
 *
 * Usage:
 *   node scripts/build-home-popular.js            # write index.html + _popular.json
 *   node scripts/build-home-popular.js --dry-run  # print the picks, write nothing
 */

const fs   = require('fs');
const path = require('path');
require('./lib/load-env').loadEnv();

const ROOT        = path.resolve(__dirname, '..');
const INDEX       = path.join(ROOT, 'index.html');
const SNAPSHOT    = path.join(ROOT, 'logos', 'popular-stats.json');
const OUT_I18N    = path.join(ROOT, 'logos', '_popular.json');
const MANIFEST    = path.join(ROOT, 'logos', 'manifest.json');
const DRY_RUN     = process.argv.includes('--dry-run');

const COUNT       = 24;   // 6 cols × 4 rows on the homepage grid
const TRACK_URL   = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/track';

// ── Slug / url (mirrors seoUrl() in build-seo-pages.js) ─────────────────────
function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}
function seoUrlRel(figma) {
  const parts = (figma || '').split('/').map(slugify).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return '';
  return 'logos/' + parts.slice(1).join('/') + '/';   // homepage-relative, no leading slash
}
function assetExt(file) { return String(file || '').split('.').pop().toLowerCase(); }
function baseName(file)  { return String(file || '').split('/').pop().replace(/\.[^.]+$/, ''); }

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Optional live refresh of the snapshot (admin-only, best-effort) ─────────
async function refreshSnapshot() {
  const key = process.env.ADMIN_KEY;
  if (!key) return null;                       // no key → skip silently, use snapshot
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(TRACK_URL, { headers: { 'x-admin-key': key }, signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) { console.log(`  · live stats: HTTP ${res.status} — используем снапшот`); return null; }
    const data = await res.json();
    const views = {};
    for (const row of data.views || []) {
      if (/^Icon\//.test(row.figma)) views[row.figma] = row.views;
    }
    if (!Object.keys(views).length) return null;
    const ordered = Object.fromEntries(Object.entries(views).sort((a, b) => b[1] - a[1]));
    const snap = { updated: new Date().toISOString().slice(0, 10), source: 'supabase logo_stats (live)', views: ordered };
    if (!DRY_RUN) fs.writeFileSync(SNAPSHOT, JSON.stringify(snap, null, 2) + '\n');
    console.log(`  · live stats: обновлён снапшот (${Object.keys(views).length} логотипов)`);
    return snap;
  } catch (e) {
    console.log(`  · live stats: ${e.name === 'AbortError' ? 'таймаут' : e.message} — используем снапшот`);
    return null;
  }
}

// ── Card markup (mirrors the original hand-written homepage cards) ──────────
function cardHtml(pick) {
  const isSvg = assetExt(pick.file) === 'svg';
  const alt   = `Логотип ${pick.name}`;
  let media;
  if (isSvg) {
    media = `<img src="assets/logos/svgs/${esc(pick.file)}" alt="${esc(alt)}" width="44" height="44" loading="lazy">`;
  } else {
    const webp = path.join(ROOT, 'assets', 'logos', 'previews', `${baseName(pick.file)}.webp`);
    const img  = `<img src="assets/logos/pngs/${esc(pick.file)}" alt="${esc(alt)}" width="44" height="44" loading="lazy">`;
    media = fs.existsSync(webp)
      ? `<picture><source srcset="assets/logos/previews/${esc(baseName(pick.file))}.webp" type="image/webp">${img}</picture>`
      : img;
  }
  return `        <a class="logo-card" href="${esc(pick.url)}">
          ${media}
          <span class="logo-card-name">${esc(pick.name)}</span>
        </a>`;
}

async function main() {
  // 1. resolve stats source
  const live = await refreshSnapshot();
  const snap = live || JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  const views = snap.views || {};

  // 2. figma → item map from category JSONs (source of truth for name/name_en/file)
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const byFigma = new Map();
  for (const cat of manifest.categories) {
    const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8')).items;
    for (const it of items) if (it.figma) byFigma.set(it.figma, it);
  }

  // 3. rank ready logos by views, keep top-N with a resolvable page + asset
  const picks = Object.entries(views)
    .map(([figma, v]) => ({ figma, v, it: byFigma.get(figma) }))
    .filter(x => x.it && !x.it.comingSoon && x.it.file)
    .map(x => ({ ...x, url: seoUrlRel(x.figma) }))
    .filter(x => x.url)
    .sort((a, b) => b.v - a.v || slugify(a.it.name).localeCompare(slugify(b.it.name)))
    .slice(0, COUNT)
    .map(x => ({ figma: x.figma, views: x.v, name: x.it.name, name_en: x.it.name_en || x.it.name, file: x.it.file, url: x.url }));

  if (picks.length < COUNT) {
    console.warn(`  ⚠ найдено только ${picks.length}/${COUNT} логотипов со статистикой — блок будет короче`);
  }

  // 4. render + inject between markers
  const block = picks.map(cardHtml).join('\n');
  let html = fs.readFileSync(INDEX, 'utf8');
  const START = '<!-- POPULAR:START (generated by scripts/build-home-popular.js — do not hand-edit) -->';
  const END   = '<!-- POPULAR:END -->';
  const re = new RegExp(`(${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[\\s\\S]*?(${END})`);
  if (!re.test(html)) {
    console.error('  ✗ маркеры POPULAR:START/END не найдены в index.html — блок не обновлён');
    process.exit(1);
  }
  html = html.replace(re, `$1\n${block}\n        $2`);

  if (DRY_RUN) {
    console.log(`— Популярные логотипы (dry-run) — ${picks.length} карточек:`);
    picks.forEach((p, i) => console.log(`  ${String(i + 1).padStart(2)}. ${String(p.views).padStart(3)}  ${p.name}${p.name_en !== p.name ? ` / ${p.name_en}` : ''}  → ${p.url}`));
    return;
  }

  fs.writeFileSync(INDEX, html, 'utf8');
  fs.writeFileSync(OUT_I18N, JSON.stringify(picks.map(p => ({ name: p.name, name_en: p.name_en })), null, 2) + '\n');
  console.log(`✓ Популярные логотипы: ${picks.length} карточек (снапшот ${snap.updated}) → index.html`);
}

main().catch(e => { console.error(e); process.exit(1); });
