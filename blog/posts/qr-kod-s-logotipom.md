---
title: Как сделать QR‑код с логотипом — и чтобы он сканировался
title_en: How to Make a QR Code With a Logo That Still Scans
description: Почему QR‑код продолжает работать с логотипом в центре, какой уровень коррекции ошибок выбрать, где сделать такой код бесплатно и как его проверить
description_en: Why a QR code still works with a logo in the middle, which error-correction level to pick, free tools to make one and how to test it
date: 2026-08-29
slug: qr-kod-s-logotipom
tags: QR-код, Брендинг, Инструкции
tags_en: QR Code, Branding, How-To
---

QR‑код на визитке, меню или упаковке — почти всегда безликий чёрно‑белый квадрат. При этом вставить в центр логотип и покрасить код в фирменный цвет можно бесплатно за пять минут — и он продолжит сканироваться. Главное — понимать, за счёт чего это работает, чтобы не перейти грань, после которой камера перестанет читать код.

:::note Коротко
QR‑код выдерживает логотип в центре благодаря **избыточности**: при уровне коррекции ошибок **H** код читается, даже если испорчено до **30%** поверхности. Правила безопасности: логотип — не больше 20‑25% площади, уровень коррекции — H, тёмный код на светлом фоне (не наоборот), обязательная «тихая зона» по краям и тест на нескольких телефонах перед печатью.
:::

## Почему код работает даже с «дыркой» в центре

QR‑код изначально спроектирован для суровых условий — заводов Toyota, грязи и повреждённых этикеток. Поэтому в него встроена коррекция ошибок по алгоритму Рида — Соломона: данные записываются с избыточностью, и часть модулей (чёрно‑белых квадратиков) можно потерять без потери содержимого.

Уровней коррекции четыре:

| Уровень | Восстанавливает | Когда использовать |
| --- | --- | --- |
| L | до 7% | максимум данных, никакого логотипа |
| M | до 15% | стандарт по умолчанию |
| Q | до 25% | небольшой логотип |
| **H** | **до 30%** | **логотип в центре — ваш выбор** |

Логотип в центре кода — это, с точки зрения сканера, просто «повреждение». Пока оно меньше запаса прочности, код читается как ни в чём не бывало.

:::warning Важный нюанс
30% — это запас на **все** повреждения сразу: логотип, блики, изгиб упаковки, потёртости печати. Если логотип съел 25%, на реальную жизнь остаётся всего 5%. Поэтому практический потолок для логотипа — 20‑25% площади, а не все 30%.
:::

## Пошаговая инструкция

### Шаг 1. Подготовьте логотип

Лучше всего работает компактный знак — иконка, а не полная версия с текстом (чем они отличаются, мы разбирали в статье [виды логотипов](../vidy-logotipov/)). Скачайте SVG или PNG нужного бренда — например, из нашего [каталога логотипов](../../logos/): у каждого бренда там лежит отдельная иконка. Логотип на подложке‑плашке (белый квадрат или круг) сканируется надёжнее, чем «голый» знак поверх модулей.

### Шаг 2. Сгенерируйте код

Бесплатных генераторов с поддержкой логотипа много: QRCode Monkey, QR.io, Flowcode и другие; свои генераторы есть в [Canva](../../logos/design/canva/) и [Adobe Express](../../logos/design/adobeexpress/). Что важно выставить в настройках:

1. **Уровень коррекции — H.** Иногда прячется в «расширенных настройках».
2. **Логотип — по центру,** размером не более четверти кода.
3. **Формат экспорта — SVG,** если код пойдёт в печать: вектор останется чётким в любом размере (почему это важно — в статье [векторная и растровая графика](../vektor-i-rastr-raznica/)). Для веба хватит PNG.

### Шаг 3. Цвет — по правилам контраста

Код можно покрасить в фирменный цвет, но с ограничениями:

- **Тёмный код на светлом фоне.** Инверсия (белый код на тёмном) читается не всеми сканерами.
- **Контраст — максимальный.** Светло‑жёлтый код на белом не считается. Проверить контрастность пары цветов можно на глаз по правилу: сфотографируйте макет в чёрно‑белом режиме — код должен остаться очевидно темнее фона.
- **Градиенты допустимы,** если оба конца градиента достаточно тёмные.

