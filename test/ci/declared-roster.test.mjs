// ONE-FORMAT OF22b1 and OF22b4, CI only after a real build: the island's roster as rows. The keeper's 34 bodies (`data/nativeKeeper.json`)
// are declared spawns (`generators/rows/declaredRoster.ts`); with the population hosts cut from the native plan, OF22b0's
// path stands every one of them under its own id, kind and variant on the built product, and they save and restore exactly.
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
const { serializeSimSnapshot, snapshotSimHost, snapshotSimHostBytes } = await import('@wildshard/engine/sim/snapshot');
const { populationCensus } = await import('@wildshard/engine/game/population/census');
const { runHeadlessJourney } = await import('@wildshard/engine/host/headlessJourney');
const { canonicalSimDigest } = await import('@wildshard/engine/test/simState');
const { Vector3 } = await import('three');
const { NATIVE_ASSEMBLY_FILE } = await import('@wildshard/format/nativeAssembly');
const engineRequire = createRequire(import.meta.resolve('@wildshard/engine/package.json'));
const keeper = JSON.parse(readFileSync('src/data/nativeKeeper.json', 'utf8'));

/** The built product as it ships (OF22b4): the roster is its declared rows and no population host stands them. */
async function declared() {
  const directory = resolve('out/driftwood-isle'), product = await loadHeadlessFolder(directory), shard = product.shardfile;
  const descriptor = outputDescriptor(shard); assert.ok(descriptor, 'The built shard must pass admission');
  const assets = new Map(descriptor.index.files.filter(file => serverReadsFile(file, shard.terrain?.collider))
    .map(file => [file.commons === true ? `commons:${file.hash}` : file.hash, readFileSync(join(directory, file.path))]));
  const rapier = await loadRapier(readFileSync(engineRequire.resolve('@dimforge/rapier3d-simd/rapier_wasm3d_bg.wasm')));
  const plan = JSON.parse(new TextDecoder().decode(await product.file(NATIVE_ASSEMBLY_FILE)));
  assert.deepEqual(plan.features.map(row => row.host).filter(host => host.startsWith('population.')), []);
  const roster = { species: shard.rows.species, spawns: shard.creatures.spawns.filter(row => row.id !== 'driftwood.captain') };
  return { roster, open: snapshot => createNativeHeadlessResident({ shard, assets, rapier, product }, snapshot) };
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

const PRACTICE = 'creature:21';
const kill = (resident, id) => {
  const actor = resident.host.entities.get(id); assert.ok(actor?.alive, `${id} is alive`);
  const dealt = resident.host.combat.hit({ source: 'env', sourceTags: ['dmg.legacy', 'cover.checked'], target: actor.combatActor(),
    amount: actor.maxHp * 10, point: actor.position.clone(), dir: new Vector3(0, 0, 1) });
  assert.equal(dealt?.killed, true, `${id} falls`);
};
const steps = (resident, ticks) => { for (let tick = 0; tick < ticks; tick++) resident.step([]); };

// OF22b4: the engine's Driftwood population test (engine test/driftwood-headless-population.test.ts) on the declared roster:
// the same census, movement, perch, returns and restore the mixed population's keeper gave.
test('driftwood-isle: the declared roster lives as the native roster did (census, movement, perch, returns, restore)', { timeout: 120_000 }, async () => {
  const { open } = await declared(), live = await open();
  let restored;
  try {
    const bodies = keeper.bodies.filter(body => body.kind !== 'captain'), rows = bodies.toSorted((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    // the Drowned Captain (OF22c2) waits in the world beside them, dormant (counted fallen), until the chapter wakes him
    const born = populationCensus(live.host), island = born.bodies.filter(body => body.id !== 'driftwood.captain');
    assert.deepEqual(island.map(body => [body.id, body.kind, body.variant]), rows.map(row => [row.id, row.kind, row.variant]));
    assert.deepEqual(born.kinds, { boar: { alive: 11, fallen: 0 }, bear: { alive: 2, fallen: 0 }, crab: { alive: 9, fallen: 0 }, monkey: { alive: 11, fallen: 0 }, sailor: { alive: 1, fallen: 0 }, captain: { alive: 0, fallen: 1 } });

    const journey = runHeadlessJourney(live.host, input => { live.step(input); }, { ticks: 900, points: [{ x: 0, z: -194 }, { x: 60, z: -130 }] });
    assert.equal(journey.ticks, 900);
    const walked = populationCensus(live.host), was = new Map(born.bodies.map(body => [body.id, body]));
    const moved = walked.bodies.filter(body => { const before = was.get(body.id); return before !== undefined
      && Math.hypot(body.position[0] - before.position[0], body.position[2] - before.position[2]) > 1; }).map(body => body.kind);
    // the herd under the walk moves as the native one did; a declared skirmisher crab shuffles in its idle too (the practice
    // crab drifts ~1.5 m with no player near, a draw of its own stream), and the sailor keeps to his hold
    for (const kind of ['boar', 'bear', 'monkey']) assert.ok(moved.includes(kind), `a ${kind} moves`);
    assert.deepEqual(moved.filter(kind => kind !== 'boar' && kind !== 'bear' && kind !== 'monkey' && kind !== 'crab'), []);
    assert.ok(walked.bodies.some(body => body.state === 'perch'), 'a monkey sits a perch');

    kill(live, 'creature:7'); steps(live, 1);
    assert.deepEqual(populationCensus(live.host).kinds['boar'], { alive: 10, fallen: 1 });

    restored = await open(serializeSimSnapshot(snapshotSimHostBytes(live.host)));
    assert.deepEqual(populationCensus(restored.host), populationCensus(live.host));
    assert.equal(canonicalSimDigest(snapshotSimHost(restored.host)), canonicalSimDigest(snapshotSimHost(live.host)));

    // the practice crab returns after 45 s dead and 1.5 s fading, with the player over 30 m away
    kill(live, PRACTICE); kill(restored, PRACTICE);
    for (let tick = 0; tick < 2700; tick++) { live.step([]); restored.step([]); }
    assert.deepEqual(populationCensus(live.host).kinds['crab'], { alive: 8, fallen: 1 });
    assert.deepEqual(populationCensus(restored.host), populationCensus(live.host));
    for (let tick = 0; tick < 120; tick++) { live.step([]); restored.step([]); }
    const returned = populationCensus(live.host);
    assert.deepEqual(returned.kinds['crab'], { alive: 9, fallen: 0 });
    assert.equal(returned.bodies.find(body => body.id === PRACTICE)?.alive, true);
    assert.deepEqual(populationCensus(restored.host), returned);
    assert.equal(canonicalSimDigest(snapshotSimHost(restored.host)), canonicalSimDigest(snapshotSimHost(live.host)));
  } finally { restored?.dispose(); live.dispose(); }
});
