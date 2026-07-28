---
title: SVG или PNG для логотипа — что выбрать
title_en: SVG vs PNG for Logos — Which to Choose
description: SVG или PNG — что выбрать для логотипа на сайте, в презентации, соцсетях и печати. Технические различия, сравнительная таблица, типовые ошибки и конвертация между форматами.
description_en: SVG or PNG for a logo — websites, presentations, social media and print. Technical differences, a comparison table, common mistakes, and converting between formats.
date: 2026-06-02
slug: svg-ili-png-dlya-logotipa
tags: SVG, PNG, Форматы
tags_en: SVG, PNG, Formats
---

Вы скачали логотип, вставили в шапку сайта, порадовались — а через неделю заметили, что на телефоне с хорошим экраном он стал слегка размытым, будто снят через запотевшее стекло. Или наоборот: логотип чёткий, но страница грузится вечность, потому что «картинка» весит два мегабайта. И то и другое — не случайность и не брак файла. Это последствие одного выбора, который делают на автомате: SVG или PNG. Оба формата на экране выглядят одинаково, но устроены так по-разному, что перепутать их — значит заложить проблему, которая всплывёт позже.

:::note Коротко
**SVG** — вектор: логотип описан формулами (линии, кривые, заливки), поэтому масштабируется без потери качества и легко перекрашивается. **PNG** — растр: сетка пикселей фиксированного размера, зато формат понимает вообще любая программа, включая старую почту и офисные пакеты. Правильная модель проще: исходник и его отпечаток. Держите логотип в SVG и получайте из него PNG нужного размера.
:::

## Что лежит внутри файла

Чтобы выбирать осознанно, нужно понять одну вещь: SVG и PNG хранят принципиально разные вещи. Один хранит **инструкцию, как нарисовать**, другой — **уже готовый результат рисования**. Всё остальное — прямое следствие этого различия.

**SVG** (Scalable Vector Graphics) — текстовый XML-файл с математическим описанием фигур: координаты точек, кривые Безье, заливки и обводки. Когда браузер или редактор открывает SVG, он **вычисляет** пиксели заново — прямо сейчас, под конкретный размер экрана. Поэтому линия остаётся идеально чёткой хоть при 16 пикселях, хоть при 1600: инструкцию можно выполнить в любом масштабе.

**PNG** (Portable Network Graphics) устроен наоборот. Это растр: изображение — фиксированная сетка пикселей, у каждого записан свой цвет. Сетка задаётся один раз, в момент сохранения, и больше не меняется. Пока вы показываете PNG в исходном размере или меньше — всё чётко. Но стоит увеличить его сверх заложенного размера, и программе приходится **достраивать** несуществующие пиксели, угадывая цвет между соседями. Отсюда и то самое «мыло» на хорошем экране: логотип 200 пикселей растянули на 400, а взять недостающие данные неоткуда.

Именно из этой пары «инструкция против отпечатка» вырастают все практические отличия, ради которых и затевается выбор.

## Что из этого следует на практике

Раз SVG — инструкция, он ничего не теряет при масштабировании: каждый размер вычисляется с нуля. Раз PNG — готовая сетка, он может только терять при увеличении. Это первое и главное следствие, а за ним тянутся остальные.

Инструкция описывает форму компактно: «круг радиусом 45, залить зелёным» — это несколько десятков байт, тогда как честная сетка пикселей того же логотипа весит в разы больше. Поэтому простой логотип в **SVG** обычно легче своего же PNG. Инструкция ещё и редактируема: цвет — это отдельное значение `fill`, его можно поменять, не трогая форму (как это делается за пару кликов, показывали в разборе [как изменить цвет логотипа](../kak-izmenit-cvet-logotipa/)). В **PNG** цвет впечатан в каждый пиксель — чтобы перекрасить, нужно перерисовывать.

