---
title: Как перевести логотип в вектор — трассировка, отрисовка и когда что выбрать
title_en: How to Vectorize a Logo — Tracing, Redrawing and When to Use Which
description: Есть только PNG или JPG логотипа, а нужен вектор? Разбираем автотрассировку в Inkscape и онлайн, ручную отрисовку в Figma и честные критерии выбора способа.
description_en: Only have a PNG or JPG of your logo but need a vector? Auto-tracing in Inkscape and online, manual redrawing in Figma, and honest criteria for choosing.
date: 2026-06-17
slug: kak-perevesti-logotip-v-vektor
tags: Вектор, Логотипы, Инструкции
tags_en: Vector, Logos, How-to
---

Типография просит «логотип в кривых», конструктор сайтов в SVG, а у вас от логотипа остался один PNG с сайта десятилетней давности. Исходники потерялись вместе с дизайнером. Ситуация настолько частая, что «отрисовка логотипа в вектор» отдельная услуга на фрилансе. Разберём, когда её можно сделать самому за десять минут, когда за вечер, а когда честнее заплатить.

:::note Коротко
Есть два пути. **Автотрассировка** (Inkscape, онлайн-сервисы): быстро, но прилично работает только на простых одноцветных знаках с чёткими краями. **Ручная отрисовка** ([Figma](../../logos/design/figma/), [Illustrator](../../logos/design/illustrator/)): дольше, но результат настоящий чистый вектор. Правило выбора: одноцветный знак без мелких деталей — пробуйте трассировку; градиенты, текст, мелочи — только отрисовка.
:::

## Сначала: а точно ли вектора нет?

Прежде чем восстанавливать логотип из растра, потратьте десять минут на поиски оригинала. Он существует чаще, чем кажется:

- **Почта и архивы.** Письма от дизайнера или студии, старые облака, папки «Логотип final». Ищите файлы .ai, .eps, .svg, .pdf.
- **Подрядчики.** Типография, которая печатала визитки, или агентство, делавшее сайт. У них в архивах часто лежит вектор.
- **Сайт компании.** Логотип в шапке может быть SVG, как проверить и вытащить, мы показывали в статье: [«Как скачать логотип с сайта»](../kak-skachat-logotip-s-sajta/).
- **Известный бренд?** Тогда вектор точно есть в каталогах. В нашем [каталоге логотипов](../../logos/) сотни брендов в SVG.

Найденный оригинал всегда лучше любой реконструкции.

## Путь 1. Автотрассировка за 10 минут

Трассировка — это алгоритм, который обводит границы пикселей кривыми. Лучший бесплатный инструмент — **Inkscape**:

1. Откройте PNG в Inkscape (File → Open).
2. Выделите картинку → Path → **Trace Bitmap**.
3. Для одноцветного логотипа выберите режим Single scan (Brightness cutoff), для цветного — Multicolor с количеством цветов по числу цветов в логотипе.
4. Подвигайте порог (Threshold), глядя на предпросмотр. Цель — чёткие края без рваных дыр.
5. Apply → уберите исходный растр → File → Save As → SVG.

После трассировки почти всегда нужна доводка: Path → Simplify (Ctrl+L) уберёт лишние узлы, которых алгоритм наставил на каждом пикселе, иначе файл будет весить сотни килобайт (почему это важно — в статье [про оптимизацию SVG](../kak-optimizirovat-svg/)).

**Онлайн-альтернативы** (vectorizer-сервисы) делают то же самое без установки, но с ограничениями бесплатных тарифов и без тонких настроек.

:::warning Когда трассировка провалится
- **Маленький или сжатый исходник.** Из PNG 200×200 или JPG с артефактами алгоритм обведёт не логотип, а его искажения. Минимум для вменяемого результата 500–1000 px по длинной стороне.
- **Градиенты.** Трассировка разобьёт плавный переход на десятки «ступенек»-фигур.
- **Мелкий текст.** Буквы превратятся в кривые кляксы. Текст всегда перенабирается шрифтом.
- **Фотографические элементы.** Не векторизуются осмысленно в принципе.
:::

## Путь 2. Ручная отрисовка за вечер

Честная реконструкция: растровый логотип кладётся на фон, и поверх него заново строятся фигуры. В [Figma](../../logos/design/figma/) процесс такой:

1. Вставьте PNG и заблокируйте слой, снизив непрозрачность до 30–50%.
2. Стройте поверх из геометрических примитивов: круги, прямоугольники, булевы операции (Union, Subtract). Пером (P) — только то, что не собирается из геометрии.
3. Текстовую часть **не обводите** — определите шрифт (сервисы распознавания шрифта по картинке в помощь: WhatTheFont, FontSquirrel Matcherator) и наберите заново. Если шрифт платный и покупать не хочется — подберите близкий бесплатный.
4. Цвета снимите пипеткой с крупных заливок исходника, а лучше найдите точные фирменные коды — [как их искать](../kak-uznat-cvet-logotipa/), мы рассказывали в отдельной статье.
5. Сверьте силуэты: наложите свой вектор на исходник и переключайте видимость. Расхождения виднее всего по краям и в изгибах.
6. Экспортируйте SVG и соберите полный комплект файлов по [гиду по форматам](../v-kakom-formate-nuzhen-logotip/).