Точный фирменный цвет бренда удобно взять прямо со страницы логотипа в нашем каталоге — как это сделать, показывали в статье [как узнать цвет логотипа](../kak-uznat-cvet-logotipa/).

### Шаг 4. Не трогайте служебные зоны

У QR‑кода есть неприкосновенные элементы:

- **Три больших квадрата по углам** — метки позиционирования: по ним камера находит и ориентирует код.
- **Тихая зона** — пустое поле шириной минимум в 4 модуля по периметру. Не придвигайте к коду текст и рамки вплотную.
- **Маленький квадрат ближе к правому нижнему углу** — метка выравнивания.

Логотип должен лежать строго в центре и не задевать ни одну из меток.

### Шаг 5. Протестируйте до печати

:::danger Обязательный шаг
Проверьте код минимум на двух телефонах ([iPhone](../../logos/tech/apple/) и Android), со штатной камеры, при плохом освещении и под углом. Если тираж печатный — сначала распечатайте один экземпляр в реальном размере. Минимальный физический размер кода для сканирования «с руки» — примерно 2×2 см; для плаката действует правило: размер кода ≈ расстояние сканирования ÷ 10.
:::

## Чем короче ссылка, тем надёжнее код

Ещё один рычаг надёжности, о котором почти никто не думает, — **объём данных**. QR‑код существует в 40 «версиях»: версия 1 — сетка 21×21 модуль, версия 40‑177×177. Чем больше символов вы зашиваете, тем выше версия, мельче модули и капризнее сканирование — особенно с логотипом, который съедает часть и без того мелкой сетки.

Практические следствия:

- **Сокращайте ссылку.** `example.ru/qr` вместо длинного URL с UTM‑парамет­рами опускает код на несколько версий вниз — модули становятся крупнее, код читается с большего расстояния и хуже боится повреждений.
- **UTM‑метки — через редирект.** Пусть короткая ссылка на вашем домене отдаёт 301‑редирект на длинную с метками: аналитика сохраняется, код остаётся простым.
- **Не шейте в код текст «про запас».** Визитка с vCard на 500 символов — это версия 20+ с микроскопическими модулями; ссылка на страницу контактов работает лучше.

Правило: если в макете код выглядит как мелкая шахматная крупа — данных слишком много. Уменьшайте полезную нагрузку, а не логотип.

## Стилизация модулей: где проходит граница

Генераторы наперебой предлагают «красивые» коды: скруглённые точки, кружочки вместо квадратов, фигурные глазки‑метки. Что из этого безопасно:

-    ✅ **Лёгкое скругление углов модулей** — читается без проблем.
-    ✅ **Фирменный цвет** при соблюдении контраста из предыдущего раздела.
-    ⚠️ **Точки‑кружки вместо квадратов** — работают, но уменьшают эффективную площадь каждого модуля; не сочетайте с крупным логотипом.
-    ⚠️ **Фигурные глазки** (скруглённые, в форме листа) — допустимы, если сохранён общий силуэт «квадрат в квадрате».
-    ⛔ **Градиент между светлым и тёмным**, узоры внутри модулей, фото‑фон под кодом — главные убийцы сканируемости.

Хорошее правило: стилизация должна быть незаметна сканеру. Если после украшения код перестал читаться в тени или под углом — откатывайте по одному эффекту, начиная с самого агрессивного.

## Частые ошибки

- **Логотип больше трети кода.** Красиво на макете — мертво в жизни.
- **Уровень коррекции L «для компактности»** плюс логотип — код не читается вовсе.
- **Белый код на тёмном фоне.** Часть сканеров не понимает инверсию.
- **Код сжат в JPG.** Артефакты сжатия размывают границы модулей; используйте PNG или SVG (разницу форматов разбирали в статье [PNG или JPG](../png-ili-jpg-chto-luchshe/)).
- **Динамическая ссылка через сомнительный сервис‑посредник.** Если сервис закроется, все напечатанные коды умрут. Для важных тиражей шейте в код прямую ссылку на свой домен.

