---
title: Почему не отображаются эмодзи — квадратики, вопросики и флаги на Windows
title_en: Why Emoji Don't Display — Boxes, Question Marks and Flags on Windows
description: Вместо эмодзи квадратик □, ромб с вопросом или буквы RU? Разбираем все причины: старая ОС, новые эмодзи, флаги на Windows, шрифты — и как это починить.
description_en: Seeing □ boxes, diamond question marks or letters like RU instead of emoji? Every cause explained — old OS, new emoji, flags on Windows, fonts — and the fixes.
date: 2026-07-08
slug: pochemu-ne-otobrazhayutsya-emodzi
tags: Эмодзи, Проблемы, Технологии
tags_en: Emoji, Troubleshooting, Technology
---

Вам прислали сообщение, а в нём — квадратик □. Или ромбик с вопросом �. Или вместо флага страны — просто буквы RU. Собеседник уверен, что отправил симпатичный эмодзи, вы видите мусор, и оба не понимаете, кто сломался. Спокойно: не сломался никто — так устроена система эмодзи. Разбираем каждый вид «кракозябры», её причину и способы лечения.

:::note Коротко
Квадратик □ означает: **ваше устройство не знает этот символ** — обычно эмодзи новее, чем ваша система. Лечение — обновить ОС или приложение. Флаги стран буквами (RU, US) — особый случай: **[Windows](../../logos/tech/windows/) принципиально не рисует флаги‑эмодзи**, и это не чинится настройками. � — символ побился при передаче из‑за кодировки.
:::

## Как вообще эмодзи попадает на экран

Коротко о механике (подробный разбор — в статье [почему эмодзи отображаются по‑разному](../pochemu-emodzi-otobrazhayutsya-po-raznomu/)): эмодзи — это код символа Unicode, а картинку для него рисует **шрифт вашей системы** (Apple Color Emoji, Segoe UI Emoji, Noto). Отсюда простое следствие: если в системном шрифте нет картинки для пришедшего кода — показать нечего, и система рисует заглушку. Вид заглушки подсказывает диагноз.

## Квадратик □ или ▯: система не знает символ

**Диагноз.** Пришёл эмодзи из свежей версии стандарта, а ваша ОС вышла раньше и в её шрифте этого символа нет. Новые эмодзи появляются каждый год (стандарт Unicode обновляется осенью, платформы подтягивают картинки в течение следующего года), поэтому свежайшие символы стабильно превращаются в квадратики у всех, кто не обновился.

**Лечение:**

1. **Обновите систему** — новые наборы эмодзи приезжают с обновлениями iOS, Android, [Windows](../../logos/tech/windows/) и macOS. Это единственное настоящее лечение.
2. **Обновите приложение.** Некоторые мессенджеры (Telegram, WhatsApp) рисуют эмодзи собственным набором и показывают новинки даже на старой ОС.
3. Устройство больше не обновляется? Тогда честный ответ — никак: без картинки в шрифте символ не отрисовать. Посмотреть, как выглядит загадочный эмодзи, можно в веб‑каталоге — например, [нашем](../../emoji/).

**Для отправителей** работает обратное правило: хотите, чтобы вас поняли все, — не используйте эмодзи первого года жизни в рассылках и важных сообщениях. Мы разбирали это в [статье про эмодзи в маркетинге](../emodzi-v-marketinge/).

## Ромб с вопросом �: символ побился в дороге

**Диагноз.** � — это специальный «символ замены» (replacement character): он означает, что байты испортились при передаче — где‑то текст перекодировали с ошибкой. Классические места поломки: экспорт из старых систем, письма с неверной кодировкой, копипаста через несколько программ, базы данных без поддержки четырёхбайтовых символов (старый MySQL с utf8 вместо utf8mb4 — знаменитая ловушка, съевшая миллионы эмодзи).

**Лечение.** На принимающей стороне — никакого: информация уже утрачена, восстановить эмодзи из � нельзя. Просите переслать заново. Если � рождается в вашей системе (сайт, база, выгрузка) — чините кодировку: везде UTF‑8, в MySQL — utf8mb4.

