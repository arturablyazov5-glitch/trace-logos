// Like home-i18n, this translates the hand-authored hub before en-transform.
// Visible copy lives in RU HTML; its English equivalents live in hub-en.json.
const translations = require('../../tools/hub-en.json');
function translateToolsHub(html) {
  html = html.replace(/<main\b[\s\S]*?<\/main>/, main => main.replace(/>([^<]+)</g, (match, raw) => {
    const key = raw.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (!translations[key]) return match;
    return `>${raw.match(/^\s*/)[0]}${translations[key].replace(/&/g, '&amp;').replace(/</g, '&lt;')}${raw.match(/\s*$/)[0]}<`;
  }));
  const title = 'Tools for designers: Figma, Tilda, PDF and WebP | Trace Logo’s';
  const description = 'Figma plugins, Tilda and Taptop extensions, review export, WebP and SVG compression, PDF merging and photo editing. Features, access and installation guides.';
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]+/, `$1${description}`);
  // Replace all social metadata, not just the first matching description.
  html = html.replace(/(<meta (?:name|property)="(?:og:description|twitter:description)" content=")[^"]+/g, `$1${description}`)
    .replace(/(<meta (?:name|property)="(?:og:title|twitter:title)" content=")[^"]+/g, `$1${title}`)
    .replace(/(<meta (?:name|property)="(?:og:image:alt|twitter:image:alt)" content=")[^"]+/g, '$1Trace Logo’s tools: Figma plugins, browser extensions and file utilities')
    .replace('content="ru_RU"', 'content="en_US"')
    .replace('aria-label="Хлебные крошки"', 'aria-label="Breadcrumbs"');
  return html;
}
module.exports = { translateToolsHub };
