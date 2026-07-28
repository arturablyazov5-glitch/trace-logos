---
title: Чем открыть SVG-файл — просмотр и редактирование на любой системе
title_en: How to Open an SVG File — Viewing and Editing on Any System
description: SVG не открывается или показывается как текст? Разбираем, чем посмотреть и чем отредактировать SVG на Windows, macOS и телефоне — от браузера до Figma и Inkscape.
description_en: SVG won't open or shows as text? Every way to view and edit SVG on Windows, macOS and mobile — from the browser to Figma and Inkscape.
date: 2026-06-06
slug: chem-otkryt-svg-fajl
tags: SVG, Инструменты, Инструкции
tags_en: SVG, Tools, How-to
---

Скачали логотип, кликнули по файлу — а вместо картинки открылся блокнот со стеной непонятного кода. Или система вообще растерянно спрашивает: «чем открыть этот файл?». Первая мысль — файл битый. Но с ним всё в порядке, и вся путаница вырастает из одной особенности формата, которую стоит понять раз и навсегда: **SVG — это одновременно и картинка, и текст**. Как только это уложится в голове, вопрос «чем открыть» распадается на два простых, и на каждый есть очевидный ответ.

:::note Коротко
**Просто посмотреть** — перетащите SVG в любой браузер: [Chrome](../../logos/search/chrome/), [Safari](../../logos/search/safari/), [Яндекс Браузер](../../logos/search/yandexbrowser/). **Отредактировать** — [Figma](../../logos/design/figma/) (бесплатно, в браузере), Inkscape (бесплатно, оффлайн) или [Illustrator](../../logos/design/illustrator/). **Открылся как текст** — это не поломка: SVG и есть текст, просто система привязала расширение к блокноту.
:::

## Почему SVG открывается «как код»

Начнём с той самой стены кода, потому что она пугает сильнее всего. SVG — это XML-документ: внутри теги `<svg>`, `<path>`, `<circle>` с координатами фигур. Браузер читает эти теги и рисует по ним картинку; блокнот честно показывает их как текст — потому что для него это и есть текст. Ни один из них не ошибается, просто система по двойному клику отправила файл не в ту программу.

Отсюда сразу и лечение, без всякой «конвертации»: правый клик по файлу → «Открыть с помощью» → выберите браузер → поставьте галочку «Всегда открывать в этой программе». Файл при этом не меняется ни на байт — меняется только программа, которой система его показывает. А теперь, когда понятно, что ничего не сломано, разделим две задачи.

## Задача первая: просто посмотреть

Если нужно всего лишь увидеть логотип, самый универсальный просмотрщик уже стоит на вашем устройстве — браузер.

Перетащите файл в окно [Chrome](../../logos/search/chrome/), [Safari](../../logos/search/safari/), [Firefox](../../logos/search/firefox/) или [Яндекс Браузера](../../logos/search/yandexbrowser/) — картинка появится мгновенно, а колесо мыши приблизит её без потери чёткости (в этом и весь смысл вектора). Работает одинаково на любой системе, поэтому дальше — только нюансы по платформам, где есть варианты быстрее перетаскивания.

- **[Windows](../../logos/store/windows/) 10/11.** Проводник показывает миниатюры SVG не всегда — зависит от установленных расширений. Если миниатюр нет, надёжнее всего браузер; либо поставьте из Microsoft Store бесплатное расширение с поддержкой SVG-превью, и папка с иконками станет видимой без открывания каждого файла.
- **macOS.** Здесь проще всего: нажмите пробел на файле в [Finder](../../logos/system/finder/) — Quick Look покажет SVG из коробки. [Preview](../../logos/design/preview/) тоже откроет, но для просмотра, не для правок: при сохранении он превращает вектор в растр.
- **Телефон.** И iOS, и Android откроют SVG во встроенном браузере — пришлите файл себе в мессенджер и нажмите на него. Отдельное приложение не нужно.

Впрочем, ради одного файла необязательно даже выходить из статьи — перетащите его в окно ниже. Всё считается прямо в браузере. Файл никуда не отправляется и сразу видно его размеры, исходный код и то, что с ним не так.

:::widget svg-viewer
:::

Переключатель «Картинка / Код» здесь — самая наглядная часть. Один и тот же файл по одному нажатию превращается из логотипа в разметку и обратно. Это и есть та двойная природа, из-за которой SVG открывается то картинкой, то «стеной кода». А блок с замечаниями под превью отвечает на главный вопрос всей этой статьи: если файл не открылся или выглядит не так, там будет написано, почему именно.

Просмотр закрывает добрую половину случаев. Но если логотип нужно перекрасить, обрезать или подправить форму, браузера уже мало — тут вступает вторая половина двойной природы SVG.

## Задача вторая: отредактировать

