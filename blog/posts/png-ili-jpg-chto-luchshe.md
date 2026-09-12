---
title: PNG или JPG — чем отличаются и что выбрать для каждой задачи
title_en: PNG vs JPG — The Differences and Which to Choose for Every Task
description: Разница между PNG и JPG простыми словами: сжатие с потерями и без, прозрачность, вес, артефакты. Таблица «что для чего» и место WebP в этой паре.
description_en: PNG vs JPG in plain words — lossy vs lossless compression, transparency, weight, artifacts. A what-for-what table, plus where WebP fits in.
date: 2026-07-04
slug: png-ili-jpg-chto-luchshe
tags: Форматы, Графика, Основы
tags_en: Formats, Graphics, Basics
---

Сохранить в PNG или в JPG? Вопрос, который возникает по сто раз на дню — при экспорте макета, загрузке товара на маркетплейс, отправке сканов. Отвечают на него обычно наугад, а зря: выбор неправильного формата — это либо файл в пять раз тяжелее нужного, либо грязные разводы вокруг текста. Правило на самом деле одно, и оно простое.

:::note Коротко
**JPG — для фотографий**: миллионы оттенков, плавные переходы, маленький вес за счёт сжатия с потерями. **PNG — для графики**: логотипы, скриншоты, схемы, текст на картинке, всё с чёткими краями и прозрачностью. Перепутаете — получите либо тяжёлый файл (фото в PNG), либо артефакты (логотип в JPG).
:::

## Главное различие: как они сжимают

**JPG сжимает с потерями.** Алгоритм выбрасывает детали, которые глаз замечает слабо: микропереходы оттенков, высокочастотный шум. На фотографии потери невидимы, зато файл худеет в 5‑10 раз. Степень сжатия настраивается: качество 80‑90% — золотая середина для веба.

**PNG сжимает без потерь.** Каждый пиксель восстанавливается в точности. Платой за честность становится вес: фотография в PNG весит в разы больше своего JPG‑близнеца при неотличимой картинке.

Отсюда вся логика выбора: где потери незаметны (фото) — берём JPG и экономим вес; где каждая граница важна (графика) — берём PNG.

## Почему логотип в JPG — всегда ошибка

JPG‑алгоритм устроен блоками 8×8 пикселей и хуже всего справляется с резкими границами: вокруг букв, линий и контуров появляется характерная «грязь» — артефакты сжатия. Плюс два структурных ограничения:

- **Нет прозрачности.** Логотип навсегда впаян в белый прямоугольник — что с этим делать, мы разбирали в статье [про прозрачный фон](../logotip-s-prozrachnym-fonom/).
- **Потери накапливаются.** Каждое пересохранение JPG — новый раунд сжатия. Файл, прошедший через пять редактирований, выглядит заметно хуже оригинала.

Для логотипов и иконок иерархия форматов такая: SVG (вектор — лучший вариант), затем PNG, и никогда JPG. Почему вектор вне конкуренции — в [сравнении SVG и PNG](../svg-ili-png-dlya-logotipa/).

## Почему фото в PNG — тоже ошибка

Обратная ситуация безобиднее, но расточительна: фотография в PNG весит 5‑20 МБ там, где JPG отдал бы 500 КБ без видимой разницы. На сайте это медленная загрузка и штраф к Core Web Vitals, в письме — недоставка из‑за лимитов, на телефоне — забитая память. Единственный случай, когда фото хранят в PNG, — промежуточные версии при многоэтапном редактировании, чтобы не накапливать JPG‑потери.

## Таблица: что в чём сохранять

| Задача | Формат |
| --- | --- |
| Фотография для сайта, соцсетей | JPG (или WebP) |
| Логотип, иконка | SVG, если нельзя — PNG |
| Скриншот интерфейса | PNG |
| Схема, график, диаграмма | PNG или SVG |
| Картинка с текстом (мем, баннер) | PNG |
| Скан документа | JPG (или PDF) |
| Изображение с прозрачностью | PNG |
| Фото для печати | JPG максимального качества / TIFF |

