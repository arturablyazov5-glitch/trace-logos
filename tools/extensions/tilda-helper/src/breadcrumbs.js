// Фичи «хлебные крошки» в шапке редактора (/page/?pageid=…). Две штуки:
//
// 1. Крошки страниц-предков. Родная шапка показывает только «Мои сайты /
//    <сайт> / <страница>», хотя страница может быть вложенной по URL (напр.
//    /technic/catalog/test под /technic/catalog) — та же иерархия, что рисует
//    pagehierarchy.js в списке страниц. Достраиваем промежуточные
//    крошки-ссылки на страницы-предки.
//
// 2. Разбиение крошки папки. Вложенность папок кодируется в имени через «/»
//    (см. folders.js), и родная крошка папки рисует ПОЛНЫЙ путь одним текстом
//    («Прошлые туры / Yoga shotы») со ссылкой сразу в глубокую папку. Режем
//    её на отдельные крошки-сегменты: каждый предок, существующий как
//    реальная папка, — ссылка на неё (/projects/?projectid=…&folderid=…),
//    остальные — текст; в родной крошке остаётся последний сегмент (leaf).
//    То же, что linkifyFolderBreadcrumb в folders.js, но для шапки редактора.
//
// Откуда данные: alias текущей страницы — глобал `window.pagealias`
// («technic/catalog/test», без ведущего «/»); список страниц и папок проекта —
// POST /projects/get/getprojects/ c projectid (тот же ajax, которым дашборд
// рисует список страниц; отдаёт pages[] с id/title/alias, csrf не требует).
// Есть ли в его ответе folders[] — не гарантировано, поэтому фолбэк: тянем
// HTML /projects/?projectid=… и парсим инлайновый `folders = […]`, которым
// дашборд сам инициализирует window.folders.
//
// Предки-страницы — ВСЕ существующие страницы-префиксы alias по сегментам (не
// только ближайший, как родитель в pagehierarchy.js): крошки — это цепочка, а
// не одна ступень. Несуществующие промежуточные уровни просто пропускаются.
//
// Данные проекта тянем один раз на загрузку редактора (иерархия меняется
// только со страницы /projects/), а вот вставку в DOM повторяем тиком —
// шапка может пересоздаваться.

// Тот же документ-svg, что у родной крошки текущей страницы.
const PAGE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">' +
  '<path d="M8.05 1H3C2.44772 1 2 1.44772 2 2V13C2 13.5523 2.44771 14 3 14H12C12.5523 14 13 13.5523 ' +
  '13 13V5.5M8.05 1L13 5.5M8.05 1V4.5C8.05 5.05228 8.49772 5.5 9.05 5.5H13M5 8.5H10M5 10.5H10" ' +
  'stroke="black"></path></svg>';

// Тот же документ-svg папки, что у родной крошки папки.
const FOLDER_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">' +
  '<path d="M6.28333 2.90909L5.93247 2.41838C5.74473 2.15581 5.4418 2 5.11901 2H2C1.44772 2 1 ' +
  '2.44772 1 3V11C1 11.5523 1.44772 12 2 12H13C13.5523 12 14 11.5523 14 11V4.68485C14 4.2062 ' +
  '13.612 3.81818 13.1333 3.81818V3.81818M6.28333 2.90909L6.63419 3.3998C6.82193 3.66238 7.12487 ' +
  '3.81818 7.44765 3.81818H13.1333M6.28333 2.90909H12.0689C12.4544 2.90909 12.8057 3.13076 ' +
  '12.9716 3.47881L13.1333 3.81818" stroke="black"></path>' +
  '<path d="M4.00118 8.95402C3.96895 7.66667 4.60279 7 5.43 7C5.93493 7 6.32168 7.17241 7.13815 ' +
  '7.58621C7.73976 7.89655 8.18022 8.12644 8.63143 8.12644C9.06115 8.12644 9.26527 7.74713 ' +
  '9.27602 7.04598H9.9958C10.0603 8.48276 9.3727 9 8.62069 9C8.13725 9 7.70753 8.85057 6.88031 ' +
  '8.43678C6.31093 8.13793 5.87047 7.87356 5.44075 7.87356C5.01102 7.87356 4.74245 8.1954 4.7317 ' +
  '8.97701H4.00118V8.95402Z" fill="black"></path></svg>';

