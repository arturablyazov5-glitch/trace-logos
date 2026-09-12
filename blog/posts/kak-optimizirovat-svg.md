---
title: Как оптимизировать SVG — уменьшаем вес файла в 2‑10 раз без потери качества
title_en: How to Optimize SVG — Cut File Size 2–10× with Zero Quality Loss
description: Почему SVG из редакторов весит больше, чем должен: мусор экспорта, лишние точки, растр внутри. SVGO, SVGOMG и ручные приёмы оптимизации с примерами.
description_en: Why exported SVGs weigh more than they should — editor junk, excess points, embedded raster. SVGO, SVGOMG and manual optimization techniques.
date: 2026-06-16
slug: kak-optimizirovat-svg
tags: SVG, Оптимизация, Сайты
tags_en: SVG, Optimization, Websites
---

SVG считается лёгким форматом и остаётся им ровно до момента экспорта. Откройте файл, выгруженный из [Illustrator](../../logos/design/illustrator/) или [Figma](../../logos/design/figma/), текстовым редактором: там метаданные редактора, комментарии‑визитки, координаты с восемью знаками после запятой и стили, задублированные на каждой из сорока фигур. Ни одна из этих строк не влияет на картинку, но все они уезжают к пользователю. Типичный экспорт сжимается в 2‑10 раз, и на экране при этом не меняется ни один пиксель. Разберём, откуда берётся лишний вес и как его снимать так, чтобы это происходило само.

:::note Коротко
Прогоните файл через **SVGO** (или его веб‑версию **SVGOMG**) — это закроет 90% работы автоматически: уберёт метаданные, округлит координаты, схлопнет группы. Оставшиеся 10% ручные: проверить, нет ли внутри растра, невидимых фигур и текста, не переведённого в кривые. А чтобы шаг не забывался, его встраивают в сборку проекта.
:::

## Откуда в SVG лишний вес

SVG — текстовый формат, и редакторы дописывают в него всё, что удобно им самим; браузеру эти строки без надобности. Мусор набирается пятью типовыми способами:

- **Метаданные редактора:** блок `<metadata>`, комментарий «Generator: Adobe [Illustrator](../../logos/design/illustrator/)», приватные атрибуты `sodipodi:` и `inkscape:`. Браузеру они не нужны совсем.
- **Избыточная точность:** координата `12.000000381469727` вместо `12`. На глаз разницы ноль, в весе — ощутимо, когда точек тысячи.
- **Пустые группы и defs:** остатки слоёв, неиспользуемые градиенты, обёртки без содержимого.
- **Задублированные стили:** `fill="#21A038"` на каждой из 40 фигур вместо одного объявления на группе.
- **Скрытые объекты:** фигуры с `display:none` или за пределами viewBox — следы процесса рисования, уехавшие в экспорт.

Заметьте, что все пять пунктов механические: их можно найти и убрать по формальным признакам, без понимания картинки. Поэтому основную работу и делает автоматика.

## Автоматика: SVGO и SVGOMG

**SVGOMG** — веб‑интерфейс: перетащили файл, подвигали тумблеры, скачали результат; вес до и после виден сразу. Для разовых задач подходит идеально.

**SVGO** — консольная утилита для потока файлов и сборки:

```
npx svgo logo.svg              # оптимизировать файл
npx svgo -f ./icons -o ./dist  # папку целиком
```

Дефолтные настройки безопасны, менять их без нужды не стоит. Аккуратности требуют два тумблера:

- **Precision (точность округления).** 2‑3 знака безопасны; единица заметно искажает мелкие детали и плавные кривые.
- **Remove viewBox.** Оставьте выключенным: без viewBox файл перестаёт масштабироваться через CSS. Это типичная причина жалобы «вставил SVG, а он не резинится».

:::warning Проверяйте результат глазами
Откройте оптимизированный файл рядом с оригиналом и сравните мелкие детали и градиенты. Агрессивные настройки изредка ломают сложные файлы: маски, фильтры, узорные заливки. Сломалось — верните точность на шаг назад.
:::

## Что автоматика сделать не может

SVGO работает с формой записи, но не понимает содержимого. Поэтому остаются четыре случая, где нужен человек, и первый из них объясняет большинство историй «почему мой SVG весит 800 КБ».

### Найдите растр внутри

