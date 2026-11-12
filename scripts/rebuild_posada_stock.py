#!/usr/bin/env python3
"""Rebuild the optional Raven Inn sample from documented human-made stock photographs.

Run from the repo root:
  python scripts/rebuild_posada_stock.py --output examples/posada/assets

Each original is retrieved individually through the Wikimedia Commons MediaWiki API.
No generative AI is used or required. All derivative files remain under their
individual Creative Commons licences; see examples/posada/ASSET_CREDITS.md.
"""
from __future__ import annotations

import argparse
import io
import json
from pathlib import Path
import sys
import time
from urllib.parse import urlparse

import requests
from PIL import Image, ImageEnhance, ImageOps, ImageDraw, ImageFilter, ImageChops

COMMONS = "https://commons.wikimedia.org/w/api.php"
UA = "MR-Direccion-StockPreparation/1.0 (illustrative Foundry VTT module; Github ManuRomera/mr-direccion)"
SOURCE = {
    "camino": {
        "file": "Winter cottage at night at Pokljuka 2.jpg",
        "author": "Dreamy Pixel",
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    "sala": {
        "file": "Znak Pitanja (Interior).jpg",
        "author": "Fred Cherrygarden",
        "license": "CC BY-SA 4.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    "bodega": {
        "file": "Weinkeller mit Holzfässern in Bad Vöslau.jpg",
        "author": "Naturpuur",
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    "posadera": {
        "file": "Female reenactor dressed as Spanish lady.jpg",
        "author": "Peter van der Sluijs",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
    },
    "viajero": {
        "file": "Man in costume drinks from wooden cup at a historical reenactment event in a grassy area with tents in the background.jpg",
        "author": "Shixart1985",
        "license": "CC BY 2.0",
        "license_url": "https://creativecommons.org/licenses/by/2.0/",
    },
    "sombra": {
        "file": "Hooded Figure -Cypress Grove Cemetery, New Orleans.jpg",
        "author": "Bart Everson",
        "license": "CC BY 2.0",
        "license_url": "https://creativecommons.org/licenses/by/2.0/",
    },
}
BG = ("camino", "sala", "bodega")
PORTRAIT = ("posadera", "viajero", "sombra")
ALLOWED_HOSTS = {"upload.wikimedia.org", "thumb.wikimedia.org"}
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": UA, "Accept": "application/json,image/jpeg,image/png,image/webp,*/*;q=0.4"})


def get_image(name: str, entry: dict) -> Image.Image:
    # API gives the actual file URL; no guessing CDN paths, no crawling HTML.
    query = {
        "action": "query", "format": "json", "formatversion": 2,
        "prop": "imageinfo", "iiprop": "url|size",
        "iiurlwidth": 2200, "titles": "File:" + entry["file"],
    }
    response = SESSION.get(COMMONS, params=query, timeout=45)
    response.raise_for_status()
    pages = response.json().get("query", {}).get("pages", [])
    info = (pages[0].get("imageinfo") or [{}])[0] if pages else {}
    address = info.get("thumburl") or info.get("url")
    if not address or urlparse(address).scheme != "https" or urlparse(address).hostname not in ALLOWED_HOSTS:
        summary=[{"title":p.get("title"),"missing":p.get("missing"),
                  "fields":sorted(p.keys()), "imageinfo": [{k: v for k, v in info.items() if k in ("url", "thumburl", "width", "height")}]} for p in pages]
        raise RuntimeError(f"{name}: missing Wikimedia image URL; summary={summary}, response_keys={sorted(response.json().keys())}")
    img_response = SESSION.get(address, timeout=60)
    img_response.raise_for_status()
    if len(img_response.content) > 22_000_000 or len(img_response.content) < 8_000:
        raise RuntimeError(f"{name}: suspicious image response size")
    try:
        with Image.open(io.BytesIO(img_response.content)) as raw:
            raw.verify()
        with Image.open(io.BytesIO(img_response.content)) as raw:
            im = ImageOps.exif_transpose(raw).convert("RGB")
    except Exception as exc:
        raise RuntimeError(f"{name}: downloaded data is not a valid image") from exc
    if im.width < 320 or im.height < 320:
        raise RuntimeError(f"{name}: source resolution too small")
    print(f"Source {name}: {im.width} x {im.height}, {len(img_response.content)} bytes")
    return im


def grade(source: Image.Image, place: str) -> Image.Image:
    # Ordinary photographic adjustments; not generative AI.
    im = ImageEnhance.Contrast(source).enhance(1.08)
    im = ImageEnhance.Color(im).enhance(0.87 if place != "sala" else 0.96)
    im = ImageEnhance.Brightness(im).enhance(
        {"camino": 0.91, "sala": 0.92, "bodega": 0.82}.get(place, 0.94)
    )
    # Subtle hand-built vignette, deliberately leaving the centre readable.
    gradient = Image.radial_gradient('L').resize(im.size, Image.Resampling.BICUBIC)
    fade = gradient.point(lambda v: min(255, round(v * 0.21)))
    im = Image.composite(Image.new("RGB", im.size, "#0b1014"), im, fade)
    return im


def build_background(source: Image.Image, name: str, output: Path) -> None:
    # The landscape source uses a centre crop, but the winter cottage needs
    # extra top framing to preserve roof and windows.
    centering = (0.5, {"camino": 0.44, "sala": 0.52, "bodega": 0.5}[name])
    photo = ImageOps.fit(source, (1600, 900), Image.Resampling.LANCZOS, centering=centering)
    photo = grade(photo, name)
    photo.save(output / (name + ".webp"), "WEBP", quality=89, method=6)
    small = photo.resize((400, 225), Image.Resampling.LANCZOS)
    small.save(output / (name + "-thumb.webp"), "WEBP", quality=78, method=6)


def build_actor(source: Image.Image, name: str, output: Path) -> None:
    # Neutral circular Foundry token with photograph: no generative alterations.
    if name == "sombra":
        source = ImageEnhance.Color(source).enhance(0.28)
        source = ImageEnhance.Brightness(source).enhance(0.70)
    image = ImageOps.fit(source, (464, 464), Image.Resampling.LANCZOS,
                         centering=(0.5, 0.30 if name != "sombra" else 0.5))
    image = ImageEnhance.Contrast(image).enhance(1.06)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    matte = Image.new("L", (464, 464))
    draw = ImageDraw.Draw(matte)
    draw.ellipse((1, 1, 462, 462), fill=255)
    # Draw a decorative ring as part of the game-token design.
    frame = ImageDraw.Draw(canvas)
    frame.ellipse((10, 10, 501, 501), fill="#10171e", outline="#c9b07c", width=7)
    frame.ellipse((18, 18, 494, 494), outline="#534329", width=5)
    canvas.paste(image, (24, 24), matte)
    frame.ellipse((20, 20, 492, 492), outline="#d2b984", width=5)
    frame.ellipse((29, 29, 482, 482), outline="#645238", width=2)
    canvas.save(output / (name + ".webp"), "WEBP", quality=87, method=6)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="examples/posada/assets")
    args = ap.parse_args()
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)

    for name, record in SOURCE.items():
        image = get_image(name, record)
        if name in BG:
            build_background(image, name, out)
        else:
            build_actor(image, name, out)
        time.sleep(0.5)  # polite per-file Wikimedia requests

    expected = {p + ".webp" for p in BG + PORTRAIT} | {b + "-thumb.webp" for b in BG}
    produced = {p.name for p in out.glob("*.webp")}
    if not expected.issubset(produced):
        raise RuntimeError("Missing assets: " + str(expected - produced))
    for name in sorted(expected):
        with Image.open(out / name) as im:
            print(f"OK {name}: {im.size}, {im.mode}, {(out / name).stat().st_size} bytes")
    manifest = {name: {
        "wikimedia_file": info["file"],
        "wikimedia_page": "https://commons.wikimedia.org/wiki/File:" + info["file"].replace(" ", "_"),
        "author": info["author"],
        "license": info["license"], "license_url": info["license_url"],
        "derivative": "Photographic crop and light/colour adjustment; game-token round frame for actors",
    } for name, info in SOURCE.items()}
    (out.parent / "ASSET_SOURCES.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Built 9 stock-derived assets and recorded 6 author/licence references.")


if __name__ == "__main__":
    main()
