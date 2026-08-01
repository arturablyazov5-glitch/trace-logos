---
title: Как уменьшить вес PNG без потери качества — все способы
title_en: How to Compress a PNG Without Losing Quality — Every Method
description: Сжимаем PNG: онлайн‑сервисы TinyPNG и Squoosh, утилиты pngquant и oxipng, экспорт из Figma и Photoshop. Почему PNG весит так много и когда лучше сменить формат.
description_en: Compressing PNG files: TinyPNG and Squoosh, pngquant and oxipng, Figma and Photoshop export. Why PNGs get heavy and when to switch formats instead.
date: 2026-08-12
slug: kak-umenshit-ves-png
tags: Инструкции, Форматы, Оптимизация
tags_en: How-To, Formats, Optimization
---

PNG‑логотип весит три мегабайта, страница грузится вечность, а «Сжать» в редакторе почему‑то ничего не меняет. Знакомо? PNG — формат без потерь, поэтому по умолчанию он большой, но сжимать его можно — и часто в 3‑5 раз без видимой глазу разницы. Разбираем, откуда берётся вес, какие инструменты реально работают и в каких случаях правильный ответ — вообще не PNG.

:::note Коротко
Три уровня действий: **1)** проверить размеры в пикселях — чаще всего файл тяжёл потому, что он банально огромный; **2)** прогнать через умный компрессор (TinyPNG, Squoosh, pngquant) — квантование палитры срезает 50‑80% веса почти незаметно; **3)** задуматься о формате: для сайтов PNG часто стоит заменить на [WebP](../chto-takoe-webp/), а для логотипов — на SVG.
:::

## Почему PNG такой тяжёлый

PNG хранит изображение **без потерь**: каждый пиксель восстанавливается в точности. Это его суперсила (нет артефактов, есть прозрачность) и его проклятие: фотография или градиент в PNG весят в разы больше, чем в JPG. Подробное сравнение форматов — в статье [PNG или JPG — что лучше](../png-ili-jpg-chto-luchshe/).

Вес PNG складывается из трёх факторов:

1. **Размеры в пикселях.** Вес растёт квадратично: картинка 4000×4000 — это 16 мегапикселей против одного у 1000×1000.
2. **Число цветов.** PNG‑24 хранит 16,7 млн цветов; PNG‑8 — максимум 256. Для логотипов и графики 256 цветов почти всегда достаточно.
3. **Эффективность упаковки.** Один и тот же пиксельный массив можно закодировать компактнее или расточительнее — на этом играют оптимизаторы.

## Уровень 1. Проверьте размеры — самая частая причина

Прежде чем сжимать, откройте свойства файла. Если картинка для сайта имеет 4000 пикселей по ширине, а показывается в блоке шириной 400 — никакой компрессор не спасёт: уменьшите сам размер. Правило: экспортируйте в **2× от размера показа** (для Retina‑экранов) — для блока 400 px нужен файл 800 px. Какие размеры нужны разным площадкам — в статье [размеры логотипа для сайта и соцсетей](../razmery-logotipa-dlya-sajta-i-socsetej/).

Уменьшить размеры умеет что угодно: Просмотр на Mac (Инструменты → Настроить размер), [Figma](../../logos/design/figma/) (экспорт с нужным множителем), любой онлайн‑редактор.

:::warning Не уменьшайте логотипы «навсегда»
Уменьшенная копия — для сайта; оригинал сохраните. Увеличить растровую картинку обратно без потерь нельзя — [почему, мы разбирали здесь](../pochemu-logotip-razmytyj/).
:::

## Уровень 2. Умное сжатие

### Онлайн: TinyPNG и Squoosh

**TinyPNG** — самый известный компрессор: перетащили файлы (до 20 за раз бесплатно) — получили результат, обычно **минус 50‑80%**. Секрет — квантование: сервис сокращает палитру до ~256 оптимально подобранных цветов с дизерингом. Формально это сжатие с потерями, но на логотипах и интерфейсной графике разницу не видно даже под лупой.

