---
title: Фавикон для сайта в 2026 году — форматы, размеры и правильный HTML
title_en: Favicons in 2026 — Formats, Sizes and the Right HTML
description: Какие файлы фавикона реально нужны в 2026 году: SVG, ICO, PNG и apple‑touch‑icon. Минимальный набор из 4 файлов, готовый HTML‑код и типичные ошибки.
description_en: Which favicon files you actually need in 2026 — SVG, ICO, PNG and apple-touch-icon. A minimal 4-file set, ready-to-paste HTML and common mistakes.
date: 2026-06-18
slug: kak-sdelat-favicon
tags: Фавикон, Сайты, SVG
tags_en: Favicon, Websites, SVG
---

Откройте выдачу Яндекса или [Google](../../logos/search/google/) по любому запросу и посмотрите на левый край результатов. Рядом с каждой ссылкой стоит крошечная иконка сайта, и там, где её нет, поисковик рисует серый глобус. Пользователь выбирает, на что кликнуть, в том числе по этой картинке, а значит, главная работа фавикона происходит здесь, в самом конкурентном месте интернета. Во вкладке браузера его замечают лишь мельком. Из этого следует и требование к нему (читаемость в 16 пикселях), и ответ на вопрос, сколько файлов нужно готовить. Старые гайды требуют тридцати. Сегодня хватает четырёх, и дальше разберём почему.

:::note Коротко
Современный минимум: **favicon.ico** (32×32, для старых браузеров и запросов по умолчанию), **favicon.svg** (масштабируется куда угодно и поддерживает тёмную тему), **apple‑touch‑icon.png** (180×180, для iPhone и iPad) и **PNG 192×192** для Android. Остальные 26 файлов из гайдов десятилетней давности делать незачем.
:::

## Где фавикон реально работает

Три сценария показа отличаются по цене ошибки, и начинать стоит с самого дорогого.

**Поисковая выдача.** И Яндекс, и [Google](../../logos/search/google/) ставят иконку рядом со сниппетом, на мобильных — у каждого результата. Пустое место на её месте означает потерянные клики при той же позиции.

**Вкладки браузера.** Когда открыто двадцать вкладок, заголовки сжимаются до двух букв, и пользователь находит нужную страницу по иконке.

**Закладки и главный экран телефона.** Сайт, сохранённый на домашний экран, получает вашу иконку — либо системную заглушку, если её не подготовили.

Все три сценария показывают иконку в размере от 16 до 180 пикселей. Один векторный файл закрывает весь диапазон, и именно поэтому набор из тридцати файлов перестал быть нужен.

## Минимальный набор файлов

| Файл | Размер | Для кого |
| --- | --- | --- |
| favicon.ico | 32×32 | старые браузеры, дефолтный запрос `/favicon.ico` |
| favicon.svg | вектор | современные браузеры, тёмная тема |
| apple‑touch‑icon.png | 180×180 | iPhone/iPad, «На экран Домой» |
| icon‑192.png | 192×192 | Android, PWA‑манифест |

Подключаются они тремя строками:

