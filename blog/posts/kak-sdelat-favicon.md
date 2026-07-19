---
title: Фавикон для сайта в 2026 году — форматы, размеры и правильный HTML
title_en: Favicons in 2026 — Formats, Sizes and the Right HTML
description: Какие файлы фавикона реально нужны в 2026 году: SVG, ICO, PNG и apple-touch-icon. Минимальный набор из 4 файлов, готовый HTML-код и типичные ошибки.
description_en: Which favicon files you actually need in 2026 — SVG, ICO, PNG and apple-touch-icon. A minimal 4-file set, ready-to-paste HTML and common mistakes.
date: 2026-06-18
slug: kak-sdelat-favicon
tags: Фавикон, Сайты, SVG
tags_en: Favicon, Websites, SVG
---

Фавикон — это иконка размером с ноготь, которую видит каждый посетитель сайта: во вкладке браузера, в закладках, в истории и — что важнее всего — в поисковой выдаче Яндекса и Google рядом с вашей ссылкой. Сайт без фавикона в выдаче выглядит как объявление без фотографии. При этом вокруг фавиконов накопилось безумное количество устаревших советов — «сгенерируйте 30 файлов на все случаи». Спойлер: в 2026 году нужно четыре.

:::note Коротко
Современный минимум: **favicon.ico** (32×32, для старых браузеров и запросов по умолчанию), **favicon.svg** (масштабируется куда угодно и поддерживает тёмную тему), **apple-touch-icon.png** (180×180, для iPhone и iPad) и **PNG 192×192** для Android. Всё. Остальные 26 файлов из старых гайдов можно не делать.
:::

## Зачем фавикон вообще нужен

- **Вкладки браузера.** Когда открыто двадцать вкладок, пользователь находит вашу по иконке, а не по тексту.
- **Поисковая выдача.** И Яндекс, и Google показывают фавикон рядом со сниппетом. Нет иконки — на её месте серый глобус, и CTR страдает.
- **Закладки и главный экран телефона.** Сохранённый на домашний экран сайт получает вашу иконку — или уродливую заглушку.

## Минимальный набор файлов

| Файл | Размер | Для кого |
| --- | --- | --- |
| favicon.ico | 32×32 | старые браузеры, дефолтный запрос `/favicon.ico` |
| favicon.svg | вектор | современные браузеры, тёмная тема |
| apple-touch-icon.png | 180×180 | iPhone/iPad, «На экран Домой» |
| icon-192.png | 192×192 | Android, PWA-манифест |

И код, который это подключает:

```
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

Файл favicon.ico кладите в корень сайта даже если он подключён через `<link>` — браузеры, боты и RSS-читалки до сих пор ходят по адресу `/favicon.ico` напрямую.

## Почему SVG-фавикон — это удобно

Во-первых, один файл закрывает все размеры: браузер сам отрендерит его хоть в 16, хоть в 512 пикселей. Во-вторых, SVG-фавикон умеет **адаптироваться к тёмной теме** — прямо внутри файла работает media query:

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <style>
    path { fill: #000; }
    @media (prefers-color-scheme: dark) {
      path { fill: #fff; }
    }
  </style>
  <path d="..."/>
</svg>
```

Чёрный логотип во вкладке светлой темы, белый — в тёмной. С PNG такой трюк невозможен.

## Как сделать фавикон из логотипа

1. **Возьмите знак, а не полный логотип.** Текстовая часть в 16 пикселях нечитаема. Нужна иконка: буква, символ, упрощённый знак. У [Сбера](../../logos/bank/sber/) во вкладке — галочка-круг, а не слово «[Сбер](../../logos/bank/sber/)».
2. **Упростите.** Уберите мелкие детали, тонкие линии, градиенты из трёх цветов. Проверка простая: уменьшите иконку до 16×16 и посмотрите — узнаётся ли.
3. **Сделайте квадратную композицию.** Фавикон — квадрат. Вытянутый логотип в нём превратится в полоску; знак должен занимать почти весь квадрат с небольшими полями.
4. **Экспортируйте набор.** Из SVG-исходника получите ICO (32×32) и два PNG (180 и 192). Это умеет любой генератор фавиконов, [Figma](../../logos/design/figma/) или командная строка.

:::tip Про скруглённые углы
Не скругляйте углы у apple-touch-icon сами — iOS сделает это автоматически. А вот фон ему нужен непрозрачный: прозрачные места iOS зальёт чёрным, и иконка может выглядеть неожиданно мрачно.
:::

## Типичные ошибки

:::danger Так делать не надо
- **Ставить полноцветный детальный логотип** — в 16 пикселях он превращается в шум.
- **Генерировать 30 файлов по гайду 2015 года** — msapplication-тайлы, иконки под давно мёртвые устройства. Мусор в корне и в `<head>`.
- **Забывать про `/favicon.ico` в корне** — часть ботов и сервисов не читает `<link>`-теги.
- **Один PNG 16×16 на всё** — на ретина-экранах и в закладках будет мыло, а поисковики любят иконки покрупнее.
:::