## А как же WebP и AVIF?

Современные форматы, которые умеют и то и другое: сжатие с потерями лучше JPG (на 25‑35% легче при том же качестве) и без потерь с прозрачностью лучше PNG. Все актуальные браузеры их поддерживают, и для **веба** WebP — правильный дефолт: не случайно наш каталог отдаёт превью логотипов именно в WebP.

Почему тогда JPG и PNG живы? Совместимость за пределами браузера: старые программы, госпорталы, маркетплейсы и типографии по‑прежнему просят классику. Рабочая схема: храните оригиналы в PNG/JPG (или вообще в исходниках), для сайта конвертируйте в WebP автоматически.

## Как конвертировать туда‑сюда

- **JPG → PNG:** можно всегда, но бессмысленно для качества — потери JPG уже случились и не вернутся. Конвертируют обычно ради прозрачности после удаления фона.
- **PNG → JPG:** уместно для фотографий, случайно сохранённых в PNG. Прозрачные области зальются белым — проверьте, что их нет.
- Инструменты: любой графический редактор, [Preview](../../logos/design/preview/) на Mac, «Фотографии» на [Windows](../../logos/tech/windows/), онлайн‑конвертеры. Для пакетной обработки — командная строка или Squoosh.

:::tip Проверка перед загрузкой на сайт
Откройте картинку в масштабе 100% и посмотрите на границы объектов и текста. Грязные разводы — пересжатый JPG, ищите исходник получше. Файл фотографии больше 1‑2 МБ — конвертируйте в JPG/WebP с качеством 80‑85%: разницу не увидит никто, кроме счётчика скорости загрузки.
:::

## Под капотом: почему JPG «блочный», а PNG «честный»

Немного механики — она объясняет все внешние эффекты.

**JPG** делит картинку на блоки 8×8 пикселей и описывает каждый через частотное преобразование (DCT): плавные переливы кодируются несколькими коэффициентами, резкие перепады требуют многих. Сжатие обрезает «дорогие» высокочастотные коэффициенты — на фото это незаметно, а на границе буквы превращается в звон и грязь вокруг контура. Отсюда же блочность в тенях сильно сжатых фото: блоки 8×8 перестают сходиться по яркости.

**PNG** работает как архиватор: предсказывает каждый пиксель по соседям и сжимает разницу алгоритмом deflate (тот же, что в ZIP). Ничего не выбрасывается — поэтому большие области одного цвета и повторяющиеся узоры сжимаются великолепно, а фотографический шум (где каждый пиксель непредсказуем) — почти никак.

Один и тот же скриншот с текстом: PNG — 80 КБ и идеальные буквы; JPG 80% — 120 КБ и грязь вокруг шрифта. Одно и то же фото заката: JPG 85% — 400 КБ без видимых потерь; PNG — 6 МБ. Формат надо выбирать под природу картинки, а не «какой лучше вообще».

## Тонкости PNG, о которых мало кто знает

- **PNG‑8 против PNG‑24.** PNG с палитрой до 256 цветов (PNG‑8) в разы легче полноцветного — для простой графики без градиентов это легальный способ срезать вес. Экспортёры [Figma](../../logos/design/figma/) и [Photoshop](../../logos/design/photoshop/) дают выбор.
- **Прозрачность бывает разной.** PNG‑8 умеет только «пиксель есть/нет» (как GIF) — полупрозрачные тени требуют PNG‑24 с альфа‑каналом.
- **Метаданные весят.** Скриншоты с телефона таскают EXIF‑данные; оптимизаторы (TinyPNG, Squoosh, oxipng) срезают их и перепаковывают сжатие — минус 20‑70% без потерь.
- **PNG не для CMYK.** Формат живёт только в RGB — для типографской печати с цветоделением нужны TIFF или PDF.

