// Логика сбора отзывов организации на Яндекс.Картах/Бизнесе, продавца на Avito
// и комментариев к посту канала в Telegram Web.
// Файл НЕ выполняет сбор сам по себе — он лишь объявляет
// window.__rvwCollectReviews() / window.__rvwCollectAvitoReviews() /
// window.__rvwCollectTelegramComments(), которые вызывает button-injector.js
// по клику на кнопку, встроенную в интерфейс страницы. Попапа у расширения
// нет — единственная точка входа в интерфейсе.
//
// Подключается как обычный content script (manifest.json → content_scripts),
// поэтому объявление идемпотентно: повторная инъекция просто
// переопределит функцию тем же кодом, побочных эффектов нет.
const RVW_TRACE_LOGOS_URL = 'https://trace-logos.ru/?utm_source=reviews-exporter&utm_medium=extension';
const RVW_DONATE_URL = 'https://app.lava.top/products/6f3c8efd-27c3-41a8-acb1-559b83ea3b46/d9261f0e-d716-418c-b91d-764e83f1c01c?currency=RUB';
const RVW_VERSION_URL = 'https://trace-logos.ru/tools/extensions/reviews-exporter/version.json';
const RVW_DOWNLOAD_PAGE_URL = 'https://trace-logos.ru/tools/extensions/reviews-exporter/';

function rvwIsNewerVersion(remote, current) {
  const r = String(remote).split('.').map(Number);
  const c = String(current).split('.').map(Number);
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    const rv = r[i] || 0;
    const cv = c[i] || 0;
    if (rv !== cv) return rv > cv;
  }
  return false;
}

// Реальное автообновление (update_url + подписанный .crx) Chrome блокирует
// для несамоподписанных источников — это единственное место, где пользователь
// вообще видит расширение во время работы, поэтому плашка о новой версии
// показывается тут, отдельным блоком под промо-панелью.
async function checkRvwUpdate(banner) {
  try {
    const res = await fetch(RVW_VERSION_URL, { cache: 'no-store' });
    if (!res.ok) return;
    const { version: latest } = await res.json();
    const current = chrome.runtime.getManifest().version;
    if (!latest || !rvwIsNewerVersion(latest, current)) return;

    banner.href = RVW_DOWNLOAD_PAGE_URL;
    banner.textContent = `Доступна версия ${latest} — обновить`;
    banner.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      banner.style.opacity = '1';
    }));
  } catch {
    // Сеть недоступна или CORS — баннер просто не показываем, тихая деградация.
  }
}

// forms = [один, два-четыре, пять-и-больше], например ['отзыв','отзыва','отзывов'].
function rvwPluralWord(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
const RVW_REVIEW_WORDS = ['отзыв', 'отзыва', 'отзывов'];
const RVW_COMMENT_WORDS = ['комментарий', 'комментария', 'комментариев'];

// Промо-блок Trace Logos — единственный источник этой разметки. Показывается
// в карточке прогресса, одной и той же на Яндекс.Картах и на Avito.
function rvwPromoInnerHtml() {
  const popularLogos = [
    ['ozon', 'Ozon'],
    ['wildberries', 'Wildberries'],
    ['2gis', '2ГИС'],
    ['yandex', 'Яндекс'],
    ['sber', 'Сбер'],
    ['vk', 'ВКонтакте'],
  ];
  const logosGridHtml = popularLogos
    .map(([slug, name]) => `
      <img class="rvw-logo-cell" src="${chrome.runtime.getURL(`promo-assets/${slug}.svg`)}" alt="${name}" title="${name}" loading="lazy" />
    `)
    .join('');

  return `
    <img src="${chrome.runtime.getURL('promo-assets/trace-logos.png')}" width="52" height="52" style="border-radius:13px; display:block; margin:0 auto 12px;" alt="Trace Logos" />
    <div style="font-size:15px; font-weight:600; margin-bottom:6px;">Trace Logos</div>
    <div style="font-size:12px; opacity:.65; line-height:1.45; margin-bottom:16px;">3000+ SVG/PNG-логотипов брендов — бесплатно, без регистрации</div>
    <div class="rvw-logo-grid">${logosGridHtml}</div>
    <a class="rvw-btn rvw-btn-primary" href="${RVW_TRACE_LOGOS_URL}" target="_blank" rel="noopener noreferrer">
      Перейти на сайт
    </a>
    <a class="rvw-btn rvw-btn-secondary" href="${RVW_DONATE_URL}" target="_blank" rel="noopener noreferrer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      Поддержать автора
    </a>
  `;
}

// Общие стили промо-блока.
const RVW_PROMO_CSS = `
  .rvw-promo, .rvw-promo * {
    box-sizing: border-box;
  }
  .rvw-promo .rvw-logo-grid {
    display: flex;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .rvw-promo .rvw-logo-cell {
    width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; border-radius: 8px;
  }
  .rvw-promo .rvw-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 12px 20px; border-radius: 12px;
    font-size: 12px; font-weight: 500; text-decoration: none;
    color: #fff; transition: background .15s, filter .15s;
  }
  .rvw-promo .rvw-btn-primary {
    background: #5229cd;
    margin-bottom: 10px;
  }
  .rvw-promo .rvw-btn-primary:hover { filter: brightness(1.12); }
  .rvw-promo .rvw-btn-secondary {
    background: rgb(36, 36, 36);
  }
  .rvw-promo .rvw-btn-secondary:hover { background: rgb(50, 50, 50); }
`;

// Эмодзи + вариационные селекторы + ZWJ + модификаторы тона кожи + пробелы.
const RVW_EMOJI_ONLY_RE = /^[\p{Emoji}\p{Emoji_Component}‍️\s]*$/u;

// Разбор одной карточки отзыва на Яндекс.Картах.
//
// key — устойчивая личность отзыва: автор + дата + начало текста. Именно
// «начало»: клик по «Ещё» дописывает текст в КОНЕЦ, поэтому префикс переживает
// раскрытие и раскрытый отзыв не превращается в новую запись. Один автор
// с одной датой и одним началом текста — это один и тот же отзыв, даже если
// Яндекс пересоздал узел при прокрутке.
function rvwParseYandexReview(el) {
  const nameEl = el.querySelector('.business-review-view__author-name');
  const dateEl = el.querySelector('.business-review-view__date');
  const bodyEl = el.querySelector('.business-review-view__body');

  const name = nameEl ? nameEl.textContent.trim() : 'Без имени';
  const date = dateEl ? dateEl.textContent.trim() : '';
  const text = bodyEl
    ? bodyEl.textContent
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?;:])/g, '$1') // убираем пробел перед знаком препинания
      .replace(/([,.!?;:])(?=[^\s,.!?;:])/g, '$1 ') // гарантируем пробел после знака (кроме многоточий/цепочек типа "?!")
      .trim()
    : '';

  const key = `${name}|${date}|${text.slice(0, 40)}`;

  // Отзыв без текста (только оценка звёздами) или состоящий из одних эмодзи
  // в файл не идёт. Но в счётчик ПРОЧИТАННЫХ попадает: в шапке Яндекса такие
  // отзывы учтены, и без них процент никогда не дошёл бы до 100%.
  if (!text) return { key, skip: 'empty' };
  if (RVW_EMOJI_ONLY_RE.test(text)) return { key, skip: 'emoji' };

  let rating = 0;
  el.querySelectorAll('.business-rating-badge-view__star').forEach((s) => {
    if (s.className.includes('_full')) rating += 1;
    else if (s.className.includes('_half')) rating += 0.5;
  });

  let likes = 0;
  let dislikes = 0;
  el.querySelectorAll('.business-reactions-view__container').forEach((c) => {
    const icon = c.querySelector('.business-reactions-view__icon');
    const counterEl = c.querySelector('.business-reactions-view__counter');
    const count = counterEl ? parseInt(counterEl.textContent.trim(), 10) || 0 : 0;
    if (icon && icon.className.includes('_dislike')) dislikes = count;
    else likes = count;
  });

  return { key, review: { name, date, text, rating, likes, dislikes } };
}

