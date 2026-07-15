figma.showUI(__html__, { width: 380, height: 560, title: 'Trace Logos' });

// Slides has its own layout model (a grid of SLIDE nodes, not a free canvas) —
// drop the logo onto the currently focused slide instead of the page.
// MUST appendChild before setting x/y: newly created nodes are silently
// auto-parented to a hidden slide-grid origin, and writing x/y first stores
// the value against that origin instead of the real parent.
function placeOnSlide(node) {
  const slide = figma.currentPage.focusedSlide;
  if (!slide) return false;
  slide.appendChild(node);
  node.x = Math.round((slide.width  - node.width)  / 2);
  node.y = Math.round((slide.height - node.height) / 2);
  figma.currentPage.selection = [node];
  return true;
}

// Center a freshly created node inside the current selection (if it's a container)
// or in the middle of the viewport otherwise. Design + FigJam only — Slides uses placeOnSlide.
function placeNode(node) {
  if (figma.editorType === 'slides' && placeOnSlide(node)) return;

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
// Slides has no free-canvas cursor position to drop onto (it's a slide grid),
// so drops there fall back to the same centered-on-focused-slide placement as
// a click — same reasoning as placeNode() above.
function placeAtDrop(node, x, y) {
  if (figma.editorType === 'slides' && placeOnSlide(node)) return;
  node.x = Math.round(x - node.width / 2);
  node.y = Math.round(y - node.height / 2);
  figma.currentPage.selection = [node];
}

figma.on('drop', (event) => {
  const { items, files, x, y, dropMetadata } = event;
  const name = (dropMetadata && dropMetadata.name) || 'Trace Logos';

  if (items && items.length && items[0].type === 'image/svg+xml') {
    try {
      placeAtDrop(svgNode(items[0].data, name), x, y);
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
        placeAtDrop(await pngNode(bytes, name), x, y);
        figma.notify(`✓ ${name}`);
      } catch (e) {
        figma.notify('Ошибка при вставке PNG', { error: true });
      }
    })();
    return false;
  }

  return false;
});
