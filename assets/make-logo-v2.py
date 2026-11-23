"""Build logo v2: the favicon egg (the egg from Abdul's screenshot) inside the
stethoscope from the v1 artwork, with the tube recoloured to the egg's brown.
Key insight from diagnostics: the old egg and the tube share one hue family
(R-G 70-100) — they only separate by LIGHTNESS and by SPACE (white gaps).
So the egg is found by a LOOSE warm mask + largest connected component
(the egg ~490k px; the tube ring is a separate, smaller blob).
Outputs (NOT applied to the app yet — previews for Abdul's approval first):
  assets/icon-artwork-v2.png  - new 1600x1600 RGBA artwork (transparent bg)
  assets/logo-preview.png     - 1024 white bg, artwork at 72% (future icon.png)
  assets/logo-preview-circle.png - same, circle-masked (launcher preview)
"""
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

ART = 'assets/media-generation-stethoscope-full-warm-swoosh-0-0d57bb3d-341d-4c35-8a34-e64c843e9bea.png'
# NEVER read public/nourish-fav.png here: that file is a GENERATED output
# (make-app-icons-v2.py overwrites it with the full logo, egg + stethoscope).
# Using it as the egg source pastes a miniature stethoscope inside the logo.
# The plain egg lives here and is never overwritten:
FAV = 'assets/favicon-egg-source.png'

art = np.array(Image.open(ART).convert('RGB')).astype(int)
H, W = art.shape[:2]
R, G, B = art[..., 0], art[..., 1], art[..., 2]

# --- 1. white background -> transparent (feathered) ---
mn = np.minimum(np.minimum(R, G), B)
alpha = np.clip((250 - mn) / 15.0, 0, 1) * 255  # <=235 opaque, >=250 clear
rgba = np.dstack([art, alpha.astype(np.uint8)])

# --- 2. loose warm mask -> largest connected component = the old egg ---
warm = (R > 150) & (G > 75) & (B < 175) & (R > G) & (G > B) & ((R - G) < 108) & ((G - B) > 18)
warm_nearwhite = (R > 200) & (G > 180) & (B > 150) & (R > G) & (G > B) & ((R - B) < 45)
mask = warm | warm_nearwhite
lab, n = ndimage.label(mask)
sizes = ndimage.sum_labels(np.ones_like(lab), lab, range(1, n + 1))
order = np.argsort(sizes)[::-1][:5]
print('top components (px, bbox):')
for i in order:
    ys, xs = np.where(lab == i + 1)
    print(f'  px={int(sizes[i])} bbox x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}')
egg_id = int(order[0]) + 1
egg_comp = lab == egg_id
ys, xs = np.where(egg_comp)
print('old egg bbox: x', xs.min(), xs.max(), 'y', ys.min(), ys.max())
x0, x1 = max(0, xs.min() - 25), min(W, xs.max() + 26)
y0, y1 = max(0, ys.min() - 15), min(H, ys.max() + 16)
# verify: warm pixels in the far left/right bands (pure tube zone) must survive
side = np.zeros_like(mask)
side[:, :350] = True
side[:, 1250:] = True
print('side-band warm px before erase:', int((mask & side).sum()))
erase = np.zeros_like(mask)
erase[y0:y1, x0:x1] = egg_comp[y0:y1, x0:x1]
# also clear the warm near-white highlight remnant inside the egg box
erase[y0:y1, x0:x1] |= warm_nearwhite[y0:y1, x0:x1]
rgba[erase, 3] = 0
print('side-band warm px after erase: ', int((mask & side & (rgba[..., 3] > 0)).sum()))

# --- 3. sample the new egg's browns (favicon) for the tube colour ---
fav = Image.open(FAV).convert('RGBA')

# --- 2b. clip the swoosh to the egg body: the line stays ONLY inside the
# egg, it must not stick out on either side. Its colour is NOT touched —
# the same golden-yellow -> orange as in Abdul's egg; only the parts
# outside the egg's outline are cut off. ---
f0 = np.array(fav)
a0 = f0[..., 3]
opaque0 = a0 > 10
rows = np.arange(fav.height)
L = np.full(fav.height, -1.0)
Rr = np.full(fav.height, -1.0)
for y in range(fav.height):
    row_xs = np.where(opaque0[y])[0]
    if len(row_xs):
        L[y], Rr[y] = row_xs.min(), row_xs.max()
valid = L >= 0