Но у отпечатка есть и своя сила, которую инструкция не повторит. PNG понимает буквально любая программа — от древнего почтового клиента до офисного пакета, потому что растр появился раньше и стал общим знаменателем. А ещё PNG честно хранит то, что вектору не описать формулой: фотографические градиенты, тени, сложные текстуры. Там, где SVG пришлось бы городить тяжёлую конструкцию, PNG просто записывает готовые пиксели.

Свести всё это в одну картину проще всего таблицей — здесь свойства просто существуют рядом, и сравнить их удобно построчно:

| Критерий | SVG | PNG |
| --- | --- | --- |
| Тип | Вектор (формулы) | Растр (пиксели) |
| Масштабирование | Без потери качества, любой размер | Только вниз без потерь; вверх — размытие |
| Вес файла | Обычно меньше для простых логотипов | Больше, особенно в высоком разрешении |
| Перекраска | Легко — меняете значения `fill` | Нужен редактор, перерисовка пикселей |
| Прозрачный фон | Да, нативно | Да, через альфа-канал |
| Поддержка в почте/мессенджерах | Не везде корректно | Везде |
| Редактирование в [Figma](../../logos/design/figma/)/[Illustrator](../../logos/design/illustrator/) | Полное — форма, узлы, цвет | Ограничено — картинка целиком, без отдельных объектов |
| Анимация | Возможна (SMIL, CSS) | Нет (нужен GIF/видео) |
| Печать в типографии | Подходит без ограничений | Не подходит выше исходного разрешения |

Из таблицы видно, что SVG выигрывает почти по всем строкам. Возникает логичный вопрос: зачем тогда вообще PNG, если вектор объективно лучше? Ответ — в единственной строке, где стоит «не везде»: поддержка.

## Где побеждает SVG

Везде, где логотип показывает браузер, вектор — очевидный выбор, и причина ровно та, с которой мы начали. На **сайте** SVG весит меньше и остаётся чётким на любом экране, включая Retina, — не нужно подключать отдельные `@2x`-версии и следить, какая подгрузится. В **редакторах** — [Figma](../../logos/design/figma/), Sketch, [Illustrator](../../logos/design/illustrator/) — вектор можно разобрать на части, перекрасить, подвигать узлы: при работе над макетом это и есть смысл существования формата. В **типографии** без вектора вообще нельзя — печать увеличивает изображение до размеров баннера, и только SVG переживёт это без потерь. И **анимация** логотипа — плавное появление, поворот, смена цвета — живёт прямо в SVG через CSS, без отдельного видеофайла.

Общий знаменатель простой: если изображение показывает программа, умеющая читать инструкцию, — отдавайте ей инструкцию. Проблемы начинаются там, где такой программы нет.

## Где нужен PNG

А нет её в самых консервативных углах цифрового мира. **Почта** — главный из них: часть клиентов, особенно корпоративные на базе [Outlook](../../logos/office/outlook/), не рендерит SVG вообще, и получатель увидит пустое место вместо логотипа. **Презентации** в PowerPoint и Google Slides работают с вектором через раз и теряют часть эффектов. **Соцсети** при загрузке аватарки или обложки всё равно потребуют растр — платформа сама пережмёт файл в свой формат. И наконец, **сложные логотипы** с фотореалистичными градиентами и текстурами: их SVG-версия распухнет так, что растр окажется и легче, и надёжнее.

Есть и технический случай, где PNG остаётся единственным вариантом: если логотип встраивается в **готовое изображение** — например, в OG-картинку для превью в соцсетях, — вокруг него уже растр, и вставлять туда вектор бессмысленно.

Заметьте: во всех этих случаях мы берём PNG не потому, что он лучше, а потому, что среда не умеет в вектор. Это и есть ключ ко всей путанице — и к типовым ошибкам.

## Три ошибки, которые растут из одного непонимания

Почти все проблемы с форматами сводятся к одному: отпечаток используют как исходник или наоборот. Отсюда три классических промаха.

:::warning PNG вместо SVG на сайте
Самая частая ошибка — вставить в шапку PNG-логотип на 512 пикселей и растягивать его CSS-ом. На обычном экране незаметно, а на Retina логотип «плывёт». Если для логотипа существует SVG — используйте в вебе всегда именно его, каким бы ни был размер макета.
:::

