#!/usr/bin/env bash
# govsync.sh — pull each governed repo's latest Plumbline report, run the
# plumbline_to_anatomy adapter over the fleet catalog, write the .gov.json.
#
# Called by .github/workflows/govsync.yml. Kept as a standalone script so the
# workflow stays trivial and this logic can be read and run on its own.
#
# Requires: gh (authenticated), python3 with pyyaml, the adapter checked out.
# Env:
#   ADAPTER   path to plumbline_to_anatomy.py   (default: .plumbline-src/adapters/anatomy/plumbline_to_anatomy.py)
#   MAPPING   path to fleet-mapping.yaml        (default: governance/fleet-mapping.yaml)
#   CATALOG   base catalog                      (default: catalogs/cornerstone-method-fleet.json)
#   OUT       annotated output                  (default: catalogs/cornerstone-method-fleet.gov.json)
set -euo pipefail

ADAPTER="${ADAPTER:-.plumbline-src/adapters/anatomy/plumbline_to_anatomy.py}"
MAPPING="${MAPPING:-governance/fleet-mapping.yaml}"
CATALOG="${CATALOG:-catalogs/cornerstone-method-fleet.json}"
OUT="${OUT:-catalogs/cornerstone-method-fleet.gov.json}"

repos="$(python -c "import yaml,sys; m=yaml.safe_load(open('$MAPPING',encoding='utf-8')) or {}; print('\n'.join((m.get('map') or {}).keys()))" | tr -d '\r')"

rm -rf reports && mkdir -p reports
args=()
for repo in $repos; do
  echo "::group::$repo"
  run_id="$(gh run list -R "MW8-ai/$repo" --workflow plumbline --status success \
              --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"
  if [ -z "${run_id:-}" ]; then
    echo "no successful plumbline run — skip"
  elif gh run download "$run_id" -R "MW8-ai/$repo" -n plumbline-report -D "reports/$repo" 2>/dev/null \
       && [ -f "reports/$repo/report.json" ]; then
    args+=(--report "$repo:reports/$repo/report.json")
    echo "got report.json (run $run_id)"
  else
    echo "no plumbline-report artifact — skip"
  fi
  echo "::endgroup::"
done

if [ ${#args[@]} -eq 0 ]; then
  echo "No reports available; leaving $OUT unchanged."
  exit 0
fi

python "$ADAPTER" --catalog "$CATALOG" --mapping "$MAPPING" "${args[@]}" --out "$OUT"
rm -rf reports
echo "wrote $OUT"
