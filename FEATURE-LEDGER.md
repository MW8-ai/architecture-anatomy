# Architecture Anatomy — 3D-as-Main Migration Plan & Feature Ledger
**Date:** 2026-07-08 · **Doctrine unchanged:** one catalog JSON drives every view. The 3D view becomes the primary experience; the 2D atlas remains as a mode, not a casualty. Nothing on this ledger is deleted — features move over when the foundation under them is honest, or they get redesigned and the redesign is recorded here first.

---

## 1. Feature Ledger — current app → 3D foundation

| Feature (today) | Status in 3D | Migration note |
|---|---|---|
| Search components/owners | PLANNED (D1) | Search → focus-fly to node. Trivial once node registry is shared. |
| Plates / Atlas | NATIVE | Planes *are* plates. 2D atlas stays as a view toggle. |
| Lift | NATIVE | Click-to-focus + layer visibility covers it. |
| Exploded | NATIVE | The separation slider is this, generalized. |
| Blast | NATIVE (better) | Live orphan tinting + inspector list from the validation engine. |
| Trace | **REDESIGN → Trace 2.0** (§3) | Current trace = show a route. New trace = *analyze* a route. |
| Reference Flows | PLANNED (D2) — keep the fun | Animated pulse along flow steps; inspector auto-populates per hop at a readable pace. Presets from catalog `flows[]` + record-your-own (click hops in order → saved to catalog). |
| Boundaries / overlays / zone labels | PARTIAL → D1 | Zones render as plane bands now; compliance rings and richer overlays port next. Critical — these carry the governance story. |
| Theater mode | RETHINK | 3D focus-dive largely replaces it. Decide after D1 whether Theater adds anything focus doesn't. |
| Edit | PHASE D (earned) | Editing stays in 2D until 3D read-mode is fully trusted. Per the original ADR: edit-in-3D is the hardest thing, not the first thing. |
| Diff | RETHINK | Valuable idea, wrong layer today. Rebuild as *catalog* diff (two JSON versions → changed nodes glow) — belongs to the data layer, renders in both views free. |
| Mermaid export | KEEP AS-IS | Data-layer feature; already view-agnostic. |
| SVG export | KEEP AS-IS | 2D atlas remains the print/export path — that's its permanent job. |
| Link / deep links | NATIVE | `?cat=` shipped; add `&node=` and `&flow=` params in D1. |
| Library / drag-drop | NATIVE | Shipped in the integrated prototype. |
| Editor drawer | PHASE D | Rides with Edit. |
| Install PWA | KEEP | Shell already caches both pages. |

**Rule for the transition:** any feature not yet ported stays reachable in the 2D atlas — the ledger prevents silent loss, exactly the "record in a .md and add back later" you asked for.

## 2. Layer profiles — "abide by networking standards"
Layers stop being freeform and declare a **profile** in catalog meta: `"layerProfile": "hybrid" | "onprem" | "cloud" | "osi"`. Each profile is a named, ordered layer set (hybrid: Identity / Network / Compute+Data / Observability … osi: L1–L7 as a teaching catalog). Profiles are data, not code — a JSON file each — so OSI becomes a fun catalog example without infecting the practical default, and switching profiles is switching catalogs, which the picker already does. Default: the Identity+Network-first model the prototype already leans on, consistent across cloud and on-prem.

## 3. Trace 2.0 — the Path Advisor (the big one)
Today trace *shows* a route. The redesign makes trace *analyze* one — your S3→firewall→Linux→SharePoint example, formalized:

**Deterministic core (extends lib/validate.js):**
`analyzePath(catalog, steps[]) →` for each hop: boundary crossings (existing rule 3), protocol/port continuity from edge metadata, requires/provides gaps (existing rule 1, scoped to the path), and **missing-intermediary suggestions** from a connector knowledge table: patterns like `storage:object --crosses boundary--> app:collab ⇒ suggests [data gateway, private endpoint]`. The knowledge table is data (`lib/connectors.json`), and its natural seed is **CloudIntelMatrix** — verified per-cloud facts about what connects to what and under which compliance conditions. Know feeds Visualize, again.

**AI layer (the part that keeps us out of the past):** an optional BYO-key advisor that *renders* the deterministic path facts as guidance — "this path crosses a sovereign boundary at hop 2; a data gateway or private endpoint pattern closes it; here's why" — under the SecondEar voices rule: **every claim must cite a finding ID from the deterministic analysis; the model may explain, never invent.** Same guardrail, third product. This is the honest version of "AI network copilot," and nobody else's version can say *verified against a tiered-source dataset*.

**UX:** click nodes in sequence (or pick a flow) → the path draws hop by hop at reading pace, inspector fills per hop, flags surface inline — which merges your Reference Flow animation instinct with the analysis. Trace and Reference Flows become one feature with two entry points.

## 4. Shape vocabulary (v2 shipped, extensible)
Shapes are keyed off the existing `type` field — no schema change:
| type matches | Shape |
|---|---|
| fw / firewall / waf | **brick wall** (canvas-textured, mortar goes red on findings) |
| nas / storage / s3 / blob / db / sql / vault | **drum** (cylinder) |
| lb / adc / gateway / gw / proxy | **gem** (octahedron) |
| node with `internals[]` | **translucent container** — shell at 20% opacity, internal units visible inside (the NAS-cluster reveal) |
| everything else | card (unchanged) |
Non-card shapes carry a floating label sprite. Next additions when wanted: user/person, cloud-service puff, router cone, height-by-capacity. All primitives + canvas — still no 3D asset pipeline, per ADR.

## 5. Migration order
1. **D0 (shipped in v2):** mobile gestures, space background, shape vocabulary v1, repo-integrated picker
2. **D1:** boundaries/compliance overlays in 3D · search-to-focus · `&node=`/`&flow=` deep links · main page gains the 3D as default view with "2D Atlas" toggle
3. **D2:** Trace 2.0 deterministic core + connector table · Reference Flows animation (merged UX)
4. **D3:** AI Path Advisor (BYO key, finding-ID guardrail) · catalog diff
5. **D4:** edit-in-3D + editor parity — only after D1–D3 are trusted daily
Every phase = version bump + CHANGELOG + sw.js cache bump together (release ritual).

## 6. Prior-art honesty (for the README someday)
Plenty of tools draw networks in 3D or auto-map infrastructure. The defensible combination here: **catalog-as-code driving flat + 3D from one file, a deterministic sovereign-boundary validation engine, and an AI advisor that can only cite verified findings.** That trio is the pitch — not "3D diagrams."
