// oxlint-disable-next-line import/no-nodejs-modules -- Retain the independent historical native outcome beside the migrated full-bit golden.
import assert from 'node:assert/strict';
import * as v from 'valibot';
import original from './driftwood-checkpoints-original.json' with { type: 'json' };
import current from '../proof/driftwood-isle/checkpoints/manifest.json' with { type: 'json' };

const count = v.pipe(v.number(), v.safeInteger(), v.minValue(0));
const Manifest = v.object({ ticks: count,
  effects: v.array(v.object({ tick: count, effect: v.looseObject({ kind: v.literal('fact'), name: v.string(), actorId: v.string() }) })),
  checkpoints: v.array(v.object({ name: v.string(), tick: count, profile: v.array(v.tuple([v.string(), v.string()])) })),
});
const Fact = v.looseObject({ tick: count, instance: v.string(), shard: v.string(), revision: count,
  entity: v.string(), ordinal: count, name: v.string(), origin: v.unknown() });

function profile(rows: readonly (readonly [string, string])[]): unknown {
  return rows.map(([key, text]) => {
    assert.match(key, /^wildshard\.save\.v2(?:@[12])?\.(?:device|global|profile)$/u);
    const value = v.parse(v.looseObject({ keys: v.record(v.string(), v.unknown()) }), JSON.parse(text));
    const ledger = value.keys['platform.ledger'];
    if (ledger !== undefined) {
      const saved = v.parse(v.looseObject({ data: v.looseObject({ facts: v.record(v.string(), Fact) }) }), ledger);
      // Tick is the deliberately migrated route clock. Preserve every other
      // fact field, insertion order and all achievement/entitlement/item data.
      for (const [id, fact] of Object.entries(saved.data.facts)) {
        assert.equal(id, JSON.stringify([fact.instance, fact.shard, fact.revision, fact.entity, fact.tick, fact.ordinal]),
          'Historical fact keys retain their complete provenance before clock migration');
      }
      const facts = Object.values(saved.data.facts).map(({ tick: _tick, ...fact }) => fact);
      value.keys['platform.ledger'] = { ...saved, data: { ...saved.data, facts } };
    }
    return [key.replace(/^wildshard\.save\.v2(?:@[12])?\./u, ''), value];
  });
}

/** One deliberate source-version migration, never a runtime normalization of a newly generated result.
 * Every future generation still compares the complete current manifest and compressed payload hashes exactly. */
export function verifyNativeCheckpointProvenance(): void {
  const before = v.parse(Manifest, original), after = v.parse(Manifest, current);
  assert.deepEqual(after.effects.map(row => row.effect), before.effects.map(row => row.effect),
    'Every historical ordered fact and actor, including both plate-approach kills, remains earned');
  // The declared Captain is reached before the 20,000-tick sampling fence.
  // Check gameplay checkpoint order and periodic fences independently.
  const layout = (row: v.InferOutput<typeof Manifest>) => ({
    gameplay: row.checkpoints.filter(cp => !cp.name.startsWith('tick-')).map(cp => cp.name),
    periodic: row.checkpoints.filter(cp => cp.name.startsWith('tick-')).map(cp => cp.name),
  });
  assert.deepEqual(layout(after), layout(before));
  assert.ok(after.ticks <= 60_000);
  for (const checkpoint of before.checkpoints) {
    const migrated = after.checkpoints.find(row => row.name === checkpoint.name);
    assert.notEqual(migrated, undefined);
    if (migrated === undefined) throw new Error('Missing original checkpoint');
    if (checkpoint.name.startsWith('tick-')) {
      assert.equal(migrated.tick, checkpoint.tick, 'Original periodic checkpoint fences remain exact');
    } else {
      assert.deepEqual(profile(migrated.profile), profile(checkpoint.profile),
        'Named earned checkpoints retain every durable fact and derived reward across the declared epoch/route migration');
    }
  }
}
