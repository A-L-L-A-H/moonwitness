#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
npm run setup:e2e
printf '\nINSTALL PASS. Next: ./RUN.sh\n'
