---
title: Логотип для печати — CMYK, Pantone и какие файлы нужны типографии
title_en: Preparing a Logo for Print — CMYK, Pantone and the Files Printers Need
description: Готовим логотип к печати: разница RGB и CMYK, когда нужен Pantone, векторные форматы для типографии, минимальные размеры и монохромные версии. Чек‑лист.
description_en: Getting a logo print-ready: RGB vs CMYK, when you need Pantone, vector formats for the print shop, minimum sizes and monochrome versions. A checklist.
date: 2026-08-15
slug: logotip-dlya-pechati
tags: Инструкции, Печать, Форматы
tags_en: How-To, Print, Formats
---

Логотип отлично выглядел на экране — а на визитках приехал грязно‑бурым, на футболке размылся, а типография вернула макет с пометкой «нужен вектор и CMYK». Печать живёт по другим законам, чем экран, и большинство сюрпризов происходят ровно на этой границе. Разбираем, что нужно знать и какие файлы готовить, чтобы логотип печатался предсказуемо.

:::note Коротко
Экран показывает цвет светом (**RGB**), печать — краской (**CMYK**), и не все экранные цвета воспроизводимы краской: яркие салатовые, бирюзовые и «кислотные» тускнеют. Для точного фирменного цвета используют плашечные краски **Pantone**. Типографии нужен **вектор** (PDF/EPS/SVG) с текстом в кривых; растр — только 300 dpi в реальном размере. Обязательно иметь **монохромную версию** знака.
:::

## RGB и CMYK: почему цвет «уезжает»

Экран складывает цвет из светящихся точек — красной, зелёной и синей (RGB). Принтер — из четырёх красок: голубой, пурпурной, жёлтой и чёрной (CMYK). Диапазон CMYK уже: часть ярких экранных цветов краской воспроизвести физически невозможно — они автоматически заменяются ближайшими, и логотип «тускнеет». Особенно страдают яркие оранжевые, салатовые, бирюзовые и неоновые оттенки.

Что делать: перед сдачей в печать конвертируйте макет в CMYK сами (в [Illustrator](../../logos/design/illustrator/) или [Photoshop](../../logos/design/photoshop/): Edit → Convert to Profile) и посмотрите, что изменилось. Лучше увидеть сдвиг на экране и скорректировать, чем получить сюрприз тиражом 5000 штук. HEX‑коды фирменных цветов — экранная запись; их CMYK‑эквиваленты фиксируются отдельно в [брендбуке](../chto-takoe-brendbuk/).

## Pantone: когда четырёх красок мало

CMYK‑печать смешивает цвет из четырёх красок растровыми точками — и один и тот же макет в двух типографиях может выйти чуть по‑разному. Когда фирменный цвет критичен (а для брендов уровня [Сбера](../../logos/bank/sber/) он критичен всегда), используют **Pantone** — готовые смесевые краски по всемирному каталогу: номер краски гарантирует одинаковый цвет в любой типографии мира.

Pantone нужен не всегда: для визиток и листовок достаточно CMYK. Он оправдан для фирменного цвета на больших тиражах, упаковке, мерче — и обязателен, если цвет — главный актив бренда, а [почему цвет так важен](../psihologiya-cveta-v-logotipe/) в принципе, мы разбирали отдельно. Учтите: Pantone — это дополнительная краска и дополнительные деньги за прогон.

## Вектор — обязательное условие

Типография попросит вектор, и вот почему: печатный станок работает с разрешениями, при которых любой растровый логотип из шапки сайта превращается в [мыло](../pochemu-logotip-razmytyj/). Вектор масштабируется на баннер 3×6 метров без потерь — [как это работает](../vektor-i-rastr-raznica/), мы объясняли отдельно.

Что именно отправлять:

- **PDF** — стандарт де‑факто для типографий: вектор + управление цветом в одном файле.
- **EPS** — «старый мировой стандарт», его до сих пор просят типографии со стажем.
- **SVG** — родной формат веба; для печати его обычно пересохраняют в PDF/EPS — [разбор всех векторных форматов](../vektornye-formaty-eps-ai-pdf-svg/) мы делали отдельно.
- **Текст — только в кривых:** если в логотипе есть шрифт, переведите его в контуры перед отправкой, иначе на компьютере типографии он заменится системным — [почему так происходит](../shrift-dlya-logotipa/), объясняли в статье про шрифт для логотипа.

