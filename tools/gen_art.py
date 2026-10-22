#!/usr/bin/env python3
"""Arte del repo y del paquete de ejemplo con Codex CLI (image_gen), en serie. Reanudable: python3 tools/gen_art.py"""
import os, subprocess, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESTILO = ("Ilustración digital con aire de grabado entintado y acuarela nocturna, paleta de ciruela oscura, rubí apagado y marfil cálido, "
          "luz de vela, sin texto, sin letras, sin marcas de agua, sin personas en los fondos.")
JOBS = [
 ("icon", "1024x1024", "Icono cuadrado de una brújula-farol de latón con un ojo dorado en el centro, rodeado de cuatro lámparas pequeñas, sobre fondo ciruela oscuro liso."),
 ("banner", "1600x640", "Banner panorámico: una mesa de juego de rol vista en picado con un tablero de dirección luminoso de cristal esmerilado, dados, velas y un mapa antiguo; zona izquierda despejada para poner un título."),
 ("posada-camino", "1600x900", "Fondo de escena: camino nevado al anochecer que lleva a una posada de piedra con ventanas encendidas; suelo claramente visible en primer plano, horizonte a media altura, nadie en la escena."),
 ("posada-sala", "1600x900", "Fondo de escena: sala común de una posada rústica, chimenea encendida, mesas y bancos de madera, suelo de tablones amplio y visible en primer plano, vacía de personas."),
 ("posada-bodega", "1600x900", "Fondo de escena: bodega de piedra con barriles, una escalera y una trampilla, farol colgado, suelo de losas visible en primer plano, sin personas."),
 ("pnj-posadera", "1024x1024", "Retrato de busto de una posadera de mediana edad con delantal y un manojo de llaves, mirada astuta, fondo liso ciruela."),
 ("pnj-viajero", "1024x1024", "Retrato de busto de un viajero encapuchado con capa mojada de nieve y un farol, fondo liso ciruela."),
 ("pnj-sombra", "1024x1024", "Retrato de busto de una figura misteriosa con máscara de cuervo y sombrero de ala ancha, fondo liso ciruela."),
]
def valida(p, size):
    from PIL import Image
    try: w, h = Image.open(p).size
    except Exception: return False
    rw, rh = map(int, size.split("x")); return min(w, h) >= 800 and abs(w / h - rw / rh) < 0.2
for id_, size, desc in JOBS:
    out = f"art/new/{id_}.png"; p = os.path.join(ROOT, out)
    if os.path.exists(p): continue
    prompt = (f"Usa tu herramienta de generación de imágenes para crear UNA sola imagen, tamaño {size}. Descripción: {desc} Estilo: {ESTILO}\n"
              f"Después copia EL PNG QUE TU HERRAMIENTA ACABA DE DEVOLVER EN ESTA SESIÓN (ruta exacta; nunca busques el archivo más reciente de la carpeta) a {out} y responde solo con esa ruta. No generes más de una imagen ni modifiques otros archivos.")
    t0 = time.time()
    for _ in range(2):
        subprocess.run(["codex", "exec", "-m", "gpt-6.1-sol", "-c", 'model_reasoning_effort="low"', "--skip-git-repo-check", "-s", "workspace-write", prompt],
                       cwd=ROOT, capture_output=True, text=True, timeout=900, stdin=subprocess.DEVNULL)
        if os.path.exists(p) and not valida(p, size): os.remove(p)
        if os.path.exists(p): break
    print(("OK  " if os.path.exists(p) else "ERR ") + id_, round(time.time() - t0), flush=True)
