---
title: Микрокопия в интерфейсе: почему кнопка «Отправить» теряет заявки
title_en: Interface Microcopy: Why the "Submit" Button Loses You Leads
description: «Что‑то пошло не так», «Данные успешно отправлены», кнопка «Отправить» — тексты, которые описывают работу системы и оставляют человека без следующего шага. Разбираем, как переписать кнопки, ошибки и пустые состояния и как проверить микрокопию за час.
description_en: "Something went wrong," "Your data has been submitted," a button labelled "Submit" — copy that describes what the system did and leaves the person without a next step. How to rewrite buttons, errors, and empty states, and how to audit microcopy in an hour.
date: 2026-09-17
slug: mikrokopiya-v-interfejse
tags: UX, Текст, Интерфейс
tags_en: UX, Copy, Interface
---

«Что‑то пошло не так. Попробуйте позже» — вероятно, самая частая фраза в русскоязычных интерфейсах. Человек, который её увидел, знает ровно столько же, сколько знал секунду назад: что‑то не получилось. Он не понимает, потерялись ли введённые данные, спишутся ли деньги, поможет ли повторное нажатие. Дальше он либо жмёт кнопку ещё пять раз, либо уходит.

Обычно такую фразу считают мелочью оформления, и в этом корень проблемы. Текст здесь выполняет ту же работу, что кнопка или поле ввода: сообщает состояние системы и задаёт следующее действие. Сломанная надпись выводит из строя весь сценарий так же надёжно, как неработающая кнопка.

Отсюда единственное правило, из которого выводится всё остальное: интерфейсный текст говорит о результате человека. Как только он начинает описывать работу системы, сценарий рвётся.

## Почему кнопка «Отправить» проигрывает кнопке «Получить расчёт»

Слово «Отправить» описывает то, что произойдёт с данными внутри системы. Человеку в этот момент важно другое: что он получит и когда. Замена глагола меняет и смысл нажатия, и готовность его сделать.

| Кнопка | Что видит человек |
|---|---|
| Отправить | Данные уйдут куда‑то |
| Получить расчёт | Через минуту придёт стоимость |
| Подписаться | Появится ещё одна рассылка |
| Забрать чек‑лист | В почте будет файл |
| Сохранить | Кнопка что‑то сделает |
| Сохранить черновик | Текст останется, можно уйти |

Работает здесь короткий глагол в активном залоге, стоящий первым словом. «Получить расчёт» вместо «Осуществить расчёт стоимости», «Заказать» вместо «Оформление заказа». Отглагольное существительное на кнопке всегда длиннее глагола и всегда пассивнее — человек читает описание процесса вместо предложения нажать.

Второе, что стоит проверить у кнопки, — её пара. Если рядом стоит вторая кнопка, обе должны называть действия одного уровня. «Сохранить» и «Отмена» — разный уровень: первое называет действие, второе называет отказ от диалога. Понятнее пара «Сохранить» и «Не сохранять»: человек выбирает между двумя исходами и видит цену каждого.

## Что писать в сообщении об ошибке

Кнопка ведёт человека вперёд, ошибка возвращает назад, и здесь текст решает, вернётся ли человек вообще. Рабочее сообщение отвечает на три вопроса подряд: что случилось, почему, что делать дальше. «Что‑то пошло не так» не отвечает ни на один.

| Было | Стало |
|---|---|
| Ошибка 422 | Телефон введён в другом формате. Наберите 10 цифр без +7 |
| Что‑то пошло не так | Файл больше 10 МБ. Уменьшите его или пришлите ссылку |
| Неверные данные | Пароль не подошёл. Проверьте раскладку или [восстановите доступ] |
| Заявка не отправлена | Заявка не ушла, текст сохранён. Нажмите «Отправить» ещё раз |

