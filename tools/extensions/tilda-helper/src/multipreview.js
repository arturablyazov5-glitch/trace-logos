// Фича «Мультипревью»: одновременный предпросмотр опубликованной страницы в
// трёх viewport'ах (десктоп / планшет / телефон) с синхронным скроллом.
//
// Архитектура (почему именно так):
//  - Каждый <iframe> создаёт СОБСТВЕННЫЙ viewport, поэтому media-queries и
//    window.innerWidth внутри него считаются от ЕГО ширины — Tilda-адаптив
//    отрабатывает без всякой эмуляции девайсов: iframe 375px = телефон.
//  - Синхроскролл требует доступа к contentWindow айфреймов, а он есть только
//    при same-origin. Поэтому оверлей строится НА САМОЙ опубликованной странице
//    (там айфреймы того же origin), а не в редакторе (tilda.ru → cross-origin).
//  - Надёжный same-origin источник опубликованной страницы — зеркало
//    <projectalias>.tilda.ws/<pagealias> (живёт даже при своём домене).
//
// Поток: кнопка в шапке редактора открывает <tilda.ws-url>#th-mp в новой
// вкладке → на tilda.ws content-script видит хэш и строит оверлей.

import { MULTIPREVIEW_ICON_SVG } from './icons.js';

export const MP_HASH = 'th-mp';
const MP_BTN_ID = 'th-multipreview-btn';
const MP_ROOT_ID = 'th-multipreview-root';

// Набор устройств. Ширина = ширина viewport'а айфрейма (реальный брейкпоинт).
//
// ВАЖНО: ширины снапнуты на КАНОНИЧЕСКИЕ АРТБОРДЫ Tilda (1200 / 980 / 640 /
// 480 / 320) — те же, что в родном переключателе разрешений редактора.
// Zero-блоки (t396) отрисованы под эти конкретные ширины; между ними Tilda
// интерполирует и вёрстка выглядит «как десктоп, но кривой» (напр. на 768px).
// Поэтому берём только точные артборды — тогда фрейм рендерит 1:1 с тем, что
// показывает предпросмотр Tilda. НЕ подставлять сюда 768/375 и т.п.
//
// Исключение — десктоп: 1201 (а не 1200) стоит НАМЕРЕННО. Это на 1px ВЫШЕ
// верхнего артборда, а не между артбордами, поэтому интерполяции нет. У блоков
// artboard-upscale="window" выше 1200 идёт чистый пропорциональный апскейл.
const DEVICES = [
  { name: 'Десктоп', w: 1201 },
  { name: 'Планшет', w: 959 },
  { name: 'Телефон', w: 360 },
];

// ─── В РЕДАКТОРЕ: собрать URL опубликованной страницы (tilda.ws-зеркало) ───
//
// Глобалы редактора: projectalias/pagealias (человекочитаемые алиасы),
// projectid/pageid (числовые — фолбэк, если алиасов нет). Проверено на живом
// редакторе: https://<projectalias>.tilda.ws/<pagealias> отдаёт страницу.
function getPublishedUrl() {
  const projectAlias = (window.projectalias || '').toString().trim();
  const pageAlias = (window.pagealias || '').toString().trim();
  const projectId = (window.projectid || '').toString().trim();
  const pageId = (window.pageid || '').toString().trim();

  if (projectAlias) {
    // Домашняя страница проекта отдаётся с пустым алиасом → корень домена.
    const path = pageAlias && pageAlias !== 'home' ? '/' + pageAlias : '/';
    return `https://${projectAlias}.tilda.ws${path}`;
  }
  // Фолбэк на числовую схему, если алиас проекта почему-то не задан.
  if (projectId && pageId) {
    return `https://project${projectId}.tilda.ws/page${pageId}.html`;
  }
  return null;
}

// ─── В РЕДАКТОРЕ: кнопка «Мультипревью» в верхней панели ───
export function injectMultiPreviewButton() {
  const navbar = document.querySelector('ul.tp-menu__navbar');
  if (!navbar || document.getElementById(MP_BTN_ID)) return;

  const li = document.createElement('li');
  li.className = 'tp-menu__navbar__item tp-menu__navbar__item_desktop_only';

  const btn = document.createElement('button');
  btn.id = MP_BTN_ID;
  btn.type = 'button';
  btn.className = 't-button tp-menu__navbar__button th-icon-only';
  btn.title = 'Мультипревью — десктоп/планшет/телефон рядом';
  btn.setAttribute('aria-label', 'Мультипревью');
  btn.innerHTML = MULTIPREVIEW_ICON_SVG;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const url = getPublishedUrl();
    if (!url) {
      alert('Не удалось определить адрес опубликованной страницы (нет alias проекта).');
      return;
    }
    window.open(url + '#' + MP_HASH, '_blank');
  });

  li.appendChild(btn);
  // Ставим перед нативным «Предпросмотром» (он у нас скрыт) — логически рядом.
  const previewLi = navbar.querySelector('.tp-menu__navbar__item_preview');
  navbar.insertBefore(li, previewLi || null);
}

