#!/usr/bin/env bash
# Pre-publish fingerprint gate. Run from repo root. Exit 1 = NOT safe to publish.
# Terms = products/names whose COMBINATION fingerprints a real environment.
# Edit the list as the environment evolves; err toward adding.
set -uo pipefail
TERMS='f5|citrix|sharepoint|okta|nsx|peoplesoft|goanywhere|mulesoft|vmware|oracle|indot|in\.gov|state of indiana'
HITS=$(grep -rn -iE "$TERMS" --include="*.json" --include="*.html" --include="*.md" --include="*.js" . 2>/dev/null | grep -v "sanitize-check\|node_modules\|\.git/")
if [ -n "$HITS" ]; then
  echo "FINGERPRINT TERMS FOUND — not safe to publish:"; echo "$HITS" | head -20
  echo "(relocate real-environment catalogs to the private sibling repo)"
  exit 1
fi
echo "sanitize-check: CLEAN — no environment fingerprint terms found."
