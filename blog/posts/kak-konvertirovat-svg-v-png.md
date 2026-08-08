---
title: Как конвертировать SVG в PNG и обратно — 5 способов без потери качества
title_en: How to Convert SVG to PNG and Back — 5 Lossless Methods
description: Пошагово: конвертация SVG в PNG в браузере, Figma, Photoshop и онлайн‑сервисах. Почему обратный путь PNG→SVG почти не работает и что делать вместо него.
description_en: Step by step — converting SVG to PNG in the browser, Figma, Photoshop and online tools. Why the reverse PNG→SVG path barely works and what to do instead.
date: 2026-06-15
slug: kak-konvertirovat-svg-v-png
tags: SVG, Конвертация, Инструкции
tags_en: SVG, Conversion, How-to
---

Скачали логотип в SVG, а маркетплейс, CRM или конструктор писем принимает только PNG. Задача выглядит симметричной: есть кнопка «конвертировать» туда, есть и обратно. На деле два направления устроены совершенно по‑разному. SVG в PNG превращается за две минуты в любом инструменте, и ошибиться там можно ровно в одном месте. А PNG в SVG автоматика перевести не может в принципе: кнопка, которая обещает обратное, вас обманывает. Разберём оба направления и причину этой асимметрии.

:::note Коротко
SVG → PNG — тривиально: браузер, [Figma](../../logos/design/figma/), любой онлайн‑конвертер. Важно единственное — сразу задать нужный размер в пикселях, потому что готовый PNG увеличивать уже поздно. PNG → SVG работает иначе: программа **отрисовывает файл заново**, угадывая контуры, и результат годится только для простых одноцветных знаков.
:::

## Почему SVG в PNG превращается легко

Причина в том, что хранит каждый формат. SVG держит инструкцию: «провести кривую отсюда сюда, залить цветом #21A038». Чтобы получить PNG, программа просто выполняет эту инструкцию и записывает результат в пиксели. Описание полное, гадать не о чем, поэтому справится любой рендер, от браузера до консольной утилиты.

Но у операции есть один необратимый момент. Выполняя инструкцию, программа обязана выбрать, в каком размере её выполнять, и записанные пиксели уже не пересчитаешь. Отсюда единственная реальная ошибка конвертации: взять размер по умолчанию, получить картинку 48×48 и потом растягивать её до баннера. Поэтому способы ниже отличаются главным образом тем, насколько удобно в них задавать размер.

## Пять способов получить PNG

### 1. Прямо в браузере — когда PNG нужен на один раз

Любой браузер открывает SVG и умеет его сохранить. Перетащите файл в окно [Chrome](../../logos/search/chrome/) или [Firefox](../../logos/search/firefox/), затем правый клик → «Сохранить изображение как…»: часть браузеров сразу предложит PNG.

Способ выигрывает скоростью, но размером тут управляет масштаб на экране. Для крупных PNG он не подходит: переходите к следующему.

### 2. Figma — самый предсказуемый контроль размера

Здесь размер задаётся явно, поэтому способ подходит и дизайнерам, и всем остальным:

1. Перетащите SVG в любой файл [Figma](../../logos/design/figma/) — он вставится редактируемым вектором.
2. Выделите объект → справа внизу секция Export.
3. Выберите PNG и множитель (1x, 2x, 4x) или конкретную ширину в пикселях.
4. Export — готово.

Бонусом перед экспортом можно перекрасить логотип или подложить фон, о чём ниже будет отдельный сценарий.

### 3. Онлайн‑конвертеры — быстро, с двумя оговорками

Convertio, CloudConvert, svgtopng и десятки аналогов работают по схеме «загрузили файл — скачали PNG». Оговорок ровно две, и обе следуют из сказанного выше.

Первая — размер. Многие сервисы рендерят SVG в его «номинальном» размере (например, 48×48), и вы получаете крошечную картинку; настройку размера ищите до конвертации. Вторая касается приватности: файл уезжает на чужой сервер, поэтому конфиденциальные макеты через случайные сервисы гонять не стоит.

### 4. Photoshop и Illustrator — если они уже открыты

[Photoshop](../../logos/design/photoshop/): File → Open, при открытии SVG задайте размер в пикселях с запасом, дальше File → Export → PNG. [Illustrator](../../logos/design/illustrator/): File → Export → Export As → PNG, разрешение выбирается там же. Логика та же самая: размер задают **до** растеризации, потому что после неё менять его поздно.

