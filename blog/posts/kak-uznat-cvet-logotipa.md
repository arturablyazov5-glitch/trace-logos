---
title: Как узнать точный цвет логотипа — HEX‑код за 30 секунд
title_en: How to Find a Logo's Exact Color — the HEX Code in 30 Seconds
description: Пять способов узнать HEX‑код цвета логотипа: пипетка в браузере и Figma, официальные гайдлайны, SVG‑код и онлайн‑инструменты. Почему пипетка по JPG врёт.
description_en: Five ways to get a logo's HEX color — browser and Figma eyedroppers, official guidelines, the SVG source and online tools. Why an eyedropper on a JPG lies.
date: 2026-06-22
slug: kak-uznat-cvet-logotipa
tags: Цвета, Логотипы, Инструкции
tags_en: Colors, Logos, How-to
---

Нужно оформить кнопку «Войти через VK» в фирменном синем, подобрать фон под логотип клиента или собрать презентацию в цветах бренда — а точного кода цвета нет. На глаз подбирать нельзя: разница между «примерно таким зелёным» и фирменным #21A038 заметна сразу и выглядит неаккуратно. Разберём, как получить точный HEX‑код цвета любого логотипа.

:::note Коротко
Самый надёжный источник цвета — **SVG‑файл логотипа**: цвет записан прямо в коде, без искажений. Самый быстрый — **пипетка** в [Figma](../../logos/design/figma/) или расширении браузера. Самый опасный — пипетка по JPG‑картинке из поиска: сжатие искажает цвета, и вы скопируете «испорченный» оттенок.
:::

## Что такое HEX и почему все говорят на нём

HEX — это запись цвета в виде #RRGGBB: две шестнадцатеричных цифры на красный, зелёный и синий каналы. #FF0000 — чистый красный, #21A038 — зелёный [Сбера](../../logos/bank/sber/). Это универсальный язык: HEX понимают CSS, [Figma](../../logos/design/figma/), [Photoshop](../../logos/design/photoshop/), конструкторы сайтов и любой разработчик. В брендбуках цвет дублируют ещё в RGB (для экранов) и CMYK/Pantone (для печати), но в цифровой работе достаточно HEX.

## Способ 1. Взять из SVG — эталонный

Если у вас есть SVG логотипа, цвет уже записан внутри файла. Откройте SVG любым текстовым редактором и найдите атрибуты `fill`:

```
<path fill="#21A038" d="M45.2 12.6..."/>
```

Вот он, точный фирменный цвет — ровно тот, который заложил дизайнер, без искажений сжатия и цветовых профилей. Если заливок несколько, каждая — отдельный цвет палитры бренда.

## Способ 2. Пипетка в Figma

Вставьте логотип в [Figma](../../logos/design/figma/), выделите фигуру — цвет заливки покажется в правой панели, клик по нему открывает HEX. Либо пипетка (клавиша I) по любому месту холста. Работает и с векторными, и с растровыми файлами.

## Способ 3. Пипетка в браузере

- **Расширения‑колорпикеры** (ColorZilla и аналоги) — пипетка по любой точке любой страницы.
- **DevTools:** если цвет задан в CSS сайта, откройте инспектор (F12), найдите элемент — в стилях будет точное значение. Клик по цветному квадратику открывает пипетку.
- **[Chrome](../../logos/search/chrome/) без расширений:** в DevTools у любого поля цвета есть пипетка, которой можно ткнуть в страницу.

## Способ 4. Официальные гайдлайны бренда

У крупных компаний есть страницы brand assets / brand guidelines, где фирменные цвета выписаны явно: HEX, RGB, CMYK, Pantone. Это юридически «самый правильный» источник — тот самый цвет, который бренд просит использовать. Ищите по запросу «название бренда brand guidelines».

## Способ 5. Онлайн‑инструменты

Сервисы вроде image color picker: загружаете картинку, кликаете по точке, получаете HEX. Работает, но с оговоркой из следующего раздела.

## Почему пипетка иногда врёт

:::warning Три источника искажений
1. **JPG‑сжатие.** На границах цветов JPG создаёт переходные пиксели. Ткнули пипеткой в край буквы — получили не фирменный цвет, а его смесь с фоном. Всегда кликайте в центр крупной заливки.
2. **Цветовые профили.** Одна и та же картинка на разных мониторах и в разных браузерах может отдавать чуть разные значения — особенно если файл сохранён в Display P3, а не sRGB.
3. **Полупрозрачность и наложения.** Если логотип лежит на подложке с прозрачностью, пипетка снимет смешанный цвет, а не исходный.
:::

Отсюда правило: пипетка — для быстрых задач, SVG или гайдлайны — для чистовых.

## Что делать с цветом дальше