Если вектора нет — сначала [переведите логотип в вектор](../kak-perevesti-logotip-v-vektor/), это разовая работа, которая закрывает вопрос навсегда. Растровый файл допустим только для фотографий: 300 dpi в физическом размере печати, в CMYK, без сжатия JPG.

## Монохром и инверсия: версии, о которых забывают

Печать регулярно бывает одноцветной: гравировка на ручке, тиснение на блокноте, шелкография одним прогоном, факсовые бланки, печати и штампы. Для этого нужна **монохромная версия** знака — не «обесцвеченный» основной логотип, а специально подготовленный: градиенты заменены сплошными заливками, мелкие детали укрупнены, полутона убраны. Плюс **инверсная версия** для тёмных поверхностей. Состав полного комплекта версий мы разбирали в статье [виды логотипов](../vidy-logotipov/).

:::warning Градиент — главный враг печати
Градиентные знаки (как у [Instagram](../istoriya-logotipa-instagram/) или Wildberries) в одноцветной печати не воспроизводимы в принципе — им нужна отдельная плоская версия. Если ваш логотип градиентный, монохромная версия — не опция, а обязательная часть комплекта.
:::

## Минимальный размер и охранное поле

У печатного логотипа есть физический предел читаемости: тонкие линии при печати меньше ~0,1 мм просто исчезают, а мелкий текст дескриптора превращается в грязь. Правила:

1. Определите **минимальный размер** знака в миллиметрах (обычно 8‑15 мм по ширине) и проверьте его тестовой печатью на обычном принтере.
2. Соблюдайте **охранное поле** — свободную зону вокруг знака (обычно в размер буквы или элемента логотипа), куда не заходят текст и графика.
3. Для очень мелкой печати (ярлыки, ручки) используйте упрощённую версию знака — по той же логике, что и для [фавиконок](../kak-sdelat-favicon/).

## Чек‑лист сдачи в типографию

- Векторный файл: PDF или EPS, текст в кривых, цвет в CMYK (или с указанием Pantone).
- Растровые элементы (если есть): 300 dpi в реальном размере, CMYK.
- Монохромная и инверсная версии — отдельными файлами.
- Указан минимальный размер и приложен превью‑JPG «как должно выглядеть».
- Для сложных случаев запрошена **цветопроба** — тестовый оттиск до тиража.

Если собираете комплект логотипа с нуля — начните со статей [в каком формате нужен логотип](../v-kakom-formate-nuzhen-logotip/) и [как заказать логотип у дизайнера](../kak-zakazat-logotip-u-dizajnera/): требования к печати проще заложить в ТЗ, чем доделывать потом. А посмотреть, как выглядят аккуратные векторные исходники, можно в нашем [каталоге логотипов](../../logos/) — каждый файл там в SVG, готовом к конвертации в печатные форматы.

---EN---

The logo looked great on screen — then arrived muddy-brown on the business cards, blurred on the T-shirt, and the print shop bounced the file with "we need vector and CMYK". Print lives by different laws than screens, and most surprises happen exactly at that border. Here's what to know and which files to prepare so your logo prints predictably.

:::note TL;DR
Screens make color with light (**RGB**), print makes it with ink (**CMYK**), and not every screen color is reproducible in ink: vivid limes, teals and neons go dull. For exact brand colors there are **Pantone** spot inks. The print shop needs **vector** (PDF/EPS/SVG) with text outlined; raster only at 300 dpi at physical size. Always keep a **monochrome version** of the mark.
:::

## RGB vs CMYK: why colors drift

A screen builds color from glowing red, green and blue dots (RGB). A press builds it from four inks: cyan, magenta, yellow and black (CMYK). The CMYK range is narrower: some vivid screen colors are physically impossible in ink — they get swapped for nearest matches and the logo "fades". Bright oranges, limes, teals and neons suffer most.