:::warning SVG там, где его не поддерживают
Обратный промах — вставить SVG в письмо рассылки или презентацию. Часть почтовых клиентов не покажет ничего, и вместо логотипа получатель увидит пустоту. Для писем, слайдов и офисных документов берите PNG — это ровно тот случай, где отпечаток надёжнее инструкции.
:::

:::warning Увеличение PNG сверх исходного размера
Если единственный файл — PNG 200×200, а нужен баннер 2000×2000, растягивание убьёт качество: пиксели размножатся без пересчёта. Выход один — найти логотип в SVG или перевести его в вектор; как это делается и где подводные камни, разбирали в статье [как перевести логотип в вектор](../kak-perevesti-logotip-v-vektor/).
:::

Все три ошибки исчезают, если держать в голове иерархию: SVG — исходник, PNG — производная от него. А раз так, то и конвертация должна идти в одну сторону.

## Как получить PNG из SVG (и почему не наоборот)

Правильное направление — от инструкции к отпечатку. Из SVG можно в любой момент отрисовать PNG любого размера и остаться в чётком качестве. В нашем каталоге на каждой странице логотипа обе кнопки — **SVG** и **PNG** — уже готовы, конвертировать вручную ничего не нужно. А если понадобился PNG нестандартного размера, откройте SVG в [Figma](../../logos/design/figma/) или прямо в браузере и экспортируйте в нужном разрешении — так вы получите чёткую картинку под задачу. Полный разбор пяти способов — в статье [«Как конвертировать SVG в PNG и обратно»](../kak-konvertirovat-svg-v-png/).

Обратный путь — из PNG сделать SVG — как раз тот самый компромисс, которого стоит избегать. Программа не знает исходных кривых и может только автоматически обвести контуры (трассировка) или предложить нарисовать логотип заново вручную. Первое портит сложные формы, второе стоит денег. Поэтому и звучит правило «храните исходник в векторе»: восстановить его из растра куда дороже, чем сгенерировать растр из вектора. Если у вас на руках только PNG, спасение описано в разборе [«Как перевести логотип в вектор»](../kak-perevesti-logotip-v-vektor/).

## SVG и PNG — не единственные форматы

Стоит держать в голове, что этими двумя мир логотипов не ограничивается. Рядом живут векторные AI, EPS и PDF — их используют профессиональные дизайнеры и типографии для печати, — и растровый JPG, который в отличие от PNG не умеет прозрачность и потому для логотипов почти не годится, зато незаменим для фотографий. Когда какой из них уместен и чем они отличаются от нашей пары — подробно разложено в обзоре [«В каком формате должен быть логотип»](../v-kakom-formate-nuzhen-logotip/).

## Что выбрать в итоге

Вернёмся к тому размытому логотипу из начала. Его беда — в том, что отпечаток попытались использовать как исходник: растянули готовую сетку пикселей туда, где нужна была инструкция. Держите эту иерархию в голове, и выбор перестанет быть гаданием: **SVG — исходник**, из которого рождается PNG любого размера; **PNG — производная** для тех сред, где вектор не открывается, — почты, презентаций, части соцсетей и логотипов со сложными эффектами. Сомневаетесь — берите SVG: из него всегда можно получить PNG, а вот обратно дорога куда дороже.

