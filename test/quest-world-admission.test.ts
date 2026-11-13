import { DRIFTWOOD_LAYOUTS } from './fixtures/driftwood-layout-source';
import { expect, test } from 'vitest';
import { QuestWorldSchema } from '@wildshard/format/questWorld';
import { driftwoodQuestWorld } from '../src/generators/questWorld';
import * as v from 'valibot';


test('the defining named quest world schema preserves the original anchors and POI order', () => {
  const rows = driftwoodQuestWorld(DRIFTWOOD_LAYOUTS);
  expect(v.parse(QuestWorldSchema, rows)).toEqual(rows);
});

test('named quest world admission refuses reflected paths and invalid anchor values', () => {
  const rows = driftwoodQuestWorld(DRIFTWOOD_LAYOUTS);
  for (const bad of [{ ...rows, path: ['world', 'pois'] },
    { ...rows, pois: { hut: { anchors: { door: { x: 'wrong', y: 0, z: 0, yaw: 0 } } } } },
    { ...rows, pois: { hut: { anchors: { door: { x: 0, y: 0, z: 0, yaw: Infinity } } } } }])
    expect(() => v.parse(QuestWorldSchema, bad)).toThrow();
});