## Как проверить, что всё работает

1. Откройте сайт в режиме инкогнито — кэш фавиконов у браузеров свирепый, обычное обновление страницы иконку не сменит.
2. Проверьте `https://ваш-сайт/favicon.ico` напрямую — должен отдаваться файл, а не 404.
3. Добавьте сайт на домашний экран iPhone — увидите свой apple-touch-icon.
4. Смена фавикона в выдаче Яндекса и Google происходит не мгновенно: поисковики перекачивают иконки со своим расписанием, это может занять от нескольких дней до пары недель.

## Фавикон и поисковики: требования Яндекса и Google

Для выдачи у поисковиков есть свои предпочтения, и они отличаются:

- **Google** берёт фавикон с корня сайта (одна иконка на весь домен), просит размер кратный 48 пикселям (48, 96, 144) или SVG и может не показывать иконку, если считает её неподходящей — например, с мелким нечитаемым содержимым. Иконка в выдаче обновляется при перекраулинге главной.
- **Яндекс** поддерживает SVG-фавиконы и крупные PNG; в выдаче на мобильных иконка стоит рядом с каждым результатом, так что её вклад в CTR у Яндекса даже заметнее. Форсировать обновление можно через перекраул в Вебмастере.
- **Обе системы** не любят: пустые/белые иконки (сливаются с фоном выдачи), иконки-заглушки CMS (стандартный фавикон WordPress выдаёт шаблонный сайт) и несоответствие тематике.

Практический вывод: фавикон — это фактор кликабельности в выдаче, то есть напрямую SEO-инструмент. Сайт с узнаваемой иконкой собирает больше кликов при той же позиции.

## PWA и manifest.json: иконки для «установки» сайта

Если сайт можно добавить на главный экран как приложение (PWA), браузер ищет иконки в манифесте:

```
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Ключевой нюанс — **maskable-иконка**: Android обрезает её под форму лончера (круг, скруглённый квадрат), поэтому знак должен сидеть в центральной «безопасной зоне» (~80% диаметра), а фон — заливать весь холст. Это ровно та же логика адаптивных иконок, что и у нативных приложений (мы разбирали её в статье [про иконки приложений](../ikonka-prilozheniya/)). Проверить свою maskable-иконку можно в онлайн-инструменте maskable.app.

## Тонкости, о которых спрашивают чаще всего

**Можно ли анимированный фавикон?** Технически GIF-фавиконы поддерживает часть браузеров, но не делайте этого: мигающая вкладка раздражает, а поисковики анимацию игнорируют. Единственная легитимная «анимация» — смена фавикона из JS для индикации (непрочитанные уведомления, статус звонка), как делают почтовые веб-клиенты.

**Почему фавикон не обновляется у посетителей?** Кэш фавиконов — самый живучий в браузере: он переживает обычную очистку кэша. Смените имя файла (favicon-v2.svg) и обновите пути в `<link>` — это гарантированно собьёт кэш всем.

**Нужен ли отдельный фавикон для поддоменов?** Да, каждый поддомен (blog.site.ru, app.site.ru) — отдельный сайт для браузера и поисковика: положите иконки и на них, иначе получите глобусы.

**Что делать, если знак бренда не читается в 16 пикселях?** Сделайте для фавикона специальную упрощённую версию: одну букву, фрагмент знака, просто фирменный цвет с простой формой. Это нормальная практика — фавикон многих брендов отличается от полного логотипа.

## Коротко

Четыре файла — ico, svg, два png — плюс три строчки в `<head>`, и ваш сайт выглядит по-взрослому во вкладках, закладках и поисковой выдаче. Начинается всё с векторного знака: если у вас есть SVG логотипа, фавикон из него делается за десять минут.

Векторные знаки почти любого известного бренда — в нашем [каталоге логотипов](../../logos/): скачивайте SVG, упрощайте до знака и собирайте фавикон. А если нужен просто символ или эмодзи для пет-проекта — загляните в [каталог эмодзи](../../emoji/).

---EN---

A favicon is the fingernail-sized icon every visitor sees: in the browser tab, in bookmarks, in history and — most importantly — in Yandex and Google search results next to your link. A site without one looks like a listing without a photo. Meanwhile the internet is full of outdated advice — "generate 30 files for every device". Spoiler: in 2026 you need four.

:::note TL;DR
The modern minimum: **favicon.ico** (32×32, for legacy browsers and default requests), **favicon.svg** (scales anywhere and supports dark mode), **apple-touch-icon.png** (180×180) and a **192×192 PNG** for Android. That's it. The other 26 files from old guides can stay ungenerated.
:::

## Why bother

- **Browser tabs.** With twenty tabs open, users find yours by icon, not text.
- **Search results.** Both Google and Yandex show favicons next to snippets. No icon — a gray globe takes its place, and CTR suffers.
- **Bookmarks and phone home screens.** A site saved to the home screen gets your icon — or an ugly placeholder.

## The minimal file set

| File | Size | Audience |
| --- | --- | --- |
| favicon.ico | 32×32 | legacy browsers, default `/favicon.ico` requests |
| favicon.svg | vector | modern browsers, dark mode |
| apple-touch-icon.png | 180×180 | iPhone/iPad, "Add to Home Screen" |
| icon-192.png | 192×192 | Android, PWA manifest |

And the HTML that wires it up:

```
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

