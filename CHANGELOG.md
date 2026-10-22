# Cambios

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