Звучит долго, но для логотипа средней сложности это 1–3 часа даже без опыта. Бонус: в процессе вы получите идеально чистый файл, лучше многих «оригиналов».

## Путь 3. Заказать отрисовку

Услуга «отрисовка в вектор» на фриланс-биржах стоит недорого и делается за 1–2 дня. Заказывайте, если логотип сложный (градиенты, иллюстрация, леттеринг), а времени нет. Проверяйте результат: в файле должны быть кривые (`<path>`), а не вставленный растр, текст в кривых или с приложенным шрифтом, цвета точными кодами.

## Сравнение путей

| | Трассировка | Отрисовка самому | Заказ |
| --- | --- | --- | --- |
| Время | 10–30 мин | 1–3 часа | 1–2 дня |
| Цена | бесплатно | бесплатно | недорого |
| Простой знак | ✅ отлично | ✅ отлично | ✅ |
| Градиенты, мелочи | ⛔ плохо | ⚠️ терпение | ✅ |
| Текст | ⛔ кляксы | ✅ перенабор | ✅ |
| Чистота файла | ⚠️ нужна доводка | ✅ идеальная | ✅ проверять |

## Частые вопросы

**Онлайн-конвертер «PNG в SVG» — это то же самое?** Да, внутри та же трассировка, только без настроек. А некоторые сервисы просто заворачивают растр в SVG-обёртку — файл меняет расширение, но вектором не становится. Проверка: откройте результат текстовым редактором, внутри должны быть `<path>`, а не `<image>`.

**Нейросети умеют векторизовать?** Появляются модели, генерирующие SVG по картинке, — на простых знаках результат уже приличный, на сложных пока хуже аккуратной ручной работы. Проверяйте те же критерии: чистые кривые, разумное число узлов.

**Логотип чужой. Можно ли его отрисовывать?** Для использования по назначению (показать бренд в презентации, поставить иконку банка в список) — да, но отрисовка должна быть точной, без искажений. Подробно о правовой стороне в статье [можно ли использовать чужой логотип](../mozhno-li-ispolzovat-chuzhoy-logotip/).

**Сколько узлов должно быть в хорошем векторе?** Ориентир: простой знак, десятки узлов, не сотни. Откройте результат в Inkscape и нажмите N (редактор узлов): если кривая усыпана точками, как бусами — файл после трассировки не доведён. Плавная дуга описывается 2–4 узлами.

**Как отрисовать градиент?** Снимите пипеткой оба крайних цвета исходника и постройте градиент заново инструментом редактора. Не пытайтесь «повторить пикселями». В SVG градиент — это математический объект `<linearGradient>` с точными стопами, он чище любой трассировки.

## Подготовка исходника: половина успеха трассировки

Прежде чем скармливать PNG алгоритму, потратьте пять минут на подготовку. Качество результата вырастет заметно:

1. **Найдите самую большую версию.** Поиск по картинке (Яндекс/Google) по вашему PNG часто находит копии выше разрешением. Также проверьте веб-архив сайта бренда.
2. **Увеличьте контраст.** В любом редакторе поднимите контраст и уберите полутона у краёв — алгоритму проще искать границы.
3. **Очистите фон.** Пятна, водяные знаки и текстуры фона превратятся в лишние фигуры. Замажьте их белым до трассировки.
4. **Обрежьте лишнее.** Трассируйте только логотип, а не всю страницу каталога, где он напечатан.
5. **Для JPG — уберите артефакты.** Лёгкое размытие (Gaussian Blur 0,5–1 px) парадоксально улучшает трассировку JPG: алгоритм перестаёт обводить квадратики сжатия.

## После векторизации: доводка до товарного вида

Получить кривые — не финал. Чек-лист доводки:

- **Simplify** (Ctrl+L в Inkscape) — убрать лишние узлы, поставленные на каждом пикселе.
- **Выровнять геометрию.** Почти-круглые элементы замените честными кругами, почти-прямые — прямыми: трассировка не знает, что дуга задумывалась идеальной, а вы знаете.
- **Замкнуть контуры и убрать мусор.** Приблизьте на 800% — найдёте микрофигуры-«пылинки» и разрывы контуров.
- **Назначить точные цвета.** Не цвета «как получились» после трассировки, а фирменные HEX из гайдлайна или исходного SVG (как их узнать — в [статье про цвет](../kak-uznat-cvet-logotipa/)).
- **Прогнать через оптимизатор** — финальный файл станет в разы легче по [нашей инструкции по SVGO](../kak-optimizirovat-svg/).
- **Сравнить с оригиналом наложением** — последняя проверка перед сдачей.

