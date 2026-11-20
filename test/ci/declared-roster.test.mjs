// ONE-FORMAT OF22b1, CI only after a real build: the island's roster as rows. The keeper's 34 bodies (`data/nativeKeeper.json`)
// are declared spawns (`generators/rows/declaredRoster.ts`); with the population hosts cut from the native plan, OF22b0's
// path stands every one of them under its own id, kind and variant, and they save and restore exactly. Until the rows ship
// (OF22b4 cuts the hosts in the product), the test declares them on the built product itself.
import '@wildshard/engine/scripts/sim-node-loader.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const { loadHeadlessFolder } = await import('@wildshard/engine/host/headlessFolder');
const { createNativeHeadlessResident } = await import('@wildshard/engine/host/headlessRuntime');
const { outputDescriptor, serverReadsFile } = await import('@wildshard/engine/game/shardfile/outputDescriptor');
const { loadRapier } = await import('@wildshard/engine/physics/rapier');
const { serializeSimSnapshot, snapshotSimHostBytes } = await import('@wildshard/engine/sim/snapshot');
const { emptyShardfile } = await import('@wildshard/engine/host/author');
const { parseShardfile } = await import('@wildshard/format/shardSchema');
const { NATIVE_ASSEMBLY_FILE } = await import('@wildshard/format/nativeAssembly');
const { driftwoodDeclaredRoster } = await import('../../src/generators/rows/declaredRoster.ts');
const engineRequire = createRequire(import.meta.resolve('@wildshard/engine/package.json'));
const keeper = JSON.parse(readFileSync('src/data/nativeKeeper.json', 'utf8'));

/** The hosts the declared roster replaces; on engine 0.1.53 the quest hosts still read the island population, so they go
 *  too (engine 9d401465d, OF22e1, reads declared bodies). */
const CUT = new Set(['population.mixed', 'population.reactions', 'population.settle', 'population.poses', 'quest.kill-steps', 'quest.chapter', 'quest.composition', 'quest.body-scripts']);

async function declared() {
  const directory = resolve('out/driftwood-isle'), product = await loadHeadlessFolder(directory), shard = product.shardfile;
  const descriptor = outputDescriptor(shard); assert.ok(descriptor, 'The built shard must pass admission');
  const assets = new Map(descriptor.index.files.filter(file => serverReadsFile(file, shard.terrain?.collider))
    .map(file => [file.commons === true ? `commons:${file.hash}` : file.hash, readFileSync(join(directory, file.path))]));
  const rapier = await loadRapier(readFileSync(engineRequire.resolve('@dimforge/rapier3d-simd/rapier_wasm3d_bg.wasm')));
  const program = JSON.parse(new TextDecoder().decode(await product.file('poses/monkey.json'))).program;
  const roster = driftwoodDeclaredRoster(program);
  const base = emptyShardfile({ slug: 'driftwood-roster', name: 'Roster', author: 'Test', revision: 1, seed: 7 });
  const looks = roster.species.map(row => ({ id: row.body.look, species: row.id, recipe: 'of22b1.rig', material: null, parameters: {}, animation: { recipe: 'of22b1.clips', parameters: {} } }));
  const parsed = parseShardfile({ ...base, items: { ...base.items, catalogue: roster.items }, rows: { ...base.rows, species: roster.species, strikes: roster.strikes, looks },
    creatures: { ...base.creatures, brains: roster.brains, spawns: roster.spawns, perchBodies: roster.perchBodies } });
  const source = { ...shard, rows: { ...shard.rows, species: [...shard.rows.species, ...parsed.rows.species], strikes: [...shard.rows.strikes, ...parsed.rows.strikes],
    looks: [...shard.rows.looks, ...parsed.rows.looks] }, creatures: parsed.creatures };
  const plan = JSON.parse(new TextDecoder().decode(await product.file(NATIVE_ASSEMBLY_FILE)));
  const bytes = new TextEncoder().encode(JSON.stringify({ ...plan, features: plan.features.filter(row => !CUT.has(row.host)) }));
  // With the population hosts gone the returns program's only reader is the perch body, which lends it itself: the
  // `actors/return-scripts` row leaves with them (on 0.1.53 both loans on one host refuse, "Raw return module loan changed").
  const cut = { ...product, shardfile: source, file: name => name === NATIVE_ASSEMBLY_FILE ? Promise.resolve(bytes) : product.file(name),
    has: name => name !== 'actors/return-scripts' && product.has(name) };
  return { roster, open: snapshot => createNativeHeadlessResident({ shard: source, assets, rapier, product: cut }, snapshot) };
}

test('driftwood-isle: the declared roster stands the keeper\'s 34 bodies with their ids, kinds and variants', { timeout: 60_000 }, async () => {
  const { roster, open } = await declared(), live = await open();
  let restored;
  try {
    const bodies = keeper.bodies.filter(body => body.kind !== 'captain');
    assert.equal(bodies.length, 34);
    assert.deepEqual(roster.spawns.map(row => row.id), bodies.map(body => body.id));
    for (const body of bodies) {
      const actor = live.host.entities.get(body.id); assert.ok(actor, `${body.id} stands`);
      const species = roster.species.find(row => row.id === actor.species);
      assert.equal(species?.kind, body.kind, `${body.id} is a ${body.kind}`);
      assert.equal(actor.variant, body.variant, `${body.id} is a ${body.variant}`);
      assert.ok(Math.hypot(actor.position.x - body.x, actor.position.z - body.z) < 0.5, `${body.id} stands at its keeper place`);
    }
    for (let tick = 0; tick < 300; tick++) live.step([]);
    assert.equal(bodies.filter(body => live.host.entities.get(body.id)?.alive === true).length, 34);
    restored = await open(serializeSimSnapshot(snapshotSimHostBytes(live.host)));
    for (const body of bodies) assert.ok(restored.host.entities.get(body.id), `${body.id} restores`);
  } finally { restored?.dispose(); live.dispose(); }
});
