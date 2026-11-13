import { hashImmutableBytes } from '@wildshard/format/immutable';
import { expect, test } from 'vitest';
import { cargoModels } from '../src/shards/driftwood-isle/generators/cargoCatalogue';
import { DRIFTWOOD_EXCHANGE } from '../src/shards/driftwood-isle/generators/economy';
import { OCEAN_GRAPHS } from '../src/shards/driftwood-isle/generators/oceanGraphs';
import { POOL_GRAPHS } from '../src/shards/driftwood-isle/generators/poolGraphs';
import { reefCatalogue } from '../src/shards/driftwood-isle/generators/reefCatalogue';
import { REEF_GRAPHS } from '../src/shards/driftwood-isle/generators/reefGraphs';
import { DRIFTWOOD_SPAWNS } from '../src/shards/driftwood-isle/generators/spawnTables';
import { CASCADE_GRAPHS } from '../src/shards/driftwood-isle/generators/waterfallGraphs';
import { DRIFTWOOD_LAYOUTS } from './fixtures/driftwood-layout-source';
import original from './fixtures/driftwood-graph-scene-original.json' with { type: 'json' };

test('the eight Driftwood graph, scene, spawn and exchange declarations retain their bytes', () => {
  const declarations = {
    pools: POOL_GRAPHS, reef: REEF_GRAPHS, ocean: OCEAN_GRAPHS, cascade: CASCADE_GRAPHS,
    cargo: cargoModels(DRIFTWOOD_LAYOUTS.wreck), reefModels: reefCatalogue(),
    spawns: DRIFTWOOD_SPAWNS, exchange: DRIFTWOOD_EXCHANGE,
  };
  const observed = Object.entries(declarations).map(([name, row]) => {
    const bytes = new TextEncoder().encode(JSON.stringify(row));
    return { name, bytes: bytes.length, hash: hashImmutableBytes(bytes) };
  });
  expect(observed).toEqual(original);
});
