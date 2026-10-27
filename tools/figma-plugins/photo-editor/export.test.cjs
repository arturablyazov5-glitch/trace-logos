// Run: node --test tools/figma-plugins/photo-editor/export.test.cjs
// Execute production export sections in VM; Figma, canvas and downloads are mocked.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, 'code.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
const section = (s, a, b) => s.slice(s.indexOf(a), s.indexOf(b, s.indexOf(a)));
const tick = () => new Promise(resolve => setImmediate(resolve));
const quiet = { error() {} };
const node = (hash = 'ok', name = 'photo') => ({ name, fills: [{ type: 'IMAGE', imageHash: hash }],
  exportAsync: async () => { if (hash === 'render') throw Error('render'); return new Uint8Array([1]); } });

function main(selection, failAt) {
  const messages = [], rects = [];
  let live = 0, peak = 0;
  const figma = {
    currentPage: { selection, appendChild() { if (failAt === 'append') throw Error('append'); } },
    ui: { postMessage(m) { messages.push(m); } },
    getImageByHash(hash) {
      if (hash === 'missing') return null;
      return { hash, async getSizeAsync() { if (hash === 'size') throw Error('size'); return { width: 8000, height: 6000 }; } };
    },
    createRectangle() {
      live++; peak = Math.max(peak, live);
      const rect = {
        removed: 0,
        resize(w, h) { this.width = w; this.height = h; if (failAt === 'resize') throw Error('resize'); },
        set fills(value) { this.paint = value; if (failAt === 'fills') throw Error('fills'); },
        async exportAsync(options) {
          assert.equal(options.format, 'PNG');
          assert.equal(this.x, 200000); assert.equal(this.y, 200000);
          assert.equal(this.width, 8000); assert.equal(this.height, 6000);
          if (this.paint[0].imageHash === 'render') throw Error('render');
          return new Uint8Array([1]);
        },
        remove() { this.removed++; live--; },
      };
      rects.push(rect); return rect;
    },
  };
  const ctx = vm.createContext({ figma, console: quiet });
  vm.runInContext(section(code, 'function analyzeNode', '// ─── Собственная история') +
    section(code, 'function collectExportableImageNodes', '// Деталка') +
    section(code, 'async function getExportBytes', "  if (msg.type === 'start-crop')") + '\n}', ctx);
  return { ctx, messages, rects, peak: () => peak, live: () => live };
}
async function drain(m) {
  let cursor = 0;
  while (cursor < m.messages.length) {
    const msg = m.messages[cursor++];
    if (msg.type === 'process-export-image') await m.ctx.handleMessage({ type: 'export-image-done', batch: msg.batch, index: msg.index });
  }
}

test('queue: two slots, acknowledgements, stale batch, skips, cleanup; WebP and PNG', async () => {
  for (const mode of ['webp', 'original']) {
    const selection = [node(), node(), node('render'), { name: 'invalid' }, node()];
    const before = JSON.stringify(selection);
    const m = main(selection);
    await m.ctx.handleMessage({ type: 'start-export-' + mode });
    assert.equal(m.ctx.exportBatch.active.size, 2);
    assert.equal(m.messages.filter(x => x.type === 'process-export-image').length, 2);
    await m.ctx.handleMessage({ type: 'export-image-done', batch: -1, index: 0 });
    assert.equal(m.ctx.exportBatch.next, 2);
    await drain(m);
    assert.equal(m.ctx.exportBatch, null);
    assert.equal(m.messages.filter(x => x.type === 'export-complete').length, 1);
    assert.equal(m.messages.filter(x => x.type === 'export-skipped').length, mode === 'webp' ? 1 : 2);
    assert.equal(m.messages[0].total, mode === 'webp' ? 4 : 5);
    assert.equal(m.live(), 0); assert.ok(m.peak() <= 1);
    assert.ok(m.rects.every(r => r.removed === 1));
    assert.equal(JSON.stringify(selection), before);
  }
});

test('PNG rectangle is removed on setup/render errors; missing image/size and all-ineligible finish', async () => {
  for (const failAt of ['append', 'resize', 'fills', undefined]) {
    const m = main([node('render')], failAt);
    await m.ctx.handleMessage({ type: 'start-export-original' });
    assert.equal(m.rects.length, 1); assert.equal(m.rects[0].removed, 1);
    assert.equal(m.live(), 0); assert.equal(m.ctx.exportBatch, null);
    assert.equal(m.messages[1].type, 'export-skipped');
  }
  const m = main([node('missing'), node('size'), { name: 'invalid' }]);
  await m.ctx.handleMessage({ type: 'start-export-original' });
  assert.equal(m.rects.length, 0);
  assert.equal(m.messages.filter(x => x.type === 'export-skipped').length, 3);
  assert.equal(m.messages.at(-1).type, 'export-complete');
});

