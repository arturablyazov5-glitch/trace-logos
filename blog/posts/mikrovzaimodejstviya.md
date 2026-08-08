---
title: Микровзаимодействия: сколько миллисекунд между нажатием и доверием
title_en: "Micro-Interactions: The Milliseconds Between a Tap and Trust"
description: Кнопка «Оплатить» не ответила за полсекунды, человек нажал второй раз, и списание ушло дважды. Разбираем, на какой вопрос отвечает движение в интерфейсе, сколько оно должно длиться в миллисекундах, как его характер попадает в бренд и где начинается перебор.
description_en: The pay button gave no answer for half a second, the person pressed again, and the charge went through twice. What motion in an interface actually answers, how many milliseconds it should take, how its character becomes part of a brand, and where overdoing it starts.
date: 2026-09-12
slug: mikrovzaimodejstviya
tags: UX, Анимация, Тренды 2026
tags_en: UX, Animation, 2026 Trends
---

Человек нажал «Оплатить». Полсекунды на экране ничего не изменилось: кнопка выглядит так же, спиннера нет, надпись прежняя. Он нажал ещё раз. Списание ушло дважды, дальше начинается переписка с поддержкой и возврат.

Между первым нажатием и вторым не хватило одного: подтверждения, что система приняла действие. Подтверждение это стоит около сотни миллисекунд движения — кнопка проседает под пальцем, надпись сменяется на «Проводим оплату», край наливается прогрессом.

Такие короткие реакции интерфейса называют микровзаимодействиями, и работают они ровно с одним вопросом человека: что сейчас происходит с моим действием. Всё остальное — характер движения, упругость, длительность, попадание в бренд — надстраивается над этим ответом и без него не держится.

## Четыре ответа, которые даёт движение

Микровзаимодействие отвечает за одно из четырёх состояний. Разложить их полезно потому, что отсутствие анимации обычно означает пропущенное состояние. Сэкономленным временем разработки это только выглядит.

| Состояние | Что должен понять человек | Типичная реакция |
|---|---|---|
| Принято | нажатие засчитано | кнопка проседает, поле подсвечивается |
| Идёт | система работает, ждать имеет смысл | прогресс, пульсация, смена надписи |
| Готово | результат наступил | галочка дорисовывается, блок встаёт на место |
| Не вышло | действие сорвалось, данные целы | поле дрожит и подсвечивается, фокус возвращается |

Пропуск состояния «идёт» даёт сцену из начала статьи: человек нажимает повторно, потому что интерфейс промолчал. Пропуск «не вышло» даёт форму, где после отправки просто ничего не случилось, и человек ищет ошибку глазами по всему экрану.

Движение здесь работает вместе с текстом и делит с ним обязанности. Анимация сообщает, что система жива, надпись объясняет, чего именно ждать. «Загрузка…» рядом с крутящимся кружком повторяет то, что уже показал кружок; «Проверяем документы, обычно до двух минут» добавляет срок, которого движение дать не может. Как писать такие надписи, [разобрано отдельно](../mikrokopiya-v-interfejse/).

## Сколько это должно длиться

Длительность решает больше, чем форма движения, и здесь есть проверяемые цифры вместо вкусовщины.

Основание задал Якоб Нильсен ещё в «Usability Engineering» 1993 года, и с тех пор пороги не поменялись, потому что упираются в человеческое восприятие. Техника за эти годы сменилась целиком, числа остались прежними. До 0,1 секунды человек считает, что управляет объектом напрямую. До 1 секунды ход мысли остаётся непрерывным, хотя задержка уже заметна. После 10 секунд внимание уходит на другие дела, и продукт обязан назвать срок окончания.

Из этих порогов выводятся рабочие длительности интерфейсных анимаций. Nielsen Norman Group называет общий диапазон 100‑500 мс. Простая обратная связь вроде переключателя или чекбокса укладывается примерно в 100 мс. Смена крупного блока или появление модального окна занимает 200‑300 мс. 400 мс остаются для больших перемещений через весь экран, а после 500 мс движение начинает мешать. Material Design приводит близкие числа: мелкие переходы 150‑200 мс, крупные на мобильном экране 300‑400 мс.