## Тонкости JPG, которые экономят нервы

- **Качество 100 ≠ без потерь.** Даже на максимуме JPG прогоняет картинку через DCT — потери меньше, но есть. «Сотка» лишь раздувает файл; рабочий диапазон — 80‑90.
- **Прогрессивный JPG** грузится «от мутного к чёткому» вместо построчного — субъективно быстрее на медленных сетях; галочка есть в любом экспортёре.
- **Каждое сохранение — деградация.** Правило одного сжатия: редактируйте в исходнике (PSD, PNG, RAW), а в JPG выходите один раз в самом конце.
- **Резкие повороты без потерь.** Поворот JPG на 90° возможен без пересжатия (jpegtran и часть просмотрщиков это умеют) — мелочь, полезная при массовой обработке сканов.

## Коротко

Одно правило закрывает 95% случаев: **фото — JPG, графика — PNG, веб — по возможности WebP, логотипы — в идеале вообще SVG**. Не сохраняйте логотипы в JPG, не храните фото в PNG, и картинки перестанут быть ни тяжёлыми, ни грязными.

Кстати, в нашем [каталоге логотипов](../../logos/) выбор формата уже сделан правильно за вас: вектор — в SVG, растровые версии — в PNG с прозрачностью, а превью в каталоге автоматически отдаются в лёгком WebP.

---EN---

Save as PNG or JPG? The question comes up a hundred times a day — exporting a mockup, uploading a product photo, sending scans. Most people answer at random, and it costs them: the wrong format means either a file five times heavier than needed, or dirty smudges around text. The actual rule is single and simple.

:::note TL;DR
**JPG is for photographs**: millions of shades, smooth transitions, small size thanks to lossy compression. **PNG is for graphics**: logos, screenshots, diagrams, text on images — anything with sharp edges or transparency. Mix them up and you get either a bloated file (photo as PNG) or artifacts (logo as JPG).
:::

## The core difference: how they compress

**JPG compresses with loss.** The algorithm discards details the eye barely registers: micro-transitions, high-frequency noise. On a photo the loss is invisible, and the file shrinks 5–10×. Quality 80–90% is the web sweet spot.

**PNG compresses losslessly.** Every pixel is restored exactly. The price of honesty is weight: a photo saved as PNG weighs several times its JPG twin with no visible difference.

That's the entire decision logic: where loss is invisible (photos) — JPG saves weight; where every edge matters (graphics) — PNG keeps them clean.

## Why a logo as JPG is always a mistake

JPG works in 8×8 pixel blocks and handles sharp boundaries worst of all: characteristic "dirt" — compression artifacts — appears around letters, lines and contours. Plus two structural limits:

- **No transparency.** The logo is welded into a white rectangle forever — what to do about it: [the transparent background article](../logotip-s-prozrachnym-fonom/).
- **Loss accumulates.** Every re-save is another compression round. A file that's been through five edits looks visibly worse than the original.

For logos and icons the format hierarchy is: SVG (vector — the best option), then PNG, and never JPG. Why vector is beyond competition: [SVG vs PNG](../svg-ili-png-dlya-logotipa/).

## Why a photo as PNG is also a mistake

The reverse case is harmless but wasteful: a PNG photo weighs 5–20 MB where a JPG would deliver 500 KB with no visible difference. On a website that's slow loading and a Core Web Vitals penalty; in email — bounced messages; on a phone — wasted storage. The one case for PNG photos: intermediate versions during multi-step editing, to avoid stacking JPG loss.

## The what-goes-where table

| Task | Format |
| --- | --- |
| Photo for web/social | JPG (or WebP) |
| Logo, icon | SVG; if impossible — PNG |
| UI screenshot | PNG |
| Chart, diagram | PNG or SVG |
| Image with text (meme, banner) | PNG |
| Document scan | JPG (or PDF) |
| Image with transparency | PNG |
| Photo for print | max-quality JPG / TIFF |

## What about WebP and AVIF?

