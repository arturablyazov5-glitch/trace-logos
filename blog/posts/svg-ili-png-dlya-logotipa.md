---
title: SVG или PNG для логотипа — что выбрать
title_en: SVG vs PNG for Logos — Which to Choose
description: SVG или PNG — что выбрать для логотипа на сайте, в презентации, соцсетях и печати. Технические различия, сравнительная таблица, типовые ошибки и конвертация между форматами.
description_en: SVG or PNG for a logo — websites, presentations, social media and print. Technical differences, a comparison table, common mistakes, and converting between formats.
date: 2026-06-02
slug: svg-ili-png-dlya-logotipa
tags: SVG, PNG, Форматы
tags_en: SVG, PNG, Formats
---

Когда вы скачиваете логотип бренда, почти всегда стоит выбор между двумя форматами — **SVG** и **PNG**. На экране они могут выглядеть одинаково, но устроены принципиально по-разному, и выбор не туда обычно всплывает не сразу: логотип красиво стоит в макете, а потом «мылится» на Retina-экране или весит в десять раз больше нужного. Разберёмся, чем форматы отличаются на техническом уровне и что выбрать под конкретную задачу.

:::note Коротко
**SVG** — вектор: логотип описан формулами (линии, кривые, заливки), поэтому масштабируется без потери качества и легко перекрашивается. **PNG** — растр: сетка пикселей фиксированного размера, зато формат понимает вообще любая программа, включая старую почту и офисные пакеты. Если сомневаетесь — берите SVG как исходник и получайте из него PNG нужного размера, а не наоборот.
:::

## Чем SVG отличается от PNG технически

**SVG** (Scalable Vector Graphics) — это не картинка в привычном смысле, а текстовый XML-файл с математическим описанием фигур: координаты точек, кривые Безье, заливки и обводки. Когда браузер или редактор открывает SVG, он **вычисляет** пиксели заново под конкретный размер экрана — поэтому линия остаётся идеально чёткой что при 16 пикселях, что при 1600.

**PNG** (Portable Network Graphics) — растровый формат: изображение — это фиксированная сетка пикселей, у каждого из которых записан свой цвет. PNG отлично сжимает однотонные области и поддерживает прозрачность (альфа-канал), поэтому стал стандартом для логотипов на растровых сайтах ещё до эпохи SVG. Но сетка задана раз и навсегда: увеличите PNG больше исходного размера — увидите пикселизацию и размытие, потому что программе приходится **достраивать** несуществующие пиксели, а не вычислять их заново.

| Критерий | SVG | PNG |
| --- | --- | --- |
| Тип | Вектор (формулы) | Растр (пиксели) |
| Масштабирование | Без потери качества, любой размер | Только вниз без потерь; вверх — размытие |
| Вес файла | Обычно меньше для простых логотипов | Больше, особенно в высоком разрешении |
| Перекраска | Легко — меняете значения `fill` | Нужен редактор, перерисовка пикселей |
| Прозрачный фон | Да, нативно | Да, через альфа-канал |
| Поддержка в почте/мессенджерах | Не везде корректно | Везде |
| Редактирование в [Figma](../../logos/design/figma/)/[Illustrator](../../logos/design/illustrator/) | Полное — форма, узлы, цвет | Ограничено — это картинка, а не объект |
| Анимация | Возможна (SMIL, CSS) | Нет (нужен GIF/видео) |
| Печать в типографии | Подходит без ограничений | Не подходит выше исходного разрешения |

## Когда использовать SVG

- **Веб-сайты и интерфейсы.** SVG весит меньше для большинства логотипов, масштабируется под любой экран и остаётся чётким на Retina-дисплеях без подключения `@2x`-версий.
- **[Figma](../../logos/design/figma/), Sketch и другие редакторы.** Вектор можно перекрасить, разобрать на части, отредактировать узлы — при работе над макетом это критично.
- **Печать в типографии.** Для полиграфии нужен вектор — он не теряет качество ни при каком размере, от визитки до баннера на здании.
- **Анимация логотипа.** SVG поддерживает CSS- и SMIL-анимацию прямо в браузере, без видеофайла.

## Когда использовать PNG

- **Письма и мессенджеры.** Не все почтовые клиенты и чаты корректно показывают SVG — иногда он просто не рендерится или считается вложением. PNG откроется гарантированно.
- **Презентации.** PowerPoint и Google Slides значительно надёжнее работают с PNG — вставка SVG там либо недоступна, либо теряет часть эффектов.
- **Соцсети.** Загрузка аватарок и обложек почти везде требует растровый формат — платформы сами конвертируют его в свой формат при загрузке.
- **Сложные логотипы с эффектами** — градиентами, тенями, текстурами, фотореалистичными деталями, которые тяжело или невозможно корректно описать вектором.
- **Скриншоты и превью.** Если логотип встраивается в готовое изображение (например, OG-картинку для соцсетей), там уже используется растр — вставлять туда SVG бессмысленно.

