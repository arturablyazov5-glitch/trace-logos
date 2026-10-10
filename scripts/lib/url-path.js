'use strict';
/**
 * Кодирование пути для абсолютных URL картинок в sitemap и JSON-LD.
 * Имена файлов содержат пробелы, скобки и «&» («Counter-Strike 2.png»,
 * «telegram(2013).svg»); в `<image:loc>` и `contentUrl` они обязаны быть
 * percent-encoded. Кодируется каждый сегмент отдельно, «/» остаётся;
 * encodeURIComponent не трогает `( ) ! ' * ~`, они в пути допустимы.
 */
function encodeUrlPath(p) {
  return String(p).split('/').map(encodeURIComponent).join('/');
}
module.exports = { encodeUrlPath };
