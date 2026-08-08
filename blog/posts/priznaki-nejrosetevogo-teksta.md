---
title: По каким признакам видно текст нейросети и как их убрать
title_en: How to Spot AI-Written Text and Clean It Up
description: «Текст какой‑то нейросетевый» — правка, после которой непонятно, что менять: ошибок нет, факты на месте. Ощущение раскладывается на конечный список привычек — от конструкции «не X, а Y» до тире вместо запятой. Разбираем каждую и показываем замену.
description_en: "Sounds AI-written" is the one piece of feedback that leaves you nothing to fix: no errors, facts in place. The feeling breaks down into a finite list of habits, from the "not X but Y" construction to a dash standing in for a comma. Each one, with its replacement.
date: 2026-09-15
slug: priznaki-nejrosetevogo-teksta
tags: Текст, Нейросети, Практика
tags_en: Copy, AI, Practice
---

Заказчик присылает правку: «текст какой‑то нейросетевый, переделайте». Открываете файл и не понимаете, за что браться. Ошибок нет, факты проверены, абзацы короткие, заголовки на месте. Придраться не к чему, а ощущение у человека возникло, и оно устойчивое.

Ощущение появляется от синтаксиса. Языковая модель на каждом шаге выбирает самое вероятное продолжение, и в масштабе текста это даёт узнаваемый набор привычек: одни и те же обороты, одна и та же длина абзаца, одна и та же пунктуация. За год такого текста читатель видит столько, что распознаёт набор мгновенно, даже не умея его назвать.

Хорошая новость в том, что список конечен. Ниже тринадцать привычек, которые выдают генератор, и замена для каждой. Правятся они за один проход по готовому черновику.

## Почему это стоит вычищать, даже если текст верный

Дело здесь не в качестве самого инструмента. [ИИ вполне помогает в брендинге и текстах](../brending-s-pomoshyu-ii/) на этапе вариантов, черновиков и рутины, и отказываться от него смысла нет. Цена появляется на выходе: узнаваемый почерк читается как отсутствие усилий.

Привычки эти берутся из устройства модели, и потому они системны. Обучающий корпус усредняется: конструкция, которая встречалась чаще, чаще и предлагается на выходе. Автор‑человек выбирает оборот под конкретную мысль и иногда промахивается, поэтому его текст неровный. Модель промахов не делает и каждый раз ставит самое частотное — из‑за этого набор её решений повторяется от текста к тексту и складывается в тот самый список из тринадцати пунктов.

Механика восприятия при этом простая. Читатель, опознав генератор, переносит вывод с текста на автора и дальше на продукт. Описание услуги, собранное из типовых оборотов, сообщает «этим занимались десять минут» — независимо от того, сколько на него ушло на самом деле. Тот же эффект работает и в дизайне: [логотип, сгенерированный нейросетью](../logotip-nejrosetyu/), опознают по избыточной симметрии и лишним деталям, и доверие к нему падает раньше, чем начинается разговор о качестве.

Отсюда практический вывод: черновик от модели брать можно, отдавать её синтаксис заказчику нельзя. Разберём по порядку, что именно выдаёт машину.

## Главный паразит — конструкция «не X, а Y»

Эта конструкция встречается в сгенерированных текстах десятками и на первом месте в списке стоит заслуженно. Модель любит её, потому что противопоставление создаёт видимость мысли, ничего при этом не утверждая: сначала отрицается очевидное, потом подставляется общее место, и предложение выглядит содержательным.

Ищите все разновидности: «не X, а Y», «X, а не Y», «не просто X, а Y», «не только X, но и Y», «не потому что X, а потому что Y». В английском тексте им соответствуют «not X but Y», «rather than», «isn't X but Y».

Лечится переводом в утвердительную форму — скажите сразу то, что хотели сказать вторым куском.

| Было | Стало |
|---|---|
| Это не просто логотип, а обещание бренда | Логотип задаёт правила для всех носителей |
| Мы создали не картинку, а систему | Знак собирается из одного модуля под каждый сервис |
| Держит его не сходство символов, а всё остальное | Держит его всё остальное |
| Настоящая проверка — не расширение, а замена центра | Расширение проверяет систему слабо. Проверяет замена центра |

Регулярка тут плохой помощник: в JavaScript граница слова `\b` не знает кириллицы, и половина вариантов проскакивает. Читайте глазами.

## Тире, поставленное вместо запятой

Вторая привычка заметна реже, зато въедается глубже: модель ставит « — » между любыми двумя мыслями, потому что тире создаёт паузу и выглядит выразительно. По правилам пунктуации оно законно в конкретных случаях: пропущенная связка между подлежащим и сказуемым («Логотип — инструмент узнавания»), обособление вставки с двух сторон, противопоставление без союза («Хотел одно — получил другое»), обобщающее слово после перечисления, прямая речь.

