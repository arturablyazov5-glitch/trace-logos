---
title: Иконка и логотип — в чём разница и почему их путают
title_en: Icon vs Logo — the Difference and Why They're Confused
description: Чем иконка отличается от логотипа: роли, размеры, правила проектирования. Когда логотип нельзя использовать как иконку, и как бренды решают эту задачу.
description_en: How an icon differs from a logo: roles, sizes, design rules. When a logo can't serve as an icon, and how brands solve the problem.
date: 2026-07-28
slug: ikonka-i-logotip-raznica
tags: Основы, Дизайн
tags_en: Basics, Design
---

«Пришлите вашу иконку» — и вам присылают логотип. «Сделайте логотип» — а нужен на самом деле значок для приложения. Иконка и логотип выглядят похоже, часто совпадают физически — и всё же это разные инструменты с разными законами. Путаница между ними — причина половины «размытых» аватарок и нечитаемых значков в доке. Разбираем разницу, пограничные случаи и правила перевода одного в другое.

:::note Коротко
**Логотип** — знак идентификации бренда: отвечает на вопрос «кто это?». **Иконка** — элемент интерфейса: отвечает на вопросы «что это?» и «куда нажать?». Логотип уникален по определению; иконки в массе своей стандартизированы (лупа = поиск, шестерёнка = настройки). Пересечение — **иконка приложения**: это иконка по формату, но логотип по функции, и проектируется она по [своим правилам](../ikonka-prilozheniya/).
:::

## Две профессии: идентификация и навигация

**Логотип** служит бренду: его задача — отличить компанию от всех остальных и накапливать узнаваемость — какие вообще бывают логотипы, мы разбирали отдельно. Уникальность — его суть: два одинаковых логотипа — это юридический конфликт.

**Иконка** служит пользователю: её задача — мгновенно объяснить функцию или объект. И здесь уникальность вредна: лупа обязана означать «поиск» везде, корзина — «купить», дискета — «сохранить» (даже для поколения, не видевшего дискет). Иконки — общий язык интерфейсов, и «креативная» иконка настроек — это ошибка проектирования, а не смелость.

Отсюда зеркальные критерии качества: хороший логотип **не похож** ни на что; хорошая интерфейсная иконка **похожа** на общепринятый образ своей функции.

## Таблица различий

| | Логотип | Иконка |
| --- | --- | --- |
| Вопрос | «кто это?» | «что это? куда нажать?» |
| Уникальность | обязательна | вредна (кроме иконки приложения) |
| Живёт | везде: от визитки до вывески | в интерфейсе |
| Размеры | любой, от фавиконки до билборда | фиксированная сетка: 16‑48 px |
| Штук у бренда | один (с версиями) | десятки–сотни, единым набором |
| Кто делает | бренд‑дизайнер | UI/иконочный дизайнер |

## Пограничная зона: иконка приложения и фавиконка

Главный источник путаницы — **иконка приложения**: по формату это иконка (квадратик в сетке), по функции — логотип (идентифицирует бренд среди других приложений). Такой же гибрид — [фавиконка](../kak-sdelat-favicon/). Для этих носителей у брендов есть три стратегии:

1. **Компактный знак.** Полный логотип не влезает — в квадрат идёт его знаковая часть: «N» Netflix, самолётик [Telegram](../../logos/social/telegram/), [монограмма](../chto-takoe-monogramma/) для текстовых логотипов.
2. **Специальная версия.** Знак адаптируют под сетку иконок: упрощают детали, утолщают линии, подбирают фон — у Instagram иконка и логотип‑подпись — разные объекты одной системы.
3. **Иконка ≠ логотип вообще.** Игры ставят в иконку персонажа, а не знак — как это устроено у мобильных игр, мы разбирали отдельно; сервисы с сезонными иконками (календарь с живой датой) тоже разводят слои.

Общий принцип: **логотип не «уменьшают» в иконку — иконку проектируют** из логотипа. Механическое уменьшение полного знака до 48 пикселей — самый частый источник «мыла» и нечитаемости; [про остальные причины](../pochemu-logotip-razmytyj/), из‑за которых логотипы мылятся, мы писали отдельно.

## Иконки внутри продукта: система, а не коллекция

Если вы делаете продукт, интерфейсные иконки — отдельная дисциплина со своими правилами, роднящими её с [фирменным стилем](../chto-takoe-firmennyj-stil/):

- **Единая сетка и размер** (обычно 24×24 с выравниванием по пиксельной сетке) — иконки разного «веса» в одном меню выглядят свалкой.
- **Единая толщина линий и стиль**: контурные или залитые, скругления одинаковые. Смешение стилей заметно даже неспециалисту — как разнобой шрифтов.
- **Стандартные метафоры**: не изобретайте новую иконку для «поиска» — изобретайте только там, где у функции нет устоявшегося образа.
- **Связь с брендом — дозированно**: фирменным может быть радиус скруглений или характер углов, но не «уникальность» каждой пиктограммы.

Готовые наборы (Material Symbols, SF Symbols, Feather) закрывают 90% потребностей продукта; рисовать с нуля имеет смысл только фирменные дополнения к ним.

:::tip Быстрая диагностика
Простой способ понять, что перед вами: уберите объект из контекста. Знак без интерфейса продолжает что‑то значить («это Сбер») — логотип. Пиктограмма без интерфейса теряет смысл (лупа сама по себе — просто лупа) — иконка. Иконка приложения проходит первый тест — потому она и требует бренд‑дизайна, а не только UI‑подхода.
:::

## Частые ошибки