Формулируйте через то, что человек может сделать. «Не забудьте приложить файл» звучит как упрёк, «Приложите файл до 10 МБ» звучит как инструкция, и второе выполняется быстрее. Отдельно проверьте, кого текст назначает виноватым: «Вы ввели неверный формат» и «Формат телефона отличается от нужного» описывают одно событие, но первое оставляет неприятный осадок ровно там, где человек и так раздражён.

Технические подробности стоит убирать из основного текста и оставлять в свёрнутом блоке для тех, кому они нужны. Код `422` полезен поддержке; человеку, который заполняет форму, он сообщает только то, что интерфейс с ним не разговаривает.

Успешный исход требует того же внимания, и его чаще всего забывают. «Данные успешно отправлены» закрывает окно и оставляет человека в неизвестности: он не знает, увидит ли кто‑то заявку, когда придёт ответ, нужно ли что‑то делать дальше. Рабочее подтверждение называет следующий шаг и срок: «Заявка принята. Менеджер позвонит с 10 до 19, обычно в течение часа. Копия ушла на почту».

Слово «успешно» в таких надписях лишнее всегда. Система сообщает о собственной радости там, где человеку нужен факт и время, и на длинных формах это особенно заметно: чем дольше человек заполнял, тем сильнее ждёт подтверждения, что труд не пропал.

## Пустые состояния и экраны ожидания

Ошибку человек видит редко, пустой экран — при первом же запуске, и этот экран у большинства продуктов остаётся без текста или несёт надпись «Ничего не найдено».

Пустое состояние работает, когда объясняет три вещи: почему здесь пусто, что тут появится и как это сюда добавить. «Пока нет заказов. После первой покупки здесь будет история с чеками и статусами доставки» вместо «Список пуст». Такой текст превращает тупик в первый шаг, а заодно объясняет ценность раздела тем, кто зашёл в него из любопытства.

Экран ожидания подчиняется тому же принципу. «Загрузка…» сообщает лишь то, что что‑то происходит. «Проверяем документы, обычно занимает до двух минут» снимает тревогу и удерживает человека на месте, потому что называет срок. Здесь текст работает вместе с [микровзаимодействиями](../mikrovzaimodejstviya/): анимация показывает, что система жива, а надпись объясняет, чего именно ждать.

## Почему привычные слова выигрывают у придуманных

Соблазн назвать раздел оригинально возникает у каждой команды, и почти всегда он вредит. «Корзина», «Тарифы», «Профиль», «Избранное» человек находит не думая, потому что видел их в сотне других интерфейсов. «Точка входа», «Пространство», «Хаб» требуют разбирательства, и цена этой оригинальности — потерянные секунды на каждом визите.

Есть и вторая, менее заметная сторона: одна сущность внутри продукта должна называться одним словом. Если на карточке товара кнопка «В избранное», в шапке пункт «Закладки», а в письме «Сохранённое», человек начинает подозревать, что это три разных списка. Проверяется это выпиской: соберите все названия из интерфейса в один документ и найдите синонимы. У [Госуслуг](../../logos/docs/gosuslugi/) или банковского приложения вроде [Сбера](../../logos/bank/sber/) такой словарь ведут отдельно именно поэтому — сервисов много, а термины должны совпадать во всех.

Единый словарь заодно снимает половину вопросов про [голос бренда](../golos-brenda/): тон держится на том, что продукт всюду называет вещи одинаково, и отдельные шутки в подсказках эту работу не заменяют.

## Двусмысленность, которая всплывает в поддержке

Самые дорогие ошибки микрокопии выглядят безобидно и обнаруживаются по обращениям в поддержку.

Классика жанра — диалог отмены подписки с кнопками «Отмена» и «Отменить». Половина людей нажимает не то, что собиралась, и часть из них уходит из продукта уже осознанно. Лечится переименованием в исходы: «Оставить подписку» и «Отменить подписку».

