# 🫀 Architecture Anatomy

<!-- repo-badges:start -->
[![Visibility](https://img.shields.io/badge/visibility-public-brightgreen)](https://github.com/MW8-ai/architecture-anatomy) [![CI](https://github.com/MW8-ai/architecture-anatomy/actions/workflows/ci.yml/badge.svg)](https://github.com/MW8-ai/architecture-anatomy/actions/workflows/ci.yml) [![GitHub last commit](https://img.shields.io/github/last-commit/MW8-ai/architecture-anatomy)](https://github.com/MW8-ai/architecture-anatomy/commits) [![GitHub repo size](https://img.shields.io/github/repo-size/MW8-ai/architecture-anatomy)](https://github.com/MW8-ai/architecture-anatomy) [![Maintained](https://img.shields.io/badge/maintained-yes-brightgreen)](https://github.com/MW8-ai/architecture-anatomy) [![License](https://img.shields.io/github/license/MW8-ai/architecture-anatomy)](https://github.com/MW8-ai/architecture-anatomy/blob/main/LICENSE)
<!-- repo-badges:end -->

> Interactive network anatomy — one catalog file drives a layered 2D atlas, an exploded 3D view, and a sovereign-boundary validation engine. **One body, many systems.**

**[Live 3D →](https://mw8-ai.github.io/architecture-anatomy/)** &nbsp;|&nbsp; **[2D Atlas →](https://mw8-ai.github.io/architecture-anatomy/atlas.html)** &nbsp;|&nbsp; **[Report an issue →](https://github.com/MW8-ai/architecture-anatomy/issues)**

---

Roadmap: [FEATURE-LEDGER.md](FEATURE-LEDGER.md)

## What this is

A catalog-as-code network visualizer for architects: describe the estate once in JSON, then search it, peel it into plates, explode it into 3D planes, trace routes, compute blast radius, and validate sovereign boundaries — offline-capable PWA, zero build step, zero external calls.

**Not** a screenshot tool or a vendor console. **Yes** to diagrams that are diffable, versionable, validated in CI, and honest about compliance boundaries.

## Two views, one truth

| View | Purpose | Where |
|---|---|---|
| **2D Atlas** | Plates, trace, blast, diff, Mermaid/SVG export — the working document | [`atlas.html`](https://mw8-ai.github.io/architecture-anatomy/atlas.html) |
| **Exploded 3D** | Layers as planes, cross-plane spines, click-to-dive inspection, shape vocabulary (firewalls as brick walls, translucent cluster containers), pinch/orbit on mobile | [`index.html`](https://mw8-ai.github.io/architecture-anatomy/) — the main view; deep-linkable via `?cat=` `&node=` `&flow=` |

Both render the same `catalogs/*.json`. Change the data, both views follow.

## Validation engine

[`lib/validate.js`](lib/validate.js) — renderer-agnostic, dependency-free, CI-tested:

| Rule | Question it answers |
|---|---|
| Unmet requirements | Every `requires` has a *connected* `provides` — an app needing `storage:object` isn't satisfied by an unconnected blob |
| Blast radius | Delete this node — what breaks, transitively? |
| Boundary paths | Can this flow cross these hops? `commercial < gcc < gcc-high < dod`; data never transits a lower boundary. Overrides are explicit and render amber, never silent |

Load **Sovereign Sample** from the picker to watch all three trip on purpose. Run tests: `node test/validate.test.mjs`.

## Catalogs

| Catalog | Story |
|---|---|
| Zero-Trust Network Access | Identity-first access path, 18 nodes |
| Sovereign Cloud Boundary | Commercial/GCC-High split with boundary tags |
| Cloud-Native SaaS Platform | 20-node product stack |
| OT/IT Industrial Convergence | Data diode and friends |
| Sovereign Sample | Deliberately broken — validation demo |

Writing your own: nodes carry optional `type` (drives 3D shapes), `requires`/`provides`, `dependsOn`, `boundary`, and `internals[]` for cluster reveals. Drag any catalog JSON onto either view to load it.

## Guardrails

CI runs a fingerprint gate (`scripts/sanitize-check.sh`) and the engine tests on every push — real-environment topologies live in a private sibling repo and can't come back without the build going red.

<!-- cornerstone-method:start -->

---

<!-- CORNERSTONE-BLOCK:BEGIN (managed by cornerstone-method/scripts/stamp.py - do not edit by hand) -->
## Part of the Cornerstone Method

**Know → Define → Assess → Shape → Verify → Visualize → Record.** **Architecture Anatomy** is the **Visualize** verb - Interactive layered network atlas with a 3D exploded view. Catalog-driven, validation-aware, boundary-crossing edges made visible.

Siblings: [CloudIntelMatrix (Know)](https://github.com/MW8-ai/CloudIntelMatrix) ([live](https://mw8-ai.github.io/CloudIntelMatrix/)) · Architect's Cornerstone (Define) · Architecture Review Framework + Review Skill (Assess) · [Formwork (Shape)](https://github.com/MW8-ai/formwork) · [Plumbline (Verify)](https://github.com/MW8-ai/plumbline) · Ledger (Record)

Hub: [The Cornerstone Method](https://github.com/MW8-ai/cornerstone-method)
<!-- CORNERSTONE-BLOCK:END -->
