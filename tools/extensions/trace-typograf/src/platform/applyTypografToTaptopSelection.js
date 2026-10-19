// Explicit button action only. Batched bridge calls; no layer clicks,
// focus changes, opening editors, or dependency on the visible Layers panel.
function typografTaptopValue(value, html) {
  const format = (text) => typografizeProtected(text, CONTENT_OPTS, [URL_RE, RATIO_TIME_RE]);
  if (!html) return format(value);
  const template = document.createElement('template');
  template.innerHTML = value;
  // Process continuous inline runs, not individual nodes: formatting a node
  // containing only "в " would otherwise trim its trailing space and join words.
  let run = [], changed = false;
  function flush() {
    if (!run.length) return;
    let offset = 0;
    const map = run.map((node) => {
      const entry = { node, start: offset, end: offset + node.nodeValue.length };
      offset = entry.end;
      return entry;
    });
    const before = run.map((node) => node.nodeValue).join('');
    const after = format(before);
    if (before !== after) {
      changed = true;
      const hunks = diffToHunks(myersDiff(before, after));
      for (const hunk of hunks.reverse()) {
        const anchor = map.find((entry) => hunk.oldStart >= entry.start && hunk.oldStart < entry.end) || map[map.length - 1];
        for (const entry of map) {
          const start = Math.max(hunk.oldStart, entry.start) - entry.start;
          const end = Math.min(hunk.oldEnd, entry.end) - entry.start;
          if (end > start) entry.node.nodeValue = entry.node.nodeValue.slice(0, start) + entry.node.nodeValue.slice(end);
        }
        const at = hunk.oldStart - anchor.start;
        anchor.node.nodeValue = anchor.node.nodeValue.slice(0, at) + hunk.newText + anchor.node.nodeValue.slice(at);
      }
    }
    run = [];
  }
  function walk(parent) {
    for (const node of parent.childNodes) {
      if (node.nodeType === 3) { run.push(node); continue; }
      if (node.nodeType !== 1) continue;
      if (node.matches('script,style,code,pre,[contenteditable="false"]')) { flush(); continue; }
      const boundary = node.matches('br,p,div,h1,h2,h3,h4,h5,h6,li,ul,ol,blockquote,table,tr,td,th,section');
      if (boundary) flush();
      walk(node);
      if (boundary) flush();
    }
  }
  walk(template.content);
  flush();
  // Entity spelling must not leak into bound radio labels/values.
  return changed ? template.innerHTML.replace(/&nbsp;/g, '\u00a0') : value;
}

async function applyTypografToTaptopSelection(onProgress) {
  // Commit the active native editor once before snapshotting its model.
  // Otherwise a pending Draft/ProseMirror onChange can overwrite our changes.
  const commit = await callTaptopApi('exit-edit');
  if (!commit.ok) throw new Error('Не удалось завершить редактирование текста.');
  await new Promise((resolve) => setTimeout(resolve, 250));
  const scope = await callTaptopApi('collect-texts', null, 10000);
  if (!scope.ok) throw new Error(scope.message || 'Не удалось прочитать выделение. Обновите редактор.');
  if (onProgress) onProgress(0, scope.rows.length, 'Обрабатываю выбранные тексты');
  const rows = scope.rows.map((row) => ({ key: row.key, value: typografTaptopValue(row.value, row.html) }));
  const result = await callTaptopApi('apply-texts', { token: scope.token, rows }, 10000);
  if (!result.ok) throw new Error(result.message || 'Не удалось сохранить текст.');
  return result;
}
