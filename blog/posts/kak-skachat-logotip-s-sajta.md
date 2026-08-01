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

Нужен логотип банка для презентации, иконка сервиса для схемы интеграций, знак партнёра для слайда «нам доверяют». Первое движение — скриншот с сайта. И это худший из возможных вариантов: мыльный растр с куском фона, который стыдно ставить в макет. Между тем на любом сайте логотип уже лежит в отличном качестве — надо только знать, как его забрать.

:::note Коротко
Порядок действий от лучшего к худшему: **каталог логотипов** (SVG в один клик) → **пресс‑кит бренда** (официальные файлы) → **вытащить SVG через DevTools** (30 секунд) → **правый клик → сохранить картинку** → и только если всё провалилось — скриншот. Про право использовать чужой логотип — в конце, спойлер: для большинства бытовых задач можно.
:::

## Способ 1. Правый клик — иногда этого достаточно

Правый клик по логотипу → «Сохранить изображение как…» или «Открыть изображение в новой вкладке». Если логотип вставлен обычным тегом `<img>`, вы получите исходный файл — часто это SVG, и тогда задача решена идеально.

Когда не работает: логотип вставлен инлайн‑кодом, фоном через CSS или прикрыт другим элементом. Пункта «сохранить изображение» в меню просто не будет. Тогда — способ 2.

## Способ 2. DevTools — достаём что угодно за 30 секунд

Работает в [Chrome](../../logos/search/chrome/), Яндекс Браузере, [Firefox](../../logos/search/firefox/) — везде одинаково:

1. Правый клик по логотипу → **«Просмотреть код»** (Inspect).
2. В открывшейся панели вы окажетесь рядом с элементом логотипа. Варианты:
   - **`<img src="...">`** — откройте ссылку из src в новой вкладке и сохраните файл.
   - **`<svg>...</svg>`** — логотип вставлен инлайн. Правый клик по тегу в панели → Copy → Copy element — SVG‑код у вас в буфере. Вставьте его в файл с расширением.svg или прямо в [Figma](../../logos/design/figma/) (Ctrl+V — [Figma](../../logos/design/figma/) понимает SVG‑код из буфера).
   - **`background-image: url(...)`** в стилях — откройте URL из CSS и сохраните.
3. Проверьте добычу: настоящий SVG состоит из `<path>` и фигур, а не одного тега `<image>` с растром внутри.

:::tip Ищите логотип в футере и на странице «О компании»
В шапке сайта часто лежит упрощённая или анимированная версия. В футере, пресс‑разделе и на внутренних страницах нередко находится более полная версия логотипа — а то и ссылка на официальный архив со всеми файлами.
:::

## Способ 3. Пресс‑кит бренда — официальный путь

У большинства средних и крупных компаний есть раздел «Пресс‑центр», «Медиа», «Brand assets» — с логотипами в SVG/PNG, фирменными цветами и правилами использования. Это самый правильный источник: файлы гарантированно актуальные и официальные, а правила использования написаны прямо рядом. Ищите ссылку в футере сайта или запросом «название бренда логотип пресс‑кит» / «brand assets».

## Способ 4. Каталоги логотипов — когда нужно быстро и много

Когда логотипов нужно несколько (список банков, сетка партнёров, схема сервисов), ходить по пяти сайтам с DevTools утомительно. Каталоги решают это одним местом: официальные версии, единое качество, сразу в SVG и PNG.

Наш [каталог логотипов](../../logos/) заточен ровно под это: сотни российских и мировых брендов, у каждого — SVG, PNG нужного размера, копирование кода в один клик и даже перекраска прямо на странице. Для сеток «способы оплаты» и «нам доверяют» — самый короткий путь.

## Способ 5. Скриншот — крайняя мера

Если логотип запечён в растровую картинку вместе с фоном (например, в обложке видео), остаётся скриншот с последующей обработкой: кадрирование, удаление фона. Качество будет равно размеру на экране — то есть посредственное. Прежде чем смириться, проверьте способы 3 и 4: почти для любого бренда где‑то лежит нормальный файл.

## А это вообще законно?

Скачивание логотипа — не нарушение: нарушением может быть **способ использования**. Общий принцип: показывать логотип, чтобы указать на сам бренд (в статье, презентации, списке интеграций, способах оплаты), — можно; выдавать за свой, намекать на несуществующее партнёрство или лепить на продаваемый товар — нельзя. Подробный разбор с судебной практикой и таблицей ситуаций — в нашей статье [можно ли использовать чужой логотип](../mozhno-li-ispolzovat-chuzhoy-logotip/).