Такой же природы «Выйти» рядом с «Удалить аккаунт», подтверждение удаления с кнопкой «ОК» и переключатель «Не показывать уведомления», у которого непонятно, что означает включённое положение. Проверка на двусмысленность одна: текст должен пониматься одинаково десятью людьми из десяти. Если формулировку приходится объяснять коллеге за соседним столом, её увидят и пользователи.

Отдельная зона — даты, сроки и деньги. «Доставка 3‑5 дней» заставляет человека считать самому и оставляет вопрос, входят ли сюда выходные; «привезём во вторник, 19 сентября» отвечает сразу. Формулировка «до 19 сентября» двусмысленна по определению, потому что неясно, входит ли само 19‑е, и это регулярный повод для обращений в поддержку. Цену пишите в том виде, в каком её заплатят: «1 490 ₽ в месяц, списывается 5‑го числа» вместо «от 1 490 ₽». Каждый раз, когда интерфейс отдаёт исходные данные вместо готового ответа, он перекладывает на человека работу, которую машина делает быстрее и точнее.

:::warning Проверьте текст на экране без интерфейса
Скопируйте все надписи одного экрана в блокнот и прочитайте подряд, без кнопок и иконок. Так видно то, что теряется в макете: повторы («Заказ» в заголовке, на кнопке и в подсказке), формулировки, которые понятны только рядом с картинкой, и подписи, которые невозможно озвучить. Последнее особенно важно для тех, кто пользуется экранным диктором, — тот же принцип [доступности](../dostupnyj-logotip/), что и в графике.
:::

## Как проверить микрокопию за час

Заметная часть проблем снимается порядком работы. Текст, который дописывают в готовый макет, вынужден помещаться в оставленное место, и оттуда берутся «ОК» вместо названия действия и обрезанные подсказки. Если черновики надписей появляются вместе с первыми экранами, макет подстраивается под текст, а не наоборот. Аудит ниже нужен для продукта, который уже собран.

Аудит начинается с кнопок. Выпишите все кнопки продукта в столбец и прочитайте список. Каждая строка должна называть результат человека и начинаться с глагола. Строки вида «Отправить», «Продолжить», «ОК» отправляются на переписывание первыми, потому что встречаются чаще всего.

Вторым заходом соберите тексты ошибок. У каждой проверьте три ответа: что случилось, почему, что сделать. Ошибка без третьего ответа бесполезна независимо от того, насколько точно описаны первые два.

Третьим — пустые состояния и экраны ожидания. Их проще всего найти по коду, потому что в макетах они обычно нарисованы наполовину, а в готовом продукте попадаются реже других экранов.

Четвёртым проходом вычистите обороты, по которым видно генератор: «не просто форма, а удобный инструмент», «важно понимать». В интерфейсе они особенно заметны, потому что места мало и каждое лишнее слово вытесняет полезное. Как их находить, [разобрано отдельно](../priznaki-nejrosetevogo-teksta/).

## Коротко

Микрокопия ломается в одном месте: когда текст описывает работу системы вместо результата человека. Из этого выводится всё остальное.

Кнопка называет результат и начинается с короткого глагола: «Получить расчёт» вместо «Отправить». Ошибка отвечает на три вопроса: что случилось, почему, что делать. Пустое состояние объясняет, что здесь появится и как это добавить. Разделы называются привычными словами, а одна сущность носит одно имя во всём продукте. Парные кнопки называют два исхода, чтобы человеку было из чего выбирать.

Проверяется всё это списком: выпишите кнопки, ошибки и пустые экраны в столбец и прочитайте отдельно от макета. Тот же приём работает и с текстом о самом продукте — например, когда вы [описываете свою работу в портфолио](../keys-v-portfolio-dizajnera/).

---EN---

"Something went wrong. Please try again later" is probably the most common sentence in interfaces. A person who sees it knows exactly what they knew a second earlier: something failed. They can't tell whether their input survived, whether the payment went through, whether pressing again would help. From there they either hit the button five more times or leave.