### 5. Командная строка — когда файлов много

Для пачки файлов быстрее один раз поставить инструмент, чем вручную прогонять каждый через интерфейс:

```
# librsvg (macOS: brew install librsvg)
rsvg-convert -w 1024 logo.svg -o logo.png

# Inkscape
inkscape logo.svg --export-type=png --export-width=1024
```

Обратите внимание на флаг ширины (`-w 1024`): он и определяет итоговое качество. Тот же самый выбор размера, только записанный явно.

:::tip Главное правило конвертации
Рендерьте PNG **в нужном размере или крупнее**. Из SVG вы бесплатно получите PNG любого размера, а увеличить готовый PNG без мыла уже не выйдет. Сомневаетесь — берите 1024 px и больше.
:::

## Почему обратный путь так не работает

Теперь понятно, за счёт чего работает прямое направление: у программы есть полное описание фигур. В обратную сторону этого описания просто нет. PNG хранит только сетку цветных точек — ни одного «круга», ни одной «кривой» внутри файла не записано.

Поэтому конвертер PNG → SVG ничего не переводит. Он **угадывает** контуры по границам цветов. Операция называется трассировкой, её результат зависит от того, насколько картинка похожа на набор простых фигур:

- **Простой одноцветный знак** (силуэт, иконка) — трассировка справится прилично. Inkscape (Path → Trace Bitmap) или vectorizer‑сервисы дадут рабочий результат.
- **Логотип с градиентами, мелкими деталями и текстом** — получите рваные края, потерянные детали и файл тяжелее исходного PNG.
- **Фотография** — результат бессмыслен при любых настройках.

Оценить результат трассировки можно, не разглядывая края. Откройте полученный SVG в [Figma](../../logos/design/figma/) и посмотрите на число опорных точек: у нарисованного вручную знака их десятки, у трассированного сотни и тысячи, потому что программа обводит отдельной точкой каждую ступеньку пиксельной границы. Отсюда и вес: SVG после трассировки логотипа с градиентом легко перевешивает исходный PNG в несколько раз. Второй признак виден по цвету: плоская заливка распадается на десятки близких оттенков, и перекрасить такой знак одной правкой `fill` уже не выйдет, ради чего вектор обычно и берут.

Из‑за того что честная трассировка трудна, часть сервисов её имитирует.

:::warning Частая ловушка
Некоторые онлайн‑«конвертеры PNG в SVG» заворачивают вашу растровую картинку внутрь SVG‑обёртки (`<image href="...">`). Расширение файла меняется на `.svg`, содержимое остаётся тем же PNG со всеми ограничениями растра. Проверить легко: откройте файл текстовым редактором. Настоящий вектор состоит из тегов `<path>`, `<circle>`, `<rect>`; один тег `<image>` внутри выдаёт подделку.
:::

Честных выходов для сложного логотипа два: отрисовать его в векторе вручную или найти оригинальный SVG. Второй быстрее и бесплатнее: у большинства известных брендов вектор существует, и в нашем каталоге лежат именно такие официальные файлы.

## Сравнение направлений

| Задача | Сложность | Инструмент | Качество результата |
| --- | --- | --- | --- |
| SVG → PNG | 2 минуты | [Figma](../../logos/design/figma/), браузер, онлайн | идентично оригиналу |
| PNG → SVG (простой знак) | 10 минут | Inkscape Trace | приемлемо |
| PNG → SVG (сложный логотип) | часы работы | ручная отрисовка | зависит от исполнителя |

## Типовые сценарии

Правило «сначала размер» на практике почти всегда означает «сначала кадр». Заметнее всего это в четырёх ситуациях.

**Аватарка для соцсети.** Прямая конвертация горизонтального логотипа даст узкую полоску, непригодную для круглой аватарки. Соберите в [Figma](../../logos/design/figma/) квадратный кадр 1024×1024, поместите знак с полями 15‑20% и цветным фоном и экспортируйте уже этот кадр.

**Логотип в презентацию [PowerPoint](../../logos/office/microsoftpowerpoint/).** Современный [PowerPoint](../../logos/office/microsoftpowerpoint/) принимает SVG напрямую (Вставка → Рисунки), и вектор здесь выигрывает: логотип останется чётким на любом проекторе. PNG понадобится только для версий Office старше 2016 года.

**Печать на футболке или кружке.** Типографии просят PNG высокого разрешения и считают размер от физического: принт 30 см при 300 dpi — это около 3550 пикселей. Рендерьте с запасом, 4000 px по длинной стороне.

