---
title: Как вставить логотип в Figma — SVG, компоненты и частые ошибки
title_en: How to Insert a Logo into Figma — SVG, Components and Common Mistakes
description: Три способа добавить логотип в Figma: перетащить SVG, вставить из буфера, импортировать PNG. Как сделать из логотипа компонент и почему растр — плохая идея.
description_en: Three ways to add a logo to Figma — drag an SVG, paste from clipboard, import a PNG. Turning logos into components, and why raster is a bad idea.
date: 2026-06-24
slug: kak-vstavit-logotip-v-figma
tags: Figma, Логотипы, Дизайн
tags_en: Figma, Logos, Design
---

Собираете макет — нужен логотип [Сбера](../../logos/bank/sber/) в шапке, иконки банков в способах оплаты, знак клиента в футере. Казалось бы, банальная операция, но именно на ней в макетах появляются растровые огрызки с белым фоном, которые мылятся при первом же увеличении. Разберём, как вставлять логотипы в [Figma](../../logos/design/figma/) правильно — так, чтобы они оставались векторными, перекрашиваемыми и лёгкими.

:::note Коротко
Правильный путь — **SVG**: перетащите файл в [Figma](../../logos/design/figma/) или скопируйте SVG‑код и нажмите Ctrl+V — логотип вставится редактируемым вектором. PNG — только когда вектора не существует. Повторяющиеся логотипы оформляйте компонентами.
:::

## Способ 1. Перетащить SVG‑файл

Скачали SVG логотипа — просто перетащите его из папки на холст [Figma](../../logos/design/figma/). Файл развернётся в полноценный векторный объект: группа с фигурами, у каждой — свои заливки.

Что это даёт:

- **Масштабирование без потерь** — логотип в макете хоть 16 пикселей, хоть весь экран.
- **Перекраска** — выделяете фигуры и меняете fill: нужна белая версия для тёмного футера — две секунды.
- **Лёгкий файл** — вектор не раздувает макет, в отличие от пачки PNG.

## Способ 2. Вставить SVG‑код из буфера

Ещё быстрее: если источник отдаёт SVG‑код (кнопка «копировать SVG» в каталогах, код из DevTools), его можно вставить в [Figma](../../logos/design/figma/) напрямую — Ctrl+V/Cmd+V на холсте. [Figma](../../logos/design/figma/) распознаёт SVG‑разметку в буфере и разворачивает её в вектор. Файл на диск сохранять не нужно.

Этот способ идеален в связке с каталогами логотипов: в нашем [каталоге](../../logos/) у каждого бренда есть кнопка копирования SVG — клик там, Ctrl+V в [Figma](../../logos/design/figma/), готово.

## Способ 3. PNG — когда выбора нет

PNG перетаскивается так же, но вставляется картинкой: ни перекрасить, ни увеличить без мыла. Когда это оправдано:

- логотип существует только в растре (старый бренд, фотография вывески);
- нужен именно растровый стиль (скриншот приложения в макете).

Правила гигиены: берите PNG минимум в 2 раза больше размера в макете и обязательно с прозрачным фоном — почему это важно, разбирали в [статье про прозрачность](../logotip-s-prozrachnym-fonom/).

## Логотип как компонент — для повторяющихся

Если логотип встречается в макете больше двух раз (шапка на каждом экране, список банков), сделайте из него компонент:

1. Вставьте SVG, приведите в порядок (группа, понятное имя вроде `logo/sber`).
2. Ctrl+Alt+K / Cmd+Option+K — создать компонент.
3. Дальше по макету расставляются инстансы: обновили мастер — обновились все копии.

Продвинутый уровень — варианты компонента: цветная и монохромная версия логотипа как variants одного компонента с переключателем. В дизайн‑системах логотипы партнёров и способов оплаты обычно живут именно так.

:::tip Выравнивание логотипов разных пропорций
Логотипы в ряд (банки, партнёры, «нам доверяют») никогда не выравнивайте по ширине — вытянутый логотип станет гигантским, квадратный — микроскопическим. Ставьте всем одинаковую **высоту** и выравнивание по центру, а визуально массивные знаки уменьшайте на 10‑15% руками. Оптическое выравнивание важнее математического.
:::

## Частые ошибки

:::danger Как не надо
- **Скриншотить логотип с сайта.** Получается мыльный растр с фоном. Всегда ищите SVG — он существует почти для любого бренда.
- **Разбирать чужой SVG до атомов.** После вставки не применяйте Flatten без нужды: слои и группы в оригинальном SVG — это структура, которая пригодится для перекраски.
- **Растягивать логотип непропорционально.** В [Figma](../../logos/design/figma/) легко случайно потянуть за одну сторону. Держите Shift или фиксируйте пропорции замком в панели.
- **Перекрашивать в «почти фирменный» цвет.** У брендов точные HEX‑коды — берите их из SVG или гайдлайнов, а не на глаз (как — в статье [про цвет логотипа](../kak-uznat-cvet-logotipa/)).
:::

