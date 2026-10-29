# Cambios · Changelog

## 0.1.8 (2026-10-29)
- **Arreglo:** la carpeta de la escena actual (y cualquier carpeta que abrieras) se cerraba al hacer clic fuera del menú, porque el cierre «al hacer clic fuera» también cerraba los grupos de carpetas. Ahora solo cierra los menús de la barra y las carpetas siguen abiertas al cambiar de escena, desde la barra o desde Foundry.
- **Fix:** the current scene's folder (and any folder you had opened) closed when clicking outside the menu, because the “close on outside click” also closed the folder groups. It now only closes the bar's menus, and folders stay open when you change scene, from the bar or from Foundry.

## 0.1.7 (2026-10-29)
- **Carpetas:** la carpeta de la escena actual se resalta en el menú y permanece abierta; los grupos que abres a mano y el texto del buscador sobreviven a los redibujados.
- **Ocultar:** un botón de ojo oculta escenas o carpetas del menú (no se borran ni dejan de estar configuradas); «mostrar lo oculto» las deja ver atenuadas. La escena actual siempre se ve.
- **Barra vertical:** un botón cambia entre horizontal y vertical (márgenes izquierdo o derecho); los menús se abren hacia el lado libre y cada orientación recuerda su posición.
- La barra horizontal **ya no baja un icono a una segunda línea** con nombres de escena largos: si no cabe, primero se ocultan los textos de los botones y luego el título.
- **Ajustar pantalla** funcionaba solo con «cubrir pantalla» activado; ahora rellena siempre toda la pantalla con la imagen de la escena, sin deformarla.
- La miniatura del menú aparece al **1 s** (antes 2 s).

- **Folders:** the current scene's folder is highlighted and stays open; groups you open by hand and the search text survive redraws.
- **Hide:** an eye button hides scenes or folders from the menu (nothing is deleted or unconfigured); “show hidden” reveals them dimmed. The current scene is always shown.
- **Vertical bar:** a button toggles horizontal/vertical (left or right margin); menus open towards the free side and each orientation remembers its position.
- The horizontal bar **no longer drops an icon onto a second row** with long scene names: when it doesn't fit, button labels are hidden first, then the title.
- **Fit screen** only worked with “cover screen” enabled; it now always fills the whole screen with the scene image, without distortion.
- The menu thumbnail appears after **1 s** (it was 2 s).

## 0.1.6 (2026-10-28)
- **English everywhere:** the guided tour and the example adventure (“The Raven Inn”) now follow Foundry’s language (English or Spanish); English README section and `docs/DESIGN.md` (design and API).
- Tour y ejemplo en el idioma de Foundry; README y documento de diseño también en inglés.

## 0.1.5 — 2026-10-28
- **Menú de escenas organizado por carpetas.** Si las escenas configuradas están en varias carpetas, el menú las agrupa: la carpeta raíz (p. ej. el capítulo) como encabezado y cada carpeta (ciudad, lugar) plegable con su número de escenas. Se abre sola la de la escena actual y el menú se desplaza hasta ella.
- **Buscador de escenas** en ese menú: filtra por nombre de escena o de carpeta y abre los grupos con coincidencias.
- Redibujar la barra ya no cierra los grupos abiertos.

## 0.1.4 — 2026-10-27
- **Figuras para todas las fichas.** Las opciones (tamaño, escala por profundidad, giro y línea de desplazamiento) valen para **todas** las fichas de una escena configurada, no solo para las del reparto.
- **Barra de tamaño de fichas** (en el menú Figuras): deslizador en px con valor numérico y máximo editable (hasta 4000 px). Actúa en directo mientras se mueve sobre **Todos** o **Seleccionados** (el elegido se resalta y se indica cuántas fichas son). Con suelo marcado es el tamaño en primer plano; sin él, un cuadrado de esos px conservando centro y pies.
- **Giro y línea de desplazamiento** como opciones en Figuras: «Girar en la dirección del movimiento» y «Quitar la línea de desplazamiento». El giro se aplica también tras el movimiento, aunque otro módulo (MR Token Stage) quite el giro automático.
- Los reajustes de tamaño del módulo ya no giran la ficha ni dibujan regla.
- **Efectos como interruptor:** pulsar un efecto que suena lo apaga (antes lo reiniciaba); los activos (y los motivos) se ven claramente: relleno rosa brillante, aro luminoso, icono de altavoz parpadeante y `aria-pressed`.