:::tip Появление длится дольше исчезновения
Объект, который выезжает на экран, требует чуть больше времени, чем тот, который уходит: человеку нужно понять, что появилось. Рабочая пропорция — 300 мс на появление и 200‑250 мс на исчезновение того же элемента. Одинаковая длительность в обе стороны выглядит вязкой именно на закрытии.
:::

Отдельная величина — длительность при повторе. Анимация, которую человек видит один раз при установке приложения, может позволить себе 400 мс. Анимация кнопки в списке из тридцати строк проигрывается тридцать раз подряд, и там каждые лишние 100 мс превращаются в три секунды ожидания за сеанс. Считайте частоту повторов.

### Отклик рисуется до ответа сервера

Двойное списание из начала статьи возникает по одной технической причине: интерфейс ждал ответа сервера, чтобы показать хоть что‑нибудь. Ответ шёл 600 мс, и всё это время экран молчал.

Порог в 100 мс сеть не гарантирует никогда, поэтому реакцию на нажатие рисуют сразу и локально, до любого запроса. Кнопка проседает и блокируется в том же кадре, следом включается состояние «идёт», и только потом приходит настоящий результат. Повторное нажатие при этом становится физически невозможным, а вместе с ним исчезает и двойное списание.

Тот же приём работает на лайках, подписках и добавлении в корзину: счётчик меняется мгновенно, запрос уходит следом, при ошибке значение возвращается назад вместе с объяснением. Человек получает ответ за один кадр, сеть работает в своём темпе.

## Почему характер движения попадает в бренд

Длительность отвечает за работоспособность, характер движения — за узнавание. Одна и та же кнопка, сдвинутая на одно и то же расстояние за одинаковые 250 мс, читается по‑разному в зависимости от кривой ускорения. Резкий старт с плавным торможением ощущается собранным и деловым. Перелёт с возвратом за границу конечного положения даёт упругость и игру.

Эта разница попадает в те же ощущения, что [цвет](../psihologiya-cveta-v-logotipe/) и [форма](../psihologiya-formy-v-logotipe/). Банковское приложение, где элементы пружинят и подпрыгивают, читается несерьёзно при безупречной вёрстке. Обучающий сервис с сухими линейными переходами теряет половину своего тона. Поэтому характер движения описывают в тех же правилах, где живут палитра и [шрифт](../shrift-dlya-logotipa/), и относят к [голосу бренда](../golos-brenda/), выраженному без слов.

Дальше движение доходит до самого знака. [Анимированный логотип](../animirovannyj-logotip/) на экране запуска, иконка, которая реагирует на нажатие, знак, меняющий состояние вместе с интерфейсом, — это уже территория [динамического логотипа](../dinamicheskij-logotip/), где движение входит в идентичность наравне со статичной отрисовкой.

Требование к этому набору одно: движение знака, [иконок](../sistema-ikonok/) и интерфейса должно строиться на общих кривых и общих длительностях. Мягкий округлый знак с упругой анимацией рядом с резкими рублеными переходами интерфейса даёт то же расхождение, что чужой шрифт внутри логотипа. Проверяется это как обычная [согласованность](../soglasovannost-brenda/), только предметом проверки становятся тайминги.

## Когда анимация начинает мешать

Перебор с движением ломает продукт по четырём направлениям, и каждое проверяется отдельно.

**Скорость.** Движение, которое красиво на первом просмотре, на сотом стоит человеку времени. Особенно это заметно на переходах между экранами: 400 мс на открытие раздела, который человек открывает двадцать раз за сеанс, забирают восемь секунд.

**Плотность.** Когда на экране двигается всё сразу, ни одно движение не сообщает состояния: они конкурируют за внимание, и человек перестаёт различать, что из этого относится к его действию. Анимация работает как выделение, а выделенным не может быть весь экран.

