# Architecture Anatomy

<!-- repo-badges:start -->
[![Visibility](https://img.shields.io/badge/visibility-private-orange)](https://github.com/MW8-ai/architecture-anatomy) [![GitHub last commit](https://img.shields.io/github/last-commit/MW8-ai/architecture-anatomy)](https://github.com/MW8-ai/architecture-anatomy/commits) [![GitHub repo size](https://img.shields.io/github/repo-size/MW8-ai/architecture-anatomy)](https://github.com/MW8-ai/architecture-anatomy) [![Maintained](https://img.shields.io/badge/maintained-yes-brightgreen)](https://github.com/MW8-ai/architecture-anatomy)
<!-- repo-badges:end -->


An interactive, transparent-overlay atlas for hybrid multi-cloud estates. Stack the anatomical
plates — **Hosting · Network · Identity · Data** — flat to read where systems overlap, or peel
them apart in 3D to see the deck. Every component holds the same position on every plate, so a
single system lights up across structure, traffic, identity, and data at once.

It is a single static HTML viewer driven entirely by a JSON catalog. No build step, no backend.
Point it at a different catalog and the same engine models a different estate.

```
index.html?catalog=sovereign-boundary.json
```

## Why it exists

Most architecture diagrams are either hand-drawn pictures that drift the moment something changes,
or auto-generated dumps that show what exists without conveying *meaning*. This sits in between:
a designed, queryable model where the layout is intentional and the data is the source of truth.
The signature idea — coincident-position plates you fade and peel like an anatomy atlas, plus a
computed **boundary-crossing** lens — is, as far as we can tell, not something that ships anywhere else.

## Quick start

The viewer fetches its catalog over HTTP, so serve the folder rather than double-clicking the file
(a bare `file://` open can't read a sibling JSON; an identical copy is embedded as a fallback so it
still renders):

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

On GitHub Pages (Settings → Pages → deploy from root) it just works.

## Repository layout

```
index.html                       the viewer (open this)
catalogs/
  architecture-catalog.json      default estate (loaded at startup)
  sovereign-boundary.json        Commercial / GCC / GCC High boundary model
README.md  CHANGELOG.md  LICENSE
```

## Features

- **Plates** — toggle Hosting / Network / Identity / Data like acetate pages; peel apart in 3D.
- **Navigation** — drag to pan, scroll or pinch to zoom, Shift-drag (mouse) to orbit, Reset to flatten.
- **Find & filter** — search by name/owner/zone, plus class / scope / criticality chips.
- **Edge semantics** — protocol, port, direction (arrowheads), and link type (internet / ExpressRoute /
  Direct Connect / VPN / LAN / replication). Hover an edge to inspect it.
- **Overlays** — trust zones, data classification, catalog-defined compliance scope rings,
  edge labels, lifecycle/EOL, criticality tier, and a boundary-crossing lens.
- **Trace** a route between two nodes; **Blast** the impact radius of one (with scopes hit and flows broken);
  play named **Reference Flows**.
- **Deep links** — the current dissection (plates, peel, overlays, pin, filters) serializes to the URL.
  Hit ⎘ Link to copy a link that reopens exactly that view.
- **Catalog editor** + **Mermaid export**, both reading and writing the same JSON.
- **Flat SVG export** — ⬡ SVG button exports the current view (visible plates + active overlays) as a
  standalone, print-quality vector. Resolved hex colors, no external fonts, no DOM state. The same
  renderer runs headlessly via `node tools/render-svg.js <catalog.json> out.svg [--layers …] [--overlays …]`
  for CI and docs pipelines.
- **Version diff** — ⊕ Diff loads a second catalog via file-picker (or `?diff=<name>` in the URL).
  Added nodes/edges glow green, removed ones appear as red dashed ghosts at their old positions, changed
  ones are outlined amber. A summary panel reports counts. Mutually exclusive with Trace / Blast; Esc clears.
- **Cursor-centered zoom** — wheel scroll and pinch anchor to the pointer so the view stays locked on whatever you're examining.
- **HA / failover notation** — add `rpo` / `rto` string fields to any edge; the **RPO / RTO Labels** overlay renders them. The **Single Points of Failure** overlay uses Tarjan's articulation-point algorithm to ring every node whose removal would disconnect the graph on the visible plates.
- **Catalog schema validation** — the ▤ Catalog editor validates on every keystroke and shows inline errors (missing fields, bad enum values, dangling edge references). `tools/catalog-schema.json` is a full JSON Schema draft-07 for VS Code / CI.
- **Catalog library** — ⊞ Catalogs button fetches `catalogs/index.json` and shows a card picker to switch catalogs. Edit `catalogs/index.json` to register additional catalog files.
- **Node drag-to-reposition** — ✥ Edit mode: drag any component to a new position. Works at any pan/zoom level in flat view. Positions write back to `CAT` live; open ▤ Catalog to download the updated JSON.

## Keyboard

`T` trace · `B` blast · `1`–`4` toggle plate · `F` search · `R` reset · `Esc` clear/close · `?` shortcuts.

## Catalog schema

```jsonc
{
  "meta": {
    "title": "...", "system": "...", "version": "1.0", "author": "...",
    "classification": "UNCLASSIFIED",          // blank to hide the banner
    "classColor": "#3f5165",
    "scopes": [ {"id":"FRH","t":"FedRAMP High","c":"#b794f6"} ], // optional; defaults to NIST/HIPAA/ATO
    "revisions": [ {"v":"1.0","date":"2026-06-22","who":"...","note":"..."} ]
  },
  "zones":  [ {"t":"Internet","y0":18,"y1":108} ],
  "nodes":  {
    "sql": { "x":300,"y":508,"l":"SQL Server","zone":"Restricted Data","host":"Hypervisor",
             "cls":"reg","scopes":["NIST","HIPAA"],"owner":"DataXM","tier":1,"eol":"2030-01-08","icon":"db" }
  },
  "layers": [
    { "id":"vasc","organ":"Vascular","arch":"Network & Connectivity","color":"var(--vascular)","blend":true,"flow":true,
      "edges":[ {"a":"uPub","b":"cf","proto":"HTTPS","port":443,"dir":"->","conn":"internet"} ] }
  ],
  "flows":  [ {"id":"f1","name":"Public request → SQL","steps":["uPub","cf","sql"],"note":"..."} ]
}
```

- `cls`: `pub` / `int` / `conf` / `reg`. `tier`: 1 mission / 2 business / 3 admin.
- `conn`: `internet` / `er` / `dx` / `vpn` / `lan` / `repl`. `icon` is optional; inferred from the name if omitted.
- Each consecutive pair in a `flow` should have an edge on some plate so the route draws connected.

## Deep-link parameters (URL hash)

`l=` visible plates · `p=` peel · `nz=1` zones off · `o=` overlays on · `pin=` pinned node ·
`q=` search · `fc= fs= ft=` class / scope / tier filters · `blast=` blasted node · `trace=src,dst` traced route.

## Roadmap

- Optional PWA install prompt.
- Catalog-to-catalog comparison mode (persist diff state in URL).
- Right-click context menu for node actions (copy ID, jump to editor row).

## Related

Part of the Banyon Labs portfolio. Designed to pair with **Architect's Cornerstone** — Cornerstone
carries the methodology and compliance framework; Architecture Anatomy is the visual layer that makes
an estate legible. A catalog can be generated from, or kept alongside, a Cornerstone model.

## License

MIT — see [LICENSE](LICENSE).

## Overview
Repository workspace

## Project Status
Active development.


---
## Part of the Cornerstone Method
**Know → Define → Assess → Shape → Verify → Visualize.** Architecture Anatomy is the **Visualize** verb.
Siblings: [CloudIntelMatrix](https://github.com/MW8-ai/CloudIntelMatrix) (Know) · Architect's Cornerstone (Define) · Architecture Review Framework + Review Skill (Assess) · Formwork (Shape) · Plumbline (Verify).

## Validation engine (Phase A)
`lib/validate.js` checks catalogs for unmet `requires`/`provides`, computes transitive **blast radius** from `dependsOn`, and enforces **sovereign boundary** path rules (`commercial < gcc < gcc-high < dod`). Load *Sovereign Sample* from the picker to see it trip on purpose. Run tests: `node test/validate.test.mjs`.

## 3D exploded view (Phase B prototype)
Open [`3d-prototype.html`](./3d-prototype.html) — layers explode into planes, cross-plane spine strings, click-to-dive inspection with live blast radius. Reads the same catalog JSON.
