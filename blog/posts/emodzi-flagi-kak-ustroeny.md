---
title: Как устроены эмодзи‑флаги — и почему их не видно на Windows
title_en: How Flag Emoji Work — and Why Windows Doesn't Show Them
description: Эмодзи флагов изнутри: региональные индикаторы, коды ISO, почему Windows показывает буквы вместо флагов, откуда флаги Шотландии и радужный флаг из ZWJ
description_en: Flag emoji from the inside: regional indicators, ISO codes, why Windows shows letters instead of flags, and where Scotland's flag comes from.
date: 2026-07-27
slug: emodzi-flagi-kak-ustroeny
tags: Эмодзи, Основы, Форматы
tags_en: Emoji, Basics, Formats
---

Эмодзи‑флаги — самая странная часть эмодзи‑стандарта: это единственные эмодзи, которых формально… не существует. В Юникоде нет символа «флаг России» — есть пара букв, которые устройство *договорилось* показывать как флаг. Отсюда и все чудеса: на Windows флаги превращаются в буквы, флаг Шотландии собран из невидимых «тегов», а радужный флаг — это белый флаг, склеенный с радугой. Разбираем всю механику.

:::note Коротко
Флаги стран — это пары **региональных индикаторов** ( 🇷 + 🇺 = 🇷🇺) по кодам ISO 3166: системе не нужно хранить каждый флаг, только правило. **Windows — единственная крупная платформа, не рисующая флаги стран**: вместо них видны буквы RU/US/FR. Флаги Шотландии, Уэльса и Англии собраны из **тег‑последовательностей**, а радужный и пиратский — склейки через **ZWJ**. Все флаги с картинками — в [разделе «Флаги»](../../emoji/flags/) нашего каталога.
:::

## Флагов нет — есть буквы

Когда в 2010 году эмодзи переезжали в Юникод, консорциум упёрся в политическую проблему: список стран меняется, статус территорий оспаривается, а стандарт кодирования не должен решать, что является страной. Решение вышло элегантным: в Юникод добавили 26 символов — **региональные индикаторы** 🇦… 🇿, зеркалящие латинский алфавит. Два индикатора подряд, образующие код страны по стандарту **ISO 3166‑1** (RU, US, FR…), устройство *может* отобразить одним флагом.

Ключевое слово — «может». Юникод не требует рисовать флаг и не хранит его изображение: каждая платформа сама решает, поддерживать ли пару и как флаг выглядит. Поэтому один и тот же текст показывает флаг на iPhone и две буквы там, где флаги не поддержаны — это частный случай общей истории про то, [почему эмодзи отображаются по‑разному](../pochemu-emodzi-otobrazhayutsya-po-raznomu/).

## Почему Windows показывает буквы

Windows — единственная крупная платформа, которая **сознательно не рисует флаги стран**: и в Windows 10, и в Windows 11 вместо 🇷🇺 вы увидите «RU». Официальной причины Microsoft не называла; общепринятое объяснение — политика: рисуя флаги, пришлось бы решать, показывать ли флаги спорных территорий, и любое решение стало бы заявлением. Google, Apple и Samsung этот риск приняли, Microsoft — нет.

Практическое следствие для дизайнеров и разработчиков: если аудитория сидит на десктопной Windows (например, читает ваш сайт из офиса), флаги в заголовках и кнопках выбора языка превратятся в буквенные пары. Для интерфейсов надёжнее использовать картинки флагов — например, SVG из нашего [каталога флагов](../../logos/flag/), которые выглядят одинаково везде.

## Шотландия, Уэльс и невидимые теги

Регионы внутри стран (у которых нет кода ISO 3166‑1) кодируются ещё экзотичнее: **тег‑последовательностями**. Флаг Шотландии 🏴󠁧󠁢󠁳󠁣󠁴󠁿 — это чёрный флаг 🏴 плюс невидимые символы‑теги, диктующие «gbsct» (Great Britain → Scotland), плюс тег‑терминатор. Официально таких флагов в стандарте три: Шотландия, Уэльс, Англия — их добавили в 2017 году под давлением очевидного спроса.

Механизм расширяем в теории (можно закодировать любой регион ISO 3166‑2), но консорциум заморозил список: каждый новый региональный флаг — потенциальный политический конфликт. Заявки на новые флаги стран и регионов Юникод официально больше не принимает — подробнее о том, как вообще появляются новые эмодзи, в статье как предложить свой эмодзи.

