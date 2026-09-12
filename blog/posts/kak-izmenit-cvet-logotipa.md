---
title: Как изменить цвет логотипа онлайн
title_en: How to Change a Logo Color Online
description: Пошаговая инструкция, как перекрасить SVG‑логотип прямо в браузере без Photoshop и Illustrator — редактор цвета Trace Logo's, типовые задачи, ошибки и авторские права
description_en: Step-by-step guide to recoloring an SVG logo right in your browser — no Photoshop or Illustrator needed. Common use cases, mistakes to avoid, and copyright notes.
date: 2026-06-03
slug: kak-izmenit-cvet-logotipa
tags: Логотипы, SVG, Цвет
tags_en: Logos, SVG, Color
---

Тёмный футер сайта, и на нём нужен белый логотип. Печать на визитке требует чёрного. Партнёрская страница в чужой палитре просит логотип в её цветах. Задача возникает постоянно, и ещё несколько лет назад ответ на неё был один: открыть [Illustrator](../../logos/design/illustrator/), найти каждый узел и перекрасить вручную. Сегодня та же операция укладывается в минуту, причём без единой установленной программы, прямо в браузере. Дело тут в самом формате файла.

## Почему перекрасить можно только вектор

Вся лёгкость держится на одном свойстве SVG: в нём **цвет хранится отдельно от формы**. Внутри тега `<path>` стоит атрибут вроде `fill="#005BFF"`, отдельный параметр рядом с рисунком. Поменяли значение, и залилось иначе, а линии, кривые и пропорции остались нетронутыми. По сути вы правите текстовый файл.

У PNG всё устроено наоборот. Отсюда и вся разница. В растре цвет **впечатан в каждый пиксель**: чтобы сделать синий логотип белым, нужно перекрасить тысячи точек, аккуратно обходя сглаженные края. Это полноценная работа в графическом редакторе вместо смены одного значения. Поэтому правило простое: перекрашивается легко только SVG. Если у вас на руках PNG, сначала понадобится вектор; почему и как, разбирали в сравнении [SVG или PNG для логотипа](../svg-ili-png-dlya-logotipa/).

А раз цвет в SVG хранится обычным значением, которое можно подменить, то и менять его необязательно в тяжёлом редакторе. Достаточно интерфейса, который покажет эти значения и даст по ним кликнуть.

## Как изменить цвет в Trace Logo's

Именно так устроен редактор на страницах каталога: он вытаскивает цвета прямо из SVG и позволяет заменить любой.

1. Откройте страницу нужного логотипа в [каталоге](../../logos/).
2. Нажмите на логотип, чтобы открыть панель редактирования.
3. В блоке **«Цвета бренда»** видны все цвета, использованные в SVG, ровно те самые значения `fill`.
4. Кликните по цвету и выберите новый в HSV‑пикере или введите точный HEX‑код, если он уже известен.
5. Скачайте результат в SVG или PNG либо скопируйте готовый код для вставки на сайт.

Важная деталь, которая снимает страх что‑то испортить: история изменений поддерживает **отмену и повтор**. Можно перебрать пять вариантов подряд и в любой момент вернуться к исходному; файл в каталоге при этом не меняется, вы работаете с копией. А если логотип многоцветный, у него несколько независимых заливок: получится перекрасить одну деталь, оставив остальные, или свести все цвета к одному. Это и определяет, какие задачи решаются в пару кликов.

Один нюанс касается способа выгрузки. Скачанный SVG хранит новые цвета внутри файла, поэтому его можно смело отдавать в вёрстку или в печать. Скопированный код ведёт себя иначе: он вставляется прямо в HTML‑разметку, и цвет там дальше живёт как обычный CSS‑параметр, который переопределяется стилями страницы. Для тёмной темы это удобно, потому что один и тот же знак перекрашивается медиазапросом без второго файла. Но если разметка уже задаёт свой `fill` для вложенных элементов, ваш выбранный цвет она перебьёт, и знак на странице окажется совсем не того оттенка, который вы видели в редакторе.

## Где это реально нужно

