# 2026-11-28: the Blender targets find their cross-repo inputs

- Meta QA 11-25 row 157 (from row 132). `fp-arms`' `skeleton.mjs` climbed to the old monorepo root and read Nine
  Dragon's rig from `public/assets/nine-dragon/viewmodel/fp-rig.glb`; the island build read the CC0 kit from a
  `shard-pine-hollow` beside this repo with no way to point elsewhere. A fresh clone anywhere else could run neither.
- One env var now names where the org's checkouts sit: `WILDSHARD_REPOS`, else this repo's parent folder (the
  canonical layout, `~/projects/games/wildshard/`). `skeleton.mjs` (and `bake.mjs` through it) reads
  `shard-nine-dragon/src/static/assets/nine-dragon-stack/viewmodel/fp-rig.glb` there and refuses a missing one by
  name; `build_island.py` reads `shard-pine-hollow`'s kit there and refuses the same way. `targets.json`'s external path
  for the rig follows Nine Dragon's real folder.
- Proof: from a fresh clone under `tmp/`, `WILDSHARD_REPOS=~/projects/games/wildshard node
  src/blender/fp-arms/skeleton.mjs` writes 16 nodes and 16 clips; without it, it names the folder it looked in.
- Guard: `test/driftwood-blender-inputs.test.ts`, with a made-up two-bone rig (J507).
