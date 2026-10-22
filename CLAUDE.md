# MR- Dirección — notas para quien siga el trabajo
- Diseño, esquema y API: `docs/DISENO.md`. Lógica pura en `js/core/` (probada con `npm test`); el resto necesita Foundry.
- Cómo probar: `node "/Applications/Foundry Virtual Tabletop.app/Contents/Resources/app/main.js" --dataPath=<dir aparte> --port=30002 --world=<mundo>` con el módulo enlazado en `<dir>/Data/modules`, `Config/license.json` enlazado (retirarlo después), navegador a 1600×900 y un usuario GM. Activar el módulo con `game.settings.set('core','moduleConfiguration', …)` y recargar. El audio exige un clic real (desbloqueo): un `playSound` antes deja el sonido «playing» sin objeto de audio y todo update posterior falla; «Parar audio» lo limpia.
- Regla de la casa: nunca fijar `font-family`/`font` sobre `button`, `i` o `*` (rompe los iconos Font Awesome de las ventanas).
- Arte: Codex (`tools/gen_art.py`) si hay cuota; si no, Z-Image local + `tools/ingest_figures.py` (recorta fondo blanco). Capturas y GIF: `tools/readme_art.py`.
- Pendiente: probar en v14; migrar *El Trono de la Sed* a consumir el módulo (`api.registerPack`).