function ui(mode, total, crop = async bytes => ({ changed: false })) {
  const downloads = [], archives = [], sent = [];
  class Zip {
    constructor() { this.files = []; archives.push(this); }
    file(name, blob) { this.files.push({ name, blob }); }
    async generateAsync(options) { assert.equal(options.compression, 'STORE'); return new Blob(['zip']); }
  }
  const ctx = vm.createContext({ Blob, console: quiet, window: {},
    document: { createElement: () => ({ setAttribute() {} }) },
    exportWebpBtn: { parentNode: { insertAdjacentElement() {} } },
    encodeWebp: async bytes => new Blob([bytes], { type: 'image/webp' }), cropToContent: crop,
    JSZip: Zip, downloadBlob: (blob, name) => downloads.push({ blob, name }),
    parent: { postMessage: ({ pluginMessage }) => sent.push(pluginMessage) },
    fitWindow() {}, setHidden() {}, finishActiveBtn() {}, showError() {},
    doneCount: 0, skipCount: 0, opLabel: 'экспортировано',
  });
  vm.runInContext(section(html, '  function sanitizeFileName', '  // Скачивание без сети') +
    section(html, '  var exportResults =', '  function checkAllDone()') +
    section(html, '  window.onmessage =', '\n})();'), ctx);
  ctx.isExportRun = true; ctx.exportMode = mode;
  const send = msg => ctx.window.onmessage({ data: { pluginMessage: msg } });
  send({ type: 'export-started', mode, batch: 1, total });
  return { ctx, send, downloads, archives, sent };
}

test('UI: single PNG/WebP, multiple ZIP, duplicate names, progress and stale messages', async () => {
  for (const mode of ['webp', 'original-png']) {
    for (const total of [1, 3]) {
      const u = ui(mode, total);
      u.send({ type: 'export-skipped', batch: 99 });
      u.send({ type: 'export-complete', batch: 99 });
      assert.equal(u.ctx.skipCount, 0); assert.equal(u.ctx.isExportRun, true);
      for (let i = total - 1; i >= 0; i--) {
        const msg = { type: 'process-export-image', batch: 1, index: i, name: 'photo', bytes: new Uint8Array([i]) };
        u.send(msg); assert.equal(msg.bytes, null);
      }
      await tick();
      assert.equal(u.ctx.doneCount, total);
      assert.equal(u.sent.filter(x => x.type === 'export-image-done').length, total);
      u.send({ type: 'export-complete', batch: 1 }); await tick();
      const ext = mode === 'webp' ? '.webp' : '.png';
      assert.equal(u.downloads.length, 1);
      assert.equal(u.downloads[0].name, total === 1 ? 'photo' + ext : 'trace-logos-export.zip');
      if (total > 1) {
        assert.deepEqual(u.archives[0].files.map(f => f.name), ['photo' + ext, 'photo (2)' + ext, 'photo (3)' + ext]);
        assert.deepEqual(await Promise.all(u.archives[0].files.map(async f => [...new Uint8Array(await f.blob.arrayBuffer())])), [[0], [1], [2]]);
      }
      assert.equal(u.ctx.exportResults.length, 0);
    }
  }
});

test('UI PNG crop/fallback, ZIP with one success out of multiple, all skipped', async () => {
  for (const [crop, expected] of [[async () => ({ changed: true, bytes: new Uint8Array([9]) }), 9], [async () => { throw Error('decode'); }, 7]]) {
    const u = ui('original-png', 2, crop);
    u.send({ type: 'process-export-image', batch: 1, index: 0, name: 'photo', bytes: new Uint8Array([7]) });
    u.send({ type: 'export-skipped', batch: 1 }); await tick();
    u.send({ type: 'export-complete', batch: 1 }); await tick();
    assert.equal(u.downloads[0].name, 'trace-logos-export.zip');
    assert.equal(u.ctx.skipCount, 1); assert.equal(u.ctx.doneCount, 1);
    const content = new Uint8Array(await u.archives[0].files[0].blob.arrayBuffer());
    assert.equal(content[0], expected);
  }
  const u = ui('original-png', 1);
  u.send({ type: 'export-skipped', batch: 1 }); u.send({ type: 'export-complete', batch: 1 });
  assert.equal(u.downloads.length, 0); assert.equal(u.sent.at(-1).type, 'all-done');
});


test('UI processing failure acknowledges slot; stale async result cannot enter a new batch', async () => {
  const u = ui('webp', 2);
  u.ctx.exportFormats.webp.process = async () => { throw Error('encoding'); };
  u.send({ type: 'process-export-image', batch: 1, index: 0, name: 'bad', bytes: new Uint8Array([1]) });
  await tick();
  assert.equal(u.ctx.skipCount, 1);
  assert.equal(u.sent.at(-1).type, 'export-image-done');
  let resolve;
  u.ctx.exportFormats.webp.process = () => new Promise(r => { resolve = r; });
  u.send({ type: 'process-export-image', batch: 1, index: 1, name: 'late', bytes: new Uint8Array([1]) });
  u.ctx.exportBatch = 2;
  u.send({ type: 'export-started', batch: 1, mode: 'webp', total: 99 });
  assert.equal(u.ctx.exportBatch, 2);
  resolve(new Blob(['old'])); await tick();
  assert.equal(u.ctx.exportResults.length, 0);
  assert.equal(u.ctx.doneCount, 0);
});
