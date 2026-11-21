/**
 * ONE-FORMAT OF31f3 (Q37): what a Driftwood player keeps for good, as the items section's `kept` rows. These were the
 * engine's `OWNED` table (E314, the Driftwood loot stages) until the engine read them from here; ids, kinds and labels
 * are the old table's, so every save keeps what it holds. Gauges fill the Bag's sharpening, sturdy-heart and charm pips.
 */
type Kind = 'upgrade' | 'cosmetic' | 'charm' | 'trophy' | 'gear';
interface KeptRow { id: string; kind: Kind; label: string; gauge?: { name: 'sharpen' | 'hearts' | 'charms'; level: number } }

export const DRIFTWOOD_KEPT: KeptRow[] = [
  { id: 'whetstone-1', kind: 'upgrade', label: 'Whetstone I', gauge: { name: 'sharpen', level: 1 } },
  { id: 'whetstone-2', kind: 'upgrade', label: 'Whetstone II', gauge: { name: 'sharpen', level: 2 } },
  { id: 'heart-1', kind: 'upgrade', label: 'Sturdy heart I', gauge: { name: 'hearts', level: 1 } },
  { id: 'heart-2', kind: 'upgrade', label: 'Sturdy heart II', gauge: { name: 'hearts', level: 2 } },
  { id: 'sea-chart', kind: 'upgrade', label: 'Sea chart' },
  { id: 'cape', kind: 'cosmetic', label: 'Sailcloth cape' },
  { id: 'captain-hat', kind: 'cosmetic', label: "Captain's hat" },
  { id: 'charm-1', kind: 'charm', label: 'Sea glass charm I', gauge: { name: 'charms', level: 1 } },
  { id: 'charm-2', kind: 'charm', label: 'Sea glass charm II', gauge: { name: 'charms', level: 2 } },
  { id: 'charm-3', kind: 'charm', label: 'Sea glass charm III', gauge: { name: 'charms', level: 3 } },
  { id: 'bear-claw', kind: 'trophy', label: 'Bear claw' },
  { id: 'boar-tusk', kind: 'trophy', label: 'Boar tusk' },
  { id: 'iron-sword', kind: 'gear', label: 'Iron sword' },
];

/** OF31g3: Driftwood's one currency, the engine's doubloon pickup until now. */
export const DRIFTWOOD_CURRENCY: { id: string; name: string; model: string; icon: string } = {
  id: 'coin', name: 'Doubloon', model: 'shared/doubloon', icon: 'coin',
};
