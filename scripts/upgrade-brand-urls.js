#!/usr/bin/env node
/**
 * Заменяет голые сайты на страницы брендбука/лого там, где они известны.
 * node scripts/upgrade-brand-urls.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CATS_DIR = path.join(ROOT, 'logos/categories');
const DRY_RUN = process.argv.includes('--dry-run');

// figma-ключ → страница брендбука/лого/пресс-кита
const UPGRADES = {
  // ── Developers / Real Estate ──────────────────────────────────────────────
  'Icon/Developers/HiTech':         'https://hitdev.ru',

  // ── Meta-экосистема ───────────────────────────────────────────────────────
  'Icon/Social/Facebook':           'https://about.meta.com/brand/resources/facebook/',
  'Icon/Social/Instagram':          'https://about.meta.com/brand/resources/instagram/',
  'Icon/Social/WhatsApp':           'https://about.meta.com/brand/resources/whatsapp/',
  'Icon/Social/WhatsAppBusiness':   'https://about.meta.com/brand/resources/whatsapp/',
  'Icon/Social/Threads':            'https://about.meta.com/brand/resources/threads/',
  'Icon/Social/Meta':               'https://about.meta.com/brand/resources/',

  // ── X / Twitter ───────────────────────────────────────────────────────────
  'Icon/Social/X':                  'https://about.x.com/en/who-we-are/brand-toolkit',

  // ── TikTok ────────────────────────────────────────────────────────────────
  'Icon/Social/TikTok':             'https://newsroom.tiktok.com/en-us/brand-assets',

  // ── Snapchat ──────────────────────────────────────────────────────────────
  'Icon/Social/Snapchat':           'https://www.snap.com/en-US/brand-guidelines',

  // ── Reddit ────────────────────────────────────────────────────────────────
  'Icon/Social/Reddit':             'https://www.redditinc.com/brand',

  // ── LinkedIn ──────────────────────────────────────────────────────────────
  'Icon/B2B/LinkedIn':              'https://brand.linkedin.com',

  // ── Discord ───────────────────────────────────────────────────────────────
  'Icon/VideoCall/Discord':         'https://discord.com/branding',

  // ── Zoom ──────────────────────────────────────────────────────────────────
  'Icon/VideoCall/Zoom':            'https://explore.zoom.us/en/brand-guidelines/',

  // ── Skype ─────────────────────────────────────────────────────────────────
  'Icon/VideoCall/Skype':           'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',

  // ── Teams / Microsoft ─────────────────────────────────────────────────────
  'Icon/VideoCall/Teams':           'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/B2B/Microsoft':             'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/B2B/Windows':               'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/B2B/Xbox':                  'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/Office/MicrosoftExcel':     'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/Office/MicrosoftOneNote':   'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/Office/MicrosoftPowerPoint':'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/Office/MicrosoftWord':      'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/Office/Outlook':            'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/Office/MicrosoftToDo':      'https://to-do.microsoft.com/tasks/',
  'Icon/Search/Edge':               'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/Search/Bing':               'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/B2B/AnyDesk':               'https://anydesk.com/en/brand',

  // ── Android ───────────────────────────────────────────────────────────────
  'Icon/B2B/Android':               'https://developer.android.com/distribute/marketing-tools/brand-guidelines',

  // ── GitHub / GitLab ───────────────────────────────────────────────────────
  'Icon/Dev/GitHub':                'https://github.com/logos',
  'Icon/Dev/GitLab':                'https://about.gitlab.com/press/',

  // ── Slack ─────────────────────────────────────────────────────────────────
  'Icon/Design/Slack':              'https://slack.com/brand-guidelines',

  // ── Dropbox ───────────────────────────────────────────────────────────────
  'Icon/Cloud/Dropbox':             'https://brand.dropbox.com',

  // ── Airbnb ────────────────────────────────────────────────────────────────
  'Icon/Travel/Airbnb':             'https://press.airbnb.com/brand-assets/',

  // ── Spotify ───────────────────────────────────────────────────────────────
  'Icon/Media/Spotify':             'https://developer.spotify.com/documentation/design',

  // ── Coinbase ──────────────────────────────────────────────────────────────
  'Icon/Pay/Coinbase':              'https://www.coinbase.com/brand',

  // ── Revolut ───────────────────────────────────────────────────────────────
  'Icon/Pay/Revolut':               'https://www.revolut.com/press/',

  // ── Klarna ────────────────────────────────────────────────────────────────
  'Icon/BNPL/Klarna':               'https://www.klarna.com/us/business/klarna-brand-guidelines/',

  // ── Google ────────────────────────────────────────────────────────────────
  'Icon/Map/Google':                'https://about.google/brand-resource-center/',
  'Icon/Search/Chrome':             'https://about.google/brand-resource-center/',
  'Icon/Office/Gmail':              'https://about.google/brand-resource-center/',
  'Icon/Office/GoogleCalendar':     'https://about.google/brand-resource-center/',
  'Icon/Office/GoogleDocs':         'https://about.google/brand-resource-center/',
  'Icon/Office/GoogleForms':        'https://about.google/brand-resource-center/',
  'Icon/Office/GoogleKeep':         'https://about.google/brand-resource-center/',
  'Icon/Office/GoogleSheets':       'https://about.google/brand-resource-center/',
  'Icon/Office/GoogleSites':        'https://about.google/brand-resource-center/',
  'Icon/Office/GoogleSlides':       'https://about.google/brand-resource-center/',
  'Icon/Office/GoogleTasks':        'https://about.google/brand-resource-center/',
  'Icon/Cloud/GoogleDrive':         'https://about.google/brand-resource-center/',
  'Icon/Cloud/GooglePhotos':        'https://about.google/brand-resource-center/',
  'Icon/VideoCall/GoogleMeet':      'https://about.google/brand-resource-center/',
  'Icon/VideoCall/GoogleVoice':     'https://about.google/brand-resource-center/',
  'Icon/Social/GoogleChat':         'https://about.google/brand-resource-center/',
  'Icon/Ads/GoogleAds':             'https://about.google/brand-resource-center/',
  'Icon/Ads/GoogleAnalytics':       'https://about.google/brand-resource-center/',
  'Icon/Ads/GooglePageSpeed':       'https://about.google/brand-resource-center/',
  'Icon/Design/GoogleFonts':        'https://about.google/brand-resource-center/',
  'Icon/Assistant/GoogleTranslate': 'https://about.google/brand-resource-center/',
  'Icon/Assistant/GoogleHome':      'https://about.google/brand-resource-center/',
  'Icon/Media/GoogleVids':          'https://about.google/brand-resource-center/',
  'Icon/Pay/GooglePay':             'https://about.google/brand-resource-center/',
  'Icon/Design/Snapseed':           'https://about.google/brand-resource-center/',  // Google продукт

  // ── Apple ─────────────────────────────────────────────────────────────────
  'Icon/Store/AppStore':            'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Search/Safari':             'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Media/AppleMusic':          'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Media/AppleTV':             'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Media/AppleNews':           'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Media/ApplePodcasts':       'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Media/FinalCutPro':         'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Music/GarageBand':          'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Education/AppleBooks':      'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Office/Keynote':            'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Office/Pages':              'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Office/Numbers':            'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Office/AppleCalendar':      'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Office/AppleMail':          'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Office/AppleNotes':         'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Office/AppleReminders':     'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Cloud/ApplePhotos':         'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Cloud/AppleFiles':          'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Cloud/AppleContacts':       'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Cloud/iCloud':              'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Cloud/AirDrop':             'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/AI/Siri':                   'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/AI/AppleIntelligence':      'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/AI/ImagePlayground':        'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Assistant/AppleHome':       'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Assistant/AppleTranslate':  'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Map/AppleMaps':             'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Map/FindMy':                'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Pay/ApplePay':              'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Pay/AppleWallet':           'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Health/AppleHealth':        'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Health/AppleFitness':       'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/AppleWatch':         'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/FaceID':             'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/TouchID':            'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/ApplePasswords':     'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/AppleShortcuts':     'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/AppleCamera':        'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/Journal':            'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/ScreenTime':         'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/iPhoneMirroring':    'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/UniversalControl':   'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/GameCenter':         'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/System/Magnifier':          'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Telecom/ApplePhone':        'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Social/AppleMessages':      'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/Travel/AppleWeather':       'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',
  'Icon/VideoCall/FaceTime':        'https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html',

  // ── Adobe ─────────────────────────────────────────────────────────────────
  'Icon/Design/Illustrator':        'https://www.adobe.com/legal/permissions/trademarks.html',
  'Icon/Design/Photoshop':          'https://www.adobe.com/legal/permissions/trademarks.html',
  'Icon/Design/AdobeAcrobat':       'https://www.adobe.com/legal/permissions/trademarks.html',
  'Icon/Design/AdobeExpress':       'https://www.adobe.com/legal/permissions/trademarks.html',
  'Icon/Design/AdobeFresco':        'https://www.adobe.com/legal/permissions/trademarks.html',
  'Icon/Design/AdobeLightroom':     'https://www.adobe.com/legal/permissions/trademarks.html',
  'Icon/Design/AdobePremiere':      'https://www.adobe.com/legal/permissions/trademarks.html',
  'Icon/Design/AdobeScan':          'https://www.adobe.com/legal/permissions/trademarks.html',

  // ── OpenAI ────────────────────────────────────────────────────────────────
  'Icon/AI/ChatGPT':                'https://openai.com/brand',
  'Icon/AI/ChatGPTAtlas':           'https://openai.com/brand',
  'Icon/AI/Codex':                  'https://openai.com/brand',
  'Icon/AI/DALLE':                  'https://openai.com/brand',
  'Icon/AI/Sora':                   'https://openai.com/brand',
  'Icon/AI/ClaudeCode':             'https://www.anthropic.com',

  // ── Anthropic (Claude) ────────────────────────────────────────────────────
  'Icon/AI/Claude':                 'https://www.anthropic.com',
  'Icon/B2B/Anthropic':             'https://www.anthropic.com',

  // ── VK (уже vk.com/brand, VKVideo) ───────────────────────────────────────
  'Icon/Media/VKVideo':             'https://vk.com/brand',

  // ── Яндекс-сервисы ────────────────────────────────────────────────────────
  'Icon/Search/Yandex':             'https://yandex.ru/adv/brandguide',
  'Icon/Search/YandexBrowser':      'https://yandex.ru/adv/brandguide',
  'Icon/Search/YandexCamera':       'https://yandex.ru/adv/brandguide',
  'Icon/Search/YandexKeyboard':     'https://yandex.ru/adv/brandguide',
  'Icon/Map/YandexMaps':            'https://yandex.ru/adv/brandguide',
  'Icon/Market/YandexMarket':       'https://yandex.ru/adv/brandguide',
  'Icon/Media/YandexMusic':         'https://yandex.ru/adv/brandguide',
  'Icon/Media/YandexDzen':          'https://yandex.ru/adv/brandguide',
  'Icon/AI/Alice':                  'https://yandex.ru/adv/brandguide',
  'Icon/AI/AliceAIPlus':            'https://yandex.ru/adv/brandguide',
  'Icon/AI/AlicePro':               'https://yandex.ru/adv/brandguide',
  'Icon/AI/YandexAIStudio':         'https://yandex.ru/adv/brandguide',
  'Icon/Ads/YandexDirect':          'https://yandex.ru/adv/brandguide',
  'Icon/Ads/YandexDirectPro':       'https://yandex.ru/adv/brandguide',
  'Icon/Ads/YandexMetrika':         'https://yandex.ru/adv/brandguide',
  'Icon/Ads/YandexBusiness':        'https://yandex.ru/adv/brandguide',
  'Icon/Ads/YandexPromoPages':      'https://yandex.ru/adv/brandguide',
  'Icon/Ads/YandexAIHelper':        'https://yandex.ru/adv/brandguide',
  'Icon/Ads/AppMetrica':            'https://yandex.ru/adv/brandguide',
  'Icon/Delivery/YandexGo':         'https://yandex.ru/adv/brandguide',
  'Icon/Delivery/YandexTaxi':       'https://yandex.ru/adv/brandguide',
  'Icon/Delivery/YandexDelivery':   'https://yandex.ru/adv/brandguide',
  'Icon/Delivery/YandexPro':        'https://yandex.ru/adv/brandguide',
  'Icon/Food/YandexFood':           'https://yandex.ru/adv/brandguide',
  'Icon/Food/YandexLavka':          'https://yandex.ru/adv/brandguide',
  'Icon/Office/YandexMail':         'https://yandex.ru/adv/brandguide',
  'Icon/Office/YandexWiki':         'https://yandex.ru/adv/brandguide',
  'Icon/Pay/YandexPay':             'https://yandex.ru/adv/brandguide',
  'Icon/BNPL/YandexSplit':          'https://yandex.ru/adv/brandguide',
  'Icon/Cloud/YandexDisk':          'https://yandex.ru/adv/brandguide',
  'Icon/Cloud/YandexCloud':         'https://yandex.ru/adv/brandguide',
  'Icon/Store/YandexID':            'https://yandex.ru/adv/brandguide',
  'Icon/Store/YandexPlus':          'https://yandex.ru/adv/brandguide',
  'Icon/Assistant/YandexHome':      'https://yandex.ru/adv/brandguide',
  'Icon/Assistant/YandexTranslator':'https://yandex.ru/adv/brandguide',
  'Icon/VideoCall/YandexTelemost':  'https://yandex.ru/adv/brandguide',
  'Icon/Reviews/YandexReviews':     'https://yandex.ru/adv/brandguide',
  'Icon/Reviews/YandexWeather':     'https://yandex.ru/adv/brandguide',
  'Icon/Social/YandexRitm':         'https://yandex.ru/adv/brandguide',
  'Icon/Design/YandexKit':          'https://yandex.ru/adv/brandguide',
  'Icon/Market/Megamarket':         'https://yandex.ru/adv/brandguide',  // СберМегаМаркет → Мегамаркет (Сбер)
  'Icon/Travel/YandexTravel':       'https://yandex.ru/adv/brandguide',
  'Icon/HR/OzonProfit':             'https://ozonprofit.ru',

  // ── Сбер ─────────────────────────────────────────────────────────────────
  'Icon/Bank/Sber':                 'https://brand.sber.ru',
  'Icon/Bank/SberBusiness':         'https://brand.sber.ru',
  'Icon/B2B/SberTech':              'https://sbertech.ru',
  'Icon/Store/SberID':              'https://brand.sber.ru',
  'Icon/Store/SberSpasibo':         'https://spasibosberbank.ru',
  'Icon/Health/SberHealth':         'https://sberhealth.ru',
  'Icon/Assistant/Salut':           'https://salutdevices.ru',
  'Icon/Pay/SberPay':               'https://www.sber.ru/sberpay',
  'Icon/AI/GigaChat':               'https://giga.chat',

  // ── MTS ──────────────────────────────────────────────────────────────────
  'Icon/Telecom/MTS':               'https://press.mts.ru',
  'Icon/Bank/MTS':                  'https://mtsbank.ru/about/brand/',
  'Icon/Pay/MTSMoney':              'https://money.mts.ru',

  // ── Tilda / Webflow / Canva ───────────────────────────────────────────────
  'Icon/Design/Tilda':              'https://tilda.cc/brand/',
  'Icon/Design/Webflow':            'https://webflow.com/press',
  'Icon/Design/Canva':              'https://www.canva.com/about/',

  // ── Другие ПО / сервисы ───────────────────────────────────────────────────
  'Icon/B2B/Asana':                 'https://asana.com/press',
  'Icon/B2B/ClickUp':               'https://clickup.com/brand',
  'Icon/B2B/MondayCom':             'https://monday.com/blog/news/monday-com-brand/',
  'Icon/B2B/Jira':                  'https://www.atlassian.com/brand/downloads',
  'Icon/Dev/Sentry':                'https://sentry.io/press/',
  'Icon/Dev/Linear':                'https://linear.app/brand',
  'Icon/Dev/Amplitude':             'https://amplitude.com/press',
  'Icon/Dev/Hotjar':                'https://www.hotjar.com/press-kit/',
  'Icon/Dev/PostHog':               'https://posthog.com/media',
  'Icon/Dev/Replit':                'https://replit.com/brand',
  'Icon/Dev/Mixpanel':              'https://mixpanel.com/press/',
  'Icon/Dev/GitHub':                'https://github.com/logos',
  'Icon/Dev/GitLab':                'https://about.gitlab.com/press/',
  'Icon/Office/Grammarly':          'https://www.grammarly.com/press',
  'Icon/Office/Todoist':            'https://doist.com/press',
  'Icon/Office/Trello':             'https://trello.com/press',
  'Icon/Office/Evernote':           'https://evernote.com/press',
  'Icon/Office/GoodNotes':          'https://www.goodnotes.com/press',
  'Icon/Office/Craft':              'https://www.craft.do/press',
  'Icon/Office/Notion':             'https://www.notion.so/about',
  'Icon/Office/Bear':               'https://bear.app/press',
  'Icon/App/1Password':             'https://1password.com/press',
  'Icon/App/Bitwarden':             'https://bitwarden.com/press/',
  'Icon/AI/Cursor':                 'https://www.cursor.com/brand',
  'Icon/AI/Perplexity':             'https://www.perplexity.ai/hub/press',
  'Icon/AI/Mistral':                'https://mistral.ai/news/',
  'Icon/AI/DeepSeek':               'https://www.deepseek.com',
  'Icon/AI/ElevenLabs':             'https://elevenlabs.io/press',
  'Icon/AI/Runway':                 'https://runwayml.com/press',
  'Icon/AI/Midjourney':             'https://www.midjourney.com',
  'Icon/AI/NotebookLM':             'https://about.google/brand-resource-center/',
  'Icon/AI/Copilot':                'https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks',
  'Icon/AI/Gemini':                 'https://about.google/brand-resource-center/',
  'Icon/Travel/Booking':            'https://news.booking.com/press-releases/brand-assets/',
  'Icon/Travel/Expedia':            'https://www.expediagroupmedia.com/brand-guidelines',
  'Icon/Travel/Skyscanner':         'https://www.skyscanner.net/media/',
  'Icon/Travel/Flightradar24':      'https://www.flightradar24.com/blog/',
  'Icon/Travel/Airbnb':             'https://press.airbnb.com/brand-assets/',
  'Icon/Media/Netflix':             'https://media.netflix.com/en/press-releases',
  'Icon/Media/DisneyPlus':          'https://www.disneyplus.com/legal',
  'Icon/Media/PrimeVideo':          'https://www.amazon.com/dp/B01BSNPE4W',
  'Icon/Media/Hulu':                'https://www.hulu.com/press',
  'Icon/Media/Crunchyroll':         'https://www.crunchyroll.com/press',
  'Icon/Media/TikTok':              'https://newsroom.tiktok.com/en-us/brand-assets',
  'Icon/Media/Medium':              'https://medium.com/about',
  'Icon/Media/Bloomberg':           'https://www.bloomberg.com/company/',
  'Icon/Media/Reuters':             'https://www.reuters.com/about/',
  'Icon/Media/CNN':                 'https://www.cnn.com/about',
  'Icon/Media/Scribd':              'https://www.scribd.com/press',
  'Icon/BNPL/Afterpay':             'https://www.afterpay.com/en-AU/press-resources',
  'Icon/Pay/CashApp':               'https://cash.app/press',
  'Icon/Pay/MetaMask':              'https://metamask.io/press',
  'Icon/Social/Bumble':             'https://bumble.com/en/about',
  'Icon/Social/Signal':             'https://signal.org/signal-faq/',
  'Icon/Social/Viber':              'https://www.viber.com/en/viber-news/',
  'Icon/Social/Tinder':             'https://www.gotinder.com/press',
  'Icon/Health/Strava':             'https://www.strava.com/press',
  'Icon/Health/Headspace':          'https://www.headspace.com/press',
  'Icon/Health/Fitbit':             'https://investor.fitbit.com/press',
  'Icon/Health/Nike':               'https://about.nike.com/en/newsroom',
  'Icon/Health/NikeRunClub':        'https://about.nike.com/en/newsroom',
  'Icon/Education/Coursera':        'https://www.coursera.org/about/press',
  'Icon/Education/Duolingo':        'https://blog.duolingo.com/press/',
  'Icon/Education/Skillshare':      'https://www.skillshare.com/en/press',
  'Icon/Education/MasterClass':     'https://www.masterclass.com/press',
  'Icon/Game/Roblox':               'https://newsroom.roblox.com',
  'Icon/Game/Minecraft':            'https://www.minecraft.net/en-us/article',
  'Icon/Game/Fortnite':             'https://www.epicgames.com/fortnite/en-US/news',
  'Icon/Telecom/NordVPN':           'https://nordvpn.com/press/',
  'Icon/Telecom/ExpressVPN':        'https://www.expressvpn.com/press',
  'Icon/Telecom/ProtonVPN':         'https://proton.me/press',
  'Icon/Mail/ProtonMail':           'https://proton.me/press',
  'Icon/Design/Procreate':          'https://procreate.com/press',
  'Icon/Design/Canva':              'https://www.canva.com/newsroom/',
  'Icon/Design/Figma':              'https://www.figma.com/brand/',
  'Icon/Design/Miro':               'https://miro.com/press/',
  'Icon/Design/ScreenStudio':       'https://www.screen.studio',
  'Icon/Design/Darkroom':           'https://darkroom.co/press',
  'Icon/Finance/Binance':           'https://www.binance.com/en/press',

  // ── Авито, Ozon (пресс-страницы) ─────────────────────────────────────────
  'Icon/Market/Avito':              'https://press.avito.ru',
  'Icon/Market/Ozon':               'https://press.ozon.ru',
  'Icon/Bank/OzonBank':             'https://press.ozon.ru',

  // ── Alfa ─────────────────────────────────────────────────────────────────
  'Icon/Bank/Alfa':                 'https://alfabank.ru/media/brand/',
  'Icon/Bank/AlfaBusiness':         'https://alfabank.ru/media/brand/',
  'Icon/Insurance/Alfa':            'https://www.alfastrah.ru/about/press/',

  // ── 2ГИС ─────────────────────────────────────────────────────────────────
  'Icon/Map/2GIS':                  'https://info.2gis.ru/press',
};

const files = fs.readdirSync(CATS_DIR).filter(f => f.endsWith('.json')).sort();
let totalUpgraded = 0;

for (const file of files) {
  const filePath = path.join(CATS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!data || !Array.isArray(data.items)) continue;

  let fileModified = false;
  for (const item of data.items) {
    if (!item || typeof item !== 'object') continue;
    const newUrl = UPGRADES[item.figma];
    if (!newUrl || item.brandUrl === newUrl) continue;

    if (DRY_RUN) {
      console.log(`[dry] ${item.figma}:\n      ${item.brandUrl}\n   →  ${newUrl}`);
    } else {
      item.brandUrl = newUrl;
    }
    totalUpgraded++;
    fileModified = true;
  }

  if (fileModified && !DRY_RUN) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✓ ${file}`);
  }
}

console.log(`\nОбновлено: ${totalUpgraded} записей`);
