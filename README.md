# 🎨 Trace Logos

Большая коллекция логотипов, иконок и эмодзи для разработчиков и дизайнеров. Простой в использовании веб-интерфейс с быстрым поиском и множеством форматов.

**🌐 [Посмотреть на сайте](https://rafael-mansurov.github.io/trace-logos/)**

---

## 📋 Содержание

- [Возможности](#возможности)
- [Структура проекта](#структура-проекта)
- [Быстрый старт](#быстрый-старт)
- [API](#api)
- [Установка локально](#установка-локально)
- [Лицензия](#лицензия)

---

## ✨ Возможности

- 🔍 **Быстрый поиск** — найдите нужный логотип за секунды
- 📦 **Большая коллекция** — 288 логотипов SVG/PNG и 1918 эмодзи Apple, Google, Microsoft
- 🎯 **Множество форматов** — SVG, PNG, ZIP, копирование в буфер
- 😊 **Эмодзи** — полная коллекция эмодзи с индексацией
- 🎨 **Редактор цвета** — HSV-пикер, история изменений, undo/redo прямо в браузере
- 🖼 **Figma-плагин** — вставляйте логотипы и эмодзи прямо на холст Figma: [Trace Logos в Figma Community](https://www.figma.com/community/plugin/1643124536537861799/trace-logos)
- 📱 **Адаптивный дизайн** — работает на любых устройствах
- 📡 **JSON API** — легко интегрировать в свои проекты

---

## 📂 Структура проекта

```
trace-logos/
├── index.html              # Главная страница
├── logos.json             # База данных логотипов
├── emoji.json             # База данных эмодзи
├── logos/                 # Папка с логотипами
├── emoji/                 # Папка с эмодзи
├── icons/                 # Папка с иконками
├── assets/                # Статические ассеты
├── css/                   # Стили
├── js/                    # JavaScript
├── components/            # Компоненты
├── collections/           # Коллекции логотипов
├── templates/             # HTML шаблоны
├── blog/                  # Блог
├── figma-plugin/          # Figma плагин
└── sanitizer/             # Утилиты очистки
```

---

## 🚀 Быстрый старт

### Использование на сайте

1. Перейдите на [https://rafael-mansurov.github.io/trace-logos/](https://rafael-mansurov.github.io/trace-logos/)
2. Используйте поле поиска для поиска нужного логотипа
3. Кликните на логотип для скачивания или копирования ссылки

### Использование JSON API

```javascript
// Получить все логотипы
fetch('/logos.json')
  .then(res => res.json())
  .then(data => console.log(data));

// Получить все эмодзи
fetch('/emoji.json')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 📡 API

### Логотипы

Файл `logos.json` содержит полный индекс всех логотипов:

```json
{
  "name": "Logo Name",
  "slug": "logo-name",
  "category": "category-name",
  "url": "path/to/logo.svg",
  "color": "#000000"
}
```

### Эм��дзи

Файл `emoji.json` содержит данные об эмодзи:

```json
{
  "emoji": "😀",
  "name": "grinning face",
  "category": "smileys-emotion",
  "shortcodes": [":grinning:"]
}
```

### Коллекции

Файл `collections.json` содержит предопределённые коллекции логотипов по темам.

---

## 💻 Установка локально

### Требования

- Node.js 14+
- npm или yarn

### Шаги

```bash
# Клонировать репозиторий
git clone https://github.com/rafael-mansurov/trace-logos.git
cd trace-logos

# Установить зависимости
npm install

# Запустить локальный сервер (опционально)
npm start
```

---

## 🔧 Разработка

### Структура файлов

- **index.html** — главный файл со всем кодом
- **css/style.css** — основные стили
- **js/main.js** — логика приложения
- **collections.json** — метаданные коллекций
- **logos.json** — индекс логотипов
- **emoji.json** — индекс эмодзи

### Добавление нового логотипа

1. Добавьте логотип в папку `logos/`
2. Обновите `logos.json` с новой записью
3. Отправьте Pull Request

---

## 🌐 SEO и метаданные

Проект включает:

- ✅ `sitemap.xml` — для поисковых систем
- ✅ `sitemap-logos.xml` — карта логотипов
- ✅ `sitemap-emoji.xml` — карта эмодзи
- ✅ `robots.txt` — инструкции для ботов
- ✅ `llms.txt` — информация для LLM

---

## 📦 Используется в

- Веб-разработке
- Дизайне интерфейсов
- Figma плагинах
- Документации проектов
- Маркетинговых материалах

---

## 🤝 Вклад

Приветствуются любые улучшения! Пожалуйста:

1. Форкните репозиторий
2. Создайте ветку для вашего изменения (`git checkout -b feature/amazing-feature`)
3. Коммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📄 Лицензия

Этот проект находится в открытом доступе. Уточните условия использования конкретных логотипов, так как они могут быть защищены авторским правом их владельцев.

---

## 📧 Контакты

- GitHub: [@rafael-mansurov](https://github.com/rafael-mansurov)
- Веб-сайт: [https://rafael-mansurov.github.io/trace-logos/](https://rafael-mansurov.github.io/trace-logos/)

---

## 🙏 Благодарности

Спасибо всем, кто помогает развивать этот проект!

---

**Made with ❤️ by [Rafael Mansurov](https://github.com/rafael-mansurov)**
