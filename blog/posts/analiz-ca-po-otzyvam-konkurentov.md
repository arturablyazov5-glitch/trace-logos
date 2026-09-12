---
title: Как спарсить отзывы конкурентов за 2 минуты и собрать по ним анализ ЦА
title_en: How to Scrape Competitor Reviews in 2 Minutes and Build Audience Research From Them
description: Как выгрузить 800 отзывов с Яндекс Карт, Авито и Telegram одним файлом за две минуты, прогнать их через готовый промт и достать заголовки, блок FAQ и отстройку от конкурентов
description_en: How to export 800 reviews from Yandex Maps, Avito and Telegram into a single file in two minutes, run them through a ready-made prompt and get headlines, an FAQ block and positioning.
date: 2026-08-14
slug: analiz-ca-po-otzyvam-konkurentov
tags: Маркетинг, Инструменты, Инструкции
tags_en: Marketing, Tools, How-to
---

Клиент говорит: «наше преимущество — качество и индивидуальный подход». На сайте это превращается в заголовок, который стоит у половины рынка, и лендинг собирает заявки хуже, чем должен. Подводит здесь источник: преимущества записаны со слов клиента, а платит за продукт другой человек.

Формулировки, за которые покупают, лежат в открытом доступе — в отзывах у конкурентов. Там люди своими словами пишут, чего боялись перед заказом, что сравнивали, из‑за чего ушли от прежнего подрядчика и что в итоге оказалось важным. Заголовок, собранный из такой фразы, попадает в читателя, потому что читатель её сам и написал.

Загвоздка в объёме. Ценность отзыву даёт повторяемость: одна и та же мысль у разных людей весит больше яркой формулировки одиночки. Один человек пожаловался на сроки — частный случай. Сорок человек из восьмисот пожаловались на сроки — это 5% аудитории и готовый первый экран. Считать частотность можно только на всём массиве, поэтому анализ ЦА упирается в скучную задачу: как вытащить восемьсот отзывов с чужой карточки.

## Почему скриншоты отзывов дают слабый анализ

Стандартный процесс выглядит так: маркетолог открывает карточку конкурента на [Яндекс Картах](../../logos/map/yandexmaps/), читает первые экраны, скринит то, что зацепило, складывает картинки в папку. Через час набирается сорок скриншотов, из них в документ для клиента уходит десяток цитат.

Дальше этот десяток и становится основой упаковки. Причём выбирали его по яркости формулировки, а частотность никто не считал, потому что считать не по чему: восемьсот отзывов никто не читал. В результате на первый экран уезжает боль, которую упомянули трижды, а та, что встречается в каждом пятом отзыве, остаётся незамеченной.

Вторая потеря — поиск. Скриншот не ищется по слову. А самые ценные куски отзыва находятся именно поиском по триггерным фразам: «боялся», «думал, что», «раньше брал», «ожидал», «единственное, что». Каждая такая фраза помечает возражение, страх или сравнение с прежним поставщиком, то есть ровно тот материал, ради которого всё затевалось. По папке с картинками так не пройтись.

Поэтому первым делом отзывы нужно превратить в текст, по которому работает Ctrl+F. Логично сделать это копипастой, и здесь начинается самое обидное.

## Почему список отзывов не копируется целиком

Длинные списки площадки рисуют виртуальным скроллом. В разметке страницы живут только карточки, которые сейчас видны, плюс небольшой запас сверху и снизу; всё, что уехало вверх, из документа удаляется. Браузер копирует разметку, поэтому «выделить всё» забирает два десятка карточек — остальных в этот момент физически нет на странице.

Второе ограничение — свёрнутый текст. Длинный отзыв показан обрезанным до кнопки «Ещё», и в буфер уходит ровно то, что видно. Пока по кнопке не кликнули, полного текста в разметке нет. Обидно вдвойне: длинные отзывы и есть самые полезные, там человек описывает всю историю выбора, а короткие пятёрки для анализа бесполезны.

Третье вылезает при ручной прокрутке: карточки перерисовываются, и один отзыв легко попадает в документ дважды. При восьмистах строках дубли всплывают на этапе подсчёта, когда «недовольных сроками» вдруг оказывается 60 вместо 43, и весь вывод про 5% аудитории рассыпается.