## Частые ошибки при выборе формата

:::warning PNG вместо SVG на сайте
Самая частая ошибка — вставить в шапку сайта PNG-логотип на 512 пикселей и растягивать его CSS-ом под нужный размер. На обычном экране незаметно, а на Retina-дисплее логотип «плывёт» и выглядит смазанным. Если для логотипа существует SVG — используйте его в вебе всегда, вне зависимости от размера макета.
:::

:::warning SVG там, где его не поддерживают
Обратная ошибка — вставить SVG-логотип в письмо рассылки или презентацию. Часть почтовых клиентов (особенно корпоративных, на базе Outlook) не отображает SVG вообще — получатель увидит пустое место вместо логотипа. Для писем, слайдов и офисных документов используйте PNG.
:::

:::warning Увеличение PNG сверх исходного размера
Если единственный доступный файл — PNG 200×200, а нужен баннер 2000×2000, растягивание убьёт качество: пиксели просто размножатся, а не пересчитаются. В этом случае логотип нужно либо найти в SVG, либо перевести в вектор — у нас есть отдельный разбор, [как перевести логотип в вектор](../kak-perevesti-logotip-v-vektor/).
:::

## Как конвертировать SVG в PNG

На каждой странице логотипа в нашем каталоге доступны обе кнопки — скачать **SVG** и **PNG** — готовыми, без конвертации. Если нужен PNG нестандартного размера, откройте SVG в [Figma](../../logos/design/figma/) или браузере и экспортируйте в нужном разрешении: так вы получите чёткую картинку под конкретную задачу, а не растянутый компромисс. Подробный разбор пяти способов конвертации — в статье [«Как конвертировать SVG в PNG и обратно»](../kak-konvertirovat-svg-v-png/).

Обратная конвертация — PNG в SVG — не такая простая операция: программа не может «угадать» исходные кривые, только трассировать контуры автоматически или отрисовать логотип заново вручную. Если у вас есть только растровая версия логотипа, смотрите статью [«Как перевести логотип в вектор»](../kak-perevesti-logotip-v-vektor/).

## SVG и PNG — не единственные форматы

Для логотипов кроме SVG и PNG существуют AI, EPS и PDF (векторные, для профессиональной печати и работы с типографиями) и JPG (растровый, без прозрачности, для фото). Если нужен более широкий обзор всех форматов логотипа и когда какой уместен — читайте [«В каком формате должен быть логотип»](../v-kakom-formate-nuzhen-logotip/).

## Короткий вывод

Если сомневаетесь — **берите SVG**. Это «исходник», из которого всегда можно получить PNG любого размера без потери качества, а не наоборот. PNG нужен там, где SVG не поддерживается или не подходит по формату задачи: почта, презентации, часть соцсетей, логотипы со сложными графическими эффектами.

