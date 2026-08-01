---
title: Иконка приложения — размеры для iOS и Android, правила и ошибки
title_en: App Icons — iOS and Android Sizes, Rules and Mistakes
description: Как сделать иконку приложения из логотипа: размеры 1024×1024 для App Store и 512×512 для Google Play, адаптивные иконки Android, скругления и типичные провалы
description_en: Making an app icon from a logo — 1024×1024 for the App Store, 512×512 for Google Play, Android adaptive icons, corner radii and common failures.
date: 2026-06-11
slug: ikonka-prilozheniya
tags: Иконки, Приложения, Дизайн
tags_en: Icons, Apps, Design
---

Иконка приложения — самый маленький носитель бренда и одновременно самый нагруженный. По ней находят приложение на экране среди полусотни соседей. По ней же принимают решение об установке в сторе, где рядом стоят конкуренты. И всё это — на площади в пару квадратных сантиметров. Из этого единственного факта — крошечный размер при огромной нагрузке — выводится буквально каждое правило ниже, включая то, что требования [Apple](../../logos/store/apple/) и [Google](../../logos/search/google/) местами прямо противоположны.

:::note Коротко
Готовите один мастер‑файл **1024×1024 без скруглённых углов и прозрачности** — из него собирается всё. iOS: систему скругляет углы сама, прозрачность запрещена. Android: адаптивная иконка из двух слоёв (фон + передний план), форму маски задаёт устройство. И главный тест, которому подчинено всё: знак должен занимать центр и выживать в 48 пикселях.
:::

## Один мастер‑файл, из которого собирается всё

Начнём с хорошей новости, потому что она снимает главный страх. Вручную нарезать десятки размеров под каждый экран не нужно: [Xcode](../../logos/dev/xcode/), Android Studio и кроссплатформенные сборщики (Expo, Flutter) генерируют весь набор из одного исходника. Ваша задача сводится к одному — правильному мастеру.

| Платформа | Что готовить | Размер |
| --- | --- | --- |
| App Store (iOS) | мастер‑иконка | 1024×1024 PNG, без прозрачности |
| iPhone/iPad | генерируются из мастера | 60‑180 px наборы |
| Google Play | иконка стора | 512×512 PNG |
| Android (устройство) | адаптивная: фон + foreground | 108×108 dp (безопасная зона 66 dp) |

Раз всё растёт из одного файла, важно понять, каким его хочет видеть каждая платформа, — а хотят они разного, и не по прихоти.

## Правила iOS: система всё делает за вас

iOS берёт единый вид иконок на экране на себя и снимает эту заботу с разработчика. Отсюда все запреты, и каждый логичен, если помнить, что финальную огранку накладывает сама ОС:

- **Не скругляйте углы сами.** Система накладывает фирменную маску‑суперэллипс автоматически. Пришлёте уже скруглённое — получите двойное скругление с артефактами по углам.
- **Без прозрачности.** Фон обязан быть залит: прозрачные области App Store либо отклонит, либо зальёт чёрным.
- **Без текста** — кроме случая, когда текст и есть знак. Мелкие подписи в иконке нечитаемы и выглядят любительски.
- **Тёмная и тонированная версии (iOS 18+).** Системе нужны варианты для тёмной темы, так что заранее продумайте, как знак живёт на тёмном фоне.

Android идёт от прямо противоположной идеи — и потому требует другого мастера.

## Правила Android: иконка из двух слоёв

Если iOS сама решает, как обрезать иконку, то Android с 8‑й версии идёт дальше: он **разбирает иконку на два слоя** — фоновый (background) и передний (foreground) — и накладывает маску сам: круг, скруглённый квадрат, «каплю», плюс анимирует слои с параллаксом. Разработчик не знает заранее, какую форму выберет устройство пользователя, и из этого незнания следуют три правила:

- **Знак — только в безопасной зоне.** Из холста 108 dp гарантированно видны центральные 66 dp. Всё важное держите внутри этого круга, иначе маска отрежет край.
- **Фон — отдельным слоем.** Однотонный цвет или простой градиент; узор на фоне при параллаксе выглядит беспокойно и дёргано.
- **Не полагайтесь на форму.** Раз маска непредсказуема, знак обязан работать в любой из них — и в круге, и в квадрате.

Обе платформы, при всей разнице, сходятся в одном требовании к самому знаку — он должен быть предельно простым. Отсюда и подход к тому, как сделать иконку из логотипа.

## Как сделать иконку из логотипа

