// Tilda Helper — точка входа content-script'а (world: MAIN).
//
// Фичи в одном бандле:
//  1. badges.js     — ID блока (#recXXXX) и CSS-класс рядом с кнопками панели +
//                     иконочная верхняя панель редактора.
//  2. zindex.js     — поле «Z-index» в сайдбаре блока → отдельный T123-carrier
//                     под блоком + live-превью CSS в редакторе.
//  2a. attributes.js — кнопка «Добавить атрибут» в сайдбаре → T123-carrier со
//                     <script>, вешающим произвольный атрибут на #recXXXX.
//  3. multipreview.js — 3 viewport'а рядом с синхроскроллом на published-странице.
//  4. powermode.js  — автовключение продвинутого режима на страницах
//                     списка проектов/страниц (/projects/…).
//  5. blocktypes.js — точечные UI-подпорки под конкретные типы блоков
//                     (T123/T178/T228/DV11): скрытие кнопок панели и полей
//                     сайдбара «Настройки».
//  6. breadcrumbs.js — крошки страниц-предков (по alias) в шапке редактора.
//  7. zeroblock.js  — редактор Zero-блока (iframe tilda.ru/zero/…): авто-клик
//                     «Открыть» настроек Zero Block + дропдаун языка всегда
//                     по умолчанию English.
//
// Панели/сайдбары Tilda пересоздаются при изменениях страницы, поэтому фичи
// редактора поддерживаются идемпотентным периодическим проходом tick()
// (интервал), а не разовой вставкой.

import { injectStyles } from './styles.js';
import { updateBadges, updateTopToolbar } from './badges.js';
import {
  applyLiveCssPreview,
  getEffectiveZIndexMap,
  updateZIndexSidebarField,
  ensureReorderPatched,
  reorderMisplacedCarriers,
} from './zindex.js';
import {
  applyLiveAttrPreview,
  getEffectiveAttrMap,
  updateAttributeSidebarField,
} from './attributes.js';
import {
  injectMultiPreviewButton,
  isMultiPreviewTarget,
  buildMultiPreviewOverlay,
} from './multipreview.js';
import { initProjectsPowerMode } from './powermode.js';
import { initFolderHierarchy } from './folders.js';
import { initPageHierarchy } from './pagehierarchy.js';
import { initFriday37PageBatch } from './pagecreate.js';
import { updateHiddenSidebarFields } from './blocktypes.js';
import { updateT123CopyButtons } from './copycode.js';
import { updatePopupOpenButtons } from './popupopen.js';
import { updateAnchorCopyButtons } from './anchorcopy.js';
import { updateLibraryOrder, updateLibraryExpanded, updateLibraryFaqSection } from './library.js';
import { runZeroBlockAutomations } from './zeroblock.js';
import { runZeroConstraints } from './zeroconstraints.js';
import { runUpscaleToggle } from './upscaletoggle.js';
import { initTreelistHierarchy } from './treelist.js';
import {
  initEditorBreadcrumbs,
  updateEditorBreadcrumbs,
  updateFolderBreadcrumbs,
} from './breadcrumbs.js';
import {
  initTokens,
  injectTokensButton,
  applyTokensLivePreview,
  updateTokenBindings,
  updateZeroTokenBindings,
  adoptDuplicatedZeroBindings,
  adoptDuplicatedZeroElems,
  ensureBlockCopyHooksPatched,
} from './tokens.js';
import { injectZeroImportButton } from './zeroimport.js';
import { syncZeroZIndexToParent } from './zeroindex.js';
import { injectZeroActionIconStyles } from './actionicons.js';
import { initZeroComponents, updateZeroComponents } from './components.js';

// Изоляция фич: Tilda без предупреждения меняет вёрстку/атрибуты, и упавшая
// на этом фича не должна обрывать tick() и гасить остальные. Один warn на
// фичу за сессию — иначе интервал в 700 мс заспамит консоль.
const brokenFeatures = new Set();
function safe(name, fn) {
  try {
    fn();
  } catch (e) {
    if (brokenFeatures.has(name)) return;
    brokenFeatures.add(name);
    console.warn(`[Tilda Helper] сломалась фича «${name}» (дальнейшие ошибки этой фичи не логируются):`, e);
  }
}

