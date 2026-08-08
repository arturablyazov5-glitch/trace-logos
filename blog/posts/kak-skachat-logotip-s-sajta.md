---
title: Как скачать логотип с любого сайта — 5 легальных способов
title_en: How to Download a Logo from Any Website — 5 Legitimate Ways
description: Как вытащить логотип с сайта в хорошем качестве: DevTools, прямые ссылки на SVG, пресс‑киты, каталоги. Почему скриншот — худший вариант, и что с правами.
description_en: How to get a logo off a website in good quality — DevTools, direct SVG links, press kits, catalogs. Why screenshots are the worst option, and the legal side.
date: 2026-06-21
slug: kak-skachat-logotip-s-sajta
tags: Логотипы, Инструкции, Инструменты
tags_en: Logos, How-to, Tools
---

Нужен логотип банка для презентации, иконка сервиса для схемы интеграций, знак партнёра для слайда «нам доверяют». Рука тянется сделать скриншот, и в макет уезжает мыльный растр с куском чужого фона. Между тем логотип, который вы только что сфотографировали с экрана, лежит на том же сайте в векторе: сайт обязан был его откуда‑то загрузить, чтобы показать вам. Скриншот означает лишь то, что файл искали не там. Разберём, где он лежит на самом деле, — от самых быстрых источников к самым трудоёмким.

:::note Коротко
Порядок от лучшего к худшему: **каталог логотипов** (SVG в один клик) → **пресс‑кит бренда** (официальные файлы с правилами) → **DevTools** (достанет логотип с любого сайта за 30 секунд) → **правый клик → сохранить картинку** → скриншот, если провалилось всё остальное. Про право использовать чужой знак — в конце: для большинства бытовых задач можно.
:::

## Способ 1. Правый клик — когда повезло

Правый клик по логотипу → «Сохранить изображение как…» или «Открыть изображение в новой вкладке». Если логотип вставлен обычным тегом `<img>`, вы получите исходный файл, и нередко это сразу SVG.

Везёт так примерно в половине случаев. Пункт «сохранить изображение» исчезает из меню, когда логотип вставлен инлайн‑кодом, нарисован фоном через CSS или прикрыт прозрачным элементом. Тогда файл всё равно существует — просто до него нужно добраться через панель разработчика.

## Способ 2. DevTools — достаёт что угодно за 30 секунд

Панель работает одинаково в [Chrome](../../logos/search/chrome/), [Яндекс Браузере](../../logos/search/yandexbrowser/) и [Firefox](../../logos/search/firefox/):

1. Правый клик по логотипу → **«Просмотреть код»** (Inspect).
2. Панель откроется на элементе логотипа. Дальше три варианта:
   - **`<img src="...">`** — откройте ссылку из src в новой вкладке и сохраните файл.
   - **`<svg>...</svg>`** — логотип вставлен инлайн. Правый клик по тегу → Copy → Copy element, и SVG‑код у вас в буфере. Вставьте его в файл с расширением `.svg` или прямо в [Figma](../../logos/design/figma/): она понимает SVG‑код из буфера по Ctrl+V.
   - **`background-image: url(...)`** в стилях — откройте URL из CSS и сохраните.
3. Проверьте добычу: настоящий вектор состоит из `<path>` и фигур, а один тег `<image>` внутри означает растр в векторной обёртке.

Отдельный случай — спрайт. Когда внутри `<svg>` стоит только `<use href="#logo">`, скопированный код в файле окажется пустым: сама фигура лежит в другом месте страницы, в блоке `<symbol>` или в подключённом файле спрайта. Найдите этот `id` поиском по документу (Ctrl+F в панели Elements) и копируйте фигуру оттуда либо откройте файл спрайта целиком по ссылке из `href` — заодно получите все иконки сайта разом.

:::tip Ищите логотип в футере и на странице «О компании»
В шапке сайта часто стоит упрощённая или анимированная версия знака. В футере, пресс‑разделе и на внутренних страницах нередко лежит полный вариант, а иногда и прямая ссылка на официальный архив со всеми файлами.
:::

## Способ 3. Пресс‑кит бренда — источник, который отвечает за файлы