```
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

Файл favicon.ico при этом кладите в корень сайта, даже когда он подключён через `<link>`: браузеры, поисковые боты и RSS‑читалки до сих пор ходят по адресу `/favicon.ico` напрямую, минуя разметку.

Сам ICO держится в наборе по историческим причинам: формат умеет хранить несколько размеров внутри одного файла, и когда‑то только его читал Internet Explorer. Складывать туда весь диапазон от 16 до 256 пикселей сегодня незачем: современный браузер возьмёт SVG, а одна картинка 32×32 остаётся страховкой для тех, кто разметку не читает. Генераторы фавиконов по инерции предлагают многоразмерный ICO, и отказ от него ничего не ломает.

## Что умеет SVG‑фавикон

Вектор попал в этот набор за две способности, которых у растра нет.

Первая — один файл на все размеры: браузер отрендерит его хоть в 16, хоть в 512 пикселей, и отдельные копии под каждый размер не понадобятся. Вторая — реакция на тёмную тему, потому что медиазапрос работает прямо внутри файла:

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

Чёрный знак во вкладке светлой темы, белый — в тёмной, один файл на оба случая. С PNG такой трюк невозможен, поэтому растровые копии остаются только там, где вектор пока не читают: старые браузеры, iOS и Android.

## Как сделать фавикон из логотипа

Файлы генерируются автоматически, а вот исходник для них придётся подготовить руками, и все четыре шага подчинены тому самому размеру в 16 пикселей:

1. **Возьмите знак, оставив полный логотип в стороне.** Текстовая часть в 16 пикселях превращается в серую полоску. В фавикон идёт иконка: буква, символ, упрощённый знак. У [Сбера](../../logos/bank/sber/) во вкладке стоит галочка в круге, а слово «[Сбер](../../logos/bank/sber/)» там не поместилось бы.
2. **Упростите.** Уберите мелкие детали, тонкие линии и градиенты из трёх цветов. Проверка занимает секунду: уменьшите иконку до 16×16 и посмотрите, узнаётся ли она.
3. **Соберите квадратную композицию.** Фавикон квадратный, и вытянутый логотип в нём сожмётся в полоску. Знак должен занимать почти весь квадрат с небольшими полями.
4. **Экспортируйте набор.** Из SVG‑исходника получите ICO (32×32) и два PNG (180 и 192). Это умеет любой генератор фавиконов, [Figma](../../logos/design/figma/) или командная строка.

:::tip Про скруглённые углы
Углы у apple‑touch‑icon скругляет iOS, поэтому делать это самому не нужно. А вот фон ему нужен непрозрачный: прозрачные места iOS заливает чёрным, и иконка выглядит неожиданно мрачно.
:::

## Чего поисковики не прощают

Раз главная работа иконки происходит в выдаче, у Яндекса и [Google](../../logos/search/google/) есть отдельные требования к ней, и они различаются:

- **[Google](../../logos/search/google/)** берёт одну иконку на весь домен, просит размер кратный 48 пикселям (48, 96, 144) или SVG и может скрыть иконку, посчитав её неподходящей — например, с мелким нечитаемым содержимым. В выдаче она обновляется при перекраулинге главной страницы.
- **Яндекс** поддерживает SVG и крупные PNG. На мобильных иконка стоит у каждого результата, поэтому её вклад в кликабельность здесь заметнее. Обновление можно ускорить перекраулом в Вебмастере.
- **Обе системы** отсеивают пустые и белые иконки (сливаются с фоном выдачи), стандартные заглушки CMS (шаблонный фавикон WordPress сразу выдаёт нетронутый сайт) и картинки, не связанные с тематикой.

Сроки обновления закладывайте заранее. Google перерисовывает иконку после перекраулинга главной страницы, на небольшом сайте это занимает от нескольких дней до пары недель; Яндекс идёт по своему расписанию, и ускорить его можно только переобходом в Вебмастере. Поэтому иконку меняют вместе с релизом сайта, чтобы к моменту роста трафика в выдаче уже стояла новая.

Отсюда практический вывод: фавикон входит в набор SEO‑инструментов наравне с заголовком и описанием сниппета — сайт с узнаваемой иконкой собирает больше кликов на той же позиции.

## Типичные ошибки

:::danger Так делать не надо
- **Полноцветный детальный логотип** — в 16 пикселях он превращается в шум.
- **Тридцать файлов по гайду 2015 года** — msapplication‑тайлы и иконки под давно мёртвые устройства засоряют корень сайта и `<head>`.
- **Отсутствие `/favicon.ico` в корне** — часть ботов и сервисов не читает `<link>`-теги.
- **Один PNG 16×16 на все случаи** — на ретина‑экранах и в закладках получится мыло, а поисковики предпочитают иконки покрупнее.
:::

## Иконки для PWA: manifest.json

Если сайт устанавливается на главный экран как приложение, браузер ищет иконки в манифесте, минуя `<link>`-теги:

```
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Ключевой пункт здесь — **maskable‑иконка**: Android обрезает её под форму лончера (круг, скруглённый квадрат), поэтому знак должен сидеть в центральной безопасной зоне (около 80% диаметра), а фон — заливать весь холст. Логика совпадает с адаптивными иконками нативных приложений, которые разбирали в статье [про иконки приложений](../ikonka-prilozheniya/). Проверить свою maskable‑иконку можно в онлайн‑инструменте maskable.app.