Процесс родственен фавикону (разбирали его в [отдельной статье](../kak-sdelat-favicon/)), но требования жёстче: иконка крупнее и конкурирует за внимание активнее. Пять шагов, и каждый — прямое следствие теста «узнаётся в 48 пикселях»:

1. **Берите знак вместо полного логотипа.** Горизонтальный логотип с текстом в квадрате превращается в нечитаемую полоску. В иконку идёт символ: буква, знак, упрощённая форма.
2. **Масштаб крупнее, чем кажется.** Знак должен занимать 60‑75% холста. Робкая маленькая иконка в центре пустого поля просто теряется на экране.
3. **Минимум деталей.** Проверка простая: уменьшите до 48×48 — всё ещё узнаётся? Значит, градиенты простые, линии толстые, элементов один‑два.
4. **Контрастный фон.** Иконка живёт на неизвестных обоях, поэтому свой фон обязателен. Белый знак на фирменном цвете — классика, которая работает.
5. **Проверьте рядом с конкурентами.** Сделайте скриншот домашнего экрана, вставьте свою иконку в сетку и посмотрите честно: находится ли она глазами за секунду?

Когда какой‑то из шагов пропущен, результат предсказуем — и предсказуемо одинаков.

:::warning Типичные провалы
- **Логотип с текстом целиком** — нечитаемая полоска.
- **Скриншот сайта или маскот с деталями** — каша в малом размере.
- **Тонкие линии** — исчезают на плотных экранах при уменьшении.
- **Белый фон без рамки** — иконка сливается со светлой темой лончера.
- **Разные знаки в иконке и в приложении** — пользователь не связывает их между собой.
:::

## Иконка, фавикон и аватарка — одна система

Заметьте, что тест «выживает в маленьком размере» справедлив не только для иконки. У бренда три «малых носителя», и делать их вразнобой — значит трижды решать одну задачу. Логичнее один раз: тот же знак, тот же цвет фона, та же логика упрощения. Иконка приложения — самая детальная из трёх, фавикон — самый аскетичный, аватарка — посередине (и обрезается в круг, о чём писали в [статье про размеры](../razmery-logotipa-dlya-sajta-i-socsetej/)). Если знак изначально спроектирован по принципу «выживает в 16 пикселях», все три носителя выходят из одного исходника за полчаса.

## Иконка как витрина: почему она двигает установки

До сих пор мы говорили об иконке как о навигации. Но у неё есть вторая работа, и она объясняет, почему ради иконки стоит стараться. В выдаче стора пользователь видит иконку, название и рейтинг — и по этой троице решает, тапать ли. То есть иконка — ещё и витрина, а витрину оптимизируют. Отсюда практики ASO (оптимизации в сторах):

- **A/B‑тесты иконок.** Обе платформы дают штатные инструменты (эксперименты в консолях). Команды регулярно получают ±10‑30% к конверсии в установку простой сменой иконки — это самый дешёвый прирост в мобильном маркетинге.
- **Что тестировать.** Цвет фона, крупность знака, наличие рамки. Мелкие детали не тестируют — их всё равно не видно в выдаче.
- **Сезонность.** Крупные приложения меняют иконку под события (Новый год, распродажи): событийная иконка выделяется в ряду обычных. Но важно возвращаться к базовой версии — постоянная карнавальность размывает узнаваемость.
- **Иконка = обещание.** Стор наказывает за мисматч: иконка «казино» у судоку приводит не тех пользователей, они тут же удаляют приложение, метрики удержания падают, выдача проседает.

Из этой же логики «иконка — лицо, за которое отвечаешь» вырастают и формальные причины отказов на ревью.

## Ошибки при сдаче в сторы и чем они кончаются

| Ошибка | Последствие |
| --- | --- |
| Альфа‑канал в иконке App Store | автоматическое отклонение сборки |
| Скруглённые углы «своими руками» | двойное скругление, артефакты по углам |
| Мелкий текст в иконке | ревью может пропустить, пользователи — нет |
| Логотип конкурента или чужой бренд | отклонение + риск жалобы правообладателя |
| Разные иконки в сторе и в приложении | путаница, жалобы «скачал не то» |
| Фотография в качестве иконки | почти всегда каша в малых размерах |

Отдельная тонкость Android вытекает из непредсказуемости маски: у производителей она разная — круг у Pixel, скруглённый квадрат у Samsung, «капля» у части китайских оболочек. Поэтому адаптивную иконку тестируют минимум в двух масках, эмулятор Android Studio это умеет.

## Технический чек‑лист перед сдачей

