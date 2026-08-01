---
title: SVG, EPS, AI, PDF — чем отличаются векторные форматы
title_en: SVG, EPS, AI, PDF — Vector Formats Compared
description: Разбираем векторные форматы файлов: SVG для веба, EPS и PDF для печати, AI и CDR как исходники. Чем открыть, как конвертировать и какой просить у дизайнера.
description_en: Vector file formats explained: SVG for the web, EPS and PDF for print, AI and CDR as sources. How to open, convert, and which to request.
date: 2026-08-30
slug: vektornye-formaty-eps-ai-pdf-svg
tags: Форматы, Основы, Инструменты
tags_en: Formats, Basics, Tools
---

Дизайнер прислал логотип в пяти файлах:.svg,.eps,.ai,.pdf и зачем‑то.cdr. Что из этого куда, почему нельзя было обойтись одним и какой файл отправлять типографии, а какой — программисту? Разбираем все векторные форматы: кто есть кто, чем открываются и как конвертируются друг в друга.

:::note Коротко
Все пять — векторные, то есть хранят кривые, а не пиксели — подробнее о том, [в чём разница между вектором и растром](../vektor-i-rastr-raznica/). Роли такие: **SVG** — веб и интерфейсы, **PDF** — печать и универсальный обмен, **EPS** — печать по‑старому (типографии со стажем), **AI** — рабочий исходник Adobe Illustrator, **CDR** — рабочий исходник CorelDRAW. Правило: исходник храним в AI/SVG, в типографию отдаём PDF/EPS, на сайт — SVG.
:::

## SVG — стандарт веба

**SVG (Scalable Vector Graphics)** — открытый формат, который понимает любой браузер без плагинов. Внутри — обычный текст: XML‑разметка с описанием кривых, цветов и градиентов, поэтому SVG можно открыть даже блокнотом, сжать гзипом и анимировать через CSS. Это единственный векторный формат, который [вставляется на сайт напрямую](../kak-vstavit-svg-na-sajt/), и единственный, который реально [оптимизировать](../kak-optimizirovat-svg/) до единиц килобайт.

Ограничения: SVG не несёт CMYK и печатных профилей — для типографии его пересохраняют в PDF. Чем открыть и редактировать — [подробный разбор](../chem-otkryt-svg-fajl/); все логотипы в нашем [каталоге](../../logos/) отдаются именно в SVG.

## PDF — универсальный курьер

**PDF** все знают как «формат документов», но внутри он умеет хранить полноценный вектор с цветовыми профилями, шрифтами и настройками печати. Именно поэтому современные типографии просят PDF: один файл — и макет выглядит одинаково у дизайнера, менеджера и на станке; о том, [что ещё нужно типографии](../logotip-dlya-pechati/), мы рассказывали отдельно.

Бонус: PDF открывается на любом устройстве двойным кликом — удобно согласовывать макет с заказчиком, которому нечем открыть AI. Из [Illustrator](../../logos/design/illustrator/) и [Figma](../../logos/design/figma/) вектор экспортируется в PDF без потерь.

## EPS — ветеран, который не уходит

**EPS (Encapsulated PostScript)** — формат эпохи допечатной подготовки 90‑х. Технически устарел (не умеет прозрачность в современном смысле, вытеснен PDF), но по инерции остаётся «стандартом обмена»: стоки, типографии со стажем и корпоративные гайдлайны до сих пор просят «логотип в EPS». Конфликтов совместимости у него меньше всех: файл 1995 года откроется в любом современном редакторе.

Практический совет: если контрагент просит EPS — просто экспортируйте его из Illustrator или Inkscape из того же исходника. Спорить дороже.

## AI и CDR — рабочие исходники

**AI** — родной формат Adobe [Illustrator](../../logos/design/illustrator/), **CDR** — CorelDRAW. Это не форматы обмена, а рабочие файлы конкретных программ: слои, монтажные области, неразобранные эффекты, «живой» неконвертированный текст. Их главная ценность — редактируемость: правки логотипа делаются в исходнике, а SVG/PDF/EPS перегенерируются из него.

