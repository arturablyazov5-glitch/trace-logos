---
title: Как узнать шрифт логотипа или сайта — все рабочие способы
title_en: How to Identify a Font From a Logo or Website — Every Working Method
description: Определяем шрифт по картинке: WhatTheFont, Font Squirrel, поиск вручную по признакам букв, инструменты для шрифтов на сайтах. Что делать, если шрифт кастомный.
description_en: Identifying a font from an image: WhatTheFont, manual letterform detective work, tools for live websites, and what to do when the font is custom
date: 2026-08-13
slug: kak-uznat-shrift-logotipa
tags: Инструкции, Шрифты, Инструменты
tags_en: How-To, Fonts, Tools
---

Увидели логотип или заголовок с идеальным шрифтом — и хотите такой же? Задача решаемая: сервисы‑определители узнают гарнитуру по фотографии за секунды, шрифт с сайта вычисляется двумя кликами в браузере, а для сложных случаев есть «детективный» метод по приметам букв. Разбираем все способы — и объясняем, почему шрифт из логотипа большого бренда часто нельзя найти в принципе (и что делать вместо этого).

:::note Коротко
**Шрифт на картинке** → загрузите её в WhatTheFont или Font Squirrel Matcherator. **Шрифт на сайте** → правый клик → «Просмотреть код» → вкладка Computed → font‑family (или расширение вроде Fonts Ninja). **Ничего не нашлось** → скорее всего, шрифт кастомный или буквы отрисованы вручную — ищите похожий по приметам. И помните: найти шрифт мало, его ещё нужно [лицензировать](../shrift-dlya-logotipa/).
:::

## Способ 1. Определители по картинке

Главный инструмент — **WhatTheFont** от MyFonts: загружаете картинку с текстом, сервис распознаёт буквы и показывает совпадения из базы в сотни тысяч гарнитур. Аналоги — Font Squirrel Matcherator (силён в бесплатных шрифтах) и Fontspring Matcherator. Чтобы распознавание сработало:

1. **Чем больше букв, тем точнее** — по двум буквам сервис гадает, по восьми — попадает.
2. **Горизонтальный текст, ровный кадр.** Наклонные фото выпрямите заранее ([убрать фон](../kak-ubrat-fon-s-kartinki/) тоже помогает).
3. **Разделённые буквы.** Слипшиеся или пересекающиеся буквы (частая история в [леттеринге](../shrift-dlya-logotipa/)) сервис не разберёт — обрежьте до читаемого фрагмента.
4. **Сравнивайте детали.** Из выдачи в десяток похожих гарнитур настоящую отличают мелочи: форма точки над «i», хвост «y», срезы штрихов.

## Способ 2. Шрифт на сайте — без всяких сервисов

Если шрифт живёт на веб‑странице, он вычисляется точно, а не «похоже»:

1. Правый клик по тексту → **«Просмотреть код»** (Inspect).
2. В панели стилей найдите свойство **font‑family** — либо откройте вкладку **Computed**, где показан реально применённый шрифт.
3. Ленивый вариант — расширения **Fonts Ninja** или WhatFont: наводите курсор на любой текст и видите название, размер и начертание.

Работает в [Chrome](../../logos/search/chrome/), [Firefox](../../logos/search/firefox/), [Safari](../../logos/search/safari/) и любом браузере с инструментами разработчика. Учтите: название шрифта — не разрешение его использовать; лицензию проверяем отдельно (об этом ниже).

## Способ 3. Детектив по приметам

Когда автоопределители молчат, работает ручной поиск по классификационным признакам. Определите по картинке:

- **Засечки:** есть (антиква) / нет (гротеск) / брусковые (слэб).
- **Контраст штрихов:** одинаковая толщина или тонкие‑толстые переходы.
- **Апертуры:** открытые «с», «е» (гуманистический характер) или закрытые (геометрический).
- **Особые приметы:** одноэтажная или двухэтажная «а», хвост «Q», форма «R».

