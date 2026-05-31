figma.showUI(__html__, { width: 380, height: 560, title: 'Trace Logos' });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'insert-svg') {
    try {
      const node = figma.createNodeFromSvg(msg.svg);
      node.name = msg.name;
      figma.currentPage.appendChild(node);
      figma.viewport.scrollAndZoomIntoView([node]);
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
      figma.currentPage.appendChild(rect);
      figma.viewport.scrollAndZoomIntoView([rect]);
      figma.notify(`✓ ${msg.name}`);
    } catch (e) {
      figma.notify('Ошибка при вставке PNG', { error: true });
    }
  }
};
