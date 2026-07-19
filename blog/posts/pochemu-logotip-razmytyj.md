---
title: Почему логотип размытый и как сделать его чётким — разбор всех причин
title_en: Why Your Logo Looks Blurry and How to Fix It — Every Cause Explained
description: Логотип мылится на сайте, в презентации или при печати? Разбираем 6 причин размытости — от растянутого PNG до ретина-экранов — и чиним каждую.
description_en: Logo looks soft on your site, in a deck or in print? We break down six causes of blur — from upscaled PNGs to retina screens — and fix each one.
date: 2026-07-07
slug: pochemu-logotip-razmytyj
tags: Логотипы, Качество, SVG
tags_en: Logos, Quality, SVG
---

На макете логотип был идеальным, а на сайте превратился в мыло. Или в презентации на проекторе. Или на визитках из типографии. Размытый логотип — это то, что клиенты и посетители замечают мгновенно: он делает бренд «дешёвым» ещё до того, как человек прочитал хоть слово. Хорошая новость: причин размытости всего шесть, и все они чинятся.

:::note Коротко
В 9 случаях из 10 логотип размытый потому, что **маленький растровый файл растянули до большого размера**. Лечится одним из двух способов: взять SVG (вектор не мылится в принципе) или взять PNG минимум в 2 раза больше размера показа — из-за ретина-экранов.
:::

## Причина 1. Маленький PNG растянули

Классика. Логотип скачали размером 200×200, а на сайте он стоит в блоке 400 пикселей шириной. Браузер вынужден «додумывать» недостающие пиксели — интерполировать, — и края плывут.

**Как проверить:** откройте файл и посмотрите его реальные размеры в пикселях. Если размер показа больше размера файла — вот и диагноз.

**Как починить:** взять исходник большего размера. Увеличить сам PNG «без потери качества» нельзя — апскейлеры на нейросетях помогают фотографиям, но на логотипах с чёткими краями обычно оставляют артефакты.

## Причина 2. Ретина-экраны: пикселей нужно в два раза больше

Даже если размеры совпадают точь-в-точь — 200-пиксельный PNG в 200-пиксельном блоке, — на iPhone и большинстве современных ноутбуков он всё равно будет мягким. Физических пикселей у таких экранов в 2–3 раза больше, чем CSS-пикселей: в блок 200×200 экран упаковывает 400×400 или 600×600 точек.

**Как починить:** правило 2x. Файл должен быть минимум вдвое больше размера показа: блок 200 px → PNG 400 px. Либо — SVG, которому плотность пикселей безразлична.

## Причина 3. Это JPG

JPG сжимает картинку с потерями и особенно плохо переносит резкие границы — именно из них состоит любой логотип. Вокруг букв и контуров появляется характерная «грязь» (артефакты сжатия), которую часто принимают за размытость.

**Как починить:** пересохранить из JPG нельзя — потери уже случились. Нужен исходный PNG или SVG. Почему JPG вообще не подходит для логотипов, мы разбирали в [сравнении форматов](../svg-ili-png-dlya-logotipa/).

## Причина 4. Логотип сжала сама платформа

Вы загрузили отличный файл, а соцсеть, маркетплейс или CMS пересжали его по-своему: уменьшили, конвертировали в JPG, наложили своё сжатие. Особенно этим славятся аватарки и обложки.

**Как починить:** загружать файл ровно в том размере, который требует площадка (тогда её ресайзер не включится), и с запасом по качеству. Для аватарок — квадрат от 400×400, без мелких деталей: при уменьшении до 40 пикселей тонкие линии исчезнут у любого формата.

## Причина 5. Дробные размеры и трансформации в CSS

Логотип может мылиться из-за вёрстки: элемент получил дробную ширину (например, 199.5 px из-за флексов), масштаб через `transform: scale()`, или картинка стоит в контейнере с `width: 100%` и растягивается на глазок.

**Как починить:** задать картинке целые размеры, а лучше — вставить SVG, которому эти проблемы безразличны. Если SVG всё равно выглядит мягко в мелком размере, проверьте, не рендерится ли он через `filter` или `opacity` — некоторые комбинации заставляют браузер растеризовать вектор заранее.

## Причина 6. Печать: 72 dpi вместо 300

На экране файл выглядел отлично, а на визитках — мыло. Экранного разрешения (72–96 dpi) для печати мало: типографии нужно 300 dpi. PNG 1000×1000 px на печати — это всего 8,5 см чёткого изображения.

**Как починить:** отдавать в печать вектор (EPS, PDF, SVG — что примет типография). Если вектора нет — растр из расчёта 300 пикселей на каждые 2,54 см физического размера.

## Таблица-шпаргалка

| Симптом | Причина | Лечение |
| --- | --- | --- |
| Мыло на сайте везде | маленький PNG растянут | SVG или PNG ×2 от размера |
| Чётко на мониторе, мыло на iPhone | ретина | правило 2x или SVG |
| «Грязь» вокруг букв | JPG-артефакты | найти PNG/SVG-исходник |
| Мыло только в соцсети | платформа пересжала | грузить точный размер |
| Мыло только на печати | 72 dpi | вектор или 300 dpi |

