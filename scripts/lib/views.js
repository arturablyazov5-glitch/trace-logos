const fs = require('fs');
const path = require('path');

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

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/track`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    
    if (!res.ok) {
      console.error('❌ Failed to fetch blog views:', await res.text());
      return {};
    }

    const data = await res.json();
    const views = {};
    (data.post_views || []).forEach(v => {
      views[v.slug] = v.count;
    });
    return views;
  } catch (err) {
    console.error('❌ Error fetching blog views:', err);
    return {};
  }
}

module.exports = { getBlogViews };