## Как убедиться, что всё работает

1. Откройте сайт в режиме инкогнито: кэш фавиконов у браузеров живучий, и обычное обновление страницы иконку не сменит.
2. Запросите `https://ваш-сайт/favicon.ico` напрямую — по адресу должен отдаваться файл, а 404 означает, что его забыли положить в корень.
3. Переключите систему в тёмное оформление и посмотрите на вкладку: чёрный знак без медиазапроса сливается с тёмной панелью браузера, а на светлом фоне эта ошибка не видна вовсе.
4. Добавьте сайт на домашний экран iPhone и посмотрите на apple‑touch‑icon в деле.
5. Подождите с проверкой выдачи: поисковики перекачивают иконки по своему расписанию, от нескольких дней до пары недель.

## Частые вопросы

**Можно ли сделать анимированный фавикон?** GIF‑фавиконы поддерживает часть браузеров, но мигающая вкладка раздражает, а поисковики анимацию игнорируют. Легитимный случай один — смена фавикона из JS для индикации статуса: непрочитанные уведомления, идущий звонок. Так делают почтовые веб‑клиенты.

**Почему фавикон не обновляется у посетителей?** Кэш фавиконов переживает обычную очистку кэша браузера. Смените имя файла (`favicon-v2.svg`) и обновите пути в `<link>` — это собьёт кэш всем сразу.

**Нужен ли отдельный фавикон для поддоменов?** Да: blog.site.ru и app.site.ru для браузера и поисковика — разные сайты. Без своих иконок они получат глобусы.

**Обязательно ли делать SVG‑фавикон?** Сайт работает и без него: ICO с парой PNG закрывают все браузеры. SVG экономит файлы и даёт реакцию на тёмную тему, поэтому его добавляют, когда векторный знак уже есть. Логотип, существующий только в растре, переводить в вектор ради фавикона незачем: 32×32 и 180×180 сделают своё дело.

**Что делать, если знак бренда не читается в 16 пикселях?** Сделайте для фавикона отдельную упрощённую версию: одну букву, фрагмент знака или простую форму в фирменном цвете. Так поступают многие бренды, и их фавикон отличается от полного логотипа.

## Что в итоге

Фавикон живёт в выдаче, где рядом стоят конкуренты, поэтому единственное настоящее требование к нему — узнаваемость в 16 пикселях; всё остальное отсюда и следует. Из требования вырастает подготовка исходника (знак крупно, без надписи и мелких деталей), а из возможностей SVG — короткий список файлов: ico, svg и два png плюс три строки в `<head>`.

Начинается всё с векторного знака: если SVG логотипа уже есть, фавикон собирается из него за десять минут. Векторы почти любого известного бренда лежат в нашем [каталоге логотипов](../../logos/) — скачивайте SVG, упрощайте до знака и собирайте набор. А для пет‑проекта, которому хватит символа, загляните в [каталог эмодзи](../../emoji/).

---EN---

Open a Yandex or [Google](../../logos/search/google/) results page for any query and look at the left edge of the results. Beside each link sits a tiny site icon, and where it's missing the search engine draws a gray globe. Users decide what to click partly by that picture — which means a favicon does its real work outside the browser tab, where people barely notice it, and inside the most competitive place on the internet. From that follow both its requirement (legibility at 16 pixels) and the answer to how many files you need to prepare. Old guides demand thirty. Four are enough today, and here's why.