Дальше идут ровно те ситуации, из‑за которых вы и открыли эту статью.

- **Белый логотип для тёмного фона.** Замените основной цвет на `#FFFFFF`. Стандартное решение для футеров, тёмных хедеров и слайдов с тёмной темой, тот самый случай из начала статьи.
- **Одноцветная версия.** Сведите все цвета к одному: чёрный для печати на визитках, серый для водяного знака на фото. Чем меньше цветов, тем дешевле и предсказуемее печать.
- **Логотип для футболок и мерча.** Здесь одноцветный вариант нужен почти всегда: многоцветная печать по ткани дороже и не везде доступна, поэтому бренд заранее готовит моно‑версию.
- **Favicon или иконка приложения.** На крошечном размере упрощённая одноцветная версия читается лучше многоцветной, подробнее в разборе [про фавикон](../kak-sdelat-favicon/).
- **Адаптация под палитру проекта.** Подгонка логотипа партнёра под цвета вашего макета, но только если это разрешено гайдлайном бренда. К гайдлайнам вернёмся ниже.

Три из пяти сценариев требуют точного цвета. А точность на глаз не берётся.

## Как узнать точный HEX перед перекраской

Если вы подбираете оттенок в пикере визуально, итог почти всегда чуть промахивается мимо фирменного, и разница между «примерно таким синим» и точным `#005BFF` заметна сразу, особенно рядом с оригиналом. Поэтому, когда нужен конкретный цвет бренда, HEX‑код надо знать заранее.

Для исходного файла код уже показан в блоке «Цвета бренда» на странице логотипа, искать его не придётся. Но если оттенок нужен от стороннего логотипа, скриншота или элемента чужого дизайна, его сначала придётся считать. Как это сделать надёжно (пипеткой, из скриншота, из кода) разобрано в отдельной статье [«Как узнать точный цвет логотипа»](../kak-uznat-cvet-logotipa/). С готовым HEX перекраска превращается в подстановку одного значения, и промахнуться уже невозможно.

## Как проверить контраст цифрами

Точный код решает первую половину задачи. Вторая половина начинается там, где перекрашенный знак ложится на конкретный фон, и здесь глаз обманывает так же охотно, как при подборе оттенка.

Пороги заданы стандартом доступности WCAG: для крупной графики и элементов интерфейса контраст с фоном должен быть не ниже 3:1. Логотип формально к тексту не относится, но если он несёт название компании, читаемость подчиняется тем же цифрам. Проверить пару цветов можно любым онлайн‑калькулятором контраста: вводите два HEX и получаете коэффициент.

Отдельная сложность возникает на неоднородном фоне. Фотография или градиент под логотипом дают разный контраст в разных точках, и знак, читаемый в левом углу, пропадает в правом. Стандартное решение здесь — подложка: полупрозрачная плашка под знаком либо затемняющий слой на всю картинку. Так поступают гайдлайны платёжных систем, которые прямо предписывают, на каком фоне какую версию значка ставить.

## Что делать, если у вас только PNG

Всё описанное работает при одном условии: на руках есть вектор. Но чаще всего приходит именно PNG, скачанный когда‑то с сайта, и вопрос «как его перекрасить» встаёт заново.

Прямой ответ такой: сначала найдите SVG, и только если поиск провалился, беритесь за растр. Официальный вектор почти всегда существует, и добыть его быстрее, чем возиться с пикселями. Проверьте страницу бренда в [нашем каталоге](../../logos/), пресс‑кит на сайте компании и её раздел «Медиа»; подробный порядок поиска разобран в статье [как скачать логотип с сайта](../kak-skachat-logotip-s-sajta/).

Когда вектора нет нигде, перекраска PNG остаётся возможной, но сложность зависит от знака. Одноцветный логотип на прозрачном фоне перекрашивается за минуту: в любом редакторе накладывается слой нужного цвета в режиме наложения, который сохраняет альфа‑канал. Знак с градиентами, тенями или несколькими цветами так не поддаётся, потому что каждый оттенок придётся выделять отдельно, а сглаженные края по контуру всё равно сохранят следы старого цвета. В этой ситуации дешевле перевести логотип в вектор один раз и дальше работать с ним; способы и подводные камни собраны в разборе [как перевести логотип в вектор](../kak-perevesti-logotip-v-vektor/).

