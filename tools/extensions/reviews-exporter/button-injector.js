// Встраивает кнопку «Собрать отзывы» прямо в интерфейс Яндекс.Карт,
// рядом с заголовком блока отзывов на странице организации.
//
// Карты — SPA: DOM меняется асинхронно, переход между организациями
// не перезагружает страницу. Поэтому:
//  - ищем контейнер через MutationObserver (document.body),
//  - следим за location.href, чтобы пересоздать кнопку при смене организации,
//  - селекторы Яндекса могут поменяться — есть текстовый фолбэк по слову «отзыв».
//
// На web.telegram.org встраивает отдельную кнопку «Собрать комментарии» —
// логика полностью самостоятельная (см. rvwInitTelegram/rvwInitTelegramA
// ниже), потому что точка появления кнопки в Telegram устроена иначе, чем
// на Картах/Avito: кнопка должна существовать только пока открыта ветка
// комментариев конкретного поста, а не быть привязанной к смене URL/
// организации. У Telegram Web два независимых клиента с разной разметкой,
// живущих на разных префиксах пути (/k/ и /a/, см. manifest.json) — отсюда
// два раздельных обработчика, не один общий.
(() => {
  if (location.hostname === 'web.telegram.org') {
    if (location.pathname.startsWith('/a')) {
      rvwInitTelegramA();
    } else {
      rvwInitTelegram();
    }
    return;
  }

  const BTN_ID = 'rvw-collector-btn';
  const STYLE_ID = 'rvw-ext-style';
  const IS_AVITO = location.hostname === 'www.avito.ru';
  const COLLECT_FN = IS_AVITO ? '__rvwCollectAvitoReviews' : '__rvwCollectReviews';

  function findHeaderContainerYandex() {
    // Основной селектор.
    let header = document.querySelector(
      '.business-reviews-card-view__title .card-section-header._wide._type_h2'
    );
    if (header) return header;

    // Фолбэк 1: любой card-section-header, чей заголовок содержит «отзыв».
    const headers = document.querySelectorAll('[class*="card-section-header"]');
    for (const h of headers) {
      const titleEl = h.querySelector('[class*="title"]') || h;
      if (/отзыв/i.test(titleEl.textContent || '')) return h;
    }

    // Фолбэк 2: h2 со словом «отзыв» → ближайший похожий на секцию-заголовок предок.
    const h2s = document.querySelectorAll('h2');
    for (const h2 of h2s) {
      if (/отзыв/i.test(h2.textContent || '')) {
        return h2.closest('[class*="card-section-header"]') || h2.parentElement;
      }
    }

    return null;
  }

  function findHeaderContainerAvito() {
    // У Avito нет стабильного класса заголовка — ищем h1/h2/h3 со словом
    // «отзыв», у которого рядом (в том же родителе) лежат сами карточки
    // отзывов (data-marker — единственный стабильный селектор Avito, классы хэшированные).
    const headers = document.querySelectorAll('h1, h2, h3');
    for (const h of headers) {
      if (!/отзыв/i.test(h.textContent || '')) continue;
      if (h.parentElement && h.parentElement.querySelector('[data-marker^="review("]')) {
        return h;
      }
    }
    // Фолбэк: просто первый заголовок со словом «отзыв».
    for (const h of headers) {
      if (/отзыв/i.test(h.textContent || '')) return h;
    }
    return null;
  }

  // Стопка кнопок контакта с продавцом слева («Показать номер» / «Написать» /
  // «Подписаться»). data-marker — единственный стабильный селектор на Avito,
  // хэшированные CSS-модули (ContactBar-module-*, SubscribeInfo-module-*)
  // меняются между деплоями. Возвращает общий контейнер-стопку или null.
  function findContactStackAvito() {
    const writeBtn = document.querySelector('[data-marker="write-button"]');
    const subscribeBtn = document.querySelector('[data-marker="subscribe"]');
    if (!writeBtn || !subscribeBtn) return null;

    let common = writeBtn.parentElement;
    while (common && !common.contains(subscribeBtn)) {
      common = common.parentElement;
    }
    return common;
  }

  function findHeaderContainer() {
    return IS_AVITO ? findHeaderContainerAvito() : findHeaderContainerYandex();
  }

  function findRightContent(header) {
    if (IS_AVITO) return null; // у Avito нет отдельного правого блока в заголовке — кнопка добавляется в конец
    return (
      header.querySelector('.card-section-header__right-content') ||
      header.querySelector('[class*="right-content"]')
    );
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .rvw-ext-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
        padding: 4px 10px;
        font-family: inherit;
        font-size: 13px;
        line-height: 18px;
        color: #1478FC;
        background: transparent;
        border: 1px solid #1478FC;
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color .15s ease, color .15s ease;
      }
      .rvw-ext-btn:hover:not(:disabled) {
        background-color: #1478FC;
        color: #fff;
      }
      .rvw-ext-btn:disabled {
        opacity: .6;
        cursor: default;
      }
      .rvw-ext-btn-avito {
        display: flex;
        align-items: center;
        justify-content: space-around;
        width: 100%;
        height: 44px;
        padding: 0 16px;
        margin: 0;
        font-family: Manrope, Arial, "Helvetica Neue", Helvetica, "Arial Rub", sans-serif;
        font-size: 15px;
        font-weight: 400;
        line-height: normal;
        color: #fff;
        background: #5229cd;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color .15s ease;
      }
      .rvw-ext-btn-avito:hover:not(:disabled) {
        background: #4520ad;
      }
      .rvw-ext-btn-avito:disabled {
        opacity: .6;
        cursor: default;
      }
      .rvw-ext-btn-avito-inline {
        display: inline-flex;
        align-items: center;
        margin-left: 12px;
        padding: 4px 10px;
        font-family: inherit;
        font-size: 13px;
        line-height: 18px;
        vertical-align: middle;
        color: #fff;
        background: #5229cd;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color .15s ease;
      }
      .rvw-ext-btn-avito-inline:hover:not(:disabled) {
        background: #4520ad;
      }
      .rvw-ext-btn-avito-inline:disabled {
        opacity: .6;
        cursor: default;
      }
    `;
    document.head.appendChild(style);
  }

  function makeButton(className) {
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.className = className || (IS_AVITO ? 'rvw-ext-btn-avito' : 'rvw-ext-btn');
    btn.textContent = 'Собрать отзывы';
    btn.addEventListener('click', onClick);
    return btn;
  }

  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = document.getElementById(BTN_ID);
    if (!btn) return;

    if (typeof window[COLLECT_FN] !== 'function') {
      console.error(`[rvw] window.${COLLECT_FN} не найдена — collector.js не подключился.`);
      btn.textContent = 'Ошибка';
      setTimeout(() => { if (btn.isConnected) btn.textContent = 'Собрать отзывы'; }, 2000);
      return;
    }

    const original = 'Собрать отзывы';
    btn.disabled = true;
    btn.textContent = 'Собираю…';

    try {
      const result = await window[COLLECT_FN]();
      if (result && result.ok) {
        btn.textContent = `Готово: ${result.total}`;
      } else {
        btn.textContent = 'Ошибка';
        console.error('[rvw] ошибка сбора отзывов:', result && result.error);
      }
    } catch (err) {
      btn.textContent = 'Ошибка';
      console.error('[rvw] исключение при сборе отзывов:', err);
    } finally {
      setTimeout(() => {
        if (btn.isConnected) {
          btn.disabled = false;
          btn.textContent = original;
        }
      }, 2500);
    }
  }

  function ensureButton() {
    if (document.getElementById(BTN_ID)) return; // уже вставлена

    if (IS_AVITO) {
      const stack = findContactStackAvito();
      if (stack) {
        injectStyles();
        // Хэшированные классы соседей нестабильны между деплоями Avito — используем
        // их только как best-effort совпадение отступа, а не как обязательную зависимость;
        // inline margin-top ниже гарантирует отступ от стопки, даже если классы не совпали.
        const wrapper = document.createElement('div');
        wrapper.className = 'styles-module-flex-mJzcB styles-module-flex-col-zuXfL styles-module-child-width-full-26DGJ styles-module-child-height-auto-b3tJ4';
        wrapper.style.marginTop = '12px';
        wrapper.appendChild(makeButton());
        stack.appendChild(wrapper);
        return;
      }
      // Фолбэк, если стопку контактных кнопок не нашли (например, у продавца
      // отключены «Написать»/«Подписаться», или мы на странице конкретного
      // объявления, где стопки вовсе нет). Кнопка вставляется ВНУТРЬ заголовка
      // «Отзывы» (а не afterend-сиблингом) — это блочный h1/h2/h3, соседний
      // блочный элемент уходил бы на новую строку и растягивался на всю ширину.
      // Узкий инлайн-стиль вместо полноширинного стопочного.
      const header = findHeaderContainer();
      if (!header) return;
      injectStyles();
      header.appendChild(makeButton('rvw-ext-btn-avito-inline'));
      return;
    }

    const header = findHeaderContainer();
    if (!header) return;

    injectStyles();

    const btn = makeButton();
    const rightContent = findRightContent(header);
    if (rightContent && rightContent.parentElement === header) {
      rightContent.insertAdjacentElement('beforebegin', btn);
    } else {
      header.appendChild(btn);
    }
  }

  function removeButton() {
    const btn = document.getElementById(BTN_ID);
    if (btn) btn.remove();
  }

  // Наблюдаем за DOM: заголовок блока отзывов появляется асинхронно
  // (и может исчезать/пересоздаваться при рендере React-подобного приложения).
  const observer = new MutationObserver(() => ensureButton());
  observer.observe(document.body, { childList: true, subtree: true });

  // SPA-навигация между организациями не создаёт полноценной перезагрузки
  // страницы — отслеживаем смену URL вручную и пересоздаём кнопку.
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      removeButton(); // старая кнопка (и её обработчик) больше не актуальны для новой организации
    }
  }, 500);

  ensureButton();
})();

// Кнопка «Собрать комментарии» в Telegram Web (клиент K). Появляется только
// пока открыта ветка обсуждения конкретного поста — это единственный экран,
// где данные вообще есть (список комментариев, а не список чатов).
//
// Ветка обсуждения — не отдельная страница: Telegram держит её как второй
// `.chat.tabs-tab` поверх основного чата канала, помеченный
// `data-type="discussion"` и `.active`, пока панель открыта (см. collector.js
// → rvwFindTelegramDiscussion). Опрос интервалом, а не MutationObserver на
// document.body — на Картах/Avito страница почти статична между действиями
// пользователя, а Telegram непрерывно перерисовывает сообщения (тайпинг,
// прочитанные статусы, реакции); вешать тяжёлый subtree-наблюдатель на весь
// документ здесь означало бы гонять ensureButton() сотни раз в секунду.
function rvwInitTelegram() {
  const BTN_ID = 'rvw-tg-collector-btn';
  const STYLE_ID = 'rvw-tg-ext-style';

  function findActiveDiscussion() {
    return document.querySelector('.chats-container.tabs-container > .chat.tabs-tab[data-type="discussion"].active');
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .rvw-tg-btn {
        display: inline-flex;
        align-items: center;
        height: 32px;
        padding: 0 14px;
        margin-right: 6px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        color: #fff;
        background: #5229cd;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color .15s ease, opacity .15s ease;
      }
      .rvw-tg-btn:hover:not(:disabled) { background: #4520ad; }
      .rvw-tg-btn:disabled { opacity: .6; cursor: default; }
    `;
    document.head.appendChild(style);
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.className = 'rvw-tg-btn';
    btn.textContent = 'Собрать комментарии';
    btn.addEventListener('click', onClick);
    return btn;
  }

  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = document.getElementById(BTN_ID);
    if (!btn) return;

    if (typeof window.__rvwCollectTelegramComments !== 'function') {
      console.error('[rvw] window.__rvwCollectTelegramComments не найдена — collector.js не подключился.');
      btn.textContent = 'Ошибка';
      setTimeout(() => { if (btn.isConnected) btn.textContent = 'Собрать комментарии'; }, 2000);
      return;
    }

    const original = 'Собрать комментарии';
    btn.disabled = true;
    btn.textContent = 'Собираю…';

    try {
      const result = await window.__rvwCollectTelegramComments();
      if (result && result.ok) {
        btn.textContent = `Готово: ${result.total}`;
      } else {
        btn.textContent = 'Ошибка';
        console.error('[rvw] ошибка сбора комментариев:', result && result.error);
      }
    } catch (err) {
      btn.textContent = 'Ошибка';
      console.error('[rvw] исключение при сборе комментариев:', err);
    } finally {
      setTimeout(() => {
        if (btn.isConnected) {
          btn.disabled = false;
          btn.textContent = original;
        }
      }, 2500);
    }
  }

  function ensureButton() {
    const discussion = findActiveDiscussion();

    if (!discussion) {
      const stale = document.getElementById(BTN_ID);
      if (stale) stale.remove(); // ветку закрыли — кнопка вне комментариев не нужна
      return;
    }

    if (document.getElementById(BTN_ID)) return; // уже вставлена в эту ветку

    const utils = discussion.querySelector('.chat-utils');
    if (!utils) return;

    injectStyles();
    utils.insertBefore(makeButton(), utils.firstChild);
  }

  setInterval(ensureButton, 500);
  ensureButton();
}