:::warning Про «живой» текст в исходниках
В рабочем AI/CDR текст обычно оставляют шрифтом (чтобы можно было исправить опечатку), а в файлах для передачи — переводят в кривые. Поэтому комплект от дизайнера должен содержать **обе** версии: исходник с живым текстом + обменные файлы с кривыми. Если получили только одно — просите второе, сверяясь с тем, [что ещё требовать при приёмке](../kak-zakazat-logotip-u-dizajnera/) у дизайнера.
:::

## Сводная таблица

| Формат | Роль | Чем открыть | Отдавать кому |
| --- | --- | --- | --- |
| **SVG** | веб, интерфейсы | браузер, Figma, Illustrator, Inkscape | разработчику, на сайт |
| **PDF** | печать, согласование | всё что угодно | типографии, заказчику |
| **EPS** | печать «по‑старому» | Illustrator, Inkscape, Corel | стокам, типографиям |
| **AI** | исходник | Illustrator (частично Figma/Inkscape) | себе в архив |
| **CDR** | исходник | CorelDRAW (частично Inkscape) | себе в архив |

## Как конвертировать между форматами

Внутри векторного мира конвертация почти без потерь:

1. **Универсальный путь:** открыть в Adobe Illustrator → Save As / Export в нужный формат. Бесплатная альтернатива — **Inkscape**: открывает SVG, EPS, PDF, AI (через импорт PDF‑совместимых AI) и частично CDR.
2. **Figma:** импортирует SVG и экспортирует SVG/PDF — для веб‑задач этого достаточно; подробнее о том, [как работать с логотипами в Figma](../kak-vstavit-logotip-v-figma/).
3. **Онлайн‑конвертеры** (CloudConvert и аналоги) выручают разово, но следите за текстом и градиентами — сложные эффекты могут разобраться неаккуратно.

Единственная конвертация, которая **не работает автоматически**, — из растра в вектор: PNG нельзя «пересохранить» в SVG, его нужно [перевести в вектор трассировкой](../kak-perevesti-logotip-v-vektor/). Файл.svg с вложенной PNG‑картинкой внутри — частый обман на фрилансе: проверяйте, что внутри кривые, а не встроенный растр.

## Какие файлы просить у дизайнера

Минимальный здоровый комплект логотипа:

- **Исходник**: AI или «мастер‑SVG» с живым текстом — для будущих правок.
- **SVG** с текстом в кривых — для сайта и интерфейсов.
- **PDF** (CMYK, кривые) — для печати.
- **PNG** в 2‑3 размерах с прозрачным фоном — для площадок, не принимающих вектор — [подходящие размеры](../razmery-logotipa-dlya-sajta-i-socsetej/) мы разбирали отдельно.
- EPS — опционально, если работаете со стоками или консервативными подрядчиками.

Полный контекст выбора форматов под задачи — в статье [в каком формате нужен логотип](../v-kakom-formate-nuzhen-logotip/), а сравнение вектора с растром для веба — в статье [SVG или PNG](../svg-ili-png-dlya-logotipa/).

---EN---

The designer sent the logo as five files:.svg,.eps,.ai,.pdf and, for some reason,.cdr. Which goes where, why one file wasn't enough, and which do you send to the print shop versus the developer? Here's the who's-who of vector formats: what they're for, what opens them and how they convert into each other.

:::note TL;DR
All five are vector — they store curves, not pixels — see [the difference from raster](../vektor-i-rastr-raznica/) for more. The roles: **SVG** — web and interfaces, **PDF** — print and universal exchange, **EPS** — legacy print (veteran shops), **AI** — the Adobe Illustrator working source, **CDR** — the CorelDRAW working source. The rule: keep the master as AI/SVG, hand PDF/EPS to printers, SVG to the website.
:::

## SVG — the web standard

**SVG (Scalable Vector Graphics)** is an open format every browser understands without plugins. Inside is plain text: XML describing curves, colors and gradients — so an SVG opens even in a text editor, gzips well and animates via CSS. It's the only vector format you can [embed in a site directly](../kak-vstavit-svg-na-sajt/), and the only one you can realistically [optimize](../kak-optimizirovat-svg/) down to single kilobytes.