**Вес.** Тяжёлые анимации нагружают процессор и разряжают батарею, а на слабых устройствах ещё и дают рывки, из‑за которых движение перестаёт читаться. Это прямая часть темы [экологичного веб‑дизайна](../ekologichnyj-veb-dizajn/): вычисления стоят энергии.

**Доступность.** Часть людей реагирует на движение головокружением и тошнотой, поэтому в системах есть настройка «уменьшить движение», а в CSS — соответствующее медиавыражение `prefers-reduced-motion`. Уважать её обязательно, и вместе с этим смысл нельзя завязывать на одно только движение: если ошибка показана только дрожанием поля, при отключённой анимации она исчезает целиком. Тот же принцип, что и в [доступности графики](../dostupnyj-logotip/).

Все четыре направления сходятся в одной проверке. Если человек заметил анимацию как анимацию и высказался о ней вслух, она забрала внимание, которое предназначалось содержимому экрана. Реплика «какая красивая анимация» звучит как похвала и означает перебор.

Работающее движение остаётся незамеченным по той же причине, по которой незамеченной остаётся хорошая типографика: человек получает ответ на свой вопрос и идёт дальше, а средство доставки ответа его не занимает. Проверять это удобно на человеке со стороны: посадите его выполнить задачу и спросите потом, что двигалось на экране. Точный ответ означает, что движение вышло на первый план.

## Как проверить свои анимации за полчаса

Проверка идёт по четырём заходам, и все они делаются на собранном продукте без макетов.

Первый заход — по состояниям. Пройдите главный сценарий и отметьте каждое место, где вы нажали и не получили ответа за 100 мс. Каждая такая точка означает пропущенное состояние «принято» или «идёт».

Второй — по секундомеру. Замерьте длительности через инструменты разработчика и сравните с диапазоном 100‑500 мс. Значения выше 500 мс выписывайте отдельно: у каждого должно быть объяснение вроде большого перемещения по крупному экрану.

Третий — по частоте. Для каждой анимации ответьте, сколько раз человек увидит её за сеанс. Всё, что повторяется чаще десяти раз, сокращайте до нижней границы диапазона.

Четвёртый — с включённой настройкой «уменьшить движение». Пройдите тот же сценарий и убедитесь, что все четыре состояния остаются различимыми без анимации: подтверждение, ход работы, результат, ошибка. Информация, которая пропала вместе с движением, была передана только движением, и это ошибка проектирования.

## Коротко

Микровзаимодействие отвечает на вопрос «что сейчас с моим действием» и закрывает одно из четырёх состояний: принято, идёт, готово, не вышло. Пропущенное состояние даёт повторные нажатия, двойные списания и поиск ошибки глазами по экрану.

Рабочая длительность лежит в диапазоне 100‑500 мс: около 100 мс на простую обратную связь, 200‑300 мс на смену крупного блока, 400 мс на большие перемещения. Появление длится дольше исчезновения. Частые анимации считайте по числу повторов за сеанс.

Характер движения — кривая ускорения и амплитуда — работает так же, как [цвет](../psihologiya-cveta-v-logotipe/) и [форма](../psihologiya-formy-v-logotipe/), поэтому его описывают в правилах бренда и распространяют на [анимированный](../animirovannyj-logotip/) и [динамический логотип](../dinamicheskij-logotip/), [иконки](../sistema-ikonok/) и интерфейс из общего набора кривых. Проверяют движение по скорости, плотности, весу и настройке «уменьшить движение», при которой все четыре состояния обязаны остаться понятными.