## Радужный флаг — это склейка

Третий механизм — **ZWJ‑последовательности** (zero‑width joiner, соединитель нулевой ширины):

-  🏳️‍🌈 радужный флаг = белый флаг 🏳️ + ZWJ + радуга 🌈
-  🏴‍☠️ пиратский флаг = чёрный флаг 🏴 + ZWJ + череп с костями ☠️

Логика экономная: не добавлять новый символ, а описать новое понятие комбинацией существующих — тем же способом собраны семьи и профессии, [что такое эмодзи и как они устроены](../chto-takoe-emodzi-i-otkuda-oni/), мы объясняли отдельно. Если платформа комбинацию не знает, она показывает элементы по отдельности: белый флаг и радугу рядом. Увидели такое — перед вами устройство со старым эмодзи‑шрифтом; [почему эмодзи не отображаются](../pochemu-ne-otobrazhayutsya-emodzi/) вообще, мы разбирали в отдельной статье.

## Сколько всего флагов

| Тип | Механизм | Сколько | Пример |
| --- | --- | --- | --- |
| Страны и территории | пары индикаторов ISO 3166‑1 | 258 | 🇷🇺 🇯🇵 🇧🇷 |
| Регионы | тег‑последовательности | 3 | 🏴󠁧󠁢󠁳󠁣󠁴󠁿 🏴󠁧󠁢󠁷󠁬󠁳󠁿 🏴󠁧󠁢󠁥󠁮󠁧󠁿 |
| ZWJ‑склейки | флаг + ZWJ + символ | 2 | 🏳️‍🌈 🏴‍☠️ |
| Одиночные | обычные эмодзи | 4 | 🏁 🚩 🏳️ 🏴 |

Итого около 270 флагов — вся коллекция с картинками Apple собрана в [разделе «Флаги»](../../emoji/flags/) нашего каталога эмодзи.

:::tip Трюк: флаг как две буквы
Региональные индикаторы можно использовать и «не по назначению»: набранные по отдельности (с пробелами), они дают стилизованные буквы 🇹 🇷 🇦 🇨 🇪 — популярный приём оформления ников и заголовков. Другие символьные приёмы — в статье [символы и эмодзи для ника](../simvoly-i-emodzi-dlya-nika/).
:::

## Выводы

1. **Флаг — это правило, а не картинка.** Устройство собирает его из букв на лету; поэтому флаги нельзя «частично скопировать» — только парой.
2. **Не полагайтесь на флаги в интерфейсах.** Из‑за Windows заметная часть пользователей увидит буквы: для переключателей языков используйте SVG‑флаги из [каталога](../../logos/flag/).
3. **Новых флагов не будет.** Список заморожен: ни новых стран‑заявок, ни регионов Юникод не принимает.
4. **Флаги — витрина всей механики эмодзи:** индикаторы, теги и ZWJ в одном разделе. Поняв флаги, вы понимаете, как устроен весь стандарт — продолжение [в статье о происхождении эмодзи](../chto-takoe-emodzi-i-otkuda-oni/).

---EN---

Flag emoji are the strangest corner of the emoji standard: they are the only emoji that formally… don't exist. Unicode has no "flag of Japan" character — it has a pair of letters that devices have *agreed* to render as a flag. Hence all the oddities: Windows turns flags into letters, Scotland's flag is assembled from invisible "tags", and the rainbow flag is a white flag glued to a rainbow. Let's take the mechanism apart.

:::note TL;DR
Country flags are pairs of **regional indicators** (🇯 + 🇵 = 🇯🇵) keyed to ISO 3166 codes: the system stores a rule, not each flag. **Windows is the only major platform that doesn't draw country flags** — you see the letters US/FR/JP instead. The flags of Scotland, Wales and England are **tag sequences**, while the rainbow and pirate flags are **ZWJ** combinations. All flags with images are in the [Flags section](../../emoji/flags/) of our catalog.
:::

## There are no flags — only letters

When emoji moved into Unicode around 2010, the consortium hit a political wall: the list of countries changes, territory status is contested, and an encoding standard must not decide what counts as a country. The solution was elegant: Unicode added 26 characters — **regional indicators** 🇦…🇿 mirroring the Latin alphabet. Two consecutive indicators forming an **ISO 3166-1** country code (US, FR, JP…) *may* be displayed by the device as one flag.

