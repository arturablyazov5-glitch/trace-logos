// Фича «визуальная иерархия» в выпадающем меню страниц редактора (кнопка-
// хлебная крошка с текущей страницей в шапке /page/-редактора открывает
// `.tp-menu__dropdown_menu` → `.tc-treelist__*`). Это ДРУГАЯ разметка Tilda,
// не связанная с /projects/ (folders.js / pagehierarchy.js) — здесь свой модуль.
//
// Два уровня вложенности, оба строятся так же, как в /projects/:
//  1. Папки (`.tc-treelist__pagelist__folder`) — заголовок содержит путь через
//     « / » (напр. «RU / Офисные резиденции / Пятницкая») → вкладываем блок
//     папки под блок с более коротким совпадающим путём.
//  2. Страницы (`.tc-treelist__page`) — вложенность по ГОТОВОМУ атрибуту
//     `data-url` (без ведущего «/», напр. «office/pyatnitskaya») — читать текст
//     ссылки не нужно, в отличие от /projects/. Каждый контейнер страниц
//     (список конкретной папки ИЛИ корневой список без папки) обрабатывается
//     как своя независимая область вложенности.
//
// Выпадашка открывается по клику и может пересобираться Tilda — пересчитываем
// идемпотентно на каждом тике. Подпапки показываются/прячутся РОДНОЙ
// стрелочкой папки (вместе с её страницами); чипы «▾ N» есть только у
// страниц, их состояние живёт, пока дропдаун открыт.

const INDENT_STEP = 20;

// Транзишн max-height работает только между двумя конкретными px-значениями:
// прыжок 9999px → 0 (или наоборот) визуально даёт «дыру» — opacity гаснет за
// 0.2s, а max-height едет по всему диапазону 0.25s, и в разнице между этими
// длительностями видна пустая коробка. Чтобы анимация была плавной при ЛЮБОЙ
// глубине вложенности, держим max-height равным РЕАЛЬНОЙ высоте контента
// (scrollHeight не зависит от текущего клипа overflow:hidden, поэтому читается
// корректно даже пока строка ещё схлопнута/раскрыта).
function syncRowMaxHeight(row, hidden) {
  if (hidden) {
    row.style.removeProperty('max-height');
  } else {
    row.style.maxHeight = row.scrollHeight + 'px';
  }
}

const CHEVRON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>';

