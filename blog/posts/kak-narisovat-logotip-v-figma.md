---
title: Как нарисовать логотип в Figma — пошаговая инструкция для новичка
title_en: How to Design a Logo in Figma — a Beginner's Step-by-Step Guide
description: Рисуем логотип в Figma с нуля: настройка файла, работа с фигурами и булевыми операциями, текст и шрифты, цвета, проверка в размерах, экспорт в SVG и PNG
description_en: Designing a logo in Figma from scratch: file setup, shapes and boolean operations, text and fonts, color, size testing, SVG and PNG export
date: 2026-08-06
slug: kak-narisovat-logotip-v-figma
tags: Инструкции, Figma, Дизайн
tags_en: How-To, Figma, Design
---

[Figma](../../logos/design/figma/) — бесплатный, работает в браузере и при этом умеет всё, что нужно для полноценного логотипа: векторные кривые, булевы операции, работа со шрифтами и экспорт в любой формат. Разбираем весь путь по шагам — от пустого файла до комплекта SVG и PNG, готового к использованию.

:::note Коротко
Маршрут такой: создать файл и фреймы под размеры → собрать знак из фигур и булевых операций (не из карандашных линий) → добавить текст и перевести его в кривые перед экспортом → назначить цвета стилями → проверить в 16, 48 и 512 пикселях → экспортировать SVG для веба и PNG для остального. Ниже — каждый шаг подробно.
:::

## Почему Figma подходит для логотипов

Логотип обязан быть вектором — иначе он [размывается при масштабировании](../pochemu-logotip-razmytyj/) (почему так работает растр — в статье [векторная и растровая графика](../vektor-i-rastr-raznica/)). Figma — векторный редактор, так что это требование выполняется автоматически. По сравнению с [Illustrator](../../logos/design/illustrator/) здесь меньше специализированных инструментов для сложной иллюстрации, но для 90% логотипов — геометричных знаков и текстовых композиций — возможностей хватает с запасом, а порог входа несравнимо ниже.

## Шаг 1. Подготовка файла

1. Создайте новый дизайн‑файл.
2. Сделайте три фрейма (клавиша `F`): **512×512** — рабочий, **48×48** и **16×16** — контрольные. В маленьких фреймах вы будете проверять, выживает ли знак в размере иконки и [фавиконки](../kak-sdelat-favicon/).
3. Включите сетку Layout Grid на рабочем фрейме — например, 8‑пиксельную: привязка к сетке дисциплинирует композицию.

## Шаг 2. Знак: фигуры вместо рисования

Главный секрет аккуратных логотипов: их не «рисуют от руки», а **собирают из простых фигур** — кругов, прямоугольников, дуг. Посмотрите на знаки из нашего каталога: самолётик [Telegram](../../logos/social/telegram/) — это треугольники, шеврон [Сбера](../../logos/bank/sber/) — сегмент круга.

Рабочие инструменты:

- **Фигуры** (`O` — эллипс, `R` — прямоугольник) — база любой композиции.
- **Булевы операции** (панель сверху: Union, Subtract, Intersect, Exclude) — вычитайте один круг из другого, и получится полумесяц; пересекайте фигуры — получатся линзы и сегменты. Это главный инструмент логотип‑дизайна.
- **Скругления углов** — тяните за точку у угла фигуры или задайте радиус в панели справа.
- **Перо** (`P`) — для форм, которые из фигур не собрать. Правило: чем меньше опорных точек, тем чище кривая.

:::tip Приём «из кругов»
Классическое упражнение: собрать знак только из окружностей и их пересечений. Так построены десятки великих логотипов — от птички старого Twitter до яблока [Apple](../istoriya-logotipa-apple/), в котором дуги выверены по окружностям разного радиуса. Ограничение дисциплинирует форму лучше любого таланта.
:::

## Шаг 3. Текстовая часть

1. Инструмент Text (`T`), наберите название. Про выбор гарнитуры — со всеми ловушками лицензий — читайте в статье [шрифт для логотипа](../shrift-dlya-logotipa/): для коммерческого использования шрифт должен иметь открытую или купленную лицензию.
2. Настройте трекинг (межбуквенное расстояние): логотипам почти всегда идёт чуть увеличенный или чуть уменьшенный трекинг по сравнению с дефолтом — сравните варианты.
3. **Перед финальным экспортом переведите текст в кривые:** правый клик → Outline Stroke / Flatten (`⌘E`). Иначе SVG откроется без вашего шрифта на любой машине, где он не установлен. Сохраните копию с «живым» текстом для будущих правок!

## Шаг 4. Цвет

