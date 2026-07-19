---
title: Иконка приложения — размеры для iOS и Android, правила и ошибки
title_en: App Icons — iOS and Android Sizes, Rules and Mistakes
description: Как сделать иконку приложения из логотипа: размеры 1024×1024 для App Store и 512×512 для Google Play, адаптивные иконки Android, скругления и типичные провалы.
description_en: Making an app icon from a logo — 1024×1024 for the App Store, 512×512 for Google Play, Android adaptive icons, corner radii and common failures.
date: 2026-06-11
slug: ikonka-prilozheniya
tags: Иконки, Приложения, Дизайн
tags_en: Icons, Apps, Design
---

Иконка приложения — самый маленький и самый нагруженный носитель бренда: по ней находят приложение на экране среди полусотни соседей, по ней же принимают решение об установке в сторе. При этом требования Apple и Google к иконкам различаются вплоть до противоположного: у одних скругление делает система, у других иконка вообще состоит из двух слоёв. Разберём, что готовить, в каких размерах и на какие грабли не наступать.

:::note Коротко
Готовите один мастер-файл **1024×1024 без скруглённых углов и прозрачности** — из него собирается всё. iOS: система сама скругляет углы, прозрачность запрещена. Android: адаптивная иконка из двух слоёв (фон + передний план), форму маски задаёт устройство. Знак должен занимать центр и выживать в 48 пикселях.
:::

## Главные размеры

| Платформа | Что готовить | Размер |
| --- | --- | --- |
| App Store (iOS) | мастер-иконка | 1024×1024 PNG, без прозрачности |
| iPhone/iPad | генерируются из мастера | 60–180 px наборы |
| Google Play | иконка стора | 512×512 PNG |
| Android (устройство) | адаптивная: фон + foreground | 108×108 dp (безопасная зона 66 dp) |

Хорошая новость: вручную нарезать десятки размеров не нужно — Xcode, Android Studio и сборщики (Expo, Flutter) генерируют наборы из одного файла 1024×1024. Ваша задача — правильный мастер.

## Правила iOS

- **Не скругляйте углы сами.** Система накладывает фирменную маску-суперэллипс автоматически. Пришлёте уже скруглённое — получите двойное скругление с артефактами по углам.
- **Без прозрачности.** Фон обязан быть залит: прозрачные области App Store отклонит или зальёт чёрным.
- **Без текста, кроме случая, когда текст — сам знак.** Мелкие подписи в иконке нечитаемы и выглядят любительски.
- Иконка может быть тёмной и тонированной версии (iOS 18+): системе нужны варианты для тёмной темы — продумайте, как знак живёт на тёмном фоне.

## Правила Android: адаптивные иконки

С Android 8 иконка — это **два слоя**: фоновый (background) и передний (foreground). Устройство само накладывает маску — круг, скруглённый квадрат, «капля» — и анимирует слои с параллаксом.

Практические следствия:

- **Знак — только в безопасной зоне.** Из холста 108 dp гарантированно видны центральные 66 dp: всё важное — внутри этого круга, иначе маска отрежет.
- **Фон — отдельным слоем.** Однотонный цвет или простой градиент; узоры на фоне при параллаксе выглядят беспокойно.
- **Не полагайтесь на форму.** Вы не знаете, будет иконка кругом или квадратом у конкретного пользователя — знак должен работать в любой маске.

## Как сделать иконку из логотипа

Процесс тот же, что с фавиконом (мы разбирали его в [отдельной статье](../kak-sdelat-favicon/)), но требования жёстче — иконка крупнее и конкурирует за внимание:

1. **Берите знак, не полный логотип.** Горизонтальный логотип с текстом в квадрате превращается в полоску. В иконку идёт символ: буква, знак, упрощённая форма.
2. **Масштаб крупнее, чем кажется нужным.** Знак должен занимать 60–75% холста. Робкая маленькая иконка в центре пустого поля теряется на экране.
3. **Минимум деталей.** Проверка: уменьшите до 48×48 — всё ещё узнаётся? Градиенты — простые, линии — толстые, элементов — один-два.
4. **Контрастный фон.** Иконка живёт на неизвестных обоях — собственный фон обязателен. Белый знак на фирменном цвете — классика, которая работает.
5. **Проверьте рядом с конкурентами.** Сделайте скриншот экрана телефона, вставьте свою иконку в сетку и посмотрите честно: находится ли она глазами за секунду?

:::warning Типичные провалы
- **Логотип с текстом целиком** — нечитаемая полоска.
- **Скриншот сайта/маскот с деталями** — каша в малом размере.
- **Тонкие линии** — исчезают на плотных экранах при уменьшении.
- **Белый фон без рамки** — иконка сливается со светлой темой лончера.
- **Разные знаки в иконке и в приложении** — пользователь не связывает их между собой.
:::

## Иконка, фавикон и аватарка: одна система

