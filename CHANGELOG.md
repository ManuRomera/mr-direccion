# Cambios

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
