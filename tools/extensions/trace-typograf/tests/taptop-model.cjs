const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../src/platformMain/taptopTextModel.js'), 'utf8'), context);
function fixture() {
  let selected = ['group'], writes = 0;
  const origins = new Map();
  const nodes = new Map();
  const collection = { data: { list: Array.from({ length: 4 }, (_, i) => ({ text: 'в строке ' + i })) } };
  function node(id, children = [], data, originID = id, path) {
    const origin = origins.get(originID) || { getData: () => data, setData: (_, next) => { data = next; writes++; } };
    origins.set(originID, origin);
    nodes.set(id, { children, originID, getData: origin.getData,
      getDataPath: () => path, setAttr: (_, value) => { collection.data.list[path[3]].text = value; writes++; } });
  }
  node('single', [], { type: 'HTML', value: 'в тексте' });
  node('rich', [], { type: 'RICH_TEXT', value: '<b>в тексте</b><br>' });
  for (let i = 0; i < 4; i++) node('row' + i, [], { type: 'SUBSCRIBE', source: 'context' }, 'template', ['list', 'data', 'list', String(i), 'text']);
  node('alias', [], { type: 'HTML', value: 'ignored' }, 'single');
  node('hidden', ['rich']);
  node('group', ['single', 'hidden', 'row0', 'row1', 'row2', 'row3', 'alias']);
  const store = { tree: { composed: { get: id => nodes.get(id) }, tags: origins, dataCollection: new Map([['list', collection]]) } };
  const model = context.createTaptopTextModel(() => store, () => selected);
  return { model, collection, nodes, select: ids => { selected = ids; }, writes: () => writes };
}
test('collapsed subtree includes rich text and all instances, deduplicates shared storage; collection is read-only', () => {
  const f = fixture(), scope = f.model.collect();
  assert.equal(scope.rows.length, 6); assert.equal(f.writes(), 0);
});
test('selected fourth row writes only its instance', () => {
  const f = fixture(); f.select(['row3']); const scope = f.model.collect();
  const result = f.model.apply({ token: scope.token, rows: [{ key: scope.rows[0].key, value: 'в\u00a0строке 3' }] });
  assert.equal(result.count, 1); assert.equal(f.collection.data.list[0].text, 'в строке 0');
  assert.equal(f.collection.data.list[3].text, 'в\u00a0строке 3');
});
test('single text and multiple overlapping selections stay scoped', () => {
  const f = fixture(); f.select(['single']); assert.equal(f.model.collect().rows.length, 1);
  f.select(['group', 'single', 'row3']); assert.equal(f.model.collect().rows.length, 6);
});
test('no selection never defaults to page', () => {
  const f = fixture(); f.select([]); const s = f.model.collect();
  assert.equal(s.rows.length, 0); assert.equal(f.model.apply({ token: s.token, rows: [] }).count, 0); assert.equal(f.writes(), 0);
});
test('stale selection/text and foreign target fail before writes', () => {
  for (const mode of ['selection', 'text', 'foreign']) {
    const f = fixture(), s = f.model.collect();
    if (mode === 'selection') f.select(['single']);
    if (mode === 'text') f.collection.data.list[3].text = 'changed';
    const rows = s.rows.map(r => ({ ...r, value: 'new' }));
    if (mode === 'foreign') rows.push({ key: 'outside', value: 'new' });
    assert.throws(() => f.model.apply({ token: s.token, rows })); assert.equal(f.writes(), 0);
  }
});
test('changed binding and reused preview are rejected', () => {
  const f = fixture(); f.select(['row3']); const s = f.model.collect();
  f.nodes.get('row3').getDataPath = () => ['list', 'data', 'list', '0', 'text'];
  assert.throws(() => f.model.apply({ token: s.token, rows: s.rows })); assert.equal(f.writes(), 0);
  const g = fixture(), first = g.model.collect(); g.model.collect();
  assert.throws(() => g.model.apply({ token: first.token, rows: [] })); assert.equal(g.writes(), 0);
});
test('rich text writes retain its native data type and unrelated markup', () => {
  const f = fixture(); f.select(['rich']); const s = f.model.collect();
  const value = '<b>в\u00a0тексте</b><br>';
  f.model.apply({ token: s.token, rows: [{ key: s.rows[0].key, value }] });
  assert.equal(f.nodes.get('rich').getData().type, 'RICH_TEXT');
  assert.equal(f.nodes.get('rich').getData().value, value);
});
test('loading content script and unrelated messages never collect or write text', () => {
  const listeners = [];
  const window = {}; window.top = window;
  const document = { get activeElement() { throw new Error('must not inspect selection on load'); } };
  const sandbox = vm.createContext({ window, document, chrome: { runtime: { onMessage: { addListener: fn => listeners.push(fn) } } } });
  const entry = fs.readFileSync(require('node:path').join(__dirname, '../src/content/contentEntry.js'), 'utf8');
  vm.runInContext('(function(){' + entry + '\n})();', sandbox);
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0]({ type: 'OPEN_POPUP' }), false);
  vm.runInContext('(function(){' + entry + '\n})();', sandbox);
  assert.equal(listeners.length, 1, 'reinjection does not register a second writer');
});
