"""Dithered planet favicon in the site's palette: a lit sphere on 4x4 Bayer dots, with a halo."""
import math, sys
from PIL import Image, ImageDraw

PAL = [None, (28,36,104), (48,64,168), (86,104,226), (140,156,255), (214,220,255)]
BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]
BG = "#09090b"

def field(u, v):
    # u, v in [-1, 1]; sphere radius 0.62 centred slightly low-right, light from top-left
    cx, cy, R = 0.0, 0.0, 0.8
    x, y = (u - cx) / R, (v - cy) / R
    r2 = x*x + y*y
    if r2 > 1:
        r = math.sqrt(r2)
        return max(0, (1 - (r - 1) / 0.22)) ** 2 * 0.4 if r < 1.22 else 0
    z = math.sqrt(1 - r2)
    L = (-0.55, -0.6, 0.58); n = math.sqrt(sum(c*c for c in L)); L = [c/n for c in L]
    lam = max(0, x*L[0] + y*L[1] + z*L[2])
    rim = 0.25 * (1 - z) ** 3
    return min(1, 0.14 + 0.9 * lam ** 1.05 + rim)

def level(v, i, j):
    q = max(0, min(1, v)) * 5
    l = int(q)
    if q - l > (BAYER[(j & 3) * 4 + (i & 3)] + 0.5) / 16: l += 1
    return min(l, 5)

def cells(n):
    out = []
    for j in range(n):
        for i in range(n):
            u = (i + 0.5) / n * 2 - 1; v = (j + 0.5) / n * 2 - 1
            l = level(field(u, v), i, j)
            if l: out.append((i, j, l))
    return out

def svg(n=16, size=32, dot=0.86):
    c = size / n
    rects = "".join(f'<rect x="{i*c:.2f}" y="{j*c:.2f}" width="{c*dot:.2f}" height="{c*dot:.2f}" fill="#{"%02x%02x%02x" % PAL[l]}"/>' for i, j, l in cells(n))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}"><rect width="{size}" height="{size}" rx="7" fill="{BG}"/>{rects}</svg>\n'

def png(px, n, dot=0.72, radius=0.22):
    scale = 4
    S = px * scale
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius), fill=BG)
    c = S / n
    for i, j, l in cells(n):
        x, y = i * c, j * c
        d.rectangle([x, y, x + c * dot - 1, y + c * dot - 1], fill=PAL[l])
    return im.resize((px, px), Image.LANCZOS)

out = sys.argv[1]
open(f"{out}/favicon.svg", "w").write(svg())
png(180, 45).save(f"{out}/apple-touch-icon.png")
png(512, 64).save(f"{out}/icon-512.png")
ico = [png(s, n, dot=d, radius=0.18) for s, n, d in [(16, 8, 1.0), (32, 16, 1.0), (48, 16, 0.9)]]
ico[2].save(f"{out}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
print("ok")