:::note TL;DR
The modern minimum: **favicon.ico** (32×32, for old browsers and default requests), **favicon.svg** (scales anywhere and supports dark mode), **apple‑touch‑icon.png** (180×180, for iPhone and iPad) and a **192×192 PNG** for Android. The other 26 files from decade-old guides serve no purpose.
:::

## Where a favicon actually works

Three display scenarios differ in the cost of getting it wrong, so start with the most expensive one.

**Search results.** Both Yandex and [Google](../../logos/search/google/) place the icon next to the snippet, and on mobile beside every result. Blank space there costs clicks at the same ranking position.

**Browser tabs.** With twenty tabs open, titles shrink to two letters and users find the page they want by its icon.

**Bookmarks and the phone home screen.** A site saved to the home screen gets your icon — or a system placeholder if you never prepared one.

All three show the icon somewhere between 16 and 180 pixels. A single vector file covers that entire range, which is exactly why the thirty-file set stopped being necessary.

## The minimal file set

| File | Size | For whom |
| --- | --- | --- |
| favicon.ico | 32×32 | old browsers, the default `/favicon.ico` request |
| favicon.svg | vector | modern browsers, dark mode |
| apple‑touch‑icon.png | 180×180 | iPhone/iPad, "Add to Home Screen" |
| icon‑192.png | 192×192 | Android, PWA manifest |

Three lines wire them up:

```
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

Still put favicon.ico in the site root even when it's linked via `<link>`: browsers, search bots and RSS readers go to `/favicon.ico` directly, bypassing the markup.

ICO itself stays in the set for historical reasons: the format can hold several sizes inside one file, and at one point only Internet Explorer read it. Packing the whole 16-to-256 range in there serves no purpose today: a modern browser takes the SVG, while a single 32×32 image remains the fallback for anything that skips the markup. Favicon generators still offer a multi-size ICO out of inertia, and dropping it breaks nothing.

## What an SVG favicon can do

Vector earned its place in this set through two abilities raster lacks.

The first is one file for every size: the browser renders it at 16 or 512 pixels, and separate copies per size become unnecessary. The second is reacting to dark mode, because a media query works right inside the file:

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

A black mark in a light-theme tab, a white one in dark, one file for both cases. PNG can't pull off that trick, so raster copies remain only where vector still isn't read: old browsers, iOS and Android.

## How to make a favicon from a logo

The files generate automatically, but the source has to be prepared by hand, and all four steps serve that 16-pixel size:

1. **Take the mark and leave the full logo aside.** The text part turns into a gray smudge at 16 pixels. What goes into a favicon is an icon: a letter, a symbol, a simplified mark. [Sber](../../logos/bank/sber/)'s tab shows the check in a circle; the word "[Sber](../../logos/bank/sber/)" would never fit there.
2. **Simplify.** Drop fine details, thin lines and three-color gradients. The check takes a second: shrink the icon to 16×16 and see whether it's still recognizable.
3. **Build a square composition.** A favicon is square, and a horizontal logo compresses into a strip inside it. The mark should fill nearly the whole square with small margins.
4. **Export the set.** From the SVG source produce the ICO (32×32) and two PNGs (180 and 192). Any favicon generator, [Figma](../../logos/design/figma/) or the command line handles this.

:::tip About rounded corners
iOS rounds the corners of apple‑touch‑icon itself, so there's no need to do it yourself. It does need an opaque background though: iOS fills transparent areas with black, and the icon comes out unexpectedly grim.
:::

## What search engines won't forgive

Since the icon's main work happens in results, Yandex and [Google](../../logos/search/google/) have their own requirements for it, and they differ:

- **[Google](../../logos/search/google/)** takes one icon per domain, asks for a size that's a multiple of 48 pixels (48, 96, 144) or SVG, and may hide an icon it deems unsuitable — for instance one with tiny illegible content. It refreshes in results when the homepage is recrawled.
- **Yandex** supports SVG and large PNGs. On mobile the icon sits beside every result, so its contribution to click-through is more visible here. You can speed up the refresh with a recrawl in Webmaster.
- **Both systems** filter out empty and white icons (they merge with the results background), default CMS placeholders (a stock WordPress favicon instantly signals an untouched site) and images unrelated to the topic.

Plan the refresh window in advance. Google redraws the icon after recrawling the homepage, which takes from several days to a couple of weeks on a small site; Yandex works on its own schedule, and the only way to hurry it is a recrawl in Webmaster. So the icon gets swapped together with the site release, so that the new one is already in results by the time traffic grows.

Hence the practical conclusion: a favicon belongs to the SEO toolkit alongside the snippet's title and description — a site with a recognizable icon collects more clicks at the same position.

## Common mistakes

:::danger What not to do
- **A full-color, detailed logo** — it turns to noise at 16 pixels.
- **Thirty files per a 2015 guide** — msapplication tiles and icons for long-dead devices clutter the site root and `<head>`.
- **No `/favicon.ico` in the root** — some bots and services never read `<link>` tags.
- **A single 16×16 PNG for everything** — you get mush on retina screens and in bookmarks, while search engines prefer larger icons.
:::

## Icons for PWA: manifest.json

If the site installs to the home screen as an app, the browser looks for icons in the manifest and skips `<link>` tags:

```
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

