---
title: Как конвертировать SVG в PNG и обратно — 5 способов без потери качества
title_en: How to Convert SVG to PNG and Back — 5 Lossless Methods
description: Пошагово: конвертация SVG в PNG в браузере, Figma, Photoshop и онлайн-сервисах. Почему обратный путь PNG→SVG почти не работает и что делать вместо него.
description_en: Step by step — converting SVG to PNG in the browser, Figma, Photoshop and online tools. Why the reverse PNG→SVG path barely works and what to do instead.
date: 2026-06-15
slug: kak-konvertirovat-svg-v-png
tags: SVG, Конвертация, Инструкции
tags_en: SVG, Conversion, How-to
---

Скачали логотип в SVG, а маркетплейс, CRM или конструктор писем принимает только PNG? Задача на две минуты — если знать, каким инструментом решать. А вот обратная задача, PNG в SVG, устроена совсем иначе, и большинство онлайн-конвертеров делают её плохо. Разберём оба направления.

:::note Коротко
SVG → PNG — тривиально: браузер, [Figma](../../logos/design/figma/), любой онлайн-конвертер. Главное — сразу задать нужный размер в пикселях, потому что после конвертации PNG уже нельзя увеличивать без потерь. PNG → SVG — это не конвертация, а **отрисовка заново**; автоматическая трассировка годится только для простых одноцветных знаков.
:::

## SVG в PNG: 5 рабочих способов

### 1. Прямо в браузере — без программ

Любой браузер умеет открывать SVG. Дальше два пути:

1. Откройте SVG-файл в [Chrome](../../logos/search/chrome/) или [Firefox](../../logos/search/firefox/) (перетащите в окно).
2. Правый клик → «Сохранить изображение как…» — некоторые браузеры сразу предложат PNG.

Если пункта нет, сработает скриншот нужной области — но качество будет равно размеру на экране, поэтому для крупных PNG способ не годится.

### 2. Figma — лучший контроль над размером

Самый предсказуемый способ для дизайнеров и не только:

1. Перетащите SVG в любой файл [Figma](../../logos/design/figma/) — он вставится как редактируемый вектор.
2. Выделите объект → справа внизу секция Export.
3. Выберите PNG и множитель (1x, 2x, 4x) или конкретную ширину.
4. Export — готово.

Бонус: перед экспортом можно перекрасить логотип или подложить фон.

### 3. Онлайн-конвертеры

Convertio, CloudConvert, svgtopng и десятки аналогов: загрузили файл, скачали PNG. Работает, но два момента. Во-первых, проверьте настройку размера — по умолчанию многие сервисы рендерят SVG в его «номинальном» размере, например 48×48 пикселей, и вы получите крошечную картинку. Во-вторых, не загружайте в случайные сервисы конфиденциальные макеты — файл уезжает на чужой сервер.

### 4. Photoshop и Illustrator

[Photoshop](../../logos/design/photoshop/): File → Open, при открытии SVG задайте размер в пикселях с запасом, потом File → Export → PNG. [Illustrator](../../logos/design/illustrator/): File → Export → Export As → PNG, там же выбирается разрешение. Смысл тот же: размер задаётся **до** растеризации.

### 5. Командная строка — для тех, кто автоматизирует

Если файлов много, быстрее один раз поставить инструмент:

```
# librsvg (macOS: brew install librsvg)
rsvg-convert -w 1024 logo.svg -o logo.png

# Inkscape
inkscape logo.svg --export-type=png --export-width=1024
```

Флаг ширины (`-w 1024`) — ключевой: он определяет итоговое качество.

:::tip Главное правило конвертации
Всегда рендерьте PNG **в том размере, который нужен, или больше**. SVG можно превратить в PNG любого размера бесплатно, а вот увеличить готовый PNG без мыла уже не получится. Сомневаетесь — делайте 1024 px и больше.
:::

## PNG в SVG: почему «конвертер» вас обманывает

Тут физика другая. В PNG нет никакой информации о фигурах — только пиксели. Конвертер не «переводит формат», а пытается **угадать** контуры по пикселям. Это называется трассировка, и у неё три исхода:

- **Простой одноцветный знак** (силуэт, иконка) — трассировка справится прилично. Inkscape (Path → Trace Bitmap) или vectorizer-сервисы дадут рабочий результат.
- **Логотип с градиентами, мелкими деталями, текстом** — на выходе будут рваные края, потерянные детали и вес больше исходного PNG.
- **Фотография** — не имеет смысла вовсе.

:::warning Частая ловушка
Некоторые онлайн-«конвертеры PNG в SVG» просто заворачивают вашу растровую картинку внутрь SVG-обёртки (`<image href="...">`). Формально файл стал .svg, фактически — остался тем же PNG со всеми его ограничениями. Проверить легко: откройте файл текстовым редактором; настоящий вектор состоит из `<path>`, `<circle>`, `<rect>`, а не из одного тега `<image>`.
:::

Честное решение для сложного логотипа — отрисовка в вектор вручную. Либо поищите оригинальный SVG: у большинства известных брендов он существует, и в нашем каталоге лежат именно такие официальные векторы.

## Сравнение направлений

| Задача | Сложность | Инструмент | Качество результата |
| --- | --- | --- | --- |
| SVG → PNG | 2 минуты | [Figma](../../logos/design/figma/), браузер, онлайн | идентично оригиналу |
| PNG → SVG (простой знак) | 10 минут | Inkscape Trace | приемлемо |
| PNG → SVG (сложный логотип) | часы работы | ручная отрисовка | зависит от исполнителя |

## Частые вопросы

**Какой размер PNG выбрать для соцсетей?** Аватарки — минимум 400×400, посты и обложки — по требованиям площадки, но не меньше 1080 по длинной стороне. Проще один раз сделать 2048 px и уменьшать.

**Прозрачность сохранится?** Да: PNG поддерживает альфа-канал, и все перечисленные способы фон по умолчанию оставляют прозрачным. Белый фон появляется только если экспортировать в JPG.

**Можно ли конвертировать пачку файлов сразу?** Онлайн-сервисы обычно ограничивают количество, поэтому для пачек — командная строка (способ 5) или [Figma](../../logos/design/figma/): выделяете все объекты и экспортируете разом.

**Почему PNG получился с обрезанными краями?** У SVG есть viewBox — «окно», в котором живёт картинка. Если фигуры выходят за его пределы (так бывает после ручных правок), рендер их отрежет. Откройте SVG в [Figma](../../logos/design/figma/) и проверьте, что всё содержимое лежит внутри рамки кадра.

**Как конвертировать SVG с прозрачностью в PNG с фоном?** Иногда нужен именно фон — например, для JPG-превью. В [Figma](../../logos/design/figma/) подложите под логотип прямоугольник нужного цвета и экспортируйте вместе. В командной строке у rsvg-convert есть флаг `-b '#FFFFFF'`.

**Почему из [Illustrator](../../logos/design/illustrator/) PNG выходит с огромными полями?** Экспортируется монтажная область (artboard), а не объект. Либо подгоните область под логотип (Object → Artboards → Fit to Artwork Bounds), либо используйте Export Selection.

## Разбор типовых сценариев

**Сценарий: аватарка для соцсети из SVG-логотипа.** Не конвертируйте логотип «как есть»: сначала в [Figma](../../logos/design/figma/) соберите квадратный кадр 1024×1024, поместите в него знак с полями 15–20% и цветным фоном — и уже этот кадр экспортируйте в PNG. Прямая конвертация горизонтального логотипа даст узкую полоску, непригодную для аватарки.

**Сценарий: логотип в презентацию PowerPoint.** Современный PowerPoint принимает SVG напрямую (Вставка → Рисунки) — и это лучше PNG: логотип останется чётким на любом проекторе. Конвертируйте в PNG только для старых версий Office.

**Сценарий: печать на футболке или кружке.** Типографии сублимационной печати часто просят PNG в высоком разрешении. Считайте от физического размера: принт 30 см при 300 dpi — это ~3550 пикселей. Рендерьте с запасом — 4000 px по длинной стороне.

