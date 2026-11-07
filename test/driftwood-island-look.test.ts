import { expect, test } from 'vitest';
import { validateGraph } from '@wildshard/format/materialGraph';
import { ISLAND_LOOKS } from '../src/shards/driftwood-isle/generators/islandLook';
import lookGraphs from '../src/shards/driftwood-isle/data/lookGraphs.json' with { type: 'json' };

test('the authored cove material graphs admit through the released format', () => {
  for (const id of Object.values(ISLAND_LOOKS)) {
    const graph = lookGraphs.looks[id];
    expect(graph, id).toBeDefined();
    const result = validateGraph(graph);
    expect(result.ok ? [] : result.errors, id).toEqual([]);
  }
});
