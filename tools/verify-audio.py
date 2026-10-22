#!/usr/bin/env python3
"""Valida el audio del paquete de ejemplo: Ogg Opus, ≤ 10 min (Foundry usa buffer y el bucle es gapless) y volumen integrado cerca de −26 LUFS (bucles)."""
import json, re, subprocess, sys, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def probe(p):
    o = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name:format=duration", "-of", "json", p], capture_output=True, text=True).stdout
    j = json.loads(o); return j["streams"][0]["codec_name"], float(j["format"]["duration"])
def lufs(p):
    e = subprocess.run(["ffmpeg", "-nostats", "-i", p, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", e); return float(m[-1]) if m else None
bad = 0
for p in sorted(glob.glob(os.path.join(ROOT, "examples/posada/audio/*.ogg"))):
    codec, dur = probe(p); l = lufs(p); loop = dur > 30
    ok = codec == "opus" and dur <= 600 and (not loop or (l is not None and abs(l + 26) <= 3))
    bad += not ok; print(("OK  " if ok else "FAIL"), os.path.basename(p), codec, f"{dur:.1f}s", f"{l} LUFS", "bucle" if loop else "efecto")
sys.exit(1 if bad else 0)
