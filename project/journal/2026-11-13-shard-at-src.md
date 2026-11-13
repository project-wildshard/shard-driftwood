# Shard source moves to src/ (SA24, opus-sa24b)

> Written by: Claude (opus-sa24b), 2026-11-13

- `src/shards/driftwood-isle/` is now `src/` (meta SHARD-AUTHORING SA24, J317):
  a single-shard repo keeps its shard at the top of `src/`.
- Pins: sharddev `7681ecb` (`@wildshard/sdk` v0.2.8, SA44: finds the
  repo root from `src/`) and engine `dbc3f7cc` (SA45: author lint reads
  a single-shard `src/`), same github-SHA style.
- Outside `src/`: the `lint:shards` target, format and lint globs,
  `.oxlintrc.author.json` globs, `.gitattributes`, `.gitignore`, the
  vitest include, `scripts/publish-public.mjs`, the test-boundary walk,
  this shard's `scripts/blender/targets.json` entries, docs and the test
  imports.
- Kept: `src/` is byte-identical, so the hero stamp stays fresh. Path
  labels that reach the shard file (`file:` provenance, `"source"`,
  manifest URLs) stay `src/shards/driftwood-isle/...`; sdk v0.2.8 resolves them.
  `lint/ratchet.json` keys stay too (engine lint maps `src/x` to them).
- `pnpm build:shards` gives the same shard file as before the move
  (every file but `validation.json`'s build key). Dev-only tools inside
  `src/` that climb out of the shard by relative path (`bake/bake-captain-coat.mjs`, `blender/export.mjs`, `blender/fp-arms/skeleton.mjs`, `blender/build_island.py`) are left
  for the next hero capture, since any byte change there stales it.
