# Governance sync (Cornerstone adapter v0.2)

The wall diagram updates itself. Every night, the [`govsync`](../.github/workflows/govsync.yml)
workflow pulls each governed repo's latest Plumbline verdict and repaints the
fleet self-portrait with it — no human in the loop after the one-time wiring below.

## The pieces

| File | Role |
|------|------|
| `catalogs/cornerstone-method-fleet.json` | Hand-authored base: the seven Method tools as one loop. |
| `catalogs/cornerstone-method-fleet.gov.json` | Machine-written output — the base annotated with live governance. **Do not hand-edit.** |
| `governance/fleet-mapping.yaml` | Maps each governed repo → the catalog node(s) it governs. |
| `.github/workflows/govsync.yml` | The nightly job: download reports → run adapter → commit. |
| `plumbline_to_anatomy.py` | The adapter itself — lives in [MW8-ai/plumbline](https://github.com/MW8-ai/plumbline) under `adapters/anatomy/`. |

## How it flows

1. Each governed repo runs the Plumbline reusable workflow, which already uploads
   `.plumbline/report.json` as an artifact named `plumbline-report`. Nothing to add there.
2. `govsync` downloads the latest such artifact from every repo in the mapping.
3. It runs `plumbline_to_anatomy` over the base catalog with those reports.
4. Any node whose repo has no report yet renders as **unknown** — the loop degrades
   gracefully as tools come online; it never blocks on a missing one.
5. If the `.gov.json` changed, it commits. Pages redeploys. Done.

## One-time wiring (human — do this once)

The job reads GitHub Actions artifacts from *other* repos. The default `GITHUB_TOKEN`
cannot, so it needs a token you provision:

1. Create a **fine-grained personal access token**:
   - **Repository access:** only the repos in `fleet-mapping.yaml`.
   - **Permissions (read-only):** `Actions: Read`, `Contents: Read`.
   - **Expiry:** 90 days. Calendar a rotation.
2. Add it to this repo as the Actions secret **`FLEET_READ_TOKEN`**
   (Settings → Secrets and variables → Actions → New repository secret).
3. Run the workflow once by hand (Actions → govsync → Run workflow) to confirm.

Minting, scoping, and rotating that token is a human action by design — it is the one
credential this automation depends on, and no agent provisions it. Until the secret
exists, `govsync` no-ops on every run rather than failing, so merging this changes
nothing about the repo's health until you choose to switch it on.

## Viewing it

Open the atlas on the governed catalog and toggle **Governance** in the overlay panel:

```
atlas.html?catalog=catalogs/cornerstone-method-fleet.gov.json#o=gov
```

The committed `.gov.json` is an illustrative first run (real Plumbline shapes, a couple
of tools still `unknown`). The nightly job overwrites it with live data once wired.
