#!/usr/bin/env python3
"""Recorta el fondo blanco de las figuras de ejemplo (relleno desde los bordes) y las centra en un token cuadrado
con la proporción que usa la perspectiva (pies a 5,5 % del borde inferior, figura = 88,5 % del alto)."""
import sys
from PIL import Image, ImageFilter, ImageChops
from collections import deque
def key(im, tol=40):
    im = im.convert('RGBA'); w, h = im.size; px = im.load(); seen = bytearray(w*h); q = deque()
    near = lambda p: all(255-c <= tol for c in p[:3])
    for x in range(w):
        for y in (0, h-1): q.append((x, y))
    for y in range(h):
        for x in (0, w-1): q.append((x, y))
    while q:
        x, y = q.popleft()
        if not (0 <= x < w and 0 <= y < h) or seen[y*w+x]: continue
        seen[y*w+x] = 1
        if not near(px[x, y]): continue
        px[x, y] = (255, 255, 255, 0)
        q.extend(((x+1, y), (x-1, y), (x, y+1), (x, y-1)))
    a = im.getchannel('A').filter(ImageFilter.GaussianBlur(.8)); im.putalpha(a); return im
def token(src, dst, S=512):
    im = key(Image.open(src)); bb = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox(); im = im.crop(bb)
    H = int(S*.885); W = round(im.width*H/im.height)
    if W > S*.9: W = int(S*.9); H = round(im.height*W/im.width)
    im = im.resize((W, H), Image.LANCZOS); out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.paste(im, ((S-W)//2, S-int(S*.055)-H), im); out.save(dst, 'WEBP', quality=88)
if __name__ == '__main__':
    base = sys.argv[1]; z = '/Volumes/Datos_Dock/zimage/salidas/'
    for f, n in zip(sys.argv[2:], ('posadera', 'viajero', 'sombra')): token(z+f+'.png', f'{base}/examples/posada/assets/{n}.webp')