:::warning Один нюанс качества использования
Куда бы вы ни поставили чужой логотип — не искажайте его: не растягивайте, не перекрашивайте в свои цвета, не обрезайте. Это и юридически чище, и профессиональнее выглядит. Правила искажений мы разбирали в статье [про брендбуки](../chto-takoe-brendbuk/).
:::

## Продвинутый уровень DevTools: три приёма для сложных случаев

Когда простой Inspect не находит логотип, помогают приёмы поглубже:

- **Вкладка Network.** Откройте DevTools → Network → фильтр Img, обновите страницу. В списке — все картинки, которые скачал сайт, включая те, что спрятаны в CSS и скриптах. Отсортируйте по имени — логотип обычно называется logo‑что‑нибудь. Двойной клик открывает файл для сохранения.
- **Поиск по исходнику.** DevTools → Ctrl+Shift+F (поиск по всем файлам) → введите «logo» или «.svg». Находит пути к логотипам, зашитые в JS‑бандлы и JSON‑конфиги, куда Inspect не заглядывает.
- **Псевдоэлементы и шрифты‑иконки.** Если логотип нарисован через::before с иконочным шрифтом, картинки‑файла не существует вовсе. Смотрите Computed → content и font‑family: скачивать нужно будет шрифт или искать растровую/векторную альтернативу в пресс‑ките.

И общий совет: мобильная версия сайта иногда отдаёт другой, более простой файл логотипа — переключите эмуляцию устройства в DevTools и проверьте.

## Как проверить качество скачанного файла

Добыча в руках — теперь три быстрых теста перед использованием:

1. **Вектор или обёртка?** Откройте SVG текстовым редактором: настоящий вектор состоит из `<path>` и фигур; один тег `<image>` — это растр, замаскированный под SVG.
2. **Актуальная ли версия?** У брендов случаются редизайны, а на сайтах — в футерах, старых лендингах, поддоменах — годами живут прошлые версии знака. Сверьте добычу с главной страницей бренда или его свежими соцсетями.
3. **Полная ли версия?** В шапке сайта часто урезанный вариант (только знак без текста, или упрощённая версия для малых размеров). Для презентаций обычно нужен полный логотип — ищите его в пресс‑ките.

## Типовые задачи и лучший путь для каждой

| Задача | Оптимальный путь |
| --- | --- |
| Один известный бренд для слайда | каталог: SVG за 10 секунд |
| Сетка «нам доверяют» из 10 логотипов | каталог: единое качество и стиль |
| Логотип малоизвестной локальной компании | DevTools по их сайту |
| Логотип для печати в высоком качестве | пресс‑кит (там вектор и правила) |
| Логотип из PDF‑презентации | открыть PDF в [Illustrator](../../logos/design/illustrator/)/Inkscape и извлечь вектор |
| Старый логотип, которого нет на сайте | веб‑архив (web.archive.org) + DevTools |

Последняя строка — недооценённый приём: Wayback Machine хранит старые версии сайтов вместе с файлами логотипов, и это спасение, когда нужен именно исторический вариант знака.

## Коротко

Скриншот — последнее средство, а не первое. Сначала каталог или пресс‑кит (официальный SVG за секунды), затем DevTools (вытащит логотип с любого сайта), и только потом растровые компромиссы. Добытый вектор ставьте в макет неискажённым — и всё будет и красиво, и законно.

Сэкономьте себе DevTools: в нашем [каталоге логотипов](../../logos/) логотип любого крупного бренда скачивается в SVG и PNG за один клик — или копируется кодом сразу в [Figma](../../logos/design/figma/).

---EN---

You need a bank's logo for a deck, a service icon for an integration diagram, a partner's mark for the "trusted by" slide. The first instinct is a screenshot. It's the worst possible option: a blurry raster with a chunk of background you'll be embarrassed to place in a mockup. Meanwhile, the logo already exists on that site in excellent quality — you just need to know how to take it.

:::note TL;DR
From best to worst: **a logo catalog** (SVG in one click) → **the brand's press kit** (official files) → **extracting the SVG via DevTools** (30 seconds) → **right click → save image** → and only if everything failed, a screenshot. The legal side is at the end; spoiler: for most everyday uses, you're fine.
:::

## Method 1. Right click — sometimes enough

Right click the logo → "Save image as…" or "Open image in new tab". If the logo is a plain `<img>`, you get the source file — often an SVG, which solves the task perfectly.

When it fails: the logo is inlined as code, set as a CSS background, or covered by another element. The menu simply won't offer saving. Then — method 2.

## Method 2. DevTools — extract anything in 30 seconds

Works identically in [Chrome](../../logos/search/chrome/) and [Firefox](../../logos/search/firefox/):

