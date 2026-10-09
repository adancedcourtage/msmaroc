#!/bin/sh
# Copie les fichiers publiables dans dist/ (aucune compilation).
# Liste d'exclusion : .deployignore. Les en-têtes et redirections sont dans _headers / _redirects.
set -e
cd "$(dirname "$0")/.."
rm -rf dist
mkdir dist
rsync -a --exclude-from=.deployignore ./ dist/
echo "dist/ prêt : $(find dist -type f | wc -l | tr -d ' ') fichiers"
