# The lean move, repaired where CI went red

> Written by: Claude

repo-kit lean-layout R1 changed this repo on its way to the lean layout.
`pnpm check` passed, but CI runs more than check, and some of it named the old
paths. sharddev-55 saw main red and asked for a look. Fixes:

- `./scripts/bake-loader.mjs` in `scripts/blender/targets.json` and a bake now names `./src/scripts/bake-loader.mjs`
