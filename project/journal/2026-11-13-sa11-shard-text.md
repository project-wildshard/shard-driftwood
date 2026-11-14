# SA11: Driftwood shard text

> Written by: Claude

J317 retires `product` from author-facing names (meta
SHARD-AUTHORING SA11, same conventions as shard-pine-hollow `7e6e505`).
Renamed files: `generators/product.ts` to `shardfile.ts`
(`driftwoodShardfileRows`), `fixedProduct.ts` to `fixedShardfile.ts`
(`DriftwoodFixedShardfile`, `driftwoodFixedShardfile`,
`driftwoodFixedShardfileRows`), `productPageFiles.ts` to `pageFiles.ts`,
and the fixture `driftwood-product-source.ts` to
`driftwood-shardfile-source.ts`. Also `DriftwoodEntryFloors`,
`trailOwnedSpecimens`, and `withoutReceipt` / `fixedTiles` in
`fixedProgram.ts`. Comments, `src/README.md`, the CI journeys' headers
and the test fakes say shard file, shard build or output by what they
mean ("by shard file name", "files in the shard file").

Kept: `parseWorldSceneModels({ product })` (sharddev option) and
`siteCatalogue.json`'s `product` key (the same scene-models wire);
`clientPlan.json`'s `population.product-creatures` kind and the
engine's `productCreatures` path; `explorerCatalogue.ts`'s
`source: 'product'` (Explorer wire); the skeleton comment's matrix
product (math) and Blender's `DOT_PRODUCT`; the engine's headless
loader and its `product` keys; the lifted fixtures typed on the
engine's `ShardProduct` (`driftwoodFixedProduct.ts`,
`driftwoodLegacyRows.ts`, `driftwoodRows.ts`, `productFile.ts`,
`builtProduct.ts`, `driftwood-emitted-product.ts`); the CI proofs every
shard repo shares. Those change with SA23 / SA25 across all shard repos
at once.

`pnpm test` and `pnpm check` pass. A generator edit makes the hero
stale; the revision pass rebuilds it. No upload.
