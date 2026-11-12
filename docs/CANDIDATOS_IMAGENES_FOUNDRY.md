> **ACTUALIZACIÓN 12/11/2026 — recursos sustituidos.** Los candidatos de Pexels indicados más abajo se conservaron como investigación inicial, pero **no se han incluido** en el módulo por la restricción de redistribución independiente de Pexels. Se eligieron seis fuentes humanas de **Wikimedia Commons**, con licencias CC BY / CC BY-SA que permiten distribuir adaptaciones con atribución. Los nueve WEBP ya están integrados en la release v0.5.1 y se generan desde [`scripts/rebuild_posada_stock.py`](../scripts/rebuild_posada_stock.py) y sus autores y derechos están registrados en [`examples/posada/ASSET_CREDITS.md`](../examples/posada/ASSET_CREDITS.md). El trabajo técnico de sustitución está realizado; pendiente revisión visual y de otros contenidos del ejemplo antes de solicitar el alta en Foundry.

# Candidatos de imágenes humanas para el ejemplo La Posada del Cuervo

**Estado: selección preliminar, pendiente de validación individual, descarga, adaptación e integración.**
Esta selección conserva el ejemplo opcional en el módulo oficial con recursos sustituidos, en lugar de retirarlo.
No confundir licencia de uso gratuito con dominio público ni con autoría propia.

## Criterios

- Foundry exige contenido pregenerado humano, incluso para assets de terceros; se debe verificar procedencia humana de cada archivo. https://foundryvtt.com/article/ai-policy/
- Pexels permite uso comercial y modificaciones (https://www.pexels.com/es-es/license/), pero prohíbe redistribuir en bancos de fotos, presentar personas como promotoras y ciertos usos sin consentimiento.
- Unsplash permite descargar, copiar, modificar y distribuir gratuitamente sus fotos, excepto reventa de imágenes sin modificaciones significativas y crear servicios competidores de fotos (https://unsplash.com/es/licencia).
- Pixabay tiene prohibición específica de redistribución de contenido sustancialmente inalterado como activo independiente: evitamos por ahora usarlo como fuente directa de assets.
- Las fichas de fotos contienen nombre del creador y, en muchos casos, cámara y fecha de captura; **no se consideran prueba definitiva** de que el contenido no incluya generación por IA. Verificar manualmente.
- Guardar fichero original, URL de origen, autor, licencia vigente a fecha de descarga, fecha de descarga y descripción de cambios efectuados. No alterar el aviso de copyright o licencias del repositorio de forma inexacta.

## Fondos de escena (propuesta)

| Uso | Candidato | Autor | Indicios de captura | Estado |
|---|---|---|---|---|
| `camino.webp` — posada exterior en invierno | [Casa de piedra nevada en Santander](https://www.pexels.com/photo/a-house-in-winter-24436875/) | Pablo Goood.es | Fotografía publicada en 2024; 5082×3388 | Pendiente de validar visual y licencia para ZIP |
| `sala.webp` — interior de posada | [Restaurante italiano rústico, vigas y mobiliario](https://www.pexels.com/photo/cozy-italian-restaurant-interior-with-wooden-decor-36909413/) | Zeev Hazenfratz | Canon EOS 7D; fotografía fechada en 2023 | Pendiente de validar atmósfera y licencia para ZIP |
| `bodega.webp` — sótano con barriles | [Bodega de barricas](https://www.pexels.com/photo/barrels-with-wine-17765444/) | Mark Stebnicki | Sony ILCE-1; fotografía de 2023, 8640×5760 | Pendiente de validar licencia para ZIP |

Alternativas:
- [Cabaña nevada en bosque](https://www.pexels.com/photo/snowy-cabin-nestled-in-winter-forest-landscape-37156667/) por Dawid Zawiła (Pexels).
- [Bodega abovedada en Haro](https://unsplash.com/photos/a-large-room-with-barrels-JeP2DqmHaKE) por Mario La Pergola (Unsplash).
- [Interior rústico de restaurante](https://www.pexels.com/photo/interior-of-a-restaurant-in-a-rustic-style-16131605/) por Davis Arenas (Pexels); formato vertical que exigiría recorte importante.

## Personajes del ejemplo (propuesta)

| Uso | Candidato | Autor | Estado |
|---|---|---|---|
| `posadera.webp` | [Retrato femenino de recreación histórica](https://www.pexels.com/photo/elegant-medieval-woman-in-historical-dress-34017386/) | Théo Cold | Pendiente de comprobar consentimiento/model release y adaptación a token |
| `viajero.webp` | [Retrato masculino medieval](https://www.pexels.com/photo/medieval-reenactor-in-historical-costume-33942776/) | Photo Foto | Pendiente de comprobar consentimiento/model release y adaptación a token |
| `sombra.webp` | [Retrato sombrío con capucha](https://www.pexels.com/photo/grayscale-photo-of-man-with-his-hands-together-10976202/) | Mustafa ezz | Solo referencia estética: ropa moderna, preferible silueta manual humana o grabado PD |

**Atención:** una licencia de la foto no siempre resuelve derechos de imagen de personas identificables ni avales publicitarios. Para el mundo de rol, considerar ilustraciones humanas de dominio público de museos, que evitan problemas de modelo fotográfico contemporáneo. Ejemplo: [The Innkeeper (1881)](https://commons.wikimedia.org/wiki/File:The_innkeeper_(1881),_by_Arnaldo_Tamburini.jpg), de Arnaldo Tamburini, marcada como dominio público en Wikimedia Commons; verificar el origen de la reproducción en cada jurisdicción.

## Integración prevista — pendiente

1. Confirmar licencia y procedencia humana por cada fichero seleccionado. Registrar evidencia y atribución voluntaria.
2. Descargar originales; adaptar fondos a 1600×900 y miniaturas sin usar IA generativa; crear retratos/tokens con recorte tradicional.
3. Sustituir las nueve imágenes `examples/posada/assets/` manteniendo **exactamente** sus rutas y nombres para que `js/example.mjs` y `pack*.json` funcionen sin cambios.
4. Auditar el audio sintético incluido y los textos del ejemplo conforme a la política de Foundry, por separado.
5. Actualizar los créditos y la licencia especificando únicamente los derechos reales: las fotos de Pexels no son “obra propia” del autor del módulo.
6. Regenerar ZIP, probar funcionamiento del paquete en Foundry v13, revisar capturas promocionales y entonces publicar una release para la presentación oficial.

**No publicar todavía:** esta tabla contiene candidatos, no una afirmación de que cada imagen esté aprobada para redistribución por Foundry.
