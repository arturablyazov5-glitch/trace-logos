#!/usr/bin/env node
/**
 * One process, no LLM/API keys: Yandex session → Pinterest web API → verify.
 * node scripts/pinterest-publish.js --id cat-market-2           # read-only check
 * node scripts/pinterest-publish.js --id cat-market-2 --publish # publish one
 * node scripts/pinterest-publish.js --next --publish           # next unpublished
 * node scripts/pinterest-publish.js --next --count 5 --publish # sequential batch
 * Options: --kind batch|emoji|blog --board "Подборки логотипов"
 *          --browser-url http://127.0.0.1:9223
 *          --account rafael_mansurov --trash-published --allow-empty
 * Keep Yandex running and signed in. Never retries a publish POST. An uncertain
 * outcome blocks another POST until the board feed confirms the first result.
 * State/lock: ignored dist/pinterest/.publisher/. No cookies/tokens on disk.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const puppeteer = require('puppeteer');
const ROOT = path.resolve(__dirname, '..');
const STATE = path.join(ROOT, 'dist/pinterest/.publisher');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const print = data => { console.log(JSON.stringify(data)); return data; };

function args(argv) {
  const out = { kind: 'batch', board: 'Подборки логотипов', browserUrl: 'http://127.0.0.1:9223' };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (['--publish', '--next', '--help', '--trash-published', '--allow-empty', '--daily'].includes(key)) out[key.slice(2)] = true;
    else if (['--id', '--kind', '--board', '--browser-url', '--count', '--account'].includes(key) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      out[key === '--browser-url' ? 'browserUrl' : key.slice(2)] = argv[++i];
    } else throw new Error(`Unknown/incomplete argument: ${key}`);
  }
  if (!out.help && (Boolean(out.id) === Boolean(out.next))) throw new Error('Choose exactly one: --id <campaign> or --next');
  if (!['batch', 'emoji', 'blog'].includes(out.kind)) throw new Error('Invalid --kind');
  if (out['trash-published'] && !out.publish) throw new Error('--trash-published requires --publish');
  out.count = out.count === undefined ? 1 : Number(out.count);
  if (!Number.isInteger(out.count) || out.count < 1 || out.count > 100 || (out.count > 1 && (!out.next || !out.publish))) {
    throw new Error('--count must be 1..100; batches require --next --publish');
  }
  const url = new URL(out.browserUrl);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('CDP must be local');
  return out;
}

function loadPlan(kind) {
  const dir = path.join(ROOT, 'dist/pinterest', kind);
  const plan = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json'), 'utf8'));
  if (!Array.isArray(plan) || !plan.length) throw new Error('Empty plan');
  return plan.map((pin, i) => {
    const campaign = pin.campaign || pin.id || pin.slug;
    const image = path.join(dir, `${String(i + 1).padStart(3, '0')}-${kind === 'blog' ? pin.slug : campaign}.png`);
    return { ...pin, campaign, image, title: pin.pinTitle || pin.title, desc: pin.pinDesc || pin.desc };
  });
}

function validate(pin) {
  if (!pin || !pin.campaign || !pin.title || !pin.desc || !pin.link) throw new Error('Incomplete pin');
  if (Array.from(pin.title).length > 100 || Array.from(pin.desc).length > 800) throw new Error('Pinterest text length exceeded');
  if (new URL(pin.link).hostname !== 'trace-logos.ru') throw new Error('Unexpected destination domain');
  const data = fs.readFileSync(pin.image);
  if (data.length > 20 * 1024 * 1024 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Expected PNG <= 20 MB');
  return { bytes: data, width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function samePin(a, b) {
  const campaign = link => { try { return new URL(link).searchParams.get('utm_campaign'); } catch { return null; } };
  const title = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
  return Boolean((a.link && a.link === b.link) ||
    (campaign(a.link) && campaign(a.link) === campaign(b.link)) ||
    (title(a.title) && title(a.title) === title(b.title)));
}
function save(file, data) {
  fs.writeFileSync(file + '.tmp', JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(file + '.tmp', file);
}

function recordPath(userId, boardId, campaign) {
  return path.join(STATE, crypto.createHash('sha256').update(`${userId}:${boardId}:${campaign}`).digest('hex') + '.json');
}

function trashPublished(pin, file, state) {
  if (!['verified'].includes(state.status)) throw new Error('Only verified pins may be removed locally');
  if (!fs.existsSync(pin.image)) return;
  const trash = path.join(os.homedir(), '.Trash');
  fs.mkdirSync(trash, { recursive: true });
  const destination = state.trashPath || path.join(trash, `pinterest-${state.pinId}-${path.basename(pin.image)}`);
  if (fs.existsSync(destination)) throw new Error('Trash destination already exists; preserve both files');
  // Persist destination before move so a crash cannot lose the recovery location.
  state.trashPath = destination; save(file, state);
  fs.renameSync(pin.image, destination);
  state.trashedAt = new Date().toISOString(); save(file, state);
}

async function connect(browserUrl) {
  const browser = await puppeteer.connect({ browserURL: browserUrl, defaultViewport: null,
    targetFilter: t => t.type() === 'browser' || t.url().startsWith('https://ru.pinterest.com/') });
  let page;
  try {
    // Reuse the live session without navigating/focusing/resizing the user's tab.
    page = (await browser.pages()).find(p => p.url().startsWith('https://ru.pinterest.com/'));
    if (!page) throw new Error('Open Pinterest in the debugging Yandex profile first');
    await page.waitForFunction(() => document.querySelector('#__PWS_INITIAL_PROPS__'), { timeout: 20000 });
    const user = await page.evaluate(() => {
      const s = JSON.parse(document.querySelector('#__PWS_INITIAL_PROPS__').textContent).initialReduxState;
      const id = s.session?.userId;
      return { authenticated: s.session?.isAuthenticated, id, username: s.users?.[id]?.username,
        appVersion: JSON.parse(document.querySelector('#__PWS_DATA__').textContent).appVersion };
    });
    if (!user.authenticated || !user.id || !user.username) throw new Error('Sign in to Pinterest in Yandex first');
    if (!user.appVersion) throw new Error('Pinterest app version unavailable');
    const headers = { 'x-requested-with': 'XMLHttpRequest', accept: 'application/json, text/javascript, */*, q=0.01',
      'x-pinterest-appstate': 'active', 'x-app-version': user.appVersion,
      'x-pinterest-source-url': new URL(page.url()).pathname, 'x-pinterest-pws-handler': 'www/pin-creation-tool.js' };
    const resource = async (name, action, options) => {
      const result = await page.evaluate(async ({ name, action, options, headers }) => {
        const params = new URLSearchParams({ source_url: location.pathname, data: JSON.stringify({ options, context: {} }) });
        const get = action === 'get';
        const csrf = document.cookie.split('; ').find(c => c.startsWith('csrftoken='));
        const h = { ...headers };
        if (!get) { h['Content-Type'] = 'application/x-www-form-urlencoded'; h['X-CSRFToken'] = decodeURIComponent(csrf?.slice(10) || ''); }
        const response = await fetch(`/resource/${name}/${action}/` + (get ? '?' + params : ''), {
          method: get ? 'GET' : 'POST', headers: h, credentials: 'same-origin',
          body: get ? undefined : params.toString(), signal: AbortSignal.timeout(30000)
        });
        let body;
        try { body = await response.json(); } catch { throw new Error(`Pinterest HTTP ${response.status}: non-JSON response`); }
        const r = body.resource_response;
        if (!response.ok || r?.status !== 'success') throw new Error(`Pinterest HTTP ${response.status}, code ${r?.code ?? 'unknown'}: ${String(r?.message || 'request failed').slice(0, 200)}`);
        return { data: r.data, bookmark: r.bookmark };
      }, { name, action, options, headers });
      return result;
    };
    return { browser, page, user, resource,
      api: async (action, url, data) => (await resource('ApiResource', action, { url, data })).data };
  } catch (error) {
    await browser.disconnect(); throw error;
  }
}