**Сценарий: пачка иконок для сайта.** Не конвертируйте вовсе — используйте SVG напрямую в вёрстке: легче, чётче и перекрашивается из CSS. Все способы вставки мы разбирали в статье [как вставить SVG на сайт](../kak-vstavit-svg-na-sajt/).

## Почему онлайн-конвертер иногда выдаёт «пустой» PNG

Частая жалоба: сервис отработал, а PNG прозрачный или чёрный. Причины по убыванию вероятности:

1. **Цвета в SVG заданы через CSS-классы**, а не атрибуты `fill` — упрощённый рендер сервиса стили не применил. Лечится пересохранением SVG из [Figma](../../logos/design/figma/) (она «запекает» стили в атрибуты).
2. **В SVG используются внешние шрифты или картинки** — конвертер без доступа к ним рендерит пустоту. Текст переводите в кривые до конвертации.
3. **Фильтры и маски** — экзотические SVG-эффекты поддерживаются не всеми рендерами. Проверьте файл в браузере: если и там пусто, проблема в самом файле.

Универсальное решение при капризах онлайн-сервисов — [Figma](../../logos/design/figma/): её рендер самый предсказуемый из общедоступных.

## Коротко

Из SVG в PNG — задавайте размер и жмите Export где угодно. Из PNG в SVG — не верьте кнопке «конвертировать»: либо простой знак и трассировка, либо честная отрисовка заново, либо поиск оригинального вектора.

Самый быстрый путь — не конвертировать вообще: в нашем [каталоге логотипов](../../logos/) у каждого бренда уже лежат и SVG, и PNG, причём PNG можно скачать сразу в нужном размере.

---EN---

You downloaded a logo as SVG, but a marketplace, CRM or email builder only accepts PNG? That's a two-minute task — if you know which tool to use. The reverse task, PNG to SVG, works completely differently, and most online converters do it badly. Let's cover both directions.

:::note TL;DR
SVG → PNG is trivial: browser, [Figma](../../logos/design/figma/), any online converter. The key is to set the pixel size upfront, because a PNG can't be enlarged afterwards. PNG → SVG is not a conversion but a **redraw**; automatic tracing only works for simple one-color marks.
:::

## SVG to PNG: 5 working methods

### 1. Right in the browser

Open the SVG in [Chrome](../../logos/search/chrome/) or [Firefox](../../logos/search/firefox/) (drag it into a window), right-click → "Save image as…" — some browsers offer PNG directly. If not, a screenshot works, but only at on-screen size.

### 2. Figma — best size control

1. Drag the SVG into any [Figma](../../logos/design/figma/) file — it lands as an editable vector.
2. Select it → the Export section at the bottom right.
3. Pick PNG and a multiplier (1x, 2x, 4x) or an exact width.
4. Export — done.

Bonus: recolor the logo or add a background before exporting.

### 3. Online converters

Convertio, CloudConvert, svgtopng and dozens of clones: upload, download. Two caveats. First, check the size setting — many services render the SVG at its "nominal" size (say, 48×48) and hand you a tiny image. Second, don't upload confidential artwork to random services — the file travels to someone else's server.

### 4. Photoshop and Illustrator

[Photoshop](../../logos/design/photoshop/): File → Open, set a generous pixel size at import, then Export → PNG. [Illustrator](../../logos/design/illustrator/): File → Export As → PNG with a resolution picker. Same principle: the size is chosen **before** rasterization.

### 5. Command line — for automation

```
# librsvg (macOS: brew install librsvg)
rsvg-convert -w 1024 logo.svg -o logo.png

# Inkscape
inkscape logo.svg --export-type=png --export-width=1024
```

The width flag (`-w 1024`) determines the final quality.

:::tip The golden rule
Always render the PNG **at the size you need, or larger**. Making a bigger PNG from SVG is free; enlarging a finished PNG without blur is impossible. When in doubt, go 1024 px or more.
:::

## PNG to SVG: why the "converter" lies

