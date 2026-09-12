// Фолбэк входа в редактирование текста на Taptop, когда их собственный
// API отработал, а фокуса в поле нет.
//
// setTextEditorMode(true) (см. taptopMainBridge.js) переключает РЕЖИМ
// редактора, но не обязан ставить каретку в Draft.js-поле выбранного
// виджета: на холсте это видно как серая рамка выбранного слоя вместо
// синей рамки редактируемого текста, а у нас document.activeElement так
// и остаётся <body> — waitForStableEditable() отдаёт null, и весь слой
// пропускается с «не удалось войти в редактирование». Симптом описан
// пользователем вживую 2026-08-21.
//
// Поэтому после API-вызова мы сами находим смонтированное поле на холсте
// и фокусируемся в него, а если и это не подняло редактор — эмулируем
// клик мышью по нему (Taptop поднимает редактор именно на указательных
// событиях, focus() для React-обвязки не всегда достаточен).
//
// Панели интерфейса исключаем явно: в правой панели «Настройки» и в
// панели слоёв тоже живут редактируемые поля (имя слоя, поле «Текст» —
// видно на скриншоте), и попасть типографикой в них вместо холста —
// не просто промах, а правка не того текста.
const TAPTOP_UI_SELECTOR = '.tt-layers, .tt-panel, .tt-editor-panel, .tt-sidebar, .tt-modal, .tt-popup, .tt-settings, [class*="tt-sidebar"], [class*="tt-settings"]';

function taptopEditableArea(el) {
  const r = el.getBoundingClientRect();
  return r.width * r.height;
}

function findTaptopCanvasEditable() {
  const nodes = Array.from(document.querySelectorAll('[contenteditable="true"], [contenteditable=""]'))
    .filter((el) => el.isContentEditable
      && document.contains(el)
      && !el.closest(TAPTOP_UI_SELECTOR)
      && el.getClientRects().length > 0);
  if (!nodes.length) return null;
  // Обычно смонтированное поле на холсте ровно одно; если Draft.js
  // отрисовал вложенные редактируемые узлы — берём внешний (крупнейший),
  // getEditableRoot() дальше всё равно поднимется до корня.
  return nodes.sort((a, b) => taptopEditableArea(b) - taptopEditableArea(a))[0];
}

async function focusTaptopCanvasEditable() {
  const el = findTaptopCanvasEditable();
  if (!el) return null;
  try {
    el.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  } catch (e) {
    // Ниже всё равно проверяем результат по activeElement.
  }
  return waitForStableEditable(900);
}

function dispatchTaptopPointerClick(el) {
  const r = el.getBoundingClientRect();
  const clientX = r.left + Math.min(8, r.width / 2);
  const clientY = r.top + r.height / 2;
  const base = { bubbles: true, cancelable: true, composed: true, view: window, clientX, clientY, button: 0, buttons: 1 };

  const fire = (Ctor, type, extra) => {
    try { el.dispatchEvent(new Ctor(type, Object.assign({}, base, extra))); } catch (e) { /* нет конструктора — пропускаем */ }
  };

  fire(PointerEvent, 'pointerdown', { pointerType: 'mouse', isPrimary: true });
  fire(MouseEvent, 'mousedown', {});
  fire(PointerEvent, 'pointerup', { pointerType: 'mouse', isPrimary: true, buttons: 0 });
  fire(MouseEvent, 'mouseup', { buttons: 0 });
  fire(MouseEvent, 'click', { buttons: 0, detail: 1 });
}

async function clickTaptopCanvasEditable() {
  const el = findTaptopCanvasEditable();
  if (!el) return null;
  dispatchTaptopPointerClick(el);
  return waitForStableEditable(900);
}