Официальные пути эту задачу тоже не закрывают. Кабинет [Яндекс Бизнеса](../../logos/ads/yandexbusiness/) показывает вашу организацию и молчит про соседнюю, хотя интересуют как раз соседи. У [Авито](../../logos/market/avito/) есть API с разделом «Рейтинги и отзывы», но ключи выдаются под ваш аккаунт продавца, а чужой продавец через них недоступен. Свой парсер на Python живёт до ближайшего редизайна площадки, и разовая задача превращается в мини‑проект с прокси и капчей.

При этом браузер уже нарисовал все нужные отзывы у вас на экране. Разумно забрать их прямо оттуда.

## Как спарсить отзывы конкурента за две минуты

Расширение работает внутри открытой вкладки: прокручивает список за вас, раскрывает свёрнутые тексты, отбрасывает дубли и складывает результат в файл. Ни ключей API, ни прокси, ни разработчика.

[Reviews Exporter](../../tools/extensions/reviews-exporter/) — расширение для [Chrome](../../logos/search/chrome/), которое делает это на трёх площадках: отзывы организации на [Яндекс Картах](../../logos/map/yandexmaps/), отзывы продавца на [Авито](../../logos/market/avito/) и комментарии к посту канала в [Telegram](../../logos/social/telegram/) Web. Кнопка «Собрать отзывы» появляется прямо рядом со списком, страница листается сама, в конце вы нажимаете «Скачать файл».

:::tip Установка за минуту
1. Скачайте архив со [страницы расширения](../../tools/extensions/reviews-exporter/) и распакуйте его в постоянную папку.
2. Откройте в [Chrome](../../logos/search/chrome/) адрес `chrome://extensions` и включите «Режим разработчика» в правом верхнем углу.
3. Нажмите «Загрузить распакованное расширение» и выберите распакованную папку.
4. Откройте карточку конкурента на [Яндекс Картах](../../logos/map/yandexmaps/), страницу отзывов продавца на [Авито](../../logos/market/avito/) или ветку обсуждения поста в [Telegram](../../logos/social/telegram/) Web и нажмите кнопку сбора.
:::

На выходе получается один Markdown‑файл: шапка с цифрами и дальше все отзывы подряд, пронумерованные, с датой и оценкой.

```
# Отзывы

- **Организация:** Мебель на заказ «Пример»
- **Собрано отзывов:** 812
- **Средний рейтинг:** 4.62/5

### Распределение по оценкам

- 5★: 640
- 4★: 92
- 3★: 38
- 2★: 17
- 1★: 25

---

## 1. Мария

- **Дата:** 12 июня 2026
- **Оценка:** 5/5
- **Реакции:** 👍 3

Долго выбирала между тремя мастерскими, боялась, что кухню привезут без…
```

Шапка сразу решает вопрос «с чего начать читать». Единицы и двойки дают самые развёрнутые тексты: человек, которому всё понравилось, пишет «спасибо, всё супер», а тот, кого подвели, расписывает историю целиком — со сравнением, ожиданиями и списком того, что для него было важно. В примере выше это 42 отзыва из 812, и они дадут больше материала для офферов, чем шестьсот пятёрок.

Дальше файл открывается в любом редакторе, а лучше сразу в двух окнах: в одном текст, в другом документ для клиента.

## Что искать в файле: семь категорий и триггерные фразы

Люди не формулируют потребности готовыми формулами, поэтому сканирование идёт по маркерам. Каждая категория ниже имеет свои характерные слова, и по ним файл прочёсывается поиском.

**Что хвалят в продукте.** Характеристика или результат, за которые платят: «фасады через два года как новые», «встало ровно, без щелей». Отсюда берутся конкретные обещания вместо «качества».

**Что хвалят в сервисе.** Как обслужили: скорость ответа, перенос доставки, замер в выходной. Ищите слова «привезли», «ответили», «перезвонили». Это материал для блока про процесс работы.

**За что ругают.** Прямая боль конкурента и ваш заголовок. Маркеры простые: «сроки», «пришлось ждать», «переделывали». Каждая частая жалоба разворачивается в утверждение о вас: «сроки в договоре, за просрочку вычитаем из стоимости».

**Возражения.** То, что мешало решиться. Ищите «думал, что», «сомневался», «казалось, что». Каждое найденное возражение — строка в FAQ на сайте.

**Страхи.** Основаны на прошлом опыте: «боялся, что», «предыдущие», «уже обжигались». Отрабатываются гарантией, фотоотчётом или примером из практики.

