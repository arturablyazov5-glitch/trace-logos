---
title: Векторная и растровая графика — разница простыми словами
title_en: Vector vs Raster Graphics — The Difference in Plain Words
description: Чем вектор отличается от растра на пальцах: как устроены, когда какой использовать, почему логотип должен быть векторным, а фотография — растровой.
description_en: Vector vs raster explained simply — how each works, when to use which, why logos must be vector and photos raster.
date: 2026-07-17
slug: vektor-i-rastr-raznica
tags: Графика, SVG, Основы
tags_en: Graphics, SVG, Basics
---

«Пришлите логотип в векторе» — фраза, которая ставит в тупик каждого второго предпринимателя. Что такое вектор? Чем он отличается от обычной картинки? И почему дизайнер морщится от файла logo_final_2.jpg? Объясняем так, чтобы больше никогда не пришлось гуглить.

:::note Коротко
**Растр** — это мозаика из цветных точек-пикселей. **Вектор** — это инструкция «как нарисовать»: координаты, линии, заливки. Мозаику нельзя увеличить без потерь — точки становятся видны. Инструкцию можно выполнить в любом размере — хоть на визитке, хоть на фасаде здания. Поэтому фото — всегда растр, а логотипы и иконки — всегда вектор.
:::

## Растр: мозаика из пикселей

Растровое изображение — это сетка из точек, у каждой свой цвет. Фотография с камеры, скриншот, картинка из [Photoshop](../../logos/design/photoshop/) — всё это растр. Форматы: JPG, PNG, WebP, GIF, TIFF.

У растра есть жёсткая характеристика — **разрешение**, количество точек по ширине и высоте. В файле 1000×1000 ровно миллион пикселей, и больше их не станет. Уменьшать растр можно безболезненно, а вот при увеличении программе приходится выдумывать недостающие точки — картинка мылится, на краях появляются «лесенки».

Зато растр умеет то, что вектору не под силу: плавные переходы миллионов оттенков. Ни одна формула не опишет фотографию заката эффективнее, чем честная сетка пикселей.

## Вектор: инструкция для рисования

Векторный файл не хранит точки. Он хранит описание: «из точки A в точку B провести кривую с таким-то изгибом, замкнуть контур, залить цветом #21A038». Форматы: SVG, AI, EPS, частично PDF.

Когда вы открываете вектор, программа **выполняет инструкцию заново** — в том размере, который нужен сейчас. Поэтому одна и та же иконка одинаково чётко выглядит в 16 пикселей и в 16 метров: инструкция не деградирует от масштаба.

Из этого же следуют остальные суперспособности вектора:

- **Крошечный вес.** Описание «круг + две дуги» занимает сотни байт. Логотип в SVG обычно легче своего PNG-превью в разы.
- **Редактируемость.** Цвета, формы и текст можно менять в любой момент — это параметры инструкции, а не запечённые пиксели. Как это использовать на практике, показывали в статье [как изменить цвет логотипа](../kak-izmenit-cvet-logotipa/).
- **Идеальные края.** Браузер рендерит вектор под конкретный экран, включая ретину, — никакого мыла.

## Наглядное сравнение

| | Растр | Вектор |
| --- | --- | --- |
| Из чего состоит | пиксели | фигуры и кривые |
| Увеличение | теряет качество | без потерь |
| Фотореализм | ✅ да | ⛔ нет |
| Вес логотипа | десятки–сотни КБ | единицы КБ |
| Редактирование цвета | перерисовка | правка одной строки |
| Форматы | JPG, PNG, WebP | SVG, AI, EPS |

## Когда что использовать

:::success Вектор
Логотипы, иконки, схемы, диаграммы, шрифты, иллюстрации с чёткими формами, всё, что будет печататься в большом размере. Правило: если изображение состоит из фигур и линий — оно должно жить в векторе.
:::

:::success Растр
Фотографии, скриншоты, сложные текстуры, живопись, всё с плавными фотографическими переходами. Правило: если изображение снято камерой или нарисовано кистью — это растр, и вектор ему не нужен.
:::

Пограничный случай — сложные иллюстрации с градиентами и текстурами. Формально их можно собрать в векторе, но файл распухнет и станет тяжелее растра. Здесь выбирают по назначению: для печати в разных размерах — вектор, для показа на экране — растр.

## Как понять, что перед вами

1. **По расширению:** .svg, .ai, .eps — вектор; .jpg, .png, .webp, .gif — растр.
2. **Увеличением:** откройте файл и приблизьте на 800%. Края остались идеальными — вектор. Появились квадратики — растр.
3. **Хитрый случай:** внутри векторного файла может лежать вставленная растровая картинка. Такой файл формально .svg или .eps, но ведёт себя как растр. Откройте SVG текстовым редактором: настоящий вектор состоит из тегов `<path>`, `<circle>`, `<rect>`; если там один тег `<image>` — вас обманули.

## Как это выглядит в цифрах: анатомия двух файлов

Чтобы разница перестала быть абстракцией, посмотрим на один и тот же кружок с галочкой в двух форматах.

**Вектор (SVG):** файл — это буквально текст:

```
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#21A038"/>
  <path d="M30 52 L45 66 L72 38" stroke="#fff" stroke-width="8" fill="none"/>
</svg>
```

Три строки, ~200 байт. Открывается блокнотом, цвет меняется правкой шести символов, рендерится в любом размере.

**Растр (PNG 500×500):** 250 000 пикселей, каждому нужно до 4 байт (RGBA) — до мегабайта сырых данных, после сжатия ~10–30 КБ. Внутри — никакой структуры: нет «круга» и «галочки», есть только точки. Чтобы поменять цвет, нужно перекрасить каждую зелёную точку, аккуратно обходя сглаженные края.

Разница в весе — в 50–100 раз, разница в редактируемости — принципиальная. Именно поэтому дизайнеры так настойчиво просят «вектор, а не картинку»: для них это разница между «поправлю за минуту» и «перерисую за день».

## Промежуточные случаи, о которых стоит знать

- **PDF** — контейнер: внутри может быть и вектор, и растр, и их смесь. PDF из [Illustrator](../../logos/design/illustrator/) — вектор; PDF со сканом договора — растр в обёртке.
- **SVG с вложенным растром** — формально вектор, фактически картинка в конверте (тег `<image>` внутри). Такой файл не масштабируется без потерь, чем и опасен.
- **Шрифты** — это вектор: каждая буква описана кривыми. Поэтому текст в PDF и на сайте чёткий в любом масштабе — пока кто-нибудь не вставит его скриншотом.
- **Иконочные шрифты** (Font Awesome и др.) — векторные иконки, упакованные в шрифт. Технология постепенно уступает место чистым SVG-спрайтам.
- **Canvas и WebGL** в браузере — растровые технологии: нарисованное на canvas мылится при зуме, как обычная картинка.

## Почему «логотип в векторе» не прихоть дизайнера

Логотип живёт десятилетиями и появляется везде: аватарка 40 пикселей, шапка сайта, баннер, вывеска, борт машины. Единственный способ обеспечить одинаковое качество во всех размерах — хранить логотип как инструкцию, а не как мозаику. Растровые версии из вектора генерируются за секунды; восстановить вектор из растра — это ручная перерисовка за отдельные деньги.

## Мини-словарь, чтобы говорить с дизайнером на одном языке

- **Кривые (curves, paths)** — линии, из которых состоит вектор. «Перевести в кривые» = превратить текст в фигуры, чтобы не зависеть от шрифтов.
- **Узлы (nodes, anchors)** — точки, через которые проходят кривые. Меньше узлов при той же форме — чище файл.
- **Трассировка (trace)** — автоматическое преобразование растра в вектор. Работает на простых знаках, портит сложные (подробный разбор — в статье [про перевод логотипа в вектор](../kak-perevesti-logotip-v-vektor/)).
- **Растеризация** — обратный процесс: превращение вектора в пиксели. Происходит при каждом показе SVG на экране и при экспорте в PNG.
- **DPI/PPI** — плотность точек при печати/на экране. Характеристика растра; у вектора её нет — он растеризуется под нужную плотность в момент вывода.
- **Ретина (HiDPI)** — экраны с удвоенной и утроенной плотностью пикселей, из-за которых растровые картинки нужно готовить с запасом 2x.

Десять минут с этим словарём — и переписка с дизайнером или типографией перестаёт быть переводом с иностранного.

## Коротко

Растр — точки, вектор — инструкции. Фотографии — растр, логотипы — вектор, и конвертация между ними легко работает только в одну сторону: из вектора в растр. Держите исходники в векторе, а растр генерируйте по мере надобности.

В нашем [каталоге логотипов](../../logos/) всё устроено ровно по этому принципу: каждый бренд хранится в оригинальном SVG, а PNG нужного размера генерируется при скачивании.

---EN---

"Send us the logo in vector format" — a phrase that stumps every second business owner. What is a vector? How is it different from a regular image? And why does the designer wince at logo_final_2.jpg? Let's explain it so you never have to google it again.

:::note TL;DR
**Raster** is a mosaic of colored dots — pixels. **Vector** is a drawing instruction: coordinates, curves, fills. You can't enlarge a mosaic without the dots showing; an instruction can be executed at any size — business card or building facade. That's why photos are always raster, and logos and icons are always vector.
:::

## Raster: a mosaic of pixels

A raster image is a grid of dots, each with its own color. Camera photos, screenshots, [Photoshop](../../logos/design/photoshop/) images — all raster. Formats: JPG, PNG, WebP, GIF, TIFF.

Raster has one hard property — **resolution**, the dot count by width and height. A 1000×1000 file contains exactly a million pixels, and no more will ever appear. Shrinking is painless; enlarging forces the software to invent missing dots — the image blurs and edges get "staircases".

In return, raster does what vectors can't: smooth transitions across millions of shades. No formula describes a sunset photo more efficiently than an honest pixel grid.

## Vector: a drawing instruction

A vector file stores no dots. It stores a description: "from point A to point B draw a curve with this bend, close the contour, fill with #21A038". Formats: SVG, AI, EPS, partly PDF.

