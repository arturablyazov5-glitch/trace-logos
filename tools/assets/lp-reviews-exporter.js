(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en';
  var T = EN ? {
    running: 'Running demo…', again: '↻ Run demo again', skip: 'Demo: skipping — ', write: 'Demo: writing the review to Markdown',
    done: 'Demo done: 3 reviews · duplicate, empty and emoji-only skipped',
    head: '# Reviews\n\n- **Organization:** Sample shop\n', date: 'Date', rating: 'Rating', reactions: 'Reactions',
    copied: 'Address copied ✓',
    labels: ['The list scrolls automatically', 'Duplicates and empty lines are filtered out', 'Available reviews collected into Markdown']
  } : {
    running: 'Собираем демо…', again: '↻ Повторить демо', skip: 'Демо: пропускаем — ', write: 'Демо: записываем отзыв в Markdown',
    done: 'Демо готово: 3 отзыва · дубль, пустой и эмодзи пропущены',
    head: '# Отзывы\n\n- **Организация:** Пример магазина\n', date: 'Дата', rating: 'Оценка', reactions: 'Реакции',
    copied: 'Адрес скопирован ✓',
    labels: ['Список прокручивается автоматически', 'Дубли и пустые строки отсеиваются', 'Доступные отзывы собраны в Markdown']
  };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var run = document.getElementById('rx-run');
  var feed = document.getElementById('rx-feed');
  var live = document.getElementById('rx-live-md');
  var status = document.getElementById('rx-status');
  var samples = [
    { name: 'Марина', date: '7 августа', rating: 5, text: 'Удобно забирать заказ по дороге домой.', reactions: '👍 2' },
    { name: 'Илья', date: '6 августа', rating: 4, text: 'Доставка быстрая, но упаковку стоит улучшить.' },
    { skip: 'дубль' },
    { name: 'Анна', date: '5 августа', rating: 5, text: 'Ответили на вопрос до покупки.' },
    { skip: 'только эмодзи' },
    { skip: 'пустой отзыв' }
  ];
  if (EN) {
    samples = [
      { name: 'Marina', date: 'August 7', rating: 5, text: 'It’s easy to pick up an order on the way home.', reactions: '👍 2' },
      { name: 'Ilya', date: 'August 6', rating: 4, text: 'Delivery is fast, but the packaging could be better.' },
      { skip: 'duplicate' },
      { name: 'Anna', date: 'August 5', rating: 5, text: 'They answered my question before I bought.' },
      { skip: 'emoji only' },
      { skip: 'empty review' }
    ];
  }
  run.addEventListener('click', async function () {
    if (run.disabled) return;
    run.disabled = true;
    run.textContent = T.running;
    document.querySelectorAll('[data-rx-entry]').forEach(function (item) { item.classList.remove('rx-skipped'); });
    feed.scrollTop = 0;
    live.textContent = T.head;
    var kept = 0;
    for (var i = 0; i < samples.length; i++) {
      var row = document.querySelector('[data-rx-entry="' + i + '"]');
      feed.scrollTo({ top: row.offsetTop - feed.offsetTop, behavior: reduced ? 'instant' : 'smooth' });
      if (!reduced) await new Promise(function (resolve) { setTimeout(resolve, 650); });
      var review = samples[i];
      if (review.skip) {
        row.classList.add('rx-skipped');
        status.textContent = T.skip + review.skip;
      } else {
        kept++;
        live.textContent += '\n## ' + kept + '. ' + review.name + '\n\n- **' + T.date + ':** ' + review.date + '\n- **' + T.rating + ':** ' + review.rating + '/5\n' + (review.reactions ? '- **' + T.reactions + ':** ' + review.reactions + '\n' : '') + '\n' + review.text + '\n\n---\n';
        live.scrollTop = live.scrollHeight;
        status.textContent = T.write;
      }
      document.getElementById('rx-progress').style.width = ((i + 1) / samples.length * 100) + '%';
    }
    status.textContent = T.done;
    feed.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
    live.scrollTop = 0;
    run.disabled = false;
    run.textContent = T.again;
  });
  var sources = {
    yandex: { file: 'yandex_reviews.md', note: 'Яндекс.Карты и Яндекс.Бизнес: организация, дата, оценка и реакции.', text: '# Отзывы\n\n- **Организация:** Пример магазина\n- **Собрано отзывов:** 1\n- **Средний рейтинг:** 5/5\n\n## 1. Марина\n\n- **Дата:** 7 августа\n- **Оценка:** 5/5\n- **Реакции:** 👍 2\n\nУдобно забирать заказ по дороге домой.' },
    avito: { file: 'avito_reviews.md', note: 'Отзывы продавца: со страницы отзывов или карточки объявления; сохраняются этап сделки и объявление.', text: '# Отзывы\n\n- **Продавец:** Пример продавца\n- **Собрано отзывов:** 1\n- **Средний рейтинг:** 5/5\n\n## 1. Илья\n\n- **Дата:** 6 августа\n- **Оценка:** 5/5\n- **Этап сделки:** Сделка состоялась\n- **Объявление:** Настольная лампа\n\nОтправили в день покупки.' },
    house: { file: 'avito_house_reviews.md', note: 'Отзывы о доме и ЖК: статус проживания, фото и подразделы отзыва сохраняются отдельно.', text: '# Отзывы о доме\n\n- **Объект:** Пример жилого комплекса\n- **Собрано отзывов:** 1\n- **Средний рейтинг:** 4/5\n\n## 1. Анна\n\n- **Дата:** 5 августа\n- **Оценка:** 4/5\n- **Статус:** Живёт в доме\n- **Фото:** 2\n\n**Двор:** Без машин.\n\n**Недостатки:** Мало гостевых парковок.' },
    ozon: { file: 'ozon_reviews.md', note: 'Если Ozon ограничивает доступ без авторизации, в файле появляется пометка о неполной выгрузке.', text: '# Отзывы\n\n- **Товар:** Пример товара\n- **Собрано отзывов:** 1 из 2\n- **Средний рейтинг:** 4/5\n\n> Выгрузка неполная: Ozon отдаёт остальные отзывы только авторизованным пользователям.\n\n## 1. Илья\n\n- **Дата:** 06.08.2026\n- **Оценка:** 4/5\n- **Фото/видео:** 1\n\nУпаковку стоит улучшить.' },
    telegram: { file: 'telegram_comments.md', note: 'Telegram Web /k/ и /a/: метаданные поста, реакции и сведения о вложениях комментариев.', text: '# Комментарии к посту\n\n- **Пост:** Пример публикации\n- **Дата поста:** 07.08.2026\n- **Просмотры:** 12\n- **Пересылки:** 1\n- **Реакции на посте:** 2\n- **Собрано комментариев:** 1\n\n## 1. Марина\n\n- **Дата:** 07.08.2026, 12:00\n- **Реакции:** 1\n\nПрикрепляю пример документа.\n\n- 📄 Пример.pdf (24 КБ)' }
  };
  if (EN) sources = {
    yandex: { file: 'yandex_reviews.md', note: 'Yandex Maps and Yandex Business: organization, date, rating and reactions.', text: '# Reviews\n\n- **Organization:** Sample shop\n- **Reviews collected:** 1\n- **Average rating:** 5/5\n\n## 1. Marina\n\n- **Date:** August 7\n- **Rating:** 5/5\n- **Reactions:** 👍 2\n\nIt’s easy to pick up an order on the way home.' },
    avito: { file: 'avito_reviews.md', note: 'Seller reviews: from the reviews page or a listing; the deal stage and the listing are saved.', text: '# Reviews\n\n- **Seller:** Sample seller\n- **Reviews collected:** 1\n- **Average rating:** 5/5\n\n## 1. Ilya\n\n- **Date:** August 6\n- **Rating:** 5/5\n- **Deal stage:** Deal completed\n- **Listing:** Desk lamp\n\nShipped the same day I paid.' },
    house: { file: 'avito_house_reviews.md', note: 'Building and housing complex reviews: residency status, photos and the review’s subsections are saved separately.', text: '# Building reviews\n\n- **Property:** Sample housing complex\n- **Reviews collected:** 1\n- **Average rating:** 4/5\n\n## 1. Anna\n\n- **Date:** August 5\n- **Rating:** 4/5\n- **Status:** Lives in the building\n- **Photos:** 2\n\n**Courtyard:** Car-free.\n\n**Downsides:** Few guest parking spots.' },
    ozon: { file: 'ozon_reviews.md', note: 'If Ozon restricts access without signing in, the file gets a note about an incomplete export.', text: '# Reviews\n\n- **Product:** Sample product\n- **Reviews collected:** 1 of 2\n- **Average rating:** 4/5\n\n> Incomplete export: Ozon serves the remaining reviews only to signed-in users.\n\n## 1. Ilya\n\n- **Date:** 06.08.2026\n- **Rating:** 4/5\n- **Photos/videos:** 1\n\nThe packaging could be better.' },
    telegram: { file: 'telegram_comments.md', note: 'Telegram Web /k/ and /a/: post metadata, reactions and comment attachment details.', text: '# Post comments\n\n- **Post:** Sample publication\n- **Post date:** 07.08.2026\n- **Views:** 12\n- **Forwards:** 1\n- **Post reactions:** 2\n- **Comments collected:** 1\n\n## 1. Marina\n\n- **Date:** 07.08.2026, 12:00\n- **Reactions:** 1\n\nAttaching a sample document.\n\n- 📄 Sample.pdf (24 KB)' }
  };
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-rx-source]'));
  function showSource(tab) {
    var data = sources[tab.dataset.rxSource];
    tabs.forEach(function (item) { var selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; });
    document.getElementById('rx-source-file').setAttribute('aria-labelledby', tab.id);
    document.getElementById('rx-source-filename').textContent = data.file;
    document.getElementById('rx-source-md').textContent = data.text;
    document.getElementById('rx-source-note').textContent = data.note;
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { showSource(tab); });
    tab.addEventListener('keydown', function (event) {
      var delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
      var next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : delta ? (i + delta + tabs.length) % tabs.length : null;
      if (next === null) return;
      event.preventDefault(); tabs[next].focus(); showSource(tabs[next]);
    });
  });
  document.getElementById('rx-copy').addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText('chrome://extensions');
      var button = document.getElementById('rx-copy');
      button.textContent = T.copied;
      setTimeout(function () { button.textContent = 'chrome://extensions ↗'; }, 2000);
    } catch (error) { document.getElementById('rx-copy').textContent = 'chrome://extensions'; }
  });
  if (!('IntersectionObserver' in window)) return;
  var visual = document.querySelector('.rx-filter-visual');
  var labels = T.labels;
  var steps = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (entry.isIntersecting) { var stage = entry.target.dataset.rxStep; visual.dataset.stage = stage; visual.querySelector('.rx-filter-state').textContent = labels[Number(stage)]; } });
  }, { rootMargin: '-30% 0px -40% 0px', threshold: 0 });
  document.querySelectorAll('[data-rx-step]').forEach(function (step) { steps.observe(step); });
  if (reduced) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.remove('rx-pending'); observer.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.rx-reveal').forEach(function (section) { if (section.getBoundingClientRect().top > window.innerHeight) { section.classList.add('rx-pending'); observer.observe(section); } });
})();