window.__rvwCollectReviews = async function collectYandexReviews() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let scroller = document.querySelector('.scroll__container');
  if (!scroller || !scroller.querySelector('.business-review-view')) {
    let el = document.querySelector('.business-review-view');
    while (el && !(el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY !== 'visible')) {
      el = el.parentElement;
    }
    scroller = el;
  }
  if (!scroller) {
    console.error('[rvw] Не нашёл контейнер прокрутки отзывов.');
    return { ok: false, error: 'Не нашёл контейнер прокрутки отзывов. Открой блок отзывов на странице организации.' };
  }

  // Тот же индикатор, что и на Avito. Отзывы на фоне прокручиваются сами —
  // затемнение сквозное (pointer-events: none), процесс видно за карточкой.
  const indicator = createRvwProgress({ initialText: 'Открываю список отзывов' });

  try {
    const result = await collectWithIndicator(scroller);
    // Успех: карточка сама переключается на экран «готово» с кнопкой скачивания
    // и живёт до клика по ней. Ошибка — убираем сразу.
    if (result && result.ok) {
      indicator.finish(result.total, { content: result.content, filename: result.filename });
    } else {
      indicator.remove();
    }
    return result;
  } catch (err) {
    indicator.remove();
    throw err;
  }

  async function collectWithIndicator(scroller) {

  // Повторный запуск сбора на уже прокрученной странице (без обновления)
  // стартовал бы с текущей позиции: Яндекс переиспользует DOM-узлы списка
  // при долгой прокрутке, и часть отзывов сверху к этому моменту уже
  // не существует в DOM — harvest() их просто не увидит. Сбрасываем скролл
  // в начало и ждём, пока список подтянет верхние карточки обратно.
  if (scroller.scrollTop > 0) {
    scroller.scrollTop = 0;
    await sleep(700);
  }

  // Название организации — h1 в шапке карточки. Ссылка внутри (не сам h1)
  // несёт текст; сам h1 может дополнительно содержать бейдж верификации.
  function readOrgName() {
    const el = document.querySelector('.card-title-view__title-link')
      || document.querySelector('.card-title-view__title');
    return el ? el.textContent.trim() : '';
  }
  const orgName = readOrgName();
  console.log('[rvw] Организация:', orgName || '(не нашёл)');

  // Знаменатель прогресса — число из заголовка блока отзывов.
  // Два подвоха, каждый из которых раньше ломал процент:
  //   1. Разряды в числе разделены неразрывным/узким пробелом («1 250»),
  //      поэтому сначала склеиваем их, иначе \d+ вернёт 1 и полоса встанет
  //      на 100% с первого же отзыва;
  //   2. заголовок может отрисоваться позже старта сбора или показывать
  //      не то число, что в итоге подгрузится, — поэтому читаем его на каждой
  //      итерации и держим максимум. Знаменатель только растёт, но процент
  //      от этого не падает: индикатор не даёт ему уменьшаться (см. progress()).
  function readTotalExpected() {
    const h = document.querySelector('.card-section-header__title');
    if (!h) return null;
    const scope = /\d/.test(h.textContent) ? h : h.closest('.card-section-header') || h;
    const m = scope.textContent.replace(/(\d)[\s   ](?=\d)/g, '$1').match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
  }

  function clickAllExpand() {
    document.querySelectorAll('.business-review-view__expand').forEach((btn) => {
      try { btn.click(); } catch (e) {}
    });
  }

  const reviews = new Map();  // key → отзыв, который уйдёт в файл (порядок = порядок появления)
  const dropped = new Map();  // key → 'empty' | 'emoji'

  // WeakMap, а не свойство на самом DOM-узле: узел переживает между запусками
  // сбора, если страница не обновлялась, а reviews/dropped выше — свежие
  // на каждый вызов. Раньше кеш длины текста писался прямо в el.__rvwLen —
  // при повторном запуске без reload у всех карточек текст уже совпадал
  // с прошлым прогоном, harvest() решал, что ничего разбирать не нужно,
  // и никогда не наполнял новый reviews. WeakMap живёт только в замыкании
  // этого вызова и всегда стартует пустым.
  const seenLen = new WeakMap();

  // Разбираем отзывы НА ХОДУ, а не одним проходом по DOM в конце. Причина:
  // Яндекс переиспользует узлы списка при долгой прокрутке, и финальный
  // querySelectorAll видит уже не все карточки — часть отзывов просто
  // терялась. Заодно это чинит счётчик: он считает накопленное и поэтому
  // не может уменьшиться, а последнее показанное число совпадает с тем,
  // что попадёт в файл (раньше прогресс считал узлы DOM, а файл — записи
  // после фильтров, и в конце число прыгало).
  function harvest() {
    document.querySelectorAll('.business-review-view').forEach((el) => {
      // Перечитываем карточку, только если её текст изменился с прошлого
      // прохода (раскрылось «Ещё») — иначе на каждой итерации заново
      // разбирали бы все сотни узлов.
      const bodyEl = el.querySelector('.business-review-view__body');
      const len = bodyEl ? bodyEl.textContent.length : 0;
      if (seenLen.get(el) === len) return;
      seenLen.set(el, len);

      const parsed = rvwParseYandexReview(el);
      if (parsed.skip) {
        // Раскрытие могло превратить «пустой» отзыв в текстовый и наоборот —
        // держим запись ровно в одном из двух наборов.
        reviews.delete(parsed.key);
        dropped.set(parsed.key, parsed.skip);
      } else {
        dropped.delete(parsed.key);
        reviews.set(parsed.key, parsed.review); // перезапись = раскрытый текст вместо обрезанного
      }
    });
  }

  const seenCount = () => reviews.size + dropped.size;

  let totalExpected = readTotalExpected();
  console.log('[rvw] Заявлено отзывов в заголовке:', totalExpected);

  const stepPx = 250;            // маленький шаг, как колесом мыши
  const stepDelay = 150;         // пауза между шагами
  const bottomPauseDelay = 900;  // доп. пауза когда упёрлись в низ, чтобы дать подгрузиться новой порции

  let stableRounds = 0;
  const maxStableRounds = 6; // запасной вариант, если totalExpected не совпадёт
  let lastSeen = -1;
  let iterations = 0;
  const maxIterations = 5000;

  while (iterations < maxIterations) {
    iterations++;

    const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 5;

    if (!atBottom) {
      scroller.scrollTop += stepPx;
      await sleep(stepDelay);
    } else {
      // упёрлись в низ - ждём подольше, вдруг подгрузится ещё
      await sleep(bottomPauseDelay);
    }

    clickAllExpand();
    harvest();

    const expectedNow = readTotalExpected();
    if (expectedNow && (!totalExpected || expectedNow > totalExpected)) totalExpected = expectedNow;

    const seen = seenCount();

    if (iterations % 10 === 0 || seen !== lastSeen) {
      console.log(`[rvw] Итерация ${iterations}: прочитано — ${seen}${totalExpected ? ' из ' + totalExpected : ''}, в файл — ${reviews.size}, scrollTop ${scroller.scrollTop}/${scroller.scrollHeight}`);
    }

    // Счётчик показывает то, что уйдёт в файл; процент считается по прочитанным
    // (в заголовке Яндекса учтены и пустые отзывы, и «только эмодзи»).
    indicator.progress({ total: reviews.size, done: seen, expected: totalExpected });

    // Главное условие остановки: прочитали столько, сколько заявлено в заголовке
    if (totalExpected && seen >= totalExpected) {
      console.log('[rvw] Достигли заявленного количества отзывов, останавливаемся.');
      break;
    }

    // Запасное условие: если долго ничего не меняется (даже находясь внизу)
    if (seen === lastSeen) {
      stableRounds++;
    } else {
      stableRounds = 0;
      lastSeen = seen;
    }
    if (stableRounds >= maxStableRounds && atBottom) {
      console.warn('[rvw] Список перестал расти, а до заявленного числа не дотянули. Останавливаюсь на том, что есть.');
      break;
    }
  }

  clickAllExpand();
  await sleep(500);
  harvest();

  const collected = [...reviews.values()];
  if (!collected.length) {
    return { ok: false, error: 'Не нашёл ни одного отзыва с текстом. Открой блок отзывов на странице организации.' };
  }

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 }; // 0 — без оценки
  let ratingSum = 0;
  let ratedCount = 0;

  const lines = collected.map((r, i) => {
    const rounded = Math.round(r.rating);
    ratingCounts[rounded] = (ratingCounts[rounded] || 0) + 1;
    if (r.rating > 0) { ratingSum += r.rating; ratedCount++; }

    const reactionParts = [];
    if (r.likes > 0) reactionParts.push(`👍 ${r.likes}`);
    if (r.dislikes > 0) reactionParts.push(`👎 ${r.dislikes}`);
    const reactionsLine = reactionParts.length ? reactionParts.join(' / ') : '';

    return (
      `## ${i + 1}. ${r.name}\n\n` +
      `- **Дата:** ${r.date}\n` +
      `- **Оценка:** ${r.rating || 'нет'}/5\n` +
      (reactionsLine ? `- **Реакции:** ${reactionsLine}\n` : '') +
      `\n${r.text}`
    );
  });

  const avgRating = ratedCount
    ? parseFloat((ratingSum / ratedCount).toFixed(2)).toString()
    : 'нет';
  const distribution = [5, 4, 3, 2, 1].map((star) => `- ${star}★: ${ratingCounts[star]}`).join('\n') +
    (ratingCounts[0] ? `\n- без оценки: ${ratingCounts[0]}` : '');

  const header =
    `# Отзывы\n\n` +
    (orgName ? `- **Организация:** ${orgName}\n` : '') +
    `- **Собрано отзывов:** ${collected.length}\n` +
    `- **Средний рейтинг:** ${avgRating}/5\n\n` +
    `### Распределение по оценкам\n\n${distribution}`;

  const footer =
    `Сделано при поддержке [Trace Logos](${RVW_TRACE_LOGOS_URL})\n\n` +
    `Telegram автора: [@mansurov_rafael](https://t.me/mansurov_rafael)`;

  const content = `${header}\n\n---\n\n` + lines.join('\n\n---\n\n') + `\n\n---\n\n${footer}`;

  const skippedEmpty = [...dropped.values()].filter((v) => v === 'empty').length;
  const skippedEmoji = [...dropped.values()].filter((v) => v === 'emoji').length;

  // Файл не скачивается автоматически — только по клику «Скачать файл»
  // на финальной карточке (см. createRvwProgress().finish()), как на Avito.
  console.log(`[rvw] Готово! Собрано отзывов: ${collected.length} из ${totalExpected} (пропущено: эмодзи-only ${skippedEmoji}, пустых ${skippedEmpty})`);

    return {
      ok: true,
      total: collected.length,
      expected: totalExpected,
      content,
      filename: 'yandex_reviews.md',
    };
  }
};