У этой привычки есть понятное происхождение. В английской типографике em dash допускается заметно шире: он законно заменяет запятую, скобки и двоеточие, и в англоязычном корпусе встречается на порядок чаще. Русская пунктуация строже, а модель переносит частотность через язык — отсюда тире там, где по правилам нужна запятая.

Всё остальное — тик. Особенно заметен он перед союзами, где связь уже выражена самим союзом.

| Было | Стало |
|---|---|
|…перескажет её одним предложением — а это единственное, что останется. |…перескажет её одним предложением, а это единственное, что останется. |
| В интерфейсе остаётся квадрат 40×40 — и систему держат другие средства. | В интерфейсе остаётся квадрат 40×40 и систему держат другие средства. |
| Знак читается на вывеске — и это главное требование. | Знак читается на вывеске, и это главное требование. |

Проверка перед каждым тире одна: назовите правило, по которому оно стоит. Правило нашлось — оставляйте. Не нашлось — ставьте запятую, точку, двоеточие или убирайте знак совсем. «Так выразительнее» правилом не считается, и именно эта выразительность выдаёт машину.

## Образы, определения и прилагательные без признака

Дальше идёт группа привычек, которая раздувает текст, ничего к нему не добавляя.

Метафоры модель насыпает пачками: «ДНК бренда», «душа компании», «визуальный якорь», «фундамент коммуникации». По отдельности каждая терпима, вместе они выдавливают из абзаца последнюю конкретику. Держите не больше двух на весь текст и оставляйте ту, которая упрощает понимание. Образ, требующий отдельного объяснения, мешает.

Конструкция «X — это Y» работает так же: «Скруглённый квадрат — это универсальная заготовка». Два таких определения на статью читаются нормально, десять превращают текст в словарь. Замена прямая: «Скруглённый квадрат подходит любому знаку».

Размытые прилагательные — «настоящий», «правильный», «нормальный», «поистине уникальный» — сообщают только то, что автору нравится предмет. Меняйте их на признак или цифру: «читается на 16 пикселях», «в реестре нет знака с похожей формой». Тот же приём разбирается подробнее в статье про то, [почему сильный логотип проваливают на словах](../kak-pisat-o-logotipe/).

## Ритм, по которому машину видно с одного взгляда

Предыдущие признаки ловятся при чтении, этот заметен раньше — по форме страницы.

Первое: три абзаца подряд одинаковой длины и одинаковой конструкции, обычно по два предложения. Живой автор сбивается с ритма, потому что мысли у него разного размера; генератор держит шаг ровно. Разбейте симметрию, объединив два абзаца или разделив третий.

Второе: лестничный стиль. Одиночные строки, дробление мысли на обрывки, псевдодраматические переносы. Сюда же рваные предложения в одно‑два слова — «Ничего», «И всё», «Точка» — и отдельная их разновидность с «без»: «Без восторгов. Без лишних слов» Каждое такое место разворачивается обратно в нормальное предложение: «Сотни иконок при этом остались прежними».

Третье: искусственные склейки между абзацами. «И тут начинается…», «а дальше начинается…», «и вот здесь…». Они изображают поворот сюжета там, где его нет, и убираются без замены: «Дальше идёт абстракция:…».

## Канцелярит и выводы, за которыми ничего не стоит

Последняя пара привычек касается смысла.

Канцелярские связки — «важно понимать», «стоит отметить», «следует учитывать», «в современном мире», «таким образом», «в конечном итоге» — занимают место и не добавляют ничего. Проверяются вычёркиванием: если после удаления предложение не изменилось, слова были лишними. Оно не меняется никогда.

Абстрактный вывод — та же пустота, только в конце текста: «Логотип играет ключевую роль в восприятии бренда». Такую фразу можно поставить в конец любой статьи на любую тему, и в этом её диагноз. Работающий финал опирается на то, что было доказано выше, и содержит проверяемое утверждение: «Знак упрощают, потому что он переехал в иконку размером 16 пикселей».

:::warning Что не считается признаком
Не всякий ровный текст написан машиной. Отраслевые термины вроде «семейства брендов» или «ядра системы» метафорами не считаются. Списки сами по себе тоже нормальны — [проблемой они становятся](../svyaznost-teksta/) там, где заменяют причинную связь между мыслями. И короткое предложение остаётся законным приёмом, пока оно единственное на развороте; третье подряд уже симптом.
:::

## Как прогонять этот список по своему тексту

Тринадцать пунктов не нужно держать в голове во время письма: черновик, написанный под чек‑лист, получается алгоритмическим сам по себе. Список работает как отладчик после того, как мысль уже записана.

