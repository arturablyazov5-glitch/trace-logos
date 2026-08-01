---
title: Логотип для тёмной темы — как адаптировать
title_en: A Logo for Dark Mode — How to Adapt It
description: Почему логотип пропадает на тёмном фоне и как это исправить. Инверсия цвета, вторая версия знака, работа прозрачного фона и вырезов, автопереключение через CSS. Практический разбор с примерами.
description_en: Why a logo disappears on a dark background and how to fix it. Color inversion, a second version of the mark, transparent backgrounds and knockouts, auto-switching via CSS. A practical breakdown with examples.
date: 2026-07-19
slug: logotip-dlya-temnoj-temy
tags: Логотип, Тёмная тема, Дизайн
tags_en: Logo, Dark Mode, Design
---

Логотип, который безупречно смотрится на белом сайте, вставляют в тёмный интерфейс — и он либо сливается с фоном до нечитаемости, либо обрастает уродливым белым прямоугольником. Тёмная тема давно стала стандартом, её поддерживают сайты, приложения и сами операционные системы, поэтому с этой проблемой рано или поздно сталкивается почти каждый бренд. Хорошая новость в том, что причин у неё всего две, и, разобравшись в них, легко подобрать решение.

## Почему знак пропадает на тёмном фоне

Первая причина — **тёмный цвет самого знака**. Чёрный или тёмно‑синий логотип контрастен на белом, но на почти чёрном фоне его контраст падает почти до нуля, и знак просто растворяется. Вторая причина — **непрозрачная подложка**: если логотип сохранён как [PNG](../png-ili-jpg-chto-luchshe/) или JPG с белым фоном, на тёмной странице вокруг него появляется белый прямоугольник. Часто обе причины встречаются вместе, и тогда знак и сливается, и «прилипает» одновременно.

:::warning Белый прямоугольник вокруг логотипа
Это самый частый симптом, и лечится он не подбором фона под логотип, а заменой файла на версию с [прозрачным фоном](../logotip-s-prozrachnym-fonom/): проблема почти всегда именно в непрозрачной подложке. Если готовой прозрачной версии нет, фон придётся убрать — как это сделать, разбираем в статье как убрать фон с картинки.
:::

## От простого к надёжному: как это чинят

Раз причин две, и решения выстраиваются по нарастающей — от самого лёгкого к самому основательному.

Самый простой случай — **монохромный знак**. Если логотип одноцветный, достаточно инверсии: чёрный на светлой теме, белый на тёмной. Это работает, потому что такой знак несёт информацию формой, а не цветом, — и если он в [SVG](../svg-ili-png-dlya-logotipa/), инверсию проще всего сделать прямо в коде, поменяв значение `fill` (как менять цвета вручную — в статье [как изменить цвет логотипа](../kak-izmenit-cvet-logotipa/)). Как привести знак к одному цвету, если он ещё цветной, — в статье [чёрно‑белый логотип](../cherno-belyj-logotip/).

А вот для **цветного знака** инверсия уже не годится: буквальная перекраска испортит фирменные цвета — синий станет оранжевым, красный голубым. Поэтому здесь нужен следующий уровень — **отдельная версия для тёмного фона**, подготовленная заранее. Обычно в ней фирменные цвета оставляют как есть, но осветляют или заменяют только тот элемент, что «пропадал» (например, чёрный текст делают белым), а при необходимости добавляют тонкую обводку. Именно так поступают крупные бренды: у [Apple](../../logos/store/apple/), [Google](../../logos/search/google/) и [Spotify](../../logos/media/spotify/) в гайдлайнах прописаны отдельные варианты знака под светлый и тёмный фон — это часть [фирменного стиля](../chto-takoe-firmennyj-stil/), которую фиксируют в [брендбуке](../chto-takoe-brendbuk/). Многие логотипы в нашем [каталоге](../../logos/) уже содержат такие варианты в блоке версий.

Но даже идеально подобранный цвет не спасёт, если у файла непрозрачная подложка, — поэтому в основе любого решения лежит третье, базовое условие: **прозрачный фон**. И здесь снова выручает вектор: в [SVG](../svg-ili-png-dlya-logotipa/) прозрачность заложена в саму природу формата — фон есть только там, где вы явно нарисовали заливку, — поэтому SVG почти всегда безопаснее для тёмной темы, чем растровый файл. Подробнее про сам файл — в статье [логотип с прозрачным фоном](../logotip-s-prozrachnym-fonom/).