1. Мастер 1024×1024, PNG, без альфа‑канала, углы прямые.
2. Android: слои background + foreground, знак в безопасной зоне 66 dp.
3. Тест в 48 px и на светлых/тёмных обоях.
4. Тёмная версия для iOS 18+.
5. Исходник — в векторе: следующий редизайн скажет спасибо. Почему вектор обязателен как основа, разбирали в [статье о векторе и растре](../vektor-i-rastr-raznica/).
6. Проверка в двух масках Android (круг и скруглённый квадрат).
7. Иконка согласована с фавиконом и аватаркой — один знак, один цвет, одна система.

## Итог

Всё сводится к одной цепочке: один векторный знак → мастер 1024×1024 с запасом по простоте → автогенерация наборов. iOS скругляет сама и запрещает прозрачность, Android хочет два слоя и безопасную зону — но обе платформы обслуживают один и тот же тест: узнаётся ли иконка в 48 пикселях на пёстрых обоях среди пятидесяти соседей. Пройдёт этот тест — пройдёт и ревью, и витрину стора.

Посмотреть, как сильные бренды решают свои знаки в малых размерах, можно в нашем [каталоге логотипов](../../logos/) — у многих компаний там лежат и полные логотипы, и отдельные иконки‑знаки в векторе.

---EN---

An app icon is the smallest brand carrier and, at the same time, the most loaded. People find your app on the screen by it, among fifty neighbors. People decide to install by it in the store, where competitors sit right beside it. And all of this on a couple of square centimeters. From that single fact — tiny size under huge load — follows literally every rule below, including the fact that [Apple](../../logos/store/apple/)'s and [Google](../../logos/search/google/)'s requirements are in places directly opposite.

:::note TL;DR
You prepare one master file **1024×1024 with no rounded corners and no transparency** — everything is assembled from it. iOS: the system rounds the corners itself, transparency is forbidden. Android: an adaptive icon of two layers (background + foreground), with the mask shape set by the device. And the main test everything serves: the mark must fill the center and survive at 48 pixels.
:::

## One master file that everything is built from

Let's start with the good news, because it removes the main fear. You don't need to hand-cut dozens of sizes for each screen: [Xcode](../../logos/dev/xcode/), Android Studio and cross-platform builders (Expo, Flutter) generate the whole set from one source. Your job comes down to one thing — the right master.

| Platform | What to prepare | Size |
| --- | --- | --- |
| App Store (iOS) | master icon | 1024×1024 PNG, no transparency |
| iPhone/iPad | generated from the master | 60–180 px sets |
| Google Play | store icon | 512×512 PNG |
| Android (device) | adaptive: background + foreground | 108×108 dp (safe zone 66 dp) |

Since everything grows from one file, you need to understand how each platform wants to see it — and they want different things for solid reasons.

## iOS rules: the system does it for you

iOS takes the uniform look of on-screen icons on itself and lifts that job off the developer. Hence all the bans, each logical if you remember the OS applies the final trim itself:

- **Don't round the corners yourself.** The system applies its signature superellipse mask automatically. Send it pre-rounded and you get double rounding with corner artifacts.
- **No transparency.** The background must be filled: the App Store will either reject transparent areas or fill them black.
- **No text** — except when the text is the mark. Small captions in an icon are unreadable and look amateur.
- **Dark and tinted versions (iOS 18+).** The system needs dark-mode variants, so think in advance about how the mark lives on a dark background.

Android starts from the exact opposite idea — and therefore demands a different master.

## Android rules: an icon of two layers

If iOS decides for itself how to crop the icon, Android since version 8 goes further: it **splits the icon into two layers** — background and foreground — and applies the mask itself: a circle, a rounded square, a "teardrop," plus it animates the layers with parallax. The developer doesn't know in advance which shape a user's device will pick, and from that ignorance follow three rules:

- **The mark goes in the safe zone only.** Of a 108 dp canvas, the central 66 dp is guaranteed visible. Keep everything important inside that circle, or the mask clips the edge.
- **The background is a separate layer.** A solid color or simple gradient; a patterned background looks restless and jittery under parallax.
- **Don't rely on shape.** Since the mask is unpredictable, the mark must work in any of them — circle and square alike.

For all their difference, both platforms converge on one requirement for the mark itself — it must be extremely simple. Hence the approach to making an icon from a logo.

## How to make an icon from a logo

The process is a relative of the favicon (covered in [a separate article](../kak-sdelat-favicon/)), but the requirements are stricter: the icon is larger and competes for attention harder. Five steps, each a direct consequence of the "recognizable at 48 pixels" test:

1. **Take the mark instead of the full logo.** A horizontal logo with text turns into an unreadable strip inside a square. What goes into the icon is the symbol: a letter, a mark, a simplified shape.
2. **Scale it bigger than seems right.** The mark should fill 60–75% of the canvas. A timid little icon in the middle of an empty field simply gets lost on screen.
3. **Minimum detail.** The check is simple: shrink to 48×48 — still recognizable? Then the gradients are simple, the lines thick, the elements one or two.
4. **Contrasting background.** The icon lives on unknown wallpaper, so its own background is mandatory. A white mark on the brand color is a classic that works.
5. **Check it next to competitors.** Screenshot a home screen, drop your icon into the grid, and look honestly: does the eye find it in a second?

When one of the steps is skipped, the result is predictable — and predictably the same.

:::warning Typical failures
- **The whole logo with text** — an unreadable strip.
- **A website screenshot or a detailed mascot** — mush at small size.
- **Thin lines** — vanish on dense screens when shrunk.
- **White background with no border** — the icon merges with the launcher's light theme.
- **Different marks in the icon and in the app** — the user doesn't connect them.
:::

## Icon, favicon and avatar — one system

Notice the "survives at small size" test holds for more than the icon alone. A brand has three "small carriers," and making them separately means solving one task three times. It's smarter to do it once: the same mark, the same background color, the same simplification logic. The app icon is the most detailed of the three, the favicon the most ascetic, the avatar in between (and cropped to a circle, as covered in the [article on sizes](../razmery-logotipa-dlya-sajta-i-socsetej/)). If the mark is designed from the start on the "survives at 16 pixels" principle, all three carriers come out of one source in half an hour.

## The icon as a storefront: why it moves installs

So far we've discussed the icon as navigation. But it has a second job, and it explains why the icon is worth the effort. In store results the user sees the icon, the name and the rating — and by this trio decides whether to tap. So the icon is also a storefront, and storefronts get optimized. Hence ASO (store optimization) practices:

- **A/B testing icons.** Both platforms offer built-in tools (console experiments). Teams regularly get ±10–30% to install conversion from a simple icon swap — the cheapest gain in mobile marketing.
- **What to test.** Background color, mark size, presence of a border. Fine details aren't tested — they're invisible in results anyway.
- **Seasonality.** Big apps swap the icon for events (New Year, sales): an event icon stands out in a row of ordinary ones. But it's important to return to the base version — perpetual carnival blurs recognition.
- **Icon = promise.** The store punishes mismatch: a "casino" icon on a Sudoku app brings the wrong users, they uninstall at once, retention drops, ranking sags.

From this same "the icon is a face you answer for" logic grow the formal reasons for review rejections.

## Store-submission mistakes and how they end

| Mistake | Consequence |
| --- | --- |
| Alpha channel in an App Store icon | automatic build rejection |
| Hand-rounded corners | double rounding, corner artifacts |
| Small text in the icon | review may miss it, users won't |
| A competitor's or someone else's logo | rejection + rights-holder complaint risk |
| Different icons in store and in app | confusion, "downloaded the wrong thing" complaints |
| A photo as the icon | almost always mush at small sizes |

A separate Android subtlety follows from the mask's unpredictability: manufacturers differ — a circle on Pixel, a rounded square on Samsung, a "teardrop" on some Chinese shells. So the adaptive icon is tested in at least two masks; the Android Studio emulator can do this.

## Technical checklist before submitting

1. Master 1024×1024, PNG, no alpha channel, square corners.
2. Android: background + foreground layers, mark in the 66 dp safe zone.
3. Test at 48 px and on light/dark wallpapers.
4. Dark version for iOS 18+.
5. The source is vector: the next redesign will thank you. Why vector is a mandatory base is covered in the [article on vector and raster](../vektor-i-rastr-raznica/).
6. Check in two Android masks (circle and rounded square).
7. Icon aligned with the favicon and avatar — one mark, one color, one system.

## The bottom line

It all reduces to one chain: one vector mark → a 1024×1024 master with room to spare on simplicity → auto-generated sets. iOS rounds itself and forbids transparency, Android wants two layers and a safe zone — but both platforms serve one and the same test: is the icon recognizable at 48 pixels on busy wallpaper among fifty neighbors? Pass that test and you pass review and the store storefront alike.

To see how strong brands solve their marks at small sizes, browse our [logo catalog](../../logos/) — many companies there have both full logos and separate icon-marks in vector.
