// ONE-FORMAT OF22a2 and OF22a3c: Driftwood's server plan names no host for what its sections already say. The day comes
// from the look's toon sky clock and the sea from the declared sea row (engine 982b2647a); the bake's solids are plain
// prop collider rows (`data/solidRows.json`, engine c3b7fde16), so neither `day.toon`, `water.sea` nor `collision`
// stands anywhere. FORMAT-PRUNE FP16b: there is no plan file at all; the world's settings are the `server/world` section.
import { expect, test } from 'vitest';
import { driftwoodServerFiles, driftwoodServerWorld } from '../src/generators/nativeServer';
import solidRows from '../src/data/solidRows.json' with { type: 'json' };

function serverRow<T>(name: string): T {
  const blob = driftwoodServerFiles().find(row => row.file.name === name);
  if (blob === undefined) throw new Error(`Missing Driftwood server file ${name}`);
  return JSON.parse(new TextDecoder().decode(blob.bytes)) as T;
}
test('no native plan stands a day, sea or collision host: the sections and prop rows say them', () => {
  expect(driftwoodServerFiles().map(row => row.file.name)).not.toContain('server/native-assembly.json');
  expect(Object.keys(driftwoodServerWorld())).not.toContain('features');
  // the solids the host stood are the shard's own prop rows (edge walls, landings and the engine's training room stay out)
  expect(solidRows.length).toBeGreaterThan(0);
  expect(solidRows.every(row => !row.id.startsWith('piece.entry') && !row.id.startsWith('piece.practice'))).toBe(true);
});

test('each prompt that sees through its own prop sees the prop row its collider stands in', () => {
  // the server's sight ray passes a prompt whose ray meets the body it names; a prop row tags its colliders with its id
  const spots = serverRow<{ promptRegistrations: { id: string | null; sight: { body?: string } }[] }>('server/quest-spots.json');
  const rows = new Set(solidRows.map(row => row.id));
  const bodies = spots.promptRegistrations.flatMap(row => row.sight.body === undefined ? [] : [row.sight.body]);
  expect(bodies.filter(body => body.includes('interact'))).toHaveLength(8);
  expect(bodies.filter(body => body.includes('interact') && !rows.has(body))).toEqual([]);
});