**Squoosh** (проект Google) даёт больше контроля: ползунок числа цветов, мгновенное сравнение «до/после» половинками экрана, плюс конвертация в [WebP](../chto-takoe-webp/) и AVIF тут же. Работает локально в браузере — картинки никуда не загружаются, что важно для конфиденциальных макетов.

### Утилиты: pngquant и oxipng

Для пакетной обработки и автоматизации:

- **pngquant** — то же квантование, что у TinyPNG, в командной строке: `pngquant --quality=65-85 *.png`. Сотни файлов за секунды.
- **oxipng / OptiPNG** — оптимизация **без потерь**: перепаковывают данные эффективнее, выигрывая 5‑30% без единого изменённого пикселя. Годится, когда потери недопустимы принципиально.
- Связка «pngquant, затем oxipng» — стандартный конвейер сборки сайтов.

### Экспорт из редакторов

В [Photoshop](../../logos/design/photoshop/) выбирайте «Export As → PNG‑8», когда цветов немного, — это то же квантование на этапе экспорта. Figma экспортирует только PNG‑24, поэтому её экспорт почти всегда стоит догонять компрессором.

## Уровень 3. Может, вам не нужен PNG?

Иногда лучший способ сжать PNG — перестать им пользоваться:

| Ситуация | Лучший формат | Почему |
| --- | --- | --- |
| Логотип, иконка, схема | **SVG** | вектор: килобайты и бесконечное масштабирование ([сравнение](../svg-ili-png-dlya-logotipa/)) |
| Фото без прозрачности | **JPG / WebP** | сжатие с потерями в разы эффективнее ([разбор](../png-ili-jpg-chto-luchshe/)) |
| Любая графика на сайте | **WebP** | на ~26% легче PNG при том же качестве ([что такое WebP](../chto-takoe-webp/)) |
| Печать, исходники | **PNG** остаётся | без потерь и без сюрпризов |

Растровый логотип можно перевести в вектор — тогда вопрос веса закрывается навсегда: [как перевести логотип в вектор](../kak-perevesti-logotip-v-vektor/). А если оптимизируете SVG‑файлы, у нас есть отдельная инструкция: [как оптимизировать SVG](../kak-optimizirovat-svg/).

## Практический чек‑лист

1. Узнайте, в каком размере картинка реально показывается, и экспортируйте в 2× от него.
2. Прогоните через TinyPNG/Squoosh (разово) или pngquant (пакетно).
3. Посмотрите результат глазами на 100% и 200% масштаба — особенно градиенты и полупрозрачные края: именно там квантование может дать полосы.
4. Для сайта — отдавайте WebP с PNG‑фолбэком.
5. Оригиналы храните отдельно и не пережимайте повторно.

Кстати, все PNG‑логотипы в нашем [каталоге](../../logos/) уже оптимизированы, а карточки сетки грузятся лёгкими WebP‑превью — скачивая файл, вы получаете полновесный оригинал, а страницы при этом летают. Как правильно скачивать логотипы в нужном формате — в статье [как скачать логотип с сайта](../kak-skachat-logotip-s-sajta/).

---EN---

Your PNG logo weighs three megabytes, the page takes forever to load, and "compress" in your editor changes nothing. Sound familiar? PNG is a lossless format, so it's big by default — but it can be compressed, often 3-5× with no difference the eye can catch. Let's see where the weight comes from, which tools actually work, and when the right answer is not PNG at all.

:::note TL;DR
Three levels of action: **1)** check the pixel dimensions — most heavy files are simply enormous; **2)** run a smart compressor (TinyPNG, Squoosh, pngquant) — palette quantization cuts 50-80% almost invisibly; **3)** reconsider the format: on websites PNG is often better replaced by [WebP](../chto-takoe-webp/), and for logos — by SVG.
:::

## Why PNG is heavy

PNG stores the image **losslessly**: every pixel is reconstructed exactly. That's its superpower (no artifacts, real transparency) and its curse: a photo or gradient in PNG weighs several times more than in JPG. The full format comparison is in [PNG vs JPG](../png-ili-jpg-chto-luchshe/).