Самая частая причина огромного веса: внутри вектора лежит растровая картинка в base64 (`<image href="data:image/png…`). Расширение у файла векторное, содержимое растровое, со всеми ограничениями пикселей. Ищите тег `<image>`: если он есть, файл нужно перерисовывать в честный вектор, и никакая оптимизация тут не поможет.

Проверка занимает секунды: откройте файл текстовым редактором и поищите строку `data:image`. Нашлась — внутри растр, и на него приходится почти весь вес. Тот же признак виден косвенно, по размеру: SVG на 800 КБ при простой картинке физически не может состоять из одних координат, столько занимает только закодированная в base64 картинка.

### Решите вопрос с текстом

Тег `<text>` рендерится шрифтом зрителя: шрифта нет — надпись перескочит на другой и поедет. Для логотипов текст переводят в кривые (Outline или Flatten в редакторе). У этого есть цена: каждая буква‑кривая занимает десятки точек, и длинные надписи раздувают файл. Отсюда правило: логотипы и иконки — в кривые, схемы с десятками подписей — оставляйте `<text>` с системными шрифтами.

### Упростите пути

В [Figma](../../logos/design/figma/): выделить фигуру → Flatten, затем удалить лишние точки. В Inkscape: Path → Simplify (Ctrl+L) уменьшает количество узлов с настраиваемой агрессивностью. Приём особенно выручает после автотрассировки растра, которая любит ставить точку на каждом пикселе.

### Объедините одинаковые заливки

Сорок фигур одного цвета? Сгруппируйте и задайте `fill` один раз на группе. Заодно упростится перекраска — та самая, которой пользуется наш [редактор цвета логотипов](../kak-izmenit-cvet-logotipa/).

Тот же приём чинит обратную ситуацию, когда один цвет записан в файле тремя способами сразу: `fill="#FF0000"`, `fill="red"` и `style="fill:rgb(255,0,0)"`. Браузер нарисует одинаковые фигуры, а поиск по коду найдёт одно написание из трёх, и перекраска заменой строки сработает наполовину. После нормализации у цвета остаётся одна запись на весь файл.

## Сколько это даёт в килобайтах

| Файл | До | После SVGO | Ручная доводка |
| --- | --- | --- | --- |
| Иконка из [Figma](../../logos/design/figma/) | 4 КБ | 1,5 КБ | 1 КБ |
| Логотип из [Illustrator](../../logos/design/illustrator/) | 25 КБ | 8 КБ | 5 КБ |
| Автотрассировка PNG | 300 КБ | 150 КБ | перерисовка → 10 КБ |

Килобайты кажутся мелочью ровно до тех пор, пока иконок не станет тридцать на страницу: там разница между «моментально» и «заметно грузится» становится осязаемой, особенно на мобильных. А инлайн‑SVG входит прямо в HTML, поэтому его вес добавляется к весу каждой страницы.

## Разбор файла: что именно выкидывается

Чтобы цифры из таблицы перестали быть абстракцией, посмотрим на типичный экспорт иконки построчно:

```
<?xml version="1.0" encoding="UTF-8"?>            ← не нужно для веба
<!-- Generator: Adobe Illustrator 27.0 -->        ← комментарий-визитка
<svg xmlns:xlink="..." xml:space="preserve"        ← неиспользуемые атрибуты
     width="24.000000px" height="24.000000px">     ← лишние нули
  <g id="Layer_1_копия_2">                         ← имя слоя из редактора
    <path fill="#FF0000" d="M12.000000,2.000000    ← 6 знаков после запятой
      C12.000000,2.000000 11.999999,2.000001..."/>  ← микродвижения кривой
  </g>
</svg>
```

