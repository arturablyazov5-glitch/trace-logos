#!/usr/bin/env python3
"""
One-shot migration: move iOS 26 (Tahoe) Apple app-icon PNGs into a versioned
folder layout and rewrite the category JSONs to a per-variant macos_styles model.

Target layout:
  assets/logos/pngs/apple/26/color/<slug>.png
  assets/logos/pngs/apple/26/black/<slug>.png
  assets/logos/pngs/apple/26/white/<slug>.png
  assets/logos/pngs/apple/old/<slug>.png   (historical "Old Icon" variants)

JSON model after migration:
  - SVG-primary item:  file=*.svg, variants=[{label:"iOS 26 Tahoe", file:.../26/color/x.png,
                       macos_styles:{dark,light}}, ...old...]; item.macos_styles removed.
  - PNG-primary item:  file=.../26/color/x.png, item.macos_styles={dark,light} (drives _original tabs).

Run:  python3 scripts/migrate-apple-icons.py --dry-run
      python3 scripts/migrate-apple-icons.py --apply
"""
import json, os, re, sys, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CDIR = os.path.join(ROOT, 'logos/categories')
PNGS = os.path.join(ROOT, 'assets/logos/pngs')
APPLE = os.path.join(PNGS, 'apple')

DRY = '--apply' not in sys.argv

# SVG-logo items that are NOT app icons — skip entirely.
SKIP_NAMES = {'Apple Pay', 'Face ID', 'Apple Intelligence'}

def slugify(name):
    s = name.lower()
    s = s.replace('-tahoe', '')
    s = re.sub(r'\.png$', '', s)
    s = s.replace('(', ' ').replace(')', ' ')
    s = re.sub(r'\s+', '-', s.strip())
    s = re.sub(r'-+', '-', s)
    return s

def basename_slug(path):
    return slugify(os.path.basename(path))

moves = []          # (src_abs, dst_abs)
move_seen = set()
errors = []

def plan_move(src_rel, dst_rel):
    src = os.path.join(PNGS, src_rel)
    dst = os.path.join(PNGS, dst_rel)
    if not os.path.exists(src):
        errors.append(f"MISSING SOURCE: {src_rel}")
        return
    key = src
    if key in move_seen:
        return
    move_seen.add(key)
    moves.append((src, dst, src_rel, dst_rel))

json_writes = {}

for fn in sorted(os.listdir(CDIR)):
    if not fn.endswith('.json'):
        continue
    path = os.path.join(CDIR, fn)
    with open(path) as f:
        data = json.load(f)
    changed = False
    for item in data.get('items', []):
        if item.get('ecosystem') != 'apple':
            continue
        if item.get('name') in SKIP_NAMES:
            continue
        mf = item.get('file', '')
        ms = item.get('macos_styles') or {}
        variants = item.get('variants', []) or []

        # Determine canonical slug
        if ms.get('dark'):
            slug = basename_slug(ms['dark'])
        elif mf.endswith('.png'):
            slug = slugify(mf)
        else:
            # svg-primary: slug from the iOS26 -tahoe variant
            tahoe = next((v for v in variants if isinstance(v, dict)
                          and v.get('file','').endswith('-tahoe.png')), None)
            slug = slugify(tahoe['file']) if tahoe else slugify(item['name'])

        color26 = f"apple/26/color/{slug}.png"
        dark26  = f"apple/26/black/{slug}.png"
        light26 = f"apple/26/white/{slug}.png"

        # --- plan file moves & build new variant list ---
        new_variants = []

        if mf.endswith('.svg'):
            # SVG-primary: find the iOS26 tahoe variant (color), move it
            tahoe = next((v for v in variants if isinstance(v, dict)
                          and v.get('file','').endswith('-tahoe.png')
                          and 'old' not in v.get('file','')), None)
            if tahoe:
                plan_move(tahoe['file'], color26)
            ios26 = {"label": "iOS 26 Tahoe", "file": color26}
            ds = {}
            if ms.get('dark'):
                plan_move(ms['dark'], dark26); ds['dark'] = dark26
            if ms.get('light'):
                plan_move(ms['light'], light26); ds['light'] = light26
            if ds:
                ios26['macos_styles'] = ds
            new_variants.append(ios26)
            # carry over OLD variants
            for v in variants:
                if not isinstance(v, dict): continue
                vf = v.get('file','')
                if vf.endswith('-tahoe.png') and 'old' not in vf:
                    continue  # that's the iOS26 we just handled
                if 'old' in vf and vf.endswith('.png'):
                    oslug = slugify(vf.replace('-tahoe',''))
                    odst = f"apple/old/{oslug}.png"
                    plan_move(vf, odst)
                    nv = dict(v); nv['file'] = odst
                    new_variants.append(nv)
                else:
                    new_variants.append(v)
            item['variants'] = new_variants
            if 'macos_styles' in item:
                del item['macos_styles']
            changed = True

        elif mf.endswith('.png'):
            # PNG-primary: primary IS iOS26 color
            plan_move(mf, color26)
            item['file'] = color26
            ds = {}
            if ms.get('dark'):
                plan_move(ms['dark'], dark26); ds['dark'] = dark26
            if ms.get('light'):
                plan_move(ms['light'], light26); ds['light'] = light26
            if ds:
                item['macos_styles'] = ds
            elif 'macos_styles' in item:
                del item['macos_styles']
            # OLD variants
            for v in variants:
                if not isinstance(v, dict):
                    new_variants.append(v); continue
                vf = v.get('file','')
                if 'old' in vf and vf.endswith('.png'):
                    oslug = slugify(vf.replace('-tahoe',''))
                    odst = f"apple/old/{oslug}.png"
                    plan_move(vf, odst)
                    nv = dict(v); nv['file'] = odst
                    new_variants.append(nv)
                else:
                    new_variants.append(v)
            item['variants'] = new_variants
            changed = True

    if changed:
        json_writes[path] = data

# --- report ---
print(f"=== {'DRY-RUN' if DRY else 'APPLY'} ===")
print(f"File moves planned: {len(moves)}")
print(f"JSON files to rewrite: {len(json_writes)}")
print(f"Errors: {len(errors)}")
for e in errors:
    print("  ", e)

if errors:
    print("\nABORTING due to missing sources. Fix before --apply.")
    sys.exit(1)

# sample
for m in moves[:8]:
    print("  ", m[2], "->", m[3])
print("   ...")

if DRY:
    print("\nDry-run only. Re-run with --apply to execute.")
    sys.exit(0)

# execute moves
for src, dst, *_ in moves:
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.move(src, dst)
# write JSONs
for path, data in json_writes.items():
    with open(path, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
print(f"\nDone. Moved {len(moves)} files, rewrote {len(json_writes)} JSONs.")
