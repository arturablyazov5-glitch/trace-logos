---
title: Что такое эмодзи и откуда они появились
title_en: What Are Emoji and Where Did They Come From
description: История эмодзи от 176 символов くりた Сигэтаки в 1999 году до 3700+ знаков Unicode — кто их придумал, как они попали в iPhone и почему это не то же самое, что смайлики.
description_en: The history of emoji, from Shigetaka Kurita's 176 icons in 1999 to 3700+ Unicode characters — who invented them, how they reached the iPhone, and why they're not the same as emoticons.
date: 2026-06-04
slug: chto-takoe-emodzi-i-otkuda-oni
tags: Эмодзи, История, Unicode
tags_en: Emoji, History, Unicode
---

Слово «эмодзи» звучит по-английски, но это чистая японская калька: 絵 (э) — «картинка», 文字 (модзи) — «символ». Картиночный символ. И это не случайность — эмодзи действительно родились в Японии, у конкретного человека и в конкретном году, а не выросли постепенно из смайликов, как многие думают.

:::note Коротко
Эмодзи придумал **Сигэтака Курита** в 1999 году для японского оператора NTT DoCoMo — 176 значков размером 12×12 пикселей. В международный стандарт **Unicode** их включили только в 2010 году, после чего Apple добавила клавиатуру эмодзи в iOS, а Google подхватил тренд на Android. Сейчас в стандарте больше **3700 символов**, и это не «улыбочки», а полноценный алфавит смыслов.
:::

## Один человек и 176 картинок

В 1999 году японский дизайнер Сигэтака Курита работал над мобильным интернет-сервисом i-mode для оператора NTT DoCoMo. Проблема была конкретной: экраны первых мобильных телефонов были крошечными и монохромными, а передать эмоцию или контекст в SMS-переписке текстом было неудобно — символов и так не хватало.

Курита нарисовал 176 иконок 12×12 пикселей: солнце, зонт, сердце, улыбающееся лицо, знаки зодиака, транспорт. Вдохновлялся он манга-иероглифами (упрощённые пиктограммы для передачи эмоций в комиксах), дорожными знаками и символами погоды из японских газет. Каждая иконка занимала место одного символа — их можно было вставлять прямо в текст сообщения, как букву.

:::tip Это не смайлики
Смайлики (emoticons) — это комбинации обычных символов клавиатуры: `:)`, `;-)`, `<3`. Они существовали задолго до эмодзи, с 1980-х. Эмодзи — принципиально другое: не комбинация символов, а **отдельный графический символ** со своим кодом. `:)` — это два символа пунктуации, а 😊 — один символ Unicode с собственным номером `U+1F60A`.
:::

## Как эмодзи стали мировым стандартом

Долгое время эмодзи оставались чисто японским феноменом — у каждого оператора (DoCoMo, au, SoftBank) был свой несовместимый набор картинок, и сообщение с эмодзи, отправленное с одного оператора на другой, превращалось в кашу из вопросиков.

Переломный момент случился в 2007–2010 годах:

1. **2007.** Google начал добавлять поддержку японских эмодзи в Gmail для японского рынка — и заметил, насколько это популярно.
2. **2009–2010.** Google и Apple совместно подали предложение в **Консорциум Unicode** — организацию, которая стандартизирует все текстовые символы в мире, — включить эмодзи в стандарт наравне с буквами алфавитов и математическими знаками.
3. **2010.** Unicode 6.0 официально добавил первые 722 эмодзи-символа. С этого момента эмодзи перестали быть «японской фичей» и стали частью текстовой инфраструктуры интернета — как кириллица или иероглифы.
4. **2011.** Apple открыла клавиатуру эмодзи для всех пользователей iOS (до этого она была скрытой опцией, известной в основном в Японии). Google добавил поддержку в Android годом позже.