PNG weight is a product of three factors:

1. **Pixel dimensions.** Weight grows quadratically: a 4000×4000 image is 16 megapixels versus one at 1000×1000.
2. **Color count.** PNG-24 stores 16.7M colors; PNG-8 at most 256. For logos and graphics 256 is almost always plenty.
3. **Packing efficiency.** The same pixel array can be encoded tightly or wastefully — this is where optimizers play.

## Level 1. Check dimensions — the most common cause

Before compressing, open the file's properties. If a site image is 4000 pixels wide but displays in a 400-pixel block, no compressor will save you: shrink the image itself. Rule of thumb: export at **2× the display size** (for Retina screens) — a 400 px block needs an 800 px file. Platform size requirements are in [logo sizes for websites and social media](../razmery-logotipa-dlya-sajta-i-socsetej/).

Anything can resize: macOS Preview (Tools → Adjust Size), [Figma](../../logos/design/figma/) (export with a multiplier), any online editor.

:::warning Don't shrink logos "forever"
The reduced copy is for the site; keep the original. A raster image cannot be enlarged back without loss — [here's why](../pochemu-logotip-razmytyj/).
:::

## Level 2. Smart compression

### Online: TinyPNG and Squoosh

**TinyPNG** is the best-known compressor: drop files in (up to 20 free at a time) and get results, typically **50-80% off**. The trick is quantization: the service reduces the palette to ~256 optimally chosen colors with dithering. Technically lossy, but on logos and UI graphics the difference is invisible even under a magnifier.

**Squoosh** (a Google project) offers more control: a color-count slider, an instant split-screen before/after, plus conversion to [WebP](../chto-takoe-webp/) and AVIF right there. It runs locally in the browser — images never leave your machine, which matters for confidential designs.

### CLI tools: pngquant and oxipng

For batches and automation:

- **pngquant** — TinyPNG-style quantization in the terminal: `pngquant --quality=65-85 *.png`. Hundreds of files in seconds.
- **oxipng / OptiPNG** — **lossless** optimization: repacks the data more efficiently, saving 5-30% without changing a single pixel. For when loss is fundamentally unacceptable.
- The "pngquant, then oxipng" combo is a standard website build pipeline.

### Editor export

In [Photoshop](../../logos/design/photoshop/) choose "Export As → PNG-8" when colors are few — the same quantization at export time. Figma only exports PNG-24, so its output is almost always worth chasing with a compressor.

## Level 3. Maybe you don't need PNG

Sometimes the best way to compress a PNG is to stop using one:

| Situation | Better format | Why |
| --- | --- | --- |
| Logo, icon, diagram | **SVG** | vector: kilobytes and infinite scaling ([comparison](../svg-ili-png-dlya-logotipa/)) |
| Photo without transparency | **JPG / WebP** | lossy compression is several times more efficient ([details](../png-ili-jpg-chto-luchshe/)) |
| Any website graphics | **WebP** | ~26% lighter than PNG at equal quality ([what WebP is](../chto-takoe-webp/)) |
| Print, masters | **PNG** stays | lossless and surprise-free |

A raster logo can be vectorized — closing the weight question forever: [how to vectorize a logo](../kak-perevesti-logotip-v-vektor/). And if you're optimizing SVG files, we have a separate guide: [how to optimize SVG](../kak-optimizirovat-svg/).

## The practical checklist

1. Find the real display size and export at 2× of it.
2. Run TinyPNG/Squoosh (one-off) or pngquant (batch).
3. Eyeball the result at 100% and 200% zoom — especially gradients and translucent edges, where quantization can band.
4. On the web, serve WebP with a PNG fallback.
5. Store originals separately and never re-compress them.

By the way, all PNG logos in our [catalog](../../logos/) are already optimized, and the grid cards load lightweight WebP previews — you download the full-weight original while the pages stay fast. How to download logos in the right format: [how to download a logo from a website](../kak-skachat-logotip-s-sajta/).
