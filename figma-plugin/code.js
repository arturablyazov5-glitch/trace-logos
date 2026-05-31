figma.showUI(__html__, { width: 380, height: 560, title: 'Trace Logos' });

function placeNode(node) {
  const sel = figma.currentPage.selection;
  const target = sel.length === 1 && ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'GROUP', 'SECTION'].includes(sel[0].type)
    ? sel[0]
    : null;

  if (target) {
    target.appendChild(node);
    node.x = Math.round((target.width  - node.width)  / 2);
    node.y = Math.round((target.height - node.height) / 2);
  } else {
    figma.currentPage.appendChild(node);
    const vp = figma.viewport.bounds;
    node.x = Math.round(vp.x + vp.width  / 2 - node.width  / 2);
    node.y = Math.round(vp.y + vp.height / 2 - node.height / 2);
  }

  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'insert-svg') {
    try {
      const node = figma.createNodeFromSvg(msg.svg);
      node.name = msg.name;
      placeNode(node);
      figma.notify(`✓ ${msg.name}`);
    } catch (e) {
      figma.notify('Ошибка при вставке SVG', { error: true });
    }
  }

  if (msg.type === 'insert-png') {
    try {
      const image = figma.createImage(new Uint8Array(msg.bytes));
      const { width, height } = await image.getSizeAsync();
      const rect = figma.createRectangle();
      rect.name = msg.name;
      rect.resize(width, height);
      rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
      placeNode(rect);
      figma.notify(`✓ ${msg.name}`);
    } catch (e) {
      figma.notify('Ошибка при вставке PNG', { error: true });
    }
  }
};