Limitations: SVG carries no CMYK or print profiles — for print it gets re-saved as PDF. What opens and edits it: [the full guide](../chem-otkryt-svg-fajl/); every logo in our [catalog](../../logos/) is served exactly as SVG.

## PDF — the universal courier

Everyone knows **PDF** as "the document format", but inside it can hold full vector with color profiles, fonts and print settings. That's why modern print shops ask for PDF: one file, and the artwork looks identical for the designer, the manager and the press; we cover [what else printers need](../logotip-dlya-pechati/) separately.

Bonus: a PDF opens on any device with a double click — handy for approving artwork with a client who has nothing to open an AI with. [Illustrator](../../logos/design/illustrator/) and [Figma](../../logos/design/figma/) export vector to PDF losslessly.

## EPS — the veteran that won't leave

**EPS (Encapsulated PostScript)** comes from 90s prepress. Technically obsolete (no modern transparency, superseded by PDF), yet by inertia it remains an "exchange standard": stock sites, veteran print shops and corporate guidelines still request "the logo in EPS". It also has the fewest compatibility conflicts: a 1995 file opens in any modern editor.

Practical advice: if a counterparty asks for EPS — just export one from Illustrator or Inkscape from the same master. Arguing costs more.

## AI and CDR — working sources

**AI** is Adobe [Illustrator](../../logos/design/illustrator/)'s native format, **CDR** is CorelDRAW's. These aren't exchange formats but working files of specific apps: layers, artboards, unflattened effects, live unconverted text. Their value is editability: logo revisions happen in the source, and SVG/PDF/EPS are regenerated from it.

:::warning About live text in sources
In the working AI/CDR, text is usually kept as a font (so a typo can be fixed); in handoff files it's outlined. So a designer's package must contain **both**: the source with live text + exchange files with curves. Got only one? Ask for the other — see [what else to demand when accepting the work](../kak-zakazat-logotip-u-dizajnera/).
:::

## The comparison table

| Format | Role | Opens with | Hand to |
| --- | --- | --- | --- |
| **SVG** | web, interfaces | browser, Figma, Illustrator, Inkscape | developers, the website |
| **PDF** | print, approvals | anything | print shops, clients |
| **EPS** | legacy print | Illustrator, Inkscape, Corel | stock sites, printers |
| **AI** | source | Illustrator (partly Figma/Inkscape) | your archive |
| **CDR** | source | CorelDRAW (partly Inkscape) | your archive |

## Converting between formats

Inside the vector world, conversion is nearly lossless:

1. **The universal route:** open in Adobe Illustrator → Save As / Export. The free alternative is **Inkscape**: opens SVG, EPS, PDF, AI (via PDF-compatible AI import) and partially CDR.
2. **Figma:** imports SVG and exports SVG/PDF — enough for web tasks; see [working with logos in Figma](../kak-vstavit-logotip-v-figma/) for details.
3. **Online converters** (CloudConvert and kin) work for one-offs, but watch text and gradients — complex effects can unravel.

The one conversion that **doesn't work automatically** is raster to vector: a PNG can't be "saved as" SVG — it has to be [vectorized by tracing](../kak-perevesti-logotip-v-vektor/). An.svg with a PNG embedded inside is a common freelance con: check that the file contains curves, not wrapped raster.

## Which files to request from a designer

The minimum healthy logo kit:

- **The source**: AI or a master SVG with live text — for future edits.
- **SVG** with outlined text — for the site and interfaces.
- **PDF** (CMYK, outlined) — for print.
- **PNG** in 2-3 sizes with transparency — for platforms that reject vector — see [which sizes](../razmery-logotipa-dlya-sajta-i-socsetej/) each one wants.
- EPS — optional, if you deal with stock sites or conservative vendors.

The full context of matching formats to tasks is in [what format a logo should be in](../v-kakom-formate-nuzhen-logotip/), and the vector-vs-raster web comparison in [SVG vs PNG](../svg-ili-png-dlya-logotipa/).
