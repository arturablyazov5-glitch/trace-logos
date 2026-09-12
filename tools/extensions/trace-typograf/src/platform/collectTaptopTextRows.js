// Собирает ВСЕ строки-тексты в поддереве панели слоёв Taptop под
// rootItemEl (включая его самого, если он текстовый) — обходом РЕАЛЬНОГО
// DOM панели, а не их внутреннего дерева данных (E.tree). Дерево хранит
// только ОДНО определение шаблона у повторяющихся виджетов (List/Block
// List) — сколько раз он реально отрисован (Item 1, Item 2, ...), в
// дереве не записано никак. Панель слоёв, наоборот, реальный DOM: сколько
// строк "Item" отрисовано — столько их и есть, с настоящими id/суффиксами
// после клика. Обнаружено и проверено вживую 2026-08-10.
//
// Глубина строки — класс "pd-N" на .tt-layers__item (N = уровень
// вложенности). Прямые и все более глубокие потомки идут в DOM ПОСЛЕ
// корня плоским списком (не настоящей вложенностью тегов) — конец
// поддерева опредеояется первой строкой с depth <= depth корня.
function taptopLayerRowDepth(itemEl) {
  const pdClass = [...itemEl.classList].find((c) => /^pd-\d+$/.test(c));
  return pdClass ? parseInt(pdClass.split('-')[1], 10) : null;
}

function isTaptopTextRow(itemEl) {
  const icon = itemEl.querySelector('svg.tt-layers__item__svg');
  return !!(icon && icon.classList.contains('tt-icon--name-medium-widgets-text'));
}

function collectTaptopTextRows(rootItemEl) {
  const rows = [];
  if (isTaptopTextRow(rootItemEl)) rows.push(rootItemEl);

  const rootDepth = taptopLayerRowDepth(rootItemEl);
  const rootDraggable = rootItemEl.closest('.tt-layers__draggable');
  if (rootDepth === null || !rootDraggable) return rows;

  let el = rootDraggable.nextElementSibling;
  while (el) {
    const row = el.querySelector('.tt-layers__item');
    if (!row) break;
    const depth = taptopLayerRowDepth(row);
    if (depth === null || depth <= rootDepth) break; // вышли из поддерева корня
    if (isTaptopTextRow(row)) rows.push(row);
    el = el.nextElementSibling;
  }
  return rows;
}