## Частые ошибки

Почти все проблемы при перекраске сводятся к двум причинам: доверие глазу там, где нужен код, и невнимание к контексту, в который логотип встанет.

:::warning Менять цвет «на глаз» вместо HEX
Визуальный подбор в пикере почти всегда даёт оттенок мимо фирменного. Если нужен конкретный цвет бренда, вводите точный HEX. Разница в пару процентов яркости видна сразу.
:::

:::warning Низкий контраст на новом фоне
Перекрашивая логотип в белый или светлый, проверяйте контраст с фоном, куда он ляжет, особенно если знак попадёт на фото или градиент. Слишком светлый знак на светлом фоне становится нечитаемым, и это уже ошибка доступности.
:::

:::warning Перекраска элементов, которые нельзя трогать
У некоторых логотипов часть деталей (знак ® рядом с названием, защищённый элемент формы) не подлежит изменению по гайдлайну бренда, даже когда редактор технически позволяет. Здесь техническая свобода упирается в юридическую границу.
:::

Последняя ошибка уводит из интерфейса в область права. О ней стоит сказать отдельно: инструмент вам всё разрешит, а бренд может запретить.

## Техническая свобода не отменяет прав

Редактор даст перекрасить любой логотип в любой цвет, такова его работа. Но большинство брендов публикуют **гайдлайны**, которые регламентируют палитру, минимальные отступы, пропорции и допустимые фоны. Для официальных материалов (партнёрских страниц, пресс‑релизов, презентаций с чужим логотипом) сверяйтесь с правилами конкретного бренда; на странице логотипа в нашем каталоге мы даём ссылку на гайдлайн, если он опубликован.

Типичные ограничения повторяются от бренда к бренду, и знать их полезно заранее. Монохромная версия обычно разрешена только в двух вариантах: полностью чёрный и полностью белый знак. Перекраска в произвольный цвет чаще всего запрещена совсем. Инверсия (белый знак на фирменном фоне) разрешается почти всегда, а вот фирменный цвет на чужом цветном фоне — почти никогда. То, что вы физически можете сделать белый логотип из синего, ещё не значит, что бренд разрешает его так показывать. Где проходит граница между «можно» и «нельзя» с чужим знаком, подробно разобрано в статье [«Можно ли использовать чужой логотип»](../mozhno-li-ispolzovat-chuzhoy-logotip/).

## Что дальше

Готовый перекрашенный логотип не обязательно скачивать файлом. Скопируйте SVG‑код прямо из редактора и [вставьте в Figma](../kak-vstavit-logotip-v-figma/): он ляжет на холст полностью векторным и редактируемым, как будто вы его там и создали. Оттуда знак отправится в макет сайта, презентацию или на мерч.

Если же перекрашенная версия нужна регулярно, сохраните её в общую библиотеку команды; личная папка тут не поможет. Иначе через полгода каждый дизайнер снова начнёт перекрашивать логотип заново и неизбежно промахнётся мимо оттенка.

## Если коротко

Перекраска логотипа перестала быть работой для дизайнера ровно потому, что в SVG цвет хранится отдельным значением; поменять его можно кликом в браузере. Но лёгкость инструмента заканчивается там, где начинаются две границы: точность (нужен HEX и проверка контраста) и право (нужен гайдлайн бренда). Держите обе в голове и попробуйте редактор цвета на любом логотипе из [нашего каталога](../../logos/).

---EN---

A dark site footer, and it needs a white logo. Business card printing calls for black. A partner page in someone else's palette asks for the logo in their colors. The task comes up constantly, and a few years ago there was one answer: open [Illustrator](../../logos/design/illustrator/), find every node and recolor by hand. Today the same operation fits into a minute, and without a single installed program, right in the browser. The reason lies in the file format itself.

## Why only vector can be recolored

