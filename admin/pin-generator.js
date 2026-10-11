/* Генератор Pinterest-пинов 1000×1500 (вкладка «Pinterest» в админке).
   Логотипы берутся из /logos.json и рисуются на canvas оригинальными файлами
   (SVG/PNG без перерисовки), экспорт — PNG.
   Темы пина: подборки /collections.json (подбор по match[], как в
   scripts/build-collections.js), экосистемы logos/ecosystems.json, категории
   каталога (заголовок — gen из logos/category-seo.json) и свои темы из THEMES.
   Без ручного состава 12 логотипов выбираются по logos/download-stats.json.
   Подключается классическим скриптом, инициализируется при первом открытии
   вкладки: PinGen.init(). */
(function () {
  'use strict';

  const W = 1000, H = 1500;
  const FONT = 'PinInter, -apple-system, "Segoe UI", sans-serif';
  // Два режима: логотипы (3×4, плитки с подписями) и эмодзи Apple (4×5, стеклянные плитки без подписей).
  const MODES = {
    logos: { cols: 3, max: 12, L: { left: 100, gridTop: 308, tile: 200, colPitch: 300, rowPitch: 270, radius: 46 }, footer: 'Все логотипы бесплатно на trace-logos.ru' },
    emoji: { cols: 4, max: 20, L: { left: 100, gridTop: 330, tile: 170, colPitch: 210, rowPitch: 210, radius: 40 }, footer: 'Все эмодзи бесплатно на trace-logos.ru' },
  };
  let COLS = MODES.logos.cols, MAX = MODES.logos.max, L = MODES.logos.L; // меняются в setMode()
  const SITE = 'https://trace-logos.ru';
  const DRAFT_KEY = 'tl_pin_draft';
  const DEFAULT_ACCENT = '#a58cff';
  const DEFAULT_THEME = 'c:russian-banks';

  // Уточнения тем. Ключ — id темы: c:<подборка>, eco:<экосистема>, cat:<категория>, t:<своя>.
  // Поля: h1/line1/line2/link/campaign — поверх автоматических; names — ручной состав
  // (иначе топ по скачиваниям); category — где искать names; labels — подписи; tag — хештеги.
  // Темы t:* существуют только здесь (h1, link и campaign обязательны).
  const THEMES = {
    'c:russian-banks': { // утверждённый первый пин
      names: ['Сбер', 'Т-Банк', 'ВТБ', 'Альфа Банк', 'МТС Банк', 'Ozon Банк', 'Совкомбанк', 'Райффайзен', 'Россельхозбанк', 'ПСБ', 'Открытие', 'Точка Банк'],
      category: 'bank', labels: { 'Альфа Банк': 'Альфа-Банк' }, tag: '#банки',
    },
    'c:marketplaces': {
      names: ['Ozon', 'Wildberries', 'Яндекс Маркет', 'Авито', 'Мегамаркет', 'AliExpress', 'Lamoda', 'Золотое яблоко', "Л'Этуаль", 'М.Видео', 'Эльдорадо', 'Юла'],
      tag: '#маркетплейсы',
    },
    'c:messengers-social': {
      names: ['Telegram', 'WhatsApp', 'ВКонтакте', 'ВК Мессенджер', 'Max', 'Viber', 'Instagram', 'Одноклассники', 'TikTok', 'Discord', 'Threads', 'Facebook'],
      tag: '#соцсети',
    },
    'c:neural-networks': {
      names: ['ChatGPT', 'Claude', 'Gemini', 'DeepSeek', 'Midjourney', 'Perplexity', 'Grok', 'Copilot', 'GigaChat', 'Mistral', 'Sora', 'Cursor'],
      tag: '#нейросети #ИИ',
    },
    'c:payment-systems': {
      names: ['Мир Pay', 'СБП', 'Visa', 'Mastercard', 'Apple Pay', 'PayPal', 'ЮMoney', 'ЮКасса', 'Яндекс Пэй', 'Т-Пэй', 'Stripe', 'Продамус'],
      labels: { 'Мир Pay': 'Мир' }, tag: '#платежи #финтех',
    },
    'c:video-streaming': {
      names: ['YouTube', 'VK Видео', 'Rutube', 'Кинопоиск', 'Иви', 'Okko', 'Netflix', 'Twitch', 'Apple TV+', 'Prime Video', 'VK Play', 'YouTube Music'],
      line2: 'видеосервисов', // h1 «видеостриминговых сервисов» ужимает заголовок
      tag: '#стриминг #видео',
    },
    'c:google-2026': {
      names: ['Gmail', 'Google Calendar', 'Google Docs', 'Google Drive', 'Google Meet', 'Google Таблицы', 'Google Презентации', 'Google Forms', 'Google Keep', 'Google Chat', 'Google Tasks', 'Google Sites'],
      labels: { 'Google Calendar': 'Календарь', 'Google Docs': 'Документы', 'Google Drive': 'Диск', 'Google Meet': 'Meet', 'Google Таблицы': 'Таблицы', 'Google Презентации': 'Презентации', 'Google Forms': 'Формы', 'Google Keep': 'Keep', 'Google Chat': 'Chat', 'Google Tasks': 'Задачи', 'Google Sites': 'Сайты' },
      tag: '#Google #иконки',
    },

    'eco:yandex': {
      labels: { 'Яндекс Карты': 'Карты', 'Яндекс Маркет': 'Маркет', 'Яндекс Алиса': 'Алиса', 'Яндекс Музыка': 'Музыка', 'Яндекс Почта': 'Почта', 'Яндекс Пэй': 'Пэй', 'Яндекс Доставка': 'Доставка', 'Яндекс Еда': 'Еда', 'Яндекс Go': 'Go', 'Яндекс Браузер': 'Браузер' },
      tag: '#Яндекс',
    },
    'eco:vk': { tag: '#VK' },
    'eco:apple': { // без Apple Pay: в каталоге его иконка — то же яблоко, что у «Apple»
      names: ['App Store', 'Apple', 'Apple Music', 'Phone', 'Messages', 'Apple Maps', 'Apple Mail', 'Apple Wallet', 'Apple TV+', 'Apple Intelligence', 'Safari', 'Apple News'],
      category: '', tag: '#Apple #iOS',
    },
    'eco:google': { tag: '#Google' },
    'eco:sber': { tag: '#Сбер' },
    'eco:tinkoff': { tag: '#ТБанк' },

    'cat:food': {
      h1: 'Логотипы еды и ресторанов',
      names: ['Яндекс Еда', 'Самокат', 'Вкусно и точка', 'Яндекс Лавка', 'Купер', 'Додо Пицца', "Rostic's", 'Burger King', 'KFC', 'Starbucks', "McDonald's", 'Coca-Cola'],
      category: 'food', tag: '#еда #рестораны',
    },
    'cat:music': {
      names: ['Яндекс Музыка', 'Spotify', 'Apple Music', 'YouTube Music', 'Звук', 'КИОН Музыка', 'VK Records', 'SoundCloud', 'Shazam', 'Apple Podcasts', 'Яндекс Книги', 'КИОН Строки'],
      category: 'music', tag: '#музыка',
    },
    'cat:store': { tag: '#приложения' },
    'cat:delivery': {
      names: ['Яндекс Go', 'Яндекс Такси', 'Яндекс Доставка', 'СДЭК', 'Почта России', 'Яндекс Драйв', 'Делимобиль', 'Drivee', 'Максим', 'Достависта', 'Деловые Линии', 'Lyft'],
      category: 'delivery', tag: '#доставка #такси',
    },
    'cat:developers': { tag: '#недвижимость' },
    'cat:web': { tag: '#вебдизайн' },
    'cat:games': { tag: '#игры' },
    'cat:flag': { h1: 'Флаги стран', line1: 'Флаги стран', line2: 'в SVG', tag: '#флаги' },
    'cat:ads': { line2: 'рекламных сервисов', labels: { 'Google PageSpeed Insights': 'PageSpeed', 'ИИ-помощник РСЯ': 'Помощник РСЯ' }, tag: '#маркетинг #аналитика' },

    't:top': {
      h1: 'Самые популярные логотипы', line1: 'Самые популярные', line2: 'логотипы в SVG',
      link: SITE + '/logos/', campaign: 'top-logos', tag: '#бренды',
    },
    't:grocery': {
      h1: 'Логотипы продуктовых сетей', link: SITE + '/logos/market/', campaign: 'grocery-chains',
      names: ['Пятёрочка', 'Магнит', 'Перекрёсток', 'Лента', 'ВкусВилл', 'Ашан', 'Чижик', 'Азбука Вкуса', 'Глобус', 'METRO', 'О’КЕЙ', 'Монетка'],
      category: 'market', tag: '#ритейл #продукты',
    },
    't:mail-cloud': {
      h1: 'Логотипы почты и облаков', link: SITE + '/logos/mail/', campaign: 'mail-cloud',
      names: ['Mail.ru', 'Яндекс Почта', 'Gmail', 'Outlook', 'Apple Mail', 'Proton Mail', 'Яндекс 360', 'Яндекс Диск', 'Google Drive', 'Облако Mail', 'Яндекс Облако', 'Timeweb Cloud'],
      tag: '#почта #облако',
    },
    't:ai-services': {
      h1: 'Логотипы ИИ-сервисов', link: SITE + '/logos/ai/', campaign: 'ai-services',
      names: ['Яндекс Алиса', 'Qwen', 'Kimi', 'Manus AI', 'DALL-E', 'Stable Diffusion', 'Runway', 'ElevenLabs', 'NanoBanana', 'Gemma', 'Codex', 'Claude Code'],
      category: 'ai', tag: '#нейросети #ИИ',
    },
    't:business': {
      h1: 'Логотипы CRM и бизнес-сервисов', link: SITE + '/logos/crm/', campaign: 'business-services',
      names: ['AmoCRM', 'Bitrix24', '1С', 'МойСклад', 'RetailCRM', 'iiko', 'HubSpot', 'YCLIENTS', 'VK Teams', 'Альфа-Бизнес', 'Т-Бизнес', 'Честный ЗНАК'],
      tag: '#бизнес #CRM',
    },
  };

  const $ = id => document.getElementById(id);
  const norm = s => (s || '').toLowerCase().replace(/ё/g, 'е');
  const fileOf = it => it.svgUrl || it.pngUrl;
  const pathOf = url => new URL(url, location.href).pathname;
  const isSvg = it => !!it.svgUrl;
  const slugOf = url => String(url).replace(/^.*\/logos\//, '').replace(/\/+$/, '');
  const ecosOf = it => [].concat(it.ecosystem || []);
  const emojiChar = it => String(it.tags || '').split(' ')[0];
  const live = it => !fileOf(it).includes('placeholder'); // comingSoon-заглушки не берём

  const st = {
    all: [], byUrl: new Map(), themes: new Map(), dl: new Map(), pool: [],
    mode: 'logos', emoji: [], emojiThemes: [], theme: '', selected: [], titleDirty: false, descDirty: false,
    ready: false, token: 0, drag: -1,
  };
  const imgCache = new Map();

  // ── Данные ────────────────────────────────────────────────────────────
  function pickLogos(matches, excluded = []) { // зеркало pickLogos() из build-collections.js
    const ex = new Set(excluded), seen = new Set(), out = [];
    for (const w of matches.map(norm)) {
      for (const l of st.all) {
        if (ex.has(slugOf(l.url)) || seen.has(l.url) || !norm(l.name).includes(w) || !live(l)) continue;
        seen.add(l.url); out.push(l);
      }
    }
    return out;
  }

  const downloads = it => st.dl.get(slugOf(it.url)) || 0;
  const entry = (it, label) => ({ url: it.url, svgUrl: it.svgUrl, pngUrl: it.pngUrl, name: it.name, label: label || it.name });
  const theme = () => st.themes.get(st.theme);

  // Все темы: свои → подборки → экосистемы → категории. Поля THEMES перекрывают автоматические.
  function buildThemes(collections, ecosystems, seo) {
    const add = (id, group, base) => {
      const ov = THEMES[id] || {};
      st.themes.set(id, { id, group, ...base, h1: ov.h1 || base.h1, link: ov.link || base.link, campaign: ov.campaign || base.campaign });
    };
    Object.entries(THEMES).filter(([id]) => id.startsWith('t:')).forEach(([id, ov]) =>
      add(id, 'Свои темы', { pool: ov.category ? st.all.filter(it => it.categorySlug === ov.category && live(it)) : st.all.filter(live), order: 'downloads' }));
    collections.forEach(c => add('c:' + c.slug, 'Подборки сайта',
      { h1: c.h1, link: SITE + '/collections/' + c.slug + '/', campaign: c.slug, pool: pickLogos(c.match, c.exclude), order: 'match' }));
    Object.entries(ecosystems).forEach(([key, e]) => {
      const pool = st.all.filter(it => live(it) && ecosOf(it).includes(key));
      if (pool.length) add('eco:' + key, 'Экосистемы',
        { h1: 'Логотипы экосистемы ' + e.ru, link: SITE + '/logos/ecosystem/' + key + '/', campaign: 'ecosystem-' + key, pool, order: 'downloads' });
    });
    const cats = new Map();
    st.all.forEach(it => { if (live(it)) cats.set(it.categorySlug, it.categoryName); });
    [...cats].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'ru')).forEach(([slug, name]) => {
      const gen = (seo[slug] || {}).gen;
      add('cat:' + slug, 'Категории', { h1: gen ? 'Логотипы ' + gen : name, link: SITE + '/logos/' + slug + '/', campaign: slug,
        pool: st.all.filter(it => it.categorySlug === slug && live(it)), order: 'downloads' });
    });
  }

  // Эмодзи: 20 на тему, состав и порядок — из admin/pin-emoji-themes.json. Ссылка — страница категории эмодзи.
  function buildEmojiThemes() {
    const byName = new Map(st.emoji.map(e => [e.name_en, e]));
    st.emojiThemes.forEach(et => {
      const pool = et.names.map(n => byName.get(n)).filter(Boolean);
      if (!pool.length) return;
      const seg = pool[0].url.split('/')[4]; // /emoji/<категория>/<эмодзи>/
      st.themes.set('e:' + et.id, { id: 'e:' + et.id, group: 'Эмодзи Apple', mode: 'emoji', title: et.title,
        h1: 'Эмодзи Apple: ' + et.title, lines: ['Эмодзи Apple', et.title], link: SITE + '/emoji/' + seg + '/',
        campaign: 'emoji-' + et.id, pool, fixed: true });
    });
  }

  // Автосостав: SVG раньше PNG; внутри — порядок подборки или скачивания по убыванию.
  function autoPick(t) {
    const rank = list => t.order === 'downloads' ? [...list].sort((a, b) => downloads(b) - downloads(a)) : list;
    return [...rank(t.pool.filter(isSvg)), ...rank(t.pool.filter(it => !isSvg(it)))].slice(0, MAX);
  }

  // «Логотипы российских банков» → ['Логотипы в SVG', 'российских банков']
  function splitTitle(h1) {
    const m = /^Логотипы\s+(.+)$/.exec(h1);
    if (m) return ['Логотипы в SVG', m[1]];
    const w = h1.split(' '), k = Math.ceil(w.length / 2);
    return [w.slice(0, k).join(' '), w.slice(k).join(' ')];
  }

  // ── Тексты для Pinterest ──────────────────────────────────────────────
  function headline() {
    const t = theme();
    return t ? t.h1 : [$('pg-line1').value, $('pg-line2').value].filter(Boolean).join(' ');
  }
  function autoTitle() {
    if (st.mode === 'emoji') return headline() + ': ' + st.selected.slice(0, 6).map(emojiChar).join(' ') + ' — PNG';
    const names = st.selected.slice(0, 4).map(s => s.label).join(', ');
    return headline() + (names ? ': ' + names : '') + ' — SVG';
  }
  function autoDesc() {
    if (st.mode === 'emoji') {
      const t = theme();
      return 'Коллекция эмодзи Apple: ' + (t ? t.title : 'подборка') + ' ' + st.selected.slice(0, 8).map(emojiChar).join(' ') +
        '. Скачивайте бесплатно в PNG, копируйте и вставляйте в дизайн, соцсети и мессенджеры. Эмодзи Apple, Google и Microsoft — на trace-logos.ru. #эмодзи #emoji #смайлики #apple #дизайн #соцсети';
    }
    const h = headline(), names = st.selected.slice(0, 6).map(s => s.label).join(', ');
    const subj = /^Логотипы\s/.test(h) ? 'логотипов ' + h.replace(/^Логотипы\s+/, '') : '«' + h + '»';
    const tag = (THEMES[st.theme] || {}).tag;
    return 'Коллекция ' + subj + ' в векторном SVG' + (names ? ': ' + names + ' и другие' : '') +
      '. Скачивайте бесплатно, меняйте цвета и экспортируйте в Figma. Для интерфейсов, презентаций и макетов. ' +
      ['#логотипы', tag, '#дизайн', '#SVG', '#брендинг', '#UIдизайн'].filter(Boolean).join(' ');
  }
  function refreshTexts() {
    if (!st.titleDirty) $('pg-title').value = autoTitle();
    if (!st.descDirty) $('pg-desc').value = autoDesc();
    $('pg-title-auto').hidden = !st.titleDirty;
    $('pg-desc-auto').hidden = !st.descDirty;
    const link = $('pg-link').value.trim(), camp = $('pg-campaign').value.trim();
    $('pg-full-link').value = link
      ? link + (link.includes('?') ? '&' : '?') + 'utm_source=pinterest&utm_medium=organic&utm_campaign=' + encodeURIComponent(camp)
      : '';
  }

  // ── Отрисовка пина ────────────────────────────────────────────────────
  function loadImg(url) { // fetch → blob: same-origin, canvas не «грязнится»; SVG получает явный MIME
    const path = pathOf(url);
    if (!imgCache.has(path)) {
      imgCache.set(path, (async () => {
        const res = await fetch(path);
        if (!res.ok) throw new Error(path + ' → ' + res.status);
        let blob = await res.blob();
        if (path.endsWith('.svg')) {
          // <foreignObject> (пустые блоки blur из Figma) «пачкает» canvas — экспорт PNG тогда падает.
          // Вырезаем только при отрисовке пина, файл в каталоге остаётся нетронутым.
          const text = (await blob.text()).replace(/<foreignObject[\s\S]*?<\/foreignObject>/g, '');
          blob = new Blob([text], { type: 'image/svg+xml' });
        }
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await img.decode();
        return img;
      })());
    }
    return imgCache.get(path);
  }

  function radial(ctx, cx, cy, rx, ry, rgba) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, rgba); g.addColorStop(0.7, 'rgba(138,107,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  // 1–2 логотипа: если у всех есть широкий вариант (full), показываем его на светлой карточке — красивее квадрата.
  const wideFile = it => { const full = st.byUrl.get(it.url); const v = full && (full.variants || []).find(x => x.wide && x.svgUrl); return v ? v.svgUrl : null; };
  const useWide = () => st.mode === 'logos' && st.selected.length >= 1 && st.selected.length <= 2 && st.selected.every(wideFile);
  const fileFor = it => (useWide() ? wideFile(it) : fileOf(it));

  function drawWideCard(ctx, img, x, y, w, h) { // светлая карточка (как превью full-логотипов на сайте), логотип вписан с полями
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 18;
    rrect(ctx, x, y, w, h, 40); ctx.fillStyle = '#f2f1f5'; ctx.fill();
    ctx.restore();
    const ar = img.naturalWidth / img.naturalHeight, bw = w - 140, bh = h - 90;
    const dw = Math.min(bw, bh * ar), dh = dw / ar;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 39.5);
    ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // Сетка логотипов под число плиток: 10–12 — утверждённая 3×4; меньше — плитки крупнее, блок по центру
  // между заголовком и футером, неполный последний ряд центрируется. Подпись под плиткой: tile + 38.
  const GRIDS = [null, [1, 400], [2, 340], [3, 240], [2, 300], [3, 240], [3, 240], [3, 220], [3, 220], [3, 220], [3, 200], [3, 200], [3, 200]];
  function gridPos(n) {
    if (n >= 10 || n < 1) return (i) => ({ x: L.left + (i % COLS) * L.colPitch, y: L.gridTop + Math.floor(i / COLS) * L.rowPitch, tile: L.tile, pitch: L.colPitch });
    const [cols, tile] = GRIDS[n], rows = Math.ceil(n / cols), rowPitch = tile + 70;
    const colPitch = cols > 1 ? (800 - tile) / (cols - 1) : 0;
    const blockH = (rows - 1) * rowPitch + tile + 44, top = 300 + (1090 - blockH) / 2;
    return (i) => {
      const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols;
      const rowW = (inRow - 1) * colPitch + tile, x0 = (W - rowW) / 2;
      return { x: x0 + (i % cols) * colPitch, y: top + r * rowPitch, tile, pitch: cols > 1 ? colPitch : 400 };
    };
  }

  function drawEmoji(ctx, img, x, y, s, r) { // стеклянная плитка + эмодзи 74%
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    rrect(ctx, x, y, s, s, r); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fill();
    ctx.restore();
    rrect(ctx, x + 0.5, y + 0.5, s - 1, s - 1, r - 0.5);
    ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1; ctx.stroke();
    const d = s * 0.74;
    ctx.drawImage(img, x + (s - d) / 2, y + (s - d) / 2, d, d);
  }

  function drawTile(ctx, img, x, y, s, r) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 18;
    rrect(ctx, x, y, s, s, r); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
    ctx.save();
    rrect(ctx, x, y, s, s, r); ctx.clip();
    const ar = img.naturalWidth / img.naturalHeight;
    if (Math.abs(ar - 1) < 0.08) {
      ctx.drawImage(img, x, y, s, s);
    } else { // не квадрат — вписываем на белую плитку, пропорции сохраняются
      const box = s * 0.72, w = ar >= 1 ? box : box * ar, h = ar >= 1 ? box / ar : box;
      ctx.drawImage(img, x + (s - w) / 2, y + (s - h) / 2, w, h);
    }
    ctx.restore();
    rrect(ctx, x + 0.5, y + 0.5, s - 1, s - 1, r - 0.5);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.stroke();
  }

  async function render() {
    const token = ++st.token;
    const c = $('pg-canvas'), ctx = c.getContext('2d');
    const accent = $('pg-accent').value;
    await Promise.all([
      document.fonts.load('800 76px PinInter', 'Логотипы Logo'),
      document.fonts.load('600 25px PinInter', 'Сбер Sber'),
      document.fonts.load('700 29px PinInter', 'Все trace-logos.ru'),
    ]);
    const imgs = await Promise.all([
      ...st.selected.map(it => loadImg(fileFor(it)).catch(() => null)),
      loadImg('/assets/logos/svgs/trace-logos.svg').catch(() => null),
    ]);
    if (token !== st.token) return; // устарел — запущен более свежий рендер

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0e0d12'; ctx.fillRect(0, 0, W, H);
    radial(ctx, W * 0.85, H * 0.08, 700, 520, 'rgba(138,107,255,.38)');
    radial(ctx, W * 0.10, H * 0.98, 800, 600, 'rgba(138,107,255,.20)');

    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    // Заголовок 76px; длинная строка уменьшает обе строки, чтобы влезть в 800px между полями.
    const line1 = $('pg-line1').value, line2 = $('pg-line2').value;
    ctx.font = '800 76px ' + FONT; ctx.letterSpacing = '-2.66px';
    const fit = Math.min(1, (W - 2 * L.left) / Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width, 1));
    const size = Math.floor(76 * fit);
    ctx.font = '800 ' + size + 'px ' + FONT; ctx.letterSpacing = (-0.035 * size).toFixed(2) + 'px';
    ctx.fillStyle = '#fff'; ctx.fillText(line1, L.left, 151);
    ctx.fillStyle = accent; ctx.fillText(line2, L.left, 151 + Math.round(79 * fit));

    ctx.font = '600 25px ' + FONT; ctx.letterSpacing = '-0.25px'; ctx.textAlign = 'center';
    const wide = useWide(), pos = st.mode === 'emoji' || wide ? null : gridPos(st.selected.length);
    st.selected.forEach((it, i) => {
      if (wide) { // карточка 800×(340 для одного | 260 для двух), блок по центру между заголовком и футером
        const n = st.selected.length, h = n === 1 ? 340 : 260, gap = 90, total = n * h + (n - 1) * gap + 50;
        const y = 300 + (1090 - total) / 2 + i * (h + gap);
        if (imgs[i]) drawWideCard(ctx, imgs[i], 100, y, 800, h);
        ctx.font = '600 32px ' + FONT; ctx.letterSpacing = '-0.25px'; ctx.fillStyle = '#d9d6e6';
        ctx.fillText(it.label, 500, y + h + 48);
        return;
      }
      if (st.mode === 'emoji') {
        const ex = L.left + (i % COLS) * L.colPitch, ey = L.gridTop + Math.floor(i / COLS) * L.rowPitch;
        if (imgs[i]) drawEmoji(ctx, imgs[i], ex, ey, L.tile, L.radius);
        return;
      }
      const { x, y, tile, pitch } = pos(i), big = tile >= 300;
      if (imgs[i]) drawTile(ctx, imgs[i], x, y, tile, Math.round(tile * 0.23));
      ctx.font = (big ? '600 32px ' : '600 25px ') + FONT; ctx.letterSpacing = '-0.25px';
      ctx.fillStyle = '#d9d6e6';
      const lw = ctx.measureText(it.label).width, maxW = Math.max(tile, pitch - 20); // длинная подпись ужимается, а не лезет на соседа
      const ly = y + tile + (big ? 46 : 38);
      if (lw > maxW) { ctx.save(); ctx.translate(x + tile / 2, ly); ctx.scale(maxW / lw, 1); ctx.fillText(it.label, 0, 0); ctx.restore(); }
      else ctx.fillText(it.label, x + tile / 2, ly);
    });

    // футер: иконка сайта + подпись, «.ru» акцентом
    const text = $('pg-footer').value, logo = imgs[imgs.length - 1];
    ctx.textAlign = 'left'; ctx.font = '700 29px ' + FONT; ctx.letterSpacing = '-0.58px';
    const tail = text.endsWith('.ru') ? '.ru' : '', head = text.slice(0, text.length - tail.length);
    const wHead = ctx.measureText(head).width, wTail = ctx.measureText(tail).width;
    const gap = 14, icon = 48, startX = (W - (icon + gap + wHead + wTail)) / 2, fy = H - 46 - icon;
    if (logo) { ctx.save(); rrect(ctx, startX, fy, icon, icon, 12); ctx.clip(); ctx.drawImage(logo, startX, fy, icon, icon); ctx.restore(); }
    ctx.fillStyle = '#fff'; ctx.fillText(head, startX + icon + gap, fy + 33);
    ctx.fillStyle = accent; ctx.fillText(tail, startX + icon + gap + wHead, fy + 33);
    ctx.letterSpacing = '0px';
  }

  // Любое изменение: перерисовать пин, обновить тексты, сохранить черновик.
  let raf = 0;
  function changed() {
    cancelAnimationFrame(raf); raf = requestAnimationFrame(render);
    refreshTexts(); saveDraft();
  }

  // ── Сетка 3×4 (порядок = порядок на пине) ─────────────────────────────
  function renderGrid() {
    const n = st.selected.length;
    const cnt = $('pg-sel-count'); cnt.textContent = n + ' / ' + MAX; cnt.classList.toggle('ok', n === MAX);
    const okN = st.mode === 'emoji' ? n === MAX : n >= 1;
    $('pg-download').disabled = !okN;
    $('pg-download').title = okN ? '' : (st.mode === 'emoji' ? 'Нужно ровно ' + MAX + ' эмодзи' : 'Добавьте хотя бы один логотип');
    const png = st.mode === 'emoji' ? [] : st.selected.filter(s => !isSvg(s)).map(s => s.label);
    $('pg-warn').hidden = !png.length;
    $('pg-warn').textContent = png.length ? 'Только PNG, без SVG: ' + png.join(', ') + '. Заголовок обещает SVG — замените или поправьте заголовок.' : '';

    const box = $('pg-grid'); box.textContent = '';
    for (let i = 0; i < MAX; i++) {
      const it = st.selected[i];
      const cell = document.createElement('div');
      cell.className = 'pg-slot' + (it ? '' : ' empty');
      cell.dataset.i = i;
      if (!it) {
        cell.innerHTML = '<div class="pg-slot-tile"><span>' + (i + 1) + '</span></div>';
        if (i === n) cell.addEventListener('click', () => $('pg-q').focus());
      } else {
        cell.draggable = true;
        const tile = document.createElement('div'); tile.className = 'pg-slot-tile';
        const img = document.createElement('img'); img.src = pathOf(fileOf(it)); img.alt = ''; img.draggable = false;
        tile.append(img);
        if (!isSvg(it) && st.mode !== 'emoji') { const b = document.createElement('i'); b.className = 'pg-badge'; b.textContent = 'PNG'; tile.append(b); }
        const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'pg-rm'; rm.title = 'Убрать'; rm.textContent = '×';
        rm.addEventListener('click', () => { st.selected.splice(i, 1); update(); });
        tile.append(rm);
        const inp = document.createElement('input'); inp.value = it.label; inp.title = it.name;
        inp.addEventListener('input', () => { it.label = inp.value; changed(); });
        if (st.mode === 'emoji') cell.append(tile); else cell.append(tile, inp); // у эмодзи подписей на пине нет
        cell.addEventListener('dragstart', e => { st.drag = i; cell.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
        cell.addEventListener('dragend', () => { st.drag = -1; cell.classList.remove('dragging'); });
      }
      cell.addEventListener('dragover', e => { if (st.drag >= 0) { e.preventDefault(); cell.classList.add('over'); } });
      cell.addEventListener('dragleave', () => cell.classList.remove('over'));
      cell.addEventListener('drop', e => {
        e.preventDefault(); cell.classList.remove('over');
        const from = st.drag, to = Math.min(i, st.selected.length - 1);
        if (from < 0 || from === to) return;
        st.selected.splice(to, 0, st.selected.splice(from, 1)[0]);
        update();
      });
      box.append(cell);
    }
  }

  // ── Каталог ───────────────────────────────────────────────────────────
  function pickerList() {
    const src = $('pg-cat').value, q = norm($('pg-q').value.trim());
    const base = st.mode === 'emoji' ? st.emoji : st.all;
    let list = src === '@pool' ? st.pool : src ? base.filter(it => it.categorySlug === src) : base;
    if (q) list = (src === '@pool' ? list : base).filter(it => norm(it.name).includes(q) || norm(it.name_en).includes(q) || norm(it.tags).includes(q));
    return list;
  }

  function toggle(it) {
    const idx = st.selected.findIndex(s => s.url === it.url);
    if (idx >= 0) st.selected.splice(idx, 1);
    else if (st.selected.length < MAX) st.selected.push(entry(it));
    update();
  }

  function renderPicker() {
    const list = pickerList(), full = st.selected.length >= MAX, box = $('pg-pick');
    box.textContent = '';
    $('pg-pick-count').textContent = list.length ? list.length + ' в списке' : 'Ничего не найдено';
    list.slice(0, 300).forEach(it => {
      const on = st.selected.some(s => s.url === it.url);
      const b = document.createElement('button'); b.type = 'button'; b.title = it.name + (isSvg(it) || st.mode === 'emoji' ? '' : ' — только PNG');
      b.className = on ? 'on' : ''; b.disabled = full && !on;
      const img = document.createElement('img'); img.loading = 'lazy'; img.alt = ''; img.src = pathOf(fileOf(it));
      const sp = document.createElement('span'); sp.textContent = it.name;
      b.append(img, sp);
      if (!isSvg(it) && st.mode !== 'emoji') { const t = document.createElement('i'); t.className = 'pg-badge'; t.textContent = 'PNG'; b.append(t); }
      b.addEventListener('click', () => toggle(it));
      box.append(b);
    });
  }

  function update() { renderGrid(); renderPicker(); changed(); }

  // Добрать пустые места из текущего списка каталога, SVG — в первую очередь.
  function fill() {
    const have = new Set(st.selected.map(s => s.url));
    const list = pickerList().filter(it => !have.has(it.url));
    const sorted = [...list.filter(isSvg), ...list.filter(it => !isSvg(it))];
    for (const it of sorted) { if (st.selected.length >= MAX) break; st.selected.push(entry(it)); }
    update();
  }

  // ── Режим (логотипы / эмодзи) ─────────────────────────────────────────
  function fillCats() {
    const sel = $('pg-cat'), cats = new Map();
    (st.mode === 'emoji' ? st.emoji : st.all).forEach(it => cats.set(it.categorySlug, it.categoryName));
    sel.textContent = '';
    sel.append(new Option(st.mode === 'emoji' ? 'Все эмодзи' : 'Все категории', ''));
    [...cats].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'ru')).forEach(([sl, n]) => sel.append(new Option(n, sl)));
  }
  function setMode(mode) {
    mode = MODES[mode] ? mode : 'logos';
    if (st.mode === mode && $('pg-cat').options.length) return;
    st.mode = mode;
    COLS = MODES[mode].cols; MAX = MODES[mode].max; L = MODES[mode].L;
    $('pg-grid').className = 'pg-grid' + (mode === 'emoji' ? ' emoji' : '');
    $('pg-grid').style.setProperty('--cols', COLS);
    $('pg-pick').classList.toggle('emoji', mode === 'emoji');
    fillCats();
  }
  function syncFooter() { // подпись по умолчанию зависит от режима; своё значение не трогаем
    const f = $('pg-footer');
    if (!f.value || Object.values(MODES).some(m => m.footer === f.value)) f.value = MODES[st.mode].footer;
  }

  // ── Тема ──────────────────────────────────────────────────────────────
  function setPoolOption() {
    const sel = $('pg-cat'), t = theme();
    let opt = sel.querySelector('option[value="@pool"]');
    if (!t) { if (opt) opt.remove(); return; }
    if (!opt) { opt = new Option('', '@pool'); sel.insertBefore(opt, sel.firstChild); }
    opt.textContent = 'Тема: ' + t.h1 + ' (' + st.pool.length + ')';
  }

  function poolInfo(t, prefix) {
    if (t.mode === 'emoji') return prefix + 'Подборка вручную: ' + t.pool.length + ' эмодзи Apple (PNG).';
    return prefix + 'В теме ' + t.pool.length + ' логотипов, из них SVG — ' + t.pool.filter(isSvg).length + '.' +
      (THEMES[t.id] && THEMES[t.id].names ? ' Состав подобран вручную.' : t.order === 'downloads' ? ' Автосостав — по скачиваниям.' : '');
  }

  function applyTheme(id) {
    st.theme = st.themes.has(id) ? id : '';
    const t = theme(), ov = THEMES[st.theme] || {};
    if (t) setMode(t.mode);
    st.pool = t ? t.pool : [];
    setPoolOption();
    if (t) {
      const [l1, l2] = t.lines || splitTitle(t.h1);
      $('pg-line1').value = ov.line1 || l1; $('pg-line2').value = ov.line2 || l2;
      $('pg-link').value = t.link; $('pg-campaign').value = t.campaign;
      st.selected = t.fixed ? t.pool.map(it => entry(it)) : ov.names
        ? ov.names.map(n => st.all.find(it => it.name === n && (!ov.category || it.categorySlug === ov.category)))
          .filter(Boolean).map(it => entry(it, (ov.labels || {})[it.name]))
        : autoPick(t).map(it => entry(it, (ov.labels || {})[it.name]));
      $('pg-cat').value = '@pool';
    }
    syncFooter();
    st.titleDirty = st.descDirty = false;
    $('pg-q').value = '';
    $('pg-pool-info').textContent = t ? poolInfo(t, '') : 'Свой пин: тексты и логотипы задаются вручную.';
    update();
  }

  // ── Черновик (только удобство этого браузера) ─────────────────────────
  const FIELDS = ['pg-line1', 'pg-line2', 'pg-footer', 'pg-accent', 'pg-link', 'pg-campaign', 'pg-title', 'pg-desc'];
  function saveDraft() {
    try {
      const d = { theme: st.theme, mode: st.mode, titleDirty: st.titleDirty, descDirty: st.descDirty,
        selected: st.selected.map(s => ({ url: s.url, label: s.label })) };
      FIELDS.forEach(id => { d[id] = $(id).value; });
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (_) { /* приватный режим — черновик просто не сохранится */ }
  }
  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!d || !Array.isArray(d.selected)) return false;
      st.theme = st.themes.has(d.theme) ? d.theme : '';
      const t = theme();
      setMode(t ? t.mode : d.mode);
      st.pool = t ? t.pool : [];
      setPoolOption();
      $('pg-collection').value = st.theme;
      FIELDS.forEach(id => { if (typeof d[id] === 'string') $(id).value = d[id]; });
      st.selected = d.selected.map(s => st.byUrl.has(s.url) && entry(st.byUrl.get(s.url), s.label)).filter(Boolean).slice(0, MAX);
      st.titleDirty = !!d.titleDirty; st.descDirty = !!d.descDirty;
      if (t) $('pg-cat').value = '@pool';
      $('pg-pool-info').textContent = t ? poolInfo(t, 'Черновик восстановлен. ') : 'Черновик восстановлен.';
      return true;
    } catch (_) { return false; }
  }

  // ── Действия ──────────────────────────────────────────────────────────
  function copy(id, btn) {
    navigator.clipboard.writeText($(id).value).then(() => {
      const t = btn.textContent; btn.textContent = '✓'; setTimeout(() => { btn.textContent = t; }, 1200);
    });
  }

  function download() {
    if ($('pg-download').disabled) return;
    $('pg-canvas').toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = ($('pg-campaign').value.trim() || 'pin') + '-pin.png';
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  }

  async function init() {
    if (st.ready) return;
    st.ready = true;
    const status = $('pg-pool-info');
    try {
      const get = async (url, need) => {
        const r = await fetch(url);
        if (!r.ok) { if (need) throw new Error(url + ' → ' + r.status); return null; }
        return r.json();
      };
      const [logos, cols, ecos, seo, stats, emoji, emojiThemes] = await Promise.all([get('/logos.json', true), get('/collections.json'),
        get('/logos/ecosystems.json'), get('/logos/category-seo.json'), get('/logos/download-stats.json'),
        get('/emoji.json'), get('/admin/pin-emoji-themes.json')]);
      st.all = logos.logos.filter(it => fileOf(it));
      st.all.forEach(it => st.byUrl.set(it.url, it));
      // ключ статистики — figma (Icon/Bank/Sber), URL страницы — /logos/bank/sber/
      Object.entries((stats && stats.downloads) || {}).forEach(([k, v]) => st.dl.set(k.split('/').slice(1).join('/').toLowerCase(), v));
      buildThemes((cols && cols.collections) || [], ecos || {}, seo || {});
      st.emoji = ((emoji && emoji.emoji) || []).filter(it => it.pngUrl); // основной вариант — Apple PNG
      st.emoji.forEach(it => st.byUrl.set(it.url, it));
      st.emojiThemes = (emojiThemes && emojiThemes.themes) || [];
      buildEmojiThemes();
    } catch (e) { st.ready = false; status.textContent = 'Не удалось загрузить каталог: ' + e.message; return; }

    const colSel = $('pg-collection');
    colSel.append(new Option('Свой пин (без темы)', ''));
    const groups = new Map();
    st.themes.forEach(t => {
      if (!groups.has(t.group)) { const g = document.createElement('optgroup'); g.label = t.group; groups.set(t.group, g); colSel.append(g); }
      const svg = t.pool.filter(isSvg).length;
      groups.get(t.group).append(new Option(t.h1 + (t.mode === 'emoji' ? ' · ' + t.pool.length + ' эмодзи' : ' · ' + svg + ' SVG' + (svg < MAX ? ' — мало' : '')), t.id));
    });

    const sel = $('pg-cat');
    setMode('logos');

    colSel.addEventListener('change', () => applyTheme(colSel.value));
    ['pg-line1', 'pg-line2', 'pg-footer', 'pg-accent', 'pg-link', 'pg-campaign'].forEach(id => $(id).addEventListener('input', changed));
    $('pg-title').addEventListener('input', () => { st.titleDirty = true; changed(); });
    $('pg-desc').addEventListener('input', () => { st.descDirty = true; changed(); });
    $('pg-title-auto').addEventListener('click', () => { st.titleDirty = false; changed(); });
    $('pg-desc-auto').addEventListener('click', () => { st.descDirty = false; changed(); });
    sel.addEventListener('change', renderPicker);
    $('pg-q').addEventListener('input', renderPicker);
    $('pg-q').addEventListener('keydown', e => { // Enter — добавить первый найденный
      if (e.key !== 'Enter') return;
      const it = pickerList().find(x => !st.selected.some(s => s.url === x.url));
      if (it && st.selected.length < MAX) { toggle(it); $('pg-q').select(); }
    });
    $('pg-fill').addEventListener('click', fill);
    $('pg-clear').addEventListener('click', () => { st.selected = []; update(); });
    $('pg-download').addEventListener('click', download);
    $('pg-reset').addEventListener('click', () => {
      $('pg-footer').value = ''; $('pg-accent').value = DEFAULT_ACCENT;
      applyTheme(st.theme);
    });
    $('pg-copy-title').addEventListener('click', e => copy('pg-title', e.currentTarget));
    $('pg-copy-desc').addEventListener('click', e => copy('pg-desc', e.currentTarget));
    $('pg-copy-link').addEventListener('click', e => copy('pg-full-link', e.currentTarget));
    document.addEventListener('keydown', e => { // ⌘S / Ctrl+S — скачать PNG, пока открыта вкладка
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && $('panel-pinterest').classList.contains('active')) { e.preventDefault(); download(); }
    });

    if (loadDraft()) update();
    else { colSel.value = DEFAULT_THEME; applyTheme(DEFAULT_THEME); }
  }

  // Пакетный режим (scripts/pinterest-batch.js): рисует пин по готовому плану и отдаёт PNG data-URL.
  // plan = { mode?: 'logos'|'emoji', line1, line2, footer?, items: [{ url, label }] }; не найденные в каталоге url возвращаются в missing.
  async function renderPlan(plan) {
    await init();
    setMode(plan.mode);
    $('pg-line1').value = plan.line1; $('pg-line2').value = plan.line2;
    $('pg-footer').value = plan.footer || MODES[st.mode].footer; $('pg-accent').value = DEFAULT_ACCENT;
    const missing = [];
    st.selected = plan.items.map((x) => { const it = st.byUrl.get(x.url); if (!it) missing.push(x.url); return it && entry(it, x.label); }).filter(Boolean);
    renderGrid();
    await render();
    return { png: $('pg-canvas').toDataURL('image/png'), missing };
  }

  window.PinGen = { init, renderPlan };
})();
