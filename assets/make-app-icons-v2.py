#!/usr/bin/env python3
"""Regenerate ALL app icon files from the v2 logo artwork.

Source: assets/icon-artwork-v2.png (1600x1600 RGBA, transparent bg)
        = the favicon egg + the stethoscope recoloured to the egg's brown.
Rules (same as v1.3):
  icon.png + legacy mipmaps : white bg, artwork at 72% of the canvas
  ic_launcher_round         : same as launcher, circular mask
  adaptive foreground       : transparent bg, artwork at 66% of the canvas
  splash                    : white bg, artwork at 42% of the min dimension
  favicon                   : full logo, cropped to the artwork bbox + 2%
  notification small icon   : white silhouette of the logo
Run from the repo root:  python3 assets/make-app-icons-v2.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'assets', 'icon-artwork-v2.png')
art = Image.open(ART).convert('RGBA')
print('artwork:', art.size)
# opaque bbox of the artwork (for the favicon crop)
import numpy as np
aa = np.array(art)
ys, xs = np.where(aa[..., 3] > 10)
bbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
print('artwork opaque bbox:', bbox)

RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')


def paste_centred(canvas, img, frac):
    """Paste img scaled to frac of the canvas's min side, centred."""
    w, h = canvas.size
    side = round(min(w, h) * frac)
    r = img.resize((side, side), Image.LANCZOS)
    canvas.alpha_composite(r, ((w - side) // 2, (h - side) // 2))
    return canvas


def white_canvas(size):
    return Image.new('RGBA', (size, size), (255, 255, 255, 255))


def round_mask(size):
    """Antialiased circular mask (4x supersample)."""
    s = size * 4
    m = Image.new('L', (s, s), 0)
    ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255)
    return m.resize((size, size), Image.LANCZOS)


# --- 1. assets/icon.png: 1024, white bg, artwork 72% ---
icon1024 = paste_centred(white_canvas(1024), art, 0.72).convert('RGB')
icon1024.save(os.path.join(ROOT, 'assets', 'icon.png'))
print('saved assets/icon.png 1024')

# --- 2. legacy mipmaps + round + adaptive foreground ---
DENS = [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]
for name, size in DENS:
    d = os.path.join(RES, f'mipmap-{name}')
    launcher = paste_centred(white_canvas(size), art, 0.72)
    launcher.convert('RGB').save(os.path.join(d, 'ic_launcher.png'))
    # round: same launcher through a circular mask
    rounded = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    rounded.paste(launcher, (0, 0), round_mask(size))
    rounded.convert('RGB').save(os.path.join(d, 'ic_launcher_round.png'))
    # adaptive foreground: transparent bg, artwork 66% (canvas = size*2.25)
    fsize = int(size * 2.25)
    fg = Image.new('RGBA', (fsize, fsize), (0, 0, 0, 0))
    paste_centred(fg, art, 0.66)
    fg.save(os.path.join(d, 'ic_launcher_foreground.png'))
    print(f'saved mipmap-{name}: launcher {size}, round {size}, foreground {fsize}')

# --- 3. splash: white bg, artwork 42% of min dimension, centred ---
def make_splash(w, h):
    c = Image.new('RGBA', (w, h), (255, 255, 255, 255))
    side = round(min(w, h) * 0.42)
    r = art.resize((side, side), Image.LANCZOS)
    c.alpha_composite(r, ((w - side) // 2, (h - side) // 2))
    return c.convert('RGB')

splash_src = make_splash(2732, 2732)
splash_src.save(os.path.join(ROOT, 'assets', 'splash.png'))
print('saved assets/splash.png 2732')
SPLASHES = [
    ('drawable', 480, 320),
    ('drawable-land-mdpi', 480, 320), ('drawable-land-hdpi', 800, 480),
    ('drawable-land-xhdpi', 1280, 720), ('drawable-land-xxhdpi', 1600, 960),
    ('drawable-land-xxxhdpi', 1920, 1280),
    ('drawable-port-mdpi', 320, 480), ('drawable-port-hdpi', 480, 800),
    ('drawable-port-xhdpi', 720, 1280), ('drawable-port-xxhdpi', 960, 1600),
    ('drawable-port-xxxhdpi', 1280, 1920),
]
for name, w, h in SPLASHES:
    make_splash(w, h).save(os.path.join(RES, name, 'splash.png'))
    print(f'saved {name}/splash.png {w}x{h}')

# --- 4. favicon: full logo, square crop around the strong bbox + 2% padding
# (alpha>128: the artwork has a few near-white alpha 17-34 specks at the
# top edge that would otherwise widen the crop and shrink the logo) ---
ys, xs = np.where(aa[..., 3] > 128)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
side = max(x1 - x0, y1 - y0) + int(0.04 * 1600)
half = side // 2
fav = art.crop((cx - half, cy - half, cx + half, cy + half)).resize((180, 180), Image.LANCZOS)
fav.save(os.path.join(ROOT, 'public', 'nourish-fav.png'))
print('saved public/nourish-fav.png 180 (square crop side', side, ')')

# --- 5. notification small icon: white silhouette of the logo ---
# Android small icons must be white-on-transparent; the system tints them.
# Resize the alpha first (LANCZOS keeps the thin tube as faint alpha),
# then a low threshold keeps those faint parts, so the tube stays visible.
alpha = art.split()[3]
SIL = [('mdpi', 24), ('hdpi', 36), ('xhdpi', 48), ('xxhdpi', 72), ('xxxhdpi', 96)]
for name, size in SIL:
    a = alpha.resize((size, size), Image.LANCZOS)
    arr = np.array(a)
    sil = np.zeros((size, size, 4), dtype=np.uint8)
    sil[..., 0] = 255
    sil[..., 1] = 255
    sil[..., 2] = 255
    sil[..., 3] = np.where(arr > 40, 255, 0).astype(np.uint8)
    d = os.path.join(RES, f'drawable-{name}')
    os.makedirs(d, exist_ok=True)
    Image.fromarray(sil, 'RGBA').save(os.path.join(d, 'ic_stat_nourish.png'))
    print(f'saved drawable-{name}/ic_stat_nourish.png {size}')

print('DONE — all icon files regenerated from icon-artwork-v2.png')