When you open a vector, the software **executes the instruction anew** at whatever size is needed. The same icon is equally crisp at 16 pixels or 16 meters: instructions don't degrade with scale.

The rest of the vector superpowers follow:

- **Tiny size.** "A circle plus two arcs" takes hundreds of bytes. An SVG logo is usually several times lighter than its own PNG preview.
- **Editability.** Colors, shapes and text are parameters of the instruction, not baked pixels — see [how to change a logo's color](../kak-izmenit-cvet-logotipa/) for the practical side.
- **Perfect edges.** The browser renders the vector for the specific screen, retina included — no mush.

## Side by side

| | Raster | Vector |
| --- | --- | --- |
| Made of | pixels | shapes and curves |
| Enlarging | loses quality | lossless |
| Photorealism | ✅ yes | ⛔ no |
| Logo file size | tens–hundreds of KB | a few KB |
| Recoloring | repaint | edit one line |
| Formats | JPG, PNG, WebP | SVG, AI, EPS |

## When to use which

:::success Vector
Logos, icons, diagrams, charts, fonts, flat illustrations, anything printed large. Rule: if the image consists of shapes and lines — it belongs in vector.
:::

:::success Raster
Photos, screenshots, complex textures, paintings — anything with smooth photographic transitions. Rule: if a camera shot it or a brush painted it — it's raster, and it doesn't need a vector.
:::

The border case is rich illustrations with gradients and textures. They can technically be built in vector, but the file balloons past the raster equivalent. Choose by purpose: print at many sizes — vector; screen display — raster.

## How to tell what you're looking at

1. **By extension:** .svg, .ai, .eps — vector; .jpg, .png, .webp, .gif — raster.
2. **By zooming:** open the file at 800%. Edges still perfect — vector. Little squares appeared — raster.
3. **The tricky case:** a vector file can contain an embedded raster image. It's technically .svg or .eps but behaves like raster. Open the SVG in a text editor: a real vector is made of `<path>`, `<circle>`, `<rect>` tags; one big `<image>` tag means you've been fooled.

## The numbers: anatomy of two files

To make the difference concrete, here's the same check-in-circle mark in both formats.

**Vector (SVG):** the file is literally text:

```
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#21A038"/>
  <path d="M30 52 L45 66 L72 38" stroke="#fff" stroke-width="8" fill="none"/>
</svg>
```

Three lines, ~200 bytes. Opens in a text editor, the color changes by editing six characters, renders at any size.

**Raster (PNG 500×500):** 250,000 pixels, up to 4 bytes each (RGBA) — up to a megabyte raw, ~10–30 KB compressed. No structure inside: there is no "circle" or "check", only dots. To change the color you'd repaint every green dot while tiptoeing around the anti-aliased edges.

A 50–100× weight difference, and a categorical editability difference. This is why designers insist on "the vector, not a picture": for them it's the gap between "fixed in a minute" and "redrawn in a day".

## The in-between cases worth knowing

- **PDF** is a container: it can hold vector, raster or both. A PDF from [Illustrator](../../logos/design/illustrator/) is vector; a scanned contract in PDF is raster in a wrapper.
- **SVG with embedded raster** — formally vector, actually a picture in an envelope (an `<image>` tag inside). It won't scale losslessly, which is what makes it treacherous.
- **Fonts** are vector: every letter is described by curves. That's why text in PDFs and on websites is crisp at any zoom — until someone pastes it as a screenshot.
- **Icon fonts** (Font Awesome etc.) — vector icons packed into a font, gradually giving way to plain SVG sprites.
- **Canvas and WebGL** in the browser are raster technologies: canvas drawings blur on zoom like any image.

## Why "logo in vector" is not designer whim

A logo lives for decades and appears everywhere: a 40-pixel avatar, a site header, a banner, a storefront sign, a vehicle wrap. The only way to guarantee quality at every size is to store the logo as an instruction, not a mosaic. Raster versions generate from a vector in seconds; recovering a vector from a raster is a paid manual redraw.

## A mini-glossary for speaking the designer's language

- **Curves (paths)** — the lines vectors are made of. "Convert to curves/outlines" = turn text into shapes so fonts stop mattering.
- **Nodes (anchors)** — the points curves pass through. Fewer nodes for the same shape — a cleaner file.
- **Tracing** — automatic raster-to-vector conversion. Works on simple marks, ruins complex ones — see [the vectorization article](../kak-perevesti-logotip-v-vektor/) for details.
- **Rasterization** — the reverse: turning vector into pixels. Happens every time an SVG hits a screen and on every PNG export.
- **DPI/PPI** — dot density in print/on screen. A raster property; vectors don't have one — they rasterize to the needed density at output time.
- **Retina (HiDPI)** — screens with 2–3× pixel density, the reason raster images need a 2x size margin.

Ten minutes with this glossary and conversations with designers and print shops stop feeling like a foreign language.

## In short

Raster is dots, vector is instructions. Photos are raster, logos are vector, and conversion only flows easily one way: vector to raster. Keep masters in vector, generate raster as needed.

Our [logo catalog](../../logos/) is built on exactly this principle: every brand is stored as an original SVG, and a PNG of any size is generated at download time.
