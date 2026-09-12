// Полноэкранная карточка прогресса — 1-в-1 визуал с соседним расширением
// taptop-helper (createTtProgress в content.js: modal-оверлей с блюром,
// карточка по центру, полоса прогресса, финальный экран с чекмарком,
// внизу тот же промо-блок Trace Logo's). Оба расширения — один продукт
// для одной аудитории (авторы сайтов на Taptop), разный визуальный язык
// в двух карточках одного и того же семейства выглядел бы как две разные
// поделки, а не одна пара инструментов.
//
// Почему НЕ попап (2026-08-21). Попап — отдельное окно ОС: пока он
// открыт, фокус окна у него, а document.hasFocus() в редакторе — false.
// Chrome в несфокусированном документе рисует выделение серым, а Taptop
// не поднимает панель форматирования («Встроенный текст» / «Прерывание»)
// на несфокусированном Draft.js — то есть вся ветка неразрывных пробелов
// уходит в failed, а вход в редактирование ловит null. Отобрать фокус
// окна у попапа из content script нельзя: el.focus() меняет
// activeElement внутри документа, но не то, какое окно активно. Поэтому
// работа запускается со страницы: попап только отдаёт команду и сразу
// закрывается (popup.js), а прогресс и итог пользователь видит здесь.
//
// В отличие от panel-варианта, который был здесь раньше, это НАСТОЯЩИЙ
// модальный оверлей (как у taptop-helper) — затемняет и блокирует клики
// по странице (pointer-events: auto + глушение колеса/тачпада). Это не
// конфликтует с фокусом документа: оверлей — часть того же документа, а
// не отдельное окно, document.hasFocus() им не трогается. Не мешает и
// собственным кликам скрипта — applyTypografToTaptopSelection.js кликает
// по конкретным DOM-узлам через row.click()/dispatchEvent, а не по
// экранным координатам, так что hit-testing оверлея их не перехватывает.
//
// Префикс id/классов — "ttyp-", отдельный от "tth-" у taptop-helper:
// оба расширения могут быть одновременно активны на одной странице
// Taptop, общие id/классы столкнулись бы.
const TTYP_TRACE_LOGOS_URL = 'https://trace-logos.ru/?utm_source=trace-typograf-extension&utm_medium=extension';
const TTYP_DONATE_URL = 'https://app.lava.top/products/6f3c8efd-27c3-41a8-acb1-559b83ea3b46/d9261f0e-d716-418c-b91d-764e83f1c01c?currency=RUB';

function ttypAsset(name) {
  try {
    return chrome.runtime.getURL('popup/promo-assets/' + name);
  } catch (e) {
    return '';
  }
}

function ttypPromoInnerHtml() {
  const popularLogos = [
    ['ozon', 'Ozon'],
    ['wildberries', 'Wildberries'],
    ['2gis', '2ГИС'],
    ['yandex', 'Яндекс'],
    ['sber', 'Сбер'],
    ['vk', 'ВКонтакте'],
  ];
  const logosGridHtml = popularLogos
    .map(([slug, name]) => `<img class="ttyp-logo-cell" src="${ttypAsset(slug + '.svg')}" alt="${name}" title="${name}" loading="lazy" />`)
    .join('');

  return `
    <img src="${ttypAsset('trace-logos.svg')}" width="52" height="52" style="border-radius:13px; display:block; margin:0 auto 12px;" alt="Trace Logos" />
    <div style="font-size:15px; font-weight:600; margin-bottom:6px;">Trace Logos</div>
    <div style="font-size:12px; opacity:.65; line-height:1.45; margin-bottom:16px;">3000+ SVG/PNG-логотипов брендов — бесплатно, без регистрации</div>
    <div class="ttyp-logo-grid">${logosGridHtml}</div>
    <a class="ttyp-btn ttyp-btn-primary" href="${TTYP_TRACE_LOGOS_URL}" target="_blank" rel="noopener noreferrer">
      Перейти на сайт
    </a>
    <a class="ttyp-btn ttyp-btn-secondary" href="${TTYP_DONATE_URL}" target="_blank" rel="noopener noreferrer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      Поддержать автора
    </a>
  `;
}

const TTYP_PROMO_CSS = `
  .ttyp-promo, .ttyp-promo * { box-sizing: border-box; }
  .ttyp-promo .ttyp-logo-grid {
    display: flex;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .ttyp-promo .ttyp-logo-cell {
    width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; border-radius: 8px;
  }
  .ttyp-promo .ttyp-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 12px 20px; border-radius: 12px;
    font-size: 12px; font-weight: 500; text-decoration: none;
    color: #fff; transition: background .15s, filter .15s;
  }
  .ttyp-promo .ttyp-btn-primary {
    background: #5229cd;
    margin-bottom: 10px;
  }
  .ttyp-promo .ttyp-btn-primary:hover { filter: brightness(1.12); }
  .ttyp-promo .ttyp-btn-secondary {
    background: rgb(36, 36, 36);
  }
  .ttyp-promo .ttyp-btn-secondary:hover { background: rgb(50, 50, 50); }
`;

