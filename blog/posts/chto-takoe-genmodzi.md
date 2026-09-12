---
title: Что такое Genmoji — эмодзи, которые генерирует нейросеть
title_en: What Are Genmoji — the AI-Generated Emoji Explained
description: Genmoji в iPhone простыми словами: как создать свой эмодзи по описанию, на каких устройствах работает, что видят собеседники на Android и чем это отличается от обычных эмодзи
description_en: Genmoji on iPhone explained: how to create an emoji from a description, which devices support it, what Android users see, and how it differs from real emoji.
date: 2026-07-22
slug: chto-takoe-genmodzi
tags: Эмодзи, Apple, Нейросети
tags_en: Emoji, Apple, AI
---

Полвека эмодзи были «закрытым клубом»: новые символы утверждает консорциум Юникод, процесс занимает годы, а хотелки вроде «капибара в шляпе» не пройдут никогда. В 2024 году [Apple](../../logos/tech/apple/) сломала эту монополию: функция **Genmoji** генерирует персональный эмодзи по текстовому описанию прямо на телефоне. Разбираем, как это работает, в чём подвох совместимости и что Genmoji значат для будущего эмодзи вообще.

:::note Коротко
**Genmoji** — функция Apple Intelligence (iOS 18.2+): описываете картинку словами («динозавр на скейте», «смеющийся авокадо») — нейросеть на устройстве генерирует эмодзи‑подобную картинку в стиле фирменных эмодзи Apple. Технически это **не эмодзи, а стикер‑изображение**: в Юникод он не входит, на старых устройствах и Android приходит картинкой, а не символом. Требуются совместимые устройства (iPhone 15 Pro и новее).
:::

## Как создать Genmoji

1. Откройте клавиатуру эмодзи в любом поле ввода (Сообщения, заметки и т. д.) на iPhone с iOS 18.2+ и включённым Apple Intelligence.
2. В строке поиска эмодзи наберите описание — например, «кот в костюме космонавта» — и нажмите «Создать Genmoji».
3. Нейросеть предложит несколько вариантов; листайте и выбирайте. Можно уточнять описание — «рыжий кот», «улыбается».
4. Genmoji можно строить и на основе фото людей из вашей галереи — получится персонаж «в стиле эмодзи», похожий на конкретного человека (эта механика — родственник Memoji).
5. Готовый Genmoji вставляется в текст, работает как реакция-«тапбэк» и сохраняется в разделе стикеров — та же логика, что у стикеров Telegram.

Генерация происходит на устройстве (on‑device), без отправки описаний в облако — поэтому и список поддерживаемых устройств ограничен «прошками» и новее: нейросети нужна производительность.

## Главный подвох: это не эмодзи

Настоящий эмодзи — это **символ Юникода**: у 😊 есть код, одинаковый на всех устройствах планеты, а картинку каждый вендор рисует свою — [как это устроено](../pochemu-emodzi-otobrazhayutsya-po-raznomu/), мы объясняли отдельно. Genmoji в Юникоде нет и не будет — это изображение, которое Apple упаковывает в текст особым способом:

| | Обычный эмодзи | Genmoji |
| --- | --- | --- |
| Что это технически | символ Юникода | сгенерированная картинка |
| На новых iPhone | символ в строке | «как эмодзи» в строке |
| На старых iPhone/Mac | символ | картинка или текст с вложением |
| На Android/Windows | символ (своя отрисовка) | обычное изображение‑вложение |
| В поиске, копировании | полноценный текст | изображение |

Практическое следствие: в переписке iPhone ↔iPhone (на свежих версиях) Genmoji выглядит волшебно — встраивается в строку как настоящий эмодзи. В смешанных чатах он приходит собеседникам **картинкой**: не в строке, а отдельным вложением. Для личных чатов это мелочь, а вот [этикет деловой переписки](../emodzi-v-delovoj-perepiske/) — повод не злоупотреблять.

## Зачем это Apple и что это меняет

Genmoji — часть большой стратегии Apple Intelligence, но у него есть и отдельный смысл для мира эмодзи. Полвека выразительность переписки ограничивал комитет: тысячи людей просили эмодзи капибары годами. Генерация снимает ограничение полностью — любой каприз за секунды. Это две философии:

- **Юникод** — общий язык: медленный, зато 😊 понимают все устройства мира одинаково (насколько «одинаково» — [отдельный разговор](../pochemu-emodzi-otobrazhayutsya-po-raznomu/)).
- **Генерация** — личная речь: мгновенная и безграничная, но существующая только внутри одной экосистемы.

Скорее всего, они разделят роли: базовые эмоции останутся за стандартом (никто не будет генерировать «лайк»), а длинный хвост ситуативных картинок заберут генераторы — как это уже произошло со стикерами.

## Ограничения и правила

- **Контент‑фильтры.** Genmoji отказывается генерировать насилие, известных людей и защищённых персонажей — та же логика запретов, что у заявок в Юникод: никаких брендов и конкретных лиц (кроме людей из вашей галереи с их «согласия» через Memoji‑механику).
- **Стиль фиксирован.** Все Genmoji рисуются «под Apple‑эмодзи» — глянцевые, объёмные, на прозрачном фоне. Сгенерировать «в стиле Google» нельзя; сравнить фирменные стили вендоров можно в нашем [каталоге](../../emoji/).
- **Права.** Сгенерированные картинки — для личного общения; использовать их как логотип или коммерческий стикерпак не стоит и юридически мутно — [как нейросети рисуют логотипы и что с правами](../logotip-nejrosetyu/), мы разбирали отдельно.