## Флаги буквами: RU вместо флага

Самый любопытный случай. Флаг страны в Unicode — это **не отдельный символ, а пара букв‑индикаторов**: RU = R + U, и шрифт сам склеивает пару в картинку флага. Так вот: **[Windows](../../logos/tech/windows/) — единственная крупная платформа, которая флаги стран не рисует принципиально**: Microsoft никогда не добавляла их в Segoe UI Emoji, и вместо флага вы видите буквы. Это осознанное решение компании (геополитика флагов — минное поле: чей Крым, чей Тайвань — Microsoft предпочла не отвечать на такие вопросы шрифтом), а не поломка.

**Лечение:**

- В браузере — частично помогают расширения, подменяющие системные эмодзи веб‑версиями (например, на набор Twemoji).
- В Telegram Desktop и некоторых приложениях флаги видны — потому что приложение рисует эмодзи своим набором, минуя системный шрифт.
- Системно — никак: это позиция платформы, ждать её смены не стоит.

## Чёрно‑белый контур вместо цветного эмодзи

**Диагноз.** Символ существует в двух вариантах: текстовом (монохромный контур) и эмодзи (цветная картинка) — а приложение выбрало текстовый. Так себя ведут Word, некоторые редакторы и старые программы: ☺ вместо 😊, ✈ вместо цветного самолётика.

**Лечение.** Обычно и не нужно: у получателей на телефонах символ отрисуется цветным. Принудительно сделать эмодзи цветным можно, добавив после него невидимый «селектор эмодзи» (VS16) — каталоги и панели эмодзи обычно вставляют символы уже с ним.

## Таблица диагнозов

| Что видно | Причина | Лечение |
| --- | --- | --- |
| □ квадратик | эмодзи новее вашей ОС | обновить ОС/приложение |
| � ромб с вопросом | битая кодировка при передаче | переслать заново; чинить UTF‑8 |
| RU, US буквами | [Windows](../../logos/tech/windows/) не рисует флаги | расширение браузера / смириться |
| ☺ чёрно‑белый контур | текстовый вариант символа | обычно не требуется |
| пустое место | символ‑невидимка (ZWJ и пр.) | это служебный символ, всё в порядке |

## Как проверить конкретный эмодзи

1. Откройте [каталог эмодзи](../../emoji/) и найдите символ — увидите, как он должен выглядеть (в стилях Apple и Google), его название и когда он появился.
2. Сравните: у вас в системе он выглядит так же? Квадратик — значит, дело в возрасте вашей ОС.
3. Для рассылок и интерфейсов держите правило двух платформ: проверяйте вид эмодзи минимум на iPhone и Android до отправки.

## Коротко

Квадратик — обновляйтесь; ромб с вопросом — символ погиб в кодировках, просите переслать; флаги на [Windows](../../logos/tech/windows/) — не баг, а принципиальная позиция Microsoft. Эмодзи — это код, который каждая система рисует своим шрифтом: когда картинки для кода нет, вы видите заглушку.

Проверить любой эмодзи — как он выглядит, как называется и у кого отобразится — можно в нашем [каталоге эмодзи](../../emoji/): картинки Apple и Google рядом, копирование одним кликом.

---EN---

Someone sends you a message and it contains a box □. Or a diamond with a question mark �. Or plain letters RU where a country flag should be. The sender is sure they sent a nice emoji, you see junk, and neither of you knows what broke. Relax: nothing broke — that's how the emoji system works. Let's diagnose every kind of garbage character, its cause and its cure.

:::note TL;DR
A box □ means **your device doesn't know that character** — usually the emoji is newer than your system. The cure is updating the OS or the app. Country flags shown as letters (RU, US) are a special case: **[Windows](../../logos/tech/windows/) deliberately doesn't draw flag emoji**, and no setting fixes it. � means the character got corrupted in transit by an encoding error.
:::

## How an emoji reaches your screen

The quick mechanics (full story in [why emoji look different everywhere](../pochemu-emodzi-otobrazhayutsya-po-raznomu/)): an emoji is a Unicode character code, and the picture is drawn by your **system's font** (Apple Color Emoji, Segoe UI Emoji, Noto). The consequence: if the font has no artwork for an incoming code, there's nothing to show — the system draws a placeholder. The placeholder's look is your diagnosis.

