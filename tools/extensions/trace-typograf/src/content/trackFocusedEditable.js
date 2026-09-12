// Клик по иконке расширения открывает попап отдельным окном — фокус страницы
// при этом визуально может остаться на том же поле, но полагаться на это не
// всегда безопасно. Поэтому параллельно с document.activeElement держим
// "последний реально сфокусированный редактируемый элемент" этого документа:
// contentEntry.js берёт document.activeElement, если он всё ещё редактируемый,
// и только иначе — этот запасной вариант.
let lastFocusedEditable = null;

document.addEventListener('focusin', (e) => {
  if (isEditableElement(e.target)) lastFocusedEditable = e.target;
}, true);

function getLastFocusedEditable() {
  return lastFocusedEditable;
}
