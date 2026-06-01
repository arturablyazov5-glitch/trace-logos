figma.showUI(__html__, { width: 380, height: 560, title: 'Trace Logos' });

// Center a freshly created node inside the current selection (if it's a container)
// or in the middle of the viewport otherwise.
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

function svgNode(svg, name) {
  const node = figma.createNodeFromSvg(svg);
  node.name = name;
  return node;
}

async function pngNode(bytes, name) {
  const image = figma.createImage(new Uint8Array(bytes));
  const { width, height } = await image.getSizeAsync();
  const rect = figma.createRectangle();
  rect.name = name;
  rect.resize(width, height);
  rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
  return rect;
}

// ── Click "Вставить" → centered placement ─────────────────────────────────────
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'insert-svg') {
    try {
      placeNode(svgNode(msg.svg, msg.name));
      figma.notify(`✓ ${msg.name}`);
    } catch (e) {
      figma.notify('Ошибка при вставке SVG', { error: true });
    }
  }

  if (msg.type === 'insert-png') {
    try {
      placeNode(await pngNode(msg.bytes, msg.name));
      figma.notify(`✓ ${msg.name}`);
    } catch (e) {
      figma.notify('Ошибка при вставке PNG', { error: true });
    }
  }
};

// ── Drag from the plugin UI → drop at the cursor on the canvas ─────────────────
figma.on('drop', (event) => {
  const { items, files, x, y, dropMetadata } = event;
  const name = (dropMetadata && dropMetadata.name) || 'Trace Logos';

  if (items && items.length && items[0].type === 'image/svg+xml') {
    try {
      const node = svgNode(items[0].data, name);
      node.x = Math.round(x - node.width / 2);
      node.y = Math.round(y - node.height / 2);
      figma.currentPage.selection = [node];
      figma.notify(`✓ ${name}`);
    } catch (e) {
      figma.notify('Ошибка при вставке SVG', { error: true });
    }
    return false;
  }

  if (files && files.length) {
    (async () => {
      try {
        const bytes = await files[0].getBytesAsync();
        const node = await pngNode(bytes, name);
        node.x = Math.round(x - node.width / 2);
        node.y = Math.round(y - node.height / 2);
        figma.currentPage.selection = [node];
        figma.notify(`✓ ${name}`);
      } catch (e) {
        figma.notify('Ошибка при вставке PNG', { error: true });
      }
    })();
    return false;
  }

  return false;
});
