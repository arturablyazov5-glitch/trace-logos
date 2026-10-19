#!/usr/bin/env node
/** Daily entrypoint. --check launches/checks Yandex and previews the next pin only. */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const { main, loadPlan } = require('./pinterest-publish');
const STATE = path.resolve(__dirname, '../dist/pinterest/.publisher');
const BROWSER = 'http://127.0.0.1:9223';
const PROFILE = path.join(os.homedir(), 'Library/Application Support/CodexBrowsers/yandex-agent-2');
const DAY_LIMIT = 3;
const ACCOUNT = ['--account', 'rafael_mansurov'];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const day = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));

async function browserReady() {
  try {
    const response = await fetch(BROWSER + '/json/list', { signal: AbortSignal.timeout(2000) });
    if (!response.ok) return false;
    return (await response.json()).some(t => t.type === 'page' && t.url.startsWith('https://ru.pinterest.com/'));
  } catch { return false; }
}

async function startYandex() {
  if (await browserReady()) return;
  const log = fs.openSync(path.join(STATE, 'yandex.log'), 'a', 0o600);
  try {
    const child = spawn('/Applications/Yandex.app/Contents/MacOS/Yandex', [
      '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9223',
      `--user-data-dir=${PROFILE}`, '--no-first-run', 'https://ru.pinterest.com/pin-creation-tool/'
    ], { detached: true, stdio: ['ignore', log, log] });
    await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    child.unref();
  } finally { fs.closeSync(log); }
  for (let i = 0; i < 60; i++) { if (await browserReady()) return; await sleep(1000); }
  throw new Error('Yandex debugging profile did not become ready on 9223');
}

function records() {
  return fs.readdirSync(STATE).filter(n => /^[a-f0-9]{64}\.json$/.test(n))
    .map(n => JSON.parse(fs.readFileSync(path.join(STATE, n), 'utf8')));
}

async function daily(argv = []) {
  if (argv.some(a => a !== '--check')) throw new Error('Only --check is supported');
  const check = argv.includes('--check');
  fs.mkdirSync(STATE, { recursive: true, mode: 0o700 });
  const lock = path.join(STATE, 'daily.lock');
  if (fs.existsSync(lock)) {
    const pid = Number(fs.readFileSync(lock, 'utf8'));
    if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('Invalid daily lock; manual inspection required');
    try { process.kill(pid, 0); throw new Error(`Daily publisher is already running (PID ${pid})`); }
    catch (error) { if (error.code !== 'ESRCH') throw error; fs.unlinkSync(lock); }
  }
  const fd = fs.openSync(lock, 'wx', 0o600); fs.writeSync(fd, String(process.pid));
  const today = day(Date.now());
  const logFile = path.join(STATE, `${today}.jsonl`);
  const log = entry => { const line = JSON.stringify({ time: new Date().toISOString(), ...entry }); console.log(line); fs.appendFileSync(logFile, line + '\n', { mode: 0o600 }); };
  try {
    const done = records().filter(r => r.status === 'verified' && r.dailyDate === today).length;
    if (!check && done >= DAY_LIMIT) {
      log({ status: 'daily-limit-reached', publishedToday: done, limit: DAY_LIMIT }); return;
    }
    if (!check) {
      await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(__dirname, 'pinterest-batch.js'), '--refresh'], { stdio: 'inherit' });
        child.once('error', reject);
        child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Pinterest refresh failed: ${code}`)));
      });
    }
    await startYandex();
    if (check) {
      const result = await main(['--next', '--allow-empty', ...ACCOUNT]);
      log({ status: 'check-complete', next: result?.campaign, dailyLimit: DAY_LIMIT, timezone: 'Europe/Moscow' }); return;
    }
    const uncertain = records().filter(r => !['verified', 'preparing'].includes(r.status));
    for (const record of uncertain) {
      const kind = ['batch', 'emoji', 'blog'].find(kind => loadPlan(kind).some(p => p.campaign === record.campaign));
      if (!kind) throw new Error(`Uncertain publication not in plan: ${record.campaign}`);
      // Reconcile against the live board. main refuses another POST if absent.
      await main(['--kind', kind, '--id', record.campaign, '--publish', '--trash-published', ...ACCOUNT]);
    }
    // Finish any interrupted local cleanup before touching another card.
    for (const kind of ['batch', 'emoji', 'blog']) {
      for (const pin of loadPlan(kind)) {
        const r = records().find(r => r.campaign === pin.campaign && r.status === 'verified');
        if (r && fs.existsSync(pin.image)) await main(['--kind', kind, '--id', pin.campaign, '--publish', '--trash-published', ...ACCOUNT]);
      }
    }
    let publishedToday = records().filter(r => r.status === 'verified' && r.dailyDate === today).length;
    let added = 0;
    for (const kind of ['batch', 'emoji', 'blog']) {
      while (publishedToday < DAY_LIMIT) {
        if (day(Date.now()) !== today) throw new Error('Date changed during run; stop until next scheduled run');
        const result = await main(['--kind', kind, '--next', '--allow-empty', '--publish', '--trash-published', '--daily', ...ACCOUNT]);
        if (result.status === 'queue-empty') break;
        if (result.status !== 'published-verified') throw new Error('Unexpected publisher outcome');
        publishedToday++; added++;
        log({ status: 'card-published', ...result, publishedToday });
        if (publishedToday < DAY_LIMIT) await sleep(2000);
      }
      if (publishedToday >= DAY_LIMIT) break;
    }
    log({ status: 'daily-complete', added, publishedToday, limit: DAY_LIMIT });
  } catch (error) { log({ status: 'daily-failed', message: error.message }); throw error; }
  finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}

module.exports = { daily, day, startYandex };
if (require.main === module) daily(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