Keep favicon.ico in the site root even with the `<link>` present — bots, RSS readers and older software still request `/favicon.ico` directly.

## Why an SVG favicon is worth it

One file covers every size: the browser renders it at 16 or 512 pixels equally well. And an SVG favicon can **adapt to dark mode** — a media query works right inside the file:

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <style>
    path { fill: #000; }
    @media (prefers-color-scheme: dark) {
      path { fill: #fff; }
    }
  </style>
  <path d="..."/>
</svg>
```

Black logo on a light tab, white on a dark one. Impossible with PNG.

## Making a favicon from a logo

1. **Use the mark, not the full logo.** Text is unreadable at 16 pixels. You need an icon: a letter, a symbol, a simplified mark.
2. **Simplify.** Drop fine details, thin lines, three-stop gradients. The test: shrink to 16×16 — is it still recognizable?
3. **Make it square.** A favicon is a square; a wide wordmark becomes a stripe in it. The mark should fill most of the square with small margins.
4. **Export the set.** From the SVG master, produce the ICO (32×32) and two PNGs (180 and 192) — any favicon generator, [Figma](../../logos/design/figma/) or the command line will do.

:::tip About rounded corners
Don't round the apple-touch-icon yourself — iOS does it automatically. But do give it an opaque background: iOS fills transparency with black, which can look unexpectedly grim.
:::

## Common mistakes

:::danger Don't do this
- **Using the full-color detailed logo** — at 16 pixels it turns to noise.
- **Generating 30 files per a 2015 guide** — msapplication tiles and icons for long-dead devices. Junk in your root and your `<head>`.
- **Forgetting `/favicon.ico` in the root** — some bots never read `<link>` tags.
- **One 16×16 PNG for everything** — blurry on retina screens, and search engines prefer larger icons.
:::

## Verifying it works

1. Open the site in incognito — favicon caches are ferocious; a normal refresh won't update the icon.
2. Request `https://your-site/favicon.ico` directly — it must not 404.
3. Add the site to an iPhone home screen — you should see your apple-touch-icon.
4. Search results update on the engines' own schedule — expect days to a couple of weeks.

## Favicons and search engines: Google's and Yandex's requirements

Search engines have their own preferences, and they differ:

- **Google** takes the favicon from the site root (one icon per domain), asks for sizes in multiples of 48 pixels (48, 96, 144) or SVG, and may refuse to show an icon it deems unsuitable — e.g. with tiny unreadable content. The icon refreshes when the homepage is recrawled.
- **Yandex** supports SVG favicons and large PNGs; on mobile results the icon sits next to every listing, so its CTR contribution is even more visible. A recrawl can be requested via Webmaster tools.
- **Both engines** dislike: empty/white icons (they merge with the results background), CMS placeholder icons (the default WordPress favicon screams template site) and topical mismatch.

The practical takeaway: a favicon is a click-through factor in search — a direct SEO instrument. A site with a recognizable icon collects more clicks at the same position.

## PWA and manifest.json: icons for "installing" the site

If your site can be added to the home screen as an app (PWA), the browser looks for icons in the manifest:

```
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

The key nuance is the **maskable icon**: Android crops it to the launcher's shape (circle, rounded square), so the mark must sit in the central safe zone (~80% of the diameter) with the background filling the whole canvas. It's the same adaptive-icon logic as native apps ([our app icon article](../ikonka-prilozheniya/)). Test yours at maskable.app.

## The fine points people ask about most

**Can a favicon be animated?** Some browsers technically support GIF favicons — don't. A blinking tab irritates, and search engines ignore animation. The one legitimate "animation" is swapping the favicon from JS as an indicator (unread counts, call status), as webmail clients do.

**Why don't visitors see the new favicon?** The favicon cache is the browser's most stubborn: it survives a regular cache clear. Rename the file (favicon-v2.svg) and update the `<link>` paths — that reliably busts it for everyone.

**Do subdomains need their own favicons?** Yes — each subdomain (blog.site.com, app.site.com) is a separate site to browsers and search engines: give them icons too, or collect gray globes.

**What if the brand mark is unreadable at 16 pixels?** Make a dedicated simplified version for the favicon: one letter, a fragment of the mark, or just the brand color in a simple shape. Perfectly normal practice — many brands' favicons differ from their full logos.

## In short

Four files — ico, svg, two pngs — plus three lines in `<head>`, and your site looks professional in tabs, bookmarks and search results. It all starts with a vector mark: with an SVG of your logo, the favicon takes ten minutes.

Vector marks for nearly any known brand live in our [logo catalog](../../logos/) — download the SVG, simplify to the mark, build the favicon. Need just a symbol or an emoji for a side project? Check the [emoji catalog](../../emoji/).