// Единый индикатор сбора — и для Avito, и для Яндекс.Карт. Центральная
// карточка с прогрессом поверх затемнённой страницы: на Avito сбор идёт
// запросами к API и DOM не меняется вообще, на Картах наоборот — блок отзывов
// на фоне сам прокручивается и подгружает новые. В обоих случаях состояние
// показывает карточка, а страница за ней остаётся видимой — но заблокирована:
// затемнение перехватывает клики (pointer-events: auto), а колесо/тачпад/свайп
// глушатся отдельно, иначе скролл проходит сквозь непрозрачный для кликов
// элемент прямо в документ под ним.
function createRvwProgress({ initialText = 'Начинаю сбор', statusText = 'Собираю отзывы…', noun = RVW_REVIEW_WORDS } = {}) {
  const overlay = document.createElement('div');
  overlay.id = 'rvw-progress-overlay';

  const card = document.createElement('div');
  card.id = 'rvw-progress-card';
  card.innerHTML = `
    <div id="rvw-progress-status">${statusText}</div>
    <div id="rvw-progress-count">${initialText}</div>
    <div id="rvw-progress-track"><div id="rvw-progress-bar"></div></div>
    <div id="rvw-progress-hint">Не закрывай вкладку</div>
    <div class="rvw-progress-divider"></div>
    <div class="rvw-promo"></div>
  `;
  card.querySelector('.rvw-promo').innerHTML = rvwPromoInnerHtml();
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const updateBanner = document.createElement('a');
  updateBanner.id = 'rvw-update-banner';
  updateBanner.target = '_blank';
  updateBanner.rel = 'noopener noreferrer';
  Object.assign(updateBanner.style, {
    display: 'none',
    marginTop: '12px',
    width: '100%',
  });
  card.appendChild(updateBanner);
  checkRvwUpdate(updateBanner);

  const styleTag = document.createElement('style');
  styleTag.id = 'rvw-progress-style';
  styleTag.textContent = `
    #rvw-progress-overlay {
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
      /* auto, а не none: пока окно открыто, клики и скролл по фону не должны
         проходить — сбор всё равно не сломался бы, но пользователь не должен
         случайно тыкать по карте/объявлению под затемнением. */
      pointer-events: auto;
    }
    #rvw-progress-card, #rvw-progress-card * {
      box-sizing: border-box;
    }
    #rvw-progress-card {
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
    #rvw-progress-close {
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
    #rvw-progress-close:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }
    #rvw-progress-overlay.rvw-shown #rvw-progress-card { transform: none; }
    #rvw-progress-status {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    #rvw-progress-count {
      font-size: 12px;
      opacity: .65;
      margin-bottom: 14px;
    }
    #rvw-progress-track {
      height: 6px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.12);
      overflow: hidden;
    }
    #rvw-progress-bar {
      height: 100%;
      width: 0%;
      border-radius: 99px;
      background: #5229cd;
      transition: width .35s ease, background-color .35s ease;
    }
    /* Пока API не отдал общее количество, процента ещё нет — вместо вранья
       про «0%» показываем бегущую полосу. */
    #rvw-progress-track.rvw-indeterminate #rvw-progress-bar {
      width: 35%;
      animation: rvw-progress-slide 1.1s ease-in-out infinite;
    }
    @keyframes rvw-progress-slide {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(285%); }
    }
    #rvw-progress-hint {
      font-size: 11px;
      opacity: .4;
      margin-top: 10px;
    }
    #rvw-progress-overlay.rvw-done #rvw-progress-bar { background: #5dcaa5; }
    #rvw-progress-overlay.rvw-done #rvw-progress-hint { visibility: hidden; }
    .rvw-progress-divider {
      height: 1px;
      margin: 20px 0;
      background: rgba(255, 255, 255, 0.09);
    }
    #rvw-progress-done-check {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      margin: 0 auto 14px;
      border-radius: 50%;
      background: rgba(93, 202, 165, 0.14);
    }
    #rvw-progress-done-text {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 20px;
    }
    #rvw-progress-card .rvw-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; padding: 12px 20px; border-radius: 12px;
      font-size: 12px; font-weight: 500; text-decoration: none;
      color: #fff; border: none; transition: background .15s, filter .15s;
    }
    #rvw-progress-card .rvw-btn-primary {
      background: #5229cd;
      margin-bottom: 10px;
      cursor: pointer;
      font-family: inherit;
    }
    #rvw-progress-card .rvw-btn-primary:hover { filter: brightness(1.12); }
    #rvw-progress-card .rvw-btn-secondary {
      background: rgb(36, 36, 36);
    }
    #rvw-progress-card .rvw-btn-secondary:hover { background: rgb(50, 50, 50); }
    ${RVW_PROMO_CSS}
    #rvw-update-banner {
      box-sizing: border-box;
      display: block;
      padding: 10px 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      color: #fff;
      background: #5229cd;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      transition: filter .15s;
    }
    #rvw-update-banner:hover { filter: brightness(1.12); }
  `;
  document.head.appendChild(styleTag);

  const statusEl = card.querySelector('#rvw-progress-status');
  const countEl = card.querySelector('#rvw-progress-count');
  const trackEl = card.querySelector('#rvw-progress-track');
  const barEl = card.querySelector('#rvw-progress-bar');
  trackEl.classList.add('rvw-indeterminate');
  // Знаменатель (expected) может уточниться ВВЕРХ на середине сбора — на
  // Яндекс.Картах заголовок блока иногда домонтируется позже старта, на Avito
  // reviewCountHint приходит только во второй порции. Если это произойдёт,
  // процент от того же числителя формально должен упасть — визуально это
  // читается как «сбой», хотя данные корректны. Полоса зажата на максимуме,
  // который уже показывали: назад она не идёт никогда.
  let maxPct = 0;

  // Появление через таймер, а не requestAnimationFrame: сбор идёт ~45 секунд,
  // пользователь за это время обычно уходит на другую вкладку, а в фоновой
  // вкладке rAF не вызывается — модалка так и осталась бы прозрачной.
  setTimeout(() => {
    overlay.style.opacity = '1';
    overlay.classList.add('rvw-shown');
  }, 30);

  // Колесо/тачпад/свайп по затемнению иначе прокрутили бы страницу под ним:
  // pointer-events блокирует только клики, скролл — отдельное событие,
  // которое браузер применяет к элементу под курсором независимо от него.
  const blockScroll = (e) => e.preventDefault();
  overlay.addEventListener('wheel', blockScroll, { passive: false });
  overlay.addEventListener('touchmove', blockScroll, { passive: false });

  let closed = false;
  function cleanup() {
    if (closed) return; // finish()'s download-клик и remove()/close могут сработать оба
    closed = true;
    overlay.removeEventListener('wheel', blockScroll);
    overlay.removeEventListener('touchmove', blockScroll);
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      styleTag.remove();
    }, 600);
  }

  return {
    // total — сколько записей собрано (это и видит пользователь в счётчике),
    // done — величина, сопоставимая с expected, по ней считается процент.
    // На Avito они расходятся: expected из API считает только отзывы С ОЦЕНКОЙ
    // (записи «Не договорились» идут без score), поэтому done — их количество,
    // иначе под конец вышло бы «2102 из ~1932». На Картах done === total.
    progress({ total, expected, done = total }) {
      if (expected) {
        trackEl.classList.remove('rvw-indeterminate');
        // Обрезаем по 100% по той же причине: без обрезки полоса уехала бы за край.
        const rawPct = Math.min(100, Math.round((done / expected) * 100));
        maxPct = Math.max(maxPct, rawPct);
        barEl.style.width = `${maxPct}%`;
        countEl.textContent = `Собрано ${total} ${rvwPluralWord(total, noun)} · ${maxPct}%`;
      } else {
        countEl.textContent = `Собрано ${total} ${rvwPluralWord(total, noun)}`;
      }

      const btn = document.getElementById('rvw-collector-btn');
      if (btn && btn.disabled) btn.textContent = `Собираю… ${total}`;
    },
    finish(count, { content, filename } = {}) {
      // Файл ещё не скачан — это происходит только по клику на «Скачать
      // файл» ниже. Карточка не исчезает сама по себе: пользователь должен
      // успеть увидеть «Поддержать автора», а не только мелькнувшее «Готово».
      overlay.classList.add('rvw-done');
      card.innerHTML = `
        <button id="rvw-progress-close" type="button" aria-label="Закрыть">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 1l10 10M11 1 1 11"/></svg>
        </button>
        <div id="rvw-progress-done-check">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div id="rvw-progress-done-text">${count} ${rvwPluralWord(count, noun)} собралось успешно</div>
        <button id="rvw-progress-download-btn" class="rvw-btn rvw-btn-primary" type="button">Скачать файл</button>
        <a class="rvw-btn rvw-btn-secondary" href="${RVW_DONATE_URL}" target="_blank" rel="noopener noreferrer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Поддержать автора
        </a>
      `;
      // Крестик — на случай, если человек передумал скачивать: просто
      // закрывает карточку, файл не трогаем.
      card.querySelector('#rvw-progress-close').addEventListener('click', cleanup);
      // Клик по «Скачать файл» сам триггерит скачивание и закрывает карточку —
      // не завязываем это на промис finish(), иначе кнопка «Собираю…» в шапке
      // страницы зависла бы до тех пор, пока пользователь не нажмёт кнопку.
      card.querySelector('#rvw-progress-download-btn').addEventListener('click', () => {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);

        cleanup();
      });
    },
    remove: cleanup,
  };
}

// Страница конкретного объявления (не агрегированная страница отзывов
// продавца) не содержит sellerId в адресе — только opaque context=.
// Ссылка на профиль продавца (brands/<hash>) есть во встроенном JSON
// страницы; сам продавец при заходе на неё клиентским редиректом дописывает
// в свой URL ?sellerId=<hash> — тот же sellerId, что нужен API отзывов.
// Достаём hash из скриптов страницы, идём на профиль отдельным fetch'ем
// и вытаскиваем sellerId уже из его HTML тем же способом.
async function rvwDeriveAvitoSellerId() {
  const scripts = Array.from(document.querySelectorAll('script'));
  let combined = '';
  for (const s of scripts) combined += s.textContent || '';

  const hashMatch = combined.match(/brands\/([a-f0-9]{20,40})/);
  if (!hashMatch) return null;

  try {
    const res = await fetch(`https://www.avito.ru/brands/${hashMatch[1]}`, { credentials: 'include' });
    if (!res.ok) return null;
    const html = await res.text();
    const idMatch = html.match(/"sellerId":"([a-f0-9]+)"/);
    return idMatch ? idMatch[1] : null;
  } catch {
    return null;
  }
}

