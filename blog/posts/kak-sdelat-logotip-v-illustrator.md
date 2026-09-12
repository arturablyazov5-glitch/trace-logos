---
title: Как сделать логотип в Illustrator — пошаговый гайд
title_en: How to Make a Logo in Adobe Illustrator — Step by Step
description: Рисуем логотип в Adobe Illustrator: настройка документа, фигуры и Pathfinder, сетки и направляющие, текст в кривые, экспорт в SVG, PDF и PNG
description_en: Designing a logo in Adobe Illustrator: document setup, shapes and Pathfinder, grids and guides, outlining text, exporting SVG, PDF and PNG
date: 2026-08-10
slug: kak-sdelat-logotip-v-illustrator
tags: Инструкции, Инструменты, Дизайн
tags_en: How-To, Tools, Design
---

Adobe [Illustrator](../../logos/design/illustrator/) — профессиональный стандарт логотип‑дизайна: практически каждый знак из нашего [каталога](../../logos/) прошёл через него или его аналоги. Для новичка программа выглядит пугающе — сотни инструментов, из которых для логотипа нужны от силы десять. Разбираем весь маршрут: от нового документа до комплекта файлов, который примут и типография, и разработчик.

:::note Коротко
Маршрут: документ RGB для экрана (CMYK‑версия — потом) → знак собирается из **фигур и Pathfinder**, а не рисуется пером → сетка и направляющие для выравнивания → текст → **Create Outlines** перед экспортом → Export для SVG/PNG, Save As для PDF. Если Illustrator недоступен, тот же процесс работает в бесплатных Inkscape и [Figma](../kak-narisovat-logotip-v-figma/).
:::

## Чем Illustrator отличается от Figma для этой задачи

Оба — векторные редакторы, и для простого знака хватит любого, о чём мы писали в [нашем гайде по Figma](../kak-narisovat-logotip-v-figma/). Illustrator выигрывает там, где нужна точность и печать: полноценный CMYK и Pantone — [подробно зачем](../logotip-dlya-pechati/) — тонкие булевы операции Pathfinder, инструменты для сложной пластики (Width Tool, скругления отдельных углов), экспорт в EPS для консервативных подрядчиков, которым нужен свой формат под свою задачу. Плата — цена подписки и порог входа.

## Шаг 1. Документ

Создайте документ **1000×1000 px, RGB** — для проектирования удобнее экранный режим; CMYK‑версию для печати вы сделаете конвертацией в конце. Сразу добавьте ещё две монтажные области (Artboard): 48×48 и 16×16 — контрольные, для проверки знака в размере иконки и [фавиконки](../kak-sdelat-favicon/). Включите Smart Guides (`⌘U`) — «умные» направляющие, без которых выравнивание превращается в мучение.

## Шаг 2. Знак: фигуры + Pathfinder

Главное правило то же, что и везде: аккуратные логотипы **собираются из простых фигур**, а не рисуются от руки. Инструменты:

1. **Фигуры**: Ellipse (`L`), Rectangle (`M`), Polygon. Зажимайте Shift для правильных пропорций.
2. **Pathfinder** (Window → Pathfinder) — сердце процесса: Unite склеивает фигуры, Minus Front вычитает верхнюю из нижней, Intersect оставляет пересечение. Полумесяц = круг минус круг; листок = пересечение двух кругов.
3. **Скругления**: потяните за круглые маркеры у углов (Live Corners) — радиус каждого угла настраивается отдельно, чего нет во многих редакторах.
4. **Перо** (`P`) — только для форм, которые не собрать из фигур. Правило: минимум опорных точек; каждая лишняя точка — потенциальная кривизна.
5. **Направляющие из фигур**: постройте сетку из окружностей (как в [знаке ChatGPT](../istoriya-logotipa-chatgpt/) или яблоке [Apple](../istoriya-logotipa-apple/)), выделите и превратите в направляющие (`⌘5`) — по ним выверяются дуги.

:::tip Оптические компенсации
Illustrator идеально точен математически — но глаз работает иначе: круг рядом с квадратом одинаковой высоты кажется меньше, горизонтальная линия той же толщины, что вертикальная, выглядит толще. Профессионалы правят такие вещи «на глаз» поверх геометрии — именно это отличает живой знак от машинного — хороший [пример с дугами в логотипе Spotify](../istoriya-logotipa-spotify/).
:::

## Шаг 3. Текстовая часть

Наберите название инструментом Type (`T`). Подбор гарнитуры — отдельная дисциплина с юридическими ловушками: шрифт должен иметь лицензию на коммерческое использование — [подробно про шрифты для логотипа](../shrift-dlya-logotipa/) у нас есть отдельная статья. Настройте трекинг и кернинг вручную (`Alt+стрелки` между буквами): дефолтный набор почти всегда требует правок в паре мест — классика: сочетания «ГА», «ТА», «АУ».

