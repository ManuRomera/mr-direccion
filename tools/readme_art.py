#!/usr/bin/env python3
"""Banner, social preview y GIF de recorrido del README a partir de las capturas reales (docs/img/shot-*.png)."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); I = R + "/docs/img/"
FONT = next((f for f in ("/System/Library/Fonts/Supplemental/Baskerville.ttc", "/System/Library/Fonts/Supplemental/Georgia.ttf") if os.path.exists(f)), None)
def font(n): return ImageFont.truetype(FONT, n) if FONT else ImageFont.load_default()
def card(w, h, out):
    bg = Image.open(R + "/examples/posada/assets/sala.webp").convert("RGB"); s = max(w / bg.width, h / bg.height)
    bg = bg.resize((round(bg.width * s), round(bg.height * s)), Image.LANCZOS); bg = bg.crop((0, (bg.height - h) // 2, w, (bg.height - h) // 2 + h)).filter(ImageFilter.GaussianBlur(1.2))
    ov = Image.new("RGBA", (w, h)); d = ImageDraw.Draw(ov)
    for x in range(w): d.line([(x, 0), (x, h)], fill=(22, 17, 30, int(235 * max(0, 1 - x / (w * .85)) ** .8 + 20)))
    bg = Image.alpha_composite(bg.convert("RGBA"), ov); d = ImageDraw.Draw(bg)
    icon = Image.open(R + "/art/icon.png").convert("RGBA").resize((int(h * .5),) * 2, Image.LANCZOS); bg.alpha_composite(icon, (int(w * .05), (h - icon.height) // 2))
    x = int(w * .05) + icon.width + int(w * .03)
    d.text((x, h * .30), "MR- Dirección", font=font(int(h * .17)), fill=(244, 233, 210)); d.text((x, h * .55), "La barra de dirección de escena", font=font(int(h * .075)), fill=(202, 166, 107))
    d.text((x, h * .67), "para cualquier sistema de Foundry VTT", font=font(int(h * .075)), fill=(202, 166, 107)); bg.convert("RGB").save(out, "WEBP" if out.endswith("webp") else "PNG", quality=88)
card(1600, 640, I + "banner.webp"); card(1280, 640, I + "social.png")
order = ["glass", "motifs", "preview", "markers", "editor", "suelo", "classic", "nobg"]
frames = [Image.open(I + f"shot-{n}.png").convert("RGB").resize((960, 540), Image.LANCZOS).quantize(128, dither=Image.NONE) for n in order if os.path.exists(I + f"shot-{n}.png")]
frames[0].save(I + "recorrido.gif", save_all=True, append_images=frames[1:], duration=1800, loop=0, optimize=True)
for n in order:
    p = I + f"shot-{n}.png"
    if os.path.exists(p): Image.open(p).convert("RGB").save(I + f"{n}.webp", "WEBP", quality=86); os.remove(p)
print("ok")