async function boardPins(client, boardId) {
  const pins = [], seen = new Set();
  let bookmark;
  for (let i = 0; i < 100; i++) {
    const result = await client.resource('BoardFeedResource', 'get', {
      board_id: boardId, field_set_key: 'react_grid_pin', page_size: 100,
      ...(bookmark ? { bookmarks: [bookmark] } : {})
    });
    if (!Array.isArray(result.data)) throw new Error('Unexpected board feed');
    pins.push(...result.data.filter(pin => pin.type === 'pin' || pin.id));
    if (!result.data.length || !result.bookmark || result.bookmark === '-end-') return pins;
    if (seen.has(result.bookmark)) throw new Error('Board pagination repeated; refusing incomplete duplicate check');
    seen.add(result.bookmark); bookmark = result.bookmark;
  }
  throw new Error('Board pagination limit reached');
}

async function publish(client, pin, boardId, media, beforeCreate) {
  const key = crypto.randomUUID();
  const registered = await client.api('create', '/v3/media/uploads/register/batch/', {
    media_info_list: JSON.stringify([{ id: key, media_type: 'image-story-pin' }])
  });
  const upload = registered?.[key];
  if (!upload?.upload_id || !upload.upload_parameters || !upload.upload_url) throw new Error('Invalid upload registration');
  const url = new URL(upload.upload_url);
  if (url.protocol !== 'https:' || !/^pinterest-media-upload\.s3[.-][a-z0-9.-]*amazonaws\.com$/.test(url.hostname)) throw new Error('Unexpected Pinterest upload host');
  const form = new FormData();
  for (const [k, v] of Object.entries(upload.upload_parameters)) form.append(k, v);
  form.append('file', new Blob([media.bytes], { type: 'image/png' }), path.basename(pin.image));
  const response = await fetch(url, { method: 'POST', body: form, signal: AbortSignal.timeout(60000), redirect: 'error' });
  if (!response.ok) throw new Error(`Image upload HTTP ${response.status}`);
  let image;
  for (let i = 0; i < 30; i++) {
    image = (await client.api('get', '/v3/media/uploads/', { upload_ids: [upload.upload_id] }))?.[upload.upload_id];
    if (image?.status === 'succeeded' && image.signature) break;
    if (image?.failure_code || image?.status === 'failed') throw new Error('Pinterest rejected image upload');
    await sleep(1000);
  }
  if (image?.status !== 'succeeded' || !image.signature) throw new Error('Image processing timed out');
  const story = { metadata: { pin_title: pin.title, pin_image_signature: image.signature, canvas_aspect_ratio: media.width / media.height },
    pages: [{ blocks: [{ block_style: { height: 100, width: 100, x_coord: 0, y_coord: 0 },
      image_signature: image.signature, tracking_id: upload.upload_id, type: 2 }],
    clips: [{ clip_type: 0, end_time_ms: -1, is_converted_from_image: false, source_media_height: media.height,
      source_media_width: media.width, start_time_ms: -1 }], layout: 0, style: { background_color: '#ffffff' } }] };
  beforeCreate(); // Only the pin-creation POST can leave an uncertain publication.
  return client.api('create', '/v3/storypins/', { alt_text: '', allow_shopping_rec: true, board_id: boardId,
    description: pin.desc, fields: ['pin.id', 'pin.image_signature', 'pin.image_square_url', 'pin.story_pin_data_id'],
    is_comments_allowed: true, is_unified_builder: true, link: pin.link, method: 'uploaded',
    story_pin: JSON.stringify(story), user_mention_tags: '[]' });
}