// ─── НА ОПУБЛИКОВАННОЙ СТРАНИЦЕ: определить, что нас позвали как мультипревью ───
export function isMultiPreviewTarget() {
  return location.hash.replace('#', '') === MP_HASH;
}

// ─── НА ОПУБЛИКОВАННОЙ СТРАНИЦЕ: построить оверлей из трёх айфреймов ───
export function buildMultiPreviewOverlay() {
  if (document.getElementById(MP_ROOT_ID)) return;

  // src айфреймов — тот же URL БЕЗ хэша, иначе каждый айфрейм рекурсивно
  // построил бы свой оверлей внутри себя.
  const innerSrc = location.origin + location.pathname + location.search;

  // Раскладка: доступную ширину делим на 3 колонки; каждая колонка не шире
  // своего устройства (телефон рисуется ~1:1, десктоп ужимается scale'ом).
  const GAP = 20;
  const PAD = 20;
  const avail = Math.max(320, window.innerWidth - PAD * 2 - GAP * (DEVICES.length - 1));
  const totalW = DEVICES.reduce((s, d) => s + d.w, 0);
  // ЕДИНЫЙ масштаб на все фреймы → ширины колонок пропорциональны реальным
  // устройствам (1200 шире 980 шире 360), а не равны между собой. Не
  // увеличиваем выше 1:1, чтобы узкие фреймы не размывались апскейлом.
  const scale = Math.min(1, avail / totalW);

  const root = document.createElement('div');
  root.id = MP_ROOT_ID;
  root.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483000', 'background:#15161a',
    'display:flex', 'flex-direction:column', 'box-sizing:border-box',
    'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
  ].join(';');

  // Шапка оверлея с заголовком и кнопкой закрытия.
  const bar = document.createElement('div');
  bar.style.cssText = [
    'flex:0 0 auto', 'height:44px', 'display:flex', 'align-items:center',
    'justify-content:space-between', 'padding:0 18px', 'background:#1d1f26',
    'border-bottom:1px solid #2b2e37', 'color:#e6e7ec',
  ].join(';');
  const title = document.createElement('div');
  title.textContent = 'Мультипревью';
  title.style.cssText = 'font:600 13px/1 sans-serif;letter-spacing:.02em;';
  const close = document.createElement('button');
  close.textContent = '✕  Закрыть';
  close.style.cssText = [
    'background:#2a2c34', 'color:#fff', 'border:0', 'border-radius:8px',
    'padding:8px 14px', 'font:600 13px sans-serif', 'cursor:pointer',
  ].join(';');
  let popupTimer = null;
  const destroy = () => {
    root.remove();
    document.removeEventListener('keydown', onKey);
    if (popupTimer) clearInterval(popupTimer);
    // Убираем хэш, чтобы обновление страницы не открыло оверлей снова.
    history.replaceState(null, '', location.pathname + location.search);
  };
  close.addEventListener('click', destroy);
  bar.appendChild(title);
  bar.appendChild(close);

  // Ряд с колонками устройств.
  const rowEl = document.createElement('div');
  rowEl.style.cssText = [
    'flex:1 1 auto', 'display:flex', 'gap:' + GAP + 'px', `padding:${PAD}px`,
    'justify-content:center', 'align-items:stretch', 'overflow:auto', 'min-height:0',
  ].join(';');

  const frames = [];
  // Текущая «каноническая» страница всех фреймов. Обновляется, когда юзер
  // переходит по ссылке/меню в любом из них (см. wireFrame → навигация).
  const nav = { path: location.pathname + location.search };
  // Общий флаг «сейчас реплицируем действие» — гасит эхо между документами
  // разных фреймов (см. wireInteractionSync). Один объект на все фреймы.
  const syncState = { replaying: false };

  DEVICES.forEach((d) => {
    // Ширина колонки на экране = реальная ширина устройства × общий масштаб.
    const colW = Math.round(d.w * scale);

    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;min-height:0;';

    const cap = document.createElement('div');
    cap.textContent = `${d.name} · ${d.w}px`;
    cap.style.cssText =
      'flex:0 0 auto;color:#c7c9d1;font:600 12px/1.4 sans-serif;margin-bottom:8px;text-align:center;';

    // «Окно устройства»: фиксированная ширинка колонки, внутри — увеличенный
    // айфрейм, ужатый transform:scale (десктоп влезает как в мокапе, без скролла вбок).
    const vp = document.createElement('div');
    vp.style.cssText = [
      'flex:1 1 auto', 'width:' + colW + 'px', 'background:#fff',
      'border-radius:10px', 'overflow:hidden', 'position:relative',
      'box-shadow:0 10px 40px rgba(0,0,0,.5)',
    ].join(';');

    const f = document.createElement('iframe');
    f.style.cssText = [
      'border:0', 'background:#fff', 'width:' + d.w + 'px',
      'height:' + 100 / scale + '%', 'transform:scale(' + scale + ')',
      'transform-origin:top left',
    ].join(';');
    wireFrame(f, frames, nav, syncState);
    f.src = innerSrc;

    vp.appendChild(f);
    col.appendChild(cap);
    col.appendChild(vp);
    rowEl.appendChild(col);
    frames.push(f);
  });

  root.appendChild(bar);
  root.appendChild(rowEl);
  (document.body || document.documentElement).appendChild(root);

  popupTimer = wirePopupSync(frames);

  function onKey(e) {
    if (e.key === 'Escape') destroy();
  }
  document.addEventListener('keydown', onKey);
}

