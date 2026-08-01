---
title: Что такое WebP — стоит ли переводить картинки сайта на этот формат
title_en: What Is WebP — Should Your Site Switch to It
description: Формат WebP простыми словами: чем лучше PNG и JPG, поддержка прозрачности и анимации, совместимость с браузерами, как конвертировать. Когда WebP не нужен.
description_en: The WebP format explained: how it beats PNG and JPG, transparency and animation support, browser compatibility, conversion. When you don't need it.
date: 2026-07-25
slug: chto-takoe-webp
tags: Форматы, Веб, Оптимизация
tags_en: Formats, Web, Optimization
---

Скачали картинку, а она в непонятном «.webp», и любимый редактор её не открывает? Или наоборот — оптимизируете сайт, и все руководства хором советуют «переведите изображения на WebP»? Разбираем, что это за формат, почему он захватил веб, насколько он действительно легче PNG и JPG — и в каких случаях гнаться за ним не стоит.

:::note Коротко
**WebP** — формат изображений от Google (2010), созданный специально для веба. Умеет всё сразу: сжатие с потерями (как JPG) и без потерь (как PNG), прозрачность и анимацию (как GIF). В среднем файлы на **25‑35% легче JPG** и на **~26% легче PNG** при том же видимом качестве. Поддерживается всеми современными браузерами. Не подходит для: печати, векторных логотипов (там нужен SVG) и как формат‑исходник.
:::

## Откуда взялся WebP

К концу 2000‑х веб жил на трёх форматах‑ветеранах: JPG (1992) для фото, PNG (1996) для графики с прозрачностью, GIF (1987) для анимации. Каждый решал одну задачу и тянул за собой ограничения своей эпохи. В 2010 году Google представил WebP — формат на базе видеокодека VP8, спроектированный под единственную цель: **уменьшить трафик веба**. Логика простая: изображения — самая тяжёлая часть страниц, а Google‑поиску и Chrome выгодно, чтобы веб грузился быстрее.

## Что умеет WebP

Главная особенность формата — он объединяет возможности всех трёх ветеранов:

| Возможность | JPG | PNG | GIF | WebP |
| --- | --- | --- | --- | --- |
| Сжатие с потерями | ✅ | ⛔ | ⛔ | ✅ |
| Сжатие без потерь | ⛔ | ✅ | ⛔ | ✅ |
| Прозрачность | ⛔ | ✅ | частично | ✅ |
| Анимация | ⛔ | ⛔ | ✅ | ✅ |

На практике это означает: фотографию можно сжать сильнее, чем в JPG, без видимой разницы; логотип с прозрачным фоном — легче, чем в PNG; анимацию — кратно легче, чем в GIF. Про базовую разницу подходов к сжатию мы подробно писали в статье [PNG или JPG — что лучше](../png-ili-jpg-chto-luchshe/).

## Сколько реально экономит WebP

Официальные замеры Google: с потерями WebP на 25‑34% легче JPG сопоставимого качества, без потерь — на ~26% легче PNG. Наш собственный опыт совпадает: превью PNG‑логотипов в каталоге Trace Logos отдаются в WebP и весят в среднем на **95‑98% меньше** оригиналов — правда, тут работает ещё и уменьшение размеров под сетку карточек.

:::tip Где экономия максимальна
Сильнее всего WebP выигрывает на «фотографической» графике с прозрачностью — то, что раньше приходилось сохранять в тяжёлый PNG‑24, потому что JPG не умеет прозрачность. Такие файлы худеют в разы. На маленьких простых картинках (иконки 16×16) разница почти незаметна.
:::

## Поддержка: можно ли уже не бояться

Да. С 2020 года WebP поддерживают все актуальные браузеры: [Chrome](../../logos/search/chrome/), [Safari](../../logos/search/safari/) (с macOS Big Sur / iOS 14), [Firefox](../../logos/search/firefox/), [Edge](../../logos/search/edge/), [Opera](../../logos/search/opera/) и [Яндекс Браузер](../../logos/search/yandexbrowser/). Проблемы остались за пределами браузеров:

- **Старые редакторы и просмотрщики** могут не открывать WebP (лечится обновлением или конвертацией).
- **Некоторые соцсети и мессенджеры** при загрузке конвертируют WebP сами или не принимают его.
- **Печать и полиграфия** — типографиям нужен TIFF/PDF/PNG, WebP там не формат.

Если файл не открывается — конвертируйте обратно: любой онлайн‑конвертер, macOS Просмотр («Экспортировать как…») или даже вставка в [Figma](../../logos/design/figma/) с последующим экспортом в PNG решают задачу за минуту.

## Как перевести картинки в WebP

- **Онлайн:** Squoosh (проект Google — с наглядным сравнением «до/после» и ползунком качества), Convertio и десятки аналогов.
- **Командная строка:** официальная утилита `cwebp input.png -q 80 -o output.webp` — качество 75‑85 закрывает большинство задач.
- **Автоматически на сайте:** сборщики и CDN (Vercel, Cloudflare, ImageKit) конвертируют картинки в WebP на лету и отдают браузеру лучший поддерживаемый формат — самый правильный путь для больших сайтов.
- **Экспорт из редакторов:** [Photoshop](../../logos/design/photoshop/) (начиная с версии 23.2) и Figma экспортируют в WebP напрямую.

В HTML классический паттерн постепенного внедрения — тег `<picture>`: браузер сам выберет WebP, а старый клиент получит PNG‑запасной вариант. Подробнее о вставке графики — в статье [как вставить SVG на сайт](../kak-vstavit-svg-na-sajt/).

## Когда WebP не нужен

1. **Векторные логотипы и иконки.** WebP — растровый формат. Логотип в нём [поплывёт при масштабировании](../pochemu-logotip-razmytyj/); правильный выбор — SVG (разбор — в статье [SVG или PNG для логотипа](../svg-ili-png-dlya-logotipa/)).
2. **Исходники.** Храните оригиналы в PNG/TIFF или векторе, а WebP генерируйте как производный формат для отдачи. Пережатие «с потерями поверх потерь» деградирует картинку.
3. **Печать.** Типографии WebP не ждут.
4. **Когда уже есть AVIF.** Более новый формат AVIF сжимает ещё сильнее WebP (в среднем на 20‑30%), но медленнее кодируется. Для максимальной оптимизации современный стек — AVIF + WebP‑фолбэк; для простоты — просто WebP.

## Как это устроено у нас

Каталог Trace Logos использует ровно описанную схему: исходники логотипов хранятся в SVG и полноразмерных PNG, а для сетки карточек автоматически генерируются лёгкие WebP‑превью. Открывая [каталог](../../logos/), вы грузите мегабайты вместо десятков мегабайт — а скачивая логотип, получаете полноценный исходник в [нужном формате](../v-kakom-formate-nuzhen-logotip/).

---EN---

Downloaded an image and it's some mysterious ".webp" your favorite editor won't open? Or the other way around — you're optimizing a site and every guide chants "convert your images to WebP"? Let's unpack what the format is, why it took over the web, how much lighter than PNG and JPG it really is — and when chasing it isn't worth it.

