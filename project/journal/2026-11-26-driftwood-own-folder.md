# Driftwood Isle carries its art under its own name

> Written by: Claude (opus-repacks), 2026-11-26, meta standalone-shardfiles SF8 (SF4's URL rule).

Every Driftwood file moved under `/assets/driftwood-isle/` (116 files, by `git mv`):

| Was | Now |
|---|---|
| `/assets/models/driftwood-*` | `/assets/driftwood-isle/models/driftwood-*` |
| `/assets/gpu/...` (KTX2) | `/assets/driftwood-isle/gpu/...` |
| `/assets/sfx/driftwood-isle/` | `/assets/driftwood-isle/sfx/driftwood-isle/` |
| `/assets/baked/driftwood-isle/` | `/assets/driftwood-isle/baked/` |
| `/assets/lut/driftwood-isle.bin` | `/assets/driftwood-isle/lut.bin` |
| `/assets/horizon/driftwood-isle-*` | `/assets/driftwood-isle/horizon/` |

The far and near views, already in this repo, are now mounts. The boot inventory reads one prefix,
`/assets/driftwood-isle/` (the SDK takes folder prefixes only). Shard version 0.0.13, a patch bump of the live 0.0.12.

Left for the row: the two piano island recordings (`/assets/music/piano/island-*`) are engine piano music and still
mount at the engine path until engine git carries them; the KTX2 under `gpu/` leaves the mounts when the cook makes
KTX2 (SF15) and Jake has seen the look board.