1. **Полный логотип в аватарке/иконке.** Текстовая часть превращается в шум — нужен компактный знак, о правильном оформлении аватарок мы писали отдельно.
2. **«Креативные» иконки функций.** Пользователь не должен разгадывать ребусы: конвенции сильнее оригинальности.
3. **Иконки из разных наборов вперемешку.** Дешевле взять один набор целиком, чем собирать «лучшее» из пяти.
4. **Иконка приложения, забытая в [брендбуке](../chto-takoe-brendbuk/).** Главный носитель цифрового бренда должен быть спроектирован и зафиксирован наравне с логотипом.

Как выглядит решение этой задачи у сотен брендов, удобно смотреть в [каталоге](../../logos/): почти у каждого логотипа там лежит и компактная «иконочная» версия. Пошаговые смежные инструкции: [иконка приложения](../ikonka-prilozheniya/), [фавиконка](../kak-sdelat-favicon/), [размеры логотипа для площадок](../razmery-logotipa-dlya-sajta-i-socsetej/).

---EN---

"Send us your icon" — and they send a logo. "Make us a logo" — when what's needed is an app glyph. Icons and logos look alike, often physically coincide — and yet they are different tools with different laws. Confusing them causes half of all blurry avatars and unreadable dock glyphs. Here's the difference, the border cases, and the rules for translating one into the other.

:::note TL;DR
A **logo** is a brand identification mark: it answers "who is this?". An **icon** is an interface element: it answers "what is this?" and "where do I tap?". A logo is unique by definition; icons are mostly standardized (magnifier = search, gear = settings). The overlap is the **app icon**: icon by format, logo by function, designed by [its own rules](../ikonka-prilozheniya/).
:::

## Two professions: identification and navigation

A **logo** serves the brand: its job is to distinguish the company from everyone and accumulate recognition — we cover the types of logos separately. Uniqueness is its essence: two identical logos are a legal conflict.

An **icon** serves the user: its job is to explain a function or object instantly. Here uniqueness is harmful: a magnifier must mean "search" everywhere, a cart "buy", a floppy "save" (even to a generation that never saw floppies). Icons are the shared language of interfaces, and a "creative" settings icon is a design bug, not boldness.

Hence mirrored quality criteria: a good logo **resembles nothing**; a good interface icon **resembles** the accepted image of its function.

## The difference table

| | Logo | Icon |
| --- | --- | --- |
| The question | "who is this?" | "what is this? where do I tap?" |
| Uniqueness | mandatory | harmful (except app icons) |
| Lives | everywhere: card to billboard | in the interface |
| Sizes | any, favicon to billboard | a fixed grid: 16–48 px |
| Count per brand | one (with versions) | dozens–hundreds, as one set |
| Made by | a brand designer | a UI/icon designer |

## The border zone: app icons and favicons

The main source of confusion is the **app icon**: icon by format (a square in a grid), logo by function (it identifies the brand among other apps). The [favicon](../kak-sdelat-favicon/) is the same hybrid. Brands use three strategies for these media:

1. **The compact mark.** The full logo doesn't fit — the symbol part goes into the square: Netflix's "N", [Telegram](../../logos/social/telegram/)'s plane, a [monogram](../chto-takoe-monogramma/) for wordmark brands.
2. **A dedicated version.** The mark is adapted to the icon grid: details simplified, strokes thickened, a background chosen — Instagram's icon and script wordmark are different objects of one system.
3. **Icon ≠ logo entirely.** Games put a character in the icon, not the mark — we cover how that works for mobile games separately; services with live icons (a calendar showing today's date) also split the layers.

The general principle: **you don't "shrink" a logo into an icon — you design the icon from the logo.** Mechanically scaling a full mark to 48 pixels is the top source of mush and illegibility; we cover [the other reasons logos blur](../pochemu-logotip-razmytyj/) separately.

## In-product icons: a system, not a collection

If you build a product, interface icons are their own discipline, kin to a [visual identity](../chto-takoe-firmennyj-stil/):

- **One grid and size** (usually 24×24, pixel-grid aligned) — icons of different "weight" in one menu read as a junk drawer.
- **One stroke weight and style**: outlined or filled, same rounding. Style mixing is visible even to non-specialists — like mismatched fonts.
- **Standard metaphors**: don't invent a new "search" icon — invent only where the function has no established image.
- **Brand connection in doses**: the corner radius or stroke character can be branded, not the "uniqueness" of every pictogram.

Ready sets (Material Symbols, SF Symbols, Feather) cover 90% of a product's needs; drawing from scratch makes sense only for branded additions to them.

:::tip Quick diagnostics
An easy test of what you're looking at: remove the object from its context. A mark that still means something without an interface ("that's Sber") is a logo. A pictogram that loses meaning without an interface (a magnifier alone is just a magnifier) is an icon. The app icon passes the first test — which is why it demands brand design, not just a UI approach.
:::

## Common mistakes

1. **The full logo in an avatar/icon.** The text part turns to noise — use the compact mark; we cover proper avatar setup separately.
2. **"Creative" function icons.** Users shouldn't solve puzzles: conventions beat originality.
3. **Icons from mixed sets.** Taking one set whole is cheaper than curating "the best" from five.
4. **The app icon missing from the [brand book](../chto-takoe-brendbuk/).** The digital brand's main medium must be designed and codified alongside the logo.

How hundreds of brands solve this is on display in the [catalog](../../logos/): nearly every logo there comes with its compact "icon" version. Adjacent step-by-step guides: [app icons](../ikonka-prilozheniya/), [favicons](../kak-sdelat-favicon/), [logo sizes for platforms](../razmery-logotipa-dlya-sajta-i-socsetej/).