Все логотипы в [каталоге Trace Logo's](../../logos/) доступны и в SVG, и в PNG — скачивайте бесплатно.

---EN---

When you download a brand logo, you almost always face a choice between two formats — **SVG** and **PNG**. On screen they can look identical, but they're built on fundamentally different principles, and picking the wrong one rarely shows up right away: the logo sits nicely in the mockup, then turns blurry on a Retina display or ends up ten times heavier than it needs to be. Let's break down the technical difference and which one fits which job.

:::note TL;DR
**SVG** is vector: the logo is described with math (lines, curves, fills), so it scales without quality loss and recolors easily. **PNG** is raster: a fixed-size pixel grid, but it's understood by literally every program, including old email clients and office software. When in doubt, keep SVG as the source and generate PNG at whatever size you need from it — not the other way around.
:::

## The technical difference between SVG and PNG

**SVG** (Scalable Vector Graphics) isn't a picture in the usual sense — it's a text-based XML file with a mathematical description of shapes: point coordinates, Bézier curves, fills and strokes. When a browser or editor opens an SVG, it **recalculates** the pixels fresh for the target size — so a line stays perfectly crisp whether it's rendered at 16 pixels or 1,600.

**PNG** (Portable Network Graphics) is a raster format: the image is a fixed grid of pixels, each with its own recorded color. PNG compresses flat-colored areas well and supports transparency (alpha channel), which made it the standard for logos on raster-only sites long before SVG became common. But the grid is fixed once and for all: scale a PNG beyond its original size and you'll see pixelation and blur, because the software has to **invent** pixels that don't exist rather than recalculate them.

| Criterion | SVG | PNG |
| --- | --- | --- |
| Type | Vector (math) | Raster (pixels) |
| Scaling | No quality loss, any size | Fine scaling down; blurs scaling up |
| File size | Usually smaller for simple logos | Larger, especially at high resolution |
| Recoloring | Easy — change the `fill` values | Needs an editor, pixel repainting |
| Transparent background | Yes, natively | Yes, via alpha channel |
| Email/messenger support | Inconsistent | Universal |
| Editing in [Figma](../../logos/design/figma/)/[Illustrator](../../logos/design/illustrator/) | Full — shape, nodes, color | Limited — it's a picture, not an object |
| Animation | Possible (SMIL, CSS) | No (needs GIF/video) |
| Print shop output | Works without limits | Doesn't scale past source resolution |

## When to use SVG

- **Websites and interfaces.** SVG is lighter for most logos, scales to any screen, and stays crisp on Retina displays without needing separate `@2x` files.
- **[Figma](../../logos/design/figma/), Sketch and other editors.** Vector can be recolored, broken into parts, edited node by node — essential when working on a layout.
- **Print production.** Print shops need vector — it doesn't lose quality at any size, from a business card to a building-sized banner.
- **Logo animation.** SVG supports CSS and SMIL animation directly in the browser, no video file needed.

## When to use PNG

- **Email and messengers.** Not every email client or chat app renders SVG correctly — sometimes it just doesn't display or gets treated as an attachment. PNG opens reliably everywhere.
- **Presentations.** PowerPoint and Google Slides work far more reliably with PNG — SVG insertion is either unavailable there or loses some effects.
- **Social media.** Uploading avatars and cover images almost everywhere requires a raster format — the platform converts it to its own format on upload regardless.
- **Complex logos with effects** — gradients, shadows, textures, photorealistic detail that's hard or impossible to describe accurately as vector.
- **Screenshots and previews.** If the logo is embedded into a finished image (an OG card for social media, for instance), that image is already raster — inserting SVG there is pointless.

## Common mistakes when choosing a format

:::warning PNG instead of SVG on a website
The most common mistake: drop a 512px PNG logo into a site header and stretch it with CSS to fit. Invisible on a regular screen, but on a Retina display the logo "swims" and looks smudged. If an SVG exists for the logo, use it on the web regardless of the layout size.
:::

:::warning SVG where it isn't supported
The opposite mistake: inserting an SVG logo into a newsletter or a presentation. Many email clients (especially corporate, Outlook-based ones) don't render SVG at all — the recipient sees blank space instead of a logo. Use PNG for emails, slides, and office documents.
:::

:::warning Scaling a PNG past its source size
If the only file you have is a 200×200 PNG and you need a 2,000×2,000 banner, stretching it will ruin the quality — the pixels just multiply instead of being recalculated. In that case, either find the SVG or trace the logo back to vector — see our guide, [how to convert a logo to vector](../kak-perevesti-logotip-v-vektor/).
:::

## How to convert SVG to PNG

Every logo page in our catalog already has both buttons — download **SVG** and **PNG** — ready-made, no conversion needed. If you need a PNG at a custom size, open the SVG in [Figma](../../logos/design/figma/) or a browser and export at the resolution you need: that gives you a crisp image for the specific job, instead of a stretched compromise. For a full rundown of five conversion methods, see [How to Convert SVG to PNG and Back](../kak-konvertirovat-svg-v-png/).

The reverse — PNG to SVG — isn't as simple: software can't "guess" the original curves, only auto-trace the outlines or have someone redraw the logo by hand. If all you have is a raster version of a logo, see [How to Convert a Logo to Vector](../kak-perevesti-logotip-v-vektor/).

## SVG and PNG aren't the only options

Beyond SVG and PNG, logo formats also include AI, EPS and PDF (vector, for professional printing and print shops) and JPG (raster, no transparency, meant for photos). For a broader overview of every logo format and when each one applies, see [What Format Should a Logo Be In](../v-kakom-formate-nuzhen-logotip/).

## The short answer

When in doubt — **take SVG**. It's the "source file" from which you can always get a PNG at any size without quality loss, not the other way around. PNG is for places where SVG isn't supported or doesn't fit the job: email, presentations, some social networks, logos with complex graphical effects.

All logos in the [Trace Logo's catalog](../../logos/) are available in both SVG and PNG — download for free.