// Страницы-предки текущей: [{id, title}] в порядке от верхнего уровня к
// ближайшему родителю. null — ещё не загружены.
let parentPages = null;

// Данные проекта из getprojects (+ фолбэк для папок): null — ещё не загружены.
let projectPages = null; // pages[] проекта
let foldersData = null; // папки проекта [{id, title}]
let projectDataPromise = null;

// При глубокой вложенности крошки наезжали на переключатель разрешений в
// центре шапки (`.tp-menu__middle` — он спозиционирован независимо и не
// двигается). Число видимых предков подбирается ДИНАМИЧЕСКИ по фактической
// ширине: вставляем всех, меряем перекрытие с центр-блоком и убираем дальних
// в крошку «…» по одному, пока не влезем. «…» открывает родной дропдаун
// списка страниц.
const CRUMB_TEXT_MAX_W = 90; // px, обрезка названия каждой нашей крошки
const FIT_GAP = 16; // минимальный зазор до центр-блока, px

function injectBreadcrumbStyles() {
  if (document.getElementById('th-breadcrumbs-style')) return;
  const style = document.createElement('style');
  style.id = 'th-breadcrumbs-style';
  style.textContent = `
    .th-parent-crumb .tp-menu__item__text {
      max-width: var(--th-crumb-w, 90px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .th-parent-crumb_more .tp-menu__breadcrumbs__item {
      cursor: pointer;
    }
    /* Сегменты разбитой крошки папки (и родная крошка после разбиения) —
       обрезаем длинные имена, полное имя в title. */
    .th-folder-crumb .tp-menu__item__text,
    .th-folder-split .tp-menu__item__text {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* Сегмент без реальной папки-предка — некликабельный текст. */
    span.tp-menu__breadcrumbs__item {
      cursor: default;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// Фолбэк для папок: getprojects может не отдавать folders[] — тогда тянем HTML
// страницы /projects/ (same-origin, сессия юзера) и достаём инлайновый
// `folders = […]`, которым дашборд инициализирует window.folders. null — не нашли.
async function loadFoldersFromProjectsHtml(projectId) {
  const resp = await fetch('/projects/?projectid=' + encodeURIComponent(projectId), {
    credentials: 'same-origin',
  });
  const html = await resp.text();
  const m = html.match(/[^.\w]folders\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1]);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

// Одноразовая загрузка данных проекта (страницы + папки). Зовётся и из
// loadParentPages (инициализация), и лениво из updateFolderBreadcrumbs —
// промис общий, запрос один.
function ensureProjectDataLoaded() {
  if (projectDataPromise) return projectDataPromise;
  const projectId = String(window.projectid || '');
  if (!projectId) return Promise.resolve(); // projectid ещё не появился — позже
  projectDataPromise = (async () => {
    const body = new URLSearchParams();
    body.append('projectid', projectId);
    const resp = await fetch('/projects/get/getprojects/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const data = await resp.json();
    projectPages = Array.isArray(data.pages) ? data.pages : [];
    if (Array.isArray(data.folders)) {
      foldersData = data.folders;
    } else {
      foldersData = (await loadFoldersFromProjectsHtml(projectId).catch(() => null)) || [];
    }
  })().catch(() => {
    if (!projectPages) projectPages = [];
    if (foldersData === null) foldersData = [];
  });
  return projectDataPromise;
}

async function loadParentPages() {
  const alias = String(window.pagealias || '');
  const projectId = String(window.projectid || '');
  if (!alias || !projectId || alias.indexOf('/') === -1) {
    parentPages = [];
    return;
  }

  await ensureProjectDataLoaded();

  const byAlias = new Map();
  (projectPages || []).forEach((p) => {
    if (p.alias && !byAlias.has(p.alias)) byAlias.set(p.alias, p);
  });

  const segments = alias.split('/').filter(Boolean);
  const found = [];
  for (let i = 1; i < segments.length; i += 1) {
    const prefix = segments.slice(0, i).join('/');
    if (byAlias.has(prefix)) {
      const p = byAlias.get(prefix);
      found.push({ id: String(p.id), title: p.title || '/' + prefix });
    }
  }
  parentPages = found;
}

// Вставляет крошки: `visible` ближайших предков + «…» вместо остальных.
// Возвращает true, если что-то вставила. Существующие наши крошки сносит.
function insertParentCrumbs(visible) {
  if (!parentPages || !parentPages.length) return false;
  const bar = document.querySelector('.tp-menu__breadcrumbs');
  if (!bar) return false;
  const pageWrap = bar.querySelector('.tp-menu__page:not(.th-parent-crumb)');
  if (!pageWrap) return false;

  bar.querySelectorAll('.th-parent-crumb').forEach((el) => el.remove());

  const projectId = String(window.projectid || '');

  // Схлопываем глубокую цепочку: «…» вместо дальних предков + последние N.
  const hidden = parentPages.slice(0, Math.max(0, parentPages.length - visible));
  const shown = visible ? parentPages.slice(-visible) : [];

  if (hidden.length) {
    const wrap = document.createElement('div');
    wrap.className =
      'tp-menu__breadcrumbs__item-wrapper tp-menu__page th-parent-crumb th-parent-crumb_more';
    wrap.innerHTML =
      '<div class="tp-menu__breadcrumbs__divider">/</div>' +
      '<span class="tp-menu__breadcrumbs__item">' +
      '<div class="tp-menu__item__text">…</div></span>';
    // Клик по «…» — открываем РОДНОЙ дропдаун со списком страниц (тот же,
    // что у крошки текущей страницы): в нём всё дерево, поиск и наша
    // иерархия из treelist.js. Свой дропдаун не изобретаем.
    const item = wrap.querySelector('.tp-menu__breadcrumbs__item');
    item.title = 'Показать все страницы';
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const toggler = document.querySelector('.tp-menu__page__dropdown-toggler');
      if (!toggler) return;
      // Простой .click() дропдаун НЕ открывает (обработчик Tilda слушает
      // полный жест мыши) — диспатчим последовательность целиком.
      ['mousedown', 'mouseup', 'click'].forEach((type) => {
        toggler.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      });
    });
    pageWrap.parentNode.insertBefore(wrap, pageWrap);
  }

  shown.forEach((p) => {
    const wrap = document.createElement('div');
    wrap.className = 'tp-menu__breadcrumbs__item-wrapper tp-menu__page th-parent-crumb';
    wrap.innerHTML =
      '<div class="tp-menu__breadcrumbs__divider">/</div>' +
      '<a class="tp-menu__breadcrumbs__item">' +
      '<div class="tp-menu__item__icon">' + PAGE_ICON_SVG + '</div>' +
      '<div class="tp-menu__item__text"></div></a>';
    const a = wrap.querySelector('a');
    a.href = '/page/?pageid=' + p.id + '&projectid=' + projectId;
    a.title = p.title;
    const text = wrap.querySelector('.tp-menu__item__text');
    text.textContent = p.title;
    text.style.setProperty('--th-crumb-w', CRUMB_TEXT_MAX_W + 'px');
    pageWrap.parentNode.insertBefore(wrap, pageWrap);
  });
  return true;
}

// Число видимых предков, подобранное под текущую ширину (-1 — ещё не
// подбирали), и ширина окна, для которой подбирали. При ресайзе окна
// подбор начинается заново со всех предков.
let fitVisible = -1;
let fitViewportWidth = 0;

// true, если крошки не наезжают на центр-блок шапки (или мериться не с чем).
function crumbsFit() {
  const bar = document.querySelector('.tp-menu__breadcrumbs');
  const middle = document.querySelector('.tp-menu__middle');
  if (!bar || !middle) return true;
  const barRect = bar.getBoundingClientRect();
  const midRect = middle.getBoundingClientRect();
  if (!midRect.width) return true; // центр-блок скрыт
  return barRect.right + FIT_GAP <= midRect.left;
}

// Подбирает максимальное число видимых предков: начинает со всех и убирает
// дальних в «…» по одному, пока крошки не перестанут наезжать на центр-блок.
// Несколько принудительных reflow подряд — не страшно: предков единицы, а
// подбор выполняется только при первой вставке/ресайзе/пересоздании шапки.
function fitParentCrumbs() {
  fitVisible = parentPages.length;
  insertParentCrumbs(fitVisible);
  while (!crumbsFit() && fitVisible > 0) {
    fitVisible -= 1;
    insertParentCrumbs(fitVisible);
  }
}

// Разбор пути папки на сегменты — как splitPath в folders.js: имя хранит
// путь через «/», сегменты сравниваем в нормализованном виде «A / B».
function splitFolderPath(raw) {
  return String(raw).split('/').map((s) => s.trim()).filter(Boolean);
}

// Разбивает родную крошку папки в шапке редактора на крошки-сегменты.
// Идемпотентно: обработанная крошка помечается data-th-split; при пересоздании
// шапки метка исчезает вместе с нодой — обработаем заново. Зовётся из tick().
export function updateFolderBreadcrumbs() {
  const wrap = document.querySelector('.tp-menu__folder:not(.th-folder-crumb)');
  if (!wrap || wrap.dataset.thSplit) return;
  const link = wrap.querySelector('a.tp-menu__breadcrumbs__item');
  const textEl = wrap.querySelector('.tp-menu__item__text');
  if (!link || !textEl) return;

  const segments = splitFolderPath(textEl.textContent);
  if (segments.length < 2) {
    wrap.dataset.thSplit = '1'; // обычная папка — нечего разбивать
    return;
  }

  // Список папок грузится асинхронно — дёргаем загрузку и ждём следующего тика.
  if (foldersData === null) {
    ensureProjectDataLoaded();
    return;
  }

  const projectId = String(window.projectid || '');

  // Полный нормализованный путь → папка (как allByName в folders.js).
  const byPath = new Map();
  foldersData.forEach((f) => {
    if (!f || !f.title || f.trash) return;
    const key = splitFolderPath(f.title).join(' / ');
    if (!byPath.has(key)) byPath.set(key, f);
  });

  segments.slice(0, -1).forEach((seg, i) => {
    const path = segments.slice(0, i + 1).join(' / ');
    const folder = byPath.get(path);
    const crumb = document.createElement('div');
    crumb.className = 'tp-menu__breadcrumbs__item-wrapper tp-menu__folder th-folder-crumb';
    const tag = folder ? 'a' : 'span';
    crumb.innerHTML =
      '<div class="tp-menu__breadcrumbs__divider">/</div>' +
      '<' + tag + ' class="tp-menu__breadcrumbs__item">' +
      '<div class="tp-menu__item__icon">' + FOLDER_ICON_SVG + '</div>' +
      '<div class="tp-menu__item__text"></div></' + tag + '>';
    const item = crumb.querySelector('.tp-menu__breadcrumbs__item');
    item.title = path;
    if (folder) {
      item.href = '/projects/?projectid=' + projectId + '&folderid=' + folder.id;
    }
    crumb.querySelector('.tp-menu__item__text').textContent = seg;
    wrap.parentNode.insertBefore(crumb, wrap);
  });

  // Родная крошка остаётся ссылкой в текущую папку, но с leaf-подписью.
  textEl.textContent = segments[segments.length - 1];
  link.title = segments.join(' / ');
  wrap.classList.add('th-folder-split');
  wrap.dataset.thSplit = '1';
}

export function initEditorBreadcrumbs() {
  injectBreadcrumbStyles();
  // Глобалы pagealias/projectid задаются инлайн-скриптом страницы; на
  // document_idle они уже есть, но на всякий случай ждём их тиком.
  const waiter = setInterval(() => {
    if (window.projectid === undefined) return;
    clearInterval(waiter);
    loadParentPages().catch(() => {
      parentPages = [];
    });
  }, 300);
}

// Идемпотентная вставка + подгонка числа видимых предков — зовётся из
// общего tick() редактора.
export function updateEditorBreadcrumbs() {
  if (!parentPages || !parentPages.length) return;

  // Ресайз окна — подбираем заново.
  if (window.innerWidth !== fitViewportWidth) {
    fitViewportWidth = window.innerWidth;
    fitVisible = -1;
  }

  const bar = document.querySelector('.tp-menu__breadcrumbs');
  if (!bar) return;
  if (fitVisible < 0 || !bar.querySelector('.th-parent-crumb')) {
    // Первая вставка / ресайз / шапка пересоздалась — полный подбор.
    fitParentCrumbs();
  } else if (!crumbsFit()) {
    // Что-то ужалось/раздалось без ресайза (напр. сменился заголовок
    // текущей страницы) — доужимаемся.
    while (!crumbsFit() && fitVisible > 0) {
      fitVisible -= 1;
      insertParentCrumbs(fitVisible);
    }
  }
}