A PNG contains no shape information — only pixels. A converter doesn't translate the format; it **guesses** outlines from pixels. That's called tracing, with three outcomes:

- **Simple one-color mark** — tracing does fine. Inkscape (Path → Trace Bitmap) gives a usable result.
- **Logo with gradients, fine detail, text** — ragged edges, lost detail, and a file heavier than the source PNG.
- **A photo** — pointless entirely.

:::warning A common trap
Some online "PNG to SVG converters" simply wrap your bitmap inside an SVG shell (`<image href="...">`). The extension changed; the pixels didn't. Check with a text editor: a real vector consists of `<path>`, `<circle>`, `<rect>` — not a single `<image>` tag.
:::

The honest fix for a complex logo is a manual redraw — or finding the original SVG. For most known brands it exists, and that's exactly what our catalog stores.

## FAQ

**What PNG size for social media?** Avatars — at least 400×400; posts and covers — per platform, but no less than 1080 px on the long side. Easier: render 2048 px once and downscale.

**Will transparency survive?** Yes — PNG has an alpha channel, and every method above keeps the background transparent by default. A white background only appears if you export to JPG.

**Batch conversion?** Online tools cap file counts; for batches use the command line (method 5) or [Figma](../../logos/design/figma/) — select everything and export at once.

**Why did the PNG come out with clipped edges?** SVG has a viewBox — the "window" the artwork lives in. Shapes outside it (common after manual edits) get cut by the renderer. Open the SVG in [Figma](../../logos/design/figma/) and check everything sits inside the frame.

**How do I convert a transparent SVG into a PNG with a background?** Sometimes you need one — say, for a JPG preview. In [Figma](../../logos/design/figma/), put a colored rectangle under the logo and export together. On the command line, rsvg-convert has a `-b '#FFFFFF'` flag.

**Why does [Illustrator](../../logos/design/illustrator/) export a PNG with huge margins?** It exports the artboard, not the object. Either fit the artboard to the artwork (Object → Artboards → Fit to Artwork Bounds) or use Export Selection.

## Typical scenarios walked through

**Scenario: a social avatar from an SVG logo.** Don't convert the logo as-is: first build a 1024×1024 square frame in [Figma](../../logos/design/figma/), place the mark with 15–20% margins on a colored background — and export that frame. Direct conversion of a horizontal logo yields a narrow stripe useless as an avatar.

**Scenario: a logo for a PowerPoint deck.** Modern PowerPoint accepts SVG directly (Insert → Pictures) — and it beats PNG: the logo stays crisp on any projector. Convert to PNG only for old Office versions.

**Scenario: printing on a T-shirt or a mug.** Sublimation printers often want high-res PNG. Calculate from physical size: a 30 cm print at 300 dpi is ~3550 pixels. Render with margin — 4000 px on the long side.

**Scenario: a batch of site icons.** Don't convert at all — use SVG directly in the markup: lighter, sharper, CSS-recolorable. All embedding methods are in [how to embed SVG](../kak-vstavit-svg-na-sajt/).

## Why an online converter sometimes returns an "empty" PNG

A common complaint: the service ran, but the PNG is transparent or black. Causes, most likely first:

1. **Colors defined via CSS classes** instead of `fill` attributes — the service's simplified renderer skipped the styles. Fix by re-saving the SVG from [Figma](../../logos/design/figma/) (it bakes styles into attributes).
2. **External fonts or images referenced** — without access, the converter renders nothing. Outline text before converting.
3. **Filters and masks** — exotic SVG effects aren't supported by every renderer. Check the file in a browser: if it's empty there too, the file itself is the problem.

The universal fallback when online tools misbehave is [Figma](../../logos/design/figma/): its renderer is the most predictable of the freely available ones.

## In short

SVG to PNG: set the size and hit Export anywhere. PNG to SVG: don't trust the "convert" button — trace a simple mark, redraw a complex one, or find the original vector.

The fastest route is not converting at all: every brand in our [logo catalog](../../logos/) already ships both SVG and PNG, and the PNG can be downloaded at the size you need.
