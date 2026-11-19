#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Relative asset URLs support both the Pages project path and local previews.
PUBLIC_URL=. npm run build
mkdir -p docs
rm -rf docs/static
rm -f docs/precache-manifest.*.js
cp -R build/. docs/
touch docs/.nojekyll