## Векторизация нейросетями: состояние на 2026 год

Отдельного упоминания заслуживают ИИ-векторизаторы — за пару лет они выросли из игрушки в рабочий инструмент для части задач. Модели, генерирующие SVG по растру, уже прилично справляются с плоскими знаками средней сложности: меньше «бусин» на кривых, чем у классической трассировки, осмысленные формы вместо слепой обводки пикселей. Слабые места прежние: текст (перенабирайте шрифтом всегда), тонкие декоративные детали и градиентные переходы. Практический режим: пробуйте ИИ-вариант параллельно с Inkscape — и выбирайте лучший из двух как заготовку для ручной доводки. Этап доводки не отменяет ни один инструмент: чек-лист выше одинаков для всех путей.

## Коротко

Сначала ищите оригинальный вектор — он есть чаще, чем кажется. Не нашли: одноцветный простой знак — Inkscape Trace Bitmap плюс Simplify; всё остальное — ручная отрисовка поверх полупрозрачного исходника с перенабором текста. И в любом случае финальный файл — чистый SVG с точными фирменными цветами.

Для известных брендов пропустите весь этот процесс: в нашем [каталоге логотипов](../../logos/) уже лежат официальные векторы — скачивайте SVG и живите спокойно.

---EN---

The print shop wants "the logo in curves", the site builder wants SVG — and all you have is a PNG from a ten-year-old website. The source files vanished along with the designer. The situation is so common that "logo vectorization" is a standalone freelance service. Let's sort out when you can do it yourself in ten minutes, when it takes an evening, and when paying is the honest choice.

:::note TL;DR
Two paths. **Auto-tracing** (Inkscape, online tools): fast, but decent only on simple one-color marks with clean edges. **Manual redrawing** ([Figma](../../logos/design/figma/), [Illustrator](../../logos/design/illustrator/)): slower, but produces genuinely clean vectors. The rule: one-color mark without fine detail — try tracing; gradients, text, small details — redraw only.
:::

## First: are you sure the vector doesn't exist?

Before reconstructing from raster, spend ten minutes hunting the original — it exists more often than you'd think:

- **Email and archives.** Messages from the designer or studio, old cloud folders. Look for .ai, .eps, .svg, .pdf.
- **Vendors.** The print shop that made your business cards or the agency that built the site often keeps the vector.
- **Your own website.** The header logo may be an SVG — how to check and extract it: [how to download a logo from a site](../kak-skachat-logotip-s-sajta/).
- **A known brand?** Then the vector definitely exists in catalogs — ours has hundreds of brands in [SVG](../../logos/).

A found original always beats any reconstruction.

## Path 1. Auto-tracing — 10 minutes

Tracing is an algorithm that outlines pixel boundaries with curves. The best free tool is **Inkscape**:

1. Open the PNG (File → Open).
2. Select the image → Path → **Trace Bitmap**.
3. One-color logo — Single scan (Brightness cutoff); multi-color — Multicolor with the color count matching the logo.
4. Adjust the Threshold while watching the preview: the goal is clean edges without ragged holes.
5. Apply → delete the source bitmap → Save As → SVG.

Post-processing is almost always needed: Path → Simplify (Ctrl+L) removes the excess nodes the algorithm placed on every pixel — otherwise the file weighs hundreds of KB (why that matters: [SVG optimization](../kak-optimizirovat-svg/)).

**Online alternatives** (vectorizer services) do the same without installing anything, minus fine controls and plus free-tier limits.

:::warning When tracing will fail
- **A small or compressed source.** From a 200×200 PNG or an artifact-ridden JPG the algorithm traces the distortions, not the logo. Minimum for sane results: 500–1000 px on the long side.
- **Gradients.** Tracing shatters smooth transitions into dozens of stepped shapes.
- **Small text.** Letters become blobby curves — text is always re-typeset, never traced.
- **Photographic elements.** Not meaningfully vectorizable at all.
:::

## Path 2. Manual redrawing — an evening

The honest reconstruction: the raster goes underneath, and shapes are rebuilt on top. In [Figma](../../logos/design/figma/):

1. Insert the PNG, lock the layer, drop opacity to 30–50%.
2. Build on top from geometric primitives: circles, rectangles, boolean ops (Union, Subtract). The pen tool (P) only for what geometry can't assemble.
3. **Don't trace the text** — identify the font (WhatTheFont, FontSquirrel Matcherator help) and re-typeset it. If the font is paid, pick a close free one.
4. Sample colors from large solid fills — or better, find the exact brand codes; [we cover how](../kak-uznat-cvet-logotipa/) in a separate guide.
5. Verify silhouettes: overlay your vector on the source and toggle visibility. Deviations show at edges and curves.
6. Export SVG — then assemble the full file kit per [the format guide](../v-kakom-formate-nuzhen-logotip/).

