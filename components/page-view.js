// Счётчик просмотров страниц — хит на заход (не чаще раза в 30 минут на
// страницу с устройства), ключ — location.pathname. Едет в site-chrome.min.js (CLASSIC_BUNDLES в
// scripts/build-js-bundles.js), поэтому работает на любой странице с шапкой.
// Данные — таблица page_views через Edge Function track, смотреть во вкладке
// «Страницы» админки.
(function () {
  const TRACK_URL = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/track';

  // Локальную разработку не считаем, чтобы не засорять боевую статистику.
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') return;

  // «Режим разработчика» (?notrack / ?notrack=off, см. js/utils.js). Флаг
  // синхронизируем и здесь: utils.js есть не на каждой странице, а этот
  // скрипт может выполниться раньше него.
  try {
    const params = new URLSearchParams(location.search);
    if (params.has('notrack')) {
      if (params.get('notrack') === 'off') localStorage.removeItem('tl_notrack');
      else localStorage.setItem('tl_notrack', '1');
    }
    if (localStorage.getItem('tl_notrack') === '1') return;
  } catch { /* localStorage недоступен — считаем как обычно */ }

  // Ботов не считаем: краулеры поисковиков исполняют JS и иначе шли бы в
  // просмотры. По User-Agent ловятся объявленные, по webdriver — автоматические
  // браузеры (Puppeteer, Selenium).
  if (navigator.webdriver) return;
  if (/bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|scrape|python|curl|wget/i.test(navigator.userAgent)) return;

  const path = location.pathname.replace(/\/index\.html$/, '/');
  const bare = path.replace(/^\/en\//, '/');

  // Что не идёт во вкладку «Страницы»:
  // - админка;
  // - всё внутри каталогов, кроме самих /logos/ и /emoji/: страницы логотипов
  //   и эмодзи (их ведёт logo_stats — вкладки «Логотипы»/«Эмодзи»), категории
  //   и экосистемы;
  // - блог целиком (статьи ведёт js/blog-track.js — вкладка «Статьи»);
  // - юридические страницы и HTML-карта сайта.
  if (/^\/admin\//.test(bare)) return;
  if (/^\/(logos|emoji)\/./.test(bare)) return;
  if (/^\/blog\//.test(bare)) return;
  if (/^\/(consent|terms|sitemap)\//.test(bare)) return;

  // Служебные noindex-страницы (404 на любой мусорный URL, /thanks/).
  const robots = document.querySelector('meta[name="robots"]');
  if (robots && /noindex/i.test(robots.content)) return;

  // Перезагрузки не накручивают счётчик: одна страница — не чаще раза
  // в 30 минут с одного устройства (как у статей в js/blog-track.js).
  const seenKey = 'tl_pv:' + path;
  try {
    const last = Number(localStorage.getItem(seenKey));
    if (last && Date.now() - last < 30 * 60 * 1000) return;
    localStorage.setItem(seenKey, String(Date.now()));
  } catch { /* localStorage недоступен — считаем как обычно */ }

  fetch(TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page: path, title: document.title.trim() }),
    keepalive: true,
  }).catch(() => {});
})();