DevTools достанет любой файл, но не скажет, актуален ли он. Пресс‑кит решает и это: у большинства средних и крупных компаний есть раздел «Пресс‑центр», «Медиа» или «Brand assets» с логотипами в SVG и PNG, фирменными цветами и правилами использования.

Отсюда два преимущества, которых нет у добычи из вёрстки: файлы гарантированно свежие, а правила применения написаны прямо рядом с ними. Ищите ссылку в футере сайта или по запросу «название бренда логотип пресс‑кит» либо «brand assets».

В хорошем пресс‑ките рядом с файлами лежат минимальные отступы вокруг знака, список запрещённых искажений и версии для тёмного фона. Эти правила экономят время на согласовании: если партнёр попросит переделать слайд, ссылка на его же гайдлайн закрывает вопрос за минуту.

## Способ 4. Каталоги логотипов — когда знаков нужно много

Пресс‑кит хорош для одного бренда. Но когда собираешь сетку из десяти логотипов — список банков, схему сервисов, блок «нам доверяют», — обход десяти пресс‑разделов превращается в отдельную задачу, и файлы придут в разном качестве и разных пропорциях.

Каталог снимает обе проблемы разом: официальные версии собраны в одном месте и приведены к единому виду. Наш [каталог логотипов](../../logos/) сделан ровно под это: сотни российских и мировых брендов, у каждого — SVG, PNG нужного размера, копирование кода в один клик и перекраска прямо на странице.

## Способ 5. Скриншот — крайняя мера

Остаётся случай, когда файла действительно нет: логотип запечён в растровую картинку вместе с фоном — например, в обложке видео или на фотографии вывески. Тогда скриншот с последующим кадрированием и удалением фона остаётся единственным вариантом, и качество будет равно размеру на экране.

Прежде чем смириться, проверьте способы 3 и 4: почти для любого заметного бренда нормальный файл где‑то лежит.

## Что делать, когда Inspect ничего не нашёл

Отдельная категория сайтов прячет логотип так, что простой Inspect его не показывает. Здесь помогают три приёма поглубже:

- **Вкладка Network.** DevTools → Network → фильтр Img, затем обновите страницу. В списке окажутся все картинки, которые сайт скачал, включая спрятанные в CSS и скриптах. Отсортируйте по имени: логотип обычно называется logo‑что‑нибудь, двойной клик открывает файл для сохранения.
- **Поиск по исходникам.** DevTools → Ctrl+Shift+F → запрос «logo» или «.svg». Находит пути, зашитые в JS‑бандлы и JSON‑конфиги, куда Inspect не заглядывает.
- **Псевдоэлементы и иконочные шрифты.** Если знак нарисован через `::before` иконочным шрифтом, файла‑картинки не существует вовсе. Смотрите Computed → content и font‑family: скачивать придётся шрифт или искать альтернативу в пресс‑ките.

И общий совет: мобильная версия сайта иногда отдаёт другой, более простой файл логотипа — включите эмуляцию устройства в DevTools и проверьте.

## Где ещё лежит вектор, кроме сайта

Сайт — не единственное место, куда файл уже попал в векторе.

**PDF.** Презентация, коммерческое предложение или годовой отчёт хранят логотип кривыми. Откройте PDF в [Illustrator](../../logos/design/illustrator/) или Inkscape, выделите знак и скопируйте его обычной группой фигур. Растровым он окажется только тогда, когда в макет его вставили картинкой.

**Презентации и документы.** Файлы PPTX и DOCX устроены как zip‑архивы. Смените расширение на `.zip`, распакуйте и загляните в папку `ppt/media` или `word/media`: вставленные картинки лежат там в исходном виде, включая SVG.

**Мобильное приложение.** APK распаковывается тем же способом, а иконки внутри лежат в `res/drawable` — набором PNG под разные плотности экрана и векторным XML, который переводится в SVG конвертером.

**Расширения браузера.** Плагины вроде SVG Export и SVG Grabber собирают все векторы страницы в один список: это быстрее ручного обхода DevTools, когда со страницы нужно снять сразу десяток иконок. Проверять добычу всё равно придётся, потому что расширение вытащит и служебные значки интерфейса.