Modern formats that do both jobs: lossy compression better than JPG (25–35% lighter at equal quality) and lossless-with-transparency better than PNG. Every current browser supports them, and for the **web** WebP is the right default — not by accident does our catalog serve logo previews as WebP.

Why are JPG and PNG still alive? Compatibility beyond the browser: legacy software, government portals, marketplaces and print shops still demand the classics. The working scheme: keep originals in PNG/JPG (or true source files), convert to WebP for the site automatically.

## Converting back and forth

- **JPG → PNG:** always possible, pointless for quality — JPG's losses already happened and won't return. Usually done for transparency after background removal.
- **PNG → JPG:** right for photos accidentally saved as PNG. Transparent areas flood white — check there are none.
- Tools: any editor, [Preview](../../logos/design/preview/) on Mac, Photos on [Windows](../../logos/tech/windows/), online converters, Squoosh for batches.

:::tip The pre-upload check
View the image at 100% and look at object and text boundaries. Dirty smudges — an over-compressed JPG; find a better source. A photo over 1–2 MB — convert to JPG/WebP at 80–85% quality: nobody will see the difference except the page-speed meter.
:::

## Under the hood: why JPG is "blocky" and PNG is "honest"

A little mechanics — it explains every visible effect.

**JPG** slices the image into 8×8 pixel blocks and describes each through a frequency transform (DCT): smooth transitions take a few coefficients, sharp jumps take many. Compression trims the "expensive" high-frequency ones — invisible on a photo, but at a letter's edge it becomes ringing and dirt. The same mechanism causes blockiness in the shadows of heavily compressed photos: neighboring 8×8 blocks stop agreeing on brightness.

**PNG** works like an archiver: it predicts each pixel from its neighbors and deflate-compresses the difference (the same algorithm as ZIP). Nothing is discarded — so large flat areas and repeating patterns compress superbly, while photographic noise (every pixel unpredictable) barely compresses at all.

The same text screenshot: PNG — 80 KB, perfect letters; JPG at 80% — 120 KB and grime around the type. The same sunset photo: JPG at 85% — 400 KB with no visible loss; PNG — 6 MB. Pick the format for the image's nature, not "which is better in general".

## PNG fine points few people know

- **PNG-8 vs PNG-24.** Palette PNG (≤256 colors) is several times lighter — for flat graphics without gradients it's a legitimate weight cut. [Figma](../../logos/design/figma/) and [Photoshop](../../logos/design/photoshop/) exporters offer the choice.
- **Transparency comes in grades.** PNG-8 only does on/off pixels (like GIF) — soft shadows need PNG-24 with a real alpha channel.
- **Metadata weighs.** Phone screenshots carry EXIF; optimizers (TinyPNG, Squoosh, oxipng) strip it and repack the compression — 20–70% off, losslessly.
- **PNG isn't for CMYK.** The format lives in RGB only — print-with-separations needs TIFF or PDF.

## JPG fine points that save nerves

- **Quality 100 ≠ lossless.** Even at maximum, JPG runs the image through DCT — smaller loss, but loss. "100" merely bloats the file; the working range is 80–90.
- **Progressive JPG** loads blurry-to-sharp instead of line by line — subjectively faster on slow networks; the checkbox is in every exporter.
- **Every save degrades.** The one-compression rule: edit in the source (PSD, PNG, RAW), export to JPG once at the very end.
- **Lossless rotation exists.** 90° JPG rotation without recompression is possible (jpegtran and some viewers) — a small thing that matters in bulk scan processing.

## In short

One rule covers 95% of cases: **photos — JPG, graphics — PNG, web — WebP where possible, logos — ideally SVG altogether**. Don't save logos as JPG, don't store photos as PNG, and your images will stop being heavy or dirty.

In our [logo catalog](../../logos/) the format choice is already made correctly for you: vectors as SVG, raster versions as transparent PNG, and catalog previews served as lightweight WebP.