**Критерии выбора.** По чему сравнивали до покупки: «выбирала между», «в отличие от», «у других». Это готовая структура блока сравнения и подсказка, какие параметры вообще стоит указывать.

**Прежний поставщик.** Почему ушли от конкурента и почему пришли: «раньше брали», «перешли от», «до этого заказывали». Самый ценный материал для отстройки, потому что человек сам называет разницу.

Механика простая: прошли поиском по маркерам одной категории, вынесли найденные цитаты в документ, посчитали, сколько раз встретилась каждая мысль. На этом этапе файл начинает окупаться: поиск по восьмистам отзывам занимает минуты, а руками это чтение на два вечера.

## Как из цитат получаются заголовки и блоки

Собранные цитаты сами по себе клиенту не продаются, поэтому дальше идёт интерпретация. Работает она по одному правилу: частая жалоба на конкурента превращается в утвердительное обещание, частое возражение — в вопрос с ответом, частый критерий выбора — в параметр сравнения.

Выглядит это так. В файле мебельщика 47 отзывов содержат слова про сроки, в 31 из них жалуются на перенос даты. Значит первый экран получает «Кухню за 30 рабочих дней: срок в договоре, за каждый день просрочки минус 1% от стоимости» вместо «качественной мебели на заказ». Обещание конкретное, подкреплено процессом и закрывает измеренную боль.

Дальше 19 отзывов со словом «боялся» дают блок гарантий: люди боялись, что размеры не сойдутся с нишей. Ответ — бесплатный замер и подпись чертежа до запуска в производство. Ещё 24 отзыва со связкой «выбирала между» показывают, что сравнивают по типу фасадов и сроку гарантии; значит в сравнительной таблице должны стоять эти два параметра, даже если клиенту удобнее рассказывать про другие.

Собирайте всех конкурентов, до кого дотянетесь: десять‑пятнадцать карточек в нише — это пара часов работы и несколько тысяч отзывов на входе. Картина от объёма меняется качественно. Жалоба, которая повторяется у всех пятнадцати, означает отраслевую боль, и её закрывает первый экран. Жалоба, которая есть у соседей и отсутствует у вашего клиента, идёт в блок отстройки. Похвала, которая звучит у соседей и не звучит у клиента, превращается в вопрос на созвоне: «а у вас так делают?» — часто оказывается, что делают, просто никому не рассказывали.

## Отзывы кончились: где ещё лежат формулировки

Карты и отзовики закрывают массовый спрос, но для многих ниш там пусто. Тогда источником становятся комментарии в [Telegram](../../logos/social/telegram/): под постом конкурента или отраслевого канала люди спорят, задают вопросы и делятся опытом — теми же категориями, что и в отзывах, только живее. Расширение собирает ветку обсуждения целиком, вместе с текстом поста, датой, просмотрами и реакциями в шапке, а вложения в комментариях помечает отдельными строками.

Для B2B это часто единственный доступный источник: у поставщика оборудования не будет восьмисот отзывов на Картах, зато под постом в профильном канале найдётся тридцать комментариев с конкретными возражениями от закупщиков. Люди там пишут то же самое, что написали бы в отзыве.

## Готовый промт: пятнадцать файлов в нейросеть, отчёт на выходе

Пятнадцать файлов по тысяче отзывов руками уже не прочитать никак. Здесь помогает нейросеть, но с оговоркой: считает и группирует она хорошо, а интерпретирует посредственно.

Загрузите все собранные файлы разом в [Claude](../../logos/ai/claude/) — он тянет пятнадцать файлов в одном диалоге и не теряет их к середине разговора. [ChatGPT](../../logos/ai/chatgpt/) справляется тоже, просто на длинных файлах чаще уходит в пересказ вместо подсчёта. Промт, который стоит забрать целиком:

```
Изучи и проанализируй все отзывы из файлов

Дай мне:

1. Самые частотные комментарии — топ 5-10 фраз, которые встречаются чаще всего — укажи какое количество раз они встречались

2. Список того, на что люди чаще жалуются — топ 10-15 пунктов

3. Список того, за что люди благодарят и чем довольны — топ 10-15 пунктов

4. Напиши, что ещё полезного увидел в отзывах — инсайты
```

Работает здесь каждый пункт. Первый даёт частотность, ради которой массив и собирался: модель считает повторы и называет число, а число проверяется поиском по файлу за секунду. Второй и третий раскладывают эти повторы на боли и похвалы, то есть на заголовки и на блок про процесс работы. Четвёртый ловит то, что не попало в семь категорий, и обычно именно оттуда приходит неожиданный аргумент для клиента.

