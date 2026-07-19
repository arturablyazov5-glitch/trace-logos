---
title: Как оптимизировать SVG — уменьшаем вес файла в 2–10 раз без потери качества
title_en: How to Optimize SVG — Cut File Size 2–10× with Zero Quality Loss
description: Почему SVG из редакторов весит больше, чем должен: мусор экспорта, лишние точки, растр внутри. SVGO, SVGOMG и ручные приёмы оптимизации с примерами.
description_en: Why exported SVGs weigh more than they should — editor junk, excess points, embedded raster. SVGO, SVGOMG and manual optimization techniques.
date: 2026-06-16
slug: kak-optimizirovat-svg
tags: SVG, Оптимизация, Сайты
tags_en: SVG, Optimization, Websites
---

SVG считается лёгким форматом, но откройте файл, экспортированный из [Illustrator](../../logos/design/illustrator/) или [Figma](../../logos/design/figma/), — и найдёте там метаданные редактора, закомментированный мусор, координаты с восемью знаками после запятой и стили, задублированные на каждой фигуре. Типичный экспортированный SVG можно сжать в 2–10 раз, не изменив ни одного пикселя на экране. Разберём, как.

:::note Коротко
Прогоните файл через **SVGO** (или его веб-версию **SVGOMG**) — это закроет 90% оптимизации автоматически: уберёт метаданные, округлит координаты, схлопнет группы. Оставшиеся 10% — ручные: проверить, нет ли растра внутри, лишних невидимых фигур и текста, не переведённого в кривые.
:::

## Откуда в SVG мусор

SVG — текстовый формат, и редакторы пишут туда всё, что им удобно:

- **Метаданные редактора:** `<metadata>`, комментарии «Generator: Adobe [Illustrator](../../logos/design/illustrator/)», приватные атрибуты `sodipodi:`/`inkscape:` — браузеру они не нужны вообще.
- **Избыточная точность:** координата `12.000000381469727` вместо `12` — на глаз разницы ноль, в весе — ощутимо, когда точек тысячи.
- **Пустые группы и defs:** остатки слоёв, неиспользуемые градиенты, обёртки без содержимого.
- **Задублированные стили:** `fill="#21A038"` на каждой из 40 фигур вместо одного стиля на группе.
- **Скрытые объекты:** фигуры с `display:none` или за пределами viewBox — артефакты процесса рисования, которые уехали в экспорт.

## Автоматика: SVGO и SVGOMG

**SVGOMG** — веб-интерфейс: перетащили файл, подвигали тумблеры, скачали результат, вес до/после виден сразу. Для разовых задач — идеально.

**SVGO** — консольная утилита для потока файлов и сборки:

```
npx svgo logo.svg              # оптимизировать файл
npx svgo -f ./icons -o ./dist  # папку целиком
```

Дефолтные настройки безопасны. Два тумблера, с которыми стоит быть аккуратным:

- **Precision (точность округления).** 2–3 знака — безопасно; 1 — может заметно исказить мелкие детали и плавные кривые.
- **Remove viewBox.** Не включайте: без viewBox SVG перестаёт масштабироваться через CSS — типичная причина «SVG вставил, а он не резинится».

:::warning Проверяйте после оптимизации
Откройте оптимизированный файл рядом с оригиналом и сравните на глаз, особенно мелкие детали и градиенты. Агрессивные настройки изредка ломают сложные файлы: маски, фильтры, узорные заливки. Ломается — откатите точность на шаг назад.
:::

## Ручные приёмы — то, что автоматика не сделает

### Найдите растр внутри

Самая частая причина «почему мой SVG весит 800 КБ»: внутри вектора лежит растровая картинка в base64 (`<image href="data:image/png...`). Формально это SVG, фактически — PNG в обёртке, со всеми минусами растра. Ищите тег `<image>` — если он есть, файл нужно не оптимизировать, а перерисовывать в честный вектор.

### Переведите текст в кривые — или наоборот

Тег `<text>` рендерится шрифтом зрителя: нет шрифта — надпись перескочит на другой. Для логотипов текст переводят в кривые (Outline/Flatten в редакторе). Обратная сторона: каждая буква-кривая — это десятки точек, и длинные надписи раздувают файл. Для иконок и логотипов — кривые; для схем с большим количеством подписей — `<text>` с системными шрифтами.

### Упростите пути

В [Figma](../../logos/design/figma/): выделить фигуру → Flatten, затем удалить лишние точки. В Inkscape: Path → Simplify (Ctrl+L) — уменьшает количество узлов кривой с настраиваемой агрессивностью. Особенно помогает после автотрассировки растра, которая любит ставить точку на каждом пикселе.

### Объедините одинаковые заливки

Сорок фигур одного цвета? Сгруппируйте и задайте fill один раз на группе. Заодно упростится перекраска — та самая, которой пользуется наш [редактор цвета логотипов](../kak-izmenit-cvet-logotipa/).

## Что даёт оптимизация на практике

