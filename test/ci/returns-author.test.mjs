// J186: actual owner generator -> public compiler -> real admitted guest.
// No shadow artifact or authored gameplay byte is published by this proof.
import '@wildshard/engine/scripts/sim-node-loader.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const { compileDecisionScripts } = await import('@wildshard/sharddev/buildDecisionScripts');
const { compileScript } = await import('@wildshard/sharddev/compileScript');
const { compileScriptV2 } = await import('@wildshard/sharddev/compileScriptV2');
const { ReturnProgram } = await import('@wildshard/engine/game/population/returnProgram');
const { Rng } = await import('@wildshard/engine/core/rng');
const { Scope } = await import('@wildshard/engine/app/scope');
const { setTerrainHeight } = await import('@wildshard/engine/world/terrainHeight');
const { driftwoodGuestBytes } = await import('../../src/generators/guestPrograms.ts');
const { driftwoodGroundField } = await import('../../src/generators/groundRows.ts');
const { WORLD_DROP, SHORE_LEVEL } = await import('../../src/generators/landscapeRows.ts');

function rngAfter(seed, draws) {
  const random = new Rng(seed);
  for (let i = 0; i < draws; i++) random.next();
  return random.snapshot();
}

test('actual Driftwood return guest keeps all six public signal laws and opaque RNG continuation', { timeout: 9500 }, async () => {
  const root = 'src', owner = new Scope('driftwood-return-proof');
  const inputs = new Map(['behaviour/returns.as', 'behaviour/bridgeSway.as', 'behaviour/director.as', 'data/director.json'].map(file => [file, new Uint8Array(readFileSync(`${root}/${file}`))]));
  const compiler = { compileDecisionRows: compileDecisionScripts, compileScript, compileScriptV2 };
  let program;
  try {
    const files = await driftwoodGuestBytes(inputs, compiler);
    const bytes = files.get('behaviour/returns.generated.wasm'), metadataBytes = files.get('behaviour/returns.generated.json');
    assert.ok(bytes); assert.ok(metadataBytes);
    const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
    program = ReturnProgram.page({ script: metadata.script, bytes: Buffer.from(bytes).toString('base64') }, owner);
    const seen = new Set();
    const project = (signal, observation, random, candidates) => {
      seen.add(signal); return program.project(signal, observation, random, candidates);
    };
    assert.deepEqual(project('schedule', { now: 10, minimum: 2, maximum: 6, draw: .25 }), { due: 13 });
    for (const [now, night, nocturnal, away, eligible] of [[9, 1, 0, 5, 0], [10, .5, 1, 5, 1], [10, .499, 1, 5, 0], [10, 0, 0, 5.001, 0]]) {
      assert.deepEqual(project('eligible', { now, night, nocturnal, away, due: 10, x: 3, z: 4, playerX: 0, playerZ: 0 }), { eligible });
    }
    for (const [alive, dead, hidden, action] of [[1, 10, 0, 0], [0, 1, 0, 0], [0, 10, 0, 1], [0, 10, 1, 2]]) {
      assert.deepEqual(project('practice', { alive, dead, hidden, deadDt: .1, delay: 2, distance: 10, away: 5 }), { dead: dead + .1, action });
    }
    assert.deepEqual(project('perchHeight', { y: 5, ground: 2 }), { perchH: 3.05 });
    assert.deepEqual(project('perchHeight', { y: 0, ground: 2 }), { perchH: .5 });
    const empty = new Rng(31);
    assert.deepEqual(project('perchScore', { candidates: 0 }, empty), { index: -1, score: 0 });
    assert.deepEqual(empty.snapshot(), rngAfter(31, 0));
    const random = new Rng(71), before = random.snapshot();
    const candidates = [{ awayDistance: 1, distance: 100, occupied: 0 }, { awayDistance: 20, distance: 0, occupied: 0 }];
    const score = project('perchScore', { candidates: 2 }, random, candidates);
    assert.equal(score.index, 1); assert.ok(score.score >= 10 && score.score <= 13);
    assert.deepEqual(random.snapshot(), rngAfter(71, 2));
    const restored = new Rng(0); restored.restore(before);
    assert.deepEqual(project('perchScore', { candidates: 2 }, restored, candidates), score);
    assert.deepEqual(restored.snapshot(), random.snapshot());

    const terrain = driftwoodGroundField(), samples = [];
    setTerrainHeight((x, z) => { samples.push([x, z]); return terrain.heightAt(x, z) - WORLD_DROP; });
    const water = SHORE_LEVEL - WORLD_DROP;
    const deckRandom = new Rng(19);
    assert.deepEqual(project('place', { fixed: 1, x: 0, z: -165, now: 10, water }, deckRandom), { retry: 0, x: 0, z: -165 });
    assert.deepEqual(samples.splice(0), [[0, -165]], 'Fixed decks retain the final actual terrain query');
    assert.deepEqual(deckRandom.snapshot(), rngAfter(19, 0));
    const dryRandom = new Rng(23), dry = project('place', { fixed: 0, x: 0, z: 0, now: 10, water }, dryRandom);
    assert.equal(dry.retry, 0); assert.ok(terrain.heightAt(dry.x, dry.z) - WORLD_DROP > water + .15);
    assert.equal(samples.length, 2); samples.length = 0;
    assert.deepEqual(dryRandom.snapshot(), rngAfter(23, 2));
    const wetRandom = new Rng(29);
    assert.deepEqual(project('place', { fixed: 0, x: 220, z: 220, now: 10, water }, wetRandom), { retry: 70, x: 220, z: 220 });
    assert.equal(samples.length, 7); assert.deepEqual(wetRandom.snapshot(), rngAfter(29, 12));
    assert.deepEqual([...seen].sort(), ['eligible', 'perchHeight', 'perchScore', 'place', 'practice', 'schedule']);

    // Compile an actual ABI2 owner source between full shipping generations.
    // The independent shipping result, including all three guests, must survive.
    await compileScriptV2(new TextDecoder().decode(inputs.get('behaviour/bridgeSway.as')), { lane: 'view', ioBytes: 4096 });
    assert.deepEqual(await driftwoodGuestBytes(inputs, compiler), files, 'Shadow compilation cannot alter shipped guest bytes');
  } finally { owner.dispose(); }
  assert.throws(() => program.project('schedule', { now: 10, minimum: 2, maximum: 6, draw: .25 }), /disposed/u);
});