Раз SVG это ещё и текст с описанием фигур, его можно менять. Инструмент зависит от того, насколько глубоко вы лезете.

### Figma — бесплатно и без установки

Для 90% задач с логотипами хватает [Figma](../../logos/design/figma/): она работает в браузере и бесплатна для личного использования. Перетащите SVG на холст — он вставится полноценным редактируемым вектором: перекрашивайте, меняйте формы, удаляйте элементы, экспортируйте обратно в SVG или PNG. Разумная точка входа для тех, кому нужно просто поправить чужой логотип без навыков дизайнера.

### Inkscape — бесплатный оффлайн-редактор

Когда нужен настольный редактор без интернета, есть Inkscape ([Windows](../../logos/store/windows/), macOS, Linux) — векторный редактор с открытым кодом. SVG для него родной формат, и поддержка самая полная из всех: трассировка растра, тонкая работа с узлами кривых, замена цвета по всему файлу. Интерфейс менее гламурный, чем у [Figma](../../logos/design/figma/), но по возможностям он не уступает платным пакетам.

### Adobe Illustrator — профессиональный стандарт

Если [Illustrator](../../logos/design/illustrator/) у вас уже есть, отдельно ставить ничего не надо — он открывает и сохраняет SVG. Один нюасик стоит запомнить: при обычном «Save As» [Illustrator](../../logos/design/illustrator/) добавляет в файл служебные данные и раздувает его. Для веба сохраняйте через «Export As» с галочкой «Minify» — получите чистый лёгкий SVG.

### Текстовый редактор — да, серьёзно

А поскольку SVG буквально текст, мелкие правки быстрее всего сделать прямо в коде, вообще без графического редактора. Поменять цвет — найти `fill="#FF0000"` и заменить значение. Изменить размер — поправить `width` и `height` (или удалить оба: тогда размером управляет вёрстка сайта через CSS, а пропорции держит `viewBox`). VS Code с плагином предпросмотра делает это комфортным: слева код, справа живая картинка, которая обновляется на глазах.

Чтобы не держать всё это в голове, вот вся развилка одной таблицей — по задаче:

| Задача | Инструмент | Цена |
| --- | --- | --- |
| Посмотреть | любой браузер | бесплатно |
| Перекрасить, подправить | [Figma](../../logos/design/figma/) | бесплатно |
| Серьёзное редактирование оффлайн | Inkscape | бесплатно |
| Профессиональная работа | [Illustrator](../../logos/design/illustrator/) | подписка |
| Правка в одну строку | текстовый редактор | бесплатно |

Обратите внимание, чего в таблице нет, — и это не случайный пропуск.

:::warning Чем НЕ надо открывать SVG
- **Paint и стандартные «Фотографии»** — либо не откроют, либо растеризуют при сохранении, и вектор погибнет.
- **[Photoshop](../../logos/design/photoshop/)** — откроет, но сразу превратит в растр: это растровый редактор, вектор в нём не выживает.
- **Word и PowerPoint** — вставить SVG в документ можно, но редактировать вектор внутри — нет.
Логика одна: всё, что при сохранении превращает фигуры в пиксели, убивает главное свойство формата.
:::

## Частые вопросы

Двойная природа SVG порождает пару регулярных вопросов — разберём их, чтобы не гадать.

**Почему вместо картинки чёрный квадрат?** Скорее всего, у фигур не задан цвет заливки и рендер подставил чёрный по умолчанию, либо файл использует CSS-переменные, которые понимает только сайт-источник. Откройте его в [Figma](../../logos/design/figma/) — она покажет структуру слоёв и настоящие цвета.

**SVG безопасен?** Из надёжного источника — да. Но технически SVG может содержать скрипты, поэтому чужой SVG из случайного места не стоит вставлять инлайном в свой сайт — подробнее в статье про [вставку SVG на сайт](../kak-vstavit-svg-na-sajt/).

**Как открыть SVG в Word или PowerPoint?** Современный Office вставляет SVG напрямую: Вставка → Рисунки → выбрать файл, дальше доступны базовые операции (размер, поворот, смена цвета). Версии до 2016 года SVG не понимают — для них конвертируйте в PNG.

**SVG из интернета не открывается вообще.** Проверьте, что скачался сам файл: вместо него часто сохраняется HTML-страница (правый клик «Сохранить ссылку как» иногда сохраняет страницу). Откройте блокнотом: если внутри `<!DOCTYPE html>` — это страница, ищите прямую ссылку на `.svg`.

## Откуда берутся «сломанные» SVG

Отдельно стоит знать, почему внешне правильный файл вдруг ведёт себя не так, — это экономит часы на диагностике. Все причины сводятся к тому, что где-то нарушена та самая связка «текст описывает картинку»:

