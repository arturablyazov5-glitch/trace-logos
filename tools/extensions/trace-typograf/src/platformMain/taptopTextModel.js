// Model scope uses composed children: unlike origin tags, these contain every
// instantiated List row, including collapsed and non-rendered editor layers.
function createTaptopTextModel(getStore, getSelection) {
  let pending = null;
  const array = (value) => value ? Array.from(value) : [];
  function collect() {
    const store = getStore();
    if (!store || !store.tree || !store.tree.composed) throw new Error('Модель Taptop недоступна. Обновите редактор.');
    const roots = [...new Set(getSelection(store).filter(Boolean))].sort();
    const targets = new Map(), unsupported = new Set(), seen = new Set(), stack = roots.slice();
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      const node = store.tree.composed.get(id);
      stack.push(...array(node.children));
      const data = node.getData('text');
      if (!data) continue;
      const origin = store.tree.tags.get(node.originID);
      let target;
      if (data.type === 'HTML' || data.type === 'RICH_TEXT') {
        if (typeof data.value !== 'string') continue;
        target = {
          key: 'tag:' + node.originID, html: true,
          read: () => origin.getData('text').value,
          write: (value) => origin.setData('text', { ...origin.getData('text'), value }),
        };
      } else if (data.type === 'SUBSCRIBE' && data.source === 'context') {
        const path = array(node.getDataPath('text'));
        // CMS/shop references require their own persistence API. Never fall
        // back to writing the shared template or an unresolved binding.
        if (!path.length || !store.tree.dataCollection.get(path[0])) { unsupported.add(id); continue; }
        const read = () => {
          if (JSON.stringify(array(node.getDataPath('text'))) !== JSON.stringify(path)) throw new Error('Привязка текста изменилась. Повторите запуск.');
          let value = store.tree.dataCollection.get(path[0]);
          for (const part of path.slice(1)) value = value == null ? undefined : value[part];
          return value;
        };
        if (typeof read() !== 'string') continue;
        target = { key: 'data:' + JSON.stringify(path), html: /<\/?[a-z][^>]*>/i.test(read()), read,
          write: (value) => node.setAttr('text', value) };
      }
      if (!target && (data.type === 'SUBSCRIBE' || data.type === 'SUBSCRIBE_ITEM')) unsupported.add(id);
      if (target && !targets.has(target.key)) targets.set(target.key, target);
    }
    return { store, roots, targets, unsupported: unsupported.size };
  }
  return {
    collect() {
      const scope = collect();
      const rows = [...scope.targets.values()].map((target) => ({ key: target.key, html: target.html, value: target.read() }));
      pending = { ...scope, rows, token: String(Date.now()) + Math.random() };
      return { ok: true, token: pending.token, rows, unsupported: scope.unsupported };
    },
    apply(payload) {
      const before = pending;
      pending = null;
      if (!before || payload.token !== before.token) throw new Error('Предпросмотр устарел. Повторите запуск.');
      const current = collect();
      if (current.store !== before.store || JSON.stringify(current.roots) !== JSON.stringify(before.roots)
        || JSON.stringify([...current.targets.keys()]) !== JSON.stringify([...before.targets.keys()])) {
        throw new Error('Выделение изменилось. Повторите запуск.');
      }
      for (const row of before.rows) {
        if (current.targets.get(row.key).read() !== row.value) throw new Error('Текст изменился. Повторите запуск.');
      }
      const changes = new Map();
      for (const row of payload.rows || []) {
        if (!current.targets.has(row.key) || typeof row.value !== 'string' || changes.has(row.key)) throw new Error('Некорректная область правки.');
        changes.set(row.key, row.value);
      }
      let count = 0;
      for (const [key, value] of changes) {
        const target = current.targets.get(key);
        if (target.read() === value) continue;
        target.write(value);
        if (target.read() !== value) throw new Error('Редактор не сохранил текст. Повторите запуск.');
        count++;
      }
      return { ok: true, changed: count > 0, count, unsupported: before.unsupported, visited: before.rows.length, entered: before.rows.length, failed: 0, already: 0 };
    },
  };
}
