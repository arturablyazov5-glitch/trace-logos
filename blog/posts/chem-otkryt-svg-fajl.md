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

Скачали логотип, кликнули по файлу — а вместо картинки открылся блокнот со стеной непонятного кода. Или система вообще спрашивает «чем открыть этот файл?». Спокойно: с файлом всё в порядке. SVG — необычный формат, он одновременно и картинка, и текст. Разберём, чем его смотреть и чем редактировать на любой платформе.

:::note Коротко
**Просто посмотреть** — перетащите SVG в любой браузер: [Chrome](../../logos/search/chrome/), [Safari](../../logos/search/safari/), [Яндекс Браузер](../../logos/search/yandexbrowser/). **Отредактировать** — [Figma](../../logos/design/figma/) (бесплатно, в браузере), Inkscape (бесплатно, оффлайн) или [Illustrator](../../logos/design/illustrator/). **Открылся как текст** — это нормально: SVG и есть текст, просто ваша система привязала расширение к блокноту.
:::

## Почему SVG открывается «как код»

SVG — это XML-документ: внутри теги `<svg>`, `<path>`, `<circle>` с координатами фигур. Браузер читает эти теги и рисует картинку; блокнот показывает их как есть. Если по двойному клику файл улетает в текстовый редактор — система просто выбрала не ту программу по умолчанию. Ничего не сломано и «конвертировать» ничего не нужно.

**Починить ассоциацию:** правый клик по файлу → «Открыть с помощью» → выберите браузер → поставьте галочку «Всегда открывать в этой программе».

## Просто посмотреть

### Браузер — на любой системе

Универсальный просмотрщик SVG уже установлен у вас — это браузер. Перетащите файл в окно [Chrome](../../logos/search/chrome/), [Safari](../../logos/search/safari/), [Firefox](../../logos/search/firefox/) или [Яндекс Браузера](../../logos/search/yandexbrowser/) — картинка отобразится мгновенно, колесом можно приближать без потери чёткости.

### Windows

Проводник [Windows](../../logos/store/windows/) 10/11 показывает миниатюры SVG не всегда — зависит от установленных расширений. Быстрые варианты: браузер (см. выше) или бесплатное приложение из Microsoft Store с поддержкой SVG-миниатюр. Стандартное «Фотографии» до сих пор дружит с SVG через раз.

### macOS

Quick Look (пробел по файлу в [Finder](../../logos/system/finder/)) показывает SVG из коробки. [Preview](../../logos/design/preview/) открывает его тоже, но конвертирует в растр при сохранении — для просмотра ок, для правок нет.

### Телефон

И iOS, и Android откроют SVG во встроенном браузере — пришлите файл себе в мессенджер и нажмите на него. Специальное приложение не нужно.

## Отредактировать

### Figma — бесплатно и без установки

Для 90% задач с логотипами хватает [Figma](../../logos/design/figma/): работает в браузере, бесплатна для личного использования. Перетащите SVG на холст — он вставится как полноценный редактируемый вектор: перекрашивайте, меняйте формы, удаляйте элементы, экспортируйте обратно в SVG или PNG.

### Inkscape — бесплатный оффлайн-редактор

Полноценный векторный редактор с открытым исходным кодом ([Windows](../../logos/store/windows/), macOS, Linux). SVG — его родной формат, поддержка самая полная из всех. Интерфейс менее гламурный, чем у [Figma](../../logos/design/figma/), но умеет всё, включая трассировку растра и работу с узлами кривых.

### Adobe Illustrator — профессиональный стандарт

Если [Illustrator](../../logos/design/illustrator/) у вас уже есть — вопросов нет, он открывает и сохраняет SVG. Один нюанс: при сохранении [Illustrator](../../logos/design/illustrator/) любит добавлять свои служебные данные в файл — для веба экспортируйте через «Export As» с галочкой «Minify», а не через «Save As».

### Текстовый редактор — да, серьёзно

Мелкие правки быстрее сделать прямо в коде. Поменять цвет — найти `fill="#FF0000"` и заменить значение. Изменить размер — поправить `width` и `height`. VS Code с плагином предпросмотра SVG превращает это в комфортный процесс: слева код, справа живая картинка.

