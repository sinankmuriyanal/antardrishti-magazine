#!/usr/bin/env bash
# Hook: update-claude-md.sh
# Appends a changelog entry to CLAUDE.md based on git diff, then stages CLAUDE.md.
# Called by the Stop hook in settings.local.json.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

# Nothing to do if no changes at all
if git diff --quiet HEAD -- . 2>/dev/null && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  exit 0
fi

DATE=$(date +%Y-%m-%d)

# Collect changed tracked files (exclude CLAUDE.md itself to avoid noise)
MODIFIED=$(git diff --name-only HEAD -- . 2>/dev/null | grep -v "^CLAUDE\.md$" | head -8 | paste -sd ',' - 2>/dev/null || true)
NEW=$(git ls-files --others --exclude-standard 2>/dev/null | grep -v "^CLAUDE\.md$" | head -4 | paste -sd ',' - 2>/dev/null || true)

if [ -n "$MODIFIED" ] && [ -n "$NEW" ]; then
  SUMMARY="$MODIFIED,$NEW"
elif [ -n "$MODIFIED" ]; then
  SUMMARY="$MODIFIED"
elif [ -n "$NEW" ]; then
  SUMMARY="$NEW"
else
  exit 0
fi

# Only append if this exact date+summary line isn't already in the changelog
ENTRY="- [$DATE] auto: $SUMMARY"
if grep -qF "$ENTRY" CLAUDE.md 2>/dev/null; then
  exit 0
fi

# Insert the new entry right after the "## Changelog" heading
if grep -q "^## Changelog" CLAUDE.md; then
  # Use awk to insert after the heading line
  awk -v entry="$ENTRY" '
    /^## Changelog/ { print; print entry; next }
    { print }
  ' CLAUDE.md > CLAUDE.md.tmp && mv CLAUDE.md.tmp CLAUDE.md
fi

git add CLAUDE.md
echo "[hook] CLAUDE.md changelog updated: $ENTRY"