Порядок прохода экономит время. Сначала вычистите «не X, а Y» — это самая частая и самая заметная конструкция, и после неё текст меняется сильнее всего. Вторым проходом пройдите по каждому тире и назовите правило. Третьим посмотрите на страницу целиком, не читая: одинаковые абзацы и лестница видны по форме. Четвёртым вычеркните канцелярит и оцените последний абзац — держится ли он на фактах из текста.

Стоит это минут пятнадцать на статью и снимает ту самую правку, с которой всё началось.

## Итог

«Нейросетевость» раскладывается на конечный набор синтаксических привычек. Главная из них — конструкция «не X, а Y» во всех вариантах, за ней тире, поставленное вместо запятой, дальше метафоры пачками, определения «X — это Y», размытые прилагательные, симметричные абзацы, рваные строки, склейки, канцелярит и вывод, который подходит к любой статье.

Каждый пункт снимается одной переписанной строкой, а весь список проходится за один заход по готовому черновику. Модель при этом остаётся полезной ровно там, где была: черновик, варианты, рутина. Заказчику уходит текст, её синтаксис остаётся в черновике.

Как устроена вторая половина работы — связность, из‑за которой текст дочитывают или бросают, — разобрано отдельно: [почему текст бросают на середине](../svyaznost-teksta/).

---EN---

A client sends back one note: "sounds AI-written, please redo it." You open the file and have nothing to grab. No errors, the facts check out, the paragraphs are short, the headings are in place. There is nothing to point at, yet the impression formed in the reader and it holds.

The impression comes from syntax. A language model picks the most probable continuation at every step, and across a whole text that produces a recognisable set of habits: the same constructions, the same paragraph length, the same punctuation. Over a year a reader sees enough of it to recognise the set instantly, without being able to name it.

The good news is that the list is finite. Below are thirteen habits that expose a generator, each with its replacement. All of them are fixed in a single pass over a finished draft.

## Why to clean this up even when the text is correct

The quality of the tool has nothing to do with it. [AI genuinely helps with branding and copy](../brending-s-pomoshyu-ii/) at the stage of options, drafts, and routine, and there is no sense in refusing it. The cost appears at the output: a recognisable handwriting reads as absence of effort.

Those habits come from how the model is built, which is why they are systematic. The training corpus gets averaged: whichever construction occurred more often is offered more often at the output. A human author picks a phrasing for a specific thought and sometimes misses, which is what makes their text uneven. The model never misses and reaches for the most frequent option every time — so its choices repeat from text to text and add up to this list of thirteen.

The mechanics of perception are simple by comparison. Having identified a generator, the reader transfers the verdict from the text to the author and then to the product. A service description assembled from stock constructions announces "ten minutes went into this," whatever the real number was. The same effect works in design: [an AI-generated logo](../logotip-nejrosetyu/) is identified by its excess symmetry and surplus detail, and trust drops before any conversation about quality starts.

Hence the practical conclusion: take the draft from the model, keep its syntax away from the client. Here is what exposes the machine, in order.

## The main parasite — the "not X but Y" construction

This construction appears in generated text by the dozen and earns first place on the list. The model loves it because a contrast creates the appearance of a thought while asserting nothing: something obvious is denied, a platitude is substituted, and the sentence looks substantial.

Look for every variant: "not X but Y," "X, and not Y," "not just X but Y," "not only X but also Y," "not because X but because Y." Russian adds its own forms, and "rather than" belongs to the same family.

The cure is the affirmative — say straight away what the second half was going to say.

| Before | After |
|---|---|
| This is not just a logo but a brand promise | The logo sets the rules for every carrier |
| We created not a picture but a system | The mark assembles from one module for each service |
| What holds it is not the similarity of the symbols but everything else | What holds it is everything else |
| The real test is not expansion but replacing the centre | Expansion tests the system weakly. Replacing the centre tests it |

A regular expression is a poor helper here: in JavaScript the word boundary `\b` doesn't know Cyrillic, and half the variants slip through. Read with your eyes.

## A dash standing in for a comma

The second habit shows up less often and sits deeper: the model puts an em dash between any two thoughts, because a dash creates a pause and looks expressive. Punctuation allows it in specific cases — a missing link between subject and predicate ("A logo is a tool of recognition"), an insertion fenced on both sides, a contrast with no conjunction ("Wanted one thing, got another"), a summarising word after a list, direct speech.

The habit has a traceable origin. English typography allows the em dash far more room: it legitimately replaces a comma, brackets, and a colon, and it occurs an order of magnitude more often in an English corpus. Russian punctuation is stricter, and the model carries frequency across the language barrier — hence a dash where the rules ask for a comma.