Получили HEX — дальше обычно нужно: собрать палитру вокруг него, проверить контраст текста на этом фоне (для доступности — контраст минимум 4.5:1 для обычного текста), сконвертировать в RGB или CMYK для печати. Любой конвертер цветов делает это мгновенно.

А если задача обратная — не узнать цвет, а поменять его в самом логотипе — у нас есть отдельная инструкция [как изменить цвет логотипа](../kak-izmenit-cvet-logotipa/).

## Шпаргалка по цветовым системам: HEX, RGB, HSL, CMYK, Pantone

Один и тот же цвет записывается пятью способами, и полезно понимать, когда какой нужен:

| Система | Пример (зелёный [Сбера](../../logos/bank/sber/)) | Где используется |
| --- | --- | --- |
| HEX | #21A038 | CSS, [Figma](../../logos/design/figma/), все цифровые задачи |
| RGB | rgb(33, 160, 56) | то же самое, другая запись |
| HSL | hsl(131, 66%, 38%) | удобна для подбора оттенков в CSS |
| CMYK | ≈ 79/0/89/0 | печать |
| Pantone | плашечный цвет по каталогу | брендовая печать, когда оттенок критичен |

Важные следствия. HEX и RGB — одно и то же число в разных обёртках, конвертация между ними точная. А вот **CMYK — другое цветовое пространство**: часть ярких экранных цветов в печати недостижима, поэтому конвертация «на глазок» онлайн‑калькулятором может разочаровать на бумаге. Для важной печати бренды заказывают цветопробу или используют Pantone — физический каталог эталонных красок, который не зависит от настроек принтера.

**HSL** — недооценённый помощник: запись «тон‑насыщенность‑светлота» позволяет осмысленно строить палитру от фирменного цвета: тёмная версия для ховера = тот же тон, меньше светлота; пастельный фон = тот же тон, меньше насыщенность, больше светлота.

## Как собрать всю палитру бренда, а не один цвет

Задача чаще звучит не «узнать цвет», а «собрать фирменные цвета для макета». Порядок:

1. **Основной цвет** — из SVG‑логотипа или гайдлайнов (способы выше).
2. **Вторичные цвета** — посмотрите живой продукт: сайт и приложение бренда. В DevTools загляните в CSS‑переменные (`:root` в стилях) — современные сайты держат палитру там, и это готовый список: основной, акцентный, фоновые, текстовые.
3. **Проверка контраста** — прежде чем использовать чужую палитру в своих макетах, прогоните пары «текст/фон» через проверку контраста (минимум 4.5:1 для обычного текста, 3:1 для крупного).
4. **Фиксация** — сохраните собранное стилями в [Figma](../../logos/design/figma/) или переменными в CSS, чтобы цвет вводился один раз, а не копипастился по файлам.

:::tip Пипетка по видео и градиентам
Два коварных случая. Видео: цвет в ролике искажён сжатием и цветокоррекцией — не снимайте фирменный цвет с кадра [YouTube](../../logos/media/youtube/), найдите статичный исходник. Градиенты: у градиентного логотипа «главных» цветов два и более — снимайте оба конца градиента, а в SVG они видны в теге `<linearGradient>` явными стопами.
:::

## Коротко

HEX из SVG‑кода — эталон, гайдлайны бренда — официальный источник, пипетка — быстрый способ с осторожностью на JPG. Кликайте в центр заливки, а не в края, и не доверяйте цветам из перекодированных картинок.

Чтобы не заниматься детективной работой: на странице каждого бренда в нашем [каталоге логотипов](../../logos/) есть блок «Цвета бренда» — все фирменные HEX‑коды, извлечённые прямо из оригинального SVG, копируются кликом.

---EN---

You need a "Sign in with VK" button in the brand's exact blue, a background that matches a client's logo, or a deck in corporate colors — and there's no color code in sight. Eyeballing it doesn't work: the gap between "roughly that green" and the official #21A038 is visible instantly and looks sloppy. Here's how to get the exact HEX of any logo color.

:::note TL;DR
The most reliable source is the **logo's SVG file** — the color is written right in the code, undistorted. The fastest is an **eyedropper** in [Figma](../../logos/design/figma/) or a browser extension. The most dangerous is an eyedropper on a JPG from image search: compression distorts colors and you'll copy a corrupted shade.
:::

## What HEX is and why everyone speaks it

HEX writes color as #RRGGBB: two hexadecimal digits each for red, green and blue. #FF0000 is pure red. It's the universal language understood by CSS, [Figma](../../logos/design/figma/), [Photoshop](../../logos/design/photoshop/), site builders and every developer. Brand books duplicate colors in RGB (screens) and CMYK/Pantone (print), but for digital work HEX is enough.

