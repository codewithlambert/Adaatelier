"""Prints original wax-print (Ankara) and mud-cloth patterns onto the bundled bag photos.

Each pattern is drawn in code, then shaded by the photo's own light so folds, seams and
highlights survive. Writes a product photo and a 3D cut-out per print into src/assets.

    python scripts/ankara.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path(__file__).resolve().parent.parent / "src" / "assets"


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def grid(w, h, cell, ox=0.0, oy=0.0):
    """Position inside a repeating tile (centred, -0.5..0.5) plus the tile index."""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    u, v = (x + ox) / cell, (y + oy) / cell
    iu, iv = np.floor(u), np.floor(v)
    return u - iu - 0.5, v - iv - 0.5, iu, iv


def paint(shape, layers):
    """layers: (bool mask, hex) painted in order."""
    out = np.zeros(shape + (3,), np.float32)
    for m, c in layers:
        out[m] = hexrgb(c)
    return out


def sunburst(w, h, cell):
    """Concentric rings on a half-drop grid, with seed dots between them."""
    pal = ["#1d2a6e", "#e3a21a", "#c2412b", "#f3e7cc", "#14736b"]
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    row = np.floor(y / cell)
    fx, fy, iu, iv = grid(w, h, cell, ox=(row % 2) * cell / 2)
    r = np.hypot(fx, fy)
    ring = np.floor(r * 10).astype(int)
    alt = ((iu + iv) % 2).astype(bool)
    out = paint((h, w), [(np.ones((h, w), bool), pal[0])])
    for k, c in enumerate([pal[3], pal[2], pal[1], pal[4], pal[3]]):
        m = (ring == k) & (r < 0.5)
        out[m] = hexrgb(pal[1] if (alt[m].any() and k == 2) else c)
    out[(ring == 2) & alt & (r < 0.5)] = hexrgb(pal[4])
    # spokes in the outer ring
    ang = np.arctan2(fy, fx)
    spokes = (np.sin(ang * 16) > 0.55) & (r > 0.4) & (r < 0.5)
    out[spokes] = hexrgb(pal[2])
    # seed dots in the gaps
    dx, dy = fx - np.sign(fx) * 0.5, fy - np.sign(fy) * 0.5
    out[np.hypot(dx, dy) < 0.07] = hexrgb(pal[1])
    return out


def diamonds(w, h, cell):
    """Nested diamonds with a striped border, the classic 'Nsu bura' feel."""
    pal = ["#5b1a3a", "#f0b43c", "#0f5e5b", "#f4ead5", "#e2552f"]
    fx, fy, iu, iv = grid(w, h, cell)
    d = np.abs(fx) + np.abs(fy)
    out = paint((h, w), [(np.ones((h, w), bool), pal[0])])
    out[d < 0.48] = hexrgb(pal[3])
    out[d < 0.42] = hexrgb(pal[2])
    out[d < 0.30] = hexrgb(pal[1])
    out[d < 0.18] = hexrgb(pal[4])
    out[d < 0.07] = hexrgb(pal[3])
    # fine stripes across the outer band
    stripes = (np.sin((fx - fy) * 70) > 0.3) & (d > 0.42) & (d < 0.48)
    out[stripes] = hexrgb(pal[4])
    # corner dots
    out[(np.abs(np.abs(fx) - 0.5) + np.abs(np.abs(fy) - 0.5)) < 0.08] = hexrgb(pal[1])
    return out


def fans(w, h, cell):
    """Overlapping scallop fans, alternating colourways row by row."""
    pal = ["#f2e4c4", "#1b3b8c", "#d9822b", "#9e2a2b", "#2f6b3a"]
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    row = np.floor(y / (cell / 2))
    fx, fy, iu, _ = grid(w, h, cell, ox=(row % 2) * cell / 2)
    fy = (y / (cell / 2) - row) - 1.0  # 0..1 band, fan centred at the band bottom
    r = np.hypot(fx * 2, fy * 2) / 2
    ring = np.floor(r * 8).astype(int)
    colours = [pal[1], pal[0], pal[2], pal[0], pal[3], pal[0], pal[4], pal[0]]
    out = paint((h, w), [(np.ones((h, w), bool), pal[0])])
    swap = (row % 3).astype(int)
    for k in range(8):
        m = ring == k
        for s in range(3):
            mm = m & (swap == s)
            out[mm] = hexrgb(colours[(k + s * 2) % 8])
    return out


def mudcloth(w, h, cell):
    """Bògòlanfini-style marks: bands of dashes, crosses and dots, cream on earth brown."""
    ground, mark = "#3b2418", "#eadcc2"
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    band = np.floor(y / cell).astype(int) % 4
    fy = (y % cell) / cell
    fx = (x % (cell / 2)) / (cell / 2)
    out = paint((h, w), [(np.ones((h, w), bool), ground)])
    lines = (np.abs(fy - 0.5) < 0.04)  # rule between motifs
    dashes = (band == 0) & (np.abs(fy - 0.5) < 0.12) & (np.abs(fx - 0.5) < 0.3)
    xs = (band == 1) & (
        (np.abs((fx - 0.5) - (fy - 0.5)) < 0.06) | (np.abs((fx - 0.5) + (fy - 0.5)) < 0.06)
    ) & (np.abs(fy - 0.5) < 0.3)
    dots = (band == 2) & (np.hypot(fx - 0.5, fy - 0.5) < 0.12)
    zig = (band == 3) & (np.abs(fy - 0.5 - 0.25 * np.abs(((fx * 2) % 2) - 1) + 0.12) < 0.06)
    out[(lines & ((band == 1) | (band == 3))) | dashes | xs | dots | zig] = hexrgb(mark)
    return out


def apply(photo, mask, pattern, strength=0.9):
    """Pattern on the masked body, lit by the photo's own shading."""
    img = np.asarray(photo.convert("RGB"), np.float32)
    # close small holes in the mask (shine spots), so the print covers the whole body
    alpha = mask.convert("RGBA").getchannel("A")
    k = max(3, (min(alpha.size) // 30) | 1)
    alpha = alpha.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MinFilter(k))
    # and the larger glare holes: anything the outside can't reach is part of the bag
    outside = alpha.point(lambda v: 255 if v > 64 else 0)
    ImageDraw.floodfill(outside, (0, 0), 128)
    holes = np.asarray(outside) == 0
    a = np.asarray(alpha, np.float32) / 255.0
    a[holes] = 1.0
    lum = img.mean(axis=2)
    sel = a > 0.5
    ref = np.median(lum[sel]) if sel.any() else 1.0
    shade = np.clip(lum / max(ref, 1.0), 0.35, 1.35) ** 0.85
    printed = np.clip(pattern * shade[..., None] * 0.92, 0, 255)
    k = (a * strength)[..., None]
    return img * (1 - k) + printed * k


def make(src, name, pattern_fn, cell_frac):
    photo = Image.open(ASSETS / f"{src}.jpg")
    mask = Image.open(ASSETS / f"{src}-mask.png").resize(photo.size)
    w, h = photo.size
    pat = pattern_fn(w, h, max(24, int(w * cell_frac)))
    out = apply(photo, mask, pat)
    Image.fromarray(out.astype(np.uint8)).save(ASSETS / f"{name}.jpg", quality=86)

    cut = Image.open(ASSETS / f"{src}-3d.png").convert("RGBA")
    cmask = Image.open(ASSETS / f"{src}-3d-mask.png").resize(cut.size)
    cw, ch = cut.size
    # same print scale as the photo, relative to the bag's width
    pat3 = pattern_fn(cw, ch, max(16, int(cw * cell_frac * 1.6)))
    rgb = apply(cut, cmask, pat3)
    alpha = np.asarray(cut, np.float32)[..., 3:4]
    Image.fromarray(np.concatenate([rgb, alpha], axis=2).astype(np.uint8), "RGBA").save(
        ASSETS / f"{name}-3d.png", optimize=True
    )
    print("wrote", name)


if __name__ == "__main__":
    make("bag2", "ankara-shopper", sunburst, 0.11)
    make("hero", "ankara-tote", diamonds, 0.06)
    make("bag3", "ankara-saddle", fans, 0.09)
    make("blog1", "mudcloth-backpack", mudcloth, 0.08)
