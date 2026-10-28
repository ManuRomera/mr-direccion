# MR- Dirección · Design and API

*Versión en castellano: [DISENO.md](DISENO.md).*

## Architecture
No build step: native ES modules for Foundry v13/v14. Foundry-free logic lives in `js/core/` and is tested with `node --test`.

| Layer | Files | What it does |
|---|---|---|
| Pure core | `core/schema` `perspective` `crossfade` `geometry` `markers` `autoconfig` `trono` | Schema and validation, figure perspective, crossfade, geometry, markers, auto-configuration, Trono converter |
| Data | `store.mjs`, `refs.mjs` | Per-scene configuration (flag) + world settings + in-memory registry; reference resolution |
| Audio | `audio.mjs` | Crossfade, motifs, effects, mix, ambience |
| Figures | `figures.mjs` | Place the cast, depth scaling while dragging, screen cover |
| Interface | `director.mjs`, `markers.mjs`, `editor.mjs`, `ui.mjs` | Bar, badge/panel, editor (ApplicationV2), right-button dragging |
| Extras | `tutorial.mjs`, `example.mjs`, `api.mjs`, `settings.mjs`, `main.mjs` | Native tour, example installer, public API, settings and shortcuts |

Nothing uses `game.system.id`: anything system-specific would go into a separate adapter (none is needed today).

## Where things are stored
- **Scene**: `flags.mr-direccion.config` (travels with the scene, also inside compendiums/adventures).
- **World**: setting `global` (fade, motifs, global effects, milestones and clocks), `mix` (volume, reading mode), `figures` (figure options), `markerState` (unlocked milestones and clock values).
- **Client**: bar visibility, background, style, own fade, bar and badge position, editor state, tour offered.
- **Memory**: packs registered by other modules with `registerPack` (never written to the world).

## Direction pack (schema 1)
```jsonc
{
  "schema": 1, "id": "my-adventure", "title": "…", "version": "1.0.0",
  "settings": {
    "fade": 3.5,                                         // s; null = client value / 3.5
    "motifs":  [{"id":"tension","label":"Tension","icon":"eye","music":REF}],
    "effects": [{"id":"bell","label":"Bell","icon":"bell","sound":REF}],   // global chips
    "markers": {"milestones":[{"id":"x","label":"…"}], "clocks":[{"id":"r","label":"…","segments":6}]}
  },
  "scenes": [{
    "ref": REF,                 // scene
    "order": 0, "name": "",
    "reading": REF,             // JournalEntry or JournalEntryPage
    "music": REF,               // playlist sound or file
    "motifs": null | ["tension"],   // null = every motif with music
    "cues": [{"label":"","icon":"wind","sound":REF}],
    "ambient": "light"|"dim"|"dark"|null,
    "figures": [{"ref":REF,"label":""}],     // actors
    "handouts": [{"ref":REF,"label":""}],    // journals, pages, actors or images
    "notes": "", "thumb": "path.webp",
    "stage": {"eye": 0.5, "anchors": [[x,y],…]}   // fractions of the background
  }]
}
```
**REF** = `{"uuid"}` · `{"src"}` (file; creates a sound in the «MR- Dirección» playlist) · `{"flag":[scope,key,value]}` · `{"name"}` · `{"sceneFlag":[scope,key]}` (reading linked through scene flags, as Trono does). A bare string is read as a uuid or a path. `validatePack` normalizes (clamps ranges, drops cues without sound, unique ids), returns `errors` and `warnings`, and rejects future schemas with a clear message.

## Perspective
Figure height = `(feet − eye) · scene height / visible · (pixels / 360)`, with `visible = 0.885` and a feet margin of `0.055` (those of the standard token). Figures are only placed on the floor anchors; dragging recomputes the size keeping the center and the feet line. The initial size on creation is only given to tokens placed by the bar (`placed` flag) or to listed actors; the other options (rescale on move, rotation, ruler, size bar) apply to every token in a configured scene. In v13 the depth rescale is a second update after the movement (`updateToken`), and turning toward the movement is also reapplied there because other modules may remove it.

## Crossfade
The incoming track starts **without `await`** (`playSound` waits for its whole fade-in), the outgoing ones stop at the same time and the incoming one is ramped by hand over the same duration → constant total volume (`crossfadeGain`). A track that is already playing is not cut. Loops: Ogg Opus ≤ 10 min (Foundry buffers them: gapless loop).

## Managed sounds
Everything the bar plays is played from a **copy** in the «MR- Dirección» playlist (disabled mode, key `channel|path`; music is copied with loop). That way the mode of the source playlist does not matter: in sequential mode Foundry cuts other sounds when one plays and starts the next one when it ends. If the scene links a native playlist, that track is stopped on activation (`quiesceNative`). While audio is still locked, the module waits for `game.audio.unlock` (max. 2.5 s) before touching a sound.

## Quick assignment
Anything without resolvable audio is shown translucent (`.mrd-off`) and its button opens the picker (`picker.mjs`): scene music, motif (global), scene effect (or a new one) and global effect.

## API
`game.modules.get('mr-direccion').api`: `registerPack(pack)`, `importPack(pack, {replace})`, `exportPack()`, `validatePack`, `dispatch(action, arg)`, `sceneConfig(scene)`, `globalSettings()`, `openEditor(sceneId)`, `startTutorial()`, `installExample()`, `converters.trono(...)`.
Hooks: `mrDireccion.ready(api)`, `.packRegistered(pack)`, `.packImported(pack, report)`, `.sceneChanged(scene, cfg)`, `.motif(id, scene)`, `.marker('milestone'|'clock', id, value)`.
`dispatch` actions: `view read activate music motif effect quiet level stop stop-effects ambient fit figures figure presentation resize resize-selected recenter compact editor tutorial markers marker clock handout`. In the argument, `@` = current scene (`@Dir[motif|tension~@]{Tension}` is a clickable cue inside a journal).

## Decisions
1. **Visible name**: «MR- Dirección» (id and repo `mr-direccion`).
2. **Example audio**: the base module ships no motifs or effects of its own; audio lives only in the example pack (synthesized with ffmpeg, CC BY 4.0). Common motifs are added with a button in the Global tab, then you assign music to each.
3. **Editor**: its own window (ApplicationV2; remembers position, size, scene and tab), opened from the bar, from Settings → Direction editor, or through the API.

Other: horizon and anchors are edited on top of the scene background; `cover` (cover the screen) is **off** by default (on in Trono, for its panoramic backgrounds); editor changes save instantly, no «Save» button; the bar shows up empty with «Open editor» when no scene is configured yet, so the tour works from day one.

## Pending / not verified
- Foundry **v14** not tested (only v13.351 installed); no deprecated v13 APIs are used.
- Audio verified by state and volume ramp, not by ear.
- Dragging documents from the sidebar into the editor follows the standard pattern (`TextEditor.getDragEventData`) but only the logic and clicks were tested, not a real mouse drag.