## Чек‑лист перед отправкой в печать

1. Уровень коррекции — **H**.
2. Логотип ≤ 25% площади, по центру, не задевает угловые метки.
3. Ссылка сокращена, UTM — через редирект на своём домене.
4. Тёмный код на светлом фоне, контраст проверен.
5. Тихая зона — минимум 4 модуля пустоты по периметру.
6. Экспорт в SVG (печать) или PNG (экран), никакого JPG.
7. Тест: два телефона, штатная камера, плохой свет, угол 45°.
8. Для печатных тиражей — пробный отпечаток в реальном размере.
9. Ссылка ведёт на мобильную версию страницы: сканируют с телефона.
10. Код подписан действием — «Наведи камеру — открой меню»: конверсия у подписанных кодов заметно выше.

## Коротко

QR‑код с логотипом — это не хак, а штатная возможность формата: избыточность уровня H честно оплачивает «дырку» в центре. Держите логотип в пределах четверти площади, ставьте коррекцию H, следите за контрастом и тихой зоной, тестируйте до печати — и брендированный код будет сканироваться так же надёжно, как чёрно‑белый. Иконки брендов для вставки в код — в нашем [каталоге логотипов](../../logos/), в SVG и PNG.

---EN---

A QR code on a business card, menu or package is almost always a faceless black-and-white square. Yet dropping a logo in the middle and painting the code in brand colors takes five minutes and zero budget — and it will still scan. The key is understanding why it works, so you don't cross the line where cameras stop reading it.

:::note TL;DR
A QR code survives a logo in the middle thanks to **redundancy**: at error-correction level **H** the code stays readable with up to **30%** of its surface damaged. Safety rules: logo no larger than 20-25% of the area, correction level H, dark code on a light background (never inverted), a mandatory quiet zone around the edges, and a test on several phones before printing.
:::

## Why the code works with a "hole" in the middle

The QR code was engineered for harsh environments — Toyota factories, dirt, damaged labels. So it ships with Reed–Solomon error correction: data is written redundantly, and a share of modules (the little black-and-white squares) can be lost without losing the content.

There are four correction levels:

| Level | Recovers | When to use |
| --- | --- | --- |
| L | up to 7% | maximum data, no logo |
| M | up to 15% | the everyday default |
| Q | up to 25% | a small logo |
| **H** | **up to 30%** | **a centered logo — your pick** |

To the scanner, a logo in the middle is just "damage". As long as it stays within the safety margin, the code reads as if nothing happened.

:::warning The catch
30% is the budget for **all** damage combined: the logo, glare, package curvature, print wear. If the logo eats 25%, only 5% is left for real life. So the practical ceiling for a logo is 20-25% of the area, not the full 30%.
:::

## Step by step

### Step 1. Prepare the logo

A compact mark works best — the icon, not the full lockup with text (see [types of logos](../vidy-logotipov/) for the difference). Download the SVG or PNG of the brand you need — for example from our [logo catalog](../../logos/), where every brand ships a standalone icon. A logo on a backing plate (white square or circle) scans more reliably than a "bare" mark over the modules.

### Step 2. Generate the code

Plenty of free generators support logos: QRCode Monkey, QR.io, Flowcode and others; [Canva](../../logos/design/canva/) and [Adobe Express](../../logos/design/adobeexpress/) have built-in ones. What to set:

1. **Correction level — H.** Sometimes hidden under "advanced settings".
2. **Logo — centered,** no more than a quarter of the code.
3. **Export as SVG** if the code goes to print: vector stays crisp at any size (why that matters — [vector vs raster](../vektor-i-rastr-raznica/)). PNG is fine for the web.

### Step 3. Color by the contrast rules

You can paint the code in brand colors, with limits:

- **Dark code on a light background.** Inverted codes (light on dark) aren't read by all scanners.
- **Maximize contrast.** Pale yellow on white doesn't count. Quick check: photograph the layout in black-and-white mode — the code must remain obviously darker than the background.
- **Gradients are fine** if both ends of the gradient are dark enough.