Everything else is a tic. It stands out most in front of conjunctions, where the connection is already carried by the conjunction itself.

| Before | After |
|---|---|
| …retell it in one sentence — and that is the only thing left. | …retell it in one sentence, and that is the only thing left. |
| An interface leaves a 40×40 square — and the system is held by other means. | An interface leaves a 40×40 square and the system is held by other means. |
| The mark reads on a sign — and that is the main requirement. | The mark reads on a sign, and that is the main requirement. |

One check before every dash: name the rule it stands on. Rule found, keep it. No rule, use a comma, a full stop, a colon, or drop the mark entirely. "It's more expressive that way" is not a rule, and that expressiveness is exactly what exposes the machine.

## Images, definitions, and adjectives with nothing behind them

Next comes a group of habits that inflate a text while adding nothing to it.

The model pours metaphors out by the handful: "brand DNA," "the soul of the company," "a visual anchor," "the foundation of communication." Individually each is tolerable; together they squeeze the last of the specifics out of a paragraph. Keep no more than two across a whole text and keep the one that simplifies understanding. An image that needs its own sentence of explanation is in the way.

The "X is Y" definition behaves the same: "A rounded square is a universal blank." Two such definitions per article read fine; ten turn the text into a dictionary. The replacement is direct: "A rounded square suits any mark."

Vague adjectives — "real," "proper," "normal," "truly unique" — report only that the author likes the subject. Swap them for an attribute or a number: "legible at 16 pixels," "no mark with a similar shape in the registry." The same move gets a fuller treatment in the piece on [why strong logos fail on words](../kak-pisat-o-logotipe/).

## The rhythm that gives a machine away at a glance

The previous signs get caught while reading; this one shows earlier, in the shape of the page.

First: three consecutive paragraphs of identical length and identical construction, usually two sentences each. A live author breaks step because their thoughts come in different sizes; a generator holds the pace steady. Break the symmetry by merging two paragraphs or splitting the third.

Second: the staircase style. Single-line paragraphs, thoughts chopped into fragments, pseudo-dramatic breaks. The same bucket holds one- and two-word sentences — "Nothing." "That's it." "Full stop." — and their variant built on "no": "No excitement. No extra words." Each of those unrolls back into a normal sentence: "Hundreds of icons stayed exactly as they were."

Third: artificial joints between paragraphs. "And here is where it begins…", "and then begins…", "and this is where…". They fake a turn in the plot where none exists and come out with no replacement: "Next comes the abstraction: …".

## Officialese and conclusions with nothing behind them

The last pair of habits touches meaning.

Bureaucratic connectives — "it is important to understand," "it is worth noting," "it should be taken into account," "in today's world," "thus," "ultimately" — occupy space and add nothing. Test them by deletion: if the sentence is unchanged afterwards, the words were surplus. It is never changed.

An abstract conclusion is the same emptiness placed at the end: "A logo plays a key role in brand perception." A sentence like that fits the end of any article on any topic, which is its own diagnosis. A working ending rests on what was proved above and carries a verifiable claim: "Marks get simplified because they moved into a 16-pixel icon."

:::warning What does not count as a sign
Not every even-toned text was written by a machine. Industry terms like "brand family" or "system core" are not metaphors. Lists are fine in themselves — [they become a problem](../svyaznost-teksta/) where they replace the causal link between thoughts. And a short sentence stays a legitimate device as long as it is the only one on the spread; the third in a row is already a symptom.
:::

## How to run this list over your own text

Thirteen points don't need to be held in mind while writing: a draft written to a checklist comes out algorithmic on its own. The list works as a debugger once the thought is already down.

The order of passes saves time. Clear out "not X but Y" first — it is the most frequent and the most visible construction, and the text changes most after it. On the second pass go through every dash and name its rule. On the third look at the whole page without reading it: identical paragraphs and staircases are visible by shape. On the fourth strike the officialese and weigh the final paragraph — does it stand on facts from the text.

That costs about fifteen minutes per article and removes the very note this all started with.

## The bottom line

"Sounds AI-written" breaks down into a finite set of syntactic habits. The chief one is the "not X but Y" construction in all its variants, followed by a dash standing in for a comma, then metaphors by the handful, "X is Y" definitions, vague adjectives, symmetrical paragraphs, staircase lines, artificial joints, officialese, and a conclusion that fits any article.

Every point comes off with one rewritten line, and the whole list gets walked in a single pass over a finished draft. The model stays useful exactly where it was: drafts, options, routine. What reaches the client is the text, with its syntax left behind.

The other half of the work — the coherence that decides whether a text gets finished or abandoned — is covered separately: [why readers quit halfway](../svyaznost-teksta/).
