# MR · Dirección — preparación de catálogo oficial (Foundry VTT)

**Estado:** las imágenes de la Posada se han sustituido por recursos con licencias libres en la rama de trabajo; el módulo todavía no está enviado ni aprobado por Foundry. Se mantienen **dos opciones**: paquete habitual con ejemplo fotográfico (pendiente de revisión integral) y paquete `zip-catalog.mjs` sin ejemplo (alternativa de contingencia).

## Publicación que buscamos

- Tipo: Add-on Module gratuito y compatible con Foundry v13.
- ID: `mr-direccion`.
- Autor: Manu Romera (según el manifiesto actual).
- Repositorio: https://github.com/ManuRomera/mr-direccion
- Portal oficial para presentar paquetes: https://foundryvtt.com/creators/submit/
- Documentación: https://foundryvtt.com/article/package-management/
- Política de IA vigente: https://foundryvtt.com/article/ai-policy/

## Motivo de preparar una variante específica

**Situación anterior:** el empaquetador normal incluía en `examples/posada` ilustraciones generadas con Z-Image-Turbo. **Actualización 12/11/2026:** se han sustituido los nueve archivos de imagen de ese ejemplo por fotografías y recursos humanos disponibles bajo CC BY / CC BY-SA de Wikimedia Commons, con créditos verificables en `examples/posada/ASSET_CREDITS.md`. La edición sin medios de ejemplo sigue disponible como alternativa conservadora mientras se revisan los audios, textos y el material promocional. El código asistido por IA sí puede presentarse bajo la política oficial cuando el autor lo comprende y mantiene.

El candidato generado por `node scripts/zip-catalog.mjs`:

- Incluye `module.json`, código de la barra/editor, idiomas, CSS, tours y licencia MIT.
- Excluye todos los contenidos de `examples/`, `docs/`, `brand/`, README ilustrado y la importación `trono-de-la-sed.pack.json`.
- Elimina del paquete, **sin cambiar las fuentes ni la release habitual**, `js/example.mjs`, el botón de instalar la Posada y el método `installExample` de la API.
- Genera `dist/catalog/module-catalog.json` y `dist/catalog/mr-direccion-v<VERSION>-catalog.zip`.
- **No publica automáticamente nada** en GitHub Releases ni en Foundry.

La pérdida del ejemplo es intencionada únicamente en esta variante. Las herramientas principales de dirección siguen disponibles.

## Comprobaciones que faltan antes de enviar

- [ ] **Autoría de textos visibles:** revisar `lang/es.json`, `lang/en.json` y los recorridos de `tours/`. Todos los textos preparados que reciban los usuarios deben ser de autoría humana; la traducción mediante IA se permite si un conocedor del idioma la revisa.
- [ ] **Descripción oficial:** redactar personalmente el texto que se presentará en la ficha de Foundry. No copiar a la ficha textos promocionales generados por IA.
- [ ] **Capturas e iconografía:** utilizar capturas propias del software en una escena neutra o con recursos de procedencia humana y derechos verificables. No usar las capturas del README que exhiban imágenes generadas por IA.
- [ ] **Compatibilidad:** ejecutar el ZIP de catálogo en un mundo limpio de Foundry v13 y comprobar barra, música, marcadores, editor y tours. No presentar como probada la versión v14: el `module.json` declara la v13.
- [ ] **Versión y enlaces:** cuando se vaya a presentar, crear una nueva release de GitHub que contenga **exactamente** `module-catalog.json` y el ZIP que este indica, o actualizar los enlaces antes de enviar. La release v0.5.0 habitual no contiene estos archivos.
- [ ] **Derechos de terceros:** confirmar que cualquier contenido enlazado, mostrado o servido por el paquete cumple las licencias correspondientes.
- [ ] **Revisión de código:** el autor debe poder explicar, modificar y mantener la implementación conforme a la política.
- [ ] **Cuenta Foundry:** iniciar sesión en el portal con una cuenta titular de licencia activa y enviar el formulario. Tras la revisión de Foundry, gestionar versiones en su página de paquetes.

## Datos técnicos para el formulario

| Campo | Valor |
|---|---|
| Tipo | Add-on Module |
| Package ID | `mr-direccion` |
| Título | MR- Dirección (manifiesto actual) |
| Autor | Manu Romera |
| URL del repositorio | https://github.com/ManuRomera/mr-direccion |
| Compatibilidad mínima | v13 |
| Compatibilidad verificada | v13 |
| Licencia del código | MIT |
| Manifest del candidato, **solo tras publicarlo como release** | https://github.com/ManuRomera/mr-direccion/releases/latest/download/module-catalog.json |
| ZIP del candidato | `mr-direccion-v<VERSION>-catalog.zip` |
| Categorías razonables | Tools and Controls; Audio Improvements, si se corresponde con el contenido presentado |

**No confundir** el manifiesto habitual `module.json` con `module-catalog.json`: el primero continúa distribuyendo la Posada y no es el que debe utilizarse en la presentación oficial.

## Cómo producir el candidato

```bash
node --test tests/*.test.mjs
node scripts/zip-catalog.mjs
```

Un workflow de GitHub comprueba que el candidato no contiene imágenes, audios ni textos narrativos del ejemplo y permite descargar el ZIP para revisar su funcionamiento antes de publicarlo.

Este documento es una lista interna de preparación técnica; no es una descripción comercial destinada al catálogo de Foundry.