let ttypOverlayState = null;

function ttypCreateProgress(initialText) {
  const overlay = document.createElement('div');
  overlay.id = 'ttyp-progress-overlay';

  const card = document.createElement('div');
  card.id = 'ttyp-progress-card';
  card.innerHTML = `
    <div id="ttyp-progress-status">Расставляю типографику…</div>
    <div id="ttyp-progress-count">${initialText}</div>
    <div id="ttyp-progress-track" class="ttyp-indeterminate"><div id="ttyp-progress-bar"></div></div>
    <div id="ttyp-progress-hint">Не закрывайте вкладку</div>
    <div class="ttyp-progress-divider"></div>
    <div class="ttyp-promo"></div>
  `;
  card.querySelector('.ttyp-promo').innerHTML = ttypPromoInnerHtml();
  overlay.appendChild(card);
  document.documentElement.appendChild(overlay);

  const styleTag = document.createElement('style');
  styleTag.id = 'ttyp-progress-style';
  styleTag.textContent = `
    #ttyp-progress-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(3px);
      opacity: 0;
      transition: opacity .5s ease;
      pointer-events: auto;
    }
    #ttyp-progress-card, #ttyp-progress-card * { box-sizing: border-box; }
    #ttyp-progress-card {
      position: relative;
      pointer-events: auto;
      width: 300px;
      padding: 24px;
      border-radius: 18px;
      background: rgba(22, 21, 26, 0.94);
      backdrop-filter: blur(8px);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 24px 70px rgba(0, 0, 0, 0.55);
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
      transform: translateY(8px) scale(.98);
      transition: transform .5s cubic-bezier(.2,.8,.3,1);
    }
    #ttyp-progress-close {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.65);
      cursor: pointer;
      transition: background .15s, color .15s;
    }
    #ttyp-progress-close:hover { background: rgba(255, 255, 255, 0.16); color: #fff; }
    #ttyp-progress-overlay.ttyp-shown #ttyp-progress-card { transform: none; }
    #ttyp-progress-status { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
    #ttyp-progress-count { font-size: 12px; opacity: .65; margin-bottom: 14px; }
    #ttyp-progress-track {
      height: 6px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.12);
      overflow: hidden;
    }
    #ttyp-progress-bar {
      height: 100%;
      width: 0%;
      border-radius: 99px;
      background: #5229cd;
      transition: width .35s ease, background-color .35s ease;
    }
    /* Пока не знаем общее число текстовых слоёв (до конца обхода панели
       слоёв) — вместо вранья про «0%» бегущая полоса, тот же приём, что
       у taptop-helper до первого открытия модалки публикации. */
    #ttyp-progress-track.ttyp-indeterminate #ttyp-progress-bar {
      width: 35%;
      animation: ttyp-progress-slide 1.1s ease-in-out infinite;
    }
    @keyframes ttyp-progress-slide {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(285%); }
    }
    #ttyp-progress-hint { font-size: 11px; opacity: .4; margin-top: 10px; }
    #ttyp-progress-overlay.ttyp-done #ttyp-progress-bar { background: #5dcaa5; }
    #ttyp-progress-overlay.ttyp-done #ttyp-progress-hint { visibility: hidden; }
    .ttyp-progress-divider { height: 1px; margin: 20px 0; background: rgba(255, 255, 255, 0.09); }
    #ttyp-progress-done-check {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      margin: 0 auto 14px;
      border-radius: 50%;
      background: rgba(93, 202, 165, 0.14);
    }
    #ttyp-progress-done-text { font-size: 14px; font-weight: 600; line-height: 1.4; margin-bottom: 6px; }
    #ttyp-progress-done-meta { font-size: 11.5px; opacity: .55; line-height: 1.5; margin-bottom: 20px; }
    #ttyp-progress-card .ttyp-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; padding: 12px 20px; border-radius: 12px;
      font-size: 12px; font-weight: 500; text-decoration: none;
      color: #fff; border: none; transition: background .15s, filter .15s;
    }
    #ttyp-progress-card .ttyp-btn-primary { background: #5229cd; margin-bottom: 10px; cursor: pointer; font-family: inherit; }
    #ttyp-progress-card .ttyp-btn-primary:hover { filter: brightness(1.12); }
    #ttyp-progress-card .ttyp-btn-secondary { background: rgb(36, 36, 36); }
    #ttyp-progress-card .ttyp-btn-secondary:hover { background: rgb(50, 50, 50); }
    ${TTYP_PROMO_CSS}
  `;
  document.head.appendChild(styleTag);

  const statusEl = card.querySelector('#ttyp-progress-status');
  const countEl = card.querySelector('#ttyp-progress-count');
  const trackEl = card.querySelector('#ttyp-progress-track');
  const barEl = card.querySelector('#ttyp-progress-bar');
  let maxPct = 0;

  setTimeout(() => {
    overlay.style.opacity = '1';
    overlay.classList.add('ttyp-shown');
  }, 30);

  const blockScroll = (e) => e.preventDefault();
  overlay.addEventListener('wheel', blockScroll, { passive: false });
  overlay.addEventListener('touchmove', blockScroll, { passive: false });
  // Клик по затемнению/карточке не должен уводить фокус/выделение из
  // редактора у себя под оверлеем — но это не тот случай, что раньше
  // (панель без затемнения): здесь оверлей и так перехватывает все
  // клики по странице (pointer-events: auto), в редактор им и так не
  // дойти. Оставлено как явная гарантия, а не полагание на побочный
  // эффект блокировки кликов.
  const guardMousedown = (e) => { if (!e.target.closest('a, button')) e.preventDefault(); };
  overlay.addEventListener('mousedown', guardMousedown, true);

  let closed = false;
  function cleanup() {
    if (closed) return;
    closed = true;
    overlay.removeEventListener('wheel', blockScroll);
    overlay.removeEventListener('touchmove', blockScroll);
    overlay.removeEventListener('mousedown', guardMousedown, true);
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      styleTag.remove();
    }, 600);
    if (ttypOverlayState && ttypOverlayState.overlay === overlay) ttypOverlayState = null;
  }

  function ensureCloseButton() {
    if (card.querySelector('#ttyp-progress-close')) return;
    const closeBtn = document.createElement('button');
    closeBtn.id = 'ttyp-progress-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 1l10 10M11 1 1 11"/></svg>';
    closeBtn.addEventListener('click', cleanup);
    card.appendChild(closeBtn);
  }

  return {
    overlay,
    setStatus(text) { statusEl.textContent = text; },
    // index/total — прогресс по слоям (applyTypografToTaptopSelection.js).
    progress(index, total, label) {
      if (total) {
        trackEl.classList.remove('ttyp-indeterminate');
        const rawPct = Math.min(100, Math.round((index / total) * 100));
        maxPct = Math.max(maxPct, rawPct);
        barEl.style.width = `${maxPct}%`;
        const text = (label || '').trim();
        countEl.textContent = `Слой ${index} из ${total}` + (text ? ` — «${text.slice(0, 40)}»` : '');
      } else {
        countEl.textContent = label || '';
      }
    },
    // Успешный/нейтральный итог («готово» или «менять нечего») — тот же
    // экран-чекмарк, что у taptop-helper после публикации.
    finishOk(title, meta) {
      overlay.classList.add('ttyp-done');
      card.innerHTML = `
        <button id="ttyp-progress-close" type="button" aria-label="Закрыть">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 1l10 10M11 1 1 11"/></svg>
        </button>
        <div id="ttyp-progress-done-check">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div id="ttyp-progress-done-text">${title}</div>
        ${meta ? `<div id="ttyp-progress-done-meta">${meta}</div>` : ''}
        <a class="ttyp-btn ttyp-btn-primary" href="${TTYP_TRACE_LOGOS_URL}" target="_blank" rel="noopener noreferrer">
          Перейти на сайт
        </a>
        <a class="ttyp-btn ttyp-btn-secondary" href="${TTYP_DONATE_URL}" target="_blank" rel="noopener noreferrer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Поддержать автора
        </a>
      `;
      card.querySelector('#ttyp-progress-close').addEventListener('click', cleanup);
    },
    // Ошибка — карточка НЕ пересобирается целиком (как у taptop-helper):
    // промо остаётся на месте, полоса красная, добавляется только крестик.
    finishError(title, meta) {
      overlay.classList.add('ttyp-done');
      trackEl.classList.remove('ttyp-indeterminate');
      barEl.style.background = '#dc2626';
      statusEl.textContent = title;
      countEl.textContent = meta || '';
      card.querySelector('#ttyp-progress-hint').style.visibility = 'hidden';
      ensureCloseButton();
    },
    remove: cleanup,
  };
}

function showProgressOverlay(initialText) {
  const existing = document.getElementById('ttyp-progress-overlay');
  if (existing) existing.remove();
  const stray = document.getElementById('ttyp-progress-style');
  if (stray) stray.remove();
  ttypOverlayState = ttypCreateProgress(initialText || 'Ищу текстовые слои…');
}

function setProgressOverlay(index, total, label) {
  if (!ttypOverlayState) ttypOverlayState = ttypCreateProgress('');
  ttypOverlayState.progress(index, total, label);
}

// kind: 'ok' | 'err'.
function finishProgressOverlay(title, meta, kind) {
  if (!ttypOverlayState) ttypOverlayState = ttypCreateProgress('');
  if (kind === 'err') ttypOverlayState.finishError(title, meta);
  else ttypOverlayState.finishOk(title, meta);
}

function hideProgressOverlay() {
  if (ttypOverlayState) ttypOverlayState.remove();
}