## Экспорт обратно

Из [Figma](../../logos/design/figma/) логотип выгружается в любом виде: выделите объект → Export → SVG для веба, PNG нужного множителя для растров, PDF для печати. Follow‑up для разработчиков: отдавайте им SVG, а не PNG — вставка SVG в вёрстку даёт чёткость и гибкость (подробности — в [гиде по вставке SVG на сайт](../kak-vstavit-svg-na-sajt/)).

## Логотипы в дизайн‑системе: как хранить правильно

Если проект больше одного макета, логотипам место в библиотеке, а не россыпью по страницам:

1. **Отдельная страница «Logos»** в файле дизайн‑системы: полный логотип, знак, монохром, инверсия — каждый компонентом с именем по схеме `logo/<бренд>/<вариант>`.
2. **Варианты через properties:** один компонент `logo/sber` со свойствами color (full/mono/white) и layout (full/mark) удобнее четырёх отдельных компонентов — переключение в один клик прямо в макете.
3. **Слоты правильного размера:** оберните логотип во фрейм фиксированной высоты (например, 32 px) с автолейаутом — тогда в шапках и списках все логотипы будут стоять ровно без ручной подгонки.
4. **Не отсоединяйте инстансы** ради перекраски: если хочется поменять цвет — это сигнал, что в компоненте не хватает варианта. Добавьте вариант в мастер, и правка разойдётся по всем макетам.

Такая структура окупается в первый же ребрендинг клиента: замена мастер‑компонента обновляет логотип в сотне экранов за минуту.

## Тонкости работы с чужими SVG в Figma

- **SVG вставился «плоским» одним слоем.** Автор файла сделал Flatten перед экспортом. Перекрасить отдельные элементы не выйдет — ищите исходник с послойной структурой (в нашем каталоге SVG сохраняют слои).
- **Цвета не меняются через Selection colors.** Проверьте, не заданы ли цвета в SVG через `style` с `!important`-подобными конструкциями — пересохранение через «копировать как SVG → вставить» обычно нормализует структуру.
- **Логотип вставился гигантским или крошечным.** У SVG не было width/height, и [Figma](../../logos/design/figma/) взяла размеры из viewBox. Просто задайте нужный размер с зажатым Shift — пропорции сохранятся.
- **Тонкие линии «поплыли» при уменьшении.** Включите у фрейма «Clip content» и проверьте, что strokes заданы внутри фигур (Inside), — внешние обводки при масштабировании ведут себя неожиданно. Для мелких размеров лучше версия знака с чуть более толстыми штрихами — именно поэтому у брендов бывают отдельные small‑size версии.

## Частые вопросы

**Как вставить логотип сразу на все макеты?** Никак напрямую — и это правильно: сделайте компонент и расставьте инстансы. Массовая вставка без компонента — техдолг, который выстрелит при первой же правке.

**Можно ли анимировать логотип в [Figma](../../logos/design/figma/)?** Прототипирование [Figma](../../logos/design/figma/) анимирует переходы между вариантами (Smart Animate) — для простого появления/смены состояния хватит. Полноценный мошн — это After Effects и экспорт в Lottie (подробнее — в статье [про анимированные логотипы](../animirovannyj-logotip/)).

**Почему PNG‑экспорт логотипа мыльный?** Проверьте множитель экспорта: 1x при мелком размере фрейма даст мелкий файл. Ставьте 2x–4x или задавайте точную ширину в поле Export.

## Коротко

SVG перетащили или вставили из буфера → при необходимости сделали компонентом → выровняли по высоте → экспортировали обратно в SVG. Растр — только когда вектора не существует в природе.

Быстрый источник векторов — наш [каталог логотипов](../../logos/): сотни брендов в SVG, копирование кода в один клик — и сразу Ctrl+V в [Figma](../../logos/design/figma/). Для эмодзи в макетах есть [отдельный каталог](../../emoji/) с PNG высокого разрешения в стилях Apple и Google.

---EN---

You're building a mockup — the client's logo in the header, bank icons in the payment methods, a partner mark in the footer. A trivial operation, seemingly — yet this is exactly where blurry raster crops with white backgrounds sneak into files. Here's how to insert logos into [Figma](../../logos/design/figma/) properly: vector, recolorable and light.

:::note TL;DR
The right way is **SVG**: drag the file into [Figma](../../logos/design/figma/), or copy SVG code and hit Ctrl+V — the logo lands as an editable vector. PNG is for when no vector exists. Repeated logos should become components.
:::

## Method 1. Drag an SVG file

Downloaded an SVG? Drag it from the folder onto the canvas. It unfolds into a true vector object: a group of shapes, each with its own fills.

What you get:

- **Lossless scaling** — 16 pixels or full-screen, equally crisp.
- **Recoloring** — select shapes and change the fill: a white version for a dark footer takes two seconds.
- **A light file** — vectors don't bloat the document the way stacks of PNGs do.

## Method 2. Paste SVG code from the clipboard

