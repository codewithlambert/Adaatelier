"""Rebuilds the *-3d-body.png masks: the solid body of each bag, without handles or straps.

The 3D viewer stacks these masks to give the bag depth. Anything thin left in them (a handle,
a strap, the apex of a handle) gets stacked too and shows as a comb of slices from the side, so
thin parts are removed with a morphological opening wider than any handle. The result is then
pulled a couple of pixels inside the cut-out so the depth never peeks past the bag's outline.

    python scripts/body_masks.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path(__file__).resolve().parent.parent / "src" / "assets"

# opening size as a share of the cut-out's width: wider than any handle or strap on that bag
BAGS = {"hero": 0.06, "bag1": 0.07, "bag2": 0.14, "bag3": 0.06, "blog1": 0.12}


def odd(n: float) -> int:
    n = max(3, int(round(n)))
    return n if n % 2 else n + 1


for name, share in BAGS.items():
    cut = Image.open(ASSETS / f"{name}-3d.png").convert("RGBA")
    alpha = cut.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    k = odd(cut.width * share)
    # opening: shrink away anything thinner than k, then grow the rest back
    body = alpha.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))
    a = np.asarray(body) > 0
    rows = np.where(a.any(axis=1))[0]
    # stay inside the real outline
    inner = np.asarray(alpha.filter(ImageFilter.MinFilter(5))) > 0
    a &= inner
    # fill enclosed holes (a zip pull, a buckle gap): anything the outside can't reach is body
    filled = Image.fromarray(np.where(a, 255, 0).astype(np.uint8)).copy()
    ImageDraw.floodfill(filled, (0, 0), 128)
    a |= np.asarray(filled) == 0
    out = np.zeros(a.shape + (4,), np.uint8)
    out[a] = (0, 0, 0, 255)
    Image.fromarray(out, "RGBA").save(ASSETS / f"{name}-3d-body.png", optimize=True)
    print(f"{name}: kernel {k}px, body {a.mean():.0%} of frame, rows {rows.min() if rows.size else '-'}–{rows.max() if rows.size else '-'}")
