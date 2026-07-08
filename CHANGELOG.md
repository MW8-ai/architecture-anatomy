# Changelog

All notable changes to Architecture Anatomy.

## v1.7.0
- **Public release.** Environment-specific default catalog removed; generic starter stub in its place. Real-topology catalogs relocated to a private sibling repo, enforced by a CI fingerprint gate (`scripts/sanitize-check.sh`).
- **Phase A validation engine** (`lib/validate.js`): unmet requires/provides, transitive blast radius, sovereign boundary path checks. Renderer-agnostic; legacy catalogs validate untouched. 7 tests in `test/`.
- **Sovereign Sample** demo catalog: deliberately trips all three rules.
- Sovereign Boundary catalog: vendor-specific node names generalized.

## v1.6.0
- **Cursor-centered zoom.** Wheel scroll and pinch-zoom now anchor to the pointer / midpoint so the view stays locked on whatever you're examining.
- **HA / failover notation.** Edge fields `rpo` and `rto` annotate replication links (e.g. `"rpo":"15min","rto":"2hr"`). New **RPO / RTO Labels** overlay renders them on the canvas. New **Single Points of Failure** overlay runs Tarjan's articulation-point algorithm over the visible plates and rings every node whose removal would disconnect the graph.
- **Catalog schema validation.** The ▤ Catalog editor now validates JSON on every keystroke (600 ms debounce) and surfaces errors inline — missing required fields, unknown `cls`/`conn` values, edge references to non-existent nodes, etc. `tools/catalog-schema.json` is a full JSON Schema (draft-07) for editor tooling (VS Code, ajv CI, etc.).
- **Catalog library.** New **⊞ Catalogs** toolbar button fetches `catalogs/index.json` and shows a card-picker to switch catalogs without editing the URL.
- **Node drag-to-reposition.** New **✥ Edit** mode lets you drag any component to a new position. Uses Tarjan's articulation-point-safe coordinate transform (`clientToSVG`) so positions are correct at any pan/zoom. Positions write back to `CAT` live; the catalog editor reflects them immediately.
- `node --check` still passes on all three JS files.

## v1.5.0
- **Flat SVG export.** Pure catalog-to-SVG renderer (`tools/svg-renderer.js`, UMD). In-app ⬡ SVG button
  exports the current view (active plates + overlays) as a standalone `.svg` with all CSS vars resolved
  to hex, no external fonts, zone bands, nodes, icons, edges with arrowheads, legend, and classification
  banner. Headless Node script (`tools/render-svg.js`) accepts `--layers`, `--overlays`, and `--diff`;
  both the button and the script call the same renderer.
- **Version diff.** ⊕ Diff toolbar button loads a second catalog via file-picker. Added nodes/edges
  render green, removed ones are red dashed ghosts at their original positions, changed nodes are amber.
  Summary panel in the readout shows counts and node lists. `?diff=<catalog>` in the URL auto-loads a
  diff target on boot. Mutually exclusive with Trace / Blast; Esc clears.

## v1.4.1
- Guard `history.replaceState` so the sandboxed preview (about:srcdoc) no longer throws; deep links still work on any real host. Link button now builds the URL from in-memory state.

## v1.4
- Deep links now restore active modes: a shared blast or trace view reopens already run (`blast=`, `trace=` in the hash).
- Blast source node gets a distinct marker; readout reads "Source + N reachable".
- Rail sections collapse on tap; Find/Overlays/Flows start collapsed on narrow screens.
- Zone labels moved to top-left with a readable background pill (fixes phone overlap).
- Toolbar reflows on small screens so search and buttons stop crowding.

## v1.3
- Deep-linking: dissection state (plates, peel, overlays, pinned node, filters) serializes to the URL; ⎘ Link copies a shareable link.
- Node-type icons inferred from each component (cloud, server, database, storage, identity, users, network).
- Keyboard shortcuts: T / B / 1–4 / F / R / Esc / ? with an on-screen help panel.
- Blast radius readout now reports compliance impact: scopes hit and reference flows broken.
- Build/version stamp in the footer.

## v1.2
- Blast radius mode (flood + hop-distance shading).
- Pinch-zoom and pan; Shift-drag orbit; scroll-to-zoom.
- Named, replayable reference flows defined in the catalog.

## v1.1
- Catalog-driven compliance scopes (`meta.scopes`); `?catalog=` switch.
- Sovereign Cloud Boundary catalog (Commercial / GCC / GCC High).
- Split compliance overlays, edge protocol/port/direction, boundary-crossing lens.
- Lifecycle/EOL + criticality; title and classification block with revision log.
- Find & filter.

## v1.0
- Transparent multi-plane atlas with 3D peel, single-source JSON catalog, path trace, live editor, Mermaid export.