После SVGO остаётся суть:

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="red" d="M12 2C12 2 12 2..."/>
</svg>
```

Каждая строка мусора безобидна по отдельности. Но их сотни в каждом файле, а файлов десятки — так 4 КБ и превращаются в 1 КБ без единого видимого изменения.

## Чем проверить, что стало лучше

Вес файла в проводнике — грубая мера: он ничего не говорит о том, что стало с картинкой и сколько работы осталось браузеру. Вопрос закрывают три проверки.

Первая — сравнение глазами при масштабе 400%: там видно, как округление до одного знака съедает скругления и стыки кривых. Вторая — число узлов: откройте оптимизированный файл в [Figma](../../logos/design/figma/) и посмотрите на количество точек в контуре. После автотрассировки их бывает несколько тысяч на простой знак, и тогда помогает перерисовка, а настройки SVGO уже ничего не изменят. Третья — вкладка Network в DevTools, где колонка Size показывает исходный размер файла и переданный по сети.

Отдельно стоит смотреть на инлайн‑иконки. Каждый `<path>` внутри HTML становится узлом DOM, поэтому набор из тридцати сложных иконок утяжеляет и загрузку, и отрисовку страницы.

## Gzip и Brotli: последний множитель

Раз SVG остаётся текстом, он отлично сжимается на лету. Правильно настроенный сервер отдаёт файлы со сжатием Brotli или Gzip — это минус 60‑80% к передаваемому размеру поверх всей оптимизации выше. Проверить можно в DevTools → Network → колонка Size: если transferred сильно меньше size, сжатие работает.

Порядок здесь важен: сжатие срабатывает поверх оптимизации. Прогнанный через SVGO файл после Brotli весит меньше, чем неоптимизированный после того же Brotli, потому что повторяющиеся метаданные архиватор сжимает хорошо, но всё же не до нуля.

## Как сделать, чтобы оптимизация происходила сама

Всё описанное выше работает для разового файла. В проекте с десятками иконок ручной прогон рано или поздно забудут, поэтому шаг встраивают в процесс:

- **Конфиг в репозитории.** Файл `svgo.config.js` фиксирует настройки для всей команды — например, выключённый removeViewBox и точность 3:

```
module.exports = {
  plugins: [
    { name: 'preset-default',
      params: { overrides: { removeViewBox: false } } },
  ],
};
```

- **Хук или CI‑шаг:** прогон svgo по изменённым файлам на pre‑commit — тогда неоптимизированный SVG физически не попадёт в репозиторий.
- **Сборщики:** для Vite и Webpack есть плагины, оптимизирующие SVG на лету при импорте; в React‑проектах SVGR совмещает оптимизацию с превращением иконок в компоненты.
- **[Figma](../../logos/design/figma/)-плагины** (SVGO Compressor и аналоги) оптимизируют прямо при экспорте — удобно дизайнерам, которые отдают файлы разработчикам.

Принцип один: оптимизация должна случаться автоматически. «Помнить прогнать через SVGOMG» на дистанции перестаёт работать у любой команды.

## Когда оптимизация не нужна

Автоматизация полезна не везде, и три случая честно выпадают из правила:

- **Единственный логотип на статичном лендинге** — разница в 3 КБ не изменит ни одной измеримой метрики.
- **SVG для печати или передачи дизайнеру** — там важна структура слоёв, которую агрессивная оптимизация схлопывает. Оптимизируйте копию для веба, исходник храните как есть.
- **Файлы, которые ещё будут редактироваться** — оптимизация необратимо упрощает структуру: имена слоёв, группы и направляющие исчезают.

Все три исключения сводятся к одному правилу: оптимизированный SVG — продакшен‑артефакт, как минифицированный JS. Исходник живёт отдельно.

## Если коротко

Лишний вес в SVG возникает механически, на экспорте, поэтому и снимается механически: SVGO с дефолтами — обязательный шаг для любого файла, уходящего на сайт. Руками остаётся проверить четыре вещи: нет ли внутри растра, что с текстом, не переусложнены ли пути после трассировки, не задублированы ли заливки. И не отключайте viewBox. А главное — вынесите прогон в pre‑commit или сборщик: шаг, который надо помнить, рано или поздно забудут.

Все SVG в нашем [каталоге логотипов](../../logos/) уже оптимизированы и нормализованы: скачивайте или копируйте код без метаданных, мусора и сюрпризов внутри.

---EN---

SVG counts as a lightweight format and stays one right up until export. Open a file exported from [Illustrator](../../logos/design/illustrator/) or [Figma](../../logos/design/figma/) in a text editor: there you'll find editor metadata, business-card comments, coordinates with eight decimal places, and styles duplicated across each of forty shapes. Not one of these lines affects the picture, yet all of them travel to the user. A typical export compresses 2–10×, and not a single pixel changes on screen. Let's look at where the extra weight comes from and how to remove it so that it happens by itself.

:::note TL;DR
Run the file through **SVGO** (or its web version **SVGOMG**) — that covers 90% of the work automatically: it strips metadata, rounds coordinates, collapses groups. The remaining 10% is manual: check for embedded raster, invisible shapes and text that wasn't converted to curves. And to keep the step from being forgotten, wire it into the project build.
:::

## Where the extra weight comes from

SVG is a text format, and editors write into it whatever suits them; the browser has no use for those lines. The junk accumulates in five typical ways:

- **Editor metadata:** a `<metadata>` block, a "Generator: Adobe [Illustrator](../../logos/design/illustrator/)" comment, private `sodipodi:` and `inkscape:` attributes. The browser has no use for any of it.
- **Excess precision:** the coordinate `12.000000381469727` instead of `12`. Zero visible difference, tangible weight once there are thousands of points.
- **Empty groups and defs:** leftovers of layers, unused gradients, wrappers with no content.
- **Duplicated styles:** `fill="#21A038"` on each of 40 shapes instead of one declaration on the group.
- **Hidden objects:** shapes with `display:none` or outside the viewBox — traces of the drawing process that made it into the export.

Notice that all five are mechanical: they can be found and removed by formal signs, without understanding the picture. That's why automation does the bulk of the work.

## Automation: SVGO and SVGOMG

**SVGOMG** is a web interface: drag the file in, move the toggles, download the result; the before and after weight shows immediately. For one-off tasks it's ideal.

**SVGO** is a command-line utility for file streams and builds:

```
npx svgo logo.svg              # optimize a file
npx svgo -f ./icons -o ./dist  # a whole folder
```

The defaults are safe and shouldn't be changed without cause. Two toggles call for care:

- **Precision (rounding).** 2–3 digits are safe; a value of 1 visibly distorts fine details and smooth curves.
- **Remove viewBox.** Leave it off: without a viewBox the file stops scaling via CSS. That's the classic cause of "I embedded the SVG and it won't resize".

:::warning Check the result with your eyes
Open the optimized file next to the original and compare fine details and gradients. Aggressive settings occasionally break complex files: masks, filters, pattern fills. If something breaks, step the precision back.
:::

## What automation can't do

SVGO works on the form of the record, but doesn't understand the content. So four cases remain that need a human, and the first explains most "why does my SVG weigh 800 KB" stories.

### Find the raster inside

The most common cause of huge weight: a base64 raster image sits inside the vector (`<image href="data:image/png…`). The extension is vector, the contents are raster, with every pixel limitation. Search for the `<image>` tag: if it's there, the file has to be redrawn as an honest vector, and no optimization will help.