Copy like that usually gets treated as decoration, and that is the root of the problem. Text here does the same job as a button or an input field: it reports the state of the system and sets the next action. A broken label disables a flow just as reliably as a broken button.

Hence the single rule everything else follows from: interface text talks about the person's outcome. The moment it starts describing the system's work, the flow tears.

## Why "Submit" loses to "Get a quote"

The word "Submit" describes what will happen to the data inside the system. What matters to the person is different: what they get and when. Changing the verb changes both the meaning of the press and the willingness to make it.

| Button | What the person sees |
|---|---|
| Submit | The data goes somewhere |
| Get a quote | A price arrives in a minute |
| Subscribe | One more newsletter appears |
| Grab the checklist | A file lands in my inbox |
| Save | The button does something |
| Save draft | The text stays, I can leave |

What works is a short verb in the active voice, standing first. "Get a quote" instead of "Perform a cost calculation," "Order" instead of "Order placement." A verbal noun on a button is always longer than a verb and always more passive — the person reads a description of a process where an invitation to press belongs.

The second thing to check on a button is its partner. When a second button stands beside it, both should name actions of the same level. "Save" and "Cancel" sit on different levels: the first names an action, the second names a refusal to continue the dialogue. The clearer pair is "Save" and "Don't save": the person chooses between two outcomes and sees the price of each.

## What to write in an error message

A button moves the person forward, an error sends them back, and the copy decides whether they come back at all. A working message answers three questions in order: what happened, why, what to do next. "Something went wrong" answers none of them.

| Before | After |
|---|---|
| Error 422 | The phone number is in a different format. Enter 10 digits without the country code |
| Something went wrong | The file is over 10 MB. Compress it or send a link |
| Invalid data | That password didn't match. Check your keyboard layout or [reset access] |
| Request not sent | The request didn't go through; your text is saved. Press "Send" again |

Phrase it through what the person can do. "Don't forget to attach the file" reads as a reproach, "Attach a file up to 10 MB" reads as an instruction, and the second gets done faster. Check separately whom the text blames: "You entered the wrong format" and "The phone format differs from the expected one" describe the same event, but the first leaves a sting exactly where the person is already annoyed.

Technical detail belongs out of the main text and inside a collapsed block for those who need it. The code `422` helps support; to a person filling in a form it only signals that the interface isn't talking to them.

The successful outcome deserves the same attention and is forgotten most often. "Your data has been submitted successfully" closes the window and leaves the person in the dark: they don't know whether anyone will see the request, when an answer arrives, whether anything else is required of them. A working confirmation names the next step and the timing: "Request received. A manager calls between 10 and 19, usually within the hour. A copy is in your inbox."

The word "successfully" is always surplus in such labels. The system reports its own delight where the person needs a fact and a time, and on long forms that stings: the longer someone spent filling it in, the more they need proof the effort survived.

## Empty states and waiting screens

An error shows up rarely; an empty screen shows up on the very first launch, and in most products that screen carries no text at all or reads "Nothing found."

An empty state works when it explains three things: why it is empty here, what will appear, and how to put it there. "No orders yet. After your first purchase this is where receipts and delivery statuses live" instead of "The list is empty." Copy like that turns a dead end into a first step, and it explains the value of the section to anyone who wandered in out of curiosity.

A waiting screen follows the same principle. "Loading…" reports only that something is happening. "Checking your documents, usually under two minutes" removes the anxiety and keeps the person in place, because it names a duration. Here the text works together with [microinteractions](../mikrovzaimodejstviya/): the animation shows the system is alive, and the label explains what exactly is being waited for.

## Why familiar words beat invented ones

Every team feels the pull to name a section originally, and it almost always costs them. "Cart," "Pricing," "Profile," "Saved" get found without thinking, because the person has seen them in a hundred other interfaces. "Entry point," "Space," and "Hub" demand decoding, and the price of that originality is seconds lost on every visit.