// Логика сбора отзывов продавца на Avito. В отличие от Яндекс.Карт (DOM-скролл),
// Avito отдаёт отзывы через собственный JSON-API — тот же запрос, что уходит
// с сайта по клику «Показать ещё отзывы», просто вызываем его напрямую
// с credentials: 'include' (использует куки текущей сессии пользователя,
// без обхода капчи/защиты — капчу пользователь проходит сам, до запуска сбора).
window.__rvwCollectAvitoReviews = async function collectAvitoReviews() {
  let sellerId = new URL(location.href).searchParams.get('sellerId');
  if (!sellerId) {
    sellerId = await rvwDeriveAvitoSellerId();
  }
  if (!sellerId) {
    return { ok: false, error: 'Не нашёл продавца на странице. Открой страницу отзывов продавца или карточку объявления на Avito.' };
  }

  // Имя продавца достаём в любом случае, но структура разная в зависимости
  // от страницы: на агрегированной странице отзывов продавца это h1 в шапке
  // профиля (data-marker нестабилен по значению — буквально "name <Имя>",
  // поэтому матчим по префиксу); на карточке конкретного объявления профиля
  // нет вовсе, там имя лежит в блоке ссылки на продавца сбоку.
  const sellerNameEl =
    document.querySelector('[data-marker^="name "]') ||
    document.querySelector('[data-marker="seller-link/link"]');
  const sellerName = sellerNameEl ? sellerNameEl.textContent.trim() : '';

  const indicator = createRvwProgress({ initialText: 'Подключаюсь к Avito' });

  try {
    const result = await collectAvitoReviewsData(sellerId, indicator, sellerName);
    // Успех: finish() сам переключает карточку на постоянный done-экран —
    // она остаётся до клика «Скачать файл» (который и запускает скачивание),
    // поэтому remove() тут не вызываем. Ошибка/отсутствие результата:
    // карточку прогресса убираем сразу же.
    if (result && result.ok) {
      indicator.finish(result.total, { content: result.content, filename: result.filename });
    } else {
      indicator.remove();
    }
    return result;
  } catch (err) {
    indicator.remove();
    throw err;
  }
};

async function collectAvitoReviewsData(sellerId, indicator, sellerName) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const collected = [];
  const seenIds = new Set();
  let offset = 0;
  let reviewCountHint = null;
  let guard = 0;
  const maxRequests = 500; // страховка от бесконечного цикла — 500×25 = 12500 отзывов

  while (guard < maxRequests) {
    guard++;

    const url = `https://www.avito.ru/web/7/user/${sellerId}/ratings?limit=25&offset=${offset}&photoOnly=false&sortRating=date_desc`;
    let json;
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      json = await res.json();
    } catch (e) {
      if (collected.length) break; // что-то уже собрали — отдаём хотя бы это
      return { ok: false, error: `Не удалось получить отзывы: ${e.message}` };
    }

    const entries = Array.isArray(json.entries) ? json.entries : [];
    let batchCount = 0;

    entries.forEach((entry) => {
      if (entry.type === 'score' && entry.value && typeof entry.value.reviewCount === 'number') {
        reviewCountHint = entry.value.reviewCount;
        return;
      }
      if (entry.type !== 'rating' || !entry.value) return;
      const v = entry.value;
      if (v.id != null && seenIds.has(v.id)) return;
      if (v.id != null) seenIds.add(v.id);
      batchCount++;

      const textParts = Array.isArray(v.textSections)
        ? v.textSections.map((s) => (typeof s === 'string' ? s : s?.text || '')).filter(Boolean)
        : (v.text ? [v.text] : []);
      const text = textParts.join('\n\n').trim();

      collected.push({
        id: v.id,
        author: v.title || 'Без имени',
        subtitle: v.titleCaption || '',
        date: v.rated || '',
        score: typeof v.score === 'number' ? v.score : null,
        stage: v.stageTitle || '',
        item: v.itemTitle || '',
        text,
      });
    });

    console.log(`[rvw] Avito: страница offset=${offset}, получено отзывов ${batchCount}, всего собрано ${collected.length}${reviewCountHint ? ' из ~' + reviewCountHint : ''}`);
    if (indicator) {
      indicator.progress({
        total: collected.length,
        done: collected.reduce((n, r) => n + (r.score != null ? 1 : 0), 0),
        expected: reviewCountHint,
      });
    }

    if (!batchCount || !json.nextPage) break;

    offset += 25;
    await sleep(400); // не долбим API слишком часто
  }

  if (!collected.length) {
    return { ok: false, error: 'Не нашёл ни одного отзыва. Проверь, что страница отзывов продавца открыта и прокручена.' };
  }

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
  let ratingSum = 0;
  let ratedCount = 0;
  collected.forEach((r) => {
    const rounded = r.score != null ? Math.round(r.score) : 0;
    ratingCounts[rounded] = (ratingCounts[rounded] || 0) + 1;
    if (r.score != null) { ratingSum += r.score; ratedCount++; }
  });
  const avgRating = ratedCount
    ? parseFloat((ratingSum / ratedCount).toFixed(2)).toString()
    : 'нет';
  const distribution = [5, 4, 3, 2, 1].map((star) => `- ${star}★: ${ratingCounts[star]}`).join('\n') +
    (ratingCounts[0] ? `\n- без оценки: ${ratingCounts[0]}` : '');

  const header =
    `# Отзывы\n\n` +
    (sellerName ? `- **Продавец:** ${sellerName}\n` : '') +
    `- **Собрано отзывов:** ${collected.length}\n` +
    `- **Средний рейтинг:** ${avgRating}/5\n\n` +
    `### Распределение по оценкам\n\n${distribution}`;

  const lines = collected.map((r, i) => {
    const meta = [];
    if (r.date || r.subtitle) meta.push(`- **Дата:** ${r.date || r.subtitle}`);
    meta.push(`- **Оценка:** ${r.score || 'нет'}/5`);
    if (r.stage) meta.push(`- **Этап сделки:** ${r.stage}`);
    if (r.item) meta.push(`- **Объявление:** ${r.item}`);
    return `## ${i + 1}. ${r.author}\n\n${meta.join('\n')}\n\n${r.text || '_без текста_'}`;
  });

  const footer =
    `Сделано при поддержке [Trace Logos](${RVW_TRACE_LOGOS_URL})\n\n` +
    `Telegram автора: [@mansurov_rafael](https://t.me/mansurov_rafael)`;

  const content = `${header}\n\n---\n\n` + lines.join('\n\n---\n\n') + `\n\n---\n\n${footer}`;

  // Файл больше не скачивается автоматически — только по клику «Скачать
  // файл» на финальной карточке (см. createRvwProgress().finish()).
  console.log(`[rvw] Avito готово! Собрано отзывов: ${collected.length}`);

  return {
    ok: true,
    total: collected.length,
    expected: reviewCountHint,
    content,
    filename: 'avito_reviews.md',
  };
}

// Сбор комментариев к посту канала в Telegram Web (клиент K, web.telegram.org/k/).
//
// Открытая ветка обсуждения — это отдельная, наложенная поверх основного чата
// панель: DOM хранит ДВА экземпляра `.chat.tabs-tab` внутри `.chats-container`
// (сам канал и ветку обсуждения одновременно), различить их можно только по
// `data-type="discussion"` у активного таба — по этому же признаку
// button-injector.js решает, показывать ли кнопку.
//
// Комментарии рендерятся как обычные сообщения чата (`.bubble`), поэтому
// список виртуализирован так же, как в Картах: старые сообщения подгружаются
// при прокрутке ВВЕРХ (лента открывается на последнем прочитанном, а не
// с начала). Стратегия сбора — тот же пошаговый скролл с харвестом на ходу,
// что и в collectYandexReviews(), только в обратную сторону.
function rvwFindTelegramDiscussion() {
  return document.querySelector('.chats-container.tabs-container > .chat.tabs-tab[data-type="discussion"].active');
}

// «4.5K», «1,2M» → число. Реакции и просмотры на популярных постах Telegram
// показывает в сокращённом виде, не только целыми числами.
function rvwParseCompactNumber(text) {
  if (!text) return 0;
  const m = text.trim().toUpperCase().match(/^([\d.,]+)\s*([KM]?)$/);
  if (!m) return 0;
  let n = parseFloat(m[1].replace(',', '.'));
  if (m[2] === 'K') n *= 1e3;
  if (m[2] === 'M') n *= 1e6;
  return Math.round(n);
}

// Telegram оборачивает числа/время невидимыми bidi-метками (LRM/RLM/ALM
// и т.п., Unicode-категория «Format» — U+200B–U+200F, U+202A–U+202E,
// U+2060–U+2064, U+FEFF), которые защищают направление отображения текста
// в смешанной RU/LTR-разметке. В браузере они невидимы, но при экспорте
// в обычный markdown-файл часть шрифтов рисует их как «сломанный»
// символ/квадратик сразу после времени — вырезаем их из любого текста,
// который уходит в итоговый документ.
function rvwStripInvisibleChars(str) {
  return str.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '');
}

// Иконки Telegram Web (`.tgico`, класс на пустых `<span>`/`<i>`) рисуются
// шрифтом-иконкой через символ из Private Use Area прямо в тексте узла
// (не через CSS `content`), поэтому голый `.textContent` таких мест несёт
// невидимый в браузере (шрифт есть) символ, который без этого шрифта
// показывается «сломанным» квадратиком/знаком вопроса — ровно то, что
// вылезало после «0:09» у кружка. `rvwStripInvisibleChars` от этого не
// спасает: PUA-символы (U+E000–U+F8FF) не входят в диапазоны format-
// символов. Надёжный способ — вырезать саму иконку-ноду из клона ДО
// чтения текста, а не гадать диапазоны символов постфактум.
function rvwElementText(el) {
  if (!el) return '';
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.tgico').forEach((n) => n.remove());
  return rvwStripInvisibleChars(clone.textContent.trim());
}