Требование указывать количество упоминаний тут ключевое. Без него модель отвечает общими словами вроде «многие отмечают долгую доставку», и вы возвращаетесь ровно к той ситуации, из‑за которой скриншоты и не работают.

Выводы про офферы делайте сами. Модель предложит усреднённые формулировки, они звучат гладко и продают хуже живой фразы клиента. По той же причине не отдавайте ей написание заголовков: сила приёма в том, что вы говорите словами аудитории, а нейросетевой текст читатели опознают быстрее, чем кажется.

:::warning Границы
Отзывы опубликованы открыто, и собирать их для анализа нормально. Но в файле есть имена авторов, поэтому он живёт внутри команды и не уезжает в общий чат; адресные рассылки по авторам отзывов из него тоже не делают. Цитаты в презентации для клиента обезличивайте.
:::

## С чего начать сегодня

Возьмите проект, который сейчас в работе. Составьте список из десяти‑пятнадцати конкурентов на [Яндекс Картах](../../logos/map/yandexmaps/) или [Авито](../../logos/market/avito/), пройдите по карточкам и соберите файл с каждой: две минуты на карточку, полчаса на весь список. Прочитайте сначала единицы и двойки — уже на этом шаге появится десяток формулировок, которых нет ни на одном сайте в нише.

Дальше прогоните файлы поиском по семи категориям, посчитайте частотность и вынесите в документ для клиента то, что встречается чаще пяти раз. Такой документ заодно продаёт вашу работу: клиент видит цифры и цитаты вместо «мы проанализировали целевую аудиторию».

[Поставьте расширение](../../tools/extensions/reviews-exporter/) и соберите первый файл сегодня — на карточку уходит пара минут, а на сбор аргументов для первого экрана обычно уходит неделя.

---EN---

The client says: "our advantage is quality and a personal approach." That turns into a headline half the market already uses, and the landing page underperforms. The source is what fails here: the advantages were written down from the client, while someone else pays for the product.

The wording that actually sells sits in the open, inside your competitors' reviews. There people describe in their own words what they feared before ordering, what they compared, why they left their previous supplier and what ended up mattering. A headline built from that phrasing lands, because the reader wrote it themselves.

The catch is volume. A review's value depends on how many different people repeat the same thought. One person complaining about deadlines is an anecdote. Forty out of eight hundred complaining about deadlines is 5% of the audience and a ready-made hero section. Frequency can only be counted across the whole set, which is why audience research runs into a dull task: getting eight hundred reviews off someone else's page.

## Why screenshotting reviews produces weak research

The usual process looks like this: a marketer opens a competitor's card on [Yandex Maps](../../logos/map/yandexmaps/), reads the first few screens, screenshots whatever stands out and drops the images into a folder. An hour later there are forty screenshots, and a dozen quotes make it into the client document.

Those dozen quotes then become the basis of the positioning. They were picked for how vivid the wording was, and nobody counted frequency, because there was nothing to count across: nobody read all eight hundred. So a pain mentioned three times goes into the hero section while the one appearing in every fifth review stays invisible.

The second loss is search. A screenshot can't be searched by word, and the most valuable parts of a review are found exactly that way — through trigger phrases: "I was afraid", "I thought that", "I used to buy", "I expected", "the only thing". Each of those marks an objection, a fear or a comparison with a previous supplier, which is the entire point of the exercise. A folder of images gives you none of it.

So the first step is turning reviews into text that Ctrl+F can work with. Copy-paste is the obvious way, and that's where it gets frustrating.

## Why a review list refuses to copy in full

Platforms render long lists with virtual scrolling. Only the cards currently on screen live in the page markup, plus a small buffer above and below; everything scrolled past is removed from the document. The browser copies that markup, so "select all" grabs two dozen cards — the rest physically aren't on the page at that moment.

The second limit is collapsed text. A long review is clipped at the "More" button, and the clipboard gets exactly what's visible. Until that button is clicked, the full text isn't in the markup. That hurts twice over: long reviews are the useful ones, where a person lays out the whole selection story, while short five-star notes are useless for research.

The third problem appears during manual scrolling: cards get re-rendered, so a single review easily lands in the document twice. At eight hundred rows duplicates surface when you start counting and "unhappy about deadlines" turns out to be 60 instead of 43, taking the whole 5% conclusion down with it.