## 0.1.3 — 2026-10-27
- **Arreglo importante:** con un paquete registrado por otro módulo (como *La Rima de la Doncella*), cualquier acción sin escena —Parar audio, Modo lectura, volumen, parar efectos y todas las opciones de figuras (tamaño, rotación…)— lanzaba «Cannot read properties of undefined (reading 'uuid')». Ahora funcionan.
- Una referencia a un módulo que no está activo (ámbito de flags) ya no lanza un error al dibujar la barra.
- La búsqueda de la configuración de cada escena usa un índice: con paquetes grandes (decenas de escenas) la barra se redibuja mucho más ligera.
- Pruebas nuevas que cubren el enlace de escenas por paquetes registrados.

## 0.1.2 — 2026-10-27
Revisión de fallos de música y figuras.
- **Música y efectos ya no dependen del modo de la lista de origen.** Antes, con una lista en modo secuencial (el de serie), lanzar un efecto cortaba la música, y al terminar un efecto arrancaba solo la pista siguiente. Ahora todo suena desde una copia en la lista «MR- Dirección» (modo desactivado).
- Con escenas que ya enlazan su propia lista (como las de *El Trono de la Sed*) la pista nativa se detiene para no sonar duplicada.
- El audio bloqueado por el navegador ya no lanza excepciones: se espera al primer gesto y, si no llega, avisa. Subir el volumen o activar el modo lectura con el audio bloqueado tampoco falla.
- **Figuras:** la escala por profundidad al arrastrar una figura no funcionaba en Foundry v13 (el movimiento fijaba el tamaño); ahora se reajusta tras el movimiento, siguiendo la línea de los pies. Convive con *El Trono de la Sed*, que antes pisaba tamaño y posición al colocar el reparto.
- Actores y diarios de compendio ya no rompen «Colocar el reparto», «Leer escena» ni las ayudas.
- Activar una escena configurada sin música ya no muestra un aviso, y ya no se lanza dos veces la música.
- Los errores muestran su mensaje en vez de un aviso genérico.
- **Nuevo: asignar audio al vuelo.** Música, motivos, efectos de escena y efectos globales sin audio salen translúcidos; al pulsarlos se abre un selector con buscador, ▶ para oír y «Archivo…». Nuevo chip «Añadir efecto» y botón «Crear motivos habituales».

## 0.1.1 — 2026-10-22
- Arreglo: el panel de marcadores no se redibujaba al cambiar un hito o un reloj hasta recargar (ahora usa `onChange` del ajuste).
- Página del repositorio rehecha: banner con el logo MR de la casa y capturas reales en el mundo de *El Trono de la Sed*.

## 0.1.0 — 2026-10-22
Primera versión pública. La barra de dirección de *MR · El Trono de la Sed* convertida en un módulo independiente del sistema.
- Barra flotante solo-GM compacta (66 px) con selector de escena propio y **vista previa a los 2 s**, lectura, «Mostrar a todos», música, **motivos**, efectos, modo lectura, mezcla y ambientes claro/penumbra/oscuro.
- **Fundido cruzado sin hueco** (3,5 s por defecto, configurable) también al repetir la misma pista.
- **Figuras con perspectiva** sobre el suelo real del fondo (horizonte y puntos de apoyo por escena).
- **Marcadores de partida**: hitos secretos con aviso a la mesa y relojes de N segmentos (solo GM); insignia arrastrable.
- **Editor del GM** (arrastrar y soltar desde el directorio, suelo y horizonte sobre el fondo, autoconfigurar, copiar de otra escena, importar y exportar paquetes JSON).
- **Paquete de dirección** versionado (esquema 1) con validación, API pública `registerPack`/`importPack`/`exportPack`/`dispatch`, hooks `mrDireccion.*` y conversor desde *El Trono de la Sed*.
- Estilos Cristal líquido (por defecto) y Clásico, fondo opcional, arrastre con botón derecho, menús que se cierran al hacer clic fuera, atajos configurables (Alt+B, Alt+H).
- Tutorial guiado nativo, es/en, accesibilidad (roles, `aria-*`, foco visible, `prefers-reduced-motion`).
- Paquete de ejemplo «La Posada del Cuervo» (3 escenas, arte y audio propios).