- **Цвета вынесены в CSS-классы.** Часть редакторов пишет цвета в блок `<style>` с классами. Файл корректен, но некоторые программы (и старый Office) стили игнорируют — картинка чернеет. Лечение: пересохранить через [Figma](../../logos/design/figma/), которая переносит стили в атрибуты фигур.
- **Живой текст вместо кривых.** Если в SVG остался тег `<text>`, а нужного шрифта на машине нет, надпись съедет или отрисуется чужим шрифтом. Правильно подготовленный логотип хранит текст переведённым в кривые.
- **Внешние ссылки.** SVG умеет ссылаться на картинки и шрифты по URL — при переносе файла или без интернета эти куски просто пропадают.
- **Обрезанный `viewBox`.** После ручных правок фигуры могут оказаться за пределами видимой области — файл кажется пустым, хотя данные внутри есть. [Figma](../../logos/design/figma/) показывает всё содержимое, включая то, что за кадром.

## Итог

Вся кажущаяся капризность SVG — оборотная сторона его удобства: он одновременно картинка и текст, поэтому смотреть его нужно тем, что рисует по тегам (браузером), а править — тем, что понимает вектор ([Figma](../../logos/design/figma/), Inkscape, [Illustrator](../../logos/design/illustrator/)). А «открылся как текст» — просто природа формата. В отличие от большинства графики, для работы с SVG не нужно покупать ни одной программы.

И самый частый повод открыть SVG — просто поменять цвет логотипа — закрывается вообще без редакторов: в нашем [каталоге логотипов](../../logos/) редактор цвета встроен прямо в страницу каждого бренда.

---EN---

You downloaded a logo, clicked the file — and instead of a picture, a text editor opened with a wall of baffling code. Or the system just asks, bewildered: "what should I open this with?" The first thought is that the file is broken. But it's fine, and the whole confusion grows from one property of the format worth understanding once and for all: **an SVG is both a picture and text at the same time**. Once that settles in, the "what do I open it with" question splits into two simple ones, each with an obvious answer.

:::note TL;DR
**Just view it** — drag the SVG into any browser: [Chrome](../../logos/search/chrome/), [Safari](../../logos/search/safari/), [Yandex Browser](../../logos/search/yandexbrowser/). **Edit it** — [Figma](../../logos/design/figma/) (free, in-browser), Inkscape (free, offline) or [Illustrator](../../logos/design/illustrator/). **Opened as text** — not a breakage: an SVG is text; the system just tied the extension to a text editor.
:::

## Why SVG opens "as code"

Let's start with that wall of code, since it scares people most. An SVG is an XML document: inside are `<svg>`, `<path>`, `<circle>` tags with shape coordinates. A browser reads these tags and draws a picture; a text editor honestly shows them as text — because to it, that's what they are. Neither is wrong; the system just sent the file to the wrong program on double-click.

Hence the fix, with no "conversion" whatsoever: right-click the file → "Open with" → pick a browser → check "Always open with this app." The file doesn't change by a single byte — only the program the system shows it in does. And now that it's clear nothing is broken, let's split the two tasks.

## Task one: just view it

If you only need to see the logo, the most universal viewer is already on your device — the browser.

Drag the file into a [Chrome](../../logos/search/chrome/), [Safari](../../logos/search/safari/), [Firefox](../../logos/search/firefox/) or [Yandex Browser](../../logos/search/yandexbrowser/) window — the picture appears instantly, and the mouse wheel zooms it in with no loss of sharpness (the whole point of vector). It works the same on any system, so what follows are just per-platform shortcuts faster than dragging.

- **[Windows](../../logos/store/windows/) 10/11.** Explorer doesn't always show SVG thumbnails — it depends on installed extensions. If there are none, the browser is safest; or install a free thumbnail extension from the Microsoft Store, and an icon folder becomes visible without opening each file.
- **macOS.** Easiest here: press space on the file in [Finder](../../logos/system/finder/) — Quick Look shows the SVG out of the box. [Preview](../../logos/design/preview/) opens it too, but for viewing only: on save it turns vector into raster.
- **Phone.** Both iOS and Android open SVG in the built-in browser — send the file to yourself in a messenger and tap it. No separate app needed.

For a single file you don't even have to leave this page — drop it into the box below. Everything runs in your browser: the file is never uploaded, and you immediately see its dimensions, its source code and whatever is wrong with it.

:::widget svg-viewer
:::

The "Image / Code" switch is the most telling part: one press turns the same file from a logo into markup and back. That is the dual nature that makes an SVG open as a picture one moment and as a wall of code the next. And the notes under the preview answer the question this whole article is about: if the file didn't open, or looks off, they say exactly why.

Viewing covers a good half of cases. But if the logo needs recoloring, cropping or a shape fix, the browser isn't enough — and here the second half of SVG's dual nature comes in.

## Task two: edit it

Since an SVG is also text describing shapes, it can be changed. The tool depends on how deep you go.

### Figma — free and no install

