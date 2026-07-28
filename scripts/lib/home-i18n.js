// ─────────────────────────────────────────────────────────────────────────────
// home-i18n.js — перевод главной (index.html) для /en/ на этапе сборки.
//
// index.html — рукописная страница без data-i18n. Чтобы не держать второй
// источник правды (отдельный en/index.html), build-en-pages.js прогоняет
// русский исходник через translateHome() и запекает английский статикой.
//
// PAIRS применяются по порядку, каждый — полная замена (split/join). Строки
// заякорены тегами/кавычками или это уникальные фразы, поэтому порядок важен
// лишь для перекрытий (длинные фразы — раньше коротких).
// ─────────────────────────────────────────────────────────────────────────────

const PAIRS = [
  // ── <head>: meta / OG / Twitter ─────────────────────────────────────────
  [`Trace Logo's — SVG-логотипы брендов и эмодзи: скачать бесплатно`,
   `Trace Logo's — brand SVG logos and emoji: free download`],
  [`Открытая библиотека: 288 SVG/PNG логотипов российских и международных брендов и 1918 эмодзи Apple, Google и Microsoft. Поиск, редактор цвета, экспорт в Figma — бесплатно и без регистрации.`,
   `Open library: 288 SVG/PNG logos of Russian and international brands plus 1918 Apple, Google and Microsoft emoji. Search, color editor, Figma export — free and no signup.`],
  [`Trace Logo's — SVG-логотипы брендов и эмодзи`, `Trace Logo's — brand SVG logos and emoji`],
  [`288 SVG/PNG логотипов брендов и 1918 эмодзи Apple, Google и Microsoft. Скачивайте, редактируйте цвета, экспортируйте в Figma.`,
   `288 brand SVG/PNG logos and 1918 Apple, Google and Microsoft emoji. Download, recolor and export to Figma.`],
  [`288 SVG/PNG логотипов брендов и 1918 эмодзи Apple, Google и Microsoft. Бесплатно, без регистрации.`,
   `288 brand SVG/PNG logos and 1918 Apple, Google and Microsoft emoji. Free, no signup.`],
  [`content="ru_RU"`, `content="en_US"`],

  // ── JSON-LD ─────────────────────────────────────────────────────────────
  [`"inLanguage": "ru"`, `"inLanguage": "en"`],
  [`Открытая библиотека SVG-логотипов, эмодзи и иконок`, `Open library of SVG logos, emoji and icons`],
  [`"name": "Логотипы"`, `"name": "Logos"`],
  [`SVG и PNG логотипы российских и международных брендов — скачать бесплатно`,
   `SVG and PNG logos of Russian and international brands — free download`],
  [`"name": "Эмодзи"`, `"name": "Emoji"`],
  [`Apple, Google и Microsoft эмодзи в PNG — скачать бесплатно`, `Apple, Google and Microsoft emoji in PNG — free download`],
  [`"name": "Блог"`, `"name": "Blog"`],
  [`Статьи о логотипах, форматах SVG и PNG, эмодзи и брендах`, `Articles about logos, SVG and PNG formats, emoji and brands`],
  [`"name": "Логотипы банков"`, `"name": "Bank logos"`],
  [`SVG и PNG логотипы российских банков: Т-Банк, Альфа, ВТБ, Сбер`, `SVG and PNG logos of Russian banks: T-Bank, Alfa, VTB, Sber`],
  [`"name": "Логотипы соцсетей"`, `"name": "Social media logos"`],
  [`SVG и PNG логотипы социальных сетей и мессенджеров`, `SVG and PNG logos of social networks and messengers`],
  [`"name": "Логотипы маркетплейсов"`, `"name": "Marketplace logos"`],
  [`SVG и PNG логотипы маркетплейсов: Ozon, Wildberries, Авито`, `SVG and PNG logos of marketplaces: Ozon, Wildberries, Avito`],
  [`"name": "Логотипы нейросетей"`, `"name": "AI logos"`],
  [`SVG и PNG логотипы нейросетей и AI: ChatGPT, Claude, Gemini`, `SVG and PNG logos of AI and neural networks: ChatGPT, Claude, Gemini`],
  [`"name": "Карта сайта"`, `"name": "Sitemap"`],
  [`Все категории логотипов, эмодзи и подборки Trace Logo's`, `All logo categories, emoji and collections of Trace Logo's`],

  // ── Header / nav ────────────────────────────────────────────────────────
  [`aria-label="Trace Logo's — на главную"`, `aria-label="Trace Logo's — home"`],
  [`aria-label="Разделы"`, `aria-label="Sections"`],
  [`<a href="logos/">Логотипы</a>`, `<a href="logos/">Logos</a>`],
  [`<a href="emoji/">Эмодзи</a>`, `<a href="emoji/">Emoji</a>`],
  [`<a href="blog/">Блог</a>`, `<a href="blog/">Blog</a>`],
  [`Figma плагин`, `Figma plugin`],
  [`>Иконки</a>`, `>Icons</a>`],

  // ── Hero ────────────────────────────────────────────────────────────────
  [`class="hero-h1-row">Логотипы `, `class="hero-h1-row">Logos `],
  [`<br class="hero-br-mobile"> брендов и `, `<br class="hero-br-mobile"> brands and `],
  [`эмодзи</span><span class="accent">`, `emoji</span><span class="accent">`],
  [`"accent">для дизайна и разработки`, `"accent">for design and development`],
  [`Широко улыбается`, `Grinning face`],
  [`SVG и PNG логотипов российских и международных брендов, эмодзи Apple, Google и Microsoft.`,
   `SVG and PNG logos of Russian and international brands, plus Apple, Google and Microsoft emoji.`],
  [`Скачивайте, меняйте цвета и экспортируйте в Figma — `, `Download, recolor and export to Figma — `],
  [`<strong>без регистрации</strong>`, `<strong>no signup</strong>`],
  [`placeholder="Найдите логотип или эмодзи…"`, `placeholder="Find a logo or emoji…"`],
  [`aria-label="Поиск по логотипам и эмодзи"`, `aria-label="Search logos and emoji"`],
  [`aria-label="Результаты поиска"`, `aria-label="Search results"`],
  [`type="submit">Найти</button>`, `type="submit">Find</button>`],
  [`>или</span>`, `>or</span>`],
  [`>Перейти сразу в библиотеку</a>`, `>Go straight to the library</a>`],

  // ── Section: Popular ────────────────────────────────────────────────────
  [`>Популярные логотипы</h2>`, `>Popular logos</h2>`],
  [`>Самые востребованные бренды каталога</div>`, `>The most in-demand brands in the catalog</div>`],
  [`>Все логотипы →</a>`, `>All logos →</a>`],

  // ── Section: Categories ─────────────────────────────────────────────────
  [`>Категории логотипов</h2>`, `>Logo categories</h2>`],
  [`>35 разделов — от банков до нейросетей</div>`, `>35 sections — from banks to AI</div>`],
  [`>Открыть каталог →</a>`, `>Open catalog →</a>`],
  [`>Мессенджеры и соцсети</span>`, `>Messengers & social</span>`],
  [`>Видеозвонки</span>`, `>Video calls</span>`],
  [`>Видео и стриминг</span>`, `>Video & streaming</span>`],
  [`>Музыка и медиа</span>`, `>Music & media</span>`],
  [`>Маркетплейсы и ритейл</span>`, `>Marketplaces & retail</span>`],
  [`>Еда и рестораны</span>`, `>Food & restaurants</span>`],
  [`>Банки</span>`, `>Banks</span>`],
  [`>Платежи и карты</span>`, `>Payments & cards</span>`],
  [`>Рассрочка и BNPL</span>`, `>Installments & BNPL</span>`],
  [`>Доставка и такси</span>`, `>Delivery & taxi</span>`],
  [`>Карты и навигация</span>`, `>Maps & navigation</span>`],
  [`>Реклама и аналитика</span>`, `>Ads & analytics</span>`],
  [`>Отзывы и справочники</span>`, `>Reviews & directories</span>`],
  [`>Поиск и браузеры</span>`, `>Search & browsers</span>`],
  [`>Почта</span>`, `>Mail</span>`],
  [`>Офис и документы</span>`, `>Office & documents</span>`],
  [`>Облака и хранилища</span>`, `>Cloud & storage</span>`],
  [`>Ассистенты</span>`, `>Assistants</span>`],
  [`>Сторы и подписки</span>`, `>Stores & subscriptions</span>`],
  [`>Системные приложения</span>`, `>System apps</span>`],
  [`>Нейросети</span>`, `>AI & neural networks</span>`],
  [`>Дизайн</span>`, `>Design</span>`],
  [`>Сайты и CMS</span>`, `>Websites & CMS</span>`],
  [`>Разработка</span>`, `>Development</span>`],
  [`>macOS утилиты</span>`, `>macOS utilities</span>`],
  [`>Связь и интернет</span>`, `>Telecom & internet</span>`],
  [`>Путешествия</span>`, `>Travel</span>`],
  [`>Образование</span>`, `>Education</span>`],
  [`>Здоровье</span>`, `>Health</span>`],
  [`>Страхование</span>`, `>Insurance</span>`],
  [`>Склад, ERP и CRM</span>`, `>Warehouse, ERP & CRM</span>`],
  [`>Документы и ЭДО</span>`, `>Documents & EDM</span>`],
  [`>Работа и HR</span>`, `>Jobs & HR</span>`],
  [`>Флаги</span>`, `>Flags</span>`],
  [`>B2B и корпоративные сервисы</span>`, `>B2B & corporate services</span>`],

  // ── Section: Emoji ──────────────────────────────────────────────────────
  [`>Эмодзи Apple, Google и Microsoft</h2>`, `>Apple, Google and Microsoft emoji</h2>`],
  [`>1918 эмодзи в PNG и SVG — поиск на русском и английском</div>`, `>1918 emoji in PNG and SVG — search in Russian and English</div>`],
  [`>Все эмодзи →</a>`, `>All emoji →</a>`],

  // ── Section: Figma plugin ───────────────────────────────────────────────
  [`>Логотипы и эмодзи — прямо в Figma</h2>`, `>Logos and emoji — right inside Figma</h2>`],
  [`Не нужно скачивать файлы и тащить их на холст. Найдите бренд или эмодзи`,
   `No need to download files and drag them onto the canvas. Find a brand or emoji`],
  [`в плагине и вставьте на макет одним кликом — векторными слоями, готовыми к редактированию.`,
   `in the plugin and insert it into your design in one click — as vector layers ready to edit.`],
  [`Поиск по 288 логотипам и 1918 эмодзи на русском и английском`, `Search 288 logos and 1918 emoji in Russian and English`],
  [`Вставка как векторных слоёв — без растра и лишнего кода`, `Insert as vector layers — no raster or extra code`],
  [`Редактор цвета и выбор вариантов внутри плагина`, `Color editor and variant picker inside the plugin`],
  [`Установить в Figma`, `Install in Figma`],
  [`>Бесплатно · без регистрации</span>`, `>Free · no signup</span>`],
  [`Найти логотип…`, `Find a logo…`],
  [`class="ff-tab active">Лого</span>`, `class="ff-tab active">Logos</span>`],
  [`class="ff-tab">Эмодзи</span>`, `class="ff-tab">Emoji</span>`],
  [`>Вставить в Figma</div>`, `>Insert into Figma</div>`],
  [`Плагин для Figma`, `Figma plugin`],

  // ── Section: Tools ──────────────────────────────────────────────────────
  [`>Инструменты</h2>`, `>Tools</h2>`],
  [`>Всё для работы с логотипом — прямо в браузере</div>`, `>Everything for working with logos — right in the browser</div>`],
  [`Меняйте цвета логотипа онлайн: HSV-пикер, история изменений, отмена и повтор.`,
   `Recolor logos online: HSV picker, change history, undo and redo.`],
  [`Копируйте готовый SVG и вставляйте прямо на холст Figma — без чистки кода.`,
   `Copy ready SVG and paste straight onto the Figma canvas — no code cleanup.`],
  [`>SVG, PNG и ZIP</div>`, `>SVG, PNG & ZIP</div>`],
  [`Скачивайте в нужном формате или забирайте все варианты логотипа одним архивом.`,
   `Download in the format you need or grab all logo variants in one archive.`],
  [`Редактор цвета`, `Color editor`],
  [`Экспорт в Figma`, `Export to Figma`],

  // ── Section: Collections ────────────────────────────────────────────────
  // Tile names (cat-name span text) and footer short labels are NOT hardcoded
  // here — see collectionPairs() below, derived straight from collections.json
  // (h1/h1_en, home_label/home_label_en) so a new collection never silently
  // stays untranslated on the EN homepage the way video-streaming did.
  [`>Подборки логотипов</h2>`, `>Logo collections</h2>`],
  [`>Готовые наборы под конкретную задачу</div>`, `>Ready-made sets for a specific task</div>`],

  // ── Footer ──────────────────────────────────────────────────────────────
  [`Открытая библиотека логотипов и эмодзи. Бесплатно, без регистрации, с открытым исходным кодом.`,
   `Open library of logos and emoji. Free, no signup, open source.`],
  [`<h3>Каталог</h3>`, `<h3>Catalog</h3>`],
  [`>Все логотипы</a>`, `>All logos</a>`],
  [`>Нейросети</a>`, `>AI</a>`],
  [`>Банки</a>`, `>Banks</a>`],
  [`>Маркетплейсы</a>`, `>Marketplaces</a>`],
  [`>Соцсети</a>`, `>Social</a>`],
  [`>Флаги</a>`, `>Flags</a>`],
  [`<h3>Подборки</h3>`, `<h3>Collections</h3>`],
  [`<h3>Инструменты</h3>`, `<h3>Tools</h3>`],
  [`>Скачать SVG / PNG</a>`, `>Download SVG / PNG</a>`],
  [`>Предложить логотип</a>`, `>Suggest a logo</a>`],
  [`<h3>Разработчикам</h3>`, `<h3>For developers</h3>`],
  [`>Статус сервисов</a>`, `>Service status</a>`],
  [`Trace Logo's Beta · Изображения могут быть защищены авторским правом их владельцев.`,
   `Trace Logo's Beta · Images may be protected by their owners' copyright.`],
  [`>Карта сайта</a>`, `>Sitemap</a>`],
  [`>Открытый исходный код</a>`, `>Open source</a>`],
];