## Таблица: что выбрать

| Задача | Инструмент | Цена |
| --- | --- | --- |
| Посмотреть | любой браузер | бесплатно |
| Перекрасить, подправить | [Figma](../../logos/design/figma/) | бесплатно |
| Серьёзное редактирование оффлайн | Inkscape | бесплатно |
| Профессиональная работа | [Illustrator](../../logos/design/illustrator/) | подписка |
| Правка в одну строку | текстовый редактор | бесплатно |

:::warning Чем НЕ надо открывать SVG
- **Paint и стандартные «Фотографии»** — либо не откроют, либо растеризуют при сохранении, и вектор погибнет.
- **[Photoshop](../../logos/design/photoshop/)** — откроет, но сразу превратит в растр. [Photoshop](../../logos/design/photoshop/) — растровый редактор, вектор в нём не выживает.
- **Word и PowerPoint** — вставить SVG в документ можно, редактировать вектор — нет.
:::

## Частые вопросы

**Почему в моём SVG вместо картинки — чёрный квадрат?** Скорее всего, у фигур не задан цвет заливки, и рендер использует чёрный по умолчанию, либо в файле используются CSS-переменные, которые понимает только сайт-источник. Откройте файл в [Figma](../../logos/design/figma/) — там видно структуру слоёв.

**Можно ли открыть SVG в CorelDRAW?** Да, Corel импортирует и экспортирует SVG, качество поддержки зависит от версии.

**SVG безопасен?** Файл из надёжного источника — да. Но технически SVG может содержать скрипты, поэтому не вставляйте SVG из случайных мест инлайном в свой сайт — об этом подробнее в статье о [вставке SVG на сайт](../kak-vstavit-svg-na-sajt/).

**Как открыть SVG в Word или PowerPoint?** Современный Office вставляет SVG напрямую: Вставка → Рисунки → выбираете файл. Внутри документа доступны базовые операции — размер, поворот, смена цвета через «Формат графики». Старые версии Office (до 2016) SVG не понимают — для них конвертируйте в PNG.

**Почему SVG из интернета не открывается вообще?** Проверьте, что скачали сам файл, а не HTML-страницу с ним (правый клик → «Сохранить ссылку как» иногда сохраняет страницу). Откройте файл блокнотом: если внутри `<!DOCTYPE html>` — это страница, ищите прямую ссылку на .svg.

**Есть ли просмотрщик SVG для массового просмотра папки с иконками?** На macOS [Finder](../../logos/system/finder/) показывает миниатюры SVG из коробки; на [Windows](../../logos/store/windows/) поставьте бесплатное расширение проводника с поддержкой SVG-миниатюр из Microsoft Store — и папка иконок станет видимой без открывания каждого файла.

## Как редактировать SVG в каждом инструменте: мини-инструкции

**[Figma](../../logos/design/figma/) — перекрасить логотип:** перетащите SVG на холст → дважды кликните, чтобы войти в группу → выделите нужную фигуру → в правой панели поле Fill → введите HEX или выберите пипеткой. Экспорт: Export → SVG или PNG.

**[Figma](../../logos/design/figma/) — вырезать элемент:** войдите в группу двойным кликом, выделите лишний слой, Delete. Если элементы слиплись в один path — Object → Flatten сделан автором заранее, придётся работать пером или искать исходник получше.

**Inkscape — заменить цвет везде:** Edit → Find/Replace не работает с цветами, вместо этого: Edit → Select Same → Fill Color (выделит все фигуры одного цвета) → задайте новый цвет один раз.

**Inkscape — уменьшить количество узлов:** выделите путь → Path → Simplify (Ctrl+L). Повторное нажатие упрощает сильнее. Следите за формой: чрезмерное упрощение скругляет углы.

**Текстовый редактор — сменить размер:** найдите в первой строке `width="..."` и `height="..."` и поменяйте значения (или удалите оба — тогда размером будет управлять вёрстка сайта через CSS, а пропорции сохранит viewBox).

## Откуда вообще берутся «сломанные» SVG

Понимание причин экономит время на диагностике:

- **Экспорт с CSS-классами.** Часть редакторов пишет цвета в блок `<style>` с классами. Такой файл корректен, но некоторые программы (и старые версии Office) стили игнорируют — картинка становится чёрной. Лечение: пересохранить через [Figma](../../logos/design/figma/), которая переносит стили в атрибуты фигур.
- **Шрифты текстом.** Если в SVG остался живой `<text>`, а шрифта на вашей машине нет, — надпись отобразится другим шрифтом или сместится. Правильно подготовленный логотип имеет текст в кривых.
- **Внешние ссылки.** SVG может ссылаться на картинки и шрифты по URL — без интернета или при переносе файла эти куски пропадают.
- **Обрезанный viewBox.** После ручных правок фигуры могут оказаться за пределами видимой области — файл «пустой», хотя данные внутри есть. Открывайте в [Figma](../../logos/design/figma/): она показывает всё содержимое, включая то, что за кадром.

## Коротко

Смотреть — браузером, редактировать — [Figma](../../logos/design/figma/) или Inkscape, а «открылся как текст» — не ошибка, а природа формата. SVG — самый дружелюбный графический формат: для работы с ним не нужно покупать ни одной программы.

Кстати, если SVG нужен, чтобы просто поменять цвет логотипа и скачать результат — это можно сделать вообще без редакторов: в нашем [каталоге логотипов](../../logos/) встроен редактор цвета прямо на странице каждого бренда.

---EN---

You downloaded a logo, double-clicked the file — and instead of a picture, a text editor opened with a wall of cryptic code. Or the system asks "how do you want to open this file?". Relax: the file is fine. SVG is an unusual format — it's both an image and text at the same time. Here's how to view and edit it on any platform.

:::note TL;DR
**Just viewing** — drag the SVG into any browser. **Editing** — [Figma](../../logos/design/figma/) (free, in the browser), Inkscape (free, offline) or [Illustrator](../../logos/design/illustrator/). **Opened as text** — that's normal: SVG *is* text; your system just associated the extension with a text editor.
:::

## Why SVG opens "as code"

SVG is an XML document: `<svg>`, `<path>`, `<circle>` tags with shape coordinates inside. A browser reads the tags and draws the picture; a text editor shows them literally. If double-clicking sends the file to Notepad, the OS simply picked the wrong default app. Nothing is broken and nothing needs "converting".

**Fix the association:** right-click the file → "Open with" → choose a browser → tick "Always use this app".

## Just viewing

### The browser — on any OS

Your universal SVG viewer is already installed. Drag the file into [Chrome](../../logos/search/chrome/), [Safari](../../logos/search/safari/) or [Firefox](../../logos/search/firefox/) — it renders instantly, and you can zoom in with no loss of sharpness.

### Windows

[Windows](../../logos/store/windows/) Explorer thumbnails for SVG are hit-and-miss. Quick options: the browser, or a Microsoft Store app with SVG thumbnail support. The stock Photos app still handles SVG inconsistently.

### macOS

Quick Look (spacebar in [Finder](../../logos/system/finder/)) shows SVG out of the box. [Preview](../../logos/design/preview/) opens it too but rasterizes on save — fine for viewing, wrong for editing.

### Mobile

Both iOS and Android open SVG in the built-in browser — send the file to yourself in a messenger and tap it. No special app needed.

## Editing

### Figma — free, no install

For 90% of logo tasks [Figma](../../logos/design/figma/) is enough: browser-based, free for personal use. Drag the SVG onto the canvas — it lands as a fully editable vector: recolor, reshape, delete elements, export back to SVG or PNG.

### Inkscape — the free offline editor

A full open-source vector editor ([Windows](../../logos/store/windows/), macOS, Linux). SVG is its native format with the most complete support anywhere. Less glamorous than [Figma](../../logos/design/figma/), but it does everything, including bitmap tracing and node editing.

### Adobe Illustrator — the professional standard

If you already have it, done — it opens and saves SVG. One caveat: "Save As" stuffs the file with Adobe metadata; for the web use "Export As" with "Minify" checked.

### A text editor — yes, seriously

