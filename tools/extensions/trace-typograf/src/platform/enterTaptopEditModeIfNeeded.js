// Если на Taptop ничего не в редактировании, но есть выбранный слой (клик
// по нему на холсте/в списке слоёв), входим в редактирование текста через
// их API вместо ручного двойного клика — см. taptopApiBridge.js и
// platformMain/taptopMainBridge.js. Возвращает новый document.activeElement
// (поле Draft.js), если получилось, иначе null (слой не текстовый, ничего
// не выбрано, или API недоступен — тогда кнопка ведёт себя как раньше).
//
// Одного setTextEditorMode(true) НЕ хватает: он переключает режим
// редактора, но каретку в поле не ставит — слой остаётся выбранным
// (серая рамка на холсте) вместо редактируемого (синяя), activeElement
// не меняется, и слой молча пропускался. Поэтому дальше идут два
// фолбэка из focusTaptopEditable.js: сначала фокус в смонтированное на
// холсте поле, потом эмуляция клика мышью по нему. Каждый шаг проверяет
// результат тем же waitForStableEditable, ждать полный таймаут на
// заведомо провальном шаге незачем — паузы короткие.
async function enterTaptopEditModeIfNeeded() {
  const res = await callTaptopApi('enter-edit');

  const afterApi = await waitForStableEditable(res.ok ? 1200 : 400);
  if (afterApi) return afterApi;

  console.info('[Trace Typograf] API вошёл в режим текста, но фокуса нет — ставлю фокус в поле на холсте.');
  const afterFocus = await focusTaptopCanvasEditable();
  if (afterFocus) return afterFocus;

  console.info('[Trace Typograf] фокус не поднял редактор — эмулирую клик по полю на холсте.');

  return clickTaptopCanvasEditable();
}