// `<br>` между абзацами и блочные элементы (например `<blockquote>` цитаты
// в ответ) дают перенос строки ТОЛЬКО визуально — ни один из них не кладёт
// в DOM ни одного текстового узла между соседними абзацами. Голый
// `.textContent` после этого склеивает их без пробела: «…почему.» +
// «Пытаться…» → «…почему.Пытаться…». Подменяем `<br>` на текстовый узел
// с переносом строки и добавляем перенос вокруг блочных элементов ДО
// чтения textContent — последующий `replace(/\s+/g, ' ')` схлопывает это
// в нормальный один пробел между словами, а не ноль.
function rvwNormalizeLineBreaks(el) {
  el.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  el.querySelectorAll('blockquote, div, p').forEach((block) => {
    block.before('\n');
    block.after('\n');
  });
}

// `.message` — не только текст: та же нода несёт `.time` (время/просмотры
// поста) и `reactions-element` (блок реакций) внутри себя, поэтому голый
// `.message.textContent` склеивает текст сообщения с «4.5K09:21» и счётчиками
// реакций в одну строку. `.translatable-message` — вложенный span с ЧИСТЫМ
// текстом сообщения, без этого мусора; на него и опираемся везде.
function rvwCleanMessageText(messageEl) {
  if (!messageEl) return '';
  const translatable = messageEl.querySelector('.translatable-message');
  if (translatable) {
    const clone = translatable.cloneNode(true);
    clone.querySelectorAll('.tgico').forEach((n) => n.remove());
    rvwNormalizeLineBreaks(clone);
    return rvwStripInvisibleChars(clone.textContent.replace(/\s+/g, ' ').trim());
  }
  const clone = messageEl.cloneNode(true);
  clone.querySelectorAll('.time, reactions-element, .document-container, .tgico').forEach((n) => n.remove());
  rvwNormalizeLineBreaks(clone);
  return rvwStripInvisibleChars(clone.textContent.replace(/\s+/g, ' ').trim());
}

// Прикреплённые файлы Telegram Web (клиент K) рендерит как `.document-container`,
// но НАЧИНКА внутри разная по типу вложения:
// - обычный документ: имя в `.document-name middle-ellipsis-element` (если
//   обрезано «…», полное — в атрибуте `title`), размер в `.document-size
//   .i18n` — ПЕРВЫЙ такой span это итоговый размер файла; второй `.i18n`,
//   вложенный в `[style*="visibility: hidden"]`, — прогресс докачки
//   «384 КБ / 1.3 МБ» / «0 Б / 1.3 МБ», нам не нужен никогда;
// - голосовое/аудио: `.document-name` в контейнере вообще нет — вместо неё
//   `audio-element` (класс `is-voice` у голосовых, без него — у обычных
//   аудио) с длительностью в `.audio-time` («0:31»). Раньше такой контейнер
//   молча пропускался (имя пустое) — голосовые уходили в документ «без
//   текста и без вложений».
function rvwParseDocumentAttachments(messageEl) {
  if (!messageEl) return [];
  const files = [];
  messageEl.querySelectorAll('.document-container').forEach((c) => {
    const nameEl = c.querySelector('.document-name middle-ellipsis-element');
    if (nameEl) {
      const name = rvwStripInvisibleChars((nameEl.getAttribute('title') || nameEl.textContent).trim());
      if (!name) return;
      const sizeEl = c.querySelector('.document-size .i18n');
      const size = rvwElementText(sizeEl);
      files.push({ icon: '📎', label: size ? `${name} (${size})` : name });
      return;
    }

    const audioEl = c.querySelector('audio-element');
    if (audioEl) {
      const isVoice = audioEl.classList.contains('is-voice');
      const duration = rvwElementText(audioEl.querySelector('.audio-time'));
      const label = isVoice ? 'Голосовое сообщение' : 'Аудио';
      files.push({ icon: isVoice ? '🎤' : '🎵', label: duration ? `${label} (${duration})` : label });
    }
  });
  return files;
}

// Реакции Telegram Web (клиент K) рендерит как растровые стикеры (`<img>`
// из blob:-URL) без alt/title/aria-label и без эмодзи-символа в DOM вообще —
// доступен только внутренний `data-doc-id` стикера, а не то, какой это
// смайл. Поэтому «сколько реакций» посчитать можно (сумма `.reaction-counter`
// по всем `reaction-element`), а «какими именно эмодзи» — нет, это не баг
// парсинга, а ограничение самой разметки страницы.
function rvwSumReactions(scopeEl) {
  let sum = 0;
  scopeEl.querySelectorAll('reaction-element .reaction-counter').forEach((c) => {
    sum += rvwParseCompactNumber(c.textContent);
  });
  return sum;
}

// Группа последовательных сообщений одного автора показывает аватар
// (`.bubbles-group-avatar-container .avatar[data-peer-id]`) РОВНО ОДИН РАЗ,
// сразу перед первым бабблом группы — это единственное место, где peer-id
// автора есть гарантированно. Текстовое имя (`.colored-name .peer-title`)
// Telegram пишет не в каждый баббл группы: у баблов-продолжений (класс
// `hide-name` — фото/текст/кружок без своего аватара) имени в DOM нет
// вообще, у карточек документов оно есть всегда. Поэтому peer-id резолвится
// через ближайший НАЗАД по DOM `.bubbles-group-avatar-container`, а не
// через сам баббл.
function rvwFindGroupPeerId(el) {
  let node = el;
  while (node) {
    if (node.classList && node.classList.contains('bubbles-group-avatar-container')) {
      const avatar = node.querySelector('[data-peer-id]');
      return avatar ? avatar.getAttribute('data-peer-id') : null;
    }
    node = node.previousElementSibling;
  }
  return null;
}

// key — data-mid: Telegram выдаёt его один раз на сообщение и переиспользует
// узел при перерисовке (в отличие от Яндекса, где приходится собирать ключ
// из содержимого карточки).
//
// author может остаться null здесь и резолвиться позже (см. `peerNames`
// в rvwCollectTelegramComments) — баббл с текстовым именем в группе может
// стоять ПОСЛЕ баббла без имени (как в примере: фото без имени, следом —
// документы с именем), а harvest() идёт по DOM сверху вниз.
//
// Имя ищем СТРОГО внутри `.colored-name` — это единственный узел, где
// Telegram пишет имя реального автора баббла. Голый `.peer-title` без
// такого скоупа ловит и чужой `.peer-title` внутри `.reply-content`
// (имя автора цитируемого сообщения в блоке реплая) — баг, из-за
// которого кружок/сообщение с реплаем подписывались именем того, КОМУ
// отвечали, а не того, кто отвечал.
function rvwParseTelegramComment(el, peerNames) {
  const mid = el.getAttribute('data-mid');
  const nameEl = el.querySelector('.colored-name .peer-title-inner') || el.querySelector('.colored-name .peer-title');
  const peerId = rvwFindGroupPeerId(el);
  const author = nameEl ? rvwElementText(nameEl) : null;
  if (author && peerId) peerNames.set(peerId, author);

  // Кружок (video note) рендерится через `.media-round`, не через
  // `.document-container` — rvwParseDocumentAttachments его не видит.
  // Длительность лежит в `.video-time` (у самого баббла, не внутри
  // `.message`). Внутри баббла также лежит скрытый служебный дубль —
  // `.message[style*="display: none"]` с ЕЩЁ ОДНИМ `audio-element`
  // (нужен Telegram только для функции «расшифровать голосом») — если
  // прогнать его через обычный текстовый парсинг, в текст комментария
  // утечёт мусор вроде «0:09». Кружок никогда не бывает с подписью,
  // поэтому при наличии `.media-round` текст/файлы из `.message`
  // не читаем вовсе, а сразу отдаём его как одно вложение.
  const roundEl = el.querySelector('.media-round');
  let text;
  let files;
  if (roundEl) {
    const durationEl = el.querySelector('.video-time');
    const duration = rvwElementText(durationEl);
    text = '';
    files = [{ icon: '⭕', label: duration ? `Кружок (видеосообщение, ${duration})` : 'Кружок (видеосообщение)' }];
  } else {
    const messageEl = el.querySelector('.message');
    text = rvwCleanMessageText(messageEl);
    files = rvwParseDocumentAttachments(messageEl);

    // Обычное фото/видео-вложение — `.attachment.media-container` прямо
    // в `.bubble-content`, БЕЗ обёртки `.document-container` (та уже
    // разобрана выше) и без `.media-round` (кружок — отдельная ветка
    // выше). Без подписи такое сообщение раньше уходило как «без
    // текста» — неотличимо от письма вообще без вложения.
    const attachment = el.querySelector('.bubble-content > .attachment.media-container');
    if (attachment) {
      if (attachment.querySelector('video.media-video')) {
        files = [{ icon: '🎬', label: 'Видео' }, ...files];
      } else if (attachment.querySelector('img.media-photo')) {
        files = [{ icon: '🖼️', label: 'Изображение' }, ...files];
      }
    }
  }

  const ts = parseInt(el.getAttribute('data-timestamp'), 10);
  const date = Number.isFinite(ts) ? new Date(ts * 1000) : null;

  const reactions = rvwSumReactions(el);

  return { mid, author, peerId, text, files, date, reactions };
}