The check takes seconds: open the file in a text editor and search for the string `data:image`. Found it, and there's a raster inside carrying almost all of the weight. The same sign shows up indirectly in the size: an 800 KB SVG of a simple picture physically cannot consist of coordinates alone, only a base64-encoded image takes up that much.

### Settle the question of text

A `<text>` tag renders in the viewer's font: no font, and the caption jumps to another one and shifts. For logos, text is converted to curves (Outline or Flatten in the editor). This has a price: every letter-curve takes dozens of points, and long captions inflate the file. Hence the rule: logos and icons go to curves, diagrams with dozens of labels keep `<text>` with system fonts.

### Simplify the paths

In [Figma](../../logos/design/figma/): select the shape → Flatten, then delete surplus points. In Inkscape: Path → Simplify (Ctrl+L) reduces node count with adjustable aggressiveness. The technique especially helps after raster auto-tracing, which loves placing a point on every pixel.

### Merge identical fills

Forty shapes in one color? Group them and set `fill` once on the group. Recoloring gets simpler too — the very kind our [logo color editor](../kak-izmenit-cvet-logotipa/) relies on.

The same move fixes the mirror situation, where one color is written three ways at once in the same file: `fill="#FF0000"`, `fill="red"` and `style="fill:rgb(255,0,0)"`. The browser draws identical shapes, a code search finds one spelling out of three, and recoloring by string replacement works halfway. After normalization the color has a single spelling across the file.

## What this gives in kilobytes

| File | Before | After SVGO | Manual polish |
| --- | --- | --- | --- |
| Icon from [Figma](../../logos/design/figma/) | 4 KB | 1.5 KB | 1 KB |
| Logo from [Illustrator](../../logos/design/illustrator/) | 25 KB | 8 KB | 5 KB |
| PNG auto-trace | 300 KB | 150 KB | redraw → 10 KB |

