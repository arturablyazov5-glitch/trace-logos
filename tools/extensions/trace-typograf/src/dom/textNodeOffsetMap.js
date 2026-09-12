// Аналог collectTextNodes() из Figma-плагина, только для настоящего DOM:
// обходит contenteditable-корень и строит список Text-нод с их офсетами в
// плоской строке root.textContent (тот же порядок, тот же обход, что
// textContent использует внутри) — нужен, чтобы превратить офсеты диффа
// обратно в Range на реальных нодах. <br> заранее заменён на обычный текст
// (normalizeBrToSpace.js) — этому коду про него знать не нужно.
function buildTextNodeOffsetMap(root) {
  const map = [];
  let pos = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const len = node.nodeValue.length;
    map.push({ node, start: pos, end: pos + len });
    pos += len;
    node = walker.nextNode();
  }
  return map;
}