Official routes don't close the task either. The [Yandex Business](../../logos/ads/yandexbusiness/) dashboard shows your organization and stays silent about the one next door, while the neighbours are precisely who you care about. [Avito](../../logos/market/avito/) has an API with a "Ratings and reviews" section, but keys are issued for your own seller account and another seller stays out of reach. A homegrown Python scraper survives until the platform's next redesign, turning a one-off job into a side project with proxies and captchas.

Meanwhile the browser has already drawn every review you need on your screen. Taking them from there makes sense.

## How to scrape a competitor's reviews in two minutes

The extension works inside the open tab: it scrolls the list for you, expands collapsed texts, drops duplicates and saves the result to a file. No API keys, no proxies, no developer.

[Reviews Exporter](../../tools/extensions/reviews-exporter/) is a [Chrome](../../logos/search/chrome/) extension that does this on three platforms: an organization's reviews on [Yandex Maps](../../logos/map/yandexmaps/), a seller's reviews on [Avito](../../logos/market/avito/) and the comments on a channel post in [Telegram](../../logos/social/telegram/) Web. A "Collect reviews" button appears next to the list, the page scrolls itself, and at the end you press "Download file".

:::tip A minute to install
1. Download the archive from the [extension page](../../tools/extensions/reviews-exporter/) and unpack it into a permanent folder.
2. Open `chrome://extensions` in [Chrome](../../logos/search/chrome/) and turn on "Developer mode" in the top right corner.
3. Click "Load unpacked" and pick the unpacked folder.
4. Open a competitor's card on [Yandex Maps](../../logos/map/yandexmaps/), a seller's reviews page on [Avito](../../logos/market/avito/) or a post's discussion thread in [Telegram](../../logos/social/telegram/) Web, then press the collect button.
:::

The output is one Markdown file: a header with the numbers, then every review in order, numbered, with its date and score.

```
# Отзывы

- **Организация:** Мебель на заказ «Пример»
- **Собрано отзывов:** 812
- **Средний рейтинг:** 4.62/5

### Распределение по оценкам

- 5★: 640
- 4★: 92
- 3★: 38
- 2★: 17
- 1★: 25

---

## 1. Мария

- **Дата:** 12 июня 2026
- **Оценка:** 5/5
- **Реакции:** 👍 3

Долго выбирала между тремя мастерскими, боялась, что кухню привезут без…
```

The header answers "where do I start reading". One- and two-star reviews carry the longest texts: a satisfied customer writes "thanks, all great", while someone who was let down lays out the entire story — the comparison, the expectations, the list of what mattered to them. In the example above that's 42 reviews out of 812, and they yield more raw material for offers than the six hundred five-star ones.

From there the file opens in any editor, ideally in two windows: the text in one, the client document in the other.

## What to look for: seven categories and their trigger phrases

People don't state their needs in ready-made formulas, so scanning goes by markers. Each category below has its own characteristic words, and the file gets combed by them.

**Praise for the product.** The feature or result people pay for: "the fronts still look new after two years", "fitted perfectly, no gaps". This is where concrete promises come from instead of "quality".

**Praise for the service.** How the customer was treated: response speed, a rescheduled delivery, a weekend site visit. Look for "delivered", "answered", "called back". Material for the how-we-work block.

**Complaints.** Your competitor's pain and your headline. The markers are plain: "deadlines", "had to wait", "they redid it". Each frequent complaint unfolds into a statement about you: "deadline in the contract, with a penalty for every day of delay".

**Objections.** What stopped people from deciding. Look for "I thought that", "I doubted", "it seemed like". Every objection found is a line in the site's FAQ.

**Fears.** Rooted in past experience: "I was afraid that", "the previous ones", "we got burned before". Answered with a guarantee, a photo report or a case from practice.

**Decision criteria.** What people compared before buying: "I chose between", "unlike", "the others had". A ready-made structure for a comparison block and a hint about which parameters are worth listing at all.

**The previous supplier.** Why they left a competitor and why they came: "we used to order", "we switched from", "before that we bought". The most valuable material for positioning, because the customer names the difference themselves.

The mechanics are simple: search by one category's markers, move the quotes you find into the document, count how many times each thought appears. This is where the file pays for itself — searching eight hundred reviews takes minutes, while reading them by hand takes two evenings.

## How quotes become headlines and blocks