**Пачка иконок для сайта.** Здесь конвертация вообще лишняя: SVG в вёрстке легче, чётче и перекрашивается из CSS. Способы вставки разбирали в статье [как вставить SVG на сайт](../kak-vstavit-svg-na-sajt/).

## Почему конвертер выдаёт пустой PNG

Отдельная частая жалоба: сервис отработал, а PNG вышел прозрачным или чёрным. Причина всегда одна — рендер не смог полностью выполнить инструкцию из файла. Конкретных поводов три, по убыванию вероятности:

1. **Цвета заданы через CSS‑классы**, а атрибуты `fill` при этом пусты — упрощённый рендер сервиса стили пропустил. Лечится пересохранением SVG из [Figma](../../logos/design/figma/): она запекает стили в атрибуты фигур.
2. **В файле используются внешние шрифты или картинки** — без доступа к ним конвертер рисует пустоту. Переводите текст в кривые до конвертации.
3. **Фильтры и маски** — экзотические эффекты поддерживаются не всеми рендерами. Откройте файл в браузере: если пусто и там, проблема в самом файле.

Универсальное решение при капризах онлайн‑сервисов — [Figma](../../logos/design/figma/): её рендер самый предсказуемый из общедоступных.

## Частые вопросы

**Какой размер PNG выбрать для соцсетей?** Аватарки — минимум 400×400, посты и обложки — по требованиям площадки, но не меньше 1080 по длинной стороне. Проще один раз сделать 2048 px и уменьшать.

**Прозрачность сохранится?** Да: PNG поддерживает альфа‑канал, и все перечисленные способы оставляют фон прозрачным по умолчанию. Белый фон появится только при экспорте в JPG.

**Можно ли конвертировать пачку файлов сразу?** Онлайн‑сервисы обычно ограничивают количество, поэтому для пачек берите командную строку (способ 5) или [Figma](../../logos/design/figma/): выделяете все объекты и экспортируете разом.

**Что выбрать для email‑рассылки?** Только PNG: почтовые клиенты вектор почти не поддерживают, [Gmail](../../logos/office/gmail/) и [Outlook](../../logos/office/outlook/) игнорируют SVG молча, оставляя пустое место. Рендерьте в двойном размере от того, сколько картинка занимает на экране.

**Почему у PNG обрезаны края?** У SVG есть viewBox — рамка, в которой живёт картинка. Фигуры, вышедшие за её пределы после ручных правок, рендер отрежет. Откройте файл в [Figma](../../logos/design/figma/) и проверьте, что всё содержимое лежит внутри кадра.

**Как получить PNG с фоном вместо прозрачности?** В [Figma](../../logos/design/figma/) подложите под логотип прямоугольник нужного цвета и экспортируйте вместе. В командной строке у `rsvg-convert` для этого есть флаг `-b '#FFFFFF'`.

**Почему из [Illustrator](../../logos/design/illustrator/) PNG выходит с огромными полями?** Экспортируется монтажная область (artboard) целиком. Подгоните её под логотип (Object → Artboards → Fit to Artwork Bounds) или используйте Export Selection.

## Что в итоге

Асимметрия двух направлений объясняется одним: в векторе записано описание фигур, в растре его нет. Поэтому SVG в PNG превращает любой инструмент, и следить нужно ровно за размером: задавайте его сразу и с запасом. Обратно дороги нет: трассировка вытянет простой одноцветный знак, всё остальное придётся отрисовывать заново вручную или искать оригинальный вектор.

Последний вариант почти всегда быстрее: в нашем [каталоге логотипов](../../logos/) у каждого бренда уже лежат и SVG, и PNG, причём PNG скачивается сразу в нужном размере, так что конвертировать не придётся вовсе.

---EN---

You downloaded a logo in SVG, and the marketplace, CRM or email builder accepts PNG only. The task looks symmetrical: there's a "convert" button one way, and one the other way too. In reality the two directions work completely differently. SVG becomes PNG in two minutes in any tool, and there's exactly one place to get it wrong. PNG, meanwhile, cannot be turned into SVG automatically at all — the button promising otherwise is lying to you. Let's walk both directions and the reason for this asymmetry.

:::note TL;DR
SVG → PNG is trivial: a browser, [Figma](../../logos/design/figma/), any online converter. One thing matters — setting the pixel size upfront, because enlarging a finished PNG is too late. PNG → SVG works differently: the program **redraws the file from scratch**, guessing at contours, and the result only suits simple single-color marks.
:::

