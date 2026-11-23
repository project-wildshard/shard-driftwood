# 2026-11-23: the island ships no product-creatures inputs (ONE-FORMAT OF30d1)

> Written by: Claude (opus-look2)

- Since OF27d every island creature is a declared `platform.skin` look and the page names no
  `population.product-creatures`, so the install's inputs had no reader: `actors/creature-install.json`,
  `look/creature-looks.json`, `actors/projection.json` and the packed `models/creatures/bodies.bin`. The build drops
  all four, and with them their writers: the species programme (`speciesPrograms.ts`, `nativeHunt.ts`), the
  population projection, the creature-body bank (the hull book's rows), `creatureLookRows.json` and the two dead test
  fakes. The skin step keeps its two committed inputs, now named in `creatureBodies.ts`.
- Sections, `server/` and every other blob are byte-identical; only `look/map`'s `tilesHash` moves, as it hashes the
  map program's source. Proof: meta `project/evidence/one-format/of30d/`.