The whole ease rests on one property of SVG: in it, **color is stored separately from shape**. Inside a `<path>` tag sits an attribute like `fill="#005BFF"`, a separate parameter beside the drawing. Change the value and the fill changes, while lines, curves and proportions stay untouched. You are essentially editing a text file.

PNG is the opposite, and that accounts for the whole difference. In raster, color is **baked into every pixel**: to turn a blue logo white, you'd repaint thousands of dots while tiptoeing around anti-aliased edges. That's real work in a graphics editor instead of swapping one value. Hence the simple rule: only SVG recolors easily. If all you have is a PNG, you'll need a vector first; why and how, we covered in [SVG or PNG for a logo](../svg-ili-png-dlya-logotipa/).

And since color in SVG lives in an ordinary value you can swap, changing it doesn't require a heavy editor. An interface that shows those values and lets you click them is enough.

## How to change the color in Trace Logo's

That's exactly how the editor on catalog pages works: it pulls colors straight from the SVG and lets you replace any of them.

1. Open the page of the logo you want in the [catalog](../../logos/).
2. Click the logo to open the editing panel.
3. In the **"Brand colors"** block you see every color used in the SVG, the very same `fill` values.
4. Click a color and pick a new one in the HSV picker, or type an exact HEX code if you already know it.
5. Download the result as SVG or PNG, or copy ready code to paste on your site.

An important detail removes the fear of ruining something: the edit history supports **undo and redo**. You can run through five variants and return to the original at any moment; the file in the catalog doesn't change, you work on a copy. And if the logo is multicolor, it has several independent fills: you can recolor one detail and leave the rest, or collapse everything to a single color. That's what decides which tasks take two clicks.

One nuance concerns how you take the result out. A downloaded SVG stores the new colors inside the file, so it's safe to hand to developers or to a print shop. Copied code behaves differently: it goes straight into the HTML markup, and the color there lives on as an ordinary CSS parameter that page styles can override. For dark mode that's convenient, because one mark recolors through a media query with no second file. But if the markup already sets its own `fill` for nested elements, it will beat the color you chose, and the mark on the page will end up in a shade you never saw in the editor.

## Where this is actually needed

What follows are exactly the situations that made you open this article.

- **White logo for a dark background.** Replace the main color with `#FFFFFF`. The standard move for footers, dark headers and dark-theme slides, the very case from the intro.
- **Single-color version.** Collapse all colors to one: black for business-card print, gray for a photo watermark. Fewer colors means cheaper, more predictable printing.
- **Logo for T-shirts and merch.** Here a single-color version is almost always required: multicolor fabric printing is pricier and not always available, so the brand prepares a mono version in advance.
- **Favicon or app icon.** At tiny sizes a simplified single-color version reads better than a multicolor one, more in the [favicon guide](../kak-sdelat-favicon/).
- **Adapting to a project palette.** Fitting a partner's logo to your layout's colors, but only if the brand guideline allows it. We'll return to guidelines below.

Three of the five scenarios need an exact color. And exactness can't be eyeballed.

## How to find the exact HEX before recoloring

If you pick a shade visually in the picker, the result almost always misses the brand color slightly, and the gap between "roughly this blue" and an exact `#005BFF` is obvious, especially next to the original. So when you need a specific brand color, know the HEX in advance.