С этим набором идите в каталоги (Google Fonts, MyFonts) и фильтруйте по категории — или спросите на форумах идентификации шрифтов (сабреддит r/identifythisfont решает задачи за минуты). Побочный бонус метода: научившись видеть приметы, вы начнёте осознанно [выбирать шрифты для своих проектов](../shrift-dlya-logotipa/).

## Почему шрифт из логотипа часто не находится

Три причины, по которым определитель разводит руками:

1. **Кастомная гарнитура.** Крупные бренды заказывают собственные шрифты: [YouTube Sans](../istoriya-logotipa-youtube/), Product Sans у [Google](../istoriya-logotipa-google/), YS Text у [Яндекса](../ekosistema-yandeksa-logotipy/). Купить их нельзя в принципе — они и созданы, чтобы не повторяться.
2. **Леттеринг.** Многие логотипы — не набор шрифтом, а ручная отрисовка: рукописное слово [Instagram](../istoriya-logotipa-instagram/) не существует как шрифт со всеми буквами алфавита.
3. **Модификация.** Знак набран существующим шрифтом, но буквы доработаны: срезы, лигатуры, изменённые пропорции — именно так делаются текстовые логотипы в большинстве случаев.

Что делать: искать **похожий по духу** шрифт из доступных. Запрос «шрифты, похожие на X» — легальный и продуктивный путь: у большинства знаменитых гарнитур есть открытые аналоги (условные Roboto→«похож на Helvetica»-класс, Montserrat→геометрические гротески).

:::warning Найти ≠ можно использовать
Определив шрифт, проверьте лицензию до использования: бесплатные для личных целей гарнитуры в коммерческом логотипе — готовая претензия от шрифтовой студии, [подробно о лицензиях и ловушках](../shrift-dlya-logotipa/) мы писали отдельно. И отдельно: скопировать шрифт бренда легко, но знак «в шрифте Т‑Банка» — путь к [спору о смешении](../mozhno-li-ispolzovat-chuzhoy-logotip/), а не к своему стилю.
:::

## Мини‑шпаргалка

| Ситуация | Инструмент |
| --- | --- |
| Картинка/фото с текстом | WhatTheFont, Matcherator |
| Текст на сайте | Inspect → Computed, Fonts Ninja |
| Автоопределение молчит | детектив по приметам + r/identifythisfont |
| Шрифт кастомный | искать открытый аналог |
| PDF‑файл | свойства документа → шрифты |

Родственные задачи из нашего блога: [как узнать цвет логотипа](../kak-uznat-cvet-logotipa/) — та же детективная работа для палитры, [как скачать логотип с сайта](../kak-skachat-logotip-s-sajta/) — если нужен сам знак, и [шрифт для логотипа](../shrift-dlya-logotipa/) — как выбирать гарнитуру, когда делаете собственный бренд. Изучать связки «знак + шрифт» удобно в [каталоге](../../logos/): у сильных брендов типографика продолжает форму знака.

---EN---

Spotted a logo or a headline with the perfect typeface — and want the same one? The task is solvable: identifier services recognize a face from a photo in seconds, a website's font is two clicks away in the browser, and hard cases yield to the "detective" method of letterform clues. Here are all the ways — plus why a big brand's logo font often can't be found at all (and what to do instead).

:::note TL;DR
**Font in an image** → upload it to WhatTheFont or the Font Squirrel Matcherator. **Font on a website** → right-click → Inspect → the Computed tab → font-family (or an extension like Fonts Ninja). **Nothing found** → the face is likely custom or hand-lettered — hunt for a lookalike by its features. And remember: finding the font isn't enough, it still needs [licensing](../shrift-dlya-logotipa/).
:::

## Method 1. Image identifiers

The main tool is MyFonts' **WhatTheFont**: upload a picture with text, the service recognizes the letters and shows matches from a base of hundreds of thousands of faces. Peers — the Font Squirrel Matcherator (strong on free fonts) and the Fontspring Matcherator. To make recognition work:

