// Фича «визуальная иерархия папок» на странице списка страниц (/projects/…).
//
// Tilda не умеет вкладывать папки друг в друга — вложенность кодируют прямо в
// названии подпапки через «/»: есть реальные папки «Тех. странички»,
// «Тех. странички / Странички», «Тех. странички / Странички / Тест / Тест» и
// т.д. Родной список рисует всё плоско и дублирует путь. Здесь строим ДЕРЕВО
// произвольной глубины: каждую папку подвешиваем под ту, чьё полное имя равно
// её пути без последнего сегмента; показываем только последний сегмент (leaf)
// с отступом по глубине (= число «/») и tree-маркером. Родителей не выдумываем
// на экране — используем реальные строки-папки; недостающих предков создаём
// через API (см. ensureAncestorFolders).
//
// Список папок Tilda держит в отдельном контейнере, где ТОЛЬКО `.td-folder`
// (страницы живут отдельно) — поэтому можно свободно переупорядочивать строки.
//
// Идемпотентность: помечаем строки `data-th-applied`. Пока все текущие
// `.td-folder` помечены — ничего не делаем. Tilda пересоздаёт строки при
// создании/переименовании/перетаскивании → появляются непомеченные → пересборка.

const INDENT_STEP = 20; // px на уровень вложенности