Kilobytes look like trivia right up until there are thirty icons on a page: there the gap between "instant" and "visibly loading" becomes tangible, especially on mobile. And inline SVG goes straight into the HTML, so its weight is added to the weight of every page.

## File autopsy: what exactly gets thrown out

To make the table's numbers concrete, here's a typical icon export line by line:

```
<?xml version="1.0" encoding="UTF-8"?>            ← not needed for the web
<!-- Generator: Adobe Illustrator 27.0 -->        ← business-card comment
<svg xmlns:xlink="..." xml:space="preserve"        ← unused attributes
     width="24.000000px" height="24.000000px">     ← surplus zeros
  <g id="Layer_1_copy_2">                          ← layer name from the editor
    <path fill="#FF0000" d="M12.000000,2.000000    ← 6 decimal places
      C12.000000,2.000000 11.999999,2.000001..."/>  ← micro-movements of the curve
  </g>
</svg>
```

After SVGO the essence remains:

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="red" d="M12 2C12 2 12 2..."/>
</svg>
```

Each line of junk is harmless on its own. But there are hundreds in every file and dozens of files — that's how 4 KB becomes 1 KB with no visible change at all.

## How to check that it actually got better

The file size in your file manager is a crude measure: it says nothing about what happened to the picture or how much work the browser still has. Three checks close the question.

The first is a visual comparison at 400% zoom, where rounding to a single decimal visibly eats away roundings and curve joints. The second is the node count: open the optimized file in [Figma](../../logos/design/figma/) and look at the number of points in the outline. After auto-tracing there can be several thousand of them on a simple mark, and then a redraw helps while SVGO settings change nothing. The third is the Network tab in DevTools, where the Size column shows both the original file size and what went over the wire.

Inline icons deserve a separate look. Every `<path>` inside the HTML becomes a DOM node, so a set of thirty complex icons weighs down both loading and rendering.

## Gzip and Brotli: the final multiplier

Since SVG stays text, it compresses beautifully on the fly. A properly configured server serves files with Brotli or Gzip — that's another 60–80% off the transferred size on top of all the optimization above. You can check in DevTools → Network → the Size column: if transferred is much smaller than size, compression is working.

The order matters: compression works on top of optimization. A file run through SVGO weighs less after Brotli than an unoptimized one after the same Brotli, because repeated metadata compresses well yet never all the way to zero.

## How to make optimization happen by itself

Everything above works for a one-off file. In a project with dozens of icons, a manual run will eventually be forgotten, so the step gets wired into the process:

- **A config in the repository.** An `svgo.config.js` file fixes the settings for the whole team — for instance removeViewBox off and precision 3:

```
module.exports = {
  plugins: [
    { name: 'preset-default',
      params: { overrides: { removeViewBox: false } } },
  ],
};
```

- **A hook or CI step:** running svgo over changed files on pre-commit — then an unoptimized SVG physically can't enter the repository.
- **Bundlers:** Vite and Webpack have plugins that optimize SVG on the fly at import; in React projects SVGR combines optimization with turning icons into components.
- **[Figma](../../logos/design/figma/) plugins** (SVGO Compressor and similar) optimize right at export — handy for designers handing files to developers.

One principle: optimization has to happen automatically. "Remembering to run SVGOMG" stops working for every team over time.

## When optimization isn't needed

Automation doesn't pay off everywhere, and three cases honestly fall outside the rule:

- **A single logo on a static landing page** — a 3 KB difference won't move any measurable metric.
- **SVG for print or for handing to a designer** — there the layer structure matters, and aggressive optimization collapses it. Optimize a copy for the web, keep the source as is.
- **Files that will still be edited** — optimization irreversibly simplifies structure: layer names, groups and guides disappear.

All three exceptions reduce to one rule: an optimized SVG is a production artifact, like minified JS. The source lives separately.

## In short

Extra weight in SVG appears mechanically, at export, so it's removed mechanically too: SVGO with defaults is a mandatory step for any file heading to a website. By hand you check four things: whether raster sits inside, what to do about text, whether paths are overcomplicated after tracing, whether fills are duplicated. And leave the viewBox alone. Above all, move the run into pre-commit or your bundler: a step you have to remember will eventually be forgotten.

Every SVG in our [logo catalog](../../logos/) is already optimized and normalized: download or copy the code with no metadata, no junk and no surprises inside.