Назначьте цвета и сохраните их как стили (Color Styles) — так вы зафиксируете точные HEX‑коды для будущего [фирменного стиля](../chto-takoe-firmennyj-stil/). Ориентиры по выбору: [психология цвета в логотипе](../psihologiya-cveta-v-logotipe/) и [фирменные цвета известных брендов](../firmennye-cveta-izvestnyh-brendov/). Сразу сделайте три версии знака: цветную, чёрную и белую (проверьте белую на тёмном фрейме) — монохром понадобится чаще, чем кажется.

## Шаг 5. Проверка размерами

Скопируйте знак в контрольные фреймы 48×48 и 16×16 (вставляйте как инстанс или просто масштабируйте копию — с вектором потерь не будет):

- В **48 px** знак должен читаться мгновенно.
- В **16 px** — оставаться узнаваемым пятном: мелкие детали сольются, и это нормально, если силуэт держится. Если нет — упрощайте: у больших брендов для маленьких размеров есть отдельные упрощённые версии знака — [почему все упрощают](../pochemu-brendy-uproshchayut-logotipy/), мы разбирали отдельно.

Дополнительно посмотрите знак в градациях серого (плагином или временной заливкой) — композиция должна работать без помощи цвета.

## Шаг 6. Экспорт

В панели Export справа добавьте форматы:

- **SVG** — главный результат: масштабируемый исходник для сайта и передачи дизайнерам, [зачем вообще нужен SVG](../svg-ili-png-dlya-logotipa/), мы объясняли отдельно. Перед экспортом убедитесь, что текст переведён в кривые, лишние скрытые слои удалены, а знак сгруппирован.
- **PNG** — экспортируйте в 1x, 2x и 4x с прозрачным фоном для площадок, которые не принимают вектор; [какие размеры нужны](../razmery-logotipa-dlya-sajta-i-socsetej/) для каждой площадки, мы разбирали отдельно.

Экспортированный SVG стоит прогнать через оптимизатор — лишние атрибуты Figma добавляет щедро, [как оптимизировать SVG](../kak-optimizirovat-svg/) — отдельная инструкция.

## Частые ошибки новичков

1. **Обводки вместо заливок.** Знак, построенный на strokes, при экспорте и масштабировании ведёт себя непредсказуемо. Финальную версию — Outline Stroke (`⌘E` → Flatten), превратив обводки в заливки.
2. **Слишком много деталей.** Проверка фреймом 16×16 отсекает лишнее лучше любого ментора.
3. **Не переведённый в кривые текст.** SVG с «живым» шрифтом сломается на чужом компьютере.
4. **Один файл вместо комплекта.** На выходе должно быть несколько версий: полная, компактная, монохромные — состав комплекта описан в статье про виды логотипов.
5. **Копирование референсов один в один.** Вдохновляться каталогом можно и нужно, повторять чужой знак — [нельзя](../mozhno-li-ispolzovat-chuzhoy-logotip/).

## Что дальше

Готовый логотип: проверьте на реальных носителях (аватарка, шапка сайта, [иконка приложения](../ikonka-prilozheniya/)), соберите мини‑гайдлайн с кодами цветов и подумайте о [регистрации товарного знака](../kak-zaregistrirovat-logotip/), если бренд коммерческий. Если рисовать с нуля не хочется — есть путь [генерации нейросетью](../logotip-nejrosetyu/) с последующей доводкой в той же Figma, а разбор всех вариантов «сделать самому» — в статье [как сделать логотип самостоятельно](../kak-sdelat-logotip-samomu/).

---EN---

[Figma](../../logos/design/figma/) is free, runs in the browser and still has everything a proper logo needs: vector curves, boolean operations, typography and export to any format. Here is the whole journey step by step — from an empty file to an SVG + PNG kit ready for use.

:::note TL;DR
The route: create a file and size frames → build the mark from shapes and booleans (not freehand lines) → add text and outline it before export → assign colors as styles → test at 16, 48 and 512 pixels → export SVG for the web and PNG for everything else. Each step in detail below.
:::

## Why Figma works for logos

A logo must be vector — otherwise it [blurs when scaled](../pochemu-logotip-razmytyj/) (why raster works that way: [vector vs raster](../vektor-i-rastr-raznica/)). Figma is a vector editor, so the requirement is met automatically. Compared to [Illustrator](../../logos/design/illustrator/) it has fewer specialized illustration tools, but for 90% of logos — geometric marks and type compositions — the toolset is more than enough, and the learning curve is incomparably gentler.

## Step 1. File setup

