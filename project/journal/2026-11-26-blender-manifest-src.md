# The Blender manifest keeps only Driftwood's targets (opus-held125, meta QA 11-25 row 126)

- `scripts/blender/targets.json` keeps only Driftwood's own targets (`driftwood-isle/island`, `driftwood-isle/fp-arms`);
  the other 41 were the old monorepo's and named files this repo never had.
- It stays at `scripts/blender/` for now. The SDK's `build.sh` reads `src/blender/targets.json` (sharddev 220ea7e7),
  but the installed engine lint finds the registered Blender helpers (`fp-arms/bake.mjs`, `export.mjs`, ...) only
  through the old place, and moving it refused the commit lint. Engine's fix is in; the move waits on it reaching the
  SDK pin (meta QA 11-25 row 129). The script-paths baseline says so in its one entry.
- `check-test-boundary.mjs` no longer walks `scripts/` (`src/` already holds `src/scripts/`).