Raw quotes don't sell to the client on their own, so interpretation comes next, and it follows one rule: a frequent complaint about a competitor becomes an affirmative promise, a frequent objection becomes a question with an answer, a frequent decision criterion becomes a comparison parameter.

In practice it looks like this. A furniture maker's file has 47 reviews mentioning deadlines, 31 of which complain about a pushed date. So the hero section gets "A kitchen in 30 working days. The date is in the contract, with 1% off the price for every day of delay" instead of "quality custom furniture". The promise is specific, backed by a process, and it closes a pain you measured.

Then 19 reviews containing "was afraid" produce the guarantees block: people feared the measurements wouldn't match the alcove. The answer is a free site visit and a signed drawing before production starts. Another 24 reviews with "chose between" show that people compare front materials and warranty length, so those two parameters belong in the comparison table, even when the client would rather talk about others.

Collect every competitor you can reach instead of one: ten to fifteen cards in a niche is a couple of hours of work and several thousand reviews at the input. Volume changes the picture qualitatively. A complaint repeating across all fifteen marks an industry-wide pain, and the hero section closes it. A complaint the neighbours get and your client doesn't goes into the positioning block. Praise the neighbours receive and your client never mentions becomes a question for the next call: "do you do this too?" — and usually they do, they just never told anyone.

## When the reviews run out: where else the wording lives

Maps and review sites cover consumer demand, though plenty of niches come up empty there. Then the source becomes comments in [Telegram](../../logos/social/telegram/): under a competitor's post or an industry channel, people argue, ask questions and share experience in the same categories as reviews, only more freely. The extension collects the whole discussion thread along with the post text, date, views and reactions in the header, and marks attachments in comments as separate lines.

For B2B this is often the only available source: an equipment supplier won't have eight hundred reviews on Maps, yet a post in a professional channel will have thirty comments full of concrete objections from procurement. People write there exactly what they'd write in a review.

## A ready-made prompt: fifteen files in, a report out

Fifteen files of a thousand reviews each are unreadable by hand, full stop. A language model helps here, with one caveat: it counts and groups well, and interprets poorly.

Upload every collected file at once to [Claude](../../logos/ai/claude/) — it carries fifteen of them in one conversation without losing them halfway through. [ChatGPT](../../logos/ai/chatgpt/) handles it too, it just drifts into summarizing instead of counting more often on long files. The prompt is worth taking whole:

```
Изучи и проанализируй все отзывы из файлов

Дай мне:

1. Самые частотные комментарии — топ 5-10 фраз, которые встречаются чаще всего — укажи какое количество раз они встречались

2. Список того, на что люди чаще жалуются — топ 10-15 пунктов

3. Список того, за что люди благодарят и чем довольны — топ 10-15 пунктов

4. Напиши, что ещё полезного увидел в отзывах — инсайты
```

Every item there earns its place. The first delivers the frequency the whole collection was for: the model counts repetitions and names a number, and that number takes a second to verify by searching the file. The second and third split those repetitions into pains and praise, which is to say into headlines and the how-we-work block. The fourth catches whatever fell outside the seven categories, and that's usually where an unexpected argument for the client comes from.

Demanding the count is the key part. Without it the model answers in generalities like "many customers mention slow delivery", and you land right back in the situation that makes screenshots useless.

Draw the conclusions about offers yourself. A model proposes averaged phrasing that reads smoothly and sells worse than a live customer sentence. For the same reason, don't hand it the headlines: the whole power of this method is speaking in your audience's words, and readers spot AI-generated text faster than you'd expect.

:::warning The limits
Reviews are published openly, and collecting them for analysis is fine. But the file carries author names, so it stays inside the team instead of travelling to shared chats, and it never becomes a mailing list of review authors. Anonymize quotes before they go into a client presentation.
:::

## Where to start today

Take the project you're working on right now. Find ten to fifteen competitors on [Yandex Maps](../../logos/map/yandexmaps/) or [Avito](../../logos/market/avito/), collect a file from each card and read the one- and two-star reviews first. That step alone surfaces a dozen phrasings that appear on no site in the niche.

Then run the files through the seven categories, count the frequencies and move everything appearing more than five times into the client document. That document also sells your work: the client sees numbers and quotes instead of "we analysed the target audience".

[Install the extension](../../tools/extensions/reviews-exporter/) and collect your first file today — a card takes a couple of minutes, while gathering the arguments for a hero section usually takes a week.