## Четыре проверки скачанного файла

Добыча в руках, но перед вставкой в макет её стоит проверить по четырём пунктам:

1. **Вектор или обёртка.** Откройте SVG текстовым редактором: настоящий вектор состоит из `<path>` и фигур; один тег `<image>` выдаёт растр, замаскированный под SVG.
2. **Актуальность.** У брендов случаются редизайны, а в футерах, на старых лендингах и поддоменах годами живут прошлые версии знака. Сверьте файл с главной страницей бренда или его свежими соцсетями.
3. **Полнота.** В шапке часто стоит урезанный вариант — только знак без текста. Для презентации обычно нужен полный логотип, и его ищут в пресс‑ките.
4. **Поля и холст.** Вытащенный из вёрстки SVG нередко несёт viewBox с запасом: знак сидит в углу большого прозрачного прямоугольника и в макете выравнивается криво. Откройте файл в [Figma](../../logos/design/figma/) — если рамка выделения заметно больше самой фигуры, обрежьте холст по содержимому.

## Какой путь выбрать под задачу

| Задача | Оптимальный путь |
| --- | --- |
| Один известный бренд для слайда | каталог: SVG за 10 секунд |
| Сетка «нам доверяют» из 10 логотипов | каталог: единое качество и стиль |
| Логотип малоизвестной локальной компании | DevTools по их сайту |
| Логотип для печати в высоком качестве | пресс‑кит (там вектор и правила) |
| Логотип из PDF‑презентации | открыть PDF в [Illustrator](../../logos/design/illustrator/)/Inkscape и извлечь вектор |
| Старый логотип, которого нет на сайте | веб‑архив (web.archive.org) + DevTools |

Последняя строка выручает чаще, чем кажется: Wayback Machine хранит старые версии сайтов вместе с файлами логотипов, и это единственный способ достать исторический вариант знака после ребрендинга. Проверяйте в архиве и внутренние страницы: снимки пресс‑разделов сохраняются вместе с файлами, и старая версия логотипа чаще находится именно там.

## А это вообще законно

Само скачивание закон не нарушает — вопросы возникают к способу использования. Общий принцип такой: показывать логотип, чтобы указать на сам бренд (в статье, презентации, списке интеграций, способах оплаты), можно; выдавать за свой, намекать на несуществующее партнёрство или печатать на продаваемом товаре нельзя. Подробный разбор с судебной практикой и таблицей ситуаций — в статье [можно ли использовать чужой логотип](../mozhno-li-ispolzovat-chuzhoy-logotip/).

:::warning Не искажайте знак
Куда бы вы ни поставили чужой логотип, оставьте его пропорции, цвета и границы нетронутыми: растянутый или перекрашенный знак нарушает гайдлайн бренда и выглядит непрофессионально. Правила искажений разбирали в статье [про брендбуки](../chto-takoe-brendbuk/).
:::

## Если коротко

Скриншот стоит последним в списке, потому что вектор почти всегда уже существует: сайт загрузил его, чтобы показать вам, а бренд нередко выложил официальную копию отдельно. Поэтому и порядок действий обратный привычному — сначала каталог или пресс‑кит, затем DevTools, и лишь потом растровые компромиссы. Добытый файл проверьте на подлинность, актуальность и полноту, а в макет ставьте неискажённым.

Сэкономьте себе DevTools: в нашем [каталоге логотипов](../../logos/) знак любого крупного бренда скачивается в SVG и PNG за один клик — или копируется кодом сразу в [Figma](../../logos/design/figma/).

---EN---

You need a bank's logo for a deck, a service icon for an integrations diagram, a partner's mark for a "trusted by" slide. The hand reaches for a screenshot, and a mushy raster with a chunk of someone else's background lands in your layout. Meanwhile the logo you just photographed off the screen sits on that same site as a vector: the site had to load it from somewhere to show it to you. A screenshot only means you looked in the wrong place. Let's go through where the file actually lives, from the fastest sources to the most laborious.