The key word is "may". Unicode neither requires the flag nor stores its image: each platform decides whether to support a pair and what the flag looks like. The same text shows a flag on an iPhone and two letters where flags are unsupported — a special case of the wider story of [why emoji look different everywhere](../pochemu-emodzi-otobrazhayutsya-po-raznomu/).

## Why Windows shows letters

Windows is the only major platform that **deliberately doesn't render country flags**: on both Windows 10 and 11, 🇯🇵 appears as "JP". Microsoft never stated an official reason; the accepted explanation is politics: drawing flags means deciding whether to show contested territories, and any decision becomes a statement. Google, Apple and Samsung accepted that risk; Microsoft didn't.

The practical consequence for designers and developers: if your audience sits on desktop Windows (say, reading your site from an office), the flags in your language switcher degrade into letter pairs. For interfaces, flag images are the reliable route — e.g. the SVGs in our [flag catalog](../../logos/flag/), which look identical everywhere.

## Scotland, Wales and the invisible tags

Regions inside countries (with no ISO 3166-1 code) are encoded even more exotically: as **tag sequences**. The Scottish flag 🏴󠁧󠁢󠁳󠁣󠁴󠁿 is the black flag 🏴 plus invisible tag characters spelling "gbsct" (Great Britain → Scotland) plus a terminator tag. The standard officially contains three such flags — Scotland, Wales, England — added in 2017 under obvious demand.

The mechanism is theoretically extensible (any ISO 3166-2 region could be encoded), but the consortium froze the list: every new regional flag is a potential political conflict. Unicode no longer accepts proposals for new country or region flags — more on how new emoji happen at all in how to propose your own emoji.

## The rainbow flag is a splice

The third mechanism is **ZWJ sequences** (zero-width joiner):

- 🏳️‍🌈 rainbow flag = white flag 🏳️ + ZWJ + rainbow 🌈
- 🏴‍☠️ pirate flag = black flag 🏴 + ZWJ + skull and crossbones ☠️

The logic is frugal: don't add a character, describe a new concept as a combination of existing ones — the same way families and professions are built; we explain [what emoji are and how they work](../chto-takoe-emodzi-i-otkuda-oni/) separately. If a platform doesn't know the combination, it shows the parts separately: a white flag next to a rainbow. Seeing that means the device has an outdated emoji font — we cover [why emoji fail to display](../pochemu-ne-otobrazhayutsya-emodzi/) in a separate article.

## How many flags are there

| Type | Mechanism | Count | Example |
| --- | --- | --- | --- |
| Countries & territories | ISO 3166-1 indicator pairs | 258 | 🇯🇵 🇧🇷 🇫🇷 |
| Regions | tag sequences | 3 | 🏴󠁧󠁢󠁳󠁣󠁴󠁿 🏴󠁧󠁢󠁷󠁬󠁳󠁿 🏴󠁧󠁢󠁥󠁮󠁧󠁿 |
| ZWJ splices | flag + ZWJ + symbol | 2 | 🏳️‍🌈 🏴‍☠️ |
| Standalone | ordinary emoji | 4 | 🏁 🚩 🏳️ 🏴 |

About 270 flags in total — the whole collection with Apple artwork lives in the [Flags section](../../emoji/flags/) of our emoji catalog.

:::tip Trick: a flag as two letters
Regional indicators also work "off-label": typed separately (with spaces) they render as stylized letters 🇹 🇷 🇦 🇨 🇪 — a popular device for nicknames and headers. More symbol tricks in [symbols and emoji for nicknames](../simvoly-i-emodzi-dlya-nika/).
:::

## Takeaways

1. **A flag is a rule, not a picture.** The device assembles it from letters on the fly; that's why you can't "half-copy" a flag — only as a pair.
2. **Don't rely on flags in UI.** Because of Windows, a visible share of users sees letters: for language switchers use SVG flags from [the catalog](../../logos/flag/).
3. **There will be no new flags.** The list is frozen: Unicode accepts neither new country nor region flag proposals.
4. **Flags are a showcase of the whole emoji machinery:** indicators, tags and ZWJ in one section. Understand flags and you understand the standard — continue with [the emoji origin story](../chto-takoe-emodzi-i-otkuda-oni/).
