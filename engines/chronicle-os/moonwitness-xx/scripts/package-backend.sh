#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE="$ROOT/dist/moonwitness-backend.zip"

command -v zip >/dev/null 2>&1 || {
  echo "The zip utility is required to package the backend." >&2
  exit 1
}

command -v unzip >/dev/null 2>&1 || {
  echo "The unzip utility is required to verify the backend archive." >&2
  exit 1
}

command -v awk >/dev/null 2>&1 || {
  echo "The awk utility is required to verify the backend archive." >&2
  exit 1
}

mkdir -p "$ROOT/dist"
rm -f "$ARCHIVE"

cd "$ROOT"
zip -rq "$ARCHIVE" . \
  -x ".git" ".git/*" \
     "node_modules" "node_modules/*" \
     "*/node_modules" "*/node_modules/*" \
     "apps/web" "apps/web/*" \
     "docs/design" "docs/design/*" \
     "dist" "dist/*" \
     "coverage" "coverage/*" \
     ".env" "*/.env" \
     ".env.*" "*/.env.*" \
     "*.log"

if [ -f ".env.example" ]; then
  zip -q "$ARCHIVE" ".env.example"
fi

if unzip -Z1 "$ARCHIVE" | grep -Eq '(^|/)(apps/web|docs/design|node_modules|\.git)(/|$)'; then
  echo "Backend archive contains excluded directories." >&2
  rm -f "$ARCHIVE"
  exit 1
fi

if unzip -Z1 "$ARCHIVE" | awk '/(^|\/)\.env($|\.)/ && $0 !~ /(^|\/)\.env\.example$/ { found=1 } END { exit !found }'; then
  echo "Backend archive contains an environment file other than .env.example." >&2
  rm -f "$ARCHIVE"
  exit 1
fi

echo "Created: $ARCHIVE"
