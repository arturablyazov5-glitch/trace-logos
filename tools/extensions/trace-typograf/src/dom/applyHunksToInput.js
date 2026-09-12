// Применяет hunks к input/textarea через setSelectionRange + execCommand —
// тем же способом, что и для contenteditable (см. applyHunksToContentEditable.js),
// потому что execCommand('insertText', ...) на выделении фокусированного
// поля порождает настоящее trusted input-событие. Это важно для полей,
// управляемых React/Vue (частый случай в конструкторах сайтов): прямая
// запись в el.value такие фреймворки не замечают и следующий ре-рендер
// затирает правку обратно.
function applyHunksToInput(el, hunks) {
  if (!hunks.length) return;
  el.focus();
  for (const hunk of [...hunks].reverse()) {
    el.setSelectionRange(hunk.oldStart, hunk.oldEnd);
    if (hunk.newText) {
      document.execCommand('insertText', false, hunk.newText);
    } else {
      document.execCommand('delete', false, null);
    }
  }
  const end = el.value.length;
  el.setSelectionRange(end, end);
}