:::note TL;DR
Best to worst: a **logo catalog** (SVG in one click) → the **brand's press kit** (official files with usage rules) → **DevTools** (pulls a logo off any site in 30 seconds) → **right-click → save image** → a screenshot, if everything else failed. On the right to use someone else's mark — at the end: for most everyday tasks, you can.
:::

## Method 1. Right-click — when you're lucky

Right-click the logo → "Save image as…" or "Open image in new tab". If the logo is placed with a plain `<img>` tag, you get the source file, and often that's already an SVG.

Luck holds about half the time. The "save image" entry disappears when the logo is inlined in code, painted as a CSS background or covered by a transparent element. The file still exists then — you just have to reach it through the developer panel.

## Method 2. DevTools — pulls anything in 30 seconds

The panel works the same in [Chrome](../../logos/search/chrome/), [Yandex Browser](../../logos/search/yandexbrowser/) and [Firefox](../../logos/search/firefox/):

1. Right-click the logo → **"Inspect"**.
2. The panel opens on the logo element. Three cases follow:
   - **`<img src="...">`** — open the src link in a new tab and save the file.
   - **`<svg>...</svg>`** — the logo is inlined. Right-click the tag → Copy → Copy element, and the SVG code is on your clipboard. Paste it into a `.svg` file or straight into [Figma](../../logos/design/figma/): it reads SVG code from the clipboard on Ctrl+V.
   - **`background-image: url(...)`** in the styles — open the URL from the CSS and save.
3. Inspect the loot: a real vector consists of `<path>` and shapes, while a single `<image>` tag inside means a raster in vector wrapping.

Sprites are a case of their own. When the `<svg>` contains nothing but `<use href="#logo">`, the copied code lands in your file empty: the shape itself sits elsewhere on the page, in a `<symbol>` block or in a linked sprite file. Find that `id` with a document search (Ctrl+F in the Elements panel) and copy the shape from there, or open the whole sprite file via the `href` link — which hands you every icon on the site at once.

:::tip Look in the footer and the "About" page
The site header often carries a simplified or animated version of the mark. The footer, press section and inner pages frequently hold the full variant, and sometimes a direct link to the official archive with every file.
:::

## Method 3. The brand's press kit — a source that stands behind its files

DevTools will pull any file, but it won't tell you whether that file is current. A press kit solves this too: most mid-size and large companies have a "Press", "Media" or "Brand assets" section with logos in SVG and PNG, brand colors and usage rules.

Hence two advantages that markup scraping lacks: the files are guaranteed fresh, and the usage rules sit right next to them. Look for the link in the site footer or search "brand name logo press kit" or "brand assets".

A good press kit keeps the minimum clear space around the mark, the list of forbidden distortions and dark-background versions right next to the files. Those rules save approval time: if a partner asks you to redo a slide, a link to their own guideline settles it in a minute.

## Method 4. Logo catalogs — when you need many marks

A press kit is great for one brand. But when you're assembling a grid of ten logos — a list of banks, a services diagram, a "trusted by" block — visiting ten press sections becomes a task of its own, and the files arrive in different quality and proportions.

A catalog removes both problems at once: official versions gathered in one place and normalized to a single look. Our [logo catalog](../../logos/) is built exactly for this: hundreds of Russian and global brands, each with SVG, PNG at the size you need, one-click code copying and recoloring right on the page.

## Method 5. Screenshot — the last resort

One case remains where the file genuinely doesn't exist: the logo is baked into a raster image together with its background — in a video thumbnail, say, or a photo of a storefront sign. Then a screenshot with cropping and background removal is the only option, and the quality will equal the size on screen.

Before settling for it, check methods 3 and 4: for almost any notable brand a proper file exists somewhere.

## What to do when Inspect finds nothing

A separate category of sites hides the logo well enough that plain Inspect won't show it. Three deeper techniques help here:

- **The Network tab.** DevTools → Network → the Img filter, then reload the page. The list will hold every image the site downloaded, including those buried in CSS and scripts. Sort by name: the logo is usually called logo-something, and a double click opens the file for saving.
- **Search across sources.** DevTools → Ctrl+Shift+F → query "logo" or ".svg". This finds paths baked into JS bundles and JSON configs, where Inspect never looks.
- **Pseudo-elements and icon fonts.** If the mark is drawn via `::before` with an icon font, no image file exists at all. Check Computed → content and font-family: you'll be downloading a font or looking for an alternative in the press kit.