Все логотипы в [каталоге Trace Logo's](../../logos/) доступны сразу и в SVG, и в PNG — исходник и производная в одном месте, скачивайте бесплатно.

---EN---

You downloaded a logo, dropped it into your site header, admired it — and a week later noticed it looks slightly blurry on a good phone screen, as if shot through fogged glass. Or the opposite: the logo is crisp, but the page loads forever because the "image" weighs two megabytes. Neither is an accident or a broken file. Both are the consequence of a single choice made on autopilot: SVG or PNG. On screen the two look identical, but they're built so differently that mixing them up plants a problem that surfaces later.

:::note TL;DR
**SVG** is vector: the logo is described by formulas (lines, curves, fills), so it scales without quality loss and recolors easily. **PNG** is raster: a fixed grid of pixels, but every program understands it, including old email and office suites. The right mental model is simpler: a master and its print. Keep the logo in SVG and generate PNG of the needed size from it.
:::

## What's inside the file

To choose deliberately, grasp one thing: SVG and PNG store fundamentally different things. One stores **an instruction for how to draw**, the other stores **the already-finished drawing**. Everything else follows from that.

**SVG** (Scalable Vector Graphics) is a text XML file with a mathematical description of shapes: point coordinates, Bézier curves, fills, strokes. When a browser or editor opens an SVG, it **computes** the pixels anew, right then, for the exact screen size. So a line stays perfectly crisp at 16 pixels or 1600: the instruction runs at any scale.

**PNG** (Portable Network Graphics) works the opposite way. It's raster: the image is a fixed grid of pixels, each with its recorded color. The grid is set once, at save time, and never changes. As long as you show the PNG at its native size or smaller, everything's sharp. But enlarge it past the baked-in size and the software has to **invent** missing pixels, guessing the color between neighbors. Hence the "mush" on a good screen: a 200-pixel logo stretched to 400, with nowhere to get the missing data.

From this pair — instruction versus print — grow all the practical differences that make the choice matter.

## What this means in practice

Since SVG is an instruction, it loses nothing when scaled: every size is computed from scratch. Since PNG is a finished grid, it can only lose when enlarged. That's the first and main consequence, and the rest trail behind it.

An instruction describes shape compactly: "circle radius 45, fill green" is a few dozen bytes, while an honest pixel grid of the same logo weighs many times more. So a simple **SVG** logo is usually lighter than its own PNG. The instruction is also editable: color is a separate `fill` value you can change without touching the shape (how that's done in a couple of clicks — see [how to change a logo's color](../kak-izmenit-cvet-logotipa/)). In **PNG**, color is baked into every pixel — recoloring means repainting.

But the print has its own strength the instruction can't match. PNG is understood by literally any program — from an ancient mail client to an office suite — because raster came first and became the common denominator. And PNG honestly stores what a vector can't capture in a formula: photographic gradients, shadows, complex textures. Where SVG would build a heavy contraption, PNG just records finished pixels.

The cleanest way to see it all at once is a table — here the properties don't follow from one another, they simply coexist, so comparing them row by row is handy:

| Criterion | SVG | PNG |
| --- | --- | --- |
| Type | Vector (formulas) | Raster (pixels) |
| Scaling | Lossless, any size | Lossless down only; up — blur |
| File size | Usually smaller for simple logos | Larger, especially at high resolution |
| Recoloring | Easy — change `fill` values | Needs an editor, repaint pixels |
| Transparent background | Yes, natively | Yes, via alpha channel |
| Support in email/messengers | Not always correct | Everywhere |
| Editing in [Figma](../../logos/design/figma/)/[Illustrator](../../logos/design/illustrator/) | Full — shape, nodes, color | Limited — one flat picture, no separate objects |
| Animation | Possible (SMIL, CSS) | No (needs GIF/video) |
| Print shop | No limits | Fails above native resolution |

The table shows SVG winning almost every row. Which raises the logical question: why keep PNG at all if vector is objectively better? The answer sits in the one row that reads "not always": support.

## Where SVG wins

Everywhere a browser shows the logo, vector is the obvious pick, for exactly the reason we started with. On a **website** SVG weighs less and stays crisp on any screen, Retina included — no need to wire up separate `@2x` versions and track which one loads. In **editors** — [Figma](../../logos/design/figma/), Sketch, [Illustrator](../../logos/design/illustrator/) — vector can be split apart, recolored, its nodes nudged: for layout work that's the whole point of the format. In **print** you can't work without vector — printing enlarges the image to banner size, and only SVG survives it losslessly. And logo **animation** — a smooth fade, a rotation, a color shift — lives right inside the SVG via CSS, no separate video.