1. Right click the logo → **Inspect**.
2. The panel lands near the logo's element. The cases:
   - **`<img src="...">`** — open the src URL in a new tab and save.
   - **`<svg>...</svg>`** — inlined logo. Right click the tag in the panel → Copy → Copy element — the SVG code is in your clipboard. Paste into a file with an .svg extension, or straight into [Figma](../../logos/design/figma/) (Ctrl+V — [Figma](../../logos/design/figma/) parses SVG from the clipboard).
   - **`background-image: url(...)`** in the styles — open the URL and save.
3. Inspect the loot: a real SVG consists of `<path>` shapes, not a single `<image>` tag wrapping a bitmap.

:::tip Check the footer and the About page
Headers often carry a simplified or animated version. Footers, press sections and inner pages frequently hold a fuller version — or a link to the official asset archive.
:::

## Method 3. The brand's press kit — the official path

Most mid-size and large companies keep a "Press", "Media" or "Brand assets" section with SVG/PNG logos, brand colors and usage rules. It's the most correct source: guaranteed-current official files with the rules printed right next to them. Look for a footer link or search "brand name brand assets".

## Method 4. Logo catalogs — when you need many, fast

When you need several logos (a bank list, a partner grid, a services diagram), visiting five sites with DevTools gets tedious. Catalogs solve it in one place: official versions, consistent quality, SVG and PNG together.

Our [logo catalog](../../logos/) is built for exactly this: hundreds of Russian and global brands, each with SVG, sized PNGs, one-click code copy and even on-page recoloring. For "payment methods" and "trusted by" grids — the shortest route there is.

## Method 5. The screenshot — last resort

If the logo is baked into a raster image along with a background (a video thumbnail, say), a screenshot plus cleanup remains: crop, background removal. Quality equals on-screen size — i.e., mediocre. Before settling, try methods 3 and 4: a proper file exists somewhere for almost any brand.

## Is this even legal?

Downloading a logo isn't infringement — the **manner of use** can be. The principle: showing a logo to refer to the brand itself (in an article, a deck, an integration list, payment methods) is fine; passing it off as yours, implying a partnership that doesn't exist, or putting it on merchandise you sell is not. The full breakdown with case law and a situation table is in [can you use someone else's logo](../mozhno-li-ispolzovat-chuzhoy-logotip/).

:::warning One quality caveat
Wherever you place someone's logo — don't distort it: no stretching, no recoloring into your palette, no cropping. That's both legally cleaner and more professional. The distortion rules are covered in [the brand book article](../chto-takoe-brendbuk/).
:::

## Advanced DevTools: three techniques for hard cases

When plain Inspect can't find the logo, dig deeper:

- **The Network tab.** DevTools → Network → filter Img, reload. The list shows every image the site fetched, including ones hidden in CSS and scripts. Sort by name — logos are usually called logo-something. Double-click opens the file for saving.
- **Source-wide search.** DevTools → Ctrl+Shift+F → search "logo" or ".svg". Finds logo paths baked into JS bundles and JSON configs where Inspect never looks.
- **Pseudo-elements and icon fonts.** If the logo is drawn via ::before with an icon font, no image file exists at all. Check Computed → content and font-family: you'll need the font itself or a proper file from the press kit.

General tip: mobile versions sometimes serve a different, simpler logo file — toggle device emulation in DevTools and check.

## Verifying the quality of what you grabbed

Three quick tests before use:

1. **Vector or wrapper?** Open the SVG in a text editor: a real vector consists of `<path>` shapes; a single `<image>` tag is raster masquerading as SVG.
2. **Is the version current?** Brands redesign, and old versions of marks live for years in footers, stale landing pages and subdomains. Compare your find against the brand's homepage or fresh social profiles.
3. **Is it the full version?** Headers often carry a truncated variant (mark only, or a small-size simplification). Decks usually need the full logo — the press kit has it.

## Typical tasks and the best route for each

| Task | Optimal route |
| --- | --- |
| One known brand for a slide | catalog: SVG in 10 seconds |
| A "trusted by" grid of 10 logos | catalog: uniform quality and style |
| A little-known local company's logo | DevTools on their site |
| A logo for high-quality print | press kit (vector + rules live there) |
| A logo out of a PDF deck | open the PDF in [Illustrator](../../logos/design/illustrator/)/Inkscape and extract the vector |
| An old logo no longer on the site | web.archive.org + DevTools |

The last row is the underrated trick: the Wayback Machine stores old site versions together with their logo files — a lifesaver when you need a historical variant of a mark.

## In short

The screenshot is the last resort, not the first. Catalog or press kit first (official SVG in seconds), DevTools second (extracts a logo from any site), raster compromises last. Place the vector undistorted — and it'll be both pretty and legal.

Save yourself the DevTools trip: in our [logo catalog](../../logos/) any major brand's logo downloads as SVG or PNG in one click — or copies as code straight into [Figma](../../logos/design/figma/).