## Why SVG turns into PNG easily

The reason lies in what each format stores. SVG holds an instruction: "draw a curve from here to here, fill with #21A038". To produce a PNG, the program simply executes that instruction and writes the result into pixels. The description is complete and nothing needs guessing, so any renderer handles it, from a browser to a command-line utility.

But the operation has one irreversible moment. While executing the instruction, the program must choose what size to execute it at, and the written pixels can't be recomputed later. Hence the one real conversion mistake: taking the default size, getting a 48×48 image and then stretching it to banner width. So the methods below differ mainly in how conveniently you can set the size.

## Five ways to get a PNG

### 1. Straight in the browser — for a one-off PNG

Any browser opens an SVG and can save it. Drag the file into a [Chrome](../../logos/search/chrome/) or [Firefox](../../logos/search/firefox/) window, then right-click → "Save image as…": some browsers offer PNG immediately.

The method wins on speed, but the size here is governed by on-screen scale. For large PNGs, move on to the next one.

### 2. Figma — the most predictable size control

Here the size is set explicitly, which suits designers and everyone else:

1. Drag the SVG into any [Figma](../../logos/design/figma/) file — it lands as an editable vector.
2. Select the object → the Export section at the bottom right.
3. Choose PNG and a multiplier (1x, 2x, 4x) or a specific pixel width.
4. Export — done.

As a bonus you can recolor the logo or place a background before exporting, which gets its own scenario below.

### 3. Online converters — fast, with two caveats

Convertio, CloudConvert, svgtopng and dozens of others run on "upload a file — download a PNG". There are exactly two caveats, and both follow from what's above.

The first is size. Many services render an SVG at its "nominal" size (48×48, say), and you get a tiny image; look for the size setting before converting. The second concerns privacy: the file travels to someone else's server, so confidential layouts are better kept out of random services.

### 4. Photoshop and Illustrator — if they're already open

[Photoshop](../../logos/design/photoshop/): File → Open, set a generous pixel size when opening the SVG, then File → Export → PNG. [Illustrator](../../logos/design/illustrator/): File → Export → Export As → PNG, resolution is chosen right there. The logic is identical: size is set **before** rasterization, because changing it afterwards is too late.

### 5. Command line — when there are many files

For a batch it's faster to install a tool once than to push each file through an interface by hand:

```
# librsvg (macOS: brew install librsvg)
rsvg-convert -w 1024 logo.svg -o logo.png

# Inkscape
inkscape logo.svg --export-type=png --export-width=1024
```

Note the width flag (`-w 1024`): it determines the final quality. The same size choice, just written explicitly.

:::tip The main rule of conversion
Render the PNG **at the size you need or larger**. From an SVG you get a PNG of any size for free, while enlarging a finished PNG without mush won't work. In doubt, take 1024 px or more.
:::

## Why the reverse path fails

Now it's clear what makes the forward direction work: the program has a full description of the shapes. Going back, that description simply doesn't exist. A PNG holds only a grid of colored dots — no "circle" and no "curve" is recorded inside the file.

So a PNG → SVG converter translates nothing. It **guesses** contours from color boundaries. The operation is called tracing, and its result depends on how closely the picture resembles a set of simple shapes:

- **A simple single-color mark** (a silhouette, an icon) — tracing does a decent job. Inkscape (Path → Trace Bitmap) or vectorizer services give a workable result.
- **A logo with gradients, fine detail and text** — you get ragged edges, lost details and a file heavier than the source PNG.
- **A photo** — the result is meaningless at any setting.

You can judge a trace without squinting at the edges. Open the resulting SVG in [Figma](../../logos/design/figma/) and count the anchor points: a hand-drawn mark has dozens, a traced one has hundreds or thousands, because the program outlines every step of the pixel boundary with its own point. Hence the weight: a traced gradient logo easily outweighs the source PNG several times over. The second sign shows in color: a flat fill breaks into dozens of near-identical shades, and recoloring such a mark with a single `fill` edit stops working, which is usually the reason to want a vector at all.

Because honest tracing is hard, some services fake it.

:::warning A common trap
Some online "PNG to SVG converters" wrap your raster image inside an SVG shell (`<image href="...">`). The file extension changes to `.svg` while the contents stay the same PNG with every raster limitation. Checking is easy: open the file in a text editor. A real vector consists of `<path>`, `<circle>`, `<rect>` tags; a single `<image>` tag inside gives away the fake.
:::