window.__rvwCollectTelegramComments = async function collectTelegramComments() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const discussion = rvwFindTelegramDiscussion();
  if (!discussion) {
    return { ok: false, error: 'Не нашёл открытую ветку обсуждения. Открой комментарии конкретного поста в канале.' };
  }

  const scroller = discussion.querySelector('.scrollable.scrollable-y.bubbles-scrollable');
  if (!scroller) {
    return { ok: false, error: 'Не нашёл список комментариев. Открой комментарии конкретного поста в канале.' };
  }

  const indicator = createRvwProgress({
    initialText: 'Открываю список комментариев',
    statusText: 'Собираю комментарии…',
    noun: RVW_COMMENT_WORDS,
  });

  try {
    const result = await collectWithIndicator();
    if (result && result.ok) {
      indicator.finish(result.total, { content: result.content, filename: result.filename });
    } else {
      indicator.remove();
    }
    return result;
  } catch (err) {
    indicator.remove();
    throw err;
  }

  async function collectWithIndicator() {
    function readPostExcerpt() {
      const postBubble = discussion.querySelector('.bubble.channel-post');
      if (!postBubble) return '';
      return rvwCleanMessageText(postBubble.querySelector('.message'));
    }

    // `.time-inner`'s title атрибут несёт точные значения («Просмотрели: 4 500»,
    // «Переслали: 7», полную дату) — надёжнее, чем сокращённый «4.5K» в самом
    // блоке, который к тому же виден только компактным числом без подписи.
    function readPostMeta() {
      const postBubble = discussion.querySelector('.bubble.channel-post');
      const meta = { date: '', views: null, forwards: null, reactions: 0 };
      if (!postBubble) return meta;

      const timeInner = postBubble.querySelector('.time-inner');
      const title = timeInner ? timeInner.getAttribute('title') || '' : '';
      const dateMatch = title.match(/^([^\n]+)/);
      if (dateMatch) meta.date = dateMatch[1].trim();

      const viewsMatch = title.match(/Просмотрели:\s*([\d\s]+)/);
      if (viewsMatch) {
        meta.views = parseInt(viewsMatch[1].replace(/\s+/g, ''), 10);
      } else {
        const viewsEl = postBubble.querySelector('.post-views');
        if (viewsEl) meta.views = rvwParseCompactNumber(viewsEl.textContent);
      }

      const forwardsMatch = title.match(/Переслали:\s*([\d\s]+)/);
      if (forwardsMatch) meta.forwards = parseInt(forwardsMatch[1].replace(/\s+/g, ''), 10);

      meta.reactions = rvwSumReactions(postBubble);

      return meta;
    }

    // Число в шапке ветки («3 комментария») — тот же приём, что и заголовок
    // блока отзывов на Картах: держим максимум, потому что счётчик может
    // домонтироваться позже старта сбора.
    function readTotalExpected() {
      const top = discussion.querySelector('.chat-info .content .top');
      if (!top) return null;
      const m = top.textContent.match(/\d+/);
      return m ? parseInt(m[0], 10) : null;
    }

    const comments = new Map(); // mid → комментарий
    const peerNames = new Map(); // peer-id → имя (см. rvwParseTelegramComment)

    function harvest() {
      discussion.querySelectorAll('.bubble:not(.channel-post):not(.service)').forEach((el) => {
        const mid = el.getAttribute('data-mid');
        if (!mid || comments.has(mid)) return;
        comments.set(mid, rvwParseTelegramComment(el, peerNames));
      });
    }

    harvest();

    let totalExpected = readTotalExpected();
    console.log('[rvw] Заявлено комментариев в шапке:', totalExpected);

    const stepPx = 250;
    const stepDelay = 150;
    const edgePauseDelay = 1000; // доп. пауза у края — вдруг подгрузится ещё порция
    const maxStableRounds = 6; // ~6с терпения на каждом краю (6×1000мс)
    const maxIterations = 5000;

    // Ветка обсуждения открывается на последнем прочитанном сообщении, а не
    // с самого начала: если пользователь уже всё прочитал, старт — это
    // самый НИЗ списка. Виртуализация подгружает старые комментарии только
    // при прокрутке ВВЕРХ, поэтому сперва долистываем к первому комментарию
    // (харвестя по пути вверх), и лишь затем — вниз до конца. Так весь
    // диапазон покрывается независимо от того, где список был открыт при
    // старте сбора.
    //
    // direction: -1 — к началу ветки (вверх), 1 — к концу (вниз).
    // Возвращает true, если досрочно достигли заявленного totalExpected —
    // тогда вторая фаза (в противоположную сторону) не нужна.
    async function scrollToEdge(direction) {
      let stableRounds = 0;
      let lastSeen = -1;
      let iterations = 0;

      while (iterations < maxIterations) {
        iterations++;

        const atTop = scroller.scrollTop <= 0;
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 5;
        const atEdge = direction === -1 ? atTop : atBottom;

        if (!atEdge) {
          scroller.scrollTop += direction * stepPx;
          await sleep(stepDelay);
        } else {
          await sleep(edgePauseDelay);
        }

        harvest();

        const expectedNow = readTotalExpected();
        if (expectedNow && (!totalExpected || expectedNow > totalExpected)) totalExpected = expectedNow;

        const seen = comments.size;

        if (iterations % 10 === 0 || seen !== lastSeen) {
          console.log(`[rvw] ${direction === -1 ? 'Вверх' : 'Вниз'}, итерация ${iterations}: собрано — ${seen}${totalExpected ? ' из ' + totalExpected : ''}, scrollTop ${scroller.scrollTop}/${scroller.scrollHeight}`);
        }

        indicator.progress({ total: seen, expected: totalExpected });

        if (totalExpected && seen >= totalExpected) {
          console.log('[rvw] Достигли заявленного количества комментариев, останавливаемся.');
          return true;
        }

        if (seen === lastSeen) {
          stableRounds++;
        } else {
          stableRounds = 0;
          lastSeen = seen;
        }
        if (stableRounds >= maxStableRounds && atEdge) {
          break;
        }
      }
      return false;
    }

    const reachedExpectedUp = await scrollToEdge(-1);
    if (!reachedExpectedUp) {
      const reachedExpectedDown = await scrollToEdge(1);
      if (!reachedExpectedDown && totalExpected) {
        console.warn('[rvw] Список перестал расти, а до заявленного числа не дотянули. Останавливаюсь на том, что есть.');
      }
    }

    // Пост канала — самое верхнее сообщение ветки, virtualization могла не
    // отрендерить его в DOM: ни на старте, ни после scrollToEdge(-1), если
    // та фаза остановилась досрочно (totalExpected по комментариям набрался
    // раньше, чем скролл физически дошёл до самого верха, где лежит пост).
    // Дожимаем скролл отдельно, пока бабл поста не появится в DOM.
    async function ensurePostLoaded() {
      let iter = 0;
      while (!discussion.querySelector('.bubble.channel-post') && scroller.scrollTop > 0 && iter < maxIterations) {
        iter++;
        scroller.scrollTop = Math.max(0, scroller.scrollTop - stepPx);
        await sleep(stepDelay);
      }
    }
    await ensurePostLoaded();

    const postExcerpt = readPostExcerpt();
    const postMeta = readPostMeta();

    // Добираем имя для баблов, где его не было в самом узле (см.
    // rvwParseTelegramComment) — к этому моменту peerNames уже видел
    // ВСЕ обработанные баблы, включая те, что шли по DOM позже своего
    // безымянного соседа по группе.
    comments.forEach((c) => {
      if (!c.author && c.peerId && peerNames.has(c.peerId)) c.author = peerNames.get(c.peerId);
      if (!c.author) c.author = 'Без имени';
    });

    // «Без имени» + пустой текст и без прикреплённых файлов — комментарий
    // без подписи автора, без текста и без вложений: на практике это голое
    // фото/видео без подписи, вставлять в итоговый документ нечего, поэтому
    // отбрасываем ещё до сортировки/нумерации. Файлы (документы) сохраняем,
    // даже если подписи к ним нет.
    //
    // ВАЖНО: сообщение из ОДНИХ эмодзи (например «🔥🔥🔥») сюда НЕ подпадает —
    // c.text у него непустой (сами эмодзи и есть текст), фильтр его не
    // трогает. Так и должно быть: в Telegram это полноценная реплика в живом
    // обсуждении, не шум. Аналогичный фильтр у Яндекс.Карт/Avito (см.
    // rvwParseYandexReview) специально отсекает отзывы из одних эмодзи —
    // там это спам-подобный мусор без ценности, а не разговорная реплика.
    // Не переносить ту логику сюда.
    const collected = [...comments.values()]
      .filter((c) => !(c.author === 'Без имени' && !c.text && (!c.files || !c.files.length)))
      .sort((a, b) => (a.date && b.date ? a.date - b.date : 0));

    if (!collected.length) {
      return { ok: false, error: 'Не нашёл ни одного комментария. Открой ветку обсуждения поста и попробуй снова.' };
    }

    const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const lines = collected.map((c, i) => {
      const meta = [];
      if (c.date) meta.push(`- **Дата:** ${dateFormatter.format(c.date)}`);
      if (c.reactions > 0) meta.push(`- **Реакции:** ${c.reactions}`);
      const filesBlock = c.files && c.files.length ? c.files.map((f) => `- ${f.icon} ${f.label}`).join('\n') : '';
      const body = [c.text, filesBlock].filter(Boolean).join('\n\n') || '_без текста_';
      return `## ${i + 1}. ${c.author}\n\n${meta.join('\n')}\n\n${body}`;
    });

    const header =
      `# Комментарии к посту\n\n` +
      (postExcerpt ? `- **Пост:** ${postExcerpt}\n` : '') +
      (postMeta.date ? `- **Дата поста:** ${postMeta.date}\n` : '') +
      (postMeta.views != null ? `- **Просмотры:** ${postMeta.views}\n` : '') +
      (postMeta.forwards ? `- **Пересылки:** ${postMeta.forwards}\n` : '') +
      (postMeta.reactions ? `- **Реакции на посте:** ${postMeta.reactions}\n` : '') +
      `- **Собрано комментариев:** ${collected.length}`;

    const footer =
      `Сделано при поддержке [Trace Logos](${RVW_TRACE_LOGOS_URL})\n\n` +
      `Telegram автора: [@mansurov_rafael](https://t.me/mansurov_rafael)`;

    const content = `${header}\n\n---\n\n` + lines.join('\n\n---\n\n') + `\n\n---\n\n${footer}`;

    console.log(`[rvw] Готово! Собрано комментариев: ${collected.length} из ${totalExpected}`);

    return {
      ok: true,
      total: collected.length,
      expected: totalExpected,
      content,
      filename: 'telegram_comments.md',
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────
// Сбор комментариев к посту канала в Telegram Web (клиент A, web.telegram.org/a/).
//
// Совсем другая разметка, чем у клиента K (см. rvwParseTelegramComment выше) —
// `.Message` вместо `.bubble`, `data-message-id` вместо `data-mid`,
// `.sender-title` вместо `.peer-title` и т.д. Общие с K вещи — только
// низкоуровневые утилиты (rvwStripInvisibleChars, rvwParseCompactNumber,
// createRvwProgress) и формат итогового .md.
//
// Открытая ветка обсуждения — не отдельный URL/таб (как `data-type="discussion"`
// у K), а второй `.Transition_slide` внутри `.MiddleHeader` и внутри
// `.messages-layout`, подменяющий заголовок и список сообщений канала. Оба
// слайда (канал и ветка) сосуществуют в DOM одновременно, активный помечен
// `.Transition_slide-active` — текстовый признак («N Comments»/«N комментариев»)
// зависит от языка интерфейса, поэтому определяем ветку структурно: у шапки
// канала есть `.chat-info-wrapper` (аватар + счётчик подписчиков), у шапки
// ветки — нет, только `.back-button` + `<h3>`. Проверено вживую 2026-08-07
// (см. консольный дамп в истории задачи).
function rvwFindTelegramDiscussionHeaderA() {
  const headerSlide = document.querySelector('.MiddleHeader .Transition_slide.Transition_slide-active');
  if (!headerSlide) return null;
  if (headerSlide.querySelector('.chat-info-wrapper')) return null; // это шапка канала, не ветки
  if (!headerSlide.querySelector('.back-button')) return null; // подстраховка
  return headerSlide;
}

// Скроллящийся список сообщений активного слайда (канал ИЛИ ветка — какой
// сейчас показан). Сам `.MessageList` — тоже `.Transition` (со своим
// вложенным `.Transition_slide` вокруг `.messages-container`, для анимации
// прыжка к сообщению) — класс `.custom-scroll` у него же, scrollTop работает
// прямо на этом узле.
function rvwFindTelegramActiveMessageListA() {
  return document.querySelector('.messages-layout .Transition_slide.Transition_slide-active .MessageList.custom-scroll');
}

// Число из шапки ветки («53 Comments» / «53 комментария») — независимо от
// языка интерфейса берём первую последовательность цифр (с возможными
// запятыми-разделителями разрядов, как в «1,090» у просмотров).
function rvwReadTelegramTotalExpectedA() {
  const h3 = document.querySelector('.MiddleHeader .Transition_slide.Transition_slide-active h3');
  if (!h3) return null;
  const m = h3.textContent.match(/\d[\d,]*/);
  return m ? parseInt(m[0].replace(/,/g, ''), 10) : null;
}

// Иконки Telegram Web (клиент A) — `<i class="icon icon-...">`, глиф рисуется
// CSS-шрифтом, но иногда попадает служебный текст-мусор внутрь узла рядом с
// иконкой (см. `.message-media-duration` кружка — время + `<i class="icon
// icon-muted">` следом). Вырезаем все `<i>` перед чтением текста — тот же
// принцип, что и `rvwElementText` у клиента K (там резался `.tgico`), только
// под другой набор классов иконок.
function rvwTextWithoutIconsA(el) {
  if (!el) return '';
  const clone = el.cloneNode(true);
  clone.querySelectorAll('i').forEach((n) => n.remove());
  return rvwStripInvisibleChars(clone.textContent.trim());
}

// Группа последовательных сообщений одного автора (`.sender-group-container`)
// показывает аватар (`.Avatar[data-peer-id]`) один раз для всей группы — тот
// же приём, что и `rvwFindGroupPeerId` у клиента K. Имя (`.sender-title`)
// клиент A пишет чаще, чем K (почти на каждом сообщении), но НЕ на
// продолжениях внутри одной группы (см. message-60796 в тестовом дампе —
// есть `.message-subheader` реплай-цитата, но нет `.message-title`), поэтому
// тот же фолбэк через peer-id всё равно нужен.
function rvwFindGroupPeerIdA(el) {
  const group = el.closest('.sender-group-container');
  if (!group) return null;
  const avatarEl = group.querySelector('.Avatar[data-peer-id]');
  return avatarEl ? avatarEl.getAttribute('data-peer-id') : null;
}

// key — data-message-id: аналог K-шного data-mid, тоже стабилен на всё время
// жизни сообщения.
//
// author может остаться null и резолвиться позже из peerNames (см. K-версию
// выше — тот же порядок обработки по DOM, та же возможная нехватка имени на
// момент разбора конкретного баббла).
//
// Дата у клиента A ненадёжна как объект: `title` с полной датой (аналог
// K-шного `.time-inner[title]`) на сообщениях ветки НЕ встретился ни разу в
// живом тесте — есть только у отдельных сообщений в основной ленте канала.
// Поэтому дата — строка «День месяца, ЧЧ:ММ», собранная из ближайшего
// предыдущего `.message-date-group` (нет года, но это уже больше, чем ничего)
// + времени самого сообщения. `dateLabel` передаётся снаружи, из обхода
// `.messages-container` в rvwCollectTelegramCommentsA — там же живёт
// единственный источник этого значения.
function rvwParseTelegramCommentA(el, peerNames, dateLabel) {
  const mid = el.getAttribute('data-message-id');

  const nameEl = el.querySelector('.message-title .sender-title');
  const peerId = rvwFindGroupPeerIdA(el);
  const author = nameEl ? rvwTextWithoutIconsA(nameEl) : null;
  if (author && peerId) peerNames.set(peerId, author);

  // `.message-time` иногда несёт префикс «edited»/«изменено» перед временем
  // (язык зависит от локали интерфейса Telegram — не полагаемся на слово,
  // вытаскиваем ЧЧ:ММ с конца строки).
  const timeEl = el.querySelector('.MessageMeta .message-time');
  const timeMatch = timeEl ? rvwTextWithoutIconsA(timeEl).match(/\d{1,2}:\d{2}\s*$/) : null;
  const timeText = timeMatch ? timeMatch[0].trim() : '';
  const date = dateLabel && timeText ? `${dateLabel}, ${timeText}` : (timeText || dateLabel || '');

  let reactions = 0;
  el.querySelectorAll('.Reactions .yIk5KK-h').forEach((s) => { reactions += rvwParseCompactNumber(s.textContent); });

  // Порядок проверок важен: кружок/голосовое/альбом/опрос у клиента A не
  // несут подписи в `.text-content` (тот блок у таких сообщений просто
  // отсутствует в DOM) — поэтому текст читаем только в ветке else.
  const files = [];
  let text = '';

  const roundEl = el.querySelector('.RoundVideo');
  const audioEl = el.querySelector('.Audio.inline');
  const albumEl = el.querySelector('.Album');
  const pollEl = el.querySelector('.wNIxEPfy');

  if (roundEl) {
    const duration = rvwTextWithoutIconsA(roundEl.querySelector('.message-media-duration'));
    files.push({ icon: '⭕', label: duration ? `Кружок (видеосообщение, ${duration})` : 'Кружок (видеосообщение)' });
  } else if (audioEl) {
    const duration = rvwTextWithoutIconsA(audioEl.querySelector('.voice-duration'));
    files.push({ icon: '🎤', label: duration ? `Голосовое сообщение (${duration})` : 'Голосовое сообщение' });
  } else if (albumEl) {
    const count = albumEl.querySelectorAll('.album-item-select-wrapper').length;
    files.push({ icon: '🖼️', label: count ? `Альбом (${count} фото/видео)` : 'Альбом' });
  } else if (pollEl) {
    files.push({ icon: '📊', label: 'Опрос' });
  } else {
    const mediaInner = el.querySelector('.media-inner');
    if (mediaInner) {
      // Стикер тоже лежит внутри `.media-inner` и тоже несёт свой `<img>`
      // (скрытая заглушка-превью, класс `sticker-media`) — без явной
      // проверки на `.sticker-media`/`.AnimatedSticker` он ошибочно
      // распознавался бы как обычное фото.
      //
      // Большой одиночный анимированный эмодзи-сообщение (класс
      // `.AnimatedEmoji`) технически рендерится ТОЙ ЖЕ Lottie-анимацией
      // через `.AnimatedSticker`/`canvas.rlottie-canvas`, что и настоящий
      // стикер — без проверки на `.AnimatedEmoji` он ошибочно
      // распознавался бы как «Стикер». Различить их можно только по этому
      // классу-обёртке: какой именно это эмодзи, из DOM не достать —
      // в отличие от инлайновых custom-emoji В ТЕКСТЕ (у тех есть
      // `data-alt="🔥"`), у отдельного `.AnimatedEmoji`-сообщения такого
      // атрибута нигде нет.
      //
      // GIF в Telegram технически реализован как беззвучное зацикленное
      // `<video>` с меткой длительности «GIF» вместо времени
      // (`.message-media-duration`) — без проверки текста метки он
      // ошибочно распознавался бы как обычное видео.
      const isAnimatedEmoji = mediaInner.classList.contains('AnimatedEmoji');
      const isSticker = !isAnimatedEmoji && !!mediaInner.querySelector('.sticker-media, .AnimatedSticker, .rlottie-canvas');
      const videoEl = mediaInner.querySelector('video');
      const durationText = rvwTextWithoutIconsA(mediaInner.querySelector('.message-media-duration'));

      if (isAnimatedEmoji) {
        files.push({ icon: '😀', label: 'Эмодзи (анимированный)' });
      } else if (isSticker) {
        files.push({ icon: '🧩', label: 'Стикер' });
      } else if (videoEl && durationText.toLowerCase() === 'gif') {
        files.push({ icon: '🎞️', label: 'GIF' });
      } else if (videoEl) {
        files.push({ icon: '🎬', label: 'Видео' });
      } else if (mediaInner.querySelector('img')) {
        files.push({ icon: '🖼️', label: 'Изображение' });
      }
    }

    const textContentEl = el.querySelector('.text-content');
    if (textContentEl) {
      const clone = textContentEl.cloneNode(true);
      clone.querySelectorAll('.MessageMeta, .Reactions, canvas').forEach((n) => n.remove());
      rvwNormalizeLineBreaks(clone);
      text = rvwStripInvisibleChars(clone.textContent.replace(/\s+/g, ' ').trim());
    }
  }

  return { mid, author, peerId, text, files, date, reactions };
}

window.__rvwCollectTelegramCommentsA = async function collectTelegramCommentsA() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const scroller = rvwFindTelegramActiveMessageListA();
  const discussionHeader = rvwFindTelegramDiscussionHeaderA();
  if (!discussionHeader || !scroller) {
    return { ok: false, error: 'Не нашёл открытую ветку обсуждения. Открой комментарии конкретного поста в канале.' };
  }

  const indicator = createRvwProgress({
    initialText: 'Открываю список комментариев',
    statusText: 'Собираю комментарии…',
    noun: RVW_COMMENT_WORDS,
  });

  try {
    const result = await collectWithIndicator();
    if (result && result.ok) {
      indicator.finish(result.total, { content: result.content, filename: result.filename });
    } else {
      indicator.remove();
    }
    return result;
  } catch (err) {
    indicator.remove();
    throw err;
  }

  async function collectWithIndicator() {
    const comments = new Map(); // mid → комментарий
    const peerNames = new Map(); // peer-id → имя (см. rvwParseTelegramCommentA)
    let postBubble = null; // `.is-thread-top` — закреплённая копия поста внутри самой ветки

    // `.message-date-group` вкладывает в себя ПЕРВУЮ группу сообщений этого
    // дня, а все следующие группы того же дня лежат уже плоскими соседями
    // после него в `.messages-container` — вплоть до следующего
    // `.message-date-group` (следующий день). querySelectorAll с двумя
    // селекторами через запятую отдаёт узлы В ПОРЯДКЕ ДОКУМЕНТА независимо
    // от вложенности, поэтому проход по этому списку с одной переменной
    // `currentDateLabel`, обновляемой на каждом date-group, корректно
    // размечает и вложенные, и плоские группы.
    function harvest() {
      const container = scroller.querySelector('.messages-container');
      if (!container) return;
      let currentDateLabel = '';
      container.querySelectorAll('.message-date-group, .sender-group-container').forEach((el) => {
        if (el.classList.contains('message-date-group')) {
          const dateEl = el.querySelector('.sticky-date span');
          if (dateEl) currentDateLabel = dateEl.textContent.trim();
          return;
        }
        el.querySelectorAll('.Message[data-message-id]').forEach((msgEl) => {
          const mid = msgEl.getAttribute('data-message-id');
          if (!mid) return;
          if (msgEl.classList.contains('is-thread-top')) {
            if (!postBubble) postBubble = msgEl; // закреплённая копия поста — не комментарий
            return;
          }
          if (comments.has(mid)) return;
          comments.set(mid, rvwParseTelegramCommentA(msgEl, peerNames, currentDateLabel));
        });
      });
    }

    harvest();

    let totalExpected = rvwReadTelegramTotalExpectedA();
    console.log('[rvw] Заявлено комментариев в шапке (A):', totalExpected);

    const stepPx = 250;
    const stepDelay = 150;
    const edgePauseDelay = 1000; // доп. пауза у края — вдруг подгрузится ещё порция
    const maxStableRounds = 6; // ~6с терпения на каждом краю (6×1000мс)
    const maxIterations = 5000;

    // Та же стратегия «сперва вверх до начала ветки, потом вниз до конца»,
    // что и у клиента K (см. подробный комментарий у scrollToEdge выше) —
    // ветка A точно так же может открыться не с начала списка.
    async function scrollToEdge(direction) {
      let stableRounds = 0;
      let lastSeen = -1;
      let iterations = 0;

      while (iterations < maxIterations) {
        iterations++;

        const atTop = scroller.scrollTop <= 0;
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 5;
        const atEdge = direction === -1 ? atTop : atBottom;

        if (!atEdge) {
          scroller.scrollTop += direction * stepPx;
          await sleep(stepDelay);
        } else {
          await sleep(edgePauseDelay);
        }

        harvest();

        const expectedNow = rvwReadTelegramTotalExpectedA();
        if (expectedNow && (!totalExpected || expectedNow > totalExpected)) totalExpected = expectedNow;

        const seen = comments.size;

        if (iterations % 10 === 0 || seen !== lastSeen) {
          console.log(`[rvw] A, ${direction === -1 ? 'вверх' : 'вниз'}, итерация ${iterations}: собрано — ${seen}${totalExpected ? ' из ' + totalExpected : ''}, scrollTop ${scroller.scrollTop}/${scroller.scrollHeight}`);
        }

        indicator.progress({ total: seen, expected: totalExpected });

        if (totalExpected && seen >= totalExpected) {
          console.log('[rvw] Достигли заявленного количества комментариев, останавливаемся.');
          return true;
        }

        if (seen === lastSeen) {
          stableRounds++;
        } else {
          stableRounds = 0;
          lastSeen = seen;
        }
        if (stableRounds >= maxStableRounds && atEdge) break;
      }
      return false;
    }

    const reachedExpectedUp = await scrollToEdge(-1);
    if (!reachedExpectedUp) {
      const reachedExpectedDown = await scrollToEdge(1);
      if (!reachedExpectedDown && totalExpected) {
        console.warn('[rvw] Список перестал расти, а до заявленного числа не дотянули. Останавливаюсь на том, что есть.');
      }
    }

    comments.forEach((c) => {
      if (!c.author && c.peerId && peerNames.has(c.peerId)) c.author = peerNames.get(c.peerId);
      if (!c.author) c.author = 'Без имени';
    });

    // «Без имени» + пустой текст и без вложений — то же правило, что у
    // клиента K (см. подробный комментарий там). Сообщение из ОДНИХ эмодзи
    // сюда не подпадает (c.text непустой) и намеренно НЕ фильтруется —
    // в отличие от Яндекс.Карт/Avito, где отзыв из одних эмодзи считается
    // спамом, в Telegram это живая реплика в обсуждении.
    const collected = [...comments.values()]
      .filter((c) => !(c.author === 'Без имени' && !c.text && (!c.files || !c.files.length)))
      .sort((a, b) => (parseInt(a.mid, 10) || 0) - (parseInt(b.mid, 10) || 0));

    if (!collected.length) {
      return { ok: false, error: 'Не нашёл ни одного комментария. Открой ветку обсуждения поста и попробуй снова.' };
    }

    let postExcerpt = '';
    let postMeta = { date: '', views: null, forwards: null, reactions: 0 };
    if (postBubble) {
      const textEl = postBubble.querySelector('.text-content');
      if (textEl) {
        const clone = textEl.cloneNode(true);
        clone.querySelectorAll('.MessageMeta, .Reactions, canvas').forEach((n) => n.remove());
        rvwNormalizeLineBreaks(clone);
        postExcerpt = rvwStripInvisibleChars(clone.textContent.replace(/\s+/g, ' ').trim());
      }
      const viewsEl = postBubble.querySelector('.message-views');
      if (viewsEl) {
        const title = viewsEl.getAttribute('title') || '';
        const viewsMatch = title.match(/Views:\s*([\d,]+)/);
        postMeta.views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, ''), 10) : rvwParseCompactNumber(viewsEl.textContent);
        const sharesMatch = title.match(/Shares:\s*([\d,]+)/);
        if (sharesMatch) postMeta.forwards = parseInt(sharesMatch[1].replace(/,/g, ''), 10);
      }
      let postReactions = 0;
      postBubble.querySelectorAll('.Reactions .yIk5KK-h').forEach((s) => { postReactions += rvwParseCompactNumber(s.textContent); });
      postMeta.reactions = postReactions;
    }

    const lines = collected.map((c, i) => {
      const meta = [];
      if (c.date) meta.push(`- **Дата:** ${c.date}`);
      if (c.reactions > 0) meta.push(`- **Реакции:** ${c.reactions}`);
      const filesBlock = c.files && c.files.length ? c.files.map((f) => `- ${f.icon} ${f.label}`).join('\n') : '';
      const body = [c.text, filesBlock].filter(Boolean).join('\n\n') || '_без текста_';
      return `## ${i + 1}. ${c.author}\n\n${meta.join('\n')}\n\n${body}`;
    });

    const header =
      `# Комментарии к посту\n\n` +
      (postExcerpt ? `- **Пост:** ${postExcerpt}\n` : '') +
      (postMeta.views != null ? `- **Просмотры:** ${postMeta.views}\n` : '') +
      (postMeta.forwards ? `- **Пересылки:** ${postMeta.forwards}\n` : '') +
      (postMeta.reactions ? `- **Реакции на посте:** ${postMeta.reactions}\n` : '') +
      `- **Собрано комментариев:** ${collected.length}`;

    const footer =
      `Сделано при поддержке [Trace Logos](${RVW_TRACE_LOGOS_URL})\n\n` +
      `Telegram автора: [@mansurov_rafael](https://t.me/mansurov_rafael)`;

    const content = `${header}\n\n---\n\n` + lines.join('\n\n---\n\n') + `\n\n---\n\n${footer}`;

    console.log(`[rvw] Готово (A)! Собрано комментариев: ${collected.length} из ${totalExpected}`);

    return {
      ok: true,
      total: collected.length,
      expected: totalExpected,
      content,
      filename: 'telegram_comments.md',
    };
  }
};
