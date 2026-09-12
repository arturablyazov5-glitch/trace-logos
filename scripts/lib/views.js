const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ENV_PATH = path.join(ROOT, '.env');

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const env = {};
  fs.readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
    const i = line.indexOf('=');
    if (i !== -1) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return env;
}

async function getBlogViews() {
  const env = loadEnv();
  const SUPABASE_URL = env.SUPABASE_URL;
  const ADMIN_KEY = env.ADMIN_KEY;

  if (!SUPABASE_URL || !ADMIN_KEY) {
    console.warn('⚠️ SUPABASE_URL or ADMIN_KEY not found in .env. Using zero views.');
    return {};
  }

  const url = `${SUPABASE_URL}/functions/v1/track`;

  try {
    const data = await fetchJson(url, ADMIN_KEY);
    const views = {};
    (data.post_views || []).forEach(v => {
      views[v.slug] = v.count;
    });
    return views;
  } catch (err) {
    console.error('❌ Error fetching blog views:', err?.message || err);
    return {};
  }
}

async function fetchJson(url, adminKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { 'x-admin-key': adminKey },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return await res.json();
  } catch (err) {
    try {
      const out = execFileSync('curl', [
        '-sS',
        '--connect-timeout', '20',
        '--max-time', '60',
        '-H', `x-admin-key: ${adminKey}`,
        url,
      ], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
      return JSON.parse(out);
    } catch (curlErr) {
      throw new Error(curlErr?.stderr?.toString().trim() || curlErr?.message || err?.message || 'Failed to fetch blog views');
    }
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { getBlogViews };
