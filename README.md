# 🎨 Trace Logos

Бесплатный каталог логотипов российских и международных брендов в SVG и PNG, а также эмодзи Apple, Google и Microsoft. Поиск, редактор цветов, экспорт в Figma.

**🌐 [trace-logos.ru](https://trace-logos.ru/)** · [English](https://trace-logos.ru/en/)

---

## 📋 Содержание

- [Возможности](#возможности)
- [Структура проекта](#структура-проекта)
- [API](#api)
- [Добавление логотипа](#добавление-логотипа)
- [Авторские права и использование материалов](#авторские-права-и-использование-материалов)

---

## ✨ Возможности

- 📦 **Каталог** — 800+ логотипов в 44 категориях и 1918 эмодзи; страница у каждого логотипа
- 🔍 **Поиск** по-русски и по-английски, с исправлением неверной раскладки (RU↔EN)
- 🎨 **Редактор цветов** — HSV-пикер, история, undo/redo прямо в браузере
- 🎯 **Экспорт** — SVG, PNG, копирование в буфер, ZIP-архив выбранных, Figma-ready SVG
- 🧩 **Варианты** — горизонтальные версии, латиница, прежние логотипы
- 🖼 **Figma-плагин** — [Trace Logos в Figma Community](https://www.figma.com/community/plugin/1643124536537861799/trace-logos)
- 🌍 **Два языка** — русский и английский (`/en/`)
- 📡 **JSON API** — каталог в машиночитаемом виде

Сайт — статический, без фреймворка: Vanilla JS (ES-модули) и HTML, собранные скриптами из JSON-данных.

---

## 📂 Структура проекта

```
trace-logos/
├── logos/                 # данные и страницы логотипов (manifest.json, categories/*.json)
├── emoji/                 # данные и страницы эмодзи
├── icons/                 # каталог иконок
├── collections/           # тематические подборки
├── blog/                  # блог
├── assets/                # SVG, PNG, превью, OG-картинки
├── js/, css/, components/ # клиентский код и стили
├── templates/             # HTML-шаблоны и партиалы
├── scripts/               # генераторы страниц, тесты, сборка
├── tools/                 # Figma-плагины и расширения для браузера
├── supabase/              # серверные функции
└── logos.json, emoji.json # публичные индексы
```

---

## 📡 API

Файлы лежат в корне сайта и обновляются при каждой сборке.

| Файл | Содержимое |
|---|---|
| [`/logos.json`](https://trace-logos.ru/logos.json) | плоский список всех логотипов |
| [`/emoji.json`](https://trace-logos.ru/emoji.json) | список эмодзи |
| `/logos/<категория>.json` | логотипы одной категории |
| [`/llms.txt`](https://trace-logos.ru/llms.txt) | описание сайта для LLM |

Запись логотипа в `logos.json`:

```json
{
  "name": "Ozon",
  "tags": "озон ozon.ru",
  "url": "https://trace-logos.ru/logos/market/ozon/",
  "svgUrl": "https://trace-logos.ru/assets/logos/svgs/ozon.svg",
  "pngUrl": "https://trace-logos.ru/assets/logos/pngs/apple/26/color/ozon-2026.png",
  "formats": ["svg", "png"],
  "categorySlug": "market",
  "dateAdded": "2026-05-19",
  "variants": [
    { "label": "Full", "svgUrl": "https://trace-logos.ru/assets/logos/svgs/ozon-full.svg", "wide": true }
  ]
}
```

`svgUrl` может отсутствовать, если у бренда есть только PNG.

```javascript
const { logos } = await fetch('https://trace-logos.ru/logos.json').then(r => r.json());
console.log(logos.length);
```

---

## ➕ Добавление логотипа

1. Положите SVG в `assets/logos/svgs/` (или PNG в `assets/logos/pngs/`).
2. Добавьте запись в подходящий файл `logos/categories/*.json`: `name`, `tags`, `figma`, `file`, `dateAdded`, `about`, `desc`, `brandUrl`.
3. Откройте Pull Request.

Не знаете, как оформить, или нет файла — предложите логотип через форму на [сайте](https://trace-logos.ru/).

---

## Авторские права и использование материалов

Trace Logo's предоставляет бесплатный доступ к каталогу логотипов брендов.
Товарные знаки и логотипы принадлежат соответствующим правообладателям;
используйте их в своих проектах с соблюдением прав владельцев.

Оригинальные тексты, дизайн, творческий подбор и расположение материалов,
а также иные охраняемые результаты интеллектуальной деятельности проекта
защищаются законодательством в пределах принадлежащих правообладателям прав.
Бесплатный доступ не означает разрешения копировать защищаемые материалы
и создавать на их основе клоны сервиса. При этом права по ISC для кода,
MIT для публичных интеграций и ранее предоставленные разрешения сохраняются.

Основной сайт: `UNLICENSED`, `private: true` — новая общая лицензия на пакет
не предоставляется, случайная публикация в npm предотвращается. Это не делает
GitHub-репозиторий закрытым и не отменяет прежнюю ISC. Публичные инструменты
из отдельного проекта `trace-logos-integrations` сохраняют MIT.

Подробнее: [разграничение прав](COPYRIGHT.md), [лицензирование кода](LICENSE),
[правила использования сайта](https://trace-logos.ru/terms/).

**Copyright and use of materials.** Trace Logo's provides free access to brand
logos, which remain the property of their respective rights holders. Original
text, design and creative selection or arrangement are protected to the extent
that the project’s rights holders hold those rights. Free access does not
license copying protected materials to build clones. ISC code permissions,
MIT integration licenses and earlier permissions remain effective.
The main website uses `UNLICENSED` and `private: true`: no new blanket package
license is granted and npm publication is prevented. The GitHub repository
remains public; earlier ISC rights and the separate tools’ MIT licenses remain
effective.
See [copyright details (RU/EN)](COPYRIGHT.md) and
[website terms (EN)](https://trace-logos.ru/en/terms/).

---

## 📧 Контакты

- GitHub: [@rafael-mansurov](https://github.com/rafael-mansurov)
- Сайт: [trace-logos.ru](https://trace-logos.ru/)

**Made with ❤️ by [Rafael Mansurov](https://github.com/rafael-mansurov)**