The key entry here is the **maskable icon**: Android crops it to the launcher shape (circle, rounded square), so the mark must sit in the central safe zone (about 80% of the diameter) while the background fills the whole canvas. The logic matches adaptive icons for native apps, covered in the article [on app icons](../ikonka-prilozheniya/). You can test your maskable icon at maskable.app.

## How to confirm it all works

1. Open the site in incognito: the favicon cache is stubborn, and a plain page refresh won't swap the icon.
2. Request `https://your-site/favicon.ico` directly — the address should serve a file, while a 404 means it was never placed in the root.
3. Switch the system to dark appearance and look at the tab: a black mark with no media query merges into the dark browser chrome, and on a light background that mistake stays invisible.
4. Add the site to an iPhone home screen and see the apple‑touch‑icon in action.
5. Hold off on checking search results: engines re-fetch icons on their own schedule, from several days to a couple of weeks.

## Common questions

**Can a favicon be animated?** Some browsers support GIF favicons, but a blinking tab is irritating and search engines ignore animation. There's one legitimate case — swapping the favicon from JS to signal status: unread notifications, an ongoing call. Webmail clients do this.

**Why doesn't the favicon update for visitors?** The favicon cache survives an ordinary browser cache clear. Rename the file (`favicon-v2.svg`) and update the paths in `<link>` — that clears it for everyone at once.

**Do subdomains need their own favicon?** Yes: blog.site.ru and app.site.ru are separate sites to a browser and a search engine. Without their own icons they get globes.

**Is an SVG favicon mandatory?** The site works without one: an ICO plus a couple of PNGs cover every browser. SVG saves files and reacts to dark mode, so it gets added when a vector mark already exists. A logo that exists only as raster is not worth vectorizing for the favicon alone: 32×32 and 180×180 do the job.

**What if the brand mark is illegible at 16 pixels?** Make a separate simplified version for the favicon: a single letter, a fragment of the mark, or a simple shape in the brand color. Many brands do exactly this, and their favicon differs from the full logo.

## The bottom line

A favicon lives in search results with competitors right beside it, so its only real requirement is recognizability at 16 pixels; everything else follows. That requirement shapes the source (the mark alone, drawn large and free of fine detail), and SVG's abilities shorten the file list to ico, svg and two pngs plus three lines in `<head>`.

It all starts with a vector mark: if you already have the logo's SVG, the favicon comes together in ten minutes. Vectors for almost any well-known brand sit in our [logo catalog](../../logos/) — download the SVG, simplify it to the mark and assemble the set. And for a pet project that just needs a symbol, look into the [emoji catalog](../../emoji/).
