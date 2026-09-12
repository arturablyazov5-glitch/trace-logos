// Группирует edit-script Myers-диффа в блоки правок: каждый hunk — это
// непрерывный прогон delete/insert-операций, представленный как "заменить
// [oldStart, oldEnd) старой строки на newText". Прогоны 'equal' в hunks не
// попадают — за них offset'ы просто сдвигаются.
function diffToHunks(ops) {
  const hunks = [];
  let oldPos = 0;
  let i = 0;
  while (i < ops.length) {
    if (ops[i].type === 'equal') {
      oldPos++;
      i++;
      continue;
    }
    const oldStart = oldPos;
    let newText = '';
    while (i < ops.length && ops[i].type !== 'equal') {
      if (ops[i].type === 'delete') { oldPos++; }
      else { newText += ops[i].ch; }
      i++;
    }
    hunks.push({ oldStart, oldEnd: oldPos, newText });
  }
  return hunks;
}