What to do: convert the artwork to CMYK yourself before handoff (in [Illustrator](../../logos/design/illustrator/) or [Photoshop](../../logos/design/photoshop/): Edit → Convert to Profile) and see what shifted. Better to catch the drift on screen than in a 5,000-copy run. HEX codes are screen notation; their CMYK equivalents belong in the [brand book](../chto-takoe-brendbuk/).

## Pantone: when four inks aren't enough

CMYK mixes color from four inks via halftone dots — and the same file can come out slightly different at two print shops. When the brand color is critical (for brands of [Sber](../../logos/bank/sber/)'s scale it always is), **Pantone** spot inks are used — pre-mixed inks from a worldwide catalog: the ink number guarantees the same color at any printer on the planet.

You don't always need Pantone: CMYK is fine for business cards and flyers. It pays off for the brand color on large runs, packaging and merch — and is mandatory when color is the brand's main asset — we cover [why color matters so much](../psihologiya-cveta-v-logotipe/) separately. Note: Pantone is an extra ink and extra cost per run.

## Vector is non-negotiable

The print shop will ask for vector, and here's why: presses work at resolutions where any raster logo grabbed from a site header turns to [mush](../pochemu-logotip-razmytyj/). Vector scales to a 3×6-meter banner losslessly — we explain [how that works](../vektor-i-rastr-raznica/) separately.

What to send:

- **PDF** — the de facto print standard: vector plus color management in one file.
- **EPS** — the "old world standard", still requested by veteran shops.
- **SVG** — the web's native format; for print it's usually re-saved as PDF/EPS — we cover [all vector formats compared](../vektornye-formaty-eps-ai-pdf-svg/) separately.
- **Text outlined:** if the logo contains type, convert it to curves before sending, or the shop's computer will substitute a system font — [why that happens](../shrift-dlya-logotipa/) is covered in our piece on logo fonts.

No vector? [Vectorize the logo](../kak-perevesti-logotip-v-vektor/) first — a one-time job that closes the question forever. Raster is acceptable only for photos: 300 dpi at physical print size, CMYK, no JPG compression.

## Monochrome and inverse: the forgotten versions

Print is regularly single-color: engraving on a pen, embossing on a notebook, one-pass screen printing, stamps. That requires a **monochrome version** — not a desaturated primary logo but a purpose-built one: gradients replaced with solid fills, small details enlarged, halftones removed. Plus an **inverse version** for dark surfaces. The full version kit is described in [types of logos](../vidy-logotipov/).

:::warning Gradients are print's worst enemy
Gradient marks (like [Instagram](../istoriya-logotipa-instagram/)'s or Wildberries') are fundamentally unreproducible in single-color print — they need a dedicated flat version. If your logo is gradient, the monochrome version isn't optional; it's a required part of the kit.
:::

## Minimum size and clear space

A printed logo has a physical readability limit: lines thinner than ~0.1 mm vanish on press, and tiny descriptor text turns to mud. The rules:

1. Define the mark's **minimum size** in millimeters (usually 8-15 mm wide) and verify it with a test print on an office printer.
2. Respect the **clear space** — a protected zone around the mark (typically one letter or element of the logo) free of text and graphics.
3. For very small print (tags, pens) use a simplified mark — the same logic as [favicons](../kak-sdelat-favicon/).

## The print handoff checklist

- Vector file: PDF or EPS, text outlined, colors in CMYK (or with Pantone numbers).
- Raster elements (if any): 300 dpi at physical size, CMYK.
- Monochrome and inverse versions as separate files.
- Minimum size stated and a preview JPG of "how it should look" attached.
- For critical jobs, a **press proof** requested before the run.

Building a logo kit from scratch? Start with [what format a logo should be in](../v-kakom-formate-nuzhen-logotip/) and [how to commission a logo](../kak-zakazat-logotip-u-dizajnera/): print requirements are easier to bake into the brief than to retrofit. And to see what clean vector sources look like, browse our [logo catalog](../../logos/) — every file there is SVG, ready for conversion to print formats.