async function main(argv) {
  const opt = args(argv);
  if (opt.help) { console.log(fs.readFileSync(__filename, 'utf8').split('/**')[1].split('*/')[0].replace(/^ \* ?/gm, '').trim()); return; }
  if (opt.count > 1) {
    const one = argv.filter((arg, i) => arg !== '--count' && argv[i - 1] !== '--count');
    for (let i = 0; i < opt.count; i++) await main(one); // Stop on first failure, no retries.
    return;
  }
  const plan = loadPlan(opt.kind);
  fs.mkdirSync(STATE, { recursive: true, mode: 0o700 });
  const lock = path.join(STATE, 'lock');
  const fd = fs.openSync(lock, 'wx', 0o600); // Atomic lock, never steal another run's lock.
  fs.writeSync(fd, String(process.pid));
  let client;
  try {
    client = await connect(opt.browserUrl);
    if (opt.account && client.user.username !== opt.account) throw new Error(`Wrong Pinterest account; expected ${opt.account}`);
    const boards = (await client.resource('BoardPickerBoardsResource', 'get', {
      field_set_key: 'board_picker', filter: 'all', orbac_subject_id: '', username: client.user.id
    })).data;
    const matches = boards?.all_boards?.filter(b => b.name === opt.board || b.id === opt.board);
    if (matches?.length !== 1) throw new Error('Choose one existing board using --board');
    const board = matches[0];
    const pins = await boardPins(client, board.id);
    const pin = opt.next ? plan.find(p => {
      const file = recordPath(client.user.id, board.id, p.campaign);
      const record = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
      return fs.existsSync(p.image) && record?.status !== 'verified' && !pins.some(q => samePin(q, p));
    }) : plan.find(p => p.campaign === opt.id);
    if (!pin) {
      if (opt.next && opt['allow-empty']) return print({ status: 'queue-empty', kind: opt.kind });
      throw new Error('No matching/unpublished pin in plan');
    }
    const recordFile = recordPath(client.user.id, board.id, pin.campaign);
    const prior = fs.existsSync(recordFile) ? JSON.parse(fs.readFileSync(recordFile, 'utf8')) : null;
    const existing = pins.find(q => samePin(q, pin));
    if (existing) {
      if (opt['trash-published']) {
        const confirmed = (await client.resource('PinResource', 'get', { id: existing.id, field_set_key: 'detailed' })).data;
        if (confirmed?.title !== pin.title || confirmed?.link !== pin.link || confirmed?.board?.id !== board.id) throw new Error('Existing pin mismatch; PNG preserved');
        const state = { ...prior, status: 'verified', campaign: pin.campaign, account: client.user.username,
          boardId: board.id, pinId: existing.id, title: pin.title, link: pin.link, verified: new Date().toISOString() };
        save(recordFile, state); trashPublished(pin, recordFile, state);
      }
      return print({ status: 'already-published', campaign: pin.campaign, url: `https://ru.pinterest.com/pin/${existing.id}/` });
    }
    if (prior && prior.status !== 'preparing') throw new Error(`Previous attempt ${prior.status}; reconcile it before another publication`);
    // Any uncertain POST on this account/board blocks a different card too.
    const uncertain = fs.readdirSync(STATE).filter(n => /^[a-f0-9]{64}\.json$/.test(n))
      .map(n => JSON.parse(fs.readFileSync(path.join(STATE, n), 'utf8')))
      .find(r => r.account === client.user.username && r.boardId === board.id && !['verified', 'preparing'].includes(r.status));
    if (uncertain) throw new Error(`Uncertain publication ${uncertain.campaign}; reconcile before publishing`);
    const media = validate(pin);
    if (!opt.publish) return print({ status: 'ready', account: client.user.username, campaign: pin.campaign,
      title: pin.title, board: board.name, image: pin.image, link: pin.link, width: media.width, height: media.height });
    const state = { status: 'preparing', campaign: pin.campaign, account: client.user.username,
      boardId: board.id, title: pin.title, link: pin.link, started: new Date().toISOString() };
    if (opt.daily) state.dailyDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow',
      year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    // Persist before ANY upload/publish mutation. Never blindly repeat uncertain work.
    save(recordFile, state);
    const result = await publish(client, pin, board.id, media, () => {
      state.status = 'attempting'; save(recordFile, state);
    });
    if (!result?.id || !/^\d+$/.test(result.id)) throw new Error('Publish returned no pin ID; reconcile before retry');
    Object.assign(state, { status: 'created-unverified', pinId: result.id }); save(recordFile, state);
    for (let i = 0; i < 6; i++) {
      const confirmed = (await client.resource('PinResource', 'get', { id: result.id, field_set_key: 'detailed' })).data;
      if (confirmed?.id === result.id && confirmed.title === pin.title && confirmed.link === pin.link && confirmed.board?.id === board.id) {
        Object.assign(state, { status: 'verified', verified: new Date().toISOString() }); save(recordFile, state);
        if (opt['trash-published']) trashPublished(pin, recordFile, state);
        return print({ status: 'published-verified', campaign: pin.campaign, board: board.name,
          url: `https://ru.pinterest.com/pin/${result.id}/` });
      }
      await sleep(1000);
    }
    throw new Error(`Pin ${result.id} created but verification incomplete; no retry`);
  } finally {
    if (client) await client.browser.disconnect();
    fs.closeSync(fd); fs.unlinkSync(lock);
  }
}

module.exports = { args, loadPlan, validate, samePin, main, trashPublished, recordPath };
if (require.main === module) main(process.argv.slice(2)).catch(error => { print({ status: 'error', message: error.message }); process.exitCode = 1; });
