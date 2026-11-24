> Written by: Claude (opus-grid)

# 2026-11-24: the unread legacyMemory leaves the mixed population

FORMAT-PRUNE FP3 (J505 build-ahead): `reserve.legacyMemory` in `src/data/mixedPopulation.json` had no reader in engine,
sharddev or shard-format, and has been optional since format 0.1.0.2; Driftwood was its only writer, so it goes. The hero
is re-stamped for the changed content. Local proof: `wildshard check src` builds v0.1.0.4 and validates with nothing
deprecated; `test:shards` passes 69 of 69.
