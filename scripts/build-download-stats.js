#!/usr/bin/env node
/**
 * Refreshes the per-logo download counter shown on SEO pages («Скачано: N раз»
 * in the meta table, see buildMetaTableRows() in build-seo-pages.js).
 *
 * Data source (in priority order), same pattern as build-home-popular.js:
 *   1. Live Supabase stats — ONLY if process.env.ADMIN_KEY is set. Fetched from
 *      the track function's admin GET endpoint (`exports`: rows of
 *      { figma, format, variant, count }), summed per figma across all
 *      formats/variants. Network/timeout errors never fail the build — they
 *      fall through to the snapshot.
 *   2. logos/download-stats.json — committed snapshot (figma → total downloads).
 *      The deterministic, offline- and CI-safe source used on every normal build.
 *
 * build-seo-pages.js reads the snapshot synchronously at require time, so this
 * script MUST run before it — see FAST_STEPS order in build-all.js.
 *
 * Usage:
 *   node scripts/build-download-stats.js            # refresh snapshot
 *   node scripts/build-download-stats.js --dry-run  # print totals, write nothing
 */

const fs   = require('fs');
const path = require('path');
require('./lib/load-env').loadEnv();

const ROOT      = path.resolve(__dirname, '..');
const SNAPSHOT  = path.join(ROOT, 'logos', 'download-stats.json');
const DRY_RUN   = process.argv.includes('--dry-run');
const TRACK_URL = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/track';

async function refreshSnapshot() {
  const key = process.env.ADMIN_KEY;
  if (!key) { console.log('  · ADMIN_KEY не задан — используем снапшот'); return null; }
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(TRACK_URL, { headers: { 'x-admin-key': key }, signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) { console.log(`  · live stats: HTTP ${res.status} — используем снапшот`); return null; }
    const data = await res.json();
    const downloads = {};
    for (const row of data.exports || []) {
      if (!/^Icon\//.test(row.figma)) continue;
      downloads[row.figma] = (downloads[row.figma] || 0) + (Number(row.count) || 0);
    }
    if (!Object.keys(downloads).length) return null;
    const ordered = Object.fromEntries(Object.entries(downloads).sort((a, b) => b[1] - a[1]));
    return { updated: new Date().toISOString().slice(0, 10), source: 'supabase export_stats (live)', downloads: ordered };
  } catch (e) {
    console.log(`  · live stats: ${e.name === 'AbortError' ? 'таймаут' : e.message} — используем снапшот`);
    return null;
  }
}

async function main() {
  const live = await refreshSnapshot();
  const snap = live || JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  const downloads = snap.downloads || {};
  const total = Object.values(downloads).reduce((a, b) => a + b, 0);

  if (DRY_RUN) {
    const top = Object.entries(downloads).sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log(`— Статистика скачиваний (dry-run) — ${Object.keys(downloads).length} логотипов, ${total} скачиваний всего:`);
    top.forEach(([figma, n], i) => console.log(`  ${String(i + 1).padStart(2)}. ${String(n).padStart(4)}  ${figma}`));
    return;
  }

  if (live) fs.writeFileSync(SNAPSHOT, JSON.stringify(snap, null, 2) + '\n');
  console.log(`✓ Статистика скачиваний: ${Object.keys(downloads).length} логотипов, ${total} скачиваний всего (снапшот ${snap.updated})`);
}

main().catch(e => { console.error(e); process.exit(1); });
