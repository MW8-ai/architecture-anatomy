#!/usr/bin/env bash
# Fingerprint gate: blocks real-environment terms from entering the public repo.
# Word-bounded terms; the icon-classifier keyword lines in index.html are allowlisted
# (generic product keywords for icon mapping are a feature, not a fingerprint).
set -uo pipefail
TERMS='\bf5\b|\bcitrix\b|\bsharepoint\b|\bokta\b|\bnsx\b|\bpeoplesoft\b|\bgoanywhere\b|\bmulesoft\b|\bvmware\b|\bindot\b|in\.gov|state of indiana'
HITS=$(grep -rn -iE "$TERMS" --include="*.json" --include="*.html" --include="*.md" --include="*.js" . 2>/dev/null \
  | grep -v "scripts/sanitize-check.sh\|node_modules\|\.git/" \
  | grep -vE "\.test\(s?\)\)\s*return|label\.includes\(" )
if [ -n "$HITS" ]; then
  echo "FINGERPRINT TERMS FOUND — not safe to publish:"; echo "$HITS" | head -20; exit 1
fi
echo "sanitize-check: CLEAN"