function tick() {
  safe('бейджи блоков', updateBadges);
  safe('верхняя панель', updateTopToolbar);
  safe('мультипревью: кнопка', injectMultiPreviewButton);
  safe('z-index: live-превью CSS', () => applyLiveCssPreview(getEffectiveZIndexMap()));
  safe('z-index: поле сайдбара', updateZIndexSidebarField);
  safe('атрибуты: live-превью', () => applyLiveAttrPreview(getEffectiveAttrMap()));
  safe('атрибуты: поле сайдбара', updateAttributeSidebarField);
  safe('скрытие полей сайдбара', updateHiddenSidebarFields);
  safe('T123: кнопка «Скопировать»', updateT123CopyButtons);
  safe('попапы: кнопка открытия', updatePopupOpenButtons);
  safe('якоря: кнопка копирования', updateAnchorCopyButtons);
  safe('библиотека: порядок блоков', updateLibraryOrder);
  safe('библиотека: раскрытие', updateLibraryExpanded);
  safe('библиотека: раздел FAQ', updateLibraryFaqSection);
  safe('z-index: патч сортировки', ensureReorderPatched);
  safe('z-index: порядок carrier’ов', reorderMisplacedCarriers);
  // Tokens Engine временно выключен по фидбеку юзера (2026-07-12) — не
  // удалять код и данные, просто не звать. Включать обратно — раскомментить
  // этот блок и оба initTokens() ниже.
  // safe('токены: кнопка', injectTokensButton);
  safe('HTML→Zero: кнопка', injectZeroImportButton);
  // safe('токены: live-превью', applyTokensLivePreview);
  // safe('токены: бинды', updateTokenBindings);
  // safe('токены: привязки на копиях блоков', adoptDuplicatedZeroBindings);
  // safe('токены: хуки дубля/копипаста блоков', ensureBlockCopyHooksPatched);
  safe('крошки папки в шапке', updateFolderBreadcrumbs);
  safe('крошки в шапке', updateEditorBreadcrumbs);
  safe('zero: тумблер Scale Grid Container', runUpscaleToggle);
}

function main() {
  // Опубликованная страница (tilda.ws-зеркало): ничего не трогаем — работаем
  // только если нас позвали как цель мультипревью (#th-mp в адресе).
  if (location.hostname.endsWith('.tilda.ws')) {
    if (isMultiPreviewTarget()) buildMultiPreviewOverlay();
    return;
  }

  if (location.pathname.startsWith('/projects/')) {
    safe('стили', injectStyles);
    safe('powermode', initProjectsPowerMode);
    safe('иерархия папок', initFolderHierarchy);
    safe('иерархия страниц', initPageHierarchy);
    safe('Friday37: массовое создание страниц (врем.)', initFriday37PageBatch);
    return;
  }

  // Редактор Zero-блока — своя страница (tilda.ru/zero/…), встроенная как
  // iframe внутри /page/-редактора. Ничего из остального функционала сюда
  // не относится — только принудительный English по умолчанию в дропдауне.
  if (location.pathname.startsWith('/zero/')) {
    safe('zero: иконки кнопок Actions', injectZeroActionIconStyles);
    setInterval(() => safe('zero: автоматизации', runZeroBlockAutomations), 700);
    safe('zero: автоматизации', runZeroBlockAutomations);
    // Токены в редакторе Zero-блока — выключены вместе с остальным Tokens
    // Engine (см. комментарий ниже в page-ветке).
    // safe('токены: инициализация', initTokens);
    // Компоненты (в духе Figma): main/instance, синхронизация полей,
    // отвязка переопределённых, фиолетовое выделение, кнопка в нижней панели.
    safe('zero: компоненты: инициализация', initZeroComponents);
    setInterval(() => {
      // safe('токены: live-превью', applyTokensLivePreview);
      // safe('zero: бинды токенов', updateZeroTokenBindings);
      // safe('zero: привязки на копиях элементов', adoptDuplicatedZeroElems);
      safe('zero: компоненты', updateZeroComponents);
      safe('zero: выравнивание absolute', runZeroConstraints);
      safe('zero: тумблер Scale Grid Container', runUpscaleToggle);
      safe('zero: синк z-index в /page/', syncZeroZIndexToParent);
    }, 700);
    return;
  }

  safe('стили', injectStyles);
  safe('treelist-иерархия', initTreelistHierarchy);
  safe('крошки: инициализация', initEditorBreadcrumbs);
  // safe('токены: инициализация', initTokens); // выключено по фидбеку юзера (2026-07-12)
  setInterval(tick, 700);
  tick();
}

main();
