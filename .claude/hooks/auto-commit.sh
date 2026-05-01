#!/usr/bin/env bash
# Hook: auto-commit.sh
# Stages all changes and commits with a summary of changed files.
# Called by the Stop hook in settings.local.json.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

# Nothing to do if working tree is clean
if git diff --quiet HEAD -- . 2>/dev/null && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "[hook] No changes to commit."
  exit 0
fi

# Collect file summary for commit message (max 6 files)
MODIFIED=$(git diff --name-only HEAD -- . 2>/dev/null | head -6 | paste -sd ',' - 2>/dev/null || true)
NEW=$(git ls-files --others --exclude-standard 2>/dev/null | head -4 | paste -sd ',' - 2>/dev/null || true)

if [ -n "$MODIFIED" ] && [ -n "$NEW" ]; then
  SUMMARY="$MODIFIED,$NEW"
elif [ -n "$MODIFIED" ]; then
  SUMMARY="$MODIFIED"
elif [ -n "$NEW" ]; then
  SUMMARY="$NEW"
else
  SUMMARY="miscellaneous changes"
fi

DATE=$(date +%Y-%m-%d)

git add -A
git commit -m "update: $SUMMARY"

echo "[hook] Committed: $SUMMARY"
