// Применяет hunks к contenteditable-корню через Selection + execCommand,
// а не прямой перезаписью innerHTML/textContent. Это даёт форматирование
// "бесплатно" — insertText на выделенном Range меняет только содержимое
// этого Range, окружающие теги (<b>, <i>, ссылки) остаются нетронутыми, и
// редактор получает нативные input-события, на которые завязан рич-текст-
// движок Taptop/Tilda (то же требование, что "сохранять форматирование
// через diff", которое в Figma-плагине решает посимвольный patch text-нод).
//
// Hunks идут от конца текста к началу: DOM-правка одного hunk'а меняет
// положение узлов ПОСЛЕ него, но не офсеты узлов ДО него — карта офсетов
// строится один раз и остаётся валидной для всех ещё не обработанных
// (более ранних) hunks.
function applyHunksToContentEditable(root, hunks) {
  if (!hunks.length) return;
  root.focus();
  const map = buildTextNodeOffsetMap(root);
  const sel = window.getSelection();

  for (const hunk of [...hunks].reverse()) {
    const range = rangeFromOffsets(root, map, hunk.oldStart, hunk.oldEnd);
    sel.removeAllRanges();
    sel.addRange(range);
    if (hunk.newText) {
      document.execCommand('insertText', false, hunk.newText);
    } else {
      document.execCommand('delete', false, null);
    }
  }

  // Курсор — в конец, самое предсказуемое место после массовой правки.
  const endRange = document.createRange();
  endRange.selectNodeContents(root);
  endRange.collapse(false);
  sel.removeAllRanges();
  sel.addRange(endRange);
}