There is a second, less visible side: one entity inside a product should carry one name. If the product card says "Add to favourites," the header says "Bookmarks," and the email says "Saved items," the person starts suspecting three different lists. Check it by extraction: collect every label in the interface into one document and hunt for synonyms. Large services like [Gosuslugi](../../logos/docs/gosuslugi/) or a banking app such as [Sber](../../logos/bank/sber/) maintain that dictionary as a separate document for exactly this reason — there are many services, and the terms have to match across all of them.

A shared dictionary also settles half the questions about [brand voice](../golos-brenda/): the tone rests on a product naming things the same way everywhere, and occasional jokes in the tooltips don't replace that work.

## The ambiguity that surfaces in support tickets

The most expensive microcopy mistakes look harmless and get discovered through support tickets.

The classic is a cancel-subscription dialogue with buttons labelled "Cancel" and "Cancel subscription." Half the people press the one they didn't mean, and some of them then leave the product deliberately. The cure is renaming both into outcomes: "Keep subscription" and "Cancel subscription."

The same family holds "Log out" sitting next to "Delete account," a deletion confirmation with an "OK" button, and a toggle labelled "Don't show notifications" where nobody can tell what the "on" position means. There is one ambiguity test: the text must read the same way to ten people out of ten. If you have to explain a phrase to the colleague at the next desk, users will meet the same problem.

Dates, deadlines, and money form their own zone. "Delivery in 3–5 days" makes the person do the arithmetic and leaves them wondering whether weekends count; "arriving Tuesday, 19 September" answers immediately. The phrasing "by 19 September" is ambiguous by definition, because nobody can tell whether the 19th itself is included, and that is a steady source of support tickets. Write the price in the form it will be paid: "1,490 a month, charged on the 5th" instead of "from 1,490." Every time an interface hands over raw data in place of a finished answer, it moves work onto the person that the machine does faster and more accurately.

:::warning Read a screen's copy without the interface
Copy every label from one screen into a plain document and read them in order, with no buttons or icons. That exposes what a mockup hides: repetitions ("Order" in the heading, on the button, and in the hint), phrases that only make sense next to a picture, and labels that can't be read aloud. The last one matters most for people using a screen reader — the same [accessibility](../dostupnyj-logotip/) principle that applies to graphics.
:::

## How to audit microcopy in an hour

A good share of the problems disappears with the order of work. Copy written into a finished mockup has to fit the space left for it, and that is where "OK" instead of an action name and truncated hints come from. When draft labels appear alongside the first screens, the layout adjusts to the text instead of the other way round. The audit below is for a product that is already built.

The audit starts with buttons. Write every button in the product into a column and read the list. Each line should name the person's outcome and open with a verb. Lines like "Submit," "Continue," and "OK" go to rewriting first, because they occur most often.

On the second pass collect the error messages. Check each for the three answers: what happened, why, what to do. An error missing the third answer is useless however precisely the first two are described.

Third come empty states and waiting screens. They are easiest to find in the code, because mockups usually leave them half-drawn and a finished product shows them less often than other screens.

On the fourth pass clear out the phrasings that expose a generator: "not just a form but a convenient tool," "it is important to understand." They stand out especially in an interface, where space is short and every surplus word displaces a useful one. How to find them is [covered separately](../priznaki-nejrosetevogo-teksta/).

## The short version

Microcopy breaks in one place: when the text describes the system's work in place of the person's outcome. Everything else follows from that.

A button names an outcome and opens with a short verb: "Get a quote" instead of "Submit." An error answers three questions: what happened, why, what to do. An empty state explains what will appear here and how to add it. Sections carry familiar names, and one entity keeps one name across the product. Paired buttons name two outcomes, so the person has something to choose between.

All of it gets checked with a list: write the buttons, errors, and empty screens into a column and read them away from the mockup. The same move works on the text about your product itself — for instance, when you [describe your work in a portfolio](../keys-v-portfolio-dizajnera/).