У бренда три «малых носителя», и делать их стоит согласованно: один и тот же знак, один цвет фона, одна логика упрощения. Иконка приложения — самая детальная из трёх, фавикон — самый аскетичный, аватарка — посередине (и обрезается в круг, о чём мы писали в [статье про размеры](../razmery-logotipa-dlya-sajta-i-socsetej/)). Если знак спроектирован по принципу «выживает в 16 пикселях» — все три носителя получаются из одного исходника за полчаса.

## Иконка и сторы: как она влияет на установки

Иконка — не только навигация, но и витрина: в выдаче стора пользователь видит иконку, название и рейтинг — и решает, тапать ли. Отсюда практики ASO (app store optimization):

- **A/B-тесты иконок** — обе платформы дают штатные инструменты (эксперименты в консолях). Команды регулярно получают ±10–30% к конверсии в установку простой сменой иконки — это самый дешёвый прирост в мобильном маркетинге.
- **Что тестировать:** цвет фона, крупность знака, наличие рамки. Мелкие детали не тестируют — их не видно в выдаче.
- **Сезонность.** Крупные приложения меняют иконку под события (Новый год, распродажи) — событийная иконка выделяется в ряду обычных. Важно возвращаться к базовой версии: постоянная карнавальность размывает узнаваемость.
- **Иконка ≠ обещание.** Стор наказывает за мисматч: иконка «казино» у судоку приводит пользователей, которые тут же удаляют приложение, — метрики удержания падают, выдача проседает.

## Частые ошибки при сдаче в сторы: чем они кончаются

Реальные причины отклонений и проблем на ревью:

| Ошибка | Последствие |
| --- | --- |
| Альфа-канал в иконке App Store | автоматическое отклонение сборки |
| Скруглённые углы «своими руками» | двойное скругление, артефакты по углам |
| Мелкий текст в иконке | ревью может пропустить, пользователи — нет |
| Логотип конкурента/чужой бренд в иконке | отклонение + риск жалобы правообладателя |
| Разные иконки в сторе и в приложении | путаница пользователей, жалобы «скачал не то» |
| Фотография в качестве иконки | почти всегда каша в малых размерах |

Отдельная тонкость Android: маска у производителей разная (круг у Pixel, скруглённый квадрат у Samsung, «капля» у части китайских оболочек) — тестируйте адаптивную иконку минимум в двух масках, эмулятор Android Studio это умеет.

## Технический чек-лист перед сдачей

1. Мастер 1024×1024, PNG, без альфа-канала, углы прямые.
2. Android: слои background + foreground, знак в безопасной зоне 66 dp.
3. Тест в 48 px и на светлых/тёмных обоях.
4. Тёмная версия для iOS 18+.
5. Исходник — в векторе: следующий редизайн скажет вам спасибо. Почему вектор — обязательная основа, мы разбирали в [статье о векторе и растре](../vektor-i-rastr-raznica/).
6. Проверка в двух масках Android (круг и скруглённый квадрат).
7. Иконка согласована с фавиконом и аватарками — один знак, один цвет, одна система.

## Коротко

Один векторный знак → мастер 1024×1024 с запасом по простоте → автогенерация наборов. iOS скругляет сама и запрещает прозрачность; Android хочет два слоя и безопасную зону. И главный тест один: узнаётся ли иконка в 48 пикселях на пёстрых обоях среди пятидесяти соседей.

Посмотреть, как сильные бренды решают свои знаки в малых размерах, можно в нашем [каталоге логотипов](../../logos/) — у многих компаний там лежат и полные логотипы, и отдельные иконки-знаки в векторе.

---EN---

The app icon is the smallest and most loaded brand carrier there is: it's how users find your app among fifty neighbors, and it's part of the install decision in the store. Meanwhile Apple's and Google's requirements differ to the point of contradiction: one platform rounds the corners for you, the other wants the icon as two separate layers. Let's sort out what to prepare, at what sizes, and which rakes to avoid.

:::note TL;DR
Prepare one master file — **1024×1024, square corners, no transparency** — everything is generated from it. iOS: the system rounds the corners itself; transparency is forbidden. Android: an adaptive icon of two layers (background + foreground), with the mask shape decided by the device. The mark must sit centered and survive at 48 pixels.
:::

## The key sizes

| Platform | What to prepare | Size |
| --- | --- | --- |
| App Store (iOS) | master icon | 1024×1024 PNG, no alpha |
| iPhone/iPad | generated from master | 60–180 px sets |
| Google Play | store icon | 512×512 PNG |
| Android (device) | adaptive: background + foreground | 108×108 dp (66 dp safe zone) |

Good news: nobody slices dozens of sizes by hand anymore — Xcode, Android Studio and toolchains (Expo, Flutter) generate the sets from one 1024×1024 file. Your job is the right master.

## iOS rules