The common denominator is simple: if the image is shown by a program that reads the instruction — hand it the instruction. Trouble starts where no such program exists.

## Where PNG is needed

And it doesn't exist in the most conservative corners of the digital world. **Email** is the main one: some clients, especially corporate ones on [Outlook](../../logos/office/outlook/), don't render SVG at all, and the recipient sees blank space instead of a logo. **Presentations** in PowerPoint and Google Slides handle vector hit-or-miss and lose some effects. **Social networks**, when you upload an avatar or cover, still demand raster — the platform re-compresses the file into its own format. And finally, **complex logos** with photorealistic gradients and textures: their SVG version balloons until raster turns out both lighter and safer.

There's also a technical case where PNG remains the only option: if the logo is embedded into a **finished image** — say, an OG preview card for social networks — everything around it is already raster, and inserting a vector makes no sense.

Notice: in all these cases we take PNG because the environment can't do vector. That's the key to the whole confusion — and to the typical mistakes.

## Three mistakes that grow from one misunderstanding

Almost every format problem is an attempt to use the print as a master or vice versa. Hence three classic slips.

:::warning PNG instead of SVG on a website
The most common mistake — dropping a 512-pixel PNG logo into the header and stretching it with CSS. Invisible on a regular screen, "floaty" on Retina. If an SVG of the logo exists — always use it on the web, whatever the layout size.
:::

:::warning SVG where it isn't supported
The reverse slip — putting SVG into a newsletter or presentation. Some mail clients show nothing, and the recipient gets blank space instead of the logo. For emails, slides and office documents use PNG — precisely the case where the print beats the instruction.
:::

:::warning Enlarging PNG past its native size
If the only file is a PNG 200×200 and you need a 2000×2000 banner, stretching kills quality: pixels multiply, they don't recompute. The only way out is to find the logo in SVG or convert it to vector; how that's done and where the pitfalls are — see [how to convert a logo to vector](../kak-perevesti-logotip-v-vektor/).
:::

All three vanish if you keep the hierarchy in mind: SVG is the master, PNG is derived from it. And if so, conversion should run one way.

## How to get PNG from SVG (and why not the reverse)

The right direction is from instruction to print. From an SVG you can render a PNG of any size at any moment and stay crisp. In our catalog both buttons — **SVG** and **PNG** — are ready on every logo page; no manual conversion. And if you need a PNG of an unusual size, open the SVG in [Figma](../../logos/design/figma/) or right in the browser and export at the needed resolution — you'll get a sharp image made for the task. A full walk-through of five methods — in [«How to convert SVG to PNG and back»](../kak-konvertirovat-svg-v-png/).

The reverse path — making SVG from PNG — is exactly the compromise to avoid. The software doesn't know the original curves and can only auto-trace the outlines or offer to redraw the logo by hand. The first ruins complex shapes, the second costs money. That's why the rule "keep the master in vector" exists: recovering it from raster is far pricier than generating raster from vector. If all you have is a PNG, the rescue is in [«How to convert a logo to vector»](../kak-perevesti-logotip-v-vektor/).

## SVG and PNG aren't the only formats

Worth keeping in mind that these two don't exhaust the logo world. Nearby live the vector AI, EPS and PDF — used by professional designers and print shops — and the raster JPG, which unlike PNG can't do transparency and so barely suits logos, yet is irreplaceable for photos. When each is appropriate and how they differ from our pair — laid out in [«What format should a logo be in»](../v-kakom-formate-nuzhen-logotip/).

## What to choose in the end

Back to that blurry logo from the start. Its trouble wasn't PNG as such but that a print was used as a master — a finished pixel grid stretched where an instruction was needed. Keep this hierarchy in mind and the choice stops being a guess: **SVG is the master**, from which a PNG of any size is born; **PNG is the derivative** for environments where vector won't open — email, presentations, some social networks, and logos with complex effects. In doubt, take SVG: from it you can always get a PNG, while the road back is far costlier.

Every logo in the [Trace Logo's catalog](../../logos/) comes in both SVG and PNG at once — master and print in one place, free to download.