:::tip Универсальный ответ
Заметили закономерность? Почти каждая строка таблицы лечится словом «SVG». Вектор не зависит ни от размера блока, ни от плотности экрана, ни от dpi печати. Если платформа принимает SVG — всегда выбирайте его, и класс проблем «размытый логотип» исчезнет целиком.
:::

## Пошаговая диагностика: находим причину за пять минут

Когда мыло на месте, а причина неочевидна, идите по цепочке:

1. **Откройте сам файл отдельно от сайта** (перетащите в браузер, посмотрите в 100%). Файл чёткий? Значит, проблема в том, как его показывают, — идите к шагу 3. Мыльный уже сам файл — к шагу 2.
2. **Файл мыльный.** Посмотрите свойства: расширение (JPG?), размеры в пикселях (меньше, чем нужно?). Ищите исходник лучшего качества — обработкой этот файл не спасти.
3. **Файл чёткий, на сайте мыло.** Откройте DevTools (правый клик по логотипу → «Просмотреть код») и сравните два числа: реальный размер файла и размер, в котором он отображается (вкладка Computed или наведение на элемент). Отображается крупнее файла → причины 1–2. Размеры совпадают, но мыло на телефоне → ретина, причина 2.
4. **Мыло только в одном месте** (соцсеть, маркетплейс, письмо) → площадка пересжала, причина 4. Сравните загруженный файл со скачанным обратно — разница будет видна.

Эта последовательность закрывает практически все случаи и, что важнее, показывает, **где** чинить: в файле, в вёрстке или в настройках загрузки.

## Про «улучшайзеры»: может ли нейросеть спасти мыльный логотип

Апскейлеры (Topaz, Real-ESRGAN, встроенные в редакторы) творят чудеса с фотографиями, и рука тянется прогнать через них логотип. Результат обычно разочаровывает: на чётких границах и типографике нейросети дорисовывают волнистые края, скругляют углы букв и «изобретают» детали. Для логотипа корректный путь другой — не восстанавливать пиксели, а **вернуться к вектору**: найти SVG-оригинал или отрисовать заново (как — в статье [про перевод логотипа в вектор](../kak-perevesti-logotip-v-vektor/)). Апскейлер допустим как временная мера для второстепенной картинки, но не для знака, который представляет бренд.

## Отдельный случай: мыло в видео и презентациях

Логотип в углу ролика или на слайде мылится по своим причинам:

- **Видео пережато.** [YouTube](../../logos/media/youtube/) и соцсети жмут видео агрессивно, и мелкий логотип страдает первым. Лечение: крупнее размер логотипа в кадре, контрастный фон и — для интро — векторная анимация вместо статичной картинки (см. статью [про анимированные логотипы](../animirovannyj-logotip/)).
- **Презентация проецируется в чужом разрешении.** Проектор 1024×768 растянет ваш аккуратный макет. Вставляйте в слайды SVG (PowerPoint умеет) или PNG двойного размера.
- **[Zoom](../../logos/videocall/zoom/)/видеозвонки** сжимают демонстрацию экрана — логотип на шаринге всегда выглядит хуже, чем локально. Это ограничение канала, а не вашего файла.

## Коротко

Размытость — это всегда нехватка пикселей в конкретном месте: их либо мало в файле, либо съело сжатие, либо им не хватило плотности под ретину или печать. Решение одно из двух: вектор — или растр с двойным запасом.

Чтобы не искать чёткие исходники по всему интернету — в нашем [каталоге логотипов](../../logos/) каждый бренд лежит в оригинальном SVG и PNG высокого разрешения. Скачивайте нужный размер сразу, без мыла.

---EN---

The logo looked perfect in the mockup — and turned to mush on the website. Or on the projector. Or on business cards from the print shop. A blurry logo is the thing visitors notice instantly: it makes a brand look cheap before anyone reads a single word. Good news: there are only six causes, and every one is fixable.