Even faster: if a source offers SVG code (a "copy SVG" button in catalogs, code from DevTools), paste it straight onto the canvas with Ctrl+V/Cmd+V. [Figma](../../logos/design/figma/) recognizes SVG markup in the clipboard and expands it into a vector. No file on disk needed.

This pairs perfectly with logo catalogs: every brand in [ours](../../logos/) has a copy-SVG button — click there, Ctrl+V in [Figma](../../logos/design/figma/), done.

## Method 3. PNG — when there's no choice

A PNG drags in the same way but lands as an image: no recoloring, no clean enlargement. Justified when:

- the logo exists only in raster (a legacy brand, a photo of signage);
- you specifically need the raster look (an app screenshot in a mockup).

Hygiene: take the PNG at 2× its mockup size minimum, and always with a transparent background — see [the transparency article](../logotip-s-prozrachnym-fonom/) for why.

## Logos as components

If a logo appears more than twice (header on every screen, a bank list), componentize it:

1. Insert the SVG, tidy it up (a group with a sane name like `logo/sber`).
2. Ctrl+Alt+K / Cmd+Option+K — create component.
3. Place instances across the file: update the master, all copies follow.

Advanced: variants — the color and monochrome versions as switchable variants of one component. That's how partner and payment logos usually live in design systems.

:::tip Aligning logos of different proportions
A logo row (banks, partners, "trusted by") should never be width-aligned — a wide wordmark becomes giant, a square mark microscopic. Give them equal **height**, center-align, and manually shrink visually heavy marks by 10–15%. Optical alignment beats mathematical.
:::

## Common mistakes

:::danger Don't
- **Screenshot a logo off a website.** You get a blurry raster with a background. An SVG exists for almost any brand — find it.
- **Flatten someone's SVG needlessly.** The layers and groups in the original are structure you'll want for recoloring.
- **Stretch disproportionately.** Easy to grab one side by accident. Hold Shift or lock proportions in the panel.
- **Recolor to "almost brand" colors.** Brands have exact HEX codes — take them from the SVG or guidelines, not by eye; [here's how](../kak-uznat-cvet-logotipa/) in a separate guide.
:::

## Exporting back

[Figma](../../logos/design/figma/) exports the logo any way you need: select → Export → SVG for web, PNG at a multiplier for raster, PDF for print. For developers, hand over SVG, not PNG — embedding SVG gives crispness and flexibility; [the embedding guide](../kak-vstavit-svg-na-sajt/) covers the details.

## Logos in a design system: storing them right

If the project is bigger than one mockup, logos belong in a library, not scattered across pages:

1. **A dedicated "Logos" page** in the design-system file: full logo, mark, monochrome, inverse — each a component named `logo/<brand>/<variant>`.
2. **Variants via properties:** one `logo/sber` component with color (full/mono/white) and layout (full/mark) properties beats four separate components — switching happens in one click inside the mockup.
3. **Fixed-size slots:** wrap the logo in a fixed-height auto-layout frame (say, 32 px) — headers and lists align without manual fiddling.
4. **Don't detach instances** to recolor: wanting a different color means the component lacks a variant. Add it to the master and the change propagates everywhere.

The structure pays off at the first client rebrand: swapping the master updates a hundred screens in a minute.

## Fine points of handling third-party SVGs in Figma

- **The SVG landed as one flat layer.** The author flattened before export. Individual recoloring won't work — find a layered source (our catalog's SVGs keep their layers).
- **Colors won't change via Selection colors.** The SVG may define colors through style constructs [Figma](../../logos/design/figma/) doesn't map; re-copying as SVG and pasting back usually normalizes the structure.
- **The logo arrived giant or tiny.** The SVG had no width/height, so [Figma](../../logos/design/figma/) used the viewBox. Just set the size with Shift held — proportions stay.
- **Thin strokes drift when scaled down.** Check strokes are Inside the shapes; outside strokes misbehave under scaling. For small sizes, a version with slightly thicker strokes works better — which is exactly why brands keep separate small-size variants.

## FAQ

**How do I place a logo on all mockups at once?** You don't — and that's correct: make a component and place instances. Mass-pasting without a component is tech debt that fires at the first edit.

**Can [Figma](../../logos/design/figma/) animate a logo?** Prototyping animates transitions between variants (Smart Animate) — enough for simple reveals. Real motion means After Effects and Lottie export, covered in [the animated logo article](../animirovannyj-logotip/).

**Why is the PNG export blurry?** Check the export multiplier: 1x from a small frame yields a small file. Use 2x–4x or set an exact width in the Export field.

## In short

Drag or paste the SVG → componentize if repeated → align by height → export back as SVG. Raster only when a vector doesn't exist in nature.

The quick vector source is our [logo catalog](../../logos/): hundreds of brands in SVG with one-click code copy — then Ctrl+V into [Figma](../../logos/design/figma/). For emoji in mockups there's a [separate catalog](../../emoji/) with high-res Apple and Google PNGs.