| Файл | До | После SVGO | Ручная доводка |
| --- | --- | --- | --- |
| Иконка из [Figma](../../logos/design/figma/) | 4 КБ | 1,5 КБ | 1 КБ |
| Логотип из [Illustrator](../../logos/design/illustrator/) | 25 КБ | 8 КБ | 5 КБ |
| Автотрассировка PNG | 300 КБ | 150 КБ | перерисовка → 10 КБ |

Килобайты кажутся мелочью, пока иконок не становится тридцать на страницу: там разница между «моментально» и «заметно грузится», особенно на мобильных. Плюс инлайн-SVG входит в HTML — его вес это вес каждой страницы.

## Gzip и Brotli: последний множитель

SVG — текст, а текст отлично сжимается на лету. Правильно настроенный сервер отдаёт SVG со сжатием Brotli или Gzip — это ещё минус 60–80% к передаваемому размеру. Проверить можно в DevTools → Network → колонка Size: если transferred сильно меньше size — сжатие работает.

## Автоматизация: SVGO в пайплайне проекта

Ручная оптимизация хороша для разовых файлов; в проекте с десятками иконок её встраивают в процесс:

- **Конфиг в репозитории.** Файл `svgo.config.js` фиксирует настройки для всей команды — например, отключённый removeViewBox и точность 3:

```
module.exports = {
  plugins: [
    { name: 'preset-default',
      params: { overrides: { removeViewBox: false } } },
  ],
};
```

- **Хук или CI-шаг:** прогон svgo по изменённым файлам на pre-commit — и неоптимизированный SVG физически не попадает в репозиторий.
- **Сборщики:** для Vite/Webpack есть плагины, оптимизирующие SVG на лету при импорте; в React-проектах SVGR совмещает оптимизацию с превращением иконок в компоненты.
- **[Figma](../../logos/design/figma/)-плагины** (SVGO Compressor и аналоги) оптимизируют прямо при экспорте — полезно дизайнерам, которые отдают файлы разработчикам.

Принцип один: оптимизация должна случаться сама, а не по памяти. «Помнить прогнать через SVGOMG» не работает на дистанции.

## Разбор реального файла: что именно выкидывается

Возьмём типичный экспорт иконки из редактора и посмотрим на мусор построчно:

```
<?xml version="1.0" encoding="UTF-8"?>            ← не нужно для веба
<!-- Generator: Adobe [Illustrator](../../logos/design/illustrator/) 27.0 -->         ← комментарий-визитка
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

Каждая строка мусора безобидна по отдельности — но их сотни в каждом файле, а файлов десятки. Так 4 КБ превращаются в 1 КБ без единого видимого изменения.

## Когда оптимизация НЕ нужна

Для честности — случаи, где можно не заморачиваться:

- **Единственный логотип на статичном лендинге** — разница в 3 КБ не изменит ничего измеримого.
- **SVG для печати или передачи дизайнеру** — там важна структура слоёв, которую агрессивная оптимизация схлопывает. Оптимизируйте копию для веба, исходник храните как есть.
- **Файлы, которые ещё будут редактироваться** — оптимизация необратимо упрощает структуру: имена слоёв, группы и невидимые направляющие исчезают.

Правило: оптимизированный SVG — это **продакшен-артефакт**, как минифицированный JS. Исходник живёт отдельно.

## Коротко

SVGO/SVGOMG с дефолтами — обязательный шаг для любого SVG, уходящего на сайт. Дальше по ситуации: выгнать растр из вектора, перевести текст в кривые, упростить пути после трассировки. И не отключайте viewBox.

Все SVG в нашем [каталоге логотипов](../../logos/) уже оптимизированы и нормализованы — скачивайте или копируйте код без мусора, метаданных и сюрпризов внутри.

---EN---

SVG has a reputation as a lightweight format — but open a file exported from [Illustrator](../../logos/design/illustrator/) or [Figma](../../logos/design/figma/) and you'll find editor metadata, commented-out junk, coordinates with eight decimal places and styles duplicated on every shape. A typical exported SVG can shrink 2–10× without changing a single on-screen pixel. Here's how.

:::note TL;DR
Run the file through **SVGO** (or its web UI, **SVGOMG**) — that's 90% of the job, automatically: metadata stripped, coordinates rounded, groups collapsed. The remaining 10% is manual: check for embedded raster, invisible leftover shapes, and text not converted to outlines.
:::

## Where the junk comes from

SVG is text, and editors write whatever suits them:

- **Editor metadata:** `<metadata>`, "Generator: Adobe [Illustrator](../../logos/design/illustrator/)" comments, private `sodipodi:`/`inkscape:` attributes — browsers need none of it.
- **Excess precision:** `12.000000381469727` instead of `12` — invisible to the eye, heavy across thousands of points.
- **Empty groups and defs:** layer remnants, unused gradients, contentless wrappers.
- **Duplicated styles:** `fill="#21A038"` on each of 40 shapes instead of once on a group.
- **Hidden objects:** shapes with `display:none` or outside the viewBox — drawing-process artifacts that rode along into the export.

## Automation: SVGO and SVGOMG

**SVGOMG** is the web UI: drop a file, toggle options, download — before/after size shown live. Perfect for one-offs.

**SVGO** is the CLI for batches and build pipelines:

```
npx svgo logo.svg              # one file
npx svgo -f ./icons -o ./dist  # a whole folder
```

Defaults are safe. Two toggles deserve caution:

- **Precision.** 2–3 decimals — safe; 1 — can visibly distort fine details and smooth curves.
- **Remove viewBox.** Leave it off: without a viewBox the SVG stops scaling via CSS — the classic "I embedded the SVG and it won't resize".

:::warning Verify after optimizing
Open the optimized file next to the original and compare — especially small details and gradients. Aggressive settings occasionally break complex files: masks, filters, pattern fills. If something breaks, step the precision back.
:::

## Manual techniques automation can't do

### Find raster hiding inside

The top answer to "why is my SVG 800 KB": a base64 bitmap inside the vector (`<image href="data:image/png...`). Technically SVG, actually a PNG in a wrapper with all raster downsides. Search for the `<image>` tag — if present, the file needs redrawing, not optimizing.

