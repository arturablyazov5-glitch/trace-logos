---
title: Логотип с прозрачным фоном — как сделать, скачать и не получить белый квадрат
title_en: Logo with a Transparent Background — How to Make One and Avoid the White Box
description: Как убрать белый фон у логотипа: онлайн-инструменты, Figma, Photoshop. Почему JPG всегда с фоном, чем PNG отличается от SVG и как проверить прозрачность.
description_en: How to remove a logo's white background — online tools, Figma, Photoshop. Why JPG always has a background and how to verify transparency.
date: 2026-06-30
slug: logotip-s-prozrachnym-fonom
tags: Логотипы, PNG, Инструкции
tags_en: Logos, PNG, How-to
---

Ставите логотип на цветной баннер, а он приезжает в белом прямоугольнике, как марка на конверте. Белый квадрат вокруг логотипа — вечная боль презентаций, лендингов и соцсетей. Разберём, откуда он берётся, как его убрать за минуту и как скачивать логотипы сразу без фона.

:::note Коротко
Белый фон — свойство формата **JPG: он не умеет иметь прозрачность в принципе**. Прозрачность поддерживают PNG, SVG и WebP. Если у вас JPG — фон придётся удалять инструментом. Если есть возможность, просто скачайте логотип сразу в PNG или SVG с прозрачностью. Это быстрее и качественнее любой обработки.
:::

## Почему у логотипа вообще есть фон

У изображения не бывает «пустоты». Каждый пиксель обязан иметь значение. Форматы решают это по-разному:

- **JPG** хранит только цвет. Прозрачности в формате нет физически, поэтому «пустые» места заливаются белым (или тем, что было под логотипом при сохранении).
- **PNG** хранит цвет + альфа-канал (степень прозрачности каждого пикселя). Логотип на прозрачном PNG ложится на любой фон.
- **SVG** — вектор. Фон в нём просто отсутствует, если его специально не нарисовали отдельным прямоугольником.

Отсюда правило номер один: **ищите исходник, а не чините JPG**. Удаление фона — всегда компромисс. Файл, изначально сохранённый с прозрачностью, всегда лучше.

## Как проверить, прозрачный ли фон

Белый фон на белой странице невидим — легко обмануться. Быстрые проверки:

1. Перетащите файл в [Figma](../../logos/design/figma/) или любой редактор и подложите цветной фон.
2. Откройте файл в браузере в тёмной теме.
3. Расширение файла: .jpg — фон точно есть; .png и .svg — прозрачность возможна, но не гарантирована (PNG умеют сохранять и с белым фоном).

## Как убрать белый фон

### Онлайн-инструменты — 30 секунд