There are two honest ways out for a complex logo: draw it in vector by hand, or find the original SVG. The second is faster and free: most well-known brands have a vector, and our catalog holds exactly those official files.

## Comparing the directions

| Task | Difficulty | Tool | Result quality |
| --- | --- | --- | --- |
| SVG → PNG | 2 minutes | [Figma](../../logos/design/figma/), browser, online | identical to the original |
| PNG → SVG (simple mark) | 10 minutes | Inkscape Trace | acceptable |
| PNG → SVG (complex logo) | hours of work | manual redraw | depends on the artist |

## Typical scenarios

The "size first" rule almost always means "frame first" in practice. Four situations show it most clearly.

**A social media avatar.** Converting a horizontal logo directly gives a narrow strip, useless for a round avatar. Build a square 1024×1024 frame in [Figma](../../logos/design/figma/), place the mark with 15–20% padding and a colored background and export that frame.

**A logo for a [PowerPoint](../../logos/office/microsoftpowerpoint/) deck.** Modern [PowerPoint](../../logos/office/microsoftpowerpoint/) accepts SVG directly (Insert → Pictures), and vector wins here: the logo stays crisp on any projector. PNG is only needed for Office versions older than 2016.

**Printing on a T-shirt or mug.** Print shops ask for high-resolution PNG, and the size is derived from the physical one: a 30 cm print at 300 dpi is about 3550 pixels. Render generously — 4000 px on the long side.

**A batch of icons for a website.** Conversion is redundant here: SVG in markup is lighter, crisper and recolors from CSS. Embedding methods are covered in [how to embed SVG on a website](../kak-vstavit-svg-na-sajt/).

## Why a converter returns an empty PNG

A separate common complaint: the service finished, but the PNG came out transparent or black. The cause is always the same — the renderer couldn't fully execute the file's instruction. There are three specific reasons, by descending likelihood:

1. **Colors set via CSS classes** while the `fill` attributes sit empty — the service's simplified renderer skipped the styles. Fixed by re-saving the SVG from [Figma](../../logos/design/figma/): it bakes styles into shape attributes.
2. **The file uses external fonts or images** — without access to them the converter draws emptiness. Convert text to curves before converting.
3. **Filters and masks** — exotic effects aren't supported by every renderer. Open the file in a browser: if it's empty there too, the problem is in the file itself.

The universal answer to fussy online services is [Figma](../../logos/design/figma/): its renderer is the most predictable of the publicly available ones.

## Common questions

**What PNG size for social media?** Avatars — 400×400 minimum, posts and covers — per the platform's spec, but no less than 1080 on the long side. It's easier to make 2048 px once and scale down.

**Will transparency survive?** Yes: PNG supports an alpha channel, and every method listed leaves the background transparent by default. A white background appears only when exporting to JPG.

**Can I convert a batch at once?** Online services usually cap the count, so for batches use the command line (method 5) or [Figma](../../logos/design/figma/): select all objects and export them together.

**What should I use for an email campaign?** PNG only: mail clients barely support vector, and [Gmail](../../logos/office/gmail/) and [Outlook](../../logos/office/outlook/) drop an SVG silently, leaving a blank space. Render at twice the size the image occupies on screen.

**Why is my PNG cropped at the edges?** An SVG has a viewBox — the frame the picture lives in. Shapes that ended up outside it after manual edits get cut off by the renderer. Open the file in [Figma](../../logos/design/figma/) and check that all content sits inside the frame.

**How do I get a PNG with a background instead of transparency?** In [Figma](../../logos/design/figma/), place a rectangle of the needed color under the logo and export them together. On the command line, `rsvg-convert` has the `-b '#FFFFFF'` flag for this.

**Why does [Illustrator](../../logos/design/illustrator/) export a PNG with huge margins?** It exports the whole artboard. Either fit the artboard to the logo (Object → Artboards → Fit to Artwork Bounds) or use Export Selection.

## The bottom line

The asymmetry of the two directions comes down to one thing: a vector records a description of shapes, a raster doesn't. So any tool turns SVG into PNG, and the only thing to watch is size: set it upfront and generously. There's no road back: tracing will pull through a simple single-color mark, and everything else has to be redrawn by hand or found as an original vector.

That last option is almost always faster: in our [logo catalog](../../logos/) every brand already has both SVG and PNG, and the PNG downloads at the size you need — no conversion required at all.