def _smooth(v, mask):
    # fill gaps by interpolation, then a 5-row moving average: the
    # favicon's edge jitters ~1px row to row, and a per-row cut would
    # leave a sawtooth edge after the 5.4x upscale
    v2 = np.interp(rows, rows[mask], v[mask])
    k = 5
    return np.convolve(np.pad(v2, (k // 2, k // 2), mode='edge'),
                       np.ones(k) / k, mode='valid')

Lf = _smooth(L, valid)
Rf = _smooth(Rr, valid)
# two-pass: fit the body's smooth edge from rows with no bright-yellow
# swoosh, find the rows where the outline sticks out beyond that fit
# (that is the line's tip — it slants further down than the yellow core),
# refit without those rows and cut there.
yellow = (f0[..., 0] > 220) & (f0[..., 1] > 185) & (f0[..., 2] < 110) & opaque0
y_rows = np.where(yellow.any(axis=1))[0]
excl = np.zeros(fav.height, dtype=bool)
if len(y_rows):
    excl[max(0, y_rows.min() - 6):min(fav.height, y_rows.max() + 7)] = True

def _fit_edge(mask):
    pl = np.polyfit(rows[mask], Lf[mask], 2)
    pr = np.polyfit(rows[mask], Rf[mask], 2)
    return np.polyval(pl, rows), np.polyval(pr, rows)

fitL, fitR = _fit_edge(valid & ~excl)
protrude = valid & ((Lf < fitL - 3) | (Rf > fitR + 3))
if protrude.any():
    fitL, fitR = _fit_edge(valid & ~protrude)
    Lf[protrude] = np.clip(fitL[protrude], 0, fav.width - 1)
    Rf[protrude] = np.clip(fitR[protrude], 0, fav.width - 1)
    # blend the fitted rows into the neighbouring rows so the cut edge
    # has no step where the fit meets the raw edge
    Lf = _smooth(Lf, valid)
    Rf = _smooth(Rf, valid)
    yy, xx = np.mgrid[0:fav.height, 0:fav.width]
    # 1px inset: the smoothing pulls the boundary a hair outward, leaving
    # a sliver of the line; the body's edge under the line is hidden anyway
    outside = (xx < (Lf[:, None] - 2)) | (xx > (Rf[:, None] + 2))
    cut = np.array(fav)
    cut[outside & (cut[..., 3] > 0), 3] = 0
    print('swoosh clipped: px removed:', int((outside & (a0 > 0)).sum()),
          '| protruding rows:', int(protrude.sum()))
    fav = Image.fromarray(cut, 'RGBA')
    # soften the cut edge: restore a ~1px alpha falloff so the outline
    # stays smooth after the 5.4x upscale
    fa_blur = fav.split()[3].filter(ImageFilter.GaussianBlur(radius=1.0))
    fav.putalpha(fa_blur)
f = np.array(fav).astype(int)
fa = f[..., 3]
fr, fg, fb = f[..., 0], f[..., 1], f[..., 2]
opaque = fa > 200
# dominant browns: quantize opaque pixels to 32-steps and count
q = (f[opaque][..., :3] // 32).astype(int)
from collections import Counter
cnt = Counter(map(tuple, q))
print('favicon dominant quantised RGBs (x32):', cnt.most_common(6))
upper = np.zeros_like(fa, dtype=bool)
fys, fxs = np.where(fa > 10)
upper[int(fys.min()):int(fys.min() + (fys.max() - fys.min()) * 0.35), :] = True
swoosh_f = (fr > 195) & (fg > 130) & (fb < 155)
highlight = (fr > 232) & (fg > 225) & (fb > 210)
body = opaque & upper & ~swoosh_f & ~highlight
egg_brown = np.median(f[body][..., :3], axis=0)
print('new egg upper-body brown (median):', egg_brown)
print('favicon egg size:', fav.size)

# --- 4. recolour the stethoscope tube to the egg's brown (keep shading) ---
target = egg_brown * 0.75  # deeper than the egg, so the tube frames it
print('tube target RGB:', target.round(1))
tube = (R > 140) & (R < 235) & (G > 60) & (G < 155) & (B < 100) & ((R - G) > 70)
tube_mask = tube & (rgba[..., 3] > 0)
pix = rgba[..., :3][tube_mask].astype(float)
lum = pix.mean(axis=1, keepdims=True)
target_lum = target.mean()
scale = np.clip(lum / max(target_lum, 1), 0.35, 1.6)
new_col = np.clip(target * scale, 0, 255)
rgba[..., :3][tube_mask] = new_col.astype(np.uint8)
print('tube px recoloured:', int(tube_mask.sum()))

# --- 5. paste the new egg (scaled to the old egg's height) ---
old_h = ys.max() - ys.min() + 1
old_cx, old_cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2
print('old egg h:', old_h, 'centre:', (old_cx, old_cy))
fh, fw = fys.max() - fys.min() + 1, fxs.max() - fxs.min() + 1
new_h = old_h
new_w = round(new_h * fw / fh)
egg = fav.crop((fxs.min(), fys.min(), fxs.max() + 1, fys.max() + 1))
egg = egg.resize((new_w, new_h), Image.LANCZOS)
egg = egg.filter(ImageFilter.UnsharpMask(radius=2, percent=55, threshold=2))
print('new egg placed size:', egg.size)
base = Image.fromarray(rgba.astype(np.uint8), 'RGBA')
egg_x, egg_y = old_cx - new_w // 2, old_cy - new_h // 2
base.alpha_composite(egg, (egg_x, egg_y))

# --- 5b. clean up leftover fragments of the OLD egg/swoosh: small warm
# blobs that are neither the new egg nor the tube (e.g. the old swoosh tip
# that stuck out past the egg's right edge). ---
arr = np.array(base)
a2 = arr[..., 3]
egg_alpha = np.zeros((H, W), dtype=bool)
egg_alpha[egg_y:egg_y + new_h, egg_x:egg_x + new_w] = np.array(egg)[..., 3] > 10
remnant = (arr[..., 0] > 150) & (arr[..., 1] > 75) & (arr[..., 2] < 175) & \
    (arr[..., 0] > arr[..., 1]) & (arr[..., 1] > arr[..., 2]) & (a2 > 0) & (~egg_alpha)
# pale warm fringe (old egg's pale edge) and dark warm fringe (old egg's
# dark bottom edge / swoosh tip): both escape the warm test above
pale_warm = (arr[..., 0] > 200) & (arr[..., 1] > 175) & (arr[..., 2] > 140) & \
    (arr[..., 0] >= arr[..., 1]) & (arr[..., 1] >= arr[..., 2]) & \
    ((arr[..., 0] - arr[..., 2]) > 4) & ((arr[..., 0] - arr[..., 2]) < 70)
dark_warm = (arr[..., 0] > 25) & (arr[..., 0] < 165) & (arr[..., 1] > 10) & \
    (arr[..., 1] < 95) & (arr[..., 2] < 65) & \
    (arr[..., 0] > arr[..., 1]) & (arr[..., 1] > arr[..., 2])
remnant = (remnant | (pale_warm & (a2 > 0) & (~egg_alpha)) |
           (dark_warm & (a2 > 0) & (~egg_alpha)))
remnant[:200, :] = False
remnant[1250:, :] = False
remnant[:, :300] = False
remnant[:, 1300:] = False
lab2, n2 = ndimage.label(remnant)
sizes2 = ndimage.sum_labels(np.ones_like(lab2), lab2, range(1, n2 + 1))
cleaned = 0
for i, s in enumerate(sizes2):
    if s < 3000:  # fragments only; tube arcs are ~115k, egg is ~470k
        arr[lab2 == i + 1, 3] = 0
        cleaned += int(s)
print('remnant fragments cleaned:', cleaned, 'px in', int((sizes2 < 3000).sum()), 'blobs')
base = Image.fromarray(arr, 'RGBA')
# drop faint stray pixels outside the logo (a 1px near-white compression
# row at the very top edge survived the ramp with alpha 17-34)
arr3 = np.array(base)
a3 = arr3[..., 3]
ys3, xs3 = np.where(a3 > 128)
y0b, y1b = max(0, ys3.min() - 20), min(H - 1, ys3.max() + 20)
x0b, x1b = max(0, xs3.min() - 20), min(W - 1, xs3.max() + 20)
outside_logo = np.ones(a3.shape, dtype=bool)
outside_logo[y0b:y1b + 1, x0b:x1b + 1] = False
print('stray faint px removed:', int((outside_logo & (a3 > 0)).sum()))
arr3[outside_logo, 3] = 0
base = Image.fromarray(arr3, 'RGBA')
base.save('assets/icon-artwork-v2.png')
print('saved assets/icon-artwork-v2.png')

# --- 6. previews: square (future icon.png) + circle (launcher mask) ---
for name, circle in [('assets/logo-preview.png', False),
                     ('assets/logo-preview-circle.png', True)]:
    canvas = Image.new('RGBA', (1024, 1024), (255, 255, 255, 255))
    art72 = base.resize((737, 737), Image.LANCZOS)
    canvas.alpha_composite(art72, ((1024 - 737) // 2, (1024 - 737) // 2))
    if circle:
        # white bg + artwork, cut to a circle, shown on grey so the cut is visible
        a = np.array(canvas)
        yy, xx = np.mgrid[0:1024, 0:1024]
        inside = (xx - 512) ** 2 + (yy - 512) ** 2 <= 512 ** 2
        a[..., 3] = np.where(inside, a[..., 3], 0)
        disc = Image.fromarray(a, 'RGBA')
        canvas = Image.new('RGBA', (1024, 1024), (221, 221, 221, 255))
        canvas.alpha_composite(disc, (0, 0))
    canvas.convert('RGB').save(name)
    print('saved', name)