## На сайте версии переключаются сами

Когда все версии готовы, остаётся последний шаг — и на сайте его не нужно делать руками. Браузер и так знает, какая тема выбрана в системе, а медиазапрос `prefers-color-scheme` сам подставляет нужный файл:

```css
.logo { content: url("logo-dark.svg"); }        /* по умолчанию — для светлой темы */
@media (prefers-color-scheme: dark) {
  .logo { content: url("logo-light.svg"); }     /* белая версия для тёмной темы */
}
```

Пользователь со светлой системной темой увидит тёмный логотип, а с тёмной — светлый, без единой строчки JavaScript. Тот же приём работает и для [фавикона](../kak-sdelat-favicon/), где тоже можно задать отдельную версию под тёмную тему браузера.

## Что учесть заранее

Чтобы не переделывать, полезно держать в голове несколько нюансов. Контраст стоит проверять не «на глаз», а по‑настоящему: слишком тёмные элементы теряются даже на не‑чёрном сером. При этом «тёмная тема» почти никогда не означает чистый чёрный — большинство интерфейсов используют тёмно‑серый вроде #1e1e1e, поэтому и проверять знак нужно на реальном фоне, а не на #000000. И, наконец, не стоит плодить версии без нужды: двух вариантов, светлого и тёмного, почти всегда достаточно, а если знак должен работать ещё и в разных размерах — это уже соседняя задача, [адаптивный логотип](../adaptivnyj-logotip/). Всё это гораздо проще, если исходник в [векторе](../vektor-i-rastr-raznica/): из [SVG](../svg-ili-png-dlya-logotipa/) любая версия делается за минуту, из готового [PNG](../png-ili-jpg-chto-luchshe/) — уже нет.

Отдельно стоит сказать про случай, когда фон контролировать нельзя вообще, — например, когда логотип уходит партнёрам, в чужие презентации или на площадки, где он ляжет неизвестно на что. Тогда двух версий мало, и выручает третий, «нейтральный» вариант: знак с тонкой контурной обводкой или на собственной небольшой подложке фирменного цвета, который читается и на белом, и на чёрном, и на пёстром фото. Он жертвует частью изящества ради надёжности, зато не пропадёт нигде. Разумно держать такой универсальный вариант в наборе рядом со светлой и тёмной версиями и отдавать именно его, когда заранее неизвестно, на каком фоне окажется знак, — это избавляет от разбирательств уже постфактум.

## Короткий вывод

Логотип пропадает на тёмном фоне по двум причинам — из‑за тёмного цвета знака или непрозрачной подложки, — и решения выстраиваются по нарастающей: монохромному знаку хватит инверсии, цветному нужна отдельная светлая версия, но в основе всего лежит [прозрачный фон](../logotip-s-prozrachnym-fonom/), без которого не спасёт ни один подобранный цвет. На сайте версии стоит переключать автоматически через `prefers-color-scheme`, а исходник держать в [векторе](../svg-ili-png-dlya-logotipa/) — тогда любая версия под тёмную тему делается за минуту.

Логотипы в [каталоге Trace Logo's](../../logos/) можно перекрасить прямо в браузере и скачать готовую светлую или тёмную версию в SVG и PNG.

---EN---

A logo that looks flawless on a white site is placed into a dark interface — and it either merges with the background into unreadability or grows an ugly white rectangle. Dark mode has long been a standard, supported by websites, apps, and operating systems themselves, so almost every brand eventually hits this problem. The good news is that it has only two causes, and once you understand them, a solution is easy to pick.

## Why a mark disappears on a dark background

The first cause is a **dark mark color**. A black or dark-blue logo is contrasty on white, but on a near-black background its contrast drops almost to zero and the mark simply dissolves. The second cause is an **opaque backing**: if the logo is saved as [PNG](../png-ili-jpg-chto-luchshe/) or JPG with a white background, a white rectangle appears around it on a dark page. Often both causes occur together, and then the mark both merges and "sticks" at once.

:::warning A white rectangle around the logo
This is the most common symptom, and it's cured not by matching the background to the logo but by replacing the file with a version that has a [transparent background](../logotip-s-prozrachnym-fonom/): the problem is almost always the opaque backing. If there's no ready transparent version, the background has to be removed — how to do it, in how to remove a background from an image.
:::

## From simple to robust: how it's fixed

Since there are two causes, the solutions build up in escalation — from the easiest to the most fundamental.

The simplest case is a **monochrome mark**. If the logo is single-color, inversion is enough: black on the light theme, white on the dark one. This works because such a mark carries information through shape, not color — and if it's in [SVG](../svg-ili-png-dlya-logotipa/), the inversion is easiest right in the code, by changing the `fill` value (how to change colors by hand — in [how to change a logo's color](../kak-izmenit-cvet-logotipa/)). How to reduce a mark to one color, if it's still colored — in [a black-and-white logo](../cherno-belyj-logotip/).

