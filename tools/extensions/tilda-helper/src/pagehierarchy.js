// Фича «визуальная иерархия страниц» на странице списка страниц (/projects/…).
//
// В отличие от папок (folders.js), у страниц нет «имени с /» — вложенность
// определяем по URL-пути страницы (текст ссылки в колонке «Ссылка»): страница
// «/office/pyatnitskaya» вложена под «/office», если такая страница есть в
// текущем списке. Визуально — тот же язык, что у папок: отступ + tree-маркер,
// но текст заголовка НЕ трогаем (в отличие от папок, где подпись — это и есть
// путь; у страниц заголовок — обычный человеческий текст, урезать нечего).
// «Кружок» — бейдж-картинка страницы (пустая → рисуется Tilda как круг) —
// у вложенных строк не нужен, прячем как у папок.
//
// Стрелочка сворачивания — инлайн-чип «▾ N» сразу после заголовка страницы
// (внутри `.td-page__td-title-span`), тот же вид, что у папок в folders.js.

const INDENT_STEP = 20;

function injectPageHierarchyStyles() {
  if (document.getElementById('th-pages-style')) return;
  const style = document.createElement('style');
  style.id = 'th-pages-style';
  style.textContent = `
    /* Мы сами переставляем строки под дерево — родной drag-handle сортировки
       вводит в заблуждение (перетаскивание им конфликтует с нашим порядком). */
    .td-page-page .td-page__td-sort-handler {
      display: none;
    }
    .th-page-nested .td-page__td-title-span {
      padding-left: var(--th-pad, 20px);
      position: relative;
    }
    .th-page-nested .td-page__td-title-span::before {
      content: '';
      position: absolute;
      left: calc(var(--th-pad, 20px) - 14px);
      top: 0;
      bottom: 50%;
      width: 8px;
      border-left: 1.5px solid #c9c9c9;
      border-bottom: 1.5px solid #c9c9c9;
      border-bottom-left-radius: 3px;
    }
    .th-page-nested .td-page__img {
      opacity: 0;
    }
    /* Стрелочка сворачивания вложенных страниц — чип «▾ N» (N — число
       детей) сразу после заголовка, как у папок (см. folders.js). Раньше
       была едва заметным шевроном в отдельной ячейке у кнопок. */
    .th-page-toggle {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      height: 22px;
      margin-left: 10px;
      padding: 0 8px 0 4px;
      border: none;
      border-radius: 11px;
      background: #e8e8e8;
      color: #444;
      cursor: pointer;
      vertical-align: middle;
      font: 500 12px/1 Arial, sans-serif;
    }
    .th-page-toggle svg {
      width: 14px;
      height: 14px;
      transition: transform 0.15s ease;
    }
    .th-page-toggle:hover {
      background: #dcdcdc;
      color: #000;
    }
    .th-page-toggle_collapsed svg {
      transform: rotate(-90deg);
    }
    /* Анимация сворачивания вложенных страниц: max-height вместо display:none,
       чтобы строка плавно схлопывалась/разворачивалась. 300px — с запасом выше
       реальной высоты строки страницы (картинка-бейдж + заголовок + кнопки). */
    .td-page.td-page-page {
      overflow: hidden;
      max-height: 300px;
      opacity: 1;
      transition: max-height 0.25s ease, opacity 0.2s ease;
    }
    .th-page-hidden {
      max-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// Полные url-пути страниц, свёрнутых пользователем вручную. Переживает
// перерисовку (тик), сбрасывается только перезагрузкой страницы.
const collapsedPages = new Set();

// Путь страницы читаем из текста ссылки в колонке «Ссылка» (напр.
// «/office/pyatnitskaya») — там же может лежать иконка редактирования ссылки
// (svg без текстовых узлов), поэтому textContent анкора даёт чистый путь.
function readPageUrlPath(row) {
  const a = row.querySelector('.td-page__td-url a');
  if (!a) return '';
  return (a.textContent || '').trim();
}

// Строит дерево страниц по путям: родитель/дети + DFS-последовательность с
// флагом `hidden` (скрыта из-за свёрнутого предка). Страница с одним сегментом
// пути («/office») всегда корень — родителем ей может быть только другая
// страница с точно совпадающим более коротким путём («/office/x» → «/office»),
// а не главная страница сайта («/»).
function computePageSequence(rows) {
  const parsed = rows.map((row) => {
    const raw = readPageUrlPath(row);
    return { row, raw };
  });

  const allByPath = new Map();
  parsed.forEach((p) => {
    if (p.raw && !allByPath.has(p.raw)) allByPath.set(p.raw, p);
  });

  // Родитель — БЛИЖАЙШИЙ существующий предок по префиксу пути, а не строго
  // «на один уровень выше». Так дубли с задвоенным сегментом в URL (Tilda сама
  // так называет копии страниц, напр. «/office/pyatnitskaya/office/pyatnitskaya»
  // у «Copy of ...») всё равно находят реального предка («/office/pyatnitskaya»),
  // даже если непосредственного родителя-страницы с таким URL не существует.
  parsed.forEach((p) => {
    const segments = p.raw.split('/').map((s) => s.trim()).filter(Boolean);
    p.parentPath = null;
    for (let i = segments.length - 1; i >= 1; i -= 1) {
      const candidate = '/' + segments.slice(0, i).join('/');
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
    const childHidden = hiddenByAncestor || collapsedPages.has(item.raw);
    (childrenOf.get(item.raw) || []).forEach((c) => emit(c, depth + 1, childHidden));
  }
  roots.forEach((r) => emit(r, 0, false));

  return { childrenOf, sequence };
}

// Иконка chevron-down из Lucide (lucide.dev) — открытое состояние (▾);
// свёрнутое получаем поворотом на -90deg через CSS (см. th-page-toggle_collapsed).
const CHEVRON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>';

// Создаёт (или обновляет) стрелочку сворачивания — чип «▾ N» внутри подписи
// (`.td-page__td-title-span`), сразу после заголовка, как у папок. Путь
// страницы кладём в dataset и читаем оттуда в обработчике клика — чтобы после
// переименования/пересборки узел, если он переиспользуется, сворачивал
// АКТУАЛЬНУЮ страницу.
function setupPageCollapseToggle(row, raw, childCount) {
  let btn = row.querySelector('.th-page-toggle');
  if (!childCount) {
    if (btn) btn.remove();
    return;
  }
  const span = row.querySelector('.td-page__td-title-span');
  if (!span) return;
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'th-page-toggle';
    btn.innerHTML = CHEVRON_SVG + '<span class="th-page-toggle-count"></span>';
    btn.setAttribute('aria-label', 'Свернуть/развернуть вложенные страницы');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const path = btn.dataset.thPath;
      if (collapsedPages.has(path)) collapsedPages.delete(path);
      else collapsedPages.add(path);
      refreshPageVisibility();
    });
  }
  if (btn.parentElement !== span) span.appendChild(btn);
  btn.querySelector('.th-page-toggle-count').textContent = childCount;
  btn.dataset.thPath = raw;
  btn.classList.toggle('th-page-toggle_collapsed', collapsedPages.has(raw));
}

// Пересчитывает видимость и стрелочки по всем строкам-страницам (используется
// после клика по стрелочке — без полной пересборки/переиндентации).
function refreshPageVisibility() {
  const rows = Array.from(document.querySelectorAll('.td-page.td-page-page'));
  if (!rows.length) return;
  const { childrenOf, sequence } = computePageSequence(rows);
  sequence.forEach(({ item, hidden }) => {
    setupPageCollapseToggle(item.row, item.raw, (childrenOf.get(item.raw) || []).length);
    item.row.classList.toggle('th-page-hidden', hidden);
  });
}

function applyPageHierarchy() {
  // `.td-page-page` — реальные страницы сайта; шапка/подвал — `.td-page` без
  // этого класса, их вложенность не касается.
  const rows = Array.from(document.querySelectorAll('.td-page.td-page-page'));
  if (!rows.length) return;
  if (rows.every((r) => r.dataset.thPageApplied)) return;

  const container = rows[0].parentElement;
  if (!container) return;

  const { childrenOf, sequence } = computePageSequence(rows);

  sequence.forEach(({ item, depth, hidden }) => {
    const span = item.row.querySelector('.td-page__td-title-span');
    const nested = depth > 0;
    item.row.classList.toggle('th-page-nested', nested);
    if (span) {
      if (nested) span.style.setProperty('--th-pad', depth * INDENT_STEP + 'px');
      else span.style.removeProperty('--th-pad');
    }

    setupPageCollapseToggle(item.row, item.raw, (childrenOf.get(item.raw) || []).length);
    item.row.classList.toggle('th-page-hidden', hidden);

    item.row.dataset.thPageApplied = '1';
    container.appendChild(item.row);
  });
}

// Отключаем drag-and-drop страниц по той же причине, что и у папок: физически
// переставляем строки под дерево, и родная сортировка (`.tsort#pagesortable`)
// иначе конфликтовала бы с нашим порядком. Имена глобалов — по аналогии с
// `td__project__switchonSortFolders`/`window.folderSortable` у папок; если у
// Tilda для страниц названия другие, эти проверки — no-op (typeof-guard), само
// приложение дерева при этом не ломается, но drag может конфликтовать с деревом.
let pageDnDoff = false;

function ensurePageDnDoff() {
  if (!pageDnDoff && typeof window.td__project__switchonSortPages === 'function') {
    window.td__project__switchonSortPages = function () {};
    pageDnDoff = true;
  }
  const psl = window.pageSortable;
  if (psl && typeof psl.destroy === 'function') {
    psl.destroy();
    window.pageSortable = null;
  } else if (psl && typeof psl.disable === 'function') {
    psl.disable();
  }
}

// Сигнатура (id + путь) — чтобы заметить переименование ссылки/появление
// новой страницы без перезагрузки и пересобрать дерево.
let pagesSignature = null;

function computePagesSignature() {
  return Array.from(document.querySelectorAll('.td-page.td-page-page'))
    .map((r) => r.id + ':' + readPageUrlPath(r))
    .sort()
    .join('|');
}

function resetPageMarkers() {
  document.querySelectorAll('.td-page.td-page-page').forEach((r) => {
    delete r.dataset.thPageApplied;
  });
}

function tickPages() {
  ensurePageDnDoff();

  const sig = computePagesSignature();
  if (sig !== pagesSignature) {
    pagesSignature = sig;
    resetPageMarkers();
  }

  applyPageHierarchy();
}

export function initPageHierarchy() {
  injectPageHierarchyStyles();
  tickPages();
  setInterval(tickPages, 700);
}