Small edits are faster in code. Change a color — find `fill="#FF0000"` and replace the value. Resize — adjust `width` and `height`. VS Code with an SVG preview extension makes it comfortable: code on the left, live image on the right.

## Which tool when

| Task | Tool | Price |
| --- | --- | --- |
| View | any browser | free |
| Recolor, tweak | [Figma](../../logos/design/figma/) | free |
| Serious offline editing | Inkscape | free |
| Professional work | [Illustrator](../../logos/design/illustrator/) | subscription |
| One-line edit | text editor | free |

:::warning What NOT to open SVG with
- **Paint and stock photo viewers** — either won't open it or will rasterize on save, killing the vector.
- **[Photoshop](../../logos/design/photoshop/)** — opens it but immediately converts to raster. [Photoshop](../../logos/design/photoshop/) is a raster editor; vectors don't survive there.
- **Word and PowerPoint** — you can insert an SVG into a document, but you can't edit the vector.
:::

## FAQ

**Why does my SVG render as a black square?** Most likely the shapes have no fill color and the renderer defaults to black, or the file uses CSS variables only its source website defines. Open it in [Figma](../../logos/design/figma/) to inspect the layer structure.

**Does CorelDRAW open SVG?** Yes, import and export both — quality depends on the version.

**Is SVG safe?** From a trusted source — yes. Technically SVG can contain scripts, so don't inline SVGs from random places into your website — more in [our article on embedding SVG](../kak-vstavit-svg-na-sajt/).

**How do I open SVG in Word or PowerPoint?** Modern Office inserts SVG directly: Insert → Pictures. Inside the document you get basic operations — resize, rotate, recolor via Graphics Format. Office before 2016 doesn't understand SVG — convert to PNG for those.

**Why won't an SVG from the internet open at all?** Check that you downloaded the file, not an HTML page around it. Open it in a text editor: `<!DOCTYPE html>` inside means you saved a page — find the direct .svg link.

**Is there a viewer for browsing a folder of icons?** macOS [Finder](../../logos/system/finder/) thumbnails SVG out of the box; on [Windows](../../logos/store/windows/) install a free SVG-thumbnail shell extension from the Microsoft Store — the icon folder becomes visible without opening each file.

## Editing SVG in each tool: mini-recipes

**[Figma](../../logos/design/figma/) — recolor a logo:** drag the SVG onto the canvas → double-click into the group → select the shape → the Fill field in the right panel → enter a HEX or use the eyedropper. Export: SVG or PNG.

**[Figma](../../logos/design/figma/) — remove an element:** double-click into the group, select the extra layer, Delete. If everything is fused into one path, the author flattened it — you'll need the pen tool or a better source.

**Inkscape — replace a color everywhere:** Edit → Select Same → Fill Color (selects all shapes of that color) → set the new color once.

**Inkscape — reduce node count:** select the path → Path → Simplify (Ctrl+L). Repeat for stronger simplification. Watch the shape: overdoing it rounds corners.

**Text editor — change the size:** find `width="..."` and `height="..."` in the first line and edit the values (or delete both — then CSS controls the size and viewBox preserves proportions).

## Where "broken" SVGs come from

Knowing the causes saves diagnostic time:

- **Exports with CSS classes.** Some editors write colors into a `<style>` block. The file is valid, but some programs (and old Office) ignore styles — the image turns black. Fix: re-save through [Figma](../../logos/design/figma/), which bakes styles into shape attributes.
- **Live text.** If a `<text>` element remains and you lack the font, the label renders in a substitute or shifts. A properly prepared logo has text outlined.
- **External references.** SVG can link to images and fonts by URL — offline or after moving the file, those pieces vanish.
- **A clipped viewBox.** After manual edits, shapes can end up outside the visible area — the file looks "empty" though the data is there. Open it in [Figma](../../logos/design/figma/): it shows everything, including what's off-canvas.

## In short

View in the browser, edit in [Figma](../../logos/design/figma/) or Inkscape, and "it opened as text" is the format's nature, not an error. SVG is the friendliest graphics format around: you don't need to buy a single program to work with it.

And if all you need is to recolor a logo and download the result — skip the editors entirely: our [logo catalog](../../logos/) has a color editor built right into every brand's page.