For 90% of logo tasks [Figma](../../logos/design/figma/) is plenty: it runs in the browser and is free for personal use. Drag the SVG onto the canvas — it lands as a fully editable vector: recolor, reshape, delete elements, export back to SVG or PNG. A sensible entry point for anyone who just needs to fix someone else's logo without design skills.

### Inkscape — a free offline editor

When you need a desktop editor without internet, there's Inkscape ([Windows](../../logos/store/windows/), macOS, Linux) — an open-source vector editor. SVG is its native format, with the fullest support of all: raster tracing, fine node work, color replacement across the whole file. The interface is less glamorous than [Figma](../../logos/design/figma/)'s, but in capability it rivals paid packages.

### Adobe Illustrator — the professional standard

If you already have [Illustrator](../../logos/design/illustrator/), install nothing extra — it opens and saves SVG. One nuance to remember: with a plain "Save As," [Illustrator](../../logos/design/illustrator/) adds service data and bloats the file. For the web, save via "Export As" with "Minify" checked — you'll get a clean, light SVG.

### A text editor — yes, really

And since an SVG is literally text, small edits are fastest right in the code, with no graphics editor at all. Change a color — find `fill="#FF0000"` and replace the value. Change the size — tweak `width` and `height` (or delete both: then the site's layout controls size via CSS, while `viewBox` holds the proportions). VS Code with a preview plugin makes it comfortable: code on the left, a live picture updating on the right.

So you don't hold all this in your head, here's the whole fork in one table, by task:

| Task | Tool | Price |
| --- | --- | --- |
| View | any browser | free |
| Recolor, tweak | [Figma](../../logos/design/figma/) | free |
| Serious offline editing | Inkscape | free |
| Professional work | [Illustrator](../../logos/design/illustrator/) | subscription |
| One-line edit | text editor | free |

Notice what's missing from the table — and that's no accident.

:::warning What NOT to open SVG with
- **Paint and the default "Photos"** — either won't open it or will rasterize on save, killing the vector.
- **[Photoshop](../../logos/design/photoshop/)** — opens it but immediately turns it to raster: it's a raster editor, vector doesn't survive there.
- **Word and PowerPoint** — you can insert an SVG into a document, but not edit the vector inside.
The logic is one: anything that turns shapes into pixels on save destroys the format's main property.
:::

## Common questions

SVG's dual nature spawns a couple of recurring questions — let's settle them so you don't guess.

**Why a black square instead of a picture?** Most likely the shapes have no fill set and the renderer used black by default, or the file uses CSS variables only the source site understands. Open it in [Figma](../../logos/design/figma/) — it shows the layer structure and the real colors.

**Is SVG safe?** From a trusted source — yes. But technically an SVG can contain scripts, so someone else's SVG from a random place shouldn't be inlined into your site — more in the article on [embedding SVG on a website](../kak-vstavit-svg-na-sajt/).

**How to open SVG in Word or PowerPoint?** Modern Office inserts SVG directly: Insert → Pictures → choose the file; basic operations follow (size, rotation, color change). Pre-2016 versions don't understand SVG — convert to PNG for them.

**An SVG from the internet won't open at all.** Check that the file itself downloaded: an HTML page often saves in its place ("Save link as" sometimes saves the page). Open it in a text editor: if it starts with `<!DOCTYPE html>`, it's a page — look for the direct `.svg` link.

## Where "broken" SVGs come from

Worth knowing separately why an outwardly correct file suddenly misbehaves — it saves hours of diagnosis. Every cause boils down to the "text describes the picture" link being broken somewhere:

- **Colors moved into CSS classes.** Some editors write colors into a `<style>` block with classes. The file is valid, but some programs (and old Office) ignore the styles — the picture goes black. Fix: re-save through [Figma](../../logos/design/figma/), which moves styles into shape attributes.
- **Live text instead of curves.** If a `<text>` tag stays in the SVG and the needed font isn't on the machine, the caption shifts or renders in a wrong font. A properly prepared logo stores text converted to curves.
- **External links.** SVG can reference images and fonts by URL — moving the file or losing internet makes those pieces vanish.
- **A cropped `viewBox`.** After manual edits, shapes can end up outside the visible area — the file looks empty though the data is there. [Figma](../../logos/design/figma/) shows all content, including what's off-frame.

## The bottom line

All of SVG's apparent fussiness is the flip side of its convenience: it's a picture and text at once, so you view it with what draws from tags (a browser) and edit it with what understands vector ([Figma](../../logos/design/figma/), Inkscape, [Illustrator](../../logos/design/illustrator/)). And "opened as text" is simply the format's nature. Unlike most graphics, working with SVG requires buying no program at all.

And the most common reason to open an SVG — just to change a logo's color — is handled with no editor at all: in our [logo catalog](../../logos/) the color editor is built right into every brand's page.