1. Create a new design file.
2. Make three frames (`F`): **512×512** — working, **48×48** and **16×16** — control. The small frames are where you check whether the mark survives at icon and [favicon](../kak-sdelat-favicon/) sizes.
3. Enable a Layout Grid on the working frame — an 8-pixel grid, say: snapping disciplines composition.

## Step 2. The mark: shapes, not drawing

The main secret of clean logos: they are not drawn freehand but **assembled from simple shapes** — circles, rectangles, arcs. Look at the marks in our catalog: the [Telegram](../../logos/social/telegram/) paper plane is triangles; the [Sber](../../logos/bank/sber/) chevron is a circle segment.

The working tools:

- **Shapes** (`O` — ellipse, `R` — rectangle) — the base of any composition.
- **Boolean operations** (top panel: Union, Subtract, Intersect, Exclude) — subtract one circle from another and you get a crescent; intersect shapes and you get lenses and segments. This is the core tool of logo design.
- **Corner radius** — drag the corner handle or set a radius in the right panel.
- **Pen** (`P`) — for forms shapes can't produce. Rule: the fewer anchor points, the cleaner the curve.

:::tip The circles exercise
A classic drill: build the mark from circles and their intersections only. Dozens of great logos are constructed this way — from the old Twitter bird to the [Apple](../istoriya-logotipa-apple/) apple, whose arcs align to circles of different radii. The constraint disciplines form better than talent.
:::

## Step 3. The wordmark

1. Text tool (`T`), type the name. On choosing a typeface — with all the licensing traps — see [choosing a logo font](../shrift-dlya-logotipa/): commercial use requires an open or purchased license.
2. Adjust tracking (letter spacing): logos almost always benefit from slightly more or less tracking than default — compare variants.
3. **Outline the text before final export:** right-click → Outline Stroke / Flatten (`⌘E`). Otherwise the SVG opens without your font on any machine where it isn't installed. Keep a copy with live text for future edits!

## Step 4. Color

Assign colors and save them as Color Styles — this fixes the exact HEX codes for your future [visual identity](../chto-takoe-firmennyj-stil/). Guidance: [color psychology in logo design](../psihologiya-cveta-v-logotipe/) and [brand colors of famous companies](../firmennye-cveta-izvestnyh-brendov/). Make three versions of the mark right away: color, black and white (check the white one on a dark frame) — you'll need monochrome more often than you think.

## Step 5. Size testing

Copy the mark into the 48×48 and 16×16 control frames (vector scales losslessly):

- At **48 px** the mark must read instantly.
- At **16 px** it must remain a recognizable silhouette: fine details will merge, which is fine if the shape holds. If not — simplify: big brands keep separate simplified marks for small sizes — we cover [why everyone simplifies](../pochemu-brendy-uproshchayut-logotipy/) separately.

Also view the mark in grayscale (a plugin or a temporary fill) — the composition must work without color's help.

## Step 6. Export

In the Export panel add formats:

- **SVG** — the main deliverable: the scalable master for the web and for handing to designers — we explain [why SVG](../svg-ili-png-dlya-logotipa/) separately. Before export make sure text is outlined, hidden layers deleted, the mark grouped.
- **PNG** — export at 1x, 2x and 4x with transparent background for platforms that reject vector; we cover [which sizes you need](../razmery-logotipa-dlya-sajta-i-socsetej/) for each platform separately.

Run the exported SVG through an optimizer — Figma is generous with redundant attributes; [how to optimize SVG](../kak-optimizirovat-svg/) is a separate guide.

## Common beginner mistakes

1. **Strokes instead of fills.** A stroke-built mark behaves unpredictably on export and scaling. Flatten the final version (`⌘E`), turning strokes into fills.
2. **Too much detail.** The 16×16 frame trims excess better than any mentor.
3. **Non-outlined text.** An SVG with live type breaks on someone else's computer.
4. **One file instead of a kit.** The output should be several versions: full, compact, monochrome — the kit contents are listed in our piece on types of logos.
5. **Copying references verbatim.** Being inspired by the catalog is fine and encouraged; replicating someone's mark [is not](../mozhno-li-ispolzovat-chuzhoy-logotip/).

## What's next

With the logo done: test it on real media (avatar, site header, [app icon](../ikonka-prilozheniya/)), assemble a mini guideline with color codes, and consider [trademark registration](../kak-zaregistrirovat-logotip/) if the brand is commercial. If drawing from scratch isn't your thing, there's the [AI generation](../logotip-nejrosetyu/) route with a Figma polish afterwards, and a survey of all DIY paths in [how to make a logo yourself](../kak-sdelat-logotip-samomu/).