function injectFolderStyles() {
  if (document.getElementById('th-folders-style')) return;
  const style = document.createElement('style');
  style.id = 'th-folders-style';
  style.textContent = `
    /* Строка-подпапка «вложена»: отступ по глубине (--th-pad) + tree-маркер
       вплотную слева от текста (на 14px левее начала имени). */
    .th-folder-nested .td-page__td-title-span {
      padding-left: var(--th-pad, 20px);
      position: relative;
    }
    .th-folder-nested .td-page__td-title-span::before {
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
    /* У подпапки прячем иконку-папку (родитель уже несёт её). opacity:0, а не
       display:none — иначе колонка схлопнется и имя съедет влево. */
    .th-folder-nested .td-page__img {
      opacity: 0;
    }
    /* Пустая папка (нет страниц и нет вложенных подпапок) — приглушаем. */
    .th-folder-empty {
      opacity: 0.45;
    }
    /* Форма переименования папки (.td-page__td-title-change) перекрывалась
       соседними строками и была некликабельна: у неё не было своего stacking-
       контекста, а мы переупорядочиваем строки (поздние рисуются поверх).
       Поднимаем над строками и делаем фон непрозрачным. */
    .td-page__td-title-change,
    .td-page__td-title-change_long {
      position: relative;
      z-index: 1000;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
      border-radius: 6px;
    }
    /* Стрелочка сворачивания подгруппы — чип «▾ N» (N — число подпапок)
       сразу после названия папки. Раньше висела absolute-серым шевроном
       посреди пустой строки (right:110px) — её было не найти глазами. */
    .th-folder-toggle {
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
    .th-folder-toggle svg {
      width: 14px;
      height: 14px;
      transition: transform 0.15s ease;
    }
    .th-folder-toggle:hover {
      background: #dcdcdc;
      color: #000;
    }
    .th-folder-toggle_collapsed svg {
      transform: rotate(-90deg);
    }
    /* Анимация сворачивания подгруппы: max-height вместо display:none, чтобы
       строка плавно схлопывалась/разворачивалась, а не исчезала мгновенно.
       300px — с запасом выше реальной высоты строки (в т.ч. с формой
       переименования), чтобы ничего не обрезалось в развёрнутом состоянии. */
    .td-folder {
      overflow: hidden;
      max-height: 300px;
      opacity: 1;
      transition: max-height 0.25s ease, opacity 0.2s ease;
    }
    .th-folder-hidden {
      max-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// Читает имя папки из АВТОРИТЕТНОГО window.folders по id строки (row.id =
// 'folder'+numericId). Это надёжнее чтения из DOM: при инлайн-переименовании
// Tilda переписывает разметку подписи (сносит `.td-page__td-title-span`) и наш
// собственный rewrite (leaf) тоже меняет текст — а window.folders всегда несёт
// актуальное полное имя. Fallback на DOM — только если папки нет в данных.
function readFolderName(row) {
  const id = row.id.replace('folder', '');
  if (Array.isArray(window.folders)) {
    const f = window.folders.find((x) => x && x.id === id);
    if (f) return f.title;
  }
  const span = row.querySelector('.td-page__td-title-span');
  if (!span) return '';
  return Array.from(span.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join('')
    .trim();
}

// Перерисовывает подпись строки: вложенная папка → только последний сегмент
// (leaf) с отступом по глубине и tree-маркером; корень → полное имя без
// маркера. Иконку редактирования (.td-page__td-title-edit) сохраняем на месте.
function setRowLabel(row, depth, text, fullTitle) {
  const link = row.querySelector('.td-page__td-title a') || row.querySelector('.td-page__td-title');
  if (!link) return;
  // Tilda при инлайн-переименовании переписывает innerHTML ссылки и сносит
  // `.td-page__td-title-span` — восстанавливаем обёртку, чтобы стили/leaf легли.
  let span = row.querySelector('.td-page__td-title-span');
  const editIcon = row.querySelector('.td-page__td-title-edit');
  if (!span) {
    span = document.createElement('span');
    span.className = 'td-page__td-title-span';
    link.textContent = '';
    link.appendChild(span);
  }
  span.textContent = '';
  const nested = depth > 0;
  row.classList.toggle('th-folder-nested', nested);
  if (nested) {
    span.style.setProperty('--th-pad', depth * INDENT_STEP + 'px');
    const leafEl = document.createElement('span');
    leafEl.className = 'th-folder-leaf';
    leafEl.textContent = text;
    span.appendChild(leafEl);
  } else {
    span.style.removeProperty('--th-pad');
    span.appendChild(document.createTextNode(text));
  }
  if (editIcon) span.appendChild(editIcon);
  span.title = fullTitle;
}

// Разбор имени папки в путь-сегменты.
function splitPath(raw) {
  return raw.split('/').map((s) => s.trim()).filter(Boolean);
}

// Ключ для регистронезависимого сопоставления путей. Родитель ищется по
// СМЫСЛУ имени, а не по байтам: «папка 1 / Тест» и «Папка 1 / Тест» — один и
// тот же путь с опечаткой в регистре, иначе ребёнок молча уезжал бы в корень.
// Отображается всё равно оригинальный raw (регистр каждой папки в UI не
// трогаем) — foldKey нужен только как ключ Map/Set для поиска совпадения.
function foldKey(raw) {
  return raw.toLowerCase();
}

// То же самое для проверки «эта папка — потомок по префиксу пути» — потомок
// мог унаследовать опечатку в регистре у предка, но это не должно рвать
// каскадное удаление/переименование/поддерево.
function startsWithFold(str, prefix) {
  return foldKey(str).startsWith(foldKey(prefix));
}

// Полные имена папок, свёрнутых пользователем вручную (стрелочкой). Переживает
// перерисовку дерева (тик/переименование других папок), сбрасывается только
// перезагрузкой страницы. Общее множество для корневого дерева (applyFolderHierarchy)
// и поддерева внутри папки (injectDescendantTree) — папка идентифицируется полным
// путём независимо от того, где она сейчас отрисована.
const collapsedFolders = new Set();

// Папки, для которых уже решили состояние по умолчанию (см. ниже) — чтобы не
// схлопывать повторно ту, что пользователь сам развернул в текущей сессии.
const defaultStateDecided = new Set();

// Строит дерево из набора строк-папок: родитель/дети по полному пути +
// последовательность обхода (DFS, порядок как в исходном списке) с флагом
// `hidden` — скрыта ли строка из-за того, что какой-то предок свёрнут.
function computeFolderSequence(rows) {
  const parsed = rows.map((row) => {
    const raw = readFolderName(row);
    const parts = splitPath(raw);
    return {
      row,
      raw,
      parts,
      depth: parts.length - 1,
      parentPath: parts.length > 1 ? parts.slice(0, -1).join(' / ') : null,
      leaf: parts[parts.length - 1] || raw,
    };
  });

  const allByName = new Map();
  parsed.forEach((p) => {
    const key = foldKey(p.raw);
    if (!allByName.has(key)) allByName.set(key, p);
  });

  const childrenOf = new Map();
  const roots = [];
  parsed.forEach((p) => {
    const parentKey = p.parentPath && foldKey(p.parentPath);
    if (parentKey && allByName.has(parentKey)) {
      if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
      childrenOf.get(parentKey).push(p);
    } else {
      roots.push(p);
    }
  });

  const sequence = [];
  const visited = new Set();
  function emit(item, nestedDepth, hiddenByAncestor) {
    const key = foldKey(item.raw);
    if (visited.has(key)) return;
    visited.add(key);
    // По умолчанию папки со вложенными подпапками сворачиваем — но только один
    // раз при первом появлении: дальше состояние решает пользователь стрелочкой.
    if (childrenOf.has(key) && !defaultStateDecided.has(item.raw)) {
      defaultStateDecided.add(item.raw);
      collapsedFolders.add(item.raw);
    }
    sequence.push({ item, depth: nestedDepth, hidden: hiddenByAncestor });
    const childHidden = hiddenByAncestor || collapsedFolders.has(item.raw);
    (childrenOf.get(key) || []).forEach((c) => emit(c, nestedDepth + 1, childHidden));
  }
  roots.forEach((r) => emit(r, 0, false));

  return { parsed, childrenOf, roots, sequence };
}

// Иконка chevron-down из Lucide (lucide.dev) — открытое состояние (▾);
// свёрнутое получаем поворотом на -90deg через CSS (см. th-folder-toggle_collapsed).
const CHEVRON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>';

// Создаёт (или обновляет) стрелочку сворачивания у строки папки — чип «▾ N»
// внутри подписи (`.td-page__td-title-span`), сразу после имени. Путь папки
// (`raw`) кладём в dataset и читаем оттуда в обработчике клика — а не берём из
// замыкания, — чтобы после переименования (нода переиспользуется) клик всегда
// сворачивал АКТУАЛЬНУЮ папку, а не ту, что была на момент создания кнопки.
// setRowLabel при пересборке чистит span (кнопка выпадает из DOM) — тогда
// просто создаём новую; setupCollapseToggle всегда зовётся после setRowLabel.
function setupCollapseToggle(row, raw, childCount) {
  let btn = row.querySelector('.th-folder-toggle');
  if (!childCount) {
    if (btn) btn.remove();
    return;
  }
  const span = row.querySelector('.td-page__td-title-span');
  if (!span) return;
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'th-folder-toggle';
    btn.innerHTML = CHEVRON_SVG + '<span class="th-folder-toggle-count"></span>';
    btn.setAttribute('aria-label', 'Свернуть/развернуть подпапки');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const path = btn.dataset.thPath;
      if (collapsedFolders.has(path)) collapsedFolders.delete(path);
      else collapsedFolders.add(path);
      refreshFolderVisibility();
    });
  }
  if (btn.parentElement !== span) span.appendChild(btn);
  btn.querySelector('.th-folder-toggle-count').textContent = childCount;
  btn.dataset.thPath = raw;
  btn.classList.toggle('th-folder-toggle_collapsed', collapsedFolders.has(raw));
}

// Пересчитывает видимость и состояние стрелочек по ВСЕМ строкам-папкам на
// странице (и корневому дереву, и поддереву внутри папки — обе ветки строят
// строки с классом `.td-folder`). Вызывается после клика по стрелочке и после
// инжекта поддерева внутри папки.
function refreshFolderVisibility() {
  const rows = Array.from(document.querySelectorAll('.td-folder'));
  if (!rows.length) return;
  const { childrenOf, sequence } = computeFolderSequence(rows);
  sequence.forEach(({ item, hidden }) => {
    setupCollapseToggle(item.row, item.raw, (childrenOf.get(foldKey(item.raw)) || []).length);
    item.row.classList.toggle('th-folder-hidden', hidden);
  });
}

// Одноразовый флаг на загрузку страницы: чтобы тик (700мс) не выстрелил
// создание предков повторно, пока запрос в полёте / до перезагрузки.
let ancestorCreationTriggered = false;
let deepNestingNotified = false; // чтобы уведомление о слишком глубокой вложенности показать один раз
let normalizationTriggered = false; // одноразовый флаг на загрузку страницы (см. ensureFolderNameNormalization)

// Путь родителя ищется по ТОЧНОМУ совпадению строки (см. computeFolderSequence:
// parentPath = сегменты.join(' / ')). Папка, названная без пробелов вокруг «/»
// («Папка1/Тест») или с лишними («Папка 1  /  Тест»), из-за этого не находит
// родителя и молча остаётся плоской — без ошибки, без подсказки. Приводим
// такие имена к каноническому виду «A / B» (ровно один пробел с каждой
// стороны «/») через нативный renamefolder, ДО того как считается дерево.
// Каскадно поправляем и потомков — у них тот же кривой префикс унаследован.
function ensureFolderNameNormalization() {
  if (normalizationTriggered) return;
  if (!Array.isArray(window.folders)) return;

  const live = window.folders.filter((f) => f && !f.trash);
  const bad = live.find((f) => {
    const parts = splitPath(f.title);
    return f.title.includes('/') && parts.join(' / ') !== f.title;
  });
  if (!bad) return;

  const projectid = new URLSearchParams(location.search).get('projectid');
  const csrf = (window.getCSRF && window.getCSRF()) || window.csrf;
  if (!projectid || typeof window.td__ajax !== 'function' || !csrf) return;

  const badParts = splitPath(bad.title);
  const newTitle = badParts.join(' / ');

  // Потомки — по сравнению РАЗОБРАННЫХ сегментов (а не префикса строки),
  // чтобы не зависеть от того, каким кривым разделителем записан сам bad.
  const renames = [{ folder: bad, title: newTitle }];
  live.forEach((f) => {
    if (f === bad) return;
    const fParts = splitPath(f.title);
    if (fParts.length <= badParts.length) return;
    const isDescendant = badParts.every((p, i) => fParts[i] === p);
    if (!isDescendant) return;
    const fixedTitle = badParts.concat(fParts.slice(badParts.length)).join(' / ');
    if (fixedTitle !== f.title) renames.push({ folder: f, title: fixedTitle });
  });

  normalizationTriggered = true;

  // Синхронно чиним память сразу (как в ensureRenameCascade) — чтобы
  // ensureAncestorFolders на этом же тике не увидел рассинхрон и не
  // насоздавал лишних предков по старым кривым именам.
  renames.forEach((r) => { r.folder.title = r.title; });

  let done = 0;
  let success = 0;
  renames.forEach((r) => {
    window.td__ajax({
      url: '/projects/submit/',
      dataToSend: { comm: 'renamefolder', folderid: r.folder.id, title: r.title, csrf },
      ui: { ctext: 'th: normalize folder name' },
      onSuccess: function () {
        done += 1;
        success += 1;
        if (done === renames.length && success > 0) location.reload();
      },
      onError: function () {
        done += 1;
        if (done === renames.length) {
          if (success > 0) location.reload();
          else console.warn('[th-folders] не удалось нормализовать имя папки:', bad.title);
        }
      },
    });
  });
}

// Для каждой папки с «/» нужны реальные папки-предки на КАЖДЫЙ уровень пути
// («A», «A / B», … кроме самой папки). Недостающих создаём нативным API Tilda
// (comm:addnewfolder на /projects/submit/ — тот же вызов, что кнопка «Создать
// папку»), затем перезагружаем страницу: цепочка достроится и дерево соберётся
// на любую глубину. За несколько уровней может занять пару перезагрузок —
// сходится, т.к. на каждой уже существующие предки не пересоздаются.
function ensureAncestorFolders() {
  if (ancestorCreationTriggered) return;

  // Существование предков проверяем по АВТОРИТЕТНОМУ window.folders, а НЕ по
  // DOM-строкам: Tilda дорисовывает строки не сразу, и на неполном рендере
  // реально существующая папка «Тех. странички» считалась отсутствующей →
  // создавалась заново (был баг с дублями). window.folders — полный список.
  if (!Array.isArray(window.folders)) return;
  const live = window.folders.filter((f) => f && !f.trash);
  if (!live.length) return;

  // Гард против частичного рендера: если число нарисованных строк-папок не
  // совпадает с числом папок в данных — рано, не рискуем создавать дубли.
  const domCount = document.querySelectorAll('.td-folder').length;
  if (domCount !== live.length) return;

  // Регистронезависимо: «папка 1» и «Папка 1» — один и тот же предок с
  // опечаткой в регистре, иначе тут создался бы дубль вместо переиспользования.
  const existing = new Set(live.map((f) => foldKey(f.title)));
  const missing = new Set();
  live.forEach((f) => {
    if (!f.title.includes('/')) return;
    const parts = splitPath(f.title);
    // все префиксы пути, кроме полного имени самой папки
    for (let i = 1; i < parts.length; i += 1) {
      const ancestor = parts.slice(0, i).join(' / ');
      if (!existing.has(foldKey(ancestor))) missing.add(ancestor);
    }
  });
  // Двойная страховка: никогда не создаём имя, которое уже есть.
  const toCreate = Array.from(missing).filter((t) => !existing.has(foldKey(t)));
  if (!toCreate.length) return;

  // Рейт-лимит Tilda: не достраиваем глубокие цепочки автоматически. Если не
  // хватает больше 2 уровней предков — запрещаем автосоздание (пусть человек
  // сначала сделает промежуточные папки сам), иначе легко упереться в лимит
  // запросов и наплодить мусор. При <=2 — достраиваем.
  const MAX_MISSING_LEVELS = 2;
  if (toCreate.length > MAX_MISSING_LEVELS) {
    // Показываем понятную ошибку в UI Tilda (нативный бабл), ОДИН раз — а не
    // console.warn (тот сыпется в ошибки расширения и не виден пользователю).
    if (!deepNestingNotified) {
      deepNestingNotified = true;
      const text =
        'Слишком глубокая вложенность папок: не хватает ' + toCreate.length +
        ' промежуточных папок. Создайте их вручную по одному уровню — тогда подпапки соберутся в дерево.';
      if (typeof window.td__showBubbleNotice === 'function') {
        window.td__showBubbleNotice(text, 7000, 'error');
      }
    }
    return;
  }

  const projectid = new URLSearchParams(location.search).get('projectid');
  if (!projectid || typeof window.td__ajax !== 'function' || typeof window.getCSRF !== 'function') {
    return;
  }

  ancestorCreationTriggered = true;
  const names = toCreate;
  let done = 0;
  let success = 0;
  names.forEach((title) => {
    window.td__ajax({
      url: '/projects/submit/',
      dataToSend: { comm: 'addnewfolder', projectid, title, csrf: window.getCSRF() },
      ui: { ctext: 'th: create ancestor folder' },
      onSuccess: function (res) {
        done += 1;
        if (Number.isFinite(Number(res))) success += 1;
        if (done !== names.length) return;
        if (success > 0) {
          // Предки созданы — перезагружаемся, чтобы дерево увидело их.
          setTimeout(() => location.reload(), 800);
        } else {
          // Сервер отверг создание — НЕ перезагружаемся, чтобы не зациклиться.
          console.warn('[th-folders] не удалось создать папку-предка:', res);
        }
      },
    });
  });
}

function applyFolderHierarchy() {
  const rows = Array.from(document.querySelectorAll('.td-folder'));
  if (!rows.length) return;
  if (rows.every((r) => r.dataset.thApplied)) return;

  const container = rows[0].parentElement;
  if (!container) return;

  // Недостающих предков достраиваем через API (после успеха — reload).
  // Существование проверяется внутри по window.folders (не по DOM) — иначе
  // на неполном рендере создавались дубли.
  ensureAncestorFolders();

  const { childrenOf, sequence } = computeFolderSequence(rows);

  // Кол-во страниц в каждой папке — из window.pages (folderid, без корзины).
  // Папка «пустая», если в ней нет страниц И нет вложенных подпапок.
  const pageCountByFolder = new Map();
  if (Array.isArray(window.pages)) {
    window.pages.forEach((pg) => {
      if (!pg || pg.trash || !pg.folderid) return;
      pageCountByFolder.set(pg.folderid, (pageCountByFolder.get(pg.folderid) || 0) + 1);
    });
  }

  sequence.forEach(({ item, depth, hidden }) => {
    setRowLabel(item.row, depth, depth > 0 ? item.leaf : item.raw, item.raw);

    const numId = item.row.id.replace('folder', '');
    const hasPages = (pageCountByFolder.get(numId) || 0) > 0;
    const hasChildren = childrenOf.has(item.raw);
    item.row.classList.toggle('th-folder-empty', !hasPages && !hasChildren);

    setupCollapseToggle(item.row, item.raw, (childrenOf.get(foldKey(item.raw)) || []).length);
    item.row.classList.toggle('th-folder-hidden', hidden);

    item.row.dataset.thApplied = '1';
    container.appendChild(item.row);
  });
}

// Внутри папки (URL c folderid) Tilda НЕ показывает подпапки — контейнер
// `.td-project-folders` пуст, видно только пустой стейт «нет страниц». Инжектим
// ВСЁ поддерево текущей папки (не только прямых детей — у подпапок бывают свои
// подпапки), нативным генератором строки `td__project__gethtmlbadge__folder`.
// Подпись → leaf, вложенность по относительной глубине (прямой ребёнок = 0,
// внук = 1, …). Ссылки ведут вглубь (folderid ребёнка).
function injectDescendantTree(folderid) {
  const cont = document.querySelector('.td-project-folders');
  if (!cont) return;
  if (cont.dataset.thChildrenFor === folderid) return; // уже собрано для этой папки
  if (!Array.isArray(window.folders) || typeof window.td__project__gethtmlbadge__folder !== 'function') {
    return;
  }

  const current = window.folders.find((f) => f && f.id === folderid);
  if (!current) return;
  const baseDepth = splitPath(current.title).length; // число сегментов текущей папки

  const parentPathOf = (title) => {
    const parts = splitPath(title);
    return parts.length > 1 ? parts.slice(0, -1).join(' / ') : null;
  };

  // Все потомки текущей папки (её имя — префикс пути) + карта детей по родителю.
  // Регистронезависимо — см. foldKey/startsWithFold.
  const prefix = current.title + ' / ';
  const descendants = window.folders.filter((f) => f && !f.trash && startsWithFold(f.title, prefix));
  const childrenOf = new Map();
  descendants.forEach((f) => {
    const pp = parentPathOf(f.title);
    const key = pp && foldKey(pp);
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key).push(f);
  });

  // DFS: прямые дети текущей папки, затем рекурсивно их поддеревья.
  const ordered = [];
  (function walk(parentTitle) {
    (childrenOf.get(foldKey(parentTitle)) || []).forEach((f) => {
      ordered.push(f);
      walk(f.title);
    });
  })(current.title);

  cont.querySelectorAll('.th-injected-child').forEach((e) => e.remove());
  ordered.forEach((f) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = window.td__project__gethtmlbadge__folder(f);
    const row = wrap.firstElementChild;
    if (!row) return;
    row.classList.add('th-injected-child');
    const relDepth = splitPath(f.title).length - baseDepth - 1; // 0 — прямой ребёнок
    const span = row.querySelector('.td-page__td-title-span');
    if (span) {
      const editIcon = span.querySelector('.td-page__td-title-edit');
      span.textContent = '';
      span.appendChild(document.createTextNode(splitPath(f.title).pop()));
      if (editIcon) span.appendChild(editIcon);
      span.title = f.title;
    }
    if (relDepth > 0) {
      row.classList.add('th-folder-nested');
      const s = row.querySelector('.td-page__td-title-span');
      if (s) s.style.setProperty('--th-pad', relDepth * INDENT_STEP + 'px');
    }
    cont.appendChild(row);
  });

  // Overlap-фикс: `.td-project-folders` стартует с того же top, что и панель
  // контролов (поиск + порядок) — без отступа первые строки наезжают на поиск.
  // Отодвигаем контейнер вниз на высоту контролов, когда что-то показали.
  const controls = document.querySelector('.td-project-controls');
  cont.style.marginTop = ordered.length && controls ? controls.offsetHeight + 'px' : '';

  // Пустой стейт «в папке нет страниц» прячем, если показали подпапки.
  const nopages = document.querySelector('.td-project-nopages');
  if (nopages) nopages.style.display = ordered.length ? 'none' : '';

  cont.dataset.thChildrenFor = folderid;

  // Стрелочки сворачивания + видимость по свёрнутым предкам (то же общее
  // множество collapsedFolders, что и у корневого дерева).
  refreshFolderVisibility();
}

// Каскадное удаление: родная кнопка «Удалить папку» зовёт td__delFolder(id,pid)
// и удаляет ТОЛЬКО одну папку (её страницы Tilda удаляет на сервере). Наши
// «подпапки» — отдельные плоские папки, поэтому при удалении родителя они бы
// осиротели. Перехватываем td__delFolder: если у папки есть потомки (её имя —
// префикс пути), показываем подтверждение со счётчиком и, после «Да», удаляем
// ВСЕ поддерево (потомки — глубже-первыми, по одному запросу ради рейт-лимита),
// затем сам родитель родной функцией (она перезагрузит список).
let delFolderPatched = false;

function ensureDelFolderCascade() {
  if (delFolderPatched) return;
  if (typeof window.td__delFolder !== 'function') return;

  const orig = window.td__delFolder;
  window.td__delFolder = function (folderid, projectid) {
    const all = Array.isArray(window.folders) ? window.folders : [];
    const target = all.find((f) => f && f.id === folderid);
    if (!target) return orig(folderid, projectid);

    const prefix = target.title + ' / ';
    const descendants = all.filter((f) => f && !f.trash && startsWithFold(f.title, prefix));
    if (!descendants.length) return orig(folderid, projectid); // обычная папка — нативно

    const ids = new Set([folderid].concat(descendants.map((d) => d.id)));
    let pageCount = 0;
    if (Array.isArray(window.pages)) {
      window.pages.forEach((p) => {
        if (p && !p.trash && ids.has(p.folderid)) pageCount += 1;
      });
    }

    const name = splitPath(target.title).pop();
    const msg =
      'Папка «' + name + '» содержит ' + descendants.length +
      ' вложенных подпапок и ' + pageCount + ' страниц. Удалить всё безвозвратно?';

    const doDelete = () => {
      // Глубже-первыми, по одному запросу (рейт-лимит Tilda), потом сам родитель.
      // КРИТИЧНО: если хоть один потомок не удалился — останавливаемся и НЕ
      // трогаем родителя. Раньше ошибка молча пропускалась (onError: next),
      // и родитель удалялся в любом случае — если сеть/рейт-лимит подводили
      // посреди цепочки, получался осиротевший внук с префиксом пути на уже
      // удалённого родителя; при следующей загрузке ensureAncestorFolders
      // видел «не хватает предка» и молча пересоздавал удалённую папку
      // (пустую) — «воскрешение». Удаляя родителя ТОЛЬКО когда весь список
      // потомков подтверждённо удалён, мы гарантируем: если предка не стало —
      // не стало и всех его потомков, сироты в принципе невозможны.
      const order = descendants.slice().sort(
        (a, b) => splitPath(b.title).length - splitPath(a.title).length
      );
      const csrf = window.getCSRF();
      let i = 0;
      let deletedAny = false;
      const stop = (failedTitle) => {
        const text =
          'Удаление остановлено: не удалось удалить подпапку «' + splitPath(failedTitle).pop() +
          '». «' + name + '» и оставшиеся вложенные папки не тронуты — попробуйте ещё раз.';
        if (typeof window.td__showBubbleNotice === 'function') {
          window.td__showBubbleNotice(text, 7000, 'error');
        } else {
          console.warn('[th-folders] каскадное удаление остановлено на:', failedTitle);
        }
        // Часть потомков могла реально удалиться до сбоя — синхронизируем DOM
        // с сервером. Их предки (в т.ч. сам target) никогда не удалялись, пока
        // цепочка не дошла до конца, поэтому пересоздавать после reload нечего.
        if (deletedAny) location.reload();
      };
      const next = () => {
        if (i >= order.length) {
          orig(folderid, projectid); // родитель последним, только когда всё остальное удалено
          return;
        }
        const d = order[i];
        i += 1;
        window.td__ajax({
          url: '/projects/submit/',
          dataToSend: { comm: 'delfolder', folderid: d.id, projectid, csrf },
          ui: { ctext: 'th: cascade delete folder' },
          onSuccess: function (res) {
            // Сервер может ответить 200 с телом-ошибкой (как в ensureAncestorFolders) —
            // успехом считаем только валидный numeric id.
            if (!Number.isFinite(Number(res))) return stop(d.title);
            deletedAny = true;
            next();
          },
          onError: function () {
            stop(d.title);
          },
        });
      };
      next();
    };

    // Нативный confirm: тип 'confirm' у tc__showDialog переиспользует шаблон
    // «unsaved changes» с кнопками «Go back / Exit without saving» — для
    // удаления это сбивает с толку. window.confirm даёт понятные ОК/Отмена.
    if (window.confirm(msg)) doDelete();
  };

  delFolderPatched = true;
}

// Сигнатура состава/имён папок — чтобы заметить переименование/перемещение
// БЕЗ перезагрузки страницы. Tilda при инлайн-переименовании обновляет
// window.folders (title) и не трогает наши data-th-applied метки, из-за чего
// дерево не пересобиралось. При изменении сигнатуры — сбрасываем метки, и
// applyFolderHierarchy / injectDescendantTree перестраиваются с новыми именами.
let foldersSignature = null;

function computeFoldersSignature() {
  if (!Array.isArray(window.folders)) return '';
  return window.folders
    .filter((f) => f && !f.trash)
    .map((f) => f.id + ':' + f.title)
    .sort()
    .join('|');
}

function resetFolderMarkers() {
  document.querySelectorAll('.td-folder').forEach((r) => {
    delete r.dataset.thApplied;
    delete r.dataset.thRaw;
  });
  const cont = document.querySelector('.td-project-folders');
  if (cont) delete cont.dataset.thChildrenFor;
  // разрешаем заново оценить нехватку предков (переименование могло создать
  // новый путь) — guard'ы внутри защищают от дублей.
  ancestorCreationTriggered = false;
  normalizationTriggered = false;

  // Чистим состояние сворачивания от путей папок, которых больше не существует
  // (переименована/удалена) — иначе множество бесполезно растёт.
  if (Array.isArray(window.folders)) {
    const liveTitles = new Set(window.folders.filter((f) => f && !f.trash).map((f) => f.title));
    Array.from(collapsedFolders).forEach((path) => {
      if (!liveTitles.has(path)) collapsedFolders.delete(path);
    });
    Array.from(defaultStateDecided).forEach((path) => {
      if (!liveTitles.has(path)) defaultStateDecided.delete(path);
    });
  }
}

// Каскадное переименование потомков (= смена родителя). Родная
// td__project__submitFolderTitle(e,t,a) переименовывает ТОЛЬКО саму папку;
// её «подпапки» — отдельные папки с закодированным в имени путём, поэтому при
// переименовании родителя они сохраняли старый префикс, осиротевали, и
// автосоздание воскрешало старого родителя (дубль!). Перехватываем: после
// переименования папки переписываем префикс пути у ВСЕХ потомков (old/... →
// new/...). window.folders чиним синхронно — чтобы тик/автосоздание сразу
// видели согласованное состояние без сирот.
let renamePatched = false;

function ensureRenameCascade() {
  if (renamePatched) return;
  if (typeof window.td__project__submitFolderTitle !== 'function') return;

  const orig = window.td__project__submitFolderTitle;
  window.td__project__submitFolderTitle = function (e, t, a) {
    const oldTitle = e && e.title;
    if (!oldTitle || !Array.isArray(window.folders)) return orig.call(this, e, t, a);

    // Повторяем санитайз родной функции, чтобы наш newTitle совпал с тем, что
    // реально сохранится (иначе префикс потомков/матчинг папок не сойдётся).
    let newTitle = String(t == null ? '' : t).replace('<', 'lt').replace('>', 'gt');
    if (!newTitle) newTitle = 'Folder: ' + e.id;
    if (newTitle === oldTitle) return orig.call(this, e, t, a);

    const projectid = new URLSearchParams(location.search).get('projectid');
    const csrf = (window.getCSRF && window.getCSRF()) || window.csrf;
    const ajax = (data, cb) =>
      window.td__ajax({
        url: '/projects/submit/',
        dataToSend: Object.assign({ csrf }, data),
        ui: { ctext: 'th: folders' },
        onSuccess: cb,
        onError: cb,
      });
    const runSeq = (list) => {
      let i = 0;
      const nx = () => {
        if (i >= list.length) return;
        list[i++](nx);
      };
      nx();
    };

    // Коллизия имён: newTitle уже занят ДРУГОЙ папкой → это не переименование,
    // а СЛИЯНИЕ. Переносим страницы и подпапки исходной папки в существующую,
    // саму исходную (пустую) удаляем. Разрушающе — спрашиваем подтверждение.
    const target = window.folders.find(
      (f) => f && !f.trash && f.title === newTitle && f.id !== e.id
    );
    if (target) {
      const pages = Array.isArray(window.pages)
        ? window.pages.filter((p) => p && !p.trash && p.folderid === e.id)
        : [];
      const subs = window.folders.filter(
        (f) => f && !f.trash && startsWithFold(f.title, oldTitle + ' / ')
      );
      const msg =
        'Папка «' + newTitle + '» уже существует. Объединить: перенести ' +
        pages.length + ' страниц и ' + subs.length + ' подпапок в неё, а «' +
        splitPath(oldTitle).pop() + '» удалить?';
      if (!window.confirm(msg)) {
        // Отмена — просто закрываем редактор, имя не меняем (rename на то же имя).
        orig.call(this, e, oldTitle, a);
        return;
      }

      // Синхронно чиним память: страницы → target, подпапки → префикс target,
      // исходную помечаем удалённой; DOM-строку исходной убираем сразу.
      pages.forEach((p) => { p.folderid = target.id; });
      subs.forEach((f) => { f.title = target.title + f.title.slice(oldTitle.length); });
      e.trash = 'y';
      const rowEl = document.getElementById('folder' + e.id);
      if (rowEl) rowEl.remove();
      if (a && a.remove) a.remove();

      // Персистим по одному (рейт-лимит), удаление исходной — ПОСЛЕДНИМ, после
      // переноса страниц и подпапок (иначе удалились бы вместе с папкой).
      const tasks = [];
      pages.forEach((p) => tasks.push((cb) => ajax({ comm: 'movepagetofolder', pageid: p.id, folderid: target.id }, cb)));
      subs.forEach((f) => tasks.push((cb) => ajax({ comm: 'renamefolder', folderid: f.id, title: f.title }, cb)));
      tasks.push((cb) => ajax({ comm: 'delfolder', folderid: e.id, projectid }, cb));
      runSeq(tasks);
      return;
    }

    // Обычное переименование + каскад префикса потомков (смена родителя).
    orig.call(this, e, t, a); // родитель: сервер + DOM + закрытие формы редактирования
    const subs = window.folders.filter((f) => f && !f.trash && startsWithFold(f.title, oldTitle + ' / '));
    if (e) e.title = newTitle; // синхронно (orig ставит то же в async onSuccess)
    if (!subs.length) return;
    subs.forEach((f) => { f.title = newTitle + f.title.slice(oldTitle.length); });
    runSeq(subs.map((f) => (cb) => ajax({ comm: 'renamefolder', folderid: f.id, title: f.title }, cb)));
  };

  renamePatched = true;
}

// Отключаем drag-and-drop папок (по просьбе пользователя — чтобы не усложнять
// и не конфликтовать с нашим деревом). Папки сортируются через TSortableLite
// (`window.folderSortable`, инициализируется `td__project__switchonSortFolders`
// на `#foldersortable`, где ТОЛЬКО папки — страницы сортируются отдельно).
// Уничтожаем инстанс и глушим инициализатор, чтобы не пересоздался.
let folderDnDoff = false;

function ensureFolderDnDoff() {
  if (!folderDnDoff && typeof window.td__project__switchonSortFolders === 'function') {
    window.td__project__switchonSortFolders = function () {};
    folderDnDoff = true;
  }
  const fsl = window.folderSortable;
  if (fsl && typeof fsl.destroy === 'function') {
    fsl.destroy();
    window.folderSortable = null;
  } else if (fsl && typeof fsl.disable === 'function') {
    fsl.disable();
  }
}

function tickFolders() {
  ensureDelFolderCascade();
  ensureRenameCascade();
  ensureFolderDnDoff();

  const sig = computeFoldersSignature();
  if (sig !== foldersSignature) {
    foldersSignature = sig;
    resetFolderMarkers();
  }

  // До расчёта дерева — почистить кривые имена (без этого «Папка1/Тест» не
  // находит родителя, см. ensureFolderNameNormalization). Если что-то чиним,
  // страница сама перезагрузится по onSuccess — не считаем дерево на кривых
  // данных в этом же тике.
  ensureFolderNameNormalization();

  const folderid = new URLSearchParams(location.search).get('folderid');
  if (folderid) {
    // Внутри папки — показываем её поддерево, дерево-перестройку корня не трогаем.
    injectDescendantTree(folderid);
    linkifyFolderBreadcrumb(folderid);
  } else {
    applyFolderHierarchy();
  }
}

// В шапке внутри папки Tilda показывает путь «Основной сайт / A / B / C» одним
// текстом (кликается только «Основной сайт»). Делаем каждый сегмент папки
// ссылкой на соответствующую папку (кумулятивный путь → folderid из
// window.folders). Последний сегмент (текущая папка) и сегменты без реальной
// папки-предка — просто текст.
function linkifyFolderBreadcrumb(folderid) {
  const el = document.querySelector('.td-project-midpanel__site-title');
  if (!el) return;
  if (el.dataset.thCrumb === folderid) return;
  if (!Array.isArray(window.folders)) return;

  const cur = window.folders.find((f) => f && f.id === folderid);
  const siteLink = el.querySelector('a'); // «Основной сайт» → в корень проекта
  if (!cur || !siteLink) return;

  const projectid = new URLSearchParams(location.search).get('projectid');
  const linkStyle = siteLink.style.cssText || 'font-weight:400; border-bottom: 1px #000 solid;';
  const parts = splitPath(cur.title);

  el.textContent = '';
  el.appendChild(siteLink);
  const acc = [];
  parts.forEach((seg, i) => {
    acc.push(seg);
    el.appendChild(document.createTextNode(' / '));
    const path = acc.join(' / ');
    const folder = window.folders.find((f) => f && !f.trash && f.title === path);
    const isLast = i === parts.length - 1;
    if (folder && !isLast) {
      const a = document.createElement('a');
      a.href = '/projects/?projectid=' + projectid + '&folderid=' + folder.id;
      a.textContent = seg;
      a.style.cssText = linkStyle;
      el.appendChild(a);
    } else {
      el.appendChild(document.createTextNode(seg));
    }
  });

  el.dataset.thCrumb = folderid;
}

export function initFolderHierarchy() {
  injectFolderStyles();
  tickFolders();
  setInterval(tickFolders, 700);
}