The exact brand color is easy to grab right from the logo's page in our catalog — see [how to find out a logo's color](../kak-uznat-cvet-logotipa/).

### Step 4. Don't touch the functional zones

A QR code has untouchable parts:

- **Three big corner squares** — finder patterns: the camera uses them to locate and orient the code.
- **The quiet zone** — an empty margin at least 4 modules wide around the perimeter. Don't crowd the code with text or borders.
- **The small square near the bottom-right** — the alignment pattern.

The logo must sit strictly in the center and clear all of these marks.

### Step 5. Test before printing

:::danger Non-negotiable
Test the code on at least two phones ([iPhone](../../logos/tech/apple/) and Android), with the stock camera, in poor light and at an angle. For print runs, print one copy at real size first. The minimum physical size for handheld scanning is about 2×2 cm; for posters use the rule: code size ≈ scanning distance ÷ 10.
:::

## The shorter the link, the tougher the code

Another reliability lever almost nobody thinks about — **payload size**. QR codes come in 40 "versions": version 1 is a 21×21 module grid, version 40 is 177×177. The more characters you encode, the higher the version, the smaller the modules and the fussier the scanning — especially with a logo eating part of an already fine grid.

Practical consequences:

- **Shorten the link.** `example.com/qr` instead of a long UTM-laden URL drops the code several versions down — modules get bigger, the code scans from farther away and shrugs off damage better.
- **UTM tags via redirect.** Let a short link on your own domain 301-redirect to the long tagged one: analytics survive, the code stays simple.
- **Don't encode text "just in case".** A business card with a 500-character vCard is version 20+ with microscopic modules; a link to a contact page works better.

Rule of thumb: if the code looks like fine checkered grit in the layout, the payload is too big. Shrink the data, not the logo.

## Styling the modules: where the line is

Generators race to offer "pretty" codes: rounded dots, circles instead of squares, decorative finder eyes. What's actually safe:

-  ✅ **Slightly rounded module corners** — scans fine.
-  ✅ **Brand color** within the contrast rules from the earlier section.
-  ⚠️ **Circle dots instead of squares** — work, but shrink each module's effective area; don't combine with a large logo.
-  ⚠️ **Shaped finder eyes** (rounded, leaf-shaped) — acceptable while the overall "square in a square" silhouette survives.
-  ⛔ **Light-to-dark gradients**, patterns inside modules, a photo background under the code — the top scannability killers.

A good rule: styling should be invisible to the scanner. If a decorated code stops reading in shade or at an angle, roll back one effect at a time, starting with the most aggressive.

## Common mistakes

- **Logo bigger than a third of the code.** Pretty in the mockup — dead in the field.
- **Correction level L "to keep it compact"** plus a logo — the code won't read at all.
- **Light code on a dark background.** Some scanners don't handle inversion.
- **Code saved as JPG.** Compression artifacts blur module edges; use PNG or SVG (formats compared in [PNG vs JPG](../png-ili-jpg-chto-luchshe/)).
- **A dynamic link through a questionable middleman service.** If the service dies, every printed code dies with it. For important runs, encode a direct link to your own domain.

## Pre-print checklist

1. Correction level — **H**.
2. Logo ≤ 25% of the area, centered, clear of the corner finder patterns.
3. Link shortened; UTM handled by a redirect on your own domain.
4. Dark code on a light background, contrast verified.
5. Quiet zone — at least 4 modules of emptiness around the perimeter.
6. Export as SVG (print) or PNG (screen), never JPG.
7. Test: two phones, stock camera, poor light, 45° angle.
8. For print runs — a proof print at real size.
9. The link opens a mobile-friendly page: people scan with phones.
10. The code is captioned with an action — "Point your camera — open the menu": captioned codes convert noticeably better.

## In short

A QR code with a logo isn't a hack — it's a built-in feature of the format: level-H redundancy honestly pays for the "hole" in the middle. Keep the logo within a quarter of the area, set correction to H, watch contrast and the quiet zone, test before printing — and a branded code will scan as reliably as a black-and-white one. Brand icons to drop into your code are in our [logo catalog](../../logos/), in SVG and PNG.