1. **More letters, more accuracy** — with two letters the service guesses, with eight it hits.
2. **Horizontal text, a straight shot.** Deskew tilted photos beforehand ([removing the background](../kak-ubrat-fon-s-kartinki/) helps too).
3. **Separated letters.** Touching or overlapping letters (common in [lettering](../shrift-dlya-logotipa/)) won't parse — crop to a readable fragment.
4. **Compare the details.** Within a dozen similar results the real one differs by minutiae: the dot over the "i", the tail of the "y", the stroke terminals.

## Method 2. A website font — no services needed

If the font lives on a web page, it can be determined exactly, not "approximately":

1. Right-click the text → **Inspect**.
2. In the styles panel find **font-family** — or open the **Computed** tab, which shows the font actually applied.
3. The lazy route — the **Fonts Ninja** or WhatFont extensions: hover over any text and see the name, size and weight.

Works in [Chrome](../../logos/search/chrome/), [Firefox](../../logos/search/firefox/), [Safari](../../logos/search/safari/) and any browser with dev tools. Note: knowing the name is not permission to use it; the license is a separate check (below).

## Method 3. Detective work by clues

When the auto-identifiers stay silent, manual classification works. Determine from the image:

- **Serifs:** present (serif) / absent (sans) / slab.
- **Stroke contrast:** uniform thickness or thin-thick transitions.
- **Apertures:** open "c" and "e" (humanist character) or closed (geometric).
- **Distinguishing marks:** single- or double-story "a", the "Q" tail, the shape of the "R".

Take that profile to the catalogs (Google Fonts, MyFonts) and filter by category — or ask the font-identification forums (the r/identifythisfont subreddit solves cases in minutes). A side bonus: once you see the clues, you start [choosing typefaces for your own projects](../shrift-dlya-logotipa/) consciously.

## Why a logo's font often can't be found

Three reasons the identifier shrugs:

1. **A custom face.** Big brands commission their own: [YouTube Sans](../istoriya-logotipa-youtube/), Product Sans at [Google](../istoriya-logotipa-google/), Yandex's [YS Text](../ekosistema-yandeksa-logotipy/). You can't buy them at all — they exist precisely to be unrepeatable.
2. **Lettering.** Many logos aren't typeset but hand-drawn: the [Instagram](../istoriya-logotipa-instagram/) script doesn't exist as a font with a full alphabet.
3. **Modification.** The mark uses an existing face with reworked letters: cuts, ligatures, altered proportions — that's how wordmarks are made more often than not.

What to do: hunt for a **kindred** available face. "Fonts similar to X" is a legal and productive route: most famous faces have open analogues.

:::warning Found ≠ allowed
Having identified the font, check the license before using it: personal-use-only faces in a commercial logo are a ready-made claim from the type foundry — we cover [the full licensing guide](../shrift-dlya-logotipa/) separately. Separately: copying a brand's typeface is easy, but a mark "in T-Bank's font" leads to a [confusion dispute](../mozhno-li-ispolzovat-chuzhoy-logotip/), not to a style of your own.
:::

## The mini cheat sheet

| Situation | Tool |
| --- | --- |
| An image/photo with text | WhatTheFont, Matcherator |
| Text on a website | Inspect → Computed, Fonts Ninja |
| Auto-ID is silent | clue detective + r/identifythisfont |
| The font is custom | find an open analogue |
| A PDF file | document properties → fonts |

Kindred tasks from our blog: [how to find out a logo's color](../kak-uznat-cvet-logotipa/) — the same detective work for the palette, [how to download a logo from a site](../kak-skachat-logotip-s-sajta/) — when you need the mark itself, and [choosing a logo font](../shrift-dlya-logotipa/) — picking a face for your own brand. The [catalog](../../logos/) is the place to study "mark + type" pairings: in strong brands the typography continues the mark's form.