### Convert text to outlines — or the reverse

A `<text>` tag renders with the viewer's fonts: font missing — the label jumps to a fallback. Logos should have text outlined (Outline/Flatten in your editor). The flip side: each outlined letter is dozens of points, and long labels bloat the file. Icons and logos — outlines; diagrams with many labels — `<text>` with system fonts.

### Simplify paths

[Figma](../../logos/design/figma/): select → Flatten, then delete excess points. Inkscape: Path → Simplify (Ctrl+L) — reduces node count with adjustable aggression. Especially useful after auto-tracing, which loves to put a node on every pixel.

### Merge identical fills

Forty shapes of one color? Group them and set the fill once on the group. Recoloring gets easier too — the very thing our [logo color editor](../kak-izmenit-cvet-logotipa/) relies on.

## Real-world numbers

| File | Before | After SVGO | Manual pass |
| --- | --- | --- | --- |
| [Figma](../../logos/design/figma/) icon | 4 KB | 1.5 KB | 1 KB |
| [Illustrator](../../logos/design/illustrator/) logo | 25 KB | 8 KB | 5 KB |
| Auto-traced PNG | 300 KB | 150 KB | redraw → 10 KB |

Kilobytes look petty until a page carries thirty icons: that's the gap between "instant" and "visibly loading", especially on mobile. And inline SVG ships inside the HTML — its weight is every page's weight.

## Gzip and Brotli: the final multiplier

SVG is text, and text compresses beautifully on the fly. A properly configured server serves SVG with Brotli or Gzip — another 60–80% off the transferred size. Check in DevTools → Network → the Size column: transferred far below size means compression is working.

## Automation: SVGO in the project pipeline

Manual optimization suits one-off files; projects with dozens of icons bake it into the process:

- **A config in the repo.** `svgo.config.js` fixes the settings for the whole team — e.g. removeViewBox off, precision 3:

```
module.exports = {
  plugins: [
    { name: 'preset-default',
      params: { overrides: { removeViewBox: false } } },
  ],
};
```

- **A hook or CI step:** running svgo over changed files on pre-commit means unoptimized SVG physically can't enter the repo.
- **Bundlers:** Vite/Webpack plugins optimize SVG on import; in React projects SVGR combines optimization with turning icons into components.
- **[Figma](../../logos/design/figma/) plugins** (SVGO Compressor and kin) optimize at export time — handy for designers handing files to developers.

One principle: optimization must happen by itself, not by memory. "Remembering to run SVGOMG" doesn't survive contact with deadlines.

## Dissecting a real file: what exactly gets thrown out

A typical editor export, junk annotated line by line:

```
<?xml version="1.0" encoding="UTF-8"?>            ← unneeded on the web
<!-- Generator: Adobe [Illustrator](../../logos/design/illustrator/) 27.0 -->         ← a business-card comment
<svg xmlns:xlink="..." xml:space="preserve"        ← unused attributes
     width="24.000000px" height="24.000000px">     ← trailing zeros
  <g id="Layer_1_copy_2">                          ← the editor's layer name
    <path fill="#FF0000" d="M12.000000,2.000000    ← 6 decimal places
      C12.000000,2.000000 11.999999,2.000001..."/>  ← curve micro-jitters
  </g>
</svg>
```

After SVGO, the essence remains:

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="red" d="M12 2C12 2 12 2..."/>
</svg>
```

Each junk line is harmless alone — but there are hundreds per file and dozens of files. That's how 4 KB becomes 1 KB with zero visible change.

## When optimization is NOT needed

For honesty — the cases where you can skip it:

- **A single logo on a static landing page** — 3 KB changes nothing measurable.
- **SVG for print or designer handoff** — layer structure matters there, and aggressive optimization collapses it. Optimize a web copy; keep the source intact.
- **Files still being edited** — optimization irreversibly simplifies structure: layer names, groups and guides vanish.

The rule: an optimized SVG is a **production artifact**, like minified JS. The source lives separately.

## In short

SVGO/SVGOMG with defaults is a mandatory step for any SVG headed to production. Then situationally: evict embedded raster, outline text, simplify traced paths. And never remove the viewBox.

Every SVG in our [logo catalog](../../logos/) is already optimized and normalized — download or copy code with no junk, metadata or surprises inside.
