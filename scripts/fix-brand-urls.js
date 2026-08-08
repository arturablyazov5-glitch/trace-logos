#!/usr/bin/env node
/**
 * Патчит неверные brandUrl в logos/categories/*.json.
 * Запускать: node scripts/fix-brand-urls.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CATS_DIR = path.join(ROOT, 'logos/categories');
const DRY_RUN = process.argv.includes('--dry-run');

// Замены: старый URL → новый URL (применяются ко всем items по значению brandUrl)
const URL_FIXES = {
  // === Совсем неверные домены ===
  'https://snapseed.online':                             'https://play.google.com/store/apps/details?id=com.niksoftware.snapseed',  // gambling-сайт!
  'https://openscreen.ru':                               'https://openscreen.net',
  'https://taptop.io':                                   'https://taptop.pro',
  'https://migbank.ru':                                  'https://migcredit.ru',
  'https://www.zeekr.eu':                                'https://zeekr.com.ru',
  'https://nanoba.ru':                                   'https://fusionbrain.ai',  // NanoBanana не найден, заменяем на Kandinsky/SberAI
  // === Sber — неверные пути ===
  'https://sber.ru/salut':                               'https://salutdevices.ru',
  'https://www.sber.ru/sberpay/':                        'https://www.sber.ru/sberpay',
  'https://www.sber.ru/business/':                       'https://www.sber.ru/business',

  // === Anthropic ===
  'https://www.anthropic.com/brand':                     'https://www.anthropic.com',

  // === Figma ===
  'https://www.figma.com/brand/':                        'https://www.figma.com',

  // === WhatsApp brand policy → 404 ===
  'https://www.whatsapp.com/legal/brand-policy':         'https://business.whatsapp.com',

  // === Yandex несуществующие пути ===
  'https://ritm.yandex.ru':                              'https://yandex.ru',
  'https://yandex.ru/turbo':                             'https://yandex.ru/turbo/publisher',

  // === Яндекс Маркет Экспресс ===
  'https://market.yandex.ru/express':                    'https://market.yandex.ru',

  // === Apple ios/* страницы → 404 (Apple переделал структуру) ===
  'https://www.apple.com/ios/camera/':                   'https://www.apple.com/iphone/camera/',
  'https://www.apple.com/ios/notes/':                    'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/calendar/':                 'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/contacts/':                 'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/clock/':                    'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/journal/':                  'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/measure/':                  'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/photos/':                   'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/reminders/':                'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/settings/':                 'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/shortcuts/':                'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/stocks/':                   'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/voice-memos/':              'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/weather/':                  'https://www.apple.com/iphone/',

  // === Apple feature pages → 404 ===
  'https://www.apple.com/freeform/':                     'https://www.apple.com/app-store/',
  'https://www.apple.com/passwords/':                    'https://support.apple.com/passwords',
  'https://www.apple.com/iphone-mirroring/':             'https://support.apple.com/iphone-mirroring',
  'https://www.apple.com/macos/airdrop/':                'https://support.apple.com/airdrop',
  'https://www.apple.com/macos/universal-control/':      'https://support.apple.com/universal-control',
  'https://www.apple.com/screen-time/':                  'https://support.apple.com/screen-time',
  'https://www.apple.com/touch-id/':                     'https://support.apple.com/touch-id',
  'https://www.apple.com/face-id/':                      'https://support.apple.com/face-id',
  'https://www.apple.com/accessibility/magnifier/':      'https://support.apple.com/accessibility',
  'https://www.apple.com/translate/':                    'https://www.apple.com/iphone/',
  'https://www.apple.com/game-center/':                  'https://www.apple.com/app-store/',
  'https://www.apple.com/files/':                        'https://www.apple.com/iphone/',
  'https://www.apple.com/ios/contacts/':                 'https://www.apple.com/iphone/',

  // === Apple support guide pages → 404 ===
  'https://support.apple.com/guide/archive-utility':     'https://support.apple.com',
  'https://support.apple.com/guide/bluetooth-file-exchange': 'https://support.apple.com',
  'https://support.apple.com/guide/tips':                'https://www.apple.com',
  'https://support.apple.com/guide/chess':               'https://support.apple.com',
  'https://support.apple.com/guide/stickies':            'https://support.apple.com',
  'https://support.apple.com/guide/textedit':            'https://support.apple.com',
  'https://support.apple.com/guide/mac-help':            'https://support.apple.com',
  'https://support.apple.com/guide/calculator':          'https://support.apple.com',
  'https://support.apple.com/guide/digital-color-meter': 'https://support.apple.com',
  'https://support.apple.com/guide/font-book':           'https://support.apple.com',
  'https://support.apple.com/guide/grapher':             'https://support.apple.com',
  'https://support.apple.com/guide/preview':             'https://support.apple.com',
  'https://support.apple.com/guide/dictionary':          'https://support.apple.com',
  'https://support.apple.com/guide/console':             'https://developer.apple.com',
  'https://support.apple.com/guide/automator':           'https://support.apple.com',
  'https://support.apple.com/guide/quicktime-player':    'https://support.apple.com',
  'https://support.apple.com/guide/photo-booth':         'https://support.apple.com',
  'https://support.apple.com/guide/iphone/control-center-iphb8f1bf206': 'https://support.apple.com',
  'https://support.apple.com/guide/iphone/magnifier-iphcc97e8d7e':      'https://support.apple.com',
  'https://support.apple.com/guide/iphone/picture-in-picture-iphe7f15003e': 'https://support.apple.com',
  'https://support.apple.com/guide/mac-help/mh26782':    'https://support.apple.com',
  'https://support.apple.com/guide/snapseed':            'https://play.google.com/store/apps/details?id=com.niksoftware.snapseed',
  'https://support.apple.com/guide/terminal':            'https://support.apple.com',
  'https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/AppleScriptX/AppleScriptX.html': 'https://developer.apple.com',

  // === Литрес — несуществующие подстраницы ===
  'https://www.litres.ru/library/':                      'https://www.litres.ru',
  'https://www.litres.ru/subscription/':                 'https://www.litres.ru/pages/subscription/',
  'https://www.litres.ru/drafts/':                       'https://www.litres.ru',
  'https://www.litres.ru/app/':                          'https://www.litres.ru',

  // === Magnit ===
  'https://magnit.ru/program/':                          'https://magnit.ru/loyalty/',

  // === Minecraft / Mojang ===
  'https://www.minecraft.net/about-mojang':              'https://www.minecraft.net/en-us/about-mojang',

  // === Porsche ===
  'https://www.porsche.com/russia/':                     'https://www.porsche.com/russia/en/',

  // === Microsoft To Do ===
  'https://todo.microsoft.com':                          'https://to-do.microsoft.com/tasks/',

  // === Игры — 404 ===
  'https://diablo.blizzard.com/en-us/immortal':          'https://diablo.blizzard.com',
  'https://nekki.com/en/shadow-fight-4/':                'https://nekki.com',
  'https://prisma-ai.com/lensa':                         'https://prisma-ai.com',

  // === PayPal branding → 404 ===
  'https://developer.paypal.com/branding/':              'https://www.paypal.com',

  // === Miro branding → 404 (уже было в каталоге) ===
  'https://miro.com/about/brand/':                       'https://miro.com',
};

// Дополнительные фиксы по figma-ключу (когда нужно исправить конкретную запись, а не по URL)
const FIGMA_FIXES = {
  'Icon/Social/YandexRitm': 'https://yandex.ru',
};

const files = fs.readdirSync(CATS_DIR).filter(f => f.endsWith('.json')).sort();
let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(CATS_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.items)) continue;

  let fileModified = false;

  for (const item of data.items) {
    if (!item || typeof item !== 'object') continue;

    // Фикс по figma-ключу
    if (item.figma && FIGMA_FIXES[item.figma] && item.brandUrl !== FIGMA_FIXES[item.figma]) {
      if (DRY_RUN) {
        console.log(`[dry] ${item.figma}: ${item.brandUrl} → ${FIGMA_FIXES[item.figma]}`);
      } else {
        item.brandUrl = FIGMA_FIXES[item.figma];
      }
      totalFixed++;
      fileModified = true;
    }

    // Фикс по значению URL
    if (item.brandUrl && URL_FIXES[item.brandUrl]) {
      if (DRY_RUN) {
        console.log(`[dry] ${item.figma}: ${item.brandUrl} → ${URL_FIXES[item.brandUrl]}`);
      } else {
        item.brandUrl = URL_FIXES[item.brandUrl];
      }
      totalFixed++;
      fileModified = true;
    }
  }

  if (fileModified && !DRY_RUN) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✓ ${file}`);
  }
}

console.log(`\nИсправлено: ${totalFixed} записей`);