// Синхронизация попапов Tilda между фреймами.
//
// Попапы этого сайта открываются кликом по триггеру a[href="#popup:..."] и
// НЕ меняют хэш URL (проверено) — поэтому ловить через hashchange нельзя.
// Опрашиваем видимость .t-popup в каждом фрейме и приводим все к одному
// состоянию: открыть недостающие (клик по тому же триггеру), закрыть лишние
// (клик по .t-popup__close). Так же ловится закрытие любым способом — крестик,
// клик по фону, Esc.
function wirePopupSync(frames) {
  // Считаем «синхронизируемыми» только настоящие попапы/формы/товары, но не
  // мобильное меню (#menu) — оно по своей природе привязано к брейкпоинту и
  // его репликация вызывала бы дребезг на десктопе, где триггера нет.
  const SYNC_HOOK = /^#popup|^#order|tproduct/i;
  const CLOSE_SEL = '.t-popup__close, .t-popup__block-close-button, [class*="popup__close"]';

  // Хук видимого попапа в документе фрейма (или null).
  const getHook = (doc) => {
    const view = doc.defaultView;
    for (const p of doc.querySelectorAll('.t-popup')) {
      const cs = view.getComputedStyle(p);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') {
        const h = p.getAttribute('data-tooltip-hook') || '';
        if (SYNC_HOOK.test(h)) return h;
      }
    }
    return null;
  };
  const closeIn = (doc) => {
    for (const p of doc.querySelectorAll('.t-popup')) {
      const cs = doc.defaultView.getComputedStyle(p);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') {
        const btn = p.querySelector(CLOSE_SEL);
        if (btn) btn.click();
      }
    }
  };

  let syncedHook = null; // какой попап «должен» быть открыт во всех фреймах
  let syncing = false; // гасит эхо от наших же кликов
  let coolUntil = 0; // пауза после действия — пока попапы доанимируются/дорисуются

  return setInterval(() => {
    if (syncing || Date.now() < coolUntil) return;

    let hooks;
    try {
      hooks = frames.map((f) => getHook(f.contentDocument));
    } catch (e) {
      return; // фрейм ещё грузится / cross-origin
    }

    // Фрейм, чьё состояние разошлось с общим — там юзер только что действовал.
    const src = hooks.findIndex((h) => h !== syncedHook);
    if (src === -1) return; // всё согласовано, делать нечего

    const desired = hooks[src]; // новое намерение (хук или null = закрыть)
    syncedHook = desired;
    coolUntil = Date.now() + 500;
    syncing = true;
    try {
      frames.forEach((f, i) => {
        if (hooks[i] === desired) return;
        const doc = f.contentDocument;
        closeIn(doc); // сначала закрыть то, что открыто в этом фрейме
        if (desired) {
          const trigger = doc.querySelector('a[href="' + desired + '"]');
          if (trigger) trigger.click();
        }
      });
    } catch (e) {}
    syncing = false;
  }, 200);
}