But for a **colored mark** inversion no longer works: a literal recolor ruins the brand colors — blue becomes orange, red becomes cyan. So here the next level is needed — a **separate version for dark backgrounds**, prepared in advance. Usually it keeps the brand colors as they are but lightens or replaces only the element that "vanished" (e.g. black text becomes white), and if needed adds a thin outline. That's exactly what large brands do: [Apple](../../logos/store/apple/), [Google](../../logos/search/google/), and [Spotify](../../logos/media/spotify/) specify separate light- and dark-background variants in their guidelines — part of the [brand identity](../chto-takoe-firmennyj-stil/) fixed in the [brand book](../chto-takoe-brendbuk/). Many logos in our [catalog](../../logos/) already include such variants in the versions block.

But even a perfectly chosen color won't help if the file has an opaque backing — so at the base of any solution lies a third, fundamental condition: a **transparent background**. And here vector helps again: in [SVG](../svg-ili-png-dlya-logotipa/) transparency is built into the format's nature — there's a background only where you explicitly drew a fill — so SVG is almost always safer for dark mode than a raster file. More on the file itself — in [a logo with a transparent background](../logotip-s-prozrachnym-fonom/).

## On a website the versions switch themselves

When all versions are ready, one last step remains — and on a website you don't do it by hand. The browser already knows which theme the system has chosen, and the `prefers-color-scheme` media query substitutes the right file itself:

```css
.logo { content: url("logo-dark.svg"); }        /* default — for the light theme */
@media (prefers-color-scheme: dark) {
  .logo { content: url("logo-light.svg"); }     /* the white version for dark theme */
}
```

A user with a light system theme sees the dark logo, and one with a dark theme sees the light one — without a single line of JavaScript. The same trick works for the [favicon](../kak-sdelat-favicon/), where you can also define a separate version for the browser's dark theme.

## What to plan for in advance

To avoid redoing it, keep a few nuances in mind. Contrast should be checked for real, not "by eye": elements that are too dark get lost even on a non-black gray. And "dark mode" almost never means pure black — most interfaces use a dark gray like #1e1e1e, so the mark should be tested on a real background, not #000000. And finally, don't breed versions without need: two variants, light and dark, are almost always enough, and if the mark also has to work at different sizes, that's a neighboring task — an [adaptive logo](../adaptivnyj-logotip/). All of this is far easier if the source is [vector](../vektor-i-rastr-raznica/): from [SVG](../svg-ili-png-dlya-logotipa/) any version takes a minute, from a finished [PNG](../png-ili-jpg-chto-luchshe/) — no longer.

There's a separate case worth mentioning — when you can't control the background at all, for example when the logo goes to partners, into other people's presentations, or onto platforms where it'll land on who-knows-what. Then two versions aren't enough, and a third, "neutral" option helps: a mark with a thin outline or on its own small brand-color plate that reads on white, on black, and on a busy photo. It sacrifices some elegance for reliability but won't vanish anywhere. It's sensible to keep such a universal option in the set alongside the light and dark versions and hand out exactly that one when you don't know in advance what background the mark will end up on — it saves you from sorting things out after the fact.

## The short takeaway

A logo disappears on a dark background for two reasons — a dark mark color or an opaque backing — and the solutions build up in escalation: a monochrome mark needs only inversion, a colored one needs a separate light version, but at the base of everything lies a [transparent background](../logotip-s-prozrachnym-fonom/), without which no chosen color will help. On a website the versions should switch automatically via `prefers-color-scheme`, and the source should be kept as [vector](../svg-ili-png-dlya-logotipa/) — then any dark-mode version is a minute's work.

Logos in the [Trace Logo's catalog](../../logos/) can be recolored right in the browser, and you can download a ready light or dark version in SVG and PNG.