function injectTreelistStyles() {
  if (document.getElementById('th-treelist-style')) return;
  const style = document.createElement('style');
  style.id = 'th-treelist-style';
  style.textContent = `
    .th-tl-folder-nested {
      margin-left: var(--th-tl-pad, 20px);
    }
    .th-tl-folder-nested > .tc-treelist__folder__title-wrapper {
      position: relative;
    }
    .th-tl-folder-nested > .tc-treelist__folder__title-wrapper::before {
      content: '';
      position: absolute;
      left: -14px;
      top: 0;
      bottom: 50%;
      width: 8px;
      border-left: 1.5px solid #c9c9c9;
      border-bottom: 1.5px solid #c9c9c9;
      border-bottom-left-radius: 3px;
    }
    /* Иконка папки — это ::before на .tc-treelist__folder__title (не фон и не
       отдельный div). У вложенной папки прячем. */
    .th-tl-folder-nested .tc-treelist__folder__title::before {
      content: none !important;
    }
    .th-tl-page-nested .tc-treelist__page__icon {
      opacity: 0;
    }
    .th-tl-page-nested .tc-treelist__page__name {
      padding-left: var(--th-tl-pad, 20px);
      position: relative;
    }
    .th-tl-page-nested .tc-treelist__page__name::before {
      content: '';
      position: absolute;
      left: calc(var(--th-tl-pad, 20px) - 14px);
      top: 0;
      bottom: 50%;
      width: 8px;
      border-left: 1.5px solid #c9c9c9;
      border-bottom: 1.5px solid #c9c9c9;
      border-bottom-left-radius: 3px;
    }
    .tc-treelist__folder__title-wrapper,
    .tc-treelist__page {
      position: relative;
    }
    /* Стрелочка сворачивания — чип «▾ N» (N — число вложенных) сразу после
       названия, как у папок/страниц в /projects/, только компактнее под
       размер дропдауна. Раньше был едва заметный шеврон у правого края. */
    .th-tl-toggle {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      height: 18px;
      margin-left: 8px;
      padding: 0 7px 0 3px;
      border: none;
      border-radius: 9px;
      background: #e8e8e8;
      color: #444;
      cursor: pointer;
      vertical-align: middle;
      flex: 0 0 auto;
      font: 500 11px/1 Arial, sans-serif;
    }
    .th-tl-toggle svg {
      width: 12px;
      height: 12px;
      transition: transform 0.15s ease;
    }
    .th-tl-toggle:hover {
      background: #dcdcdc;
      color: #000;
    }
    .th-tl-toggle_collapsed svg {
      transform: rotate(-90deg);
    }
    /* Анимация схлопывания — max-height вместо display:none. */
    .tc-treelist__pagelist__folder,
    .tc-treelist__page {
      overflow: hidden;
      max-height: 9999px;
      opacity: 1;
      transition: max-height 0.25s ease, opacity 0.2s ease;
    }
    .th-tl-hidden {
      max-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none;
    }
    /* Разделительные линии между группами:
       папки → страницы, страницы → Header/Footer, → Header/Footer [Каталог]
       (служебная строка-хедер после другой служебной), → страница 404.
       Линия рисуется ::before НАД строкой (в зоне margin), а не border'ом —
       иначе фон подсветки активной страницы (_current) упирался бы в линию.
       Эти строки — всегда корневые (не вложенные), th-tl-hidden к ним не
       применяется, поэтому overflow:visible безопасен. */
    .tc-treelist__pagelist__folder + .tc-treelist__page,
    .tc-treelist__page:not(.js-treelist-special-page) + .js-treelist-special-page,
    .js-treelist-special-page + .js-treelist-special-page:has(.tc-treelist__page__icon_header),
    .js-treelist-special-page + .js-treelist-special-page:has(.tc-treelist__page__icon_404) {
      margin-top: 21px;
      overflow: visible;
    }
    .tc-treelist__pagelist__folder + .tc-treelist__page::before,
    .tc-treelist__page:not(.js-treelist-special-page) + .js-treelist-special-page::before,
    .js-treelist-special-page + .js-treelist-special-page:has(.tc-treelist__page__icon_header)::before,
    .js-treelist-special-page + .js-treelist-special-page:has(.tc-treelist__page__icon_404)::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: -11px;
      border-top: 1px solid #e5e5e5;
    }
    .tc-treelist__page.tc-treelist__sort__item.tc-treelist__page_current.tc-treelist__page_changed {
      border-radius: 8px;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// Множество ключей свёрнутых СТРАНИЦ (чипы «▾ N») — сбрасывается само собой,
// когда дропдаун пересобирается/закрывается. У папок своего чипа нет:
// подпапки показываются/прячутся вместе со страницами по РОДНОЙ стрелочке
// папки (tc-treelist__arrow_opened — см. folderExpanded).
const collapsedTl = new Set();

// Развёрнута ли папка её родной стрелочкой.
function folderExpanded(row) {
  return !!row.querySelector(
    ':scope > .tc-treelist__folder__title-wrapper .tc-treelist__arrow_opened'
  );
}

function splitPath(raw) {
  return raw.split('/').map((s) => s.trim()).filter(Boolean);
}

// Чип «▾ N» сворачивания вложенных СТРАНИЦ. hostEl — <a> заголовка страницы,
// чип встаёт сразу после имени. У папок чипа нет (см. folderExpanded).
function setupTlToggle(hostEl, key, childCount, onRefresh) {
  let btn = hostEl.querySelector(':scope > .th-tl-toggle');
  if (!childCount) {
    if (btn) btn.remove();
    return;
  }
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'th-tl-toggle';
    btn.innerHTML = CHEVRON_SVG + '<span class="th-tl-toggle-count"></span>';
    btn.setAttribute('aria-label', 'Свернуть/развернуть');
    // Строки draggable — mousedown глушим, чтобы клик не начинал drag.
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const k = btn.dataset.thKey;
      if (collapsedTl.has(k)) collapsedTl.delete(k);
      else collapsedTl.add(k);
      onRefresh();
    });
    hostEl.appendChild(btn);
  }
  btn.querySelector('.th-tl-toggle-count').textContent = childCount;
  btn.dataset.thKey = key;
  btn.classList.toggle('th-tl-toggle_collapsed', collapsedTl.has(key));
}

// Строит дерево папок (по заголовку с « / ») из плоского списка
// `.tc-treelist__pagelist__folder`.
function computeFolderTree(folderRows) {
  const parsed = folderRows.map((row) => {
    // Полный путь читаем из dataset, если уже сохранён — сам заголовок в DOM
    // мы переписываем на leaf (см. applyFolderTree), поэтому его текст после
    // первого прохода уже не несёт полный путь.
    const titleEl = row.querySelector('.tc-treelist__folder__title');
    const domText = titleEl ? titleEl.textContent.trim() : '';
    const raw = row.dataset.thFullTitle || domText;
    row.dataset.thFullTitle = raw;
    const parts = splitPath(raw);
    return {
      row,
      raw,
      depth0: parts.length - 1,
      parentPath: parts.length > 1 ? parts.slice(0, -1).join(' / ') : null,
      leaf: parts[parts.length - 1] || raw,
    };
  });

  const allByName = new Map();
  parsed.forEach((p) => {
    if (p.raw && !allByName.has(p.raw)) allByName.set(p.raw, p);
  });

  const childrenOf = new Map();
  const roots = [];
  parsed.forEach((p) => {
    if (p.parentPath && allByName.has(p.parentPath)) {
      if (!childrenOf.has(p.parentPath)) childrenOf.set(p.parentPath, []);
      childrenOf.get(p.parentPath).push(p);
    } else {
      roots.push(p);
    }
  });

  const sequence = [];
  const visited = new Set();
  function emit(item, depth, hiddenByAncestor) {
    if (visited.has(item)) return;
    visited.add(item);
    sequence.push({ item, depth, hidden: hiddenByAncestor });
    // Подпапки видны, только когда папка развёрнута родной стрелочкой
    // (вместе с её страницами).
    const childHidden = hiddenByAncestor || !folderExpanded(item.row);
    (childrenOf.get(item.raw) || []).forEach((c) => emit(c, depth + 1, childHidden));
  }
  roots.forEach((r) => emit(r, 0, false));

  return { childrenOf, sequence };
}

// Строит дерево страниц ПО `data-url` (готовый атрибут — не нужно парсить
// текст ссылки, в отличие от /projects/) в границах одного контейнера
// (страницы одной папки ИЛИ корневой список без папки).
function computePageTree(pageRows) {
  const parsed = pageRows.map((row) => ({ row, raw: row.dataset.url || '' }));

  const allByPath = new Map();
  parsed.forEach((p) => {
    if (p.raw && !allByPath.has(p.raw)) allByPath.set(p.raw, p);
  });

  // Ближайший существующий предок по префиксу — не только прямой родитель
  // (устойчиво к дублям/копиям страниц с задвоенным сегментом в URL).
  parsed.forEach((p) => {
    const segments = p.raw.split('/').map((s) => s.trim()).filter(Boolean);
    p.parentPath = null;
    for (let i = segments.length - 1; i >= 1; i -= 1) {
      const candidate = segments.slice(0, i).join('/');
      if (allByPath.has(candidate) && candidate !== p.raw) {
        p.parentPath = candidate;
        break;
      }
    }
  });

  const childrenOf = new Map();
  const roots = [];
  parsed.forEach((p) => {
    if (p.parentPath) {
      if (!childrenOf.has(p.parentPath)) childrenOf.set(p.parentPath, []);
      childrenOf.get(p.parentPath).push(p);
    } else {
      roots.push(p);
    }
  });

  const sequence = [];
  const visited = new Set();
  function emit(item, depth, hiddenByAncestor) {
    if (visited.has(item)) return;
    visited.add(item);
    sequence.push({ item, depth, hidden: hiddenByAncestor });
    const childHidden = hiddenByAncestor || (item.raw && collapsedTl.has('p:' + item.raw));
    (childrenOf.get(item.raw) || []).forEach((c) => emit(c, depth + 1, childHidden));
  }
  roots.forEach((r) => emit(r, 0, false));

  return { childrenOf, sequence };
}

// Переставляет строки в порядке `orderedRows` перед `anchor` (anchor === null
// эквивалентно appendChild) — не трогая другой «хвостовой» контент контейнера
// (сообщение «страниц нет», drag-хелперы, корневой список страниц и т.д.).
function reorderInto(container, orderedRows, anchor) {
  orderedRows.forEach((row) => container.insertBefore(row, anchor));
}

// Лёгкий пересчёт видимости страниц в контейнере (используется кликом по
// стрелочке) — НЕ переставляет DOM и не переписывает подписи, только
// class-тогглы (classList.toggle с уже совпадающим значением не мутирует
// атрибут, поэтому это не «мигает» в DevTools в отличие от полной пересборки).
function refreshPageVisibilityInScope(container) {
  const rows = Array.from(container.querySelectorAll(':scope > .tc-treelist__page'));
  if (!rows.length) return;
  const { sequence } = computePageTree(rows);
  sequence.forEach(({ item, hidden }) => {
    item.row.classList.toggle('th-tl-hidden', hidden);
    syncRowMaxHeight(item.row, hidden);
    const btn = item.row.querySelector(':scope > .tc-treelist__page__title > .th-tl-toggle');
    if (btn) btn.classList.toggle('th-tl-toggle_collapsed', !!item.raw && collapsedTl.has('p:' + item.raw));
  });
}

// Полная пересборка (подписи, вложенность, порядок в DOM) — только один раз
// на набор строк: как только все строки помечены `thTlApplied`, дальше эта
// функция не трогает DOM вообще (иначе insertBefore на КАЖДОМ тике 700мс
// «мигал» бы в DevTools, даже если итоговый порядок не менялся).
function applyPageTreeInScope(container) {
  const rows = Array.from(container.querySelectorAll(':scope > .tc-treelist__page'));
  if (!rows.length) return;
  if (rows.every((r) => r.dataset.thTlApplied)) return;

  const { childrenOf, sequence } = computePageTree(rows);
  const anchor = container.querySelector(':scope > .tc-treelist__folder__no-pages, :scope > .tc-treelist__pagelist__no-pages') || null;
  const ordered = [];

  sequence.forEach(({ item, depth, hidden }) => {
    const nested = depth > 0;
    item.row.classList.toggle('th-tl-page-nested', nested);
    if (nested) item.row.style.setProperty('--th-tl-pad', depth * INDENT_STEP + 'px');
    else item.row.style.removeProperty('--th-tl-pad');

    const childCount = item.raw ? (childrenOf.get(item.raw) || []).length : 0;
    const titleLink = item.row.querySelector(':scope > .tc-treelist__page__title');
    if (titleLink) {
      setupTlToggle(titleLink, 'p:' + item.raw, childCount, () => refreshPageVisibilityInScope(container));
    }
    item.row.classList.toggle('th-tl-hidden', hidden);
    syncRowMaxHeight(item.row, hidden);

    item.row.dataset.thTlApplied = '1';
    ordered.push(item.row);
  });

  reorderInto(container, ordered, anchor);
}

// Лёгкий пересчёт видимости подпапок по родным стрелочкам (класс-тогглы
// не мутируют атрибут при совпадении — не «мигает»). Зовётся на каждом тике
// и сразу после клика по родной стрелочке (см. hookArrowClicks).
function refreshFolderVisibility(container) {
  const folderRows = Array.from(container.querySelectorAll(':scope > .tc-treelist__pagelist__folder'));
  if (!folderRows.length) return;
  const { sequence } = computeFolderTree(folderRows);
  sequence.forEach(({ item, hidden }) => {
    item.row.classList.toggle('th-tl-hidden', hidden);
    syncRowMaxHeight(item.row, hidden);
  });
}

// Делегированный слушатель на контейнер: клик по родной стрелочке папки →
// пересчёт видимости подпапок сразу (Tilda ставит _opened в своём обработчике,
// поэтому пересчитываем после него, через setTimeout(0)), не дожидаясь тика.
function hookArrowClicks(container) {
  if (container.dataset.thArrowHook) return;
  container.dataset.thArrowHook = '1';
  container.addEventListener('click', (e) => {
    if (!e.target.closest('.tc-treelist__arrow')) return;
    setTimeout(() => refreshFolderVisibility(container), 0);
  });
}

function applyFolderTree(container) {
  const folderRows = Array.from(container.querySelectorAll(':scope > .tc-treelist__pagelist__folder'));
  if (!folderRows.length) return;
  if (folderRows.every((r) => r.dataset.thTlApplied)) return;

  const { childrenOf, sequence } = computeFolderTree(folderRows);
  const anchor = container.querySelector(':scope > .tc-treelist__page, :scope > .tc-treelist__pagelist__no-pages') || null;
  const ordered = [];

  sequence.forEach(({ item, depth, hidden }) => {
    const nested = depth > 0;
    item.row.classList.toggle('th-tl-folder-nested', nested);
    if (nested) item.row.style.setProperty('--th-tl-pad', depth * INDENT_STEP + 'px');
    else item.row.style.removeProperty('--th-tl-pad');

    // Вложенная папка показывает только последний сегмент (родительский путь
    // и так виден по вложенности/отступу) — как в /projects/.
    const titleEl = item.row.querySelector('.tc-treelist__folder__title');
    if (titleEl) {
      titleEl.textContent = nested ? item.leaf : item.raw;
      titleEl.title = item.raw;
    }

    item.row.classList.toggle('th-tl-hidden', hidden);
    syncRowMaxHeight(item.row, hidden);

    item.row.dataset.thTlApplied = '1';
    ordered.push(item.row);
  });

  reorderInto(container, ordered, anchor);
}

function tickTreelist() {
  const containers = document.querySelectorAll('.js-treelist-container');
  if (!containers.length) return;

  injectTreelistStyles();

  containers.forEach((container) => {
    hookArrowClicks(container);
    applyFolderTree(container);
    // Видимость подпапок следует за родными стрелочками — держим актуальной
    // и тиком (на случай, если стрелочку переключил не клик, а сама Tilda).
    refreshFolderVisibility(container);
    applyPageTreeInScope(container);
    container
      .querySelectorAll('.tc-treelist__page-list-folder__pages')
      .forEach((pagesContainer) => applyPageTreeInScope(pagesContainer));
  });
}

export function initTreelistHierarchy() {
  setInterval(tickTreelist, 700);
  tickTreelist();
}
