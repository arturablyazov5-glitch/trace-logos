figma.showUI(__html__, { width: 380, height: 560, title: 'Trace Logos' });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'insert-svg') {
    try {
      const node = figma.createNodeFromSvg(msg.svg);
      node.name = msg.name;
      figma.currentPage.appendChild(node);
      figma.viewport.scrollAndZoomIntoView([node]);
      figma.notify(`✓ ${msg.name} добавлен`);
    } catch (e) {
      figma.notify('Ошибка при вставке SVG', { error: true });
    }
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