- **Don't round the corners yourself.** The system applies its squircle mask automatically. Submit pre-rounded art and you get double-rounded corners with artifacts.
- **No transparency.** The background must be filled: the App Store rejects or black-fills alpha.
- **No text, unless the text is the mark itself.** Small captions are illegible and amateurish.
- Since iOS 18, dark and tinted variants exist — think through how the mark lives on a dark background.

## Android rules: adaptive icons

Since Android 8 an icon is **two layers**: background and foreground. The device applies its own mask — circle, rounded square, squircle — and animates the layers with parallax.

Practical consequences:

- **The mark stays in the safe zone.** Of the 108 dp canvas, only the central 66 dp is guaranteed visible: everything important goes inside that circle.
- **The background is its own layer.** A solid color or simple gradient; patterned backgrounds look jittery under parallax.
- **Don't rely on the shape.** You don't know whether a given user sees a circle or a square — the mark must work under any mask.

## Making an icon from a logo

The process mirrors the favicon workflow (covered in [its own article](../kak-sdelat-favicon/)), with stricter demands — the icon is bigger and fights for attention:

1. **Use the mark, not the full logo.** A horizontal logo with text becomes a stripe in a square. The icon gets a symbol: a letter, a mark, a simplified shape.
2. **Scale bigger than feels right.** The mark should fill 60–75% of the canvas. A timid little symbol in an empty field disappears on screen.
3. **Minimal detail.** The test: shrink to 48×48 — still recognizable? Simple gradients, thick strokes, one or two elements.
4. **A contrasting background.** The icon lives on unknown wallpapers — its own background is mandatory. A white mark on the brand color is the classic that works.
5. **Check against competitors.** Screenshot a phone screen, paste your icon into the grid and judge honestly: do your eyes find it in a second?

:::warning Typical failures
- **The full logo with text** — an unreadable stripe.
- **A detailed mascot or screenshot** — mush at small sizes.
- **Thin lines** — vanish when scaled down.
- **A white background with no frame** — merges with light launcher themes.
- **Different marks in the icon and inside the app** — users don't connect them.
:::

## Icon, favicon and avatar: one system

A brand has three "small carriers", and they should be designed together: the same mark, the same background color, the same simplification logic. The app icon is the most detailed of the three, the favicon the most ascetic, the avatar in between (and cropped to a circle — see [the sizes article](../razmery-logotipa-dlya-sajta-i-socsetej/)). If the mark is designed to survive at 16 pixels, all three carriers come out of one source in half an hour.

## The icon and the stores: its effect on installs

The icon isn't just navigation — it's the storefront: in store search results the user sees icon, name and rating, and decides whether to tap. Hence the ASO practices:

- **Icon A/B tests** — both platforms offer native experiment tools. Teams routinely gain ±10–30% install conversion from an icon change alone — the cheapest lift in mobile marketing.
- **What to test:** background color, mark size, presence of a frame. Small details aren't tested — they're invisible in results.
- **Seasonality.** Big apps re-skin icons for events (holidays, sales) — an event icon stands out in a row of ordinary ones. The key is returning to base: permanent carnival dilutes recognition.
- **The icon is a promise.** Stores punish mismatch: a "casino" icon on a sudoku app brings users who instantly uninstall — retention metrics sink, rankings follow.

## Submission mistakes and what they cost

Real rejection and review causes:

| Mistake | Consequence |
| --- | --- |
| Alpha channel in the App Store icon | automatic build rejection |
| Hand-rounded corners | double rounding, corner artifacts |
| Small text in the icon | review may pass it; users won't |
| A competitor's brand in the icon | rejection + rights-holder complaint risk |
| Different icons in store and app | user confusion, "downloaded the wrong thing" |
| A photo as an icon | almost always mush at small sizes |

An Android subtlety: masks differ by manufacturer (circle on Pixel, rounded square on Samsung, squircle variants elsewhere) — test the adaptive icon in at least two masks; the Android Studio emulator supports it.

## The pre-submission checklist

1. Master 1024×1024, PNG, no alpha, square corners.
2. Android: background + foreground layers, mark within the 66 dp safe zone.
3. Test at 48 px on light and dark wallpapers.
4. A dark variant for iOS 18+.
5. Source in vector — your next redesign will thank you. Why vector is the mandatory base: [vector vs raster](../vektor-i-rastr-raznica/).
6. A check in two Android masks (circle and rounded square).
7. The icon aligned with the favicon and avatars — one mark, one color, one system.

## In short

One vector mark → a 1024×1024 master with simplicity to spare → auto-generated sets. iOS rounds corners itself and bans transparency; Android wants two layers and a safe zone. And the single main test: is the icon recognizable at 48 pixels on busy wallpaper among fifty neighbors?

See how strong brands solve their marks at small sizes in our [logo catalog](../../logos/) — many companies there have both full logos and standalone icon marks in vector.