С этого момента начался рост, который не останавливается до сих пор: 2015 — эмодзи признано словом года по версии Oxford Dictionary (им стал сам символ 😂, «лицо со слезами радости»); 2015 — добавлены оттенки кожи; 2016 — расширенное разнообразие профессий и гендеров; ежегодно с тех пор Unicode Consortium утверждает новую партию символов.

## Кто решает, каким эмодзи появиться

Новые эмодзи не рисует один человек — их **предлагают** через формальный процесс в Unicode Consortium. Заявку может подать кто угодно: обычный пользователь, компания, дизайнер. Заявка должна доказать, что символ действительно нужен — обычно через статистику поисковых запросов, частоту использования похожих слов или явный пробел в существующем наборе (так, например, появились эмодзи вока, значка «в разработке» и множества блюд национальных кухонь).

После одобрения Unicode фиксирует **код и краткое описание** символа — но не его внешний вид. Как именно нарисовать утверждённый эмодзи, решает уже каждая платформа сама: поэтому один и тот же символ выглядит по-разному на iPhone, Android и [Windows](../../logos/store/windows/). Это отдельная большая тема — мы разбираем её в статье [«Почему эмодзи отображаются по-разному»](../pochemu-emodzi-otobrazhayutsya-po-raznomu/).

## Сколько эмодзи существует сейчас

В стандарте Unicode 15 (2023) — больше **3700 эмодзи**, включая составные символы (флаги, семьи, профессии с оттенками кожи), которые технически собираются из нескольких базовых кодов через невидимый символ-соединитель ZWJ. Каждый год добавляется 30–100 новых — от предметов быта до культурных символов, которых не хватало в наборе.

:::success Зачем вообще это знать
Эмодзи — не украшение переписки, а полноценная система символов со своей историей, правилами утверждения и стандартизацией на уровне Unicode. Понимание этого помогает: точнее подбирать эмодзи для маркетинга (заявка на новый символ проходит годы отбора не просто так — у него есть чёткий закреплённый смысл), не путать эмодзи со смайликами в текстах про дизайн, и не удивляться, почему один и тот же значок выглядит по-разному у разных получателей.
:::

## Где скачать PNG эмодзи