One general tip: the mobile version of a site sometimes serves a different, simpler logo file — switch on device emulation in DevTools and check.

## Where else the vector lives besides the site

A website is not the only place the file has already reached in vector form.

**PDF.** A deck, a proposal or an annual report stores the logo as curves. Open the PDF in [Illustrator](../../logos/design/illustrator/) or Inkscape, select the mark and copy it as an ordinary group of shapes. It comes out raster only when it was placed into the layout as an image.

**Decks and documents.** PPTX and DOCX files are built as zip archives. Change the extension to `.zip`, unpack it and look into `ppt/media` or `word/media`: the embedded images sit there in their original form, SVG included.

**A mobile app.** An APK unpacks the same way, and the icons live in `res/drawable` — a set of PNGs for different screen densities plus vector XML, which a converter turns into SVG.

**Browser extensions.** Plugins like SVG Export and SVG Grabber collect every vector on the page into one list: faster than walking DevTools by hand when you need a dozen icons off one page. You still have to vet the haul, since the extension also pulls interface glyphs.

## Four checks on the downloaded file

The loot is in hand, but before it goes into a layout it's worth checking four things:

1. **Vector or wrapper.** Open the SVG in a text editor: a real vector consists of `<path>` and shapes; a single `<image>` tag gives away a raster masquerading as SVG.
2. **Currency.** Brands go through redesigns, while footers, old landing pages and subdomains keep previous versions of the mark alive for years. Compare the file against the brand's homepage or recent social accounts.
3. **Completeness.** The header often carries a trimmed variant — the mark alone, without text. A deck usually needs the full logo, and that lives in the press kit.
4. **Canvas and padding.** An SVG pulled out of markup often carries a generous viewBox: the mark sits in the corner of a large transparent rectangle and aligns crookedly in a layout. Open the file in [Figma](../../logos/design/figma/) — if the selection box is visibly larger than the shape, crop the canvas to the content.

## Which path fits which task

| Task | Best path |
| --- | --- |
| One well-known brand for a slide | catalog: SVG in 10 seconds |
| A "trusted by" grid of 10 logos | catalog: consistent quality and style |
| A little-known local company's logo | DevTools on their site |
| A logo for high-quality print | press kit (vector plus the rules) |
| A logo out of a PDF deck | open the PDF in [Illustrator](../../logos/design/illustrator/)/Inkscape and extract the vector |
| An old logo that's no longer on the site | web archive (web.archive.org) + DevTools |

That last row saves the day more often than you'd think: the Wayback Machine keeps old site versions along with their logo files, and it's the only way to retrieve a historical mark after a rebrand. Check the inner pages in the archive too: snapshots of press sections are saved along with their files, and the older logo version usually turns up there.

## Is any of this legal

Downloading breaks no law — the questions concern how you use the file. The general principle: showing a logo to point at the brand itself (in an article, a deck, a list of integrations, payment methods) is fine; passing it off as your own, implying a partnership that doesn't exist, or printing it on merchandise you sell is not. A detailed breakdown with case law and a situation table is in [can you use someone else's logo](../mozhno-li-ispolzovat-chuzhoy-logotip/).

:::warning Leave the mark undistorted
Wherever you place someone else's logo, keep its proportions, colors and boundaries intact: a stretched or recolored mark violates the brand guideline and looks unprofessional. Distortion rules are covered in the article [on brand books](../chto-takoe-brendbuk/).
:::

## In short

The screenshot comes last because a vector almost always already exists: the site loaded it to show you, and the brand often published an official copy separately. So the order of operations runs opposite to instinct — catalog or press kit first, then DevTools, and only then raster compromises. Check the file you get for authenticity, currency and completeness, and place it in your layout undistorted.

Save yourself the DevTools: in our [logo catalog](../../logos/) any major brand's mark downloads as SVG and PNG in one click — or copies as code straight into [Figma](../../logos/design/figma/).