// Popular-logo card names are DATA-DRIVEN: build-home-popular.js writes the
// picked list (name + name_en) to logos/_popular.json, and we derive the RU→EN
// name pairs + alt map from it here. Keeps brand names single-sourced from the
// category JSON instead of a hardcoded list that drifts as the block changes.
// Read best-effort — if the file is missing (e.g. first build), popular cards
// simply stay in Russian on /en/ until the next build regenerates it.
function loadPopularNames() {
  try {
    const list = require('../../logos/_popular.json');
    const pairs = [];
    const alt = {};
    for (const { name, name_en } of list) {
      if (name_en && name_en !== name) {
        pairs.push([`>${name}</span>`, `>${name_en}</span>`]);
        alt[name] = name_en;
      }
    }
    return { pairs, alt };
  } catch {
    return { pairs: [], alt: {} };
  }
}

// Collection tile names (.cat-name span text) and footer short labels, derived
// straight from collections.json instead of hand-maintained pairs — see the
// note above the "Section: Collections" PAIRS block.
function loadCollectionPairs() {
  try {
    const { collections } = require('../../collections.json');
    const pairs = [];
    for (const c of collections) {
      if (c.h1 && c.h1_en) pairs.push([c.h1, c.h1_en]);
      if (c.home_label && c.home_label_en) pairs.push([`>${c.home_label}</a>`, `>${c.home_label_en}</a>`]);
    }
    return pairs;
  } catch {
    return [];
  }
}

function translateHome(html) {
  const popular = loadPopularNames();
  for (const [ru, en] of [...PAIRS, ...loadCollectionPairs(), ...popular.pairs]) {
    // Source text uses typographic non-breaking spaces (U+00A0) in places, so a
    // plain substring match misses them. Match each space against ' ' OR NBSP.
    const pattern = ru.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[ \\u00A0]');
    html = html.replace(new RegExp(pattern, 'g'), () => en);
  }
  // alt="Логотип <name>" → "<name-en> logo" (Latin brands fall back to name).
  html = html.replace(/alt="Логотип ([^"]+)"/g, (m, name) => `alt="${popular.alt[name] || name} logo"`);
  return html;
}

module.exports = { translateHome };
