# MR- Dirección · Diseño

## Arquitectura
Sin paso de compilación: módulos ES nativos de Foundry v13/v14. La lógica sin Foundry vive en `js/core/` y se prueba con `node --test`.

| Capa | Archivos | Qué hace |
|---|---|---|
| Núcleo puro | `core/schema` `perspective` `crossfade` `geometry` `markers` `autoconfig` `trono` | Esquema y validación, perspectiva de figuras, fundido, geometría, marcadores, autoconfiguración, conversor de Trono |
| Datos | `store.mjs`, `refs.mjs` | Configuración por escena (flag) + ajustes de mundo + registro en memoria; resolución de referencias |
| Audio | `audio.mjs` | Fundido cruzado, motivos, efectos, mezcla, ambiente |
| Figuras | `figures.mjs` | Colocar el reparto, escala por profundidad al arrastrar, cobertura de pantalla |
| Interfaz | `director.mjs`, `markers.mjs`, `editor.mjs`, `ui.mjs` | Barra, insignia/panel, editor (ApplicationV2), arrastre con botón derecho |
| Extras | `tutorial.mjs`, `example.mjs`, `api.mjs`, `settings.mjs`, `main.mjs` | Tour nativo, instalador del ejemplo, API pública, ajustes y atajos |

Nada usa `game.system.id`: lo específico de un sistema iría en un adaptador aparte (hoy no hace falta ninguno).

## Dónde se guarda cada cosa
- **Escena**: `flags.mr-direccion.config` (viaja con la escena, también en compendios/aventuras).
- **Partida** (mundo): ajuste `global` (fundido, motivos, efectos globales, hitos y relojes), `mix` (volumen, modo lectura), `figures` (opciones de figuras), `markerState` (hitos desbloqueados y relojes).
- **Cliente**: barra visible, fondo, estilo, fundido propio, posición de la barra y de la insignia, estado del editor, tutorial ofrecido.
- **Memoria**: paquetes que otros módulos registran con `registerPack` (no se escriben en el mundo).

## Paquete de dirección (esquema 1)
```jsonc
{
  "schema": 1, "id": "mi-aventura", "title": "…", "version": "1.0.0",
  "settings": {
    "fade": 3.5,                                         // s; null = el del cliente / 3,5
    "motifs":  [{"id":"tension","label":"Tensión","icon":"eye","music":REF}],
    "effects": [{"id":"campana","label":"Campana","icon":"bell","sound":REF}],   // chips globales
    "markers": {"milestones":[{"id":"x","label":"…"}], "clocks":[{"id":"r","label":"…","segments":6}]}
  },
  "scenes": [{
    "ref": REF,                 // escena
    "order": 0, "name": "",
    "reading": REF,             // JournalEntry o JournalEntryPage
    "music": REF,               // sonido de playlist o archivo
    "motifs": null | ["tension"],   // null = todos los que tengan música
    "cues": [{"label":"","icon":"wind","sound":REF}],
    "ambient": "light"|"dim"|"dark"|null,
    "figures": [{"ref":REF,"label":""}],     // actores
    "handouts": [{"ref":REF,"label":""}],    // diarios, páginas, actores o imágenes
    "notes": "", "thumb": "ruta.webp",
    "stage": {"eye": 0.5, "anchors": [[x,y],…]}   // fracciones del fondo
  }]
}
```
**REF** = `{"uuid"}` · `{"src"}` (archivo; crea un sonido en la lista «MR- Dirección») · `{"flag":[ámbito,clave,valor]}` · `{"name"}` · `{"sceneFlag":[ámbito,clave]}` (lectura enlazada por flags de escena, como hace Trono). Una cadena suelta se interpreta como uuid o ruta. `validatePack` normaliza (recorta rangos, descarta cues sin sonido, ids únicos), devuelve `errors` y `warnings` y rechaza esquemas futuros con un mensaje claro.

