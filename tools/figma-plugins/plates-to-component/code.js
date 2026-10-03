// GENERATED from plates-to-component/src/*.js by npm run build. Do not edit.
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // tools/figma-plugins/plates-to-component/src/util.js
  var require_util = __commonJS({
    "tools/figma-plugins/plates-to-component/src/util.js"(exports, module) {
      var ROLE_KEY = "plate-role-id";
      function copy(value) {
        if (value === null || typeof value !== "object") return value;
        if (Array.isArray(value)) return value.map(copy);
        const out = {};
        Object.keys(value).forEach((k) => {
          if (typeof value[k] !== "symbol" && typeof value[k] !== "undefined") out[k] = copy(value[k]);
        });
        return out;
      }
      function equal(a, b, tolerance = 0.02) {
        if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= tolerance;
        if (a === b) return true;
        if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
        const keys = Object.keys(a);
        return keys.length === Object.keys(b).length && keys.every((k) => equal(a[k], b[k], tolerance));
      }
      function normalize(name) {
        return String(name || "").normalize("NFKC").toLowerCase().replace(/[_\-\/]+/g, " ").replace(/\s+/g, " ").trim();
      }
      function uid() {
        return "plate-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
      }
      function pause(ms = 0) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      function workSteps(visible = false) {
        let count = 0, last = Date.now();
        return async (source) => {
          count++;
          if (visible && (source == null ? void 0 : source.text)) {
            await pause(80);
            count = 0;
            last = Date.now();
          } else if (count >= 24 || Date.now() - last >= 32) {
            await pause(visible ? 16 : 0);
            count = 0;
            last = Date.now();
          }
        };
      }
      function children(node) {
        return "children" in node ? Array.from(node.children) : [];
      }
      function walk(node, fn) {
        fn(node);
        children(node).forEach((n) => walk(n, fn));
      }
      function inside(node, roots) {
        for (let n = node; n; n = n.parent) if (roots.includes(n)) return true;
        return false;
      }
      function errorText(err) {
        return err && err.message ? err.message : String(err);
      }
      module.exports = { ROLE_KEY, copy, equal, normalize, uid, pause, workSteps, children, walk, inside, errorText };
    }
  });

  // tools/figma-plugins/plates-to-component/src/selection.js
  var require_selection = __commonJS({
    "tools/figma-plugins/plates-to-component/src/selection.js"(exports, module) {
      var { inside } = require_util();
      function selection2() {
        const roots = figma.currentPage.selection.slice();
        const errors = [];
        if (roots.length < 2) errors.push("\u0412\u044B\u0434\u0435\u043B\u0438 \u043C\u0438\u043D\u0438\u043C\u0443\u043C \u0434\u0432\u0435 \u043F\u043B\u0430\u0448\u043A\u0438");
        if (roots.some((n) => !["FRAME", "COMPONENT", "INSTANCE"].includes(n.type))) errors.push("\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E Frame, Component \u0438 Instance");
        roots.forEach((n) => {
          if (n.type === "COMPONENT" && n.remote) errors.push("\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u0447\u043D\u044B\u0439 Component \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0447\u0442\u0435\u043D\u0438\u044F");
          if (inside(n.parent, roots)) errors.push("\u0412\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u043F\u043B\u0430\u0448\u043A\u0443 \u0438 \u0435\u0451 \u043F\u043E\u0442\u043E\u043C\u043A\u0430");
          for (let p = n.parent; p && p.type !== "PAGE"; p = p.parent) if (["INSTANCE", "COMPONENT", "COMPONENT_SET"].includes(p.type)) {
            errors.push("\xAB" + n.name + "\xBB: \u043F\u043B\u0430\u0448\u043A\u0430 \u0432\u043D\u0443\u0442\u0440\u0438 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430/\u0438\u043D\u0441\u0442\u0430\u043D\u0441\u0430. \u0412\u044B\u0434\u0435\u043B\u0438 \u0432\u043D\u0435\u0448\u043D\u0438\u0439 Frame.");
            break;
          }
          if (!n.parent || typeof n.parent.insertChild !== "function") errors.push("\u041D\u0435\u043B\u044C\u0437\u044F \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \xAB" + n.name + "\xBB \u0432 \u0435\u0433\u043E \u0440\u043E\u0434\u0438\u0442\u0435\u043B\u0435");
        });
        return { roots, errors: Array.from(new Set(errors)), key: roots.map((n) => n.id).join("|") };
      }
      async function externalInstances(roots) {
        const external = [];
        for (const component of roots.filter((n) => n.type === "COMPONENT")) for (const instance of await component.getInstancesAsync()) if (!inside(instance, roots)) external.push({ node: instance, component });
        const seen = /* @__PURE__ */ new Set();
        return external.filter((e) => {
          if (seen.has(e.node.id)) return false;
          seen.add(e.node.id);
          return true;
        });
      }
      module.exports = { selection: selection2, externalInstances };
    }
  });

  // tools/figma-plugins/plates-to-component/src/snapshot.js
  var require_snapshot = __commonJS({
    "tools/figma-plugins/plates-to-component/src/snapshot.js"(exports, module) {
      var { ROLE_KEY, copy, children, pause } = require_util();
      var PROPS = ["visible", "opacity", "blendMode", "name", "x", "y", "rotation", "fills", "strokes", "effects", "strokeWeight", "strokeAlign", "strokeCap", "strokeJoin", "strokeMiterLimit", "dashPattern", "strokeTopWeight", "strokeBottomWeight", "strokeLeftWeight", "strokeRightWeight", "cornerRadius", "topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius", "cornerSmoothing", "clipsContent", "isMask", "maskType", "booleanOperation", "vectorPaths", "vectorNetwork", "arcData", "pointCount", "innerRadius", "layoutMode", "layoutWrap", "primaryAxisSizingMode", "counterAxisSizingMode", "primaryAxisAlignItems", "counterAxisAlignItems", "counterAxisAlignContent", "itemSpacing", "counterAxisSpacing", "paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "itemReverseZIndex", "strokesIncludedInLayout", "layoutAlign", "layoutGrow", "layoutPositioning", "layoutSizingHorizontal", "layoutSizingVertical", "minWidth", "maxWidth", "minHeight", "maxHeight", "constraints", "textAutoResize", "textAlignHorizontal", "textAlignVertical", "textTruncation", "maxLines", "paragraphIndent", "paragraphSpacing", "hangingPunctuation", "hangingList", "leadingTrim", "textStyleId", "fillStyleId", "strokeStyleId", "effectStyleId", "gridStyleId", "layoutGrids", "boundVariables", "explicitVariableModes", "reactions", "exportSettings", "gridRowAnchorIndex", "gridColumnAnchorIndex", "gridRowSpan", "gridColumnSpan", "gridChildHorizontalAlign", "gridChildVerticalAlign"];
      var SEGMENT_FIELDS = ["fontName", "fontSize", "textCase", "textDecoration", "letterSpacing", "lineHeight", "fills", "textStyleId", "hyperlink", "listOptions", "indentation", "openTypeFeatures"];
      function read(node, key) {
        try {
          const value = node[key];
          return typeof value === "symbol" || value === void 0 ? void 0 : copy(value);
        } catch (_) {
          return void 0;
        }
      }
      function placement(node) {
        const parent = node.parent;
        const props = {};
        ["x", "y", "width", "height", "rotation", "relativeTransform", "layoutAlign", "layoutGrow", "layoutPositioning", "layoutSizingHorizontal", "layoutSizingVertical", "constraints", "minWidth", "maxWidth", "minHeight", "maxHeight", "visible", "gridRowAnchorIndex", "gridColumnAnchorIndex", "gridRowSpan", "gridColumnSpan", "gridChildHorizontalAlign", "gridChildVerticalAlign"].forEach((k) => {
          const v = read(node, k);
          if (v !== void 0) props[k] = v;
        });
        return { parent, index: parent ? children(parent).indexOf(node) : -1, props };
      }
      async function capture(node, context = { count: 0 }, index = 0, path = "") {
        if (++context.count % 100 === 0) {
          await pause();
          if (context.cancelled && context.cancelled()) throw new Error("\u0410\u043D\u0430\u043B\u0438\u0437 \u043E\u0442\u043C\u0435\u043D\u0451\u043D: \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u043E\u0441\u044C");
        }
        const props = {};
        PROPS.forEach((k) => {
          if (k in node) {
            const v = read(node, k);
            if (v !== void 0) props[k] = v;
          }
        });
        props.width = read(node, "width");
        props.height = read(node, "height");
        const out = { node, id: node.id, type: node.type, name: node.name, index, path, roleId: node.getPluginData(ROLE_KEY), props, children: [], main: null, text: null };
        if (node.type === "INSTANCE") {
          out.componentProperties = read(node, "componentProperties");
          const main = await node.getMainComponentAsync();
          if (main) out.main = { id: main.id, key: main.key, name: main.name, remote: main.remote, node: main };
        }
        if (node.type === "COMPONENT") out.componentPropertyDefinitions = read(node, "componentPropertyDefinitions");
        if (node.type === "TEXT") {
          let segments = [];
          if (node.characters.length) segments = node.getStyledTextSegments(SEGMENT_FIELDS).map(copy);
          out.text = { characters: node.characters, segments, fonts: node.characters.length ? node.getRangeAllFontNames(0, node.characters.length).map(copy) : typeof node.fontName === "object" ? [copy(node.fontName)] : [], hasMissingFont: node.hasMissingFont };
        }
        const list = children(node);
        for (let i = 0; i < list.length; i++) out.children.push(await capture(list[i], context, i, path + "/" + node.name));
        return out;
      }
      function stage(node, index = 0) {
        let temp;
        try {
          if (node.type === "COMPONENT") {
            temp = node.createInstance();
            temp.visible = false;
            temp = temp.detachInstance();
          } else {
            temp = node.clone();
            temp.visible = false;
            if (temp.type === "INSTANCE") temp = temp.detachInstance();
          }
          temp.visible = false;
          figma.currentPage.appendChild(temp);
          temp.x = -1e5 - index * 2e3;
          temp.y = -1e5;
          return temp;
        } catch (error) {
          if (temp && !temp.removed) temp.remove();
          throw error;
        }
      }
      async function snapshots(roots, cancelled) {
        const staged = [];
        const trees = [];
        try {
          for (let i = 0; i < roots.length; i++) {
            const temp = stage(roots[i], i);
            staged.push(temp);
            const tree = await capture(temp, { count: 0, cancelled });
            PROPS.forEach((k) => {
              const v = read(roots[i], k);
              if (v !== void 0) tree.props[k] = v;
            });
            tree.props.width = roots[i].width;
            tree.props.height = roots[i].height;
            trees.push(tree);
          }
          return { staged, trees };
        } catch (err) {
          staged.forEach((n) => {
            if (!n.removed) n.remove();
          });
          throw err;
        }
      }
      function clean(staged) {
        staged.forEach((n) => {
          if (n && !n.removed) n.remove();
        });
      }
      function signature(tree) {
        return JSON.stringify({ type: tree.type, name: tree.name, props: tree.props, text: tree.text, main: tree.main && tree.main.id, origin: tree.origin, componentProperties: tree.componentProperties, componentPropertyDefinitions: tree.componentPropertyDefinitions, children: tree.children.map(signature) });
      }
      module.exports = { PROPS, SEGMENT_FIELDS, read, placement, capture, stage, snapshots, clean, signature };
    }
  });

  // tools/figma-plugins/plates-to-component/src/matching.js
  var require_matching = __commonJS({
    "tools/figma-plugins/plates-to-component/src/matching.js"(exports, module) {
      var { normalize } = require_util();
      function ratio(a, b) {
        a = Math.abs(a || 0);
        b = Math.abs(b || 0);
        return Math.max(a, b) < 0.01 ? 1 : Math.min(a, b) / Math.max(a, b);
      }
      function childTypes(n) {
        return n.children.map((c) => c.type).sort().join("|");
      }
      function score(a, b, ai = 0, bi = 0, count = 1) {
        if (a.type !== b.type) return -1e4;
        if (a.origin && b.origin && a.origin.mainId === b.origin.mainId) {
          if (!a.origin.path || !b.origin.path) return -1e4;
          return a.origin.path === b.origin.path ? 1e4 : -1e4;
        }
        if (a.roleId && b.roleId) return a.roleId === b.roleId ? 1e3 : -1e4;
        const ap = a.props || {}, bp = b.props || {};
        const an = normalize(a.name), bn = normalize(b.name);
        let s = 18;
        if (an === bn && an) s += 32;
        else {
          const at = an.split(" "), bt = bn.split(" ");
          s += 12 * at.filter((t) => t && bt.includes(t)).length / Math.max(at.length, bt.length, 1);
        }
        s += 7 * ratio(ap.width, bp.width) + 7 * ratio(ap.height, bp.height);
        s += 5 * ratio((ap.width || 1) / (ap.height || 1), (bp.width || 1) / (bp.height || 1));
        s += a.children.length === b.children.length ? 7 : 4 * ratio(a.children.length + 1, b.children.length + 1);
        if (childTypes(a) === childTypes(b)) s += 7;
        if (ap.layoutMode === bp.layoutMode) s += 4;
        if (ap.layoutPositioning === bp.layoutPositioning) s += 3;
        if (ap.isMask === bp.isMask) s += 3;
        if (ap.booleanOperation === bp.booleanOperation) s += 2;
        if (a.main && b.main && a.main.id === b.main.id) s += 24;
        const distance = Math.abs((ap.x || 0) - (bp.x || 0)) + Math.abs((ap.y || 0) - (bp.y || 0));
        s += 7 / (1 + distance / Math.max(ap.width || 1, ap.height || 1, bp.width || 1, bp.height || 1));
        s += 4 * Math.max(0, 1 - Math.abs(ai - bi) / Math.max(count, 1));
        return s;
      }
      function assignment(weights) {
        const n = weights.length;
        if (!n) return [];
        const m = Math.max(n, weights[0].length);
        const u = Array(n + 1).fill(0), v = Array(m + 1).fill(0), p = Array(m + 1).fill(0), way = Array(m + 1).fill(0);
        for (let i = 1; i <= n; i++) {
          p[0] = i;
          let j0 = 0;
          const min = Array(m + 1).fill(Infinity), used = Array(m + 1).fill(false);
          do {
            used[j0] = true;
            const i0 = p[j0];
            let delta = Infinity, j1 = 0;
            for (let j = 1; j <= m; j++) if (!used[j]) {
              const cur = -(weights[i0 - 1][j - 1] || 0) - u[i0] - v[j];
              if (cur < min[j]) {
                min[j] = cur;
                way[j] = j0;
              }
              if (min[j] < delta) {
                delta = min[j];
                j1 = j;
              }
            }
            for (let j = 0; j <= m; j++) if (used[j]) {
              u[p[j]] += delta;
              v[j] -= delta;
            } else min[j] -= delta;
            j0 = j1;
          } while (p[j0] !== 0);
          do {
            const j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
          } while (j0 !== 0);
        }
        const result = Array(n).fill(-1);
        for (let j = 1; j <= m; j++) if (p[j]) result[p[j] - 1] = j - 1;
        return result;
      }
      function match(incoming, roles) {
        const weights = incoming.map((n, i) => roles.map((r, j) => score(n, r.sample, i, j, Math.max(incoming.length, roles.length))));
        const matrix = weights.map((row) => row.concat(incoming.map(() => 50)));
        const chosen = assignment(matrix);
        const conflicts = [];
        const matches = chosen.map((j, i) => j < roles.length && weights[i][j] >= 54 ? j : -1);
        matches.forEach((j, i) => {
          if (j < 0) return;
          const alternatives = weights[i].map((s, k) => ({ s, k })).filter((x) => x.k !== j && x.s >= 54).sort((a, b) => b.s - a.s);
          if (alternatives.length && Math.abs(weights[i][j] - alternatives[0].s) < 5) conflicts.push({ kind: "ambiguous", severity: "error", message: "\u041D\u0435\u043E\u0434\u043D\u043E\u0437\u043D\u0430\u0447\u043D\u043E\u0435 \u0441\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435: \xAB" + incoming[i].name + "\xBB", path: incoming[i].path });
          for (let k = 0; k < incoming.length; k++) if (k !== i && weights[k][j] >= 54 && Math.abs(weights[i][j] - weights[k][j]) < 5 && matches[k] !== j) conflicts.push({ kind: "ambiguous", severity: "error", message: "\u041D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u043B\u043E\u0451\u0432 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0442 \u043A \xAB" + roles[j].sample.name + "\xBB", path: incoming[i].path });
        });
        return { matches, conflicts };
      }
      module.exports = { score, assignment, match };
    }
  });

  // tools/figma-plugins/plates-to-component/src/schema.js
  var require_schema = __commonJS({
    "tools/figma-plugins/plates-to-component/src/schema.js"(exports, module) {
      var { match } = require_matching();
      var { uid, equal } = require_util();
      function buildSchema(trees, base) {
        const conflicts = [];
        const total = trees.length;
        function role(sample, owner) {
          const members = Array(total).fill(null);
          members[owner] = sample;
          return { id: sample.roleId || uid(), sample, members, children: [], nestedRebuild: false };
        }
        const root = role(trees[base], base);
        root.members = trees.slice();
        function merge(parent) {
          const baseNode = parent.members[base];
          let roles = (baseNode ? baseNode.children : []).map((n) => role(n, base));
          const order = [base].concat(trees.map((_, i) => i).filter((i) => i !== base));
          for (const owner of order) {
            if (owner === base && baseNode) continue;
            const node = parent.members[owner];
            if (!node) continue;
            const existingRoles = roles.slice();
            const result = match(node.children, existingRoles);
            conflicts.push(...result.conflicts);
            const mapped = [];
            node.children.forEach((n, i) => {
              let r = result.matches[i] >= 0 ? existingRoles[result.matches[i]] : null;
              if (!r) {
                r = role(n, owner);
                let pos = roles.length;
                for (let k = i + 1; k < node.children.length; k++) {
                  if (result.matches[k] >= 0) {
                    pos = roles.indexOf(existingRoles[result.matches[k]]);
                    break;
                  }
                }
                roles.splice(pos, 0, r);
              } else r.members[owner] = n;
              mapped.push(r);
            });
            const existing = mapped.filter((r) => r.members[base]);
            const canonical = roles.filter((r) => existing.includes(r));
            if (existing.some((r, i) => canonical[i] !== r)) conflicts.push({ kind: "order", severity: "error", message: "\u0420\u0430\u0437\u043D\u044B\u0439 \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u0441\u043B\u043E\u0451\u0432 \u0432\u043D\u0443\u0442\u0440\u0438 \xAB" + node.name + "\xBB", path: node.path });
          }
          parent.children = roles;
          const ids = /* @__PURE__ */ new Set();
          roles.forEach((r) => {
            if (ids.has(r.id)) conflicts.push({ kind: "id", severity: "error", message: "\u041F\u043E\u0432\u0442\u043E\u0440\u044F\u044E\u0449\u0438\u0439\u0441\u044F plate-role-id \u0432\u043D\u0443\u0442\u0440\u0438 \xAB" + parent.sample.name + "\xBB" });
            ids.add(r.id);
            r.additionRoot = !r.members[base] && !!parent.members[base];
            merge(r);
          });
          parent.structureChanged = roles.some((r) => parent.members.some((n, i) => n && !r.members[i]) || r.structureChanged);
          if (parent.sample.type === "INSTANCE") {
            const present = parent.members.map((n, i) => n ? i : -1).filter((i) => i >= 0);
            parent.nestedRebuild = parent.structureChanged || roles.some((r) => r.nestedRebuild);
            if (parent.nestedRebuild) conflicts.push({ kind: "nested", severity: "info", message: "\xAB" + parent.sample.name + "\xBB: \u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u0437\u0434\u0430\u043D \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0439 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u0441 \u043E\u0431\u0449\u0435\u0439 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u043E\u0439. \u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0435 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F." });
          }
        }
        merge(root);
        const flat = [];
        (function visit(r) {
          flat.push(r);
          r.children.forEach(visit);
        })(root);
        for (const r of flat) for (const member of r.members) {
          if (!member) continue;
          if (member.text && member.text.hasMissingFont) conflicts.push({ kind: "font", severity: "error", message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0448\u0440\u0438\u0444\u0442 \u0432 \xAB" + member.name + "\xBB", path: member.path });
          for (const k of ["vectorPaths", "vectorNetwork", "booleanOperation", "isMask", "maskType", "pointCount", "innerRadius", "arcData"]) {
            if (!equal(member.props[k], r.sample.props[k])) conflicts.push({ kind: "geometry", severity: "error", message: "\xAB" + member.name + "\xBB: \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u0435\u0442\u0441\u044F " + k + ". \u042D\u0442\u043E \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B/\u043A\u043E\u043D\u0442\u0443\u0440\u0430, \u0430 \u043D\u0435 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0439 override.", path: member.path });
          }
        }
        const unique = [];
        const seen = /* @__PURE__ */ new Set();
        conflicts.forEach((c) => {
          const key = c.kind + c.message + (c.path || "");
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(c);
          }
        });
        return { root, flat, conflicts: unique, added: flat.filter((r) => r.additionRoot).length, nested: flat.filter((r) => r.nestedRebuild).length, matched: flat.reduce((sum, r) => sum + r.members.filter(Boolean).length, 0) };
      }
      module.exports = { buildSchema };
    }
  });

  // tools/figma-plugins/plates-to-component/src/input.js
  var require_input = __commonJS({
    "tools/figma-plugins/plates-to-component/src/input.js"(exports, module) {
      var { capture, snapshots, signature, clean } = require_snapshot();
      var { buildSchema } = require_schema();
      function relativeId(id, rootId, instance) {
        if (id === rootId) return "$";
        const prefix = "I" + rootId + ";";
        if (instance) return id.startsWith(prefix) ? id.slice(prefix.length) : null;
        return id.replace(/^I/, "");
      }
      function identify(tree, rootId, mainId, instance) {
        tree.origin = { mainId, path: relativeId(tree.id, rootId, instance) };
        if (tree.origin.path) tree.roleId = "origin:" + mainId + ":" + tree.origin.path;
        tree.children.forEach((child) => identify(child, rootId, mainId, instance));
      }
      async function collect(roots, base, cancelled) {
        figma.skipInvisibleInstanceChildren = false;
        const mains = roots.every((n) => n.type === "INSTANCE") ? await Promise.all(roots.map((n) => n.getMainComponentAsync())) : [];
        const main = mains[0];
        if (!main || main.remote || mains.some((n) => !n || n.id !== main.id)) return snapshots(roots, cancelled);
        const staged = [];
        try {
          const trees = [];
          for (const node of roots) {
            const tree = await capture(node, { count: 0, cancelled });
            identify(tree, node.id, main.id, true);
            trees.push(tree);
          }
          const source = await capture(main, { count: 0, cancelled });
          identify(source, main.id, main.id, false);
          if (cancelled && cancelled()) throw new Error("\u0412\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u043E\u0441\u044C. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u0430\u043D\u0430\u043B\u0438\u0437.");
          const template = main.clone();
          staged[base] = template;
          template.visible = false;
          figma.currentPage.appendChild(template);
          template.x = -1e5;
          template.y = -1e5;
          return { trees, staged, common: { source, main, signature: signature(source) } };
        } catch (error) {
          clean(staged);
          throw error;
        }
      }
      function schemaFor(input, base) {
        if (!input.common) return buildSchema(input.trees, base);
        const templateOwner = input.trees.length;
        const schema = buildSchema(input.trees.concat(input.common.source), templateOwner);
        schema.templateOwner = templateOwner;
        schema.commonSource = input.common.main;
        schema.conflicts.push({ kind: "provenance", severity: "info", message: "\u0412\u0441\u0435 \u043F\u043B\u0430\u0448\u043A\u0438 \u2014 \u0438\u043D\u0441\u0442\u0430\u043D\u0441\u044B \u043E\u0434\u043D\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430. \u0421\u043B\u043E\u0438 \u0441\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u044B \u043F\u043E \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u043C ID; \u0441\u043A\u0440\u044B\u0442\u044B\u0435 \u0441\u043B\u043E\u0438 \u0438 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 Component Properties \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F." });
        schema.flat.forEach((role) => role.members.forEach((member) => {
          if (member && member.origin && !member.origin.path) schema.conflicts.push({ kind: "provenance", severity: "error", message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043F\u0443\u0442\u044C \u0441\u043B\u043E\u044F \xAB" + member.name + "\xBB", path: member.path });
        }));
        return schema;
      }
      module.exports = { collect, schemaFor, relativeId, identify };
    }
  });

  // tools/figma-plugins/plates-to-component/src/grid.js
  var require_grid = __commonJS({
    "tools/figma-plugins/plates-to-component/src/grid.js"(exports, module) {
      var { copy, equal, errorText } = require_util();
      var ANCHORS = /* @__PURE__ */ new Set(["gridRowAnchorIndex", "gridColumnAnchorIndex"]);
      var FIELDS = /* @__PURE__ */ new Set([...ANCHORS, "gridRowSpan", "gridColumnSpan", "gridChildHorizontalAlign", "gridChildVerticalAlign"]);
      function assign(node, key, value) {
        if (value === void 0 || !(key in node) || equal(node[key], value)) return;
        try {
          node[key] = copy(value);
        } catch (error) {
          throw new Error("\xAB" + node.name + "\xBB (" + node.type + ", " + node.id + "): \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C " + key + " \u2014 " + errorText(error));
        }
      }
      function restoreGrid(node, props) {
        const parent = node.parent;
        if (!parent || parent.layoutMode !== "GRID") return;
        const row = props.gridRowAnchorIndex, column = props.gridColumnAnchorIndex;
        if (parent.gridItemsPositioning !== "ROW_AUTO_FLOW" && Number.isInteger(row) && row >= 0 && Number.isInteger(column) && column >= 0 && (node.gridRowAnchorIndex !== row || node.gridColumnAnchorIndex !== column)) {
          try {
            if (typeof node.setGridChildPosition !== "function") throw new Error("API \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 setGridChildPosition");
            node.setGridChildPosition(row, column);
          } catch (error) {
            throw new Error("\xAB" + node.name + "\xBB (" + node.type + ", " + node.id + "): setGridChildPosition(" + row + ", " + column + ") \u2014 " + errorText(error));
          }
        }
        for (const key of FIELDS) if (!ANCHORS.has(key)) assign(node, key, props[key]);
      }
      function checkGrid(node, props) {
        var _a;
        if (((_a = node.parent) == null ? void 0 : _a.layoutMode) !== "GRID") return;
        for (const key of FIELDS) if (props[key] !== void 0 && !equal(node[key], props[key])) throw new Error("\xAB" + node.name + "\xBB (" + node.id + "): \u043F\u043E\u0441\u043B\u0435 \u0440\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u044F \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u043E\u0441\u044C " + key);
      }
      module.exports = { ANCHORS, FIELDS, assign, restoreGrid, checkGrid };
    }
  });

  // tools/figma-plugins/plates-to-component/src/overrides.js
  var require_overrides = __commonJS({
    "tools/figma-plugins/plates-to-component/src/overrides.js"(exports, module) {
      var { copy, equal, children, ROLE_KEY, errorText, workSteps } = require_util();
      var { read } = require_snapshot();
      var { FIELDS: GRID_FIELDS, assign, restoreGrid } = require_grid();
      var OUTER = /* @__PURE__ */ new Set(["x", "y", "layoutAlign", "layoutGrow", "layoutPositioning", "constraints", "layoutSizingHorizontal", "layoutSizingVertical", "gridRowAnchorIndex", "gridColumnAnchorIndex", "gridRowSpan", "gridColumnSpan", "gridChildHorizontalAlign", "gridChildVerticalAlign"]);
      var SPECIAL = /* @__PURE__ */ new Set(["width", "height", "x", "y", "name", "boundVariables", "explicitVariableModes", "vectorNetwork", "vectorPaths", "booleanOperation", "isMask", "maskType"]);
      var ASYNC = { fills: "setFillsAsync", strokes: "setStrokesAsync", fillStyleId: "setFillStyleIdAsync", strokeStyleId: "setStrokeStyleIdAsync", effectStyleId: "setEffectStyleIdAsync", textStyleId: "setTextStyleIdAsync", gridStyleId: "setGridStyleIdAsync", reactions: "setReactionsAsync" };
      var RANGES = { textStyleId: "setRangeTextStyleIdAsync", fontName: "setRangeFontName", fontSize: "setRangeFontSize", textCase: "setRangeTextCase", textDecoration: "setRangeTextDecoration", letterSpacing: "setRangeLetterSpacing", lineHeight: "setRangeLineHeight", fills: "setRangeFills", hyperlink: "setRangeHyperlink", listOptions: "setRangeListOptions", indentation: "setRangeIndentation", openTypeFeatures: "setRangeOpenTypeFeatures" };
      var fontCache = /* @__PURE__ */ new Map();
      async function load(font) {
        const key = JSON.stringify(font);
        if (!fontCache.has(key)) fontCache.set(key, figma.loadFontAsync(font).catch((e) => {
          fontCache.delete(key);
          throw e;
        }));
        await fontCache.get(key);
      }
      async function text(source, target) {
        const value = source.text;
        if (!value) return;
        const fonts = value.fonts.concat(target.characters.length ? target.getRangeAllFontNames(0, target.characters.length) : typeof target.fontName === "object" ? [target.fontName] : []);
        await Promise.all(fonts.map(load));
        const style = source.props.textStyleId;
        if (style !== void 0 && !equal(read(target, "textStyleId"), style)) {
          if (target.setTextStyleIdAsync) await target.setTextStyleIdAsync(style);
          else target.textStyleId = style;
        }
        if (target.characters !== value.characters) target.characters = value.characters;
        for (const segment of value.segments) {
          for (const key of Object.keys(RANGES)) {
            if (segment[key] === void 0 || typeof segment[key] === "symbol") continue;
            const method = RANGES[key];
            const getter = method.replace(/^set/, "get").replace(/Async$/, "");
            if (typeof target[getter] === "function" && equal(target[getter](segment.start, segment.end), segment[key])) continue;
            if (typeof target[method] !== "function") throw new Error("API \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 " + method + " \u0434\u043B\u044F \xAB" + source.name + "\xBB");
            await target[method](segment.start, segment.end, copy(segment[key]));
          }
        }
      }
      async function properties(source, target, root = false) {
        var _a, _b;
        if (source.text) await text(source, target);
        for (const key of Object.keys(source.props)) {
          if (GRID_FIELDS.has(key) || SPECIAL.has(key) || source.text && key === "textStyleId" || root && OUTER.has(key)) continue;
          const value = source.props[key];
          if (value === void 0 || equal(read(target, key), value)) continue;
          try {
            const method = ASYNC[key];
            if (method && typeof target[method] === "function") await target[method](copy(value));
            else assign(target, key, value);
          } catch (err) {
            throw new Error("\xAB" + source.name + "\xBB: Figma \u043D\u0435 \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C " + key + " (" + errorText(err) + ")");
          }
        }
        const bindings = source.props.boundVariables || {};
        for (const field of Object.keys(bindings)) {
          const binding = bindings[field];
          if (equal((_a = read(target, "boundVariables")) == null ? void 0 : _a[field], binding)) continue;
          if (Array.isArray(binding)) continue;
          if (binding && binding.id && typeof target.setBoundVariable === "function") target.setBoundVariable(field, await figma.variables.getVariableByIdAsync(binding.id));
          else if (binding) throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0443 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0439 " + field + " \u0432 \xAB" + source.name + "\xBB");
        }
        const modes = source.props.explicitVariableModes || {};
        for (const id of Object.keys(modes)) if (((_b = target.explicitVariableModes) == null ? void 0 : _b[id]) !== modes[id]) target.setExplicitVariableModeForCollection(id, modes[id]);
        if (typeof target.resizeWithoutConstraints === "function" && (!equal(target.width, source.props.width) || !equal(target.height, source.props.height))) target.resizeWithoutConstraints(Math.max(0.01, source.props.width), Math.max(0.01, source.props.height));
        if (!root) {
          restoreGrid(target, source.props);
          const parent = target.parent;
          const auto = parent && parent.layoutMode && parent.layoutMode !== "NONE";
          if (!auto || source.props.layoutPositioning === "ABSOLUTE") {
            assign(target, "x", source.props.x);
            assign(target, "y", source.props.y);
          }
        }
        assign(target, "name", source.name);
      }
      function roleChild(target, role, index, sourceOrder = false, owner = 0) {
        const list = children(target);
        return list.find((n) => n.getPluginData(ROLE_KEY) === role.id) || list[sourceOrder && role.members[owner] ? role.members[owner].index : index];
      }
      function propertyKey(key, value, available) {
        if (available[key] && available[key].type === value.type) return key;
        const name = key.split("#")[0];
        const candidates = Object.keys(available).filter((k) => k.split("#")[0] === name && available[k].type === value.type);
        if (candidates.length !== 1) throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0434\u043D\u043E\u0437\u043D\u0430\u0447\u043D\u043E \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 Component Property \xAB" + name + "\xBB");
        return candidates[0];
      }
      function componentProperties(source, target) {
        if (!source.componentProperties) return;
        const available = target.type === "COMPONENT" ? target.componentPropertyDefinitions : target.componentProperties;
        if (!available) return;
        const values = {};
        for (const [key, value] of Object.entries(source.componentProperties)) {
          if (!["TEXT", "BOOLEAN", "INSTANCE_SWAP"].includes(value.type)) continue;
          if (!Object.keys(available).length) continue;
          const mapped = propertyKey(key, value, available);
          const current = target.type === "COMPONENT" ? available[mapped].defaultValue : available[mapped].value;
          if (equal(current, value.value)) continue;
          if (target.type === "COMPONENT") target.editComponentProperty(mapped, { defaultValue: copy(value.value) });
          else values[mapped] = copy(value.value);
        }
        if (Object.keys(values).length) target.setProperties(values);
      }
      async function applyTree(role, target, owner, root = false, step = workSteps()) {
        const source = role.members[owner];
        if (!source) {
          target.visible = false;
          await step();
          return;
        }
        let swapped = false;
        if (!root && target.type === "INSTANCE" && source.type === "INSTANCE" && !role.nestedRebuild) {
          const current = await target.getMainComponentAsync();
          if (source.main && (current == null ? void 0 : current.id) !== source.main.id) {
            target.swapComponent(source.main.node);
            swapped = true;
          }
        }
        if (target.type === "INSTANCE" || root && target.type === "COMPONENT") componentProperties(source, target);
        await properties(source, target, root);
        await step(source);
        for (let i = 0; i < role.children.length; i++) {
          const child = roleChild(target, role.children[i], i, swapped, owner);
          if (!child) throw new Error("\u041F\u0440\u043E\u043F\u0430\u043B \u0441\u043B\u043E\u0439 \xAB" + role.children[i].sample.name + "\xBB \u043F\u043E\u0441\u043B\u0435 \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u0430");
          await applyTree(role.children[i], child, owner, false, step);
        }
      }
      function auditTree(role, target, owner, root = false, issues = []) {
        var _a;
        const source = role.members[owner];
        if (!source) {
          if (target.visible !== false) issues.push("\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0439 \u0441\u043B\u043E\u0439 \xAB" + role.sample.name + "\xBB \u043D\u0435 \u0441\u043A\u0440\u044B\u0442");
          return issues;
        }
        for (const key of Object.keys(source.props)) {
          if (GRID_FIELDS.has(key) && ((_a = target.parent) == null ? void 0 : _a.layoutMode) !== "GRID" || key === "name" || key === "exportSettings" || key === "reactions" || key === "explicitVariableModes" || root && OUTER.has(key)) continue;
          const actual = read(target, key);
          if (!equal(actual, source.props[key])) issues.push("\xAB" + source.name + "\xBB: \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u043E\u0441\u044C " + key);
        }
        if (source.componentProperties) {
          const available = target.type === "COMPONENT" ? target.componentPropertyDefinitions : target.componentProperties;
          if (available && Object.keys(available).length) for (const [key, value] of Object.entries(source.componentProperties)) {
            if (!["TEXT", "BOOLEAN", "INSTANCE_SWAP"].includes(value.type)) continue;
            try {
              const mapped = propertyKey(key, value, available);
              const actual = target.type === "COMPONENT" ? available[mapped].defaultValue : available[mapped].value;
              if (!equal(actual, value.value)) issues.push("\xAB" + source.name + "\xBB: \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u043E\u0441\u044C Component Property " + key);
            } catch (error) {
              issues.push(errorText(error));
            }
          }
        }
        if (source.text) {
          if (target.characters !== source.text.characters) issues.push("\xAB" + source.name + "\xBB: \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0441\u044F \u0442\u0435\u043A\u0441\u0442");
          try {
            const segments = target.characters.length ? target.getStyledTextSegments(require_snapshot().SEGMENT_FIELDS) : [];
            if (!equal(segments, source.text.segments)) issues.push("\xAB" + source.name + "\xBB: \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u0435\u0442\u0441\u044F \u0444\u043E\u0440\u043C\u0430\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0442\u0435\u043A\u0441\u0442\u0430");
          } catch (e) {
            issues.push("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0442\u0435\u043A\u0441\u0442 \xAB" + source.name + "\xBB");
          }
        }
        let swapped = false;
        if (target.type === "INSTANCE" && !role.nestedRebuild && source.type === "INSTANCE") swapped = true;
        role.children.forEach((r, i) => {
          const child = roleChild(target, r, i, swapped, owner);
          if (child) auditTree(r, child, owner, false, issues);
          else issues.push("\u041D\u0435\u0442 \u0441\u043B\u043E\u044F \xAB" + r.sample.name + "\xBB");
        });
        return issues;
      }
      module.exports = { properties, applyTree, auditTree, roleChild, OUTER };
    }
  });

  // tools/figma-plugins/plates-to-component/src/component.js
  var require_component = __commonJS({
    "tools/figma-plugins/plates-to-component/src/component.js"(exports, module) {
      var { ROLE_KEY, children, copy, pause, workSteps } = require_util();
      var { placement } = require_snapshot();
      var { assign, restoreGrid } = require_grid();
      var { applyTree, auditTree } = require_overrides();
      function restore(node, position, insert = true) {
        const p = position.props;
        if (insert) position.parent.insertChild(Math.min(position.index, children(position.parent).length), node);
        for (const key of ["minWidth", "maxWidth", "minHeight", "maxHeight", "constraints", "layoutAlign", "layoutGrow", "layoutPositioning"]) assign(node, key, p[key]);
        restoreGrid(node, p);
        if (node.resizeWithoutConstraints) node.resizeWithoutConstraints(Math.max(0.01, p.width), Math.max(0.01, p.height));
        for (const key of ["layoutSizingHorizontal", "layoutSizingVertical"]) if (p[key] !== void 0 && key in node) {
          if (p[key] !== "FILL" || position.parent.layoutMode && position.parent.layoutMode !== "NONE") assign(node, key, p[key]);
        }
        assign(node, "rotation", p.rotation);
        if (!position.parent.layoutMode || position.parent.layoutMode === "NONE" || p.layoutPositioning === "ABSOLUTE") {
          if (p.relativeTransform) assign(node, "relativeTransform", p.relativeTransform);
          else {
            assign(node, "x", p.x);
            assign(node, "y", p.y);
          }
        }
        assign(node, "visible", p.visible);
      }
      async function materialize(role, target, owner, created, helpers, inheritedLock = false, step = workSteps()) {
        await step();
        const source = role.members[owner] || role.sample;
        if (target.type === "INSTANCE" && role.nestedRebuild) target = target.detachInstance();
        const original = children(target);
        const mapping = /* @__PURE__ */ new Map();
        role.children.forEach((r) => {
          const member = r.members[owner];
          if (member) mapping.set(r, original[member.index]);
        });
        const lockedStructure = inheritedLock || target.type === "INSTANCE";
        for (let i = 0; i < role.children.length; i++) {
          const r = role.children[i];
          let child = mapping.get(r);
          let childOwner = owner;
          if (!child) {
            if (lockedStructure) throw new Error("\u041D\u0435\u043B\u044C\u0437\u044F \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u043B\u043E\u0439 \u0432\u043D\u0443\u0442\u0440\u044C \u043D\u0435\u0440\u0430\u0437\u043E\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u0438\u043D\u0441\u0442\u0430\u043D\u0441\u0430");
            child = r.sample.node.clone();
            created.push(child);
            childOwner = r.members.indexOf(r.sample);
            target.insertChild(i, child);
            child.visible = false;
          } else if (!lockedStructure) target.insertChild(i, child);
          child = await materialize(r, child, childOwner, created, helpers, lockedStructure, step);
          if (!r.members[owner]) child.visible = false;
          child.setPluginData(ROLE_KEY, r.id);
        }
        target.setPluginData(ROLE_KEY, role.id);
        if (role.nestedRebuild) {
          const position = placement(target);
          figma.currentPage.appendChild(target);
          const helper = figma.createComponentFromNode(target);
          created.push(helper);
          helper.name = source.name + " / \u041E\u0431\u0449\u0430\u044F \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430";
          helper.visible = true;
          helper.x = -15e4 - helpers.length * 2e3;
          helper.y = -15e4;
          helpers.push(helper);
          const instance = helper.createInstance();
          created.push(instance);
          restore(instance, position);
          instance.setPluginData(ROLE_KEY, role.id);
          role.helper = helper;
          return instance;
        }
        return target;
      }
      async function prepare(schema, staged, base, created = [], options = {}) {
        var _a, _b;
        const helpers = [];
        let template = staged[base];
        template = await materialize(schema.root, template, (_a = schema.templateOwner) != null ? _a : base, created, helpers);
        template.visible = schema.root.members[base].props.visible;
        const main = schema.commonSource ? template : figma.createComponentFromNode(template);
        created.push(main);
        main.name = schema.root.members[base].name;
        main.setPluginData(ROLE_KEY, schema.root.id);
        const outputs = [];
        const failures = [];
        if (schema.commonSource) {
          await applyTree(schema.root, main, base, true);
          failures.push(...auditTree(schema.root, main, base, true));
        }
        for (let i = 0; i < ((_b = schema.templateOwner) != null ? _b : staged.length); i++) {
          if (i === base) {
            outputs[i] = main;
            continue;
          }
          if (options.mainOnly) continue;
          await pause();
          const instance = main.createInstance();
          created.push(instance);
          instance.x = -12e4 - i * 2e3;
          instance.y = -12e4;
          try {
            await applyTree(schema.root, instance, i, true);
            failures.push(...auditTree(schema.root, instance, i, true));
          } catch (err) {
            failures.push(err.message || String(err));
          }
          if (options.discardInstances) {
            instance.remove();
            created.pop();
          } else outputs[i] = instance;
        }
        failures.push(...auditTree(schema.root, main, base, true));
        return { main, outputs, helpers, created, failures: Array.from(new Set(failures)) };
      }
      module.exports = { restore, materialize, prepare };
    }
  });

  // tools/figma-plugins/plates-to-component/src/plan.js
  var require_plan = __commonJS({
    "tools/figma-plugins/plates-to-component/src/plan.js"(exports, module) {
      var { clean, signature, capture } = require_snapshot();
      var { collect, schemaFor } = require_input();
      var { externalInstances } = require_selection();
      var { prepare } = require_component();
      var { copy, equal } = require_util();
      var { match } = require_matching();
      function visual(tree) {
        const props = copy(tree.props);
        delete props.name;
        delete props.exportSettings;
        return { type: tree.type, props, text: tree.text, main: tree.main && tree.main.id, children: tree.children.map(visual) };
      }
      function verifyExternal(before, after) {
        const bp = copy(before.props), ap = copy(after.props);
        delete bp.name;
        delete ap.name;
        if (before.type !== after.type || !equal(bp, ap) || !equal(before.text, after.text)) return false;
        const result = match(before.children, after.children.map((sample) => ({ sample })));
        if (result.conflicts.length || result.matches.some((i) => i < 0)) return false;
        const used = new Set(result.matches);
        if (after.children.some((n, i) => !used.has(i) && n.props.visible !== false)) return false;
        return before.children.every((n, i) => verifyExternal(n, after.children[result.matches[i]]));
      }
      async function analyze2(roots, base, onProgress = () => {
      }, cancelled) {
        var _a;
        let staged = [];
        const created = [];
        try {
          onProgress("\u0421\u043D\u0438\u043C\u043A\u0438 \u043F\u043B\u0430\u0448\u0435\u043A");
          const snap = await collect(roots, base, cancelled);
          staged = snap.staged;
          const signatures = snap.trees.map(signature);
          onProgress("\u0421\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u043B\u043E\u0451\u0432");
          const schema = schemaFor(snap, base);
          const external = await externalInstances(roots);
          const problems = schema.conflicts.slice();
          if (!problems.some((c) => c.severity === "error")) {
            onProgress("\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 overrides \u043D\u0430 \u043A\u043E\u043F\u0438\u044F\u0445");
            const prepared = await prepare(schema, staged, base, created, { discardInstances: true });
            prepared.failures.forEach((message) => problems.push({ kind: "override", severity: "error", message }));
            for (const entry of external) {
              onProgress("\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0445 \u0438\u043D\u0441\u0442\u0430\u043D\u0441\u043E\u0432");
              const temp = entry.node.clone();
              temp.visible = false;
              created.push(temp);
              const before = await capture(temp);
              temp.swapComponent(prepared.main);
              const after = await capture(temp);
              const bv = visual(before), av = visual(after);
              bv.main = null;
              av.main = null;
              if (!verifyExternal(before, after)) problems.push({ kind: "external", severity: "error", message: "\xAB" + entry.node.name + "\xBB: swapComponent \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0432\u0441\u0435 overrides \u0432\u043D\u0435\u0448\u043D\u0435\u0433\u043E \u0438\u043D\u0441\u0442\u0430\u043D\u0441\u0430. \u0421\u0442\u0430\u0440\u044B\u0439 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u043D\u0435\u043B\u044C\u0437\u044F \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E \u0443\u0434\u0430\u043B\u0438\u0442\u044C." });
              temp.remove();
              created.pop();
            }
            if (external.length && !problems.some((c) => c.kind === "external")) problems.push({ kind: "external", severity: "warning", message: "\u0421\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u0438\u043D\u0441\u0442\u0430\u043D\u0441\u044B: " + external.length + ". Figma swapComponent \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D \u043D\u0430 \u043A\u043E\u043F\u0438\u044F\u0445; \u043F\u0435\u0440\u0435\u0434 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435\u043C \u0441\u0442\u0430\u0440\u044B\u0445 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432 \u0431\u0443\u0434\u0443\u0442 \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0435\u043D\u044B \u0441\u0432\u044F\u0437\u0438." });
          }
          return { base, signatures, commonSignature: ((_a = snap.common) == null ? void 0 : _a.signature) || null, external, conflicts: problems, summary: { selected: roots.length, instances: roots.length - 1, components: 1 + schema.nested, added: schema.added, matched: schema.matched, replacedComponents: roots.filter((n) => n.type === "COMPONENT").length, replacedInstances: roots.filter((n) => n.type === "INSTANCE").length, external: external.length, ambiguous: problems.filter((c) => c.kind === "ambiguous").length, errors: problems.filter((c) => c.severity === "error").length }, schema };
        } finally {
          clean(created.reverse());
          clean(staged);
        }
      }
      module.exports = { analyze: analyze2, visual, verifyExternal };
    }
  });

  // tools/figma-plugins/plates-to-component/src/transaction.js
  var require_transaction = __commonJS({
    "tools/figma-plugins/plates-to-component/src/transaction.js"(exports, module) {
      var { clean, signature, placement, capture } = require_snapshot();
      var { collect, schemaFor } = require_input();
      var { prepare, restore } = require_component();
      var { checkGrid } = require_grid();
      var { applyTree, auditTree } = require_overrides();
      var { externalInstances } = require_selection();
      var { children, errorText, equal, pause, workSteps } = require_util();
      var { visual, verifyExternal } = require_plan();
      async function commit2(roots, plan, onProgress = () => {
      }, hooks = {}) {
        var _a;
        const positions = roots.map(placement), created = [], backups = [], swapped = [], moved = [];
        let staged = [];
        let outputs = [];
        let finalized = false;
        const selectedInstances = [];
        try {
          for (let i = 0; i < roots.length; i++) if (roots[i].type === "INSTANCE") selectedInstances.push({ index: i, main: await roots[i].getMainComponentAsync(), before: await capture(roots[i]) });
          onProgress("\u041F\u043E\u0432\u0442\u043E\u0440\u043D\u0430\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430");
          const snap = await collect(roots, plan.base);
          staged = snap.staged;
          if (snap.trees.some((t, i) => signature(t) !== plan.signatures[i])) throw new Error("\u041C\u0430\u043A\u0435\u0442 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0430\u043D\u0430\u043B\u0438\u0437\u0430. \u0412\u044B\u043F\u043E\u043B\u043D\u0438 \u0430\u043D\u0430\u043B\u0438\u0437 \u0435\u0449\u0451 \u0440\u0430\u0437.");
          if ((((_a = snap.common) == null ? void 0 : _a.signature) || null) !== plan.commonSignature) throw new Error("\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0430\u043D\u0430\u043B\u0438\u0437\u0430. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u0430\u043D\u0430\u043B\u0438\u0437.");
          const external = await externalInstances(roots);
          if (external.map((e) => e.node.id).sort().join("|") !== plan.external.map((e) => e.node.id).sort().join("|")) throw new Error("\u0421\u0432\u044F\u0437\u0438 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0438\u0441\u044C \u043F\u043E\u0441\u043B\u0435 \u0430\u043D\u0430\u043B\u0438\u0437\u0430. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u0430\u043D\u0430\u043B\u0438\u0437.");
          const schema = schemaFor(snap, plan.base);
          if (schema.conflicts.some((c) => c.severity === "error")) throw new Error("\u0412 \u043D\u043E\u0432\u043E\u043C \u0430\u043D\u0430\u043B\u0438\u0437\u0435 \u043E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442");
          onProgress("\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430");
          const prepared = await prepare(schema, staged, plan.base, created, { mainOnly: true });
          outputs = prepared.outputs;
          staged[plan.base] = null;
          if (prepared.failures.length) throw new Error(prepared.failures.join("\n"));
          for (let i = 0; i < roots.length; i++) {
            const backup = roots[i].clone();
            backups.push(backup);
            backup.visible = false;
            figma.currentPage.appendChild(backup);
            backup.x = -18e4 - i * 2e3;
            backup.y = -18e4;
            await pause();
          }
          for (const entry of external) {
            const before = await capture(entry.node);
            swapped.push({ entry, before, position: placement(entry.node) });
            entry.node.swapComponent(prepared.main);
            const after = await capture(entry.node), bv = visual(before), av = visual(after);
            bv.main = null;
            av.main = null;
            await pause();
            if (!verifyExternal(before, after)) throw new Error("\u0418\u0437\u043C\u0435\u043D\u0438\u043B\u0438\u0441\u044C overrides \u0432\u043D\u0435\u0448\u043D\u0435\u0433\u043E \u0438\u043D\u0441\u0442\u0430\u043D\u0441\u0430 \xAB" + entry.node.name + "\xBB");
          }
          if (hooks.afterSwaps) hooks.afterSwaps();
          onProgress("\u0420\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u043F\u043B\u0430\u0448\u0435\u043A");
          const holding = figma.createFrame();
          created.push(holding);
          holding.name = "\u041F\u043B\u0430\u0448\u043A\u0438: \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F";
          holding.visible = false;
          holding.x = -2e5;
          holding.y = -2e5;
          for (let i = 0; i < roots.length; i++) {
            if (i !== plan.base) {
              outputs[i] = prepared.main.createInstance();
              created.push(outputs[i]);
              outputs[i].visible = false;
            }
            holding.appendChild(roots[i]);
            moved.push(i);
            restore(outputs[i], positions[i]);
            await pause(120);
            if (i !== plan.base) {
              await applyTree(schema.root, outputs[i], i, true, workSteps(true));
              restore(outputs[i], positions[i], false);
              const failures = auditTree(schema.root, outputs[i], i, true);
              if (failures.length) throw new Error(failures.join("\n"));
            }
            if (hooks.afterPlacement) hooks.afterPlacement(i);
            await pause(120);
          }
          for (let i = 0; i < roots.length; i++) {
            const output = prepared.outputs[i], p = positions[i].props;
            checkGrid(output, p);
            if (!equal(output.width, p.width) || !equal(output.height, p.height)) throw new Error("Auto Layout \u0438\u0437\u043C\u0435\u043D\u0438\u043B \u0440\u0430\u0437\u043C\u0435\u0440 \xAB" + roots[i].name + "\xBB");
            if ((!positions[i].parent.layoutMode || positions[i].parent.layoutMode === "NONE" || p.layoutPositioning === "ABSOLUTE") && (!equal(output.x, p.x) || !equal(output.y, p.y))) throw new Error("\u041D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \xAB" + roots[i].name + "\xBB");
          }
          const anchor = prepared.main.absoluteBoundingBox || { x: prepared.main.x, y: prepared.main.y, width: prepared.main.width };
          prepared.helpers.forEach((n, i) => {
            n.x = anchor.x + anchor.width + 120 + i * 360;
            n.y = anchor.y;
          });
          if (hooks.beforeFinalize) hooks.beforeFinalize();
          for (const node of roots) node.remove();
          finalized = true;
          clean(backups);
          holding.remove();
          const result = prepared.outputs.slice();
          try {
            figma.currentPage.selection = result;
            figma.viewport.scrollAndZoomIntoView(result);
          } catch (e) {
            console.warn("plates-to-component: selection/viewport", e);
          }
          return { outputs: result, helpers: prepared.helpers.length };
        } catch (err) {
          let recovery2 = function(tree) {
            return { id: tree.roleId || "", sample: tree, members: [tree], children: tree.children.map(recovery2), nestedRebuild: false };
          };
          var recovery = recovery2;
          const rollbackErrors = [];
          for (const output of outputs) try {
            if (output && !output.removed) {
              figma.currentPage.appendChild(output);
              output.visible = false;
            }
          } catch (e) {
            rollbackErrors.push("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0441\u0432\u043E\u0431\u043E\u0434\u0438\u0442\u044C \u043C\u0435\u0441\u0442\u043E \u0434\u043B\u044F \u043E\u0442\u043A\u0430\u0442\u0430: " + errorText(e));
          }
          for (const i of moved.slice().sort((a, b) => positions[a].index - positions[b].index)) {
            try {
              const original = roots[i].removed ? backups[i] : roots[i];
              restore(original, positions[i]);
            } catch (e) {
              rollbackErrors.push(errorText(e));
            }
          }
          for (const item of selectedInstances) try {
            const oldIndex = roots.indexOf(item.main);
            if (oldIndex >= 0 && item.main.removed) {
              const restored = roots[item.index].removed ? backups[item.index] : roots[item.index];
              restored.swapComponent(backups[oldIndex]);
              await applyTree(recovery2(item.before), restored, 0, true);
              restore(restored, positions[item.index], false);
            }
          } catch (e) {
            rollbackErrors.push(errorText(e));
          }
          for (const item of swapped.reverse()) try {
            const index = roots.indexOf(item.entry.component);
            const old = item.entry.component.removed ? backups[index] : item.entry.component;
            item.entry.node.swapComponent(old);
            await applyTree(recovery2(item.before), item.entry.node, 0, true);
            restore(item.entry.node, item.position, false);
          } catch (e) {
            rollbackErrors.push(errorText(e));
          }
          clean(created.reverse());
          backups.forEach((n, i) => {
            if (n && !n.removed && n !== roots[i] && (!roots[i].removed || !moved.includes(i))) n.remove();
          });
          try {
            figma.currentPage.selection = roots.map((n, i) => n.removed ? backups[i] : n).filter((n) => n && !n.removed);
          } catch (_) {
          }
          const error = new Error(errorText(err) + (rollbackErrors.length ? "\n\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u043E\u0442\u043A\u0430\u0442\u0430: " + rollbackErrors.join("; ") : "\n\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0435 \u043F\u043B\u0430\u0448\u043A\u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B."));
          error.rollbackComplete = rollbackErrors.length === 0;
          throw error;
        } finally {
          clean(staged);
          if (finalized) clean(backups);
        }
      }
      module.exports = { commit: commit2 };
    }
  });

  // tools/figma-plugins/plates-to-component/src/main.js
  var { selection } = require_selection();
  var { analyze } = require_plan();
  var { commit } = require_transaction();
  figma.skipInvisibleInstanceChildren = false;
  figma.showUI(__html__, { width: 360, height: 260 });
  var generation = 0;
  var working = false;
  function send(type, data = {}) {
    figma.ui.postMessage(Object.assign({ type }, data));
  }
  function selectionHint(state) {
    if (state.roots.length < 2) return "\u0412\u044B\u0434\u0435\u043B\u0438 \u0434\u0432\u0435 \u0438\u043B\u0438 \u0431\u043E\u043B\u044C\u0448\u0435 \u043F\u043E\u0445\u043E\u0436\u0438\u0445 \u043F\u043B\u0430\u0448\u0435\u043A.";
    if (state.roots.some((n) => !["FRAME", "COMPONENT", "INSTANCE"].includes(n.type))) return "\u0412\u044B\u0434\u0435\u043B\u0438 \u043F\u043B\u0430\u0448\u043A\u0438 \u0446\u0435\u043B\u0438\u043A\u043E\u043C, \u0431\u0435\u0437 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0445 \u0441\u043B\u043E\u0451\u0432.";
    return "\u0412\u044B\u0434\u0435\u043B\u0438 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043B\u0430\u0448\u043A\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u0443\u0440\u043E\u0432\u043D\u044F.";
  }
  function update() {
    generation++;
    const state = selection();
    if (!working) send("selection", { ready: state.errors.length === 0, message: state.errors.length ? selectionHint(state) : "" });
  }
  figma.on("selectionchange", update);
  figma.on("currentpagechange", update);
  figma.ui.onmessage = async (msg) => {
    if (!msg || typeof msg.type !== "string") return;
    if (msg.type === "open-url") {
      if (typeof msg.url === "string" && /^https:\/\/(trace-logos\.ru|app\.lava\.top)\//.test(msg.url)) figma.openExternal(msg.url);
      return;
    }
    if (msg.type === "ready") {
      if (!working) update();
      return;
    }
    if (msg.type === "resize") {
      if (Number.isFinite(msg.height)) figma.ui.resize(360, Math.max(180, Math.min(850, msg.height)));
      return;
    }
    if (msg.type === "close") {
      if (!working) figma.closePlugin();
      return;
    }
    if (working || msg.type !== "convert") return;
    const state = selection();
    if (state.errors.length) {
      send("error", { message: selectionHint(state) });
      return;
    }
    const base = 0;
    working = true;
    const token = generation;
    send("working");
    try {
      const plan = await analyze(state.roots, base, () => {
      }, () => token !== generation);
      if (token !== generation || selection().key !== state.key) throw Object.assign(new Error("\u0412\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u043E\u0441\u044C."), { userMessage: "\u0412\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u043E\u0441\u044C. \u041D\u0430\u0436\u043C\u0438 \xAB\u0421\u043E\u0431\u0440\u0430\u0442\u044C \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\xBB \u0435\u0449\u0451 \u0440\u0430\u0437." });
      const conflicts = plan.conflicts.filter((c) => c.severity === "error");
      if (conflicts.length) {
        const error = new Error(conflicts.map((c) => c.message + (c.path ? "\n" + c.path : "")).join("\n\n"));
        error.userMessage = conflicts.some((c) => c.kind === "font") ? "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0448\u0440\u0438\u0444\u0442. \u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C\u044B\u0435 \u0448\u0440\u0438\u0444\u0442\u044B \u0438 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0441\u043D\u043E\u0432\u0430." : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0442\u044C \u044D\u0442\u0438 \u043F\u043B\u0430\u0448\u043A\u0438. \u0412\u044B\u0431\u0435\u0440\u0438 \u043F\u043B\u0430\u0448\u043A\u0438 \u0441 \u043F\u043E\u0445\u043E\u0436\u0438\u043C \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u044B\u043C.";
        throw error;
      }
      await commit(state.roots, plan);
      send("success");
      figma.notify("\u041F\u043B\u0430\u0448\u043A\u0438 \u0441\u043E\u0431\u0440\u0430\u043D\u044B.");
    } catch (e) {
      console.error("plates-to-component:", e);
      working = false;
      update();
      const message = e.rollbackComplete === false ? "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0441\u0431\u043E\u0440\u043A\u0443. \u041E\u0442\u043C\u0435\u043D\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0447\u0435\u0440\u0435\u0437 \u2318Z." : e.rollbackComplete === true ? "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0431\u0440\u0430\u0442\u044C \u043F\u043B\u0430\u0448\u043A\u0438. \u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0435 \u043F\u043B\u0430\u0448\u043A\u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B." : e.userMessage || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0431\u0440\u0430\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u043F\u043B\u0430\u0448\u043A\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0434\u0440\u0443\u0433\u043E\u0435 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435.";
      send("error", { message });
    } finally {
      working = false;
    }
  };
  update();
})();
