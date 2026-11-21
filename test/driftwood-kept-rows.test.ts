// ONE-FORMAT OF31f3/OF31g3 (Q37): Driftwood's kept items and doubloon are rows in its own file, the ids of the engine's
// old OWNED table, so every save keeps what it holds once the engine reads them.
import { expect, test } from 'vitest';
import { driftwoodItems } from '../src/generators/items';
import { DRIFTWOOD_LOOT } from '../src/generators/loot';

const OLD_OWNED = ['whetstone-1', 'whetstone-2', 'heart-1', 'heart-2', 'sea-chart', 'cape', 'captain-hat',
  'charm-1', 'charm-2', 'charm-3', 'bear-claw', 'boar-tusk', 'iron-sword'];

test('the items section keeps exactly the 13 ids the engine table kept, looks and gauges included', () => {
  const kept = driftwoodItems().kept ?? [];
  expect(kept.map(row => row.id)).toEqual(OLD_OWNED);
  expect(kept.filter(row => row.kind === 'cosmetic').map(row => row.id)).toEqual(['cape', 'captain-hat']);
  expect(kept.filter(row => row.gauge?.name === 'charms').map(row => row.gauge?.level)).toEqual([1, 2, 3]);
});

test('the loot economy names the doubloon', () => {
  expect(DRIFTWOOD_LOOT.economy.currency).toEqual({ id: 'coin', name: 'Doubloon', model: 'shared/doubloon', icon: 'coin' });
});