## Method 1. Read it from the SVG — the gold standard

If you have the logo's SVG, the color is already inside. Open the file in any text editor and look for `fill` attributes:

```
<path fill="#21A038" d="M45.2 12.6..."/>
```

That's the exact brand color as the designer defined it — no compression, no color-profile drift. Multiple fills means multiple palette colors.

## Method 2. The Figma eyedropper

Drop the logo into [Figma](../../logos/design/figma/), select a shape — the fill shows in the right panel with its HEX. Or press I for the eyedropper anywhere on canvas. Works with vector and raster files alike.

## Method 3. The browser eyedropper

- **Color-picker extensions** (ColorZilla and friends) — sample any pixel of any page.
- **DevTools:** if the color is set in the site's CSS, inspect the element (F12) — the exact value is right there in the styles.
- **[Chrome](../../logos/search/chrome/) without extensions:** any color swatch in DevTools opens an eyedropper you can point at the page.

## Method 4. Official brand guidelines

Large companies publish brand-assets pages where corporate colors are spelled out: HEX, RGB, CMYK, Pantone. Legally this is the "most correct" source — the color the brand itself asks you to use. Search for "brand name brand guidelines".

## Method 5. Online tools

Image-color-picker services: upload an image, click a point, get the HEX. Works — with the caveat below.

## Why the eyedropper sometimes lies

:::warning Three sources of distortion
1. **JPG compression.** JPG creates transitional pixels along color edges. Sample the edge of a letter and you get a mix with the background, not the brand color. Always click the center of a large solid area.
2. **Color profiles.** The same image can yield slightly different values across monitors and browsers — especially if saved in Display P3 rather than sRGB.
3. **Transparency and overlays.** A logo sitting on a semi-transparent layer gives the eyedropper a blended color, not the original.
:::

Hence the rule: eyedropper for quick jobs, SVG or guidelines for final work.

## What to do with the color next

With the HEX in hand you'll typically: build a palette around it, check text contrast on that background (accessibility wants at least 4.5:1 for body text), convert to RGB or CMYK for print. Any color converter does it instantly.

And if your task is the reverse — not reading the color but changing it in the logo itself — we have a separate guide: [how to change a logo's color](../kak-izmenit-cvet-logotipa/).

## The color-system cheat sheet: HEX, RGB, HSL, CMYK, Pantone

One color, five notations — and it pays to know which is for what:

| System | Example ([Sber](../../logos/bank/sber/) green) | Used in |
| --- | --- | --- |
| HEX | #21A038 | CSS, [Figma](../../logos/design/figma/), everything digital |
| RGB | rgb(33, 160, 56) | same number, different wrapper |
| HSL | hsl(131, 66%, 38%) | handy for deriving shades in CSS |
| CMYK | ≈ 79/0/89/0 | print |
| Pantone | a spot color from the catalog | brand print where the shade is critical |

The consequences that matter. HEX and RGB are the same number — conversion is exact. **CMYK is a different color space**: some bright screen colors are unreachable in print, so a casual online conversion can disappoint on paper. For serious print, brands order proofs or use Pantone — a physical catalog of reference inks independent of any printer's settings.

**HSL** is the underrated helper: hue-saturation-lightness lets you derive a palette from the brand color meaningfully: the hover shade = same hue, lower lightness; a pastel background = same hue, lower saturation, higher lightness.

## Collecting the whole brand palette, not just one color

The real task is usually "gather the brand colors for a mockup". The order:

1. **The primary** — from the SVG logo or the guidelines (methods above).
2. **The secondaries** — inspect the live product: the brand's site and app. In DevTools, check the CSS variables (`:root` in the styles) — modern sites keep the palette there, a ready-made list: primary, accent, backgrounds, text colors.
3. **Contrast check** — before using a borrowed palette, run the text/background pairs through a contrast checker (4.5:1 minimum for body text, 3:1 for large).
4. **Fixation** — store the result as [Figma](../../logos/design/figma/) styles or CSS variables so the color is entered once, not copy-pasted around.

:::tip Eyedropping video and gradients
Two treacherous cases. Video: colors in footage are skewed by compression and grading — don't sample a brand color from a [YouTube](../../logos/media/youtube/) frame; find a static source. Gradients: a gradient logo has two or more "primary" colors — sample both ends; in the SVG they're explicit stops inside `<linearGradient>`.
:::

## In short

HEX from the SVG source is the gold standard, brand guidelines are the official source, the eyedropper is the quick way — used carefully on JPGs. Click the middle of solid fills, not edges, and don't trust colors from re-encoded images.

To skip the detective work entirely: every brand page in our [logo catalog](../../logos/) has a "Brand colors" block — all official HEX codes extracted straight from the original SVG, copied with one click.