Сервисы удаления фона ([remove.bg](https://www.remove.bg/) и десятки аналогов) справляются с логотипами на однотонном фоне почти идеально: загрузили JPG — скачали PNG с прозрачностью. Ограничения: бесплатные версии часто отдают уменьшенный размер, а тонкие детали и полупрозрачные элементы (тени, градиенты в прозрачность) могут пострадать.

### Figma с ИИ из коробки (на платных планах)

У [Figma](../../logos/design/figma/) есть встроенный ИИ-инструмент **Remove background**: выделяете картинку → в панели действий или во всплывающем тулбаре изображения жмёте «Remove background» — фон уходит без плагинов. Рядом там же — **Boost resolution**, апскейл размытой картинки без потери резкости, и обработку можно применить сразу к нескольким изображениям. Нюанс: эти ИИ-функции доступны только на платных планах (Professional/Organization/Enterprise) с полным местом (Full seat) и включённым AI — на бесплатном тарифе их нет, тогда выручают плагины (Remove BG и аналоги). Там же в 2026 году появился **Vectorize** — тем же ИИ-движком картинка одним кликом превращается в редактируемый вектор (цветной, чёрно-белый или ч/б-контур), так что для логотипов из простых фигур пересобирать вручную обычно не нужно: конвертируете через Vectorize и дочищаете форму. Он же ограничен платными планами; на бесплатном — только вставить картинку и обвести знак пером самостоятельно.

### Photoshop — максимум качества

Выделение → Select Subject (автоматика на нейросети) → инвертировать → удалить фон → сохранить в PNG. Для сложных случаев — ручная доводка маской. Это путь, когда логотип нужен большим и безупречным.

:::warning Ловушка «белых ушей»
После автоматического удаления фона вокруг контуров часто остаётся тонкая белая кайма (остатки полупрозрачных пикселей JPG). На светлом фоне её не видно, на тёмном — бросается в глаза. В [Photoshop](../../logos/design/photoshop/) лечится командой Layer → Matting → Remove White Matte, в онлайн-сервисах — обычно никак. Ещё одна причина искать исходник.
:::

## Лучшее решение: скачать сразу без фона

Для известных брендов удалять фон вручную — двойная работа: прозрачные исходники уже существуют.

- **SVG-логотип** — прозрачен по природе формата.
- **PNG из официальных пресс-китов** — почти всегда с альфа-каналом.
- **Каталоги логотипов** — отдают файлы сразу в нужном виде.

В нашем [каталоге](../../logos/) у каждого бренда и SVG, и PNG идут с прозрачным фоном по умолчанию — скачивайте и кладите на любой фон без обработки.

## А если фон нужен, но другой?

Частный случай: фон нужно не удалить, а заменить — например, белую версию логотипа положить на фирменный цвет. Порядок такой: сначала прозрачный исходник, потом подложка нужного цвета в редакторе. Не наоборот: перекрашивать пиксели фона вокруг логотипа — путь к грязным краям. Если заодно нужно перекрасить сам логотип — вот [инструкция про цвет](../kak-izmenit-cvet-logotipa/).

## Частые вопросы

**Почему в Word/PowerPoint логотип всё равно с фоном?** Проверьте, что вставляете PNG, а не JPG. В PowerPoint есть и встроенное удаление фона: Формат рисунка → Удалить фон.

**Прозрачный PNG стал с чёрным фоном при загрузке на сайт?** Площадка конвертировала его в JPG. Читайте требования загрузки: где принимают только JPG, прозрачность невозможна — готовьте версию логотипа на подложке.

**Как сохранить прозрачность при уменьшении?** Любой редактор сохраняет альфа-канал при ресайзе PNG. Главное — не пересохранять в JPG по дороге.

**Поддерживает ли WebP прозрачность?** Да, и сжимает лучше PNG. Для веба прозрачный WebP — отличный выбор; для писем и документов оставайтесь на PNG — поддержка шире.

**Почему после удаления фона логотип стал рваным по краям?** Онлайн-сервис работал по маленькому исходнику. Правило: удаляйте фон с самой большой версии картинки, какую найдёте, а уменьшайте уже после.

## Удаление фона в Photoshop: подробный маршрут

Для тех, кто хочет максимум качества, — пошагово:

1. **Откройте файл и продублируйте слой** (Ctrl+J) — работайте на копии.
2. **Select → Subject** — нейросетевое выделение объекта. На логотипах с чётким контуром срабатывает на 90%.
3. **Уточните край:** Select → Select and Mask. Инструментом Refine Edge пройдитесь по проблемным местам; параметр Shift Edge на −10…−20% убирает остатки фоновой каймы.
4. **Выведите результат как Layer Mask** (не удаляйте пиксели насовсем — маску можно править).
5. **Проверка на контрасте:** создайте под слоем ярко-красную заливку — на ней видны все огрехи маски и белые «уши».
6. **Уберите ореол:** Layer → Matting → Remove White Matte (для тёмного исходного фона — Remove Black Matte).
7. **Экспорт:** File → Export → PNG. Не «Save for Web (Legacy)» с JPG — иначе всё насмарку.

Тот же маршрут в бесплатном GIMP: Select by Color для однотонного фона → Selection → Grow/Shrink на пиксель → удалить → Export As PNG.

## Особый случай: логотип на «почти белом» и градиентном фоне

Автоматика отлично справляется с чисто-белым фоном и спотыкается о два случая:

- **Фон «почти белый»** (оттенок бумаги со скана, лёгкий градиент фотостудии). Волшебная палочка с порогом (tolerance) 10–20 обычно берёт такой фон за 2–3 клика по областям. Если логотип содержит белые элементы — они под угрозой: работайте выделением объекта, а не выделением фона.
- **Логотип с белыми деталями на белом фоне.** Классический ад: белая буква на белой подложке неотличима для алгоритма. Честные пути: найти версию на тёмном фоне и удалить его; [перевести логотип в вектор](../kak-perevesti-logotip-v-vektor/) по отдельной инструкции; в крайнем случае — вручную обвести детали пером.

## Что делать с полученным PNG дальше: мини-чек-лист

1. **Проверьте на трёх фонах** — белом, чёрном, фирменном цветном: так вылезают и ореолы, и полупрозрачные остатки.
2. **Сохраните мастер-версию** в максимальном размере в папку с брендовыми файлами (как её организовать — в [гиде по форматам](../v-kakom-formate-nuzhen-logotip/)).
3. **Не пересохраняйте в JPG** — одна случайная конвертация, и прозрачность утрачена, а вокруг знака снова белый квадрат.
4. **Для веба сожмите:** TinyPNG и аналоги режут вес PNG в 2–3 раза без видимых потерь.

## Коротко

Белый квадрат — это JPG. Решение по возрастанию качества: онлайн-удалялка фона → [Photoshop](../../logos/design/photoshop/) → найти исходник с прозрачностью. Для известных брендов выбирайте третий путь — он быстрее и без артефактов.

Прозрачные SVG и PNG любого бренда — в нашем [каталоге логотипов](../../logos/): скачивайте в нужном размере или копируйте в буфер одним кликом.

---EN---

You place a logo on a colored banner — and it arrives in a white rectangle, like a stamp on an envelope. The white box around a logo is the eternal pain of decks, landing pages and social posts. Let's see where it comes from, how to remove it in a minute, and how to download logos without it in the first place.

:::note TL;DR
The white background is a property of **JPG: the format simply has no transparency**. PNG, SVG and WebP do. If you have a JPG, the background must be removed with a tool; if you have a choice — just download the logo as a transparent PNG or SVG. That beats any processing.
:::

## Why a logo has a background at all

An image has no concept of "emptiness" — every pixel must hold a value. Formats handle it differently:

- **JPG** stores color only. Transparency physically doesn't exist in the format, so "empty" areas get filled with white.
- **PNG** stores color plus an alpha channel — per-pixel transparency. A transparent PNG sits on any background.
- **SVG** is vector: there is no background unless someone deliberately drew a rectangle.

Hence rule one: **find the source file rather than fixing a JPG**. Background removal is always a compromise; a file saved with transparency from the start is always better.

## How to check whether the background is transparent

A white background on a white page is invisible — easy to be fooled. Quick checks:

1. Drop the file into [Figma](../../logos/design/figma/) and put a colored layer underneath.
2. Open the file in a browser in dark mode.
3. The extension: .jpg — background guaranteed; .png and .svg — transparency possible but not guaranteed (PNGs can be saved with a white background too).

## Removing a white background

### Online tools — 30 seconds

Background-removal services ([remove.bg](https://www.remove.bg/) and dozens of clones) handle logos on solid backgrounds almost perfectly: upload a JPG, download a transparent PNG. Limitations: free tiers often return reduced sizes, and fine details or semi-transparent elements (shadows, fade-outs) may suffer.

### Figma — built-in AI (on paid plans)

[Figma](../../logos/design/figma/) now ships a built-in **Remove background** AI tool: select the image, hit "Remove background" from the actions menu or the image's inline toolbar — no plugin needed. Right next to it is **Boost resolution**, an AI upscaler for blurry images, and both can be applied to several images at once. Catch: these AI tools require a paid plan (Professional/Organization/Enterprise) with a Full seat and AI enabled — not available on the free tier, where plugins (Remove BG and clones) still do the job. The same AI engine also powers **Vectorize**, launched in 2026: one click turns the image into an editable vector (full color, grayscale, or black-and-white outline), so for logos made of simple shapes you usually don't need to rebuild by hand — run Vectorize and clean up the result. It's paid-plan-only too; on the free tier it's back to inserting the image and tracing the mark with the pen tool yourself.

### Photoshop — maximum quality

Select Subject (the AI selection) → invert → delete background → export PNG. Manual mask cleanup for hard cases. This is the path when the logo must be large and flawless.

:::warning The "white fringe" trap
Automatic removal often leaves a thin white halo around the contours — leftovers of JPG's semi-transparent edge pixels. Invisible on light backgrounds, glaring on dark ones. [Photoshop](../../logos/design/photoshop/) fixes it via Layer → Matting → Remove White Matte; online tools usually don't. One more reason to find the source file.
:::

## The best fix: download it transparent

For known brands, manual background removal is double work — transparent sources already exist:

- **The SVG logo** — transparent by nature.
- **PNGs from official press kits** — almost always alpha-channel.
- **Logo catalogs** — serve ready-to-use files.

In our [catalog](../../logos/) both the SVG and PNG of every brand come with transparent backgrounds by default.

## What if you need a different background?

The related case: not removing but replacing — say, putting the white logo variant on a brand color. Order matters: transparent source first, then a colored layer underneath in your editor. Not the other way around — repainting background pixels around a logo leads to dirty edges. Need to recolor the logo itself too? Here's [the color guide](../kak-izmenit-cvet-logotipa/).

## FAQ

**Why does the logo still have a background in Word/PowerPoint?** Make sure you inserted a PNG, not a JPG. PowerPoint also has built-in removal: Picture Format → Remove Background.

**My transparent PNG got a black background after uploading?** The platform converted it to JPG. Check the upload requirements: where only JPG is accepted, transparency is impossible — prepare a version on a solid backdrop.

**Does resizing keep transparency?** Yes — any editor preserves the alpha channel when resizing a PNG. Just don't pass through JPG along the way.

**Does WebP support transparency?** Yes, and compresses better than PNG. For the web a transparent WebP is a great choice; for email and documents stay with PNG — wider support.

**Why are the edges ragged after background removal?** The online service worked on a small source. The rule: remove the background from the largest version you can find, downscale afterwards.

## Background removal in Photoshop: the detailed route

For maximum quality, step by step:

1. **Open the file, duplicate the layer** (Ctrl+J) — work on the copy.
2. **Select → Subject** — the AI selection. On sharp-edged logos it lands 90% of the way.
3. **Refine:** Select and Mask. Brush the problem areas; Shift Edge at −10…−20% eats the leftover background fringe.
4. **Output as a Layer Mask** (don't destroy pixels — masks stay editable).
5. **Contrast check:** put a bright red fill underneath — every mask flaw and white halo shows on it.
6. **Kill the halo:** Layer → Matting → Remove White Matte (Remove Black Matte for dark source backgrounds).
7. **Export:** File → Export → PNG. Not JPG — or the whole exercise was for nothing.

The same route in free GIMP: Select by Color for a solid background → Grow/Shrink the selection by a pixel → delete → Export As PNG.

## The special cases: "almost white" and gradient backgrounds

Automation nails pure white and stumbles on two cases:

- **An "almost white" background** (scanned paper tint, a soft studio gradient). The magic wand with tolerance 10–20 usually takes it in 2–3 clicks. If the logo itself contains white elements, they're at risk: select the subject, not the background.
- **White details on a white background.** The classic hell: a white letter on white is indistinguishable to any algorithm. The honest paths: find a dark-background version and remove that; [vectorize the logo](../kak-perevesti-logotip-v-vektor/) per its own guide; or trace the details manually with the pen tool.

## After you have the PNG: a mini-checklist

1. **Test on three backgrounds** — white, black, brand color: halos and translucent leftovers all surface.
2. **Store the master** at maximum size in your brand folder (organized per [the format guide](../v-kakom-formate-nuzhen-logotip/)).
3. **Never re-save as JPG** — one careless conversion and the transparency is gone, the white box is back.
4. **Compress for the web:** TinyPNG and friends cut PNG weight 2–3× with no visible loss.

## In short

The white box means JPG. Fixes, in ascending quality: online remover → [Photoshop](../../logos/design/photoshop/) → finding a transparent source. For known brands take the third path — faster and artifact-free.

Transparent SVGs and PNGs for any brand live in our [logo catalog](../../logos/): download at any size or copy to clipboard in one click.