:::tip Аналоги вне Apple
Идея быстро расходится по индустрии: собственные генераторы эмодзи‑стикеров появились в клавиатурах и мессенджерах на Android, а кастомные эмодзи в Telegram закрывали ту же потребность ещё раньше — правда, требуя готовую картинку вместо текстового описания. Если нужен «свой эмодзи» для бренда или канала — путь через Telegram остаётся самым практичным.
:::

## Итог

Genmoji — самое большое изменение в мире эмодзи со времён их попадания в Юникод: выразительность перестала зависеть от комитета. Но фундамент не отменён: универсальным языком остаются стандартные эмодзи — их 1900+ штук, у каждого свои [значения](../znachenie-populyarnyh-emodzi/) и своя история, и все они, с картинками Apple и Google, собраны в нашем [каталоге эмодзи](../../emoji/).

---EN---

For half a century emoji were a closed club: new symbols are approved by the Unicode Consortium, the process takes years, and wishes like "a capybara in a hat" would never pass. In 2024 [Apple](../../logos/tech/apple/) broke the monopoly: the **Genmoji** feature generates a personal emoji from a text description right on the phone. Here's how it works, the compatibility catch, and what Genmoji mean for the future of emoji.

:::note TL;DR
**Genmoji** is an Apple Intelligence feature (iOS 18.2+): describe a picture in words ("a dinosaur on a skateboard", "a laughing avocado") — an on-device model generates an emoji-like image in the style of Apple's emoji. Technically it's **not an emoji but a sticker image**: it's not in Unicode, and on older devices and Android it arrives as a picture, not a character. Compatible hardware required (iPhone 15 Pro and newer).
:::

## How to create a Genmoji

1. Open the emoji keyboard in any input field (Messages, Notes, etc.) on an iPhone with iOS 18.2+ and Apple Intelligence enabled.
2. Type a description into the emoji search — say, "cat in a spacesuit" — and tap "Create Genmoji".
3. The model offers several variants; swipe and pick. You can refine the description — "ginger cat", "smiling".
4. Genmoji can also be built from photos of people in your library — producing an emoji-style character resembling a specific person (a relative of the Memoji mechanic).
5. The finished Genmoji inserts into text, works as a tapback reaction and lives in your stickers section — the same logic as Telegram stickers.

Generation is on-device, with no descriptions sent to the cloud — which is why the supported-device list starts at the "Pro" tier: the model needs the horsepower.

## The main catch: it's not an emoji

A real emoji is a **Unicode character**: 😊 has a code identical on every device on the planet, while each vendor draws its own artwork — we explain [how that works](../pochemu-emodzi-otobrazhayutsya-po-raznomu/) separately. Genmoji aren't in Unicode and never will be — they're images Apple packs into text in a special way:

| | Regular emoji | Genmoji |
| --- | --- | --- |
| Technically | a Unicode character | a generated image |
| On new iPhones | a character in the line | "like an emoji" in the line |
| On older iPhones/Macs | a character | an image or text with an attachment |
| On Android/Windows | a character (own artwork) | a plain image attachment |
| In search, copy-paste | full-fledged text | an image |

The practical consequence: in iPhone↔iPhone chats (on fresh versions) a Genmoji looks magical — embedded in the line like a real emoji. In mixed chats it arrives as a **picture**: not inline but as an attachment. Trivial for personal chats; [business etiquette](../emodzi-v-delovoj-perepiske/) is a reason not to overuse it at work.

## Why Apple did it and what it changes

Genmoji is part of the larger Apple Intelligence strategy, but it carries its own meaning for the emoji world. For half a century expressiveness was capped by a committee: thousands of people petitioned for a capybara emoji for years. Generation removes the cap entirely — any whim in seconds. Two philosophies:

- **Unicode** — the common language: slow, but 😊 is understood by every device on Earth identically (how "identically" is [its own conversation](../pochemu-emodzi-otobrazhayutsya-po-raznomu/)).
- **Generation** — personal speech: instant and boundless, but existing inside one ecosystem only.

Most likely they'll split roles: base emotions stay with the standard (nobody will generate a "thumbs up"), while the long tail of situational pictures goes to generators — as already happened with stickers.

## Limits and rules

- **Content filters.** Genmoji refuses violence, famous people and protected characters — the same ban logic as Unicode proposals: no brands, no specific persons (except people from your own library via the Memoji mechanic).
- **The style is fixed.** All Genmoji render "Apple-emoji style" — glossy, dimensional, transparent background. You can't generate "Google style"; compare vendor styles in our [catalog](../../emoji/).
- **Rights.** Generated images are for personal communication; using them as a logo or a commercial sticker pack is unwise and legally murky — we cover [how AI draws logos and where the rights stand](../logotip-nejrosetyu/) separately.

:::tip Non-Apple counterparts
The idea is spreading fast: emoji-sticker generators appeared in Android keyboards and messengers, and Telegram's custom emoji served the same need even earlier — though requiring a ready image instead of a text prompt. If you need "your own emoji" for a brand or channel, the Telegram route remains the most practical.
:::

## The takeaway

Genmoji is the biggest change in the emoji world since they entered Unicode: expressiveness no longer depends on a committee. But the foundation stands: the universal language is still the standard emoji — 1,900+ of them, each with its [meanings](../znachenie-populyarnyh-emodzi/) and history, all collected with Apple and Google artwork in our [emoji catalog](../../emoji/).