Скачать логотипы в SVG для анимации и интерфейса можно в [каталоге Trace Logo's](../../logos/).

---EN---

Someone presses "Pay." For half a second the screen shows nothing new: the button looks the same, there is no spinner, the label hasn't changed. They press again. The charge goes through twice, and from there it's a support thread and a refund.

One thing was missing between the first press and the second: confirmation that the system took the action. That confirmation costs about a hundred milliseconds of motion — the button sinks under the finger, the label switches to "Processing payment," the edge fills with progress.

Short interface reactions like this are called micro-interactions, and they work on exactly one question a person has: what is happening to my action right now. Everything else — the character of the motion, the springiness, the duration, the fit with the brand — is built on top of that answer and collapses without it.

## The four answers motion gives

A micro-interaction covers one of four states. Laying them out is useful because a missing animation usually means a skipped state. Saved development time is only what it looks like.

| State | What the person must understand | Typical reaction |
|---|---|---|
| Accepted | the press registered | the button sinks, the field highlights |
| In progress | the system is working, waiting makes sense | progress, pulse, changed label |
| Done | the result has arrived | a checkmark draws itself, a block settles into place |
| Failed | the action broke, the data survived | the field shakes and highlights, focus returns |

Skipping "in progress" produces the scene at the top of this article: the person presses again because the interface stayed silent. Skipping "failed" produces a form where nothing at all happens after submission, and the person hunts for the error across the whole screen.

Motion works alongside copy here and splits the duties with it. The animation reports that the system is alive; the label explains what exactly is being waited for. "Loading…" next to a spinning circle repeats what the circle already showed; "Checking your documents, usually under two minutes" adds a duration that motion can never convey. How to write those labels is [covered separately](../mikrokopiya-v-interfejse/).

## How long it should last

Duration decides more than the shape of the motion, and here there are verifiable numbers instead of taste.

The foundation was laid by Jakob Nielsen in Usability Engineering back in 1993, and the thresholds haven't moved since, because they rest on human perception. Hardware turned over completely across those years while the numbers stayed put. Up to 0.1 seconds a person believes they are manipulating the object directly. Up to 1 second the flow of thought stays unbroken, though the delay is noticeable. Past 10 seconds attention moves to other tasks, and the product owes the person an expected finishing time.

Working animation durations follow from those thresholds. Nielsen Norman Group names a general range of 100–500 ms. Simple feedback such as a toggle or a checkbox fits into roughly 100 ms. A substantial screen change or a modal appearing takes 200–300 ms. 400 ms is reserved for large movements across a big screen, and past 500 ms the motion starts getting in the way. Material Design lands on close figures: 150–200 ms for small transitions, 300–400 ms for larger ones on a mobile screen.

:::tip Entering takes longer than leaving
An object arriving on screen needs slightly more time than one departing: the person has to work out what appeared. A working proportion is 300 ms in and 200–250 ms out for the same element. Equal durations both ways feel gluey precisely on the closing move.
:::

Duration on repeat is a separate quantity. An animation someone sees once, on first launch, can afford 400 ms. A button animation inside a list of thirty rows plays thirty times in a row, and every extra 100 ms there turns into three seconds of waiting per session. Count the repeats.

### The response is drawn before the server answers

The double charge at the top of this article has one technical cause: the interface waited for the server before showing anything at all. The answer took 600 ms, and the screen stayed silent throughout.

The network never guarantees the 100 ms threshold, so the reaction to a press gets drawn immediately and locally, ahead of any request. The button sinks and locks in the same frame, "in progress" takes over next, and only then does the real result arrive. A second press becomes physically impossible along the way, and the double charge goes with it.

The same move works on likes, follows, and add-to-cart: the counter changes instantly, the request follows, and on failure the value rolls back together with an explanation. The person gets an answer within one frame while the network works at its own pace.

## Why the character of motion becomes part of a brand

Duration decides whether the motion works; character decides whether it is recognised. The same button, moved the same distance over the same 250 ms, reads differently depending on the easing curve. A sharp start with a soft landing feels composed and businesslike. An overshoot past the final position and back gives springiness and play.

That difference lands in the same territory as [colour](../psihologiya-cveta-v-logotipe/) and [shape](../psihologiya-formy-v-logotipe/). A banking app where elements bounce and overshoot reads as unserious with flawless layout. A learning service with dry linear transitions loses half its tone. So the character of motion is written into the same rules that hold the palette and the [typeface](../shrift-dlya-logotipa/), and it belongs to [brand voice](../golos-brenda/) expressed without words.

From there motion reaches the mark itself. An [animated logo](../animirovannyj-logotip/) on a launch screen, an icon that reacts to a tap, a mark that changes state along with the interface — this is already [dynamic logo](../dinamicheskij-logotip/) territory, where motion joins the identity on par with the static drawing.

The requirement for that whole set is single: the motion of the mark, the [icons](../sistema-ikonok/), and the interface should be built from shared curves and shared durations. A soft rounded mark with springy animation next to sharp, chopped interface transitions produces the same mismatch as a foreign typeface inside a logo. It gets checked like ordinary [consistency](../soglasovannost-brenda/), except the subject of the check is timings.

## When animation starts getting in the way

Overdoing motion breaks a product along four lines, and each is checked separately.

**Speed.** Motion that looks lovely on the first viewing costs the person time on the hundredth. It shows up hardest on screen transitions: 400 ms to open a section someone opens twenty times a session takes eight seconds away.

**Density.** When everything on screen moves at once, no single movement reports a state: they compete for attention, and the person stops telling which of them belongs to their own action. Animation works as emphasis, and the whole screen cannot be emphasised.

**Weight.** Heavy animations load the processor and drain the battery, and on weak devices they also stutter, which stops the motion from reading at all. This sits directly inside [sustainable web design](../ekologichnyj-veb-dizajn/): computation costs energy.

**Accessibility.** Some people respond to motion with dizziness and nausea, which is why operating systems carry a "reduce motion" setting and CSS carries the matching `prefers-reduced-motion` media query. Respecting it is mandatory, and alongside that, meaning must never rest on motion alone: if an error is shown only by a shaking field, it disappears entirely once animation is off. Same principle as [accessibility in graphics](../dostupnyj-logotip/).

All four lines meet in one check. If a person noticed the animation as animation and remarked on it out loud, it took attention that belonged to the content of the screen. The line "what a beautiful animation" sounds like praise and signals an overdose.

Motion that works goes unnoticed for the same reason good typography goes unnoticed: the person gets the answer to their question and moves on, and the delivery vehicle never occupies them. The convenient way to test it is on an outsider: sit them down with a task and ask afterwards what moved on the screen. A precise answer means the motion came to the foreground.

## How to audit your animations in half an hour

The audit runs in four passes, all of them on the built product with the mockups closed.

The first pass goes by state. Walk the main flow and mark every place where you pressed and got no answer within 100 ms. Each such point means a skipped "accepted" or "in progress."

The second goes by stopwatch. Measure durations in the developer tools and compare them against the 100–500 ms range. Write down everything above 500 ms separately: each of those owes an explanation, such as a large movement across a big screen.

The third goes by frequency. For every animation, answer how many times a person sees it in a session. Anything repeating more than ten times gets cut to the bottom of the range.

The fourth runs with "reduce motion" switched on. Walk the same flow and confirm that all four states stay distinguishable without animation: confirmation, progress, result, error. Information that vanished together with the motion was carried by motion alone, and that is a design error.

## The short version

A micro-interaction answers the question "what is happening to my action" and covers one of four states: accepted, in progress, done, failed. A skipped state produces repeat presses, double charges, and error-hunting across the screen.

The working duration sits in the 100–500 ms range: about 100 ms for simple feedback, 200–300 ms for a substantial screen change, 400 ms for large movements. Entering takes longer than leaving. Judge frequent animations by repeats per session.

The character of motion — the easing curve and the amplitude — works the way [colour](../psihologiya-cveta-v-logotipe/) and [shape](../psihologiya-formy-v-logotipe/) work, so it belongs in the brand rules and extends to the [animated](../animirovannyj-logotip/) and [dynamic logo](../dinamicheskij-logotip/), the [icons](../sistema-ikonok/), and the interface out of one shared set of curves. Check motion against speed, density, weight, and the "reduce motion" setting, under which all four states must stay understandable.

You can download logos in SVG for animation and interfaces in the [Trace Logo's catalog](../../logos/).