## Perspectiva
Altura de una figura = `(pies − eye) · alto de escena / visible · (píxeles / 360)`, con `visible = 0,885` y margen de pies `0,055` (los del token estándar). Solo se coloca sobre los puntos de apoyo del suelo; al arrastrar se recalcula conservando el centro y la línea de los pies. Solo afecta a fichas con la marca `placed` o cuyo actor figura en la escena.

## Fundido cruzado
La entrante se lanza **sin `await`** (`playSound` espera todo su fundido de entrada), las salientes paran a la vez y la entrante se rampa a mano con la misma duración → suma de volúmenes constante (`crossfadeGain`). Una pista que ya suena no se corta. Bucles: Ogg Opus ≤ 10 min (Foundry usa buffer: bucle sin hueco).

## Sonidos gestionados
Todo lo que suena desde la barra se reproduce con una **copia** en la lista «MR- Dirección» (modo desactivado, clave `canal|ruta`; la música se copia con bucle). Así no importa el modo de la lista de origen: en secuencial, Foundry corta los demás sonidos al reproducir uno y arranca el siguiente al acabar. Si la escena enlaza una lista nativa, esa pista se detiene al activar (`quiesceNative`). Con el audio aún bloqueado se espera a `game.audio.unlock` (máx. 2,5 s) antes de tocar un sonido.

## Asignación rápida
Lo que no tiene audio resoluble sale translúcido (`.mrd-off`) y su botón abre el selector (`picker.mjs`): música de escena, motivo (global), efecto de escena (o uno nuevo) y efecto global.

## API
`game.modules.get('mr-direccion').api`: `registerPack(pack)`, `importPack(pack, {replace})`, `exportPack()`, `validatePack`, `dispatch(action, arg)`, `sceneConfig(scene)`, `globalSettings()`, `openEditor(sceneId)`, `startTutorial()`, `installExample()`, `converters.trono(...)`.
Hooks: `mrDireccion.ready(api)`, `.packRegistered(pack)`, `.packImported(pack, informe)`, `.sceneChanged(scene, cfg)`, `.motif(id, scene)`, `.marker('milestone'|'clock', id, valor)`.
Acciones de `dispatch`: `view read activate music motif effect quiet level stop stop-effects ambient fit figures figure presentation resize resize-selected recenter compact editor tutorial markers marker clock handout`. En el argumento, `@` = escena actual (`@Dir[motif|tension~@]{Tensión}` es una pista clicable en un diario).

## Decisiones tomadas (las tres que se dejaban abiertas)
1. **Nombre visible**: «MR- Dirección» (id y repo `mr-direccion`).
2. **Audio de ejemplo**: el módulo base no trae motivos ni efectos propios; el audio vive solo en el paquete de ejemplo (sintetizado con ffmpeg, CC BY 4.0). Los motivos habituales se añaden con un botón en la pestaña Global y se asigna la música de cada uno.
3. **Editor**: ventana propia (ApplicationV2, recuerda posición, tamaño, escena y pestaña), abierta desde la barra, desde Configuración → Editor de dirección o con la API.

Otras: horizonte y apoyos se editan sobre el fondo de la escena; `cover` (cubrir pantalla) viene **desactivado** por defecto (en Trono sí, por sus fondos panorámicos); los cambios del editor se guardan al instante, sin botón «Guardar»; la barra se muestra vacía con «Abrir editor» si aún no hay escenas, para que el tutorial funcione desde el primer día.

## Pendiente / no verificado
- Foundry **v14** sin probar (solo hay v13.351 instalado); no se usan APIs obsoletas de v13.
- El audio se comprobó por estado y rampa de volumen, no al oído.
- El arrastre de documentos desde el directorio al editor sigue el patrón estándar (`TextEditor.getDragEventData`) pero solo se probó la lógica y los clics; no se probó con un arrastre de ratón real.
- *El Trono de la Sed* no se ha migrado a consumir el módulo: su paquete se importa y funciona (probado con la aventura importada), pero su barra propia sigue activa si ambos módulos lo están.