// Кнопка «Собрать комментарии» в Telegram Web (клиент A, web.telegram.org/a/).
// Разметка целиком другая, чем у клиента K, — см. подробный разбор в
// collector.js перед rvwFindTelegramDiscussionHeaderA. Открытая ветка
// определяется структурно (у шапки ветки нет `.chat-info-wrapper`), а не по
// тексту заголовка — независимо от языка интерфейса.
function rvwInitTelegramA() {
  const BTN_ID = 'rvw-tg-a-collector-btn';
  const STYLE_ID = 'rvw-tg-a-ext-style';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .rvw-tg-a-btn {
        display: inline-flex;
        align-items: center;
        height: 32px;
        padding: 0 14px;
        margin-right: 6px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        color: #fff;
        background: #5229cd;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color .15s ease, opacity .15s ease;
      }
      .rvw-tg-a-btn:hover:not(:disabled) { background: #4520ad; }
      .rvw-tg-a-btn:disabled { opacity: .6; cursor: default; }
    `;
    document.head.appendChild(style);
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.className = 'rvw-tg-a-btn';
    btn.textContent = 'Собрать комментарии';
    btn.addEventListener('click', onClick);
    return btn;
  }

  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = document.getElementById(BTN_ID);
    if (!btn) return;

    if (typeof window.__rvwCollectTelegramCommentsA !== 'function') {
      console.error('[rvw] window.__rvwCollectTelegramCommentsA не найдена — collector.js не подключился.');
      btn.textContent = 'Ошибка';
      setTimeout(() => { if (btn.isConnected) btn.textContent = 'Собрать комментарии'; }, 2000);
      return;
    }

    const original = 'Собрать комментарии';
    btn.disabled = true;
    btn.textContent = 'Собираю…';

    try {
      const result = await window.__rvwCollectTelegramCommentsA();
      if (result && result.ok) {
        btn.textContent = `Готово: ${result.total}`;
      } else {
        btn.textContent = 'Ошибка';
        console.error('[rvw] ошибка сбора комментариев (A):', result && result.error);
      }
    } catch (err) {
      btn.textContent = 'Ошибка';
      console.error('[rvw] исключение при сборе комментариев (A):', err);
    } finally {
      setTimeout(() => {
        if (btn.isConnected) {
          btn.disabled = false;
          btn.textContent = original;
        }
      }, 2500);
    }
  }

  // Точка вставки — `.header-tools .HeaderActions`: лежит СНАРУЖИ обоих
  // `.Transition_slide` шапки (канал/ветка), поэтому существует независимо
  // от того, какой из них сейчас активен — стабильный якорь, не нужно
  // ловить его пересоздание при переключении слайдов.
  function ensureButton() {
    const headerSlide = document.querySelector('.MiddleHeader .Transition_slide.Transition_slide-active');
    const isDiscussion = headerSlide && !headerSlide.querySelector('.chat-info-wrapper') && headerSlide.querySelector('.back-button');

    if (!isDiscussion) {
      const stale = document.getElementById(BTN_ID);
      if (stale) stale.remove();
      return;
    }

    if (document.getElementById(BTN_ID)) return;

    const actions = document.querySelector('.MiddleHeader .header-tools .HeaderActions');
    if (!actions) return;

    injectStyles();
    actions.insertBefore(makeButton(), actions.firstChild);
  }

  setInterval(ensureButton, 500);
  ensureButton();
}