For the source file the code is already shown in the "Brand colors" block on the logo page, so no hunting is needed. But if the shade comes from a third-party logo, a screenshot or someone else's design element, you'll have to read it first. How to do that reliably (eyedropper, screenshot, code) is covered in [«How to find a logo's exact color»](../kak-uznat-cvet-logotipa/). With a HEX in hand, recoloring becomes substituting one value, and missing is no longer possible.

## How to check contrast with numbers

An exact code solves the first half of the task. The second half begins where the recolored mark lands on a specific background, and here the eye deceives just as readily as it does when picking a shade.

The thresholds come from the WCAG accessibility standard: large graphics and interface elements need a contrast ratio of at least 3:1 against the background. A logo formally isn't text, but when it carries the company name, legibility obeys the same numbers. Any online contrast calculator checks a pair of colors: enter two HEX values and read the ratio.

A separate difficulty appears on a non-uniform background. A photo or gradient under the logo gives different contrast at different points, and a mark that reads in the left corner disappears in the right one. The standard solution here is a backing plate: a semi-transparent panel under the mark or a darkening layer over the whole image. Payment-system guidelines do exactly this, prescribing which version of the badge goes on which background.

## What to do when all you have is a PNG

Everything described so far works on one condition: a vector is at hand. But what usually arrives is a PNG, downloaded off some site long ago, and the question of how to recolor it comes back.

The direct answer: find the SVG first, and turn to the raster only after that search fails. An official vector almost always exists, and retrieving it is faster than wrestling with pixels. Check the brand's page in [our catalog](../../logos/), the press kit on the company site and its "Media" section; the full search order is covered in [how to download a logo from a website](../kak-skachat-logotip-s-sajta/).

When no vector exists anywhere, recoloring a PNG stays possible, though the difficulty depends on the mark. A single-color logo on a transparent background takes a minute: in any editor you overlay a layer of the needed color in a blend mode that preserves the alpha channel. A mark with gradients, shadows or several colors resists this, because every shade has to be selected separately and the anti-aliased edges along the contour still keep traces of the old color. In that situation it's cheaper to convert the logo to vector once and work with it afterwards; methods and pitfalls are gathered in [how to convert a logo to vector](../kak-perevesti-logotip-v-vektor/).

## Common mistakes

Almost every recoloring problem comes down to two causes: trusting the eye where a code is needed, and ignoring the context the logo lands in.

:::warning Changing color by eye instead of by HEX
Visual picking in the picker almost always lands off the brand color. If you need a specific brand shade, type the exact HEX. A couple percent of brightness shows instantly.
:::

:::warning Low contrast on a new background
When recoloring a logo white or light, check contrast with the background it lands on, especially if the mark ends up on a photo or gradient. Too light a mark on a light background becomes unreadable, and that counts as an accessibility bug.
:::

:::warning Recoloring elements you must not touch
On some logos, certain details (the ® next to the name, a protected shape element) can't be changed per the brand guideline, even when the editor technically allows it. Here technical freedom hits a legal boundary.
:::

The last mistake leads out of the interface and into the law. It deserves a separate word: the tool will allow everything, while the brand may forbid it.

## Technical freedom doesn't override rights

The editor will recolor any logo to any color, that's its job. But most brands publish **guidelines** that govern palette, minimum clear space, proportions and allowed backgrounds. For official materials (partner pages, press releases, presentations with someone else's logo) check that brand's rules; on the logo page in our catalog we link the guideline when it's published.

Typical restrictions repeat from brand to brand, and knowing them in advance helps. A monochrome version is usually permitted in two variants only: fully black and fully white. Recoloring into an arbitrary color is most often forbidden outright. Inversion (a white mark on the brand background) is allowed almost always, while the brand color on someone else's colored background is allowed almost never. That you can physically make a blue logo white doesn't yet mean the brand permits showing it that way. Where the line runs between "allowed" and "not" with someone else's mark is covered in detail in [«Can you use someone else's logo»](../mozhno-li-ispolzovat-chuzhoy-logotip/).

## What's next

A finished recolored logo doesn't have to be downloaded as a file. Copy the SVG code straight from the editor and [paste it into Figma](../kak-vstavit-logotip-v-figma/): it lands on the canvas fully vector and editable, as if you'd made it there. From there the mark travels into a website layout, a presentation or merch.

And if the recolored version is needed regularly, save it to the team's shared library; a personal folder won't help here. Otherwise in six months every designer will start recoloring the logo from scratch again and inevitably miss the shade.

## In short

Recoloring a logo stopped being a designer's job precisely because SVG stores color as a separate value; you can change it with a click in the browser. But the tool's ease ends where two boundaries begin: accuracy (you need a HEX and a contrast check) and rights (you need the brand's guideline). Keep both in mind and try the color editor on any logo in [our catalog](../../logos/).
