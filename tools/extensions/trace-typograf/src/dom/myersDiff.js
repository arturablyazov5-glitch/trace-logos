// Классический Myers O(ND) diff по символам. Возвращает кратчайший edit-
// script — массив {type: 'equal'|'delete'|'insert', ch} в порядке вывода.
// diffToHunks.js группирует его в блоки удобные для применения к DOM.
function myersDiff(oldStr, newStr) {
  const a = Array.from(oldStr);
  const b = Array.from(newStr);
  const n = a.length;
  const m = b.length;
  const max = n + m;

  if (max === 0) return [];

  const v = new Map([[1, 0]]);
  const trace = [];

  let finalD = -1;
  outer: for (let d = 0; d <= max; d++) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
        x = v.get(k + 1) ?? 0;
      } else {
        x = (v.get(k - 1) ?? 0) + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v.set(k, x);
      if (x >= n && y >= m) { finalD = d; break outer; }
    }
  }

  // Backtrack через сохранённые "фронты" v, восстанавливая путь от (n,m) к (0,0).
  const ops = [];
  let x = n, y = m;
  for (let d = finalD; d > 0; d--) {
    const prevV = trace[d];
    const k = x - y;
    let prevK;
    if (k === -d || (k !== d && (prevV.get(k - 1) ?? 0) < (prevV.get(k + 1) ?? 0))) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = prevV.get(prevK) ?? 0;
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', ch: a[x - 1] });
      x--; y--;
    }
    if (x === prevX) {
      ops.push({ type: 'insert', ch: b[y - 1] });
      y--;
    } else {
      ops.push({ type: 'delete', ch: a[x - 1] });
      x--;
    }
  }
  while (x > 0 && y > 0) {
    ops.push({ type: 'equal', ch: a[x - 1] });
    x--; y--;
  }
  while (x > 0) { ops.push({ type: 'delete', ch: a[x - 1] }); x--; }
  while (y > 0) { ops.push({ type: 'insert', ch: b[y - 1] }); y--; }

  ops.reverse();
  return ops;
}