:::note TL;DR
Nine times out of ten a logo is blurry because **a small raster file was stretched to a larger display size**. The cure is either SVG (vectors can't blur, period) or a PNG at least 2× the display size — because of retina screens.
:::

## Cause 1. A small PNG was stretched

The classic. The file is 200×200, the site slot is 400 px wide. The browser has to invent the missing pixels — interpolate — and edges swim.

**Check:** compare the file's real pixel size with its display size. Display bigger than file = diagnosis confirmed.

**Fix:** get a larger source. "Lossless upscaling" of a finished PNG doesn't exist; AI upscalers help photos but usually leave artifacts on sharp-edged logos.

## Cause 2. Retina screens need twice the pixels

Even with a perfect size match — a 200 px PNG in a 200 px slot — it still looks soft on iPhones and most modern laptops. These screens pack 2–3 physical pixels into each CSS pixel: a 200×200 slot actually renders 400×400 or 600×600 dots.

**Fix:** the 2x rule. The file should be at least double the display size: 200 px slot → 400 px PNG. Or SVG, which doesn't care about pixel density at all.

## Cause 3. It's a JPG

JPG compresses with loss and handles hard edges — which logos are made of — especially badly. The "dirt" around letters and outlines is compression artifacts, often mistaken for blur.

**Fix:** re-saving a JPG won't help; the loss already happened. You need the PNG or SVG source. We covered why JPG is wrong for logos in [our format comparison](../svg-ili-png-dlya-logotipa/).

## Cause 4. The platform recompressed it

You uploaded a great file, but the social network, marketplace or CMS resized it and applied its own JPG compression. Avatars and covers suffer most.

**Fix:** upload exactly the size the platform asks for (so its resizer stays off), with quality to spare. For avatars — a square of 400×400+ with no fine detail: at 40 px, thin lines vanish in any format.

## Cause 5. Fractional sizes and CSS transforms

Layout can blur a logo too: an element with fractional width (199.5 px from flexbox), scaling via `transform: scale()`, or an image stretched by `width: 100%`.

**Fix:** give the image integer dimensions — or use SVG, which shrugs these off. If an SVG still looks soft at small sizes, check whether `filter` or `opacity` is forcing the browser to pre-rasterize it.

## Cause 6. Print: 72 dpi instead of 300

Great on screen, mush on business cards. Screen resolution (72–96 dpi) isn't enough for print, which needs 300 dpi. A 1000×1000 px PNG prints sharply at only ~8.5 cm.

**Fix:** send vectors to print (EPS, PDF, SVG — whatever the shop accepts). No vector? Then raster at 300 pixels per inch of physical size.

## Cheat sheet

| Symptom | Cause | Fix |
| --- | --- | --- |
| Blurry everywhere on site | stretched small PNG | SVG or 2× PNG |
| Sharp on monitor, soft on iPhone | retina | 2x rule or SVG |
| "Dirt" around letters | JPG artifacts | find PNG/SVG source |
| Blurry only on one platform | platform recompression | upload exact size |
| Blurry only in print | 72 dpi | vector or 300 dpi |

:::tip The universal answer
Notice the pattern? Almost every row of that table is cured by the word "SVG". Vectors don't depend on slot size, screen density or print dpi. If a platform accepts SVG — always choose it, and the entire class of "blurry logo" problems disappears.
:::

## Step-by-step diagnosis in five minutes

When the blur is there but the cause isn't obvious, walk the chain:

1. **Open the file itself, separately from the site** (drag into a browser, view at 100%). File sharp? The problem is in how it's displayed — go to step 3. File already blurry — step 2.
2. **The file is blurry.** Check its properties: extension (JPG?), pixel dimensions (smaller than needed?). Hunt for a better source — no processing will save this file.
3. **File sharp, site blurry.** Open DevTools (right-click the logo → Inspect) and compare two numbers: the file's real size and its displayed size. Displayed larger than the file → causes 1–2. Sizes match but phones blur → retina, cause 2.
4. **Blur in one place only** (a social network, a marketplace, an email) → the platform recompressed it, cause 4. Compare your upload with a re-downloaded copy — the difference will show.

This sequence covers practically every case and, more importantly, shows **where** to fix: the file, the layout, or the upload settings.

## Can AI upscalers save a blurry logo?

Upscalers (Topaz, Real-ESRGAN, editor built-ins) work miracles on photos, so the temptation is real. The result usually disappoints: on crisp edges and typography, neural networks paint wavy contours, round off letter corners and "invent" details. The correct path for a logo is different — not restoring pixels but **returning to vector**: find the SVG original or redraw ([how to vectorize a logo](../kak-perevesti-logotip-v-vektor/)). An upscaler is acceptable as a stopgap for a secondary image — not for the mark that represents the brand.

## The special case: blur in video and presentations

A corner logo in a video or on a slide blurs for its own reasons:

- **Video compression.** [YouTube](../../logos/media/youtube/) and social platforms compress aggressively, and a small logo suffers first. Cure: a larger logo in frame, a contrasting background, and — for intros — vector animation instead of a static image (see [animated logos](../animirovannyj-logotip/)).
- **Projectors at foreign resolutions.** A 1024×768 projector will stretch your neat deck. Insert SVG into slides (PowerPoint supports it) or double-size PNGs.
- **[Zoom](../../logos/videocall/zoom/)/screen sharing** compresses the stream — a logo always looks worse on a share than locally. That's the channel's limit, not your file's.

## In short

Blur is always a shortage of pixels somewhere: too few in the file, eaten by compression, or not dense enough for retina or print. The fix is one of two things: a vector — or a raster with a 2× margin.

To skip hunting for sharp sources across the internet — every brand in our [logo catalog](../../logos/) comes as an original SVG plus a high-resolution PNG. Download the size you need, no mush included.