Sounds long, but a mid-complexity logo takes 1–3 hours even without experience. Bonus: you end up with a perfectly clean file — better than many "originals".

## Path 3. Ordering it

"Vectorization" on freelance marketplaces is cheap and takes 1–2 days. Order it when the logo is complex (gradients, illustration, lettering) and time is short. Check the delivery: curves (`<path>`) rather than an embedded bitmap, text outlined or the font attached, colors as exact codes.

## Comparing the paths

| | Tracing | DIY redraw | Ordering |
| --- | --- | --- | --- |
| Time | 10–30 min | 1–3 hours | 1–2 days |
| Price | free | free | cheap |
| Simple mark | ✅ great | ✅ great | ✅ |
| Gradients, detail | ⛔ poor | ⚠️ patience | ✅ |
| Text | ⛔ blobs | ✅ re-typeset | ✅ |
| File cleanliness | ⚠️ needs cleanup | ✅ perfect | ✅ verify |

## FAQ

**Is an online "PNG to SVG converter" the same thing?** Yes — the same tracing, minus settings. And some services just wrap the raster in an SVG shell: the extension changes, the pixels don't. Check: open the result in a text editor; you should see `<path>`, not `<image>`.

**Can AI vectorize?** Models that generate SVG from images are emerging — already decent on simple marks, still behind careful manual work on complex ones. Apply the same checks: clean curves, sane node counts.

**The logo isn't mine — may I redraw it?** For legitimate referential use (showing the brand in a deck, a bank icon in a list) — yes, but the redraw must be exact, with no distortion. The legal side in detail: [can you use someone else's logo](../mozhno-li-ispolzovat-chuzhoy-logotip/).

**How many nodes should a good vector have?** Benchmark: a simple mark — dozens, not hundreds. Open the result in Inkscape and press N (node editor): a curve beaded with points means unfinished tracing. A smooth arc takes 2–4 nodes.

**How do I redraw a gradient?** Eyedrop both end colors from the source and rebuild the gradient with the editor's tool — don't "repeat it in pixels". In SVG a gradient is a mathematical `<linearGradient>` with exact stops, cleaner than any trace.

## Preparing the source: half of tracing's success

Before feeding the PNG to the algorithm, spend five minutes on prep — the quality jump is real:

1. **Find the largest version.** Reverse image search often surfaces higher-res copies. Also check the brand site's web archive.
2. **Boost contrast.** Raise contrast and kill halftones at the edges — boundaries get easier to find.
3. **Clean the background.** Stains, watermarks and textures become extra shapes. Paint them white before tracing.
4. **Crop.** Trace the logo, not the whole catalog page it was printed on.
5. **For JPG — soften the artifacts.** A slight blur (Gaussian 0.5–1 px) paradoxically improves JPG tracing: the algorithm stops outlining compression blocks.

## After vectorization: finishing to professional grade

Getting curves isn't the finish line. The polish checklist:

- **Simplify** (Ctrl+L in Inkscape) — remove per-pixel nodes.
- **True up the geometry.** Replace almost-circles with real circles, almost-straights with straights: the tracer doesn't know the arc was meant to be perfect — you do.
- **Close contours, sweep the dust.** [Zoom](../../logos/videocall/zoom/) to 800% — you'll find micro-shapes and contour gaps.
- **Assign exact colors.** Not "whatever the trace produced" but the brand HEX from guidelines or the source SVG — [how to find it](../kak-uznat-cvet-logotipa/) is a separate guide.
- **Run the optimizer** — the final file gets several times lighter with [our SVGO guide](../kak-optimizirovat-svg/).
- **Overlay-compare with the original** — the last check before delivery.

## AI vectorization: the state of 2026

AI vectorizers deserve their own note — in a couple of years they've grown from a toy into a working tool for part of the job. Models generating SVG from raster already handle flat marks of medium complexity decently: fewer "beads" on curves than classical tracing, meaningful shapes instead of blind pixel-outlining. The weak spots remain: text (always re-typeset), fine decorative detail and gradient transitions. The practical mode: run the AI variant alongside Inkscape — and pick the better of the two as the base for manual finishing. No tool cancels the finishing stage: the checklist above is identical for every path.

## In short

Hunt for the original vector first — it exists more often than you think. Not found: a simple one-color mark — Inkscape Trace Bitmap plus Simplify; everything else — a manual redraw over a translucent source with re-typeset text. Either way, the final file is a clean SVG with exact brand colors.

For known brands, skip the whole process: our [logo catalog](../../logos/) already holds the official vectors — download the SVG and move on.