В [каталоге эмодзи Trace Logo's](../../emoji/) для каждого символа доступны версии **Apple и Google**. На странице эмодзи можно:

- скопировать сам символ в один клик;
- скачать PNG нужного вендора;
- посмотреть код Юникода и категорию.

Поиск работает на русском и английском — найдёте эмодзи по названию или просто по смыслу.

## Коротко

Эмодзи придумал один японский дизайнер в 1999 году для крошечных экранов первых мобильников — а не индустрия комиксов или смайлики, как принято думать. В 2010-м символы вошли в международный стандарт Unicode, и с этого момента их количество и популярность растут ежегодно. Сегодня это полноценная система с формальным процессом утверждения новых знаков — скачать готовые PNG всех вендоров можно в [каталоге эмодзи](../../emoji/).

---EN---

The word "emoji" sounds English, but it's a direct transliteration from Japanese: 絵 (e) — "picture", 文字 (moji) — "character". A picture character. That's not a coincidence — emoji really were born in Japan, created by one specific person in one specific year, not gradually evolved from emoticons as many assume.

:::note TL;DR
Emoji were invented by **Shigetaka Kurita** in 1999 for the Japanese carrier NTT DoCoMo — 176 icons, 12×12 pixels each. They only entered the international **Unicode** standard in 2010, after which Apple added an emoji keyboard to iOS and Google followed on Android. Today the standard has over **3,700 characters** — not just "smileys," but a full alphabet of meaning.
:::

## One person, 176 pictures

In 1999, Japanese designer Shigetaka Kurita was working on the i-mode mobile internet service for carrier NTT DoCoMo. The problem was concrete: early mobile screens were tiny and monochrome, and conveying emotion or context in text messages was awkward — you were already short on characters.

Kurita drew 176 icons at 12×12 pixels: sun, umbrella, heart, smiling face, zodiac signs, transit symbols. His inspirations were manga pictograms (simplified icons used in comics to convey emotion), road signs, and weather symbols from Japanese newspapers. Each icon took up the space of a single character — they could be dropped straight into a message, like a letter.

:::tip Not the same as emoticons
Emoticons are combinations of ordinary keyboard characters: `:)`, `;-)`, `<3`. They existed long before emoji, since the 1980s. Emoji are fundamentally different — not a combination of characters but a **single graphical symbol** with its own code. `:)` is two punctuation marks; 😊 is one Unicode character with its own number, `U+1F60A`.
:::

## How emoji became a global standard

For a long time emoji stayed a purely Japanese phenomenon — each carrier (DoCoMo, au, SoftBank) had its own incompatible set of pictures, and a message with emoji sent from one carrier to another turned into a mess of question marks.

The turning point came in 2007–2010:

1. **2007.** Google began supporting Japanese emoji in Gmail for the Japanese market — and noticed how popular it was.
2. **2009–2010.** Google and Apple jointly submitted a proposal to the **Unicode Consortium** — the body that standardizes every text character in the world — to include emoji in the standard alongside alphabets and mathematical symbols.
3. **2010.** Unicode 6.0 officially added the first 722 emoji characters. From that point emoji stopped being a "Japanese feature" and became part of the internet's text infrastructure — like Cyrillic or Chinese characters.
4. **2011.** Apple opened the emoji keyboard to all iOS users (before that it was a hidden option, known mostly in Japan). Google added Android support a year later.

The growth that followed hasn't stopped since: 2015 — emoji named Oxford Dictionary's Word of the Year (the winner was 😂, "face with tears of joy"); 2015 — skin tone modifiers added; 2016 — expanded profession and gender diversity; every year since, the Unicode Consortium approves a new batch of characters.

## Who decides which emoji gets made

New emoji aren't drawn by one person — they're **proposed** through a formal process at the Unicode Consortium. Anyone can submit a proposal: a regular user, a company, a designer. The proposal has to prove the symbol is genuinely needed — usually via search-volume data, usage frequency of related words, or an obvious gap in the existing set (that's how the wok, the "under construction" sign, and dozens of national dishes made it in).

Once approved, Unicode fixes the **code and a short description** of the character — but not its appearance. How exactly the approved emoji gets drawn is left to each platform; that's why the same character looks different on iPhone, Android and [Windows](../../logos/store/windows/). It's a big topic on its own — we cover it in [Why Emoji Look Different](../pochemu-emodzi-otobrazhayutsya-po-raznomu/).

## How many emoji exist today

Unicode 15 (2023) has over **3,700 emoji**, including composite characters — flags, families, professions with skin tones — which are technically assembled from several base codes joined by an invisible connector, ZWJ. Every year 30–100 new ones are added, from everyday objects to cultural symbols that were missing from the set.

:::success Why this matters
Emoji aren't just decoration for a chat — they're a full character system with its own history, approval rules, and Unicode-level standardization. Knowing this helps you: pick emoji more precisely for marketing (a proposal takes years to clear review for a reason — each one carries a fixed, deliberate meaning), avoid confusing emoji with emoticons in design writing, and not be surprised when the same icon looks different for different recipients.
:::

## Where to download emoji PNG

In the [Trace Logo's emoji catalog](../../emoji/), each character has **Apple and Google** versions available. On an emoji page you can:

- copy the character itself in one click;
- download the PNG for the vendor you need;
- view the Unicode code and category.

Search works in both English and Russian — find emoji by name or simply by meaning.

## In short

Emoji were invented by one Japanese designer in 1999 for the tiny screens of early mobile phones — not by the comics industry or emoticons, as commonly assumed. In 2010 they entered the international Unicode standard, and their number and popularity have grown every year since. Today it's a full system with a formal approval process for new characters — download ready-made PNGs for every vendor in our [emoji catalog](../../emoji/).
