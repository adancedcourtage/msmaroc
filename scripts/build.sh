#!/bin/sh
# La copie est faite par scripts/build.mjs (Node, sans rsync : absent de l environnement de build Cloudflare).
set -e
node "$(dirname "$0")/build.mjs"