**Перед экспортом — Type → Create Outlines (`⇧⌘O`):** текст превращается в кривые и перестаёт зависеть от установленных шрифтов. Обязательно сохраните копию файла с живым текстом — из кривых обратно в текст пути нет.

## Шаг 4. Цвет и версии

Задайте цвета и сохраните их в Swatches как глобальные (галочка Global) — тогда смена оттенка обновит все объекты разом. Палитру собирайте по методике из статьи [как подобрать цветовую палитру бренда](../kak-podobrat-cvetovuyu-palitru-brenda/). Сразу постройте обязательный комплект — почему он именно такой: цветная версия, чёрная, белая (проверьте на тёмной монтажной области), компактный знак без текста.

## Шаг 5. Проверки

- Скопируйте знак на контрольные области 48 и 16 px: силуэт должен выживать.
- View → **Pixel Preview**: так знак увидят экраны — тонкие линии, «мылящиеся» в пикселях, видны сразу.
- Переведите копию в оттенки серого (Edit → Edit Colors → Convert to Grayscale): композиция обязана работать без цвета.
- Object → Path → **Clean Up**: удаляет пустые точки и объекты‑мусор, которые потом раздуют SVG.

## Шаг 6. Экспорт: три двери

| Куда | Как | Настройки |
| --- | --- | --- |
| Веб, разработчики | File → Export → Export As → **SVG** | Styling: Presentation Attributes; Decimal: 3; текст уже в кривых |
| Типография | File → Save As → **PDF** | конвертируйте цвета в CMYK ([детали](../logotip-dlya-pechati/)) |
| Соцсети, документы | Export As → **PNG** | 1x/2x/4x, галочка Transparent ([зачем прозрачность](../logotip-s-prozrachnym-fonom/)) |

Экспортированный SVG стоит прогнать через оптимизатор — Illustrator пишет в файл лишние метаданные, и мы рассказывали, [как чистить такой SVG](../kak-optimizirovat-svg/). Рабочий AI‑файл с живым текстом — в архив: это ваш мастер‑исходник, и [что вообще должно быть в комплекте](../kak-zakazat-logotip-u-dizajnera/) от дизайнера, тоже стоит держать в голове.

## Частые ошибки новичков в Illustrator

1. **Обводки не переведены в заливки.** Object → Path → Outline Stroke перед финалом: обводка при масштабировании ведёт себя иначе, чем заливка.
2. **Знак «на глазок» без сетки.** Расхождения в полпикселя незаметны в макете и очевидны на вывеске.
3. **Прозрачности и эффекты в SVG.** Тени, растровые эффекты и режимы наложения ломают SVG — знак должен состоять из чистых заливок.
4. **Один artboard на все версии.** Каждой версии — своя монтажная область: экспорт пакетом, ничего не потеряется.
5. **CMYK‑документ для экранного знака.** Цвета «тускнеют» ещё на этапе дизайна. Порядок обратный: RGB для проектирования, CMYK — конвертацией для печати.

Дальше: проверьте знак по чек‑листу ошибок, соберите [палитру](../kak-podobrat-cvetovuyu-palitru-brenda/) и мини‑гайдлайн — [что такое брендбук](../chto-takoe-brendbuk/) и зачем он нужен, мы объясняли отдельно. Бесплатные альтернативы всему описанному — Inkscape (полноценный векторный редактор) и [Figma](../kak-narisovat-logotip-v-figma/); генеративный путь — [логотип нейросетью](../logotip-nejrosetyu/) с доводкой в том же Illustrator.

---EN---

Adobe [Illustrator](../../logos/design/illustrator/) is the professional standard of logo design: virtually every mark in our [catalog](../../logos/) passed through it or its peers. To a beginner the program looks terrifying — hundreds of tools, of which a logo needs maybe ten. Here's the whole route: from a new document to a file kit both the print shop and the developer will accept.

:::note TL;DR
The route: an RGB document for screen (the CMYK version comes later) → the mark is **assembled from shapes and Pathfinder**, not drawn with the pen → grids and guides for alignment → type → **Create Outlines** before export → Export for SVG/PNG, Save As for PDF. No Illustrator? The same process works in the free Inkscape and in [Figma](../kak-narisovat-logotip-v-figma/).
:::

## How Illustrator differs from Figma for this job