// Универсальная синхронизация любых интеракций между фреймами.
//
// Идея: не копировать РЕЗУЛЬТАТ действия (класс/стиль), а РЕТРАНСЛИРОВАТЬ само
// действие пользователя — клик / ввод текста / переключение чекбокса — на
// такой же элемент в остальных фреймах, а дальше пусть отрабатывает родной JS
// сайта. Это покрывает ВСЁ единообразно: аккордеоны, меню-бургер, табы,
// раскрытия, чекбоксы «согласен», текстовые поля, селекты — без знания того,
// как конкретный блок реализован.
//
// Идентификация «того же элемента» в другом фрейме:
//  - data-elem-id — Tilda ставит его на каждый элемент Zero Block, и он
//    ОДИНАКОВ на всех брейкпоинтах (это один контент в разной раскладке);
//  - от ближайшего [data-elem-id]-контейнера пишем путь по индексам детей до
//    реального таргета (клик мог быть по вложенному узлу);
//  - для полей формы дополнительно матчим по name (надёжнее пути).
//
// Клики реплицируем ТОЛЬКО во фреймы, где элемент реально виден — так
// брейкпоинт-зависимые штуки (бургер есть на планшете/телефоне, но скрыт на
// десктопе) синхронизируются корректно: клик по бургеру уедет туда, где бургер
// виден, и не тронет десктоп, где его нет.
//
// Не трогаем ссылки <a> (навигация и триггеры попапов уже покрыты nav-sync и
// wirePopupSync) и клики внутри .t-popup (там свой механизм) — чтобы не было
// двойной обработки. Значения полей формы, наоборот, синхронизируем даже
// внутри попапов (поллер попапов их не трогает).
//
// state.replaying — общий флаг на все фреймы: гасит эхо от наших же действий.
function wireInteractionSync(doc, frame, allFrames, state) {
  if (!doc || !doc.body || doc._mpWired) return;
  doc._mpWired = true;
  const view = doc.defaultView;

  const getPath = (node, root) => {
    const path = [];
    let cur = node;
    while (cur && cur !== root) {
      const parent = cur.parentElement;
      if (!parent) return null;
      path.unshift(Array.prototype.indexOf.call(parent.children, cur));
      cur = parent;
    }
    return path;
  };
  const resolvePath = (root, path) => {
    let cur = root;
    for (const i of path) {
      if (!cur || !cur.children || !cur.children[i]) return null;
      cur = cur.children[i];
    }
    return cur;
  };
  // Якорь идентификации: ближайший элемент со стабильным на всех брейкпоинтах
  // id. data-elem-id есть у элементов Zero Block; data-record-id — у КАЖДОГО
  // Tilda-блока (обёртка .t-rec), включая классические блоки форм. Оба id —
  // это про контент, а не про раскладку, поэтому совпадают во всех фреймах.
  const ANCHOR_SEL = '[data-elem-id], [data-record-id]';
  // Стабильный идентификатор таргета относительно его якоря-контейнера.
  const identify = (target) => {
    const container = target.closest && target.closest(ANCHOR_SEL);
    if (!container) return null;
    const attr = container.hasAttribute('data-elem-id') ? 'data-elem-id' : 'data-record-id';
    const path = target === container ? [] : getPath(target, container);
    if (path === null) return null;
    return {
      attr,
      key: container.getAttribute(attr),
      path,
      name: (target.getAttribute && target.getAttribute('name')) || null,
    };
  };
  const resolve = (od, id) => {
    const container = od.querySelector('[' + id.attr + '="' + id.key + '"]');
    if (!container) return null;
    if (id.name) {
      const byName = container.querySelector('[name="' + id.name.replace(/"/g, '\\"') + '"]');
      if (byName) return byName;
    }
    return id.path.length ? resolvePath(container, id.path) : container;
  };
  const isVisible = (el) => {
    if (!el.getClientRects || !el.getClientRects().length) return false;
    const cs = el.ownerDocument.defaultView.getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const forOthers = (fn) => {
    state.replaying = true;
    allFrames.forEach((other) => {
      if (other === frame) return;
      try {
        const od = other.contentDocument;
        if (od) fn(od);
      } catch (e) {}
    });
    state.replaying = false;
  };

  // Ссылка, которую НЕ реплицируем кликом: настоящая навигация (её ведёт
  // nav-sync) или триггер попапа/товара (его ведёт wirePopupSync). А вот
  // href="#" / пустой / javascript: — это обычно чистый JS-тоггл (аккордеон),
  // такой клик ретранслируем.
  const isHandledAnchor = (a) => {
    const href = (a.getAttribute('href') || '').trim();
    if (!href || href === '#' || /^javascript:/i.test(href)) return false;
    if (/^#(popup|order)|tproduct/i.test(href)) return true; // попап/товар
    return true; // всё остальное (URL, /path, #anchor) — навигация
  };

  // ── Клики: аккордеоны, бургер-меню, табы, любые тоглы ──
  doc.addEventListener(
    'click',
    (e) => {
      if (state.replaying) return;
      const t = e.target;
      if (!(t instanceof view.Element)) return;
      if (t.closest('.t-popup')) return;
      const a = t.closest('a');
      if (a && isHandledAnchor(a)) return;
      const id = identify(t);
      if (!id) return;
      forOthers((od) => {
        const el = resolve(od, id);
        if (el && isVisible(el)) {
          el.dispatchEvent(new od.defaultView.MouseEvent('click', { bubbles: true, cancelable: true, view: od.defaultView }));
        }
      });
    },
    true
  );

  // ── Ввод/переключение: текстовые поля, textarea, чекбоксы, радио, селекты ──
  const syncField = (e) => {
    if (state.replaying) return;
    const t = e.target;
    if (!(t instanceof view.Element) || !('value' in t)) return;
    const id = identify(t);
    if (!id) return;
    const isToggle = t.type === 'checkbox' || t.type === 'radio';
    forOthers((od) => {
      const el = resolve(od, id);
      if (!el) return;
      if (isToggle) {
        if (el.checked !== t.checked) el.checked = t.checked;
      } else if (el.value !== t.value) {
        el.value = t.value;
      }
      el.dispatchEvent(new od.defaultView.Event('input', { bubbles: true }));
      el.dispatchEvent(new od.defaultView.Event('change', { bubbles: true }));
    });
  };
  doc.addEventListener('input', syncField, true);
  doc.addEventListener('change', syncField, true);
}

// Единый обработчик загрузки фрейма: срабатывает и на первый рендер, и на
// КАЖДУЮ навигацию внутри фрейма (iframe 'load' повторяется при переходе).
// Делает три вещи: (1) синхронизирует навигацию между фреймами, (2) заново
// привязывает синхроскролл к текущему окну фрейма, (3) привязывает
// универсальную синхронизацию интеракций (wireInteractionSync).
function wireFrame(frame, allFrames, nav, syncState) {
  frame.addEventListener('load', () => {
    let win, doc, path;
    try {
      win = frame.contentWindow;
      doc = frame.contentDocument;
      if (!win || !doc) return;
      path = win.location.pathname + win.location.search;
    } catch (e) {
      return; // cross-origin (напр. ушли по внешней ссылке) — не трогаем
    }

    // ── Синхронизация навигации ──
    // Если этот фрейм оказался на ДРУГОЙ странице, значит юзер кликнул ссылку/
    // меню именно в нём — ведём остальные фреймы туда же. nav.path обновляем
    // ДО рассылки: чужие 'load' увидят совпадение и не зациклят рассылку.
    if (path !== nav.path) {
      nav.path = path;
      const target = location.origin + path;
      allFrames.forEach((other) => {
        if (other === frame) return;
        try {
          const ow = other.contentWindow;
          if (ow.location.pathname + ow.location.search !== path) {
            // replace, а не href — чтобы не копить историю в остальных фреймах.
            ow.location.replace(target);
          }
        } catch (e) {}
      });
    }

    // ── Синхронизация интеракций (клики/поля) ──
    // Вешаем на текущий документ фрейма (после навигации документ новый —
    // wireInteractionSync ставит флаг doc._mpWired, чтобы не дублировать).
    wireInteractionSync(doc, frame, allFrames, syncState);

    // ── Синхронный скролл ──
    // Позицию ведущего фрейма проецируем в остальные ПРОПОРЦИОНАЛЬНО высоте
    // документа (у разных брейкпоинтов разная высота → синхронизируем долю).
    // Общий флаг lock гасит эхо (scrollTo одного не должен дёргать другие).
    win.addEventListener(
      'scroll',
      () => {
        if (wireFrame._lock) return;
        wireFrame._lock = true;
        const max = doc.documentElement.scrollHeight - win.innerHeight;
        const ratio = max > 0 ? win.scrollY / max : 0;
        allFrames.forEach((other) => {
          if (other === frame) return;
          try {
            const ow = other.contentWindow;
            const od = other.contentDocument;
            if (!ow || !od) return;
            const omax = od.documentElement.scrollHeight - ow.innerHeight;
            ow.scrollTo(0, ratio * omax);
          } catch (e) {}
        });
        requestAnimationFrame(() => {
          wireFrame._lock = false;
        });
      },
      { passive: true }
    );
  });
}