:::note TL;DR
**WebP** is an image format by Google (2010) built specifically for the web. It does everything at once: lossy compression (like JPG), lossless (like PNG), transparency and animation (like GIF). Files are on average **25–35% lighter than JPG** and **~26% lighter than PNG** at the same visible quality. Supported by every modern browser. Not for: print, vector logos (that's SVG territory) or as a master format.
:::

## Where WebP came from

By the late 2000s the web ran on three veteran formats: JPG (1992) for photos, PNG (1996) for graphics with transparency, GIF (1987) for animation. Each solved one problem and dragged along the limitations of its era. In 2010 Google introduced WebP — a format based on the VP8 video codec, designed with a single goal: **shrink web traffic**. The logic is simple: images are the heaviest part of pages, and both Google Search and Chrome benefit from a faster web.

## What WebP can do

The format's headline feature: it merges the abilities of all three veterans:

| Capability | JPG | PNG | GIF | WebP |
| --- | --- | --- | --- | --- |
| Lossy compression | ✅ | ⛔ | ⛔ | ✅ |
| Lossless compression | ⛔ | ✅ | ⛔ | ✅ |
| Transparency | ⛔ | ✅ | partial | ✅ |
| Animation | ⛔ | ⛔ | ✅ | ✅ |

In practice: a photo compresses smaller than JPG with no visible difference; a transparent logo weighs less than PNG; animation is several times lighter than GIF. The underlying difference between compression approaches is covered in [PNG vs JPG](../png-ili-jpg-chto-luchshe/).

## How much WebP actually saves

Google's official numbers: lossy WebP is 25–34% smaller than comparable JPG, lossless is ~26% smaller than PNG. Our own experience agrees: the PNG logo previews in the Trace Logos catalog are served as WebP and weigh on average **95–98% less** than the originals — though resizing to card-grid dimensions does part of that work.

:::tip Where the savings peak
WebP wins biggest on photographic imagery with transparency — the stuff that previously had to be saved as heavy PNG-24 because JPG can't do alpha. Those files shrink severalfold. On tiny simple images (16×16 icons) the difference is barely visible.
:::

## Support: is it safe yet

Yes. Since 2020 WebP is supported by every current browser: [Chrome](../../logos/search/chrome/), [Safari](../../logos/search/safari/) (since macOS Big Sur / iOS 14), [Firefox](../../logos/search/firefox/), [Edge](../../logos/search/edge/), [Opera](../../logos/search/opera/) and [Yandex Browser](../../logos/search/yandexbrowser/). Remaining friction lives outside browsers:

- **Older editors and viewers** may not open WebP (fix: update or convert).
- **Some social networks and messengers** convert WebP on upload or reject it.
- **Print shops** want TIFF/PDF/PNG; WebP isn't a print format.

If a file won't open — convert it back: any online converter, macOS Preview ("Export As…"), or pasting into [Figma](../../logos/design/figma/) and exporting PNG takes a minute.

## How to convert images to WebP

- **Online:** Squoosh (a Google project with a before/after slider), Convertio and dozens of others.
- **Command line:** the official tool — `cwebp input.png -q 80 -o output.webp`; quality 75–85 covers most cases.
- **Automatically on your site:** bundlers and CDNs (Vercel, Cloudflare, ImageKit) convert on the fly and serve each browser the best format it supports — the right path for large sites.
- **Editor export:** [Photoshop](../../logos/design/photoshop/) (since 23.2) and Figma export WebP directly.

In HTML the classic gradual-adoption pattern is the `<picture>` tag: the browser picks WebP, older clients get the PNG fallback. More on embedding graphics: [how to embed SVG on a website](../kak-vstavit-svg-na-sajt/).

## When you don't need WebP

1. **Vector logos and icons.** WebP is raster. A logo in it [blurs when scaled](../pochemu-logotip-razmytyj/); the right choice is SVG (see [SVG vs PNG for logos](../svg-ili-png-dlya-logotipa/)).
2. **Masters.** Keep originals in PNG/TIFF or vector and generate WebP as a derived delivery format. Re-compressing lossy over lossy degrades the image.
3. **Print.** Print shops don't take WebP.
4. **When you already use AVIF.** The newer AVIF compresses another 20–30% beyond WebP but encodes slower. For maximum optimization the modern stack is AVIF + WebP fallback; for simplicity — just WebP.

## How we do it

The Trace Logos catalog uses exactly this scheme: logo masters live as SVG and full-size PNG, while lightweight WebP previews are generated automatically for the card grid. Browsing the [catalog](../../logos/) you load megabytes instead of tens of megabytes — and when you download a logo you get the full master in [the format you need](../v-kakom-formate-nuzhen-logotip/).