Both are vector editors, and a simple mark can be built in either — see [our Figma guide](../kak-narisovat-logotip-v-figma/). Illustrator wins where precision and print matter: full CMYK and Pantone (and [here's why that matters](../logotip-dlya-pechati/)), fine-grained Pathfinder booleans, tools for complex curves (Width Tool, per-corner rounding), EPS export for conservative vendors who need the right format for the right job. The price — the subscription and the learning curve.

## Step 1. The document

Create a **1000×1000 px RGB** document — screen mode is more convenient for design; the print CMYK version is a conversion at the end. Add two more artboards right away: 48×48 and 16×16 — controls for testing the mark at icon and [favicon](../kak-sdelat-favicon/) size. Turn on Smart Guides (`⌘U`) — without them alignment is torture.

## Step 2. The mark: shapes + Pathfinder

The universal rule applies: clean logos are **assembled from simple shapes**, not drawn freehand. The tools:

1. **Shapes**: Ellipse (`L`), Rectangle (`M`), Polygon. Hold Shift for true proportions.
2. **Pathfinder** (Window → Pathfinder) — the heart of the process: Unite merges shapes, Minus Front subtracts the top one, Intersect keeps the overlap. A crescent = circle minus circle; a leaf = the intersection of two circles.
3. **Rounding**: drag the Live Corners widgets — each corner's radius adjusts separately, which many editors can't do.
4. **The Pen** (`P`) — only for forms shapes can't produce. Rule: minimum anchor points; every extra point is potential wobble.
5. **Guides from shapes**: build a grid of circles (as in the [ChatGPT mark](../istoriya-logotipa-chatgpt/) or the [Apple](../istoriya-logotipa-apple/) apple), select and convert to guides (`⌘5`) — arcs are trued against them.

:::tip Optical compensation
Illustrator is mathematically perfect — but the eye isn't: a circle next to a same-height square looks smaller; a horizontal line of equal weight looks thicker than a vertical one. Professionals correct these by eye on top of the geometry — this is what separates a living mark from a machined one — a good case study is [the arcs in the Spotify logo](../istoriya-logotipa-spotify/).
:::

## Step 3. The wordmark

Set the name with the Type tool (`T`). Choosing the face is its own discipline with legal traps: the font must be licensed for commercial use — [the full font guide](../shrift-dlya-logotipa/) covers this in depth. Adjust tracking and kerning by hand (`Alt+arrows` between letters): the default fit almost always needs fixes in a couple of spots.

**Before export — Type → Create Outlines (`⇧⌘O`):** the text becomes curves and stops depending on installed fonts. Keep a copy with live text — there's no way back from curves.

## Step 4. Color and versions

Assign colors and save them as global Swatches (the Global checkbox) — changing a shade then updates every object at once. Build the palette by the method in [how to build a brand color palette](../kak-podobrat-cvetovuyu-palitru-brenda/). Produce the mandatory kit immediately — here's why it looks the way it does: color version, black, white (check it on a dark artboard), the compact mark without text.

## Step 5. Checks

- Copy the mark to the 48 and 16 px control artboards: the silhouette must survive.
- View → **Pixel Preview**: this is how screens will see the mark — hairlines that mush into pixels show instantly.
- Convert a copy to grayscale (Edit → Edit Colors → Convert to Grayscale): the composition must work without color.
- Object → Path → **Clean Up**: removes stray points and junk objects that would later bloat the SVG.

## Step 6. Export: three doors

| Destination | How | Settings |
| --- | --- | --- |
| Web, developers | File → Export → Export As → **SVG** | Styling: Presentation Attributes; Decimal: 3; text already outlined |
| Print shop | File → Save As → **PDF** | convert colors to CMYK ([details](../logotip-dlya-pechati/)) |
| Social, documents | Export As → **PNG** | 1x/2x/4x, Transparent checked ([why transparency](../logotip-s-prozrachnym-fonom/)) |

Run the exported SVG through an optimizer — Illustrator writes redundant metadata, and we cover [how to clean an SVG like that](../kak-optimizirovat-svg/). Archive the working AI file with live text — that's your master source, and it's worth knowing [what should be in the kit](../kak-zakazat-logotip-u-dizajnera/) a designer hands over.

## Common Illustrator beginner mistakes

1. **Strokes not outlined.** Object → Path → Outline Stroke before finalizing: strokes scale differently than fills.
2. **Eyeballing without a grid.** Half-pixel misalignments are invisible in a mockup and glaring on signage.
3. **Transparency and effects in SVG.** Shadows, raster effects and blend modes break SVG — the mark must be pure fills.
4. **One artboard for all versions.** Each version gets its own artboard: batch export, nothing gets lost.
5. **A CMYK document for a screen mark.** Colors go dull at the design stage. The order is the reverse: RGB for design, CMYK by conversion for print.

Next: run the mark through the mistake checklist, assemble the [palette](../kak-podobrat-cvetovuyu-palitru-brenda/) and a mini guideline — we explain [what a brand book actually is](../chto-takoe-brendbuk/) separately. Free alternatives to everything above — Inkscape and [Figma](../kak-narisovat-logotip-v-figma/); the generative route — [an AI logo](../logotip-nejrosetyu/) polished in the same Illustrator.