## The box □: the system doesn't know the character

**Diagnosis.** An emoji from a fresh standard release arrived, and your OS predates it. New emoji ship every year (Unicode updates in the fall; platforms roll out artwork over the following year), so the newest symbols reliably turn into boxes for everyone who hasn't updated.

**Treatment:**

1. **Update the system** — new emoji sets arrive with iOS, Android, [Windows](../../logos/tech/windows/) and macOS updates. The only real cure.
2. **Update the app.** Some messengers (Telegram, WhatsApp) draw emoji with their own sets and show new ones even on old systems.
3. Device no longer updates? Then honestly — no fix: without artwork in the font, the character can't render. You can at least see what the mystery emoji looks like in a web catalog — for example, [ours](../../emoji/).

**For senders** the rule inverts: want to be understood by everyone — avoid first-year emoji in newsletters and important messages. Covered in [emoji in marketing](../emodzi-v-marketinge/).

## The diamond �: corrupted in transit

**Diagnosis.** � is the special "replacement character": bytes got mangled — somewhere the text was re-encoded incorrectly. Classic crime scenes: exports from legacy systems, emails with wrong encodings, copy-paste chains across programs, databases without four-byte support (old MySQL's utf8 instead of utf8mb4 — the famous trap that ate millions of emoji).

**Treatment.** On the receiving end — none: the information is gone; ask for a resend. If the � is born in your own system (site, database, export) — fix the encoding: UTF-8 everywhere, utf8mb4 in MySQL.

## Flags as letters: RU instead of a flag

The most curious case. A country flag in Unicode is **not a single character but a pair of indicator letters**: RU = R + U, and the font itself fuses the pair into flag artwork. And here's the thing: **[Windows](../../logos/tech/windows/) is the only major platform that deliberately doesn't draw country flags** — Microsoft never added them to Segoe UI Emoji, so you see the letters. It's a conscious decision (flag geopolitics is a minefield, and Microsoft chose not to answer such questions with a font), not a malfunction.

**Treatment:**

- In browsers — extensions that substitute web emoji sets (e.g. Twemoji) partially help.
- Telegram Desktop and some apps show flags — they render emoji with their own sets, bypassing the system font.
- System-wide — no fix: it's platform policy; don't wait for it to change.

## A black-and-white outline instead of color

**Diagnosis.** The character exists in two presentations: text (monochrome outline) and emoji (color artwork) — and the app picked text. Word and some editors behave this way: ☺ instead of 😊.

**Treatment.** Usually unnecessary: on recipients' phones it renders in color. To force color, an invisible "emoji presentation selector" (VS16) follows the character — catalogs and emoji panels usually insert symbols with it already attached.

## The diagnosis table

| What you see | Cause | Fix |
| --- | --- | --- |
| □ box | emoji newer than your OS | update OS/app |
| � replacement diamond | encoding corrupted in transit | resend; fix UTF-8 |
| RU, US as letters | [Windows](../../logos/tech/windows/) doesn't draw flags | browser extension / acceptance |
| ☺ monochrome outline | text presentation of the symbol | usually none needed |
| empty gap | an invisible control character (ZWJ etc.) | it's a service character, all is well |

## Checking a specific emoji

1. Open the [emoji catalog](../../emoji/) and find the symbol — you'll see how it should look (Apple and Google styles), its name and when it was introduced.
2. Compare with your system. A box means your OS's age is the issue.
3. For newsletters and interfaces, keep the two-platform rule: check the emoji on at least iPhone and Android before sending.

## In short

A box — update; the question diamond — the character died in encoding, ask for a resend; flags on [Windows](../../logos/tech/windows/) — not a bug but Microsoft's standing policy. An emoji is a code each system draws with its own font: when the artwork is missing, you get a placeholder.

Check any emoji — its look, name and who will see it — in our [emoji catalog](../../emoji/): Apple and Google artwork side by side, one-click copy.
