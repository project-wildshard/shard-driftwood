// J186 Ring 2, CI only, never a hook. The Lookout glyph shard (SH-drift-2) on the built product: from the pier to
// Wendell on the plateau, his sea chest for the flint, round the gully's south end and up the headland's plank trail,
// the lookout stair to the platform, the beacon lit and the shard taken. Only what the page sends drives it: movement
// and the [E] press each prompt's net route names. No flag, quest or pose is written. About 3,700 ticks.
import '@wildshard/engine/scripts/sim-node-loader.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const { loadHeadlessProduct } = await import('@wildshard/engine/host/headlessProduct');
const { createTrustedHeadlessResident } = await import('@wildshard/engine/host/headlessRuntime');
const { outputDescriptor, serverReadsFile } = await import('@wildshard/engine/game/shardfile/outputDescriptor');
const { loadRapier } = await import('@wildshard/engine/physics/rapier');
const { actRoutes } = await import('@wildshard/engine/sim/actRoutes');
const engineRequire = createRequire(import.meta.resolve('@wildshard/engine/package.json'));

// The pier and the plateau ramp to the castaway (content-tapes.json), then into the hut to his chest.
const TO_CASTAWAY = [[0, -186.5], [-8, -172], [-17, -161], [-20, -150], [-30, -142], [-30, -130], [-30, -118], [-30, -106], [-30, -104],
  [-24, -80], [-22, -74], [-22, -71.5]];
const TO_CHEST = [[-22, -68.9], [-22, -67.6], [-22, -66.7], [-22, -65.2], [-22, -62.9]];
// Out of the hut and down to the creek. The rope bridge has no server deck (NL5), so the walk rounds the gully's
// south-east end, climbs its far bank and joins the headland's plank trail (GRADED path 2) to the lookout's foot.
const TO_HEADLAND = [[-22, -71.5], [-22, -76], [0, -40], [15.6, -7], [20, -3], [46, -3], [46, 8], [47, 16], [47, 24], [45, 26], [42, 25],
  [36, 27], [34, 30], [35, 34], [37.5, 36], [40, 39], [46, 46], [56, 56], [66, 66], [76, 76], [86.1, 82.45]];
// The lookout stair to the platform (walk-routes.json `lookout`).
const STAIR = [[86.94, 83.68], [87.68, 84.76], [90.27, 88.55], [92.76, 92.18], [93.44, 93.17], [94.17, 94.25]];

async function boot() {
  const directory = resolve('out/driftwood-isle'), product = await loadHeadlessProduct(directory), shard = product.shardfile;
  const descriptor = outputDescriptor(shard); assert.ok(descriptor, 'The built shard must pass admission');
  const assets = new Map(descriptor.index.files.filter(file => serverReadsFile(file, shard.terrain?.collider) && (file.name === undefined || file.kind === 'wasm' || file.kind === 'tile'))
    .map(file => [file.commons === true ? `commons:${file.hash}` : file.hash, readFileSync(join(directory, file.path))]));
  const rapier = await loadRapier(readFileSync(engineRequire.resolve('@dimforge/rapier3d-simd/rapier_wasm3d_bg.wasm')));
  return { shard, resident: await createTrustedHeadlessResident({ shard, assets, product, rapier }) };
}

function rider(resident) {
  const { host } = resident, player = [...host.players.values()][0]; assert.ok(player);
  const routes = actRoutes(host).interactions;
  // Run (the page's sprint) to each point in turn; a point not reached in its allowance fails the route there.
  const walk = points => {
    for (const [x, z] of points) {
      const allowance = Math.max(300, Math.ceil(Math.hypot(x - player.position.x, z - player.position.z) * 60));
      let reached = false;
      for (let tick = 0; tick < allowance && !reached; tick++) {
        const dx = x - player.position.x, dz = z - player.position.z, distance = Math.hypot(dx, dz);
        if (distance < 0.25) { reached = true; break; }
        resident.step([{ kind: 'player', moveX: dx / distance, moveZ: dz / distance, yaw: Math.atan2(-dx, -dz), commandVersion: 1, sprint: true,
          steer: { keyX: 0, keyY: 1, stickX: 0, stickY: 0 } }]);
      }
      assert.ok(reached, `The walk is blocked at ${x}, ${z}: ${player.position.x}, ${player.position.y}, ${player.position.z}`);
    }
  };
  // [E] where the player stands: the act the prompt's net route names, beside a standing player frame.
  const press = name => {
    const route = routes.get(name); assert.ok(route, `The product must route the ${name} prompt`);
    resident.step([{ kind: 'player', moveX: 0, moveZ: 0, yaw: 0, commandVersion: 1, steer: { keyX: 0, keyY: 0, stickX: 0, stickY: 0 } },
      { kind: 'script', actorId: route.actorId, value: route.value }]);
  };
  const has = flag => host.flags.all.has?.(flag) ?? [...host.flags.all].includes(flag);
  return { host, player, walk, press, has };
}

test('driftwood-isle: the Lookout glyph shard earned on real inputs', { timeout: 30_000 }, async () => {
  const started = performance.now(), { shard, resident } = await boot();
  try {
    const { host, player, walk, press, has } = rider(resident);
    assert.ok(Math.hypot(player.position.x - shard.spawn.x, player.position.z - shard.spawn.z) < 0.5, 'The journey starts at the shard spawn');
    walk(TO_CASTAWAY);
    press('castaway-chest'); assert.ok(!has('has:flint'), 'The chest stays shut until Wendell has spoken');
    press('castaway.talk'); assert.ok(has('talked:castaway'), 'Talking to Wendell starts the quest');
    walk(TO_CHEST);
    press('castaway-chest'); assert.ok(has('open:castaway-chest') && has('has:flint'), 'The sea chest gives the flint');
    press('beacon'); assert.ok(!has('lit:beacon'), 'The beacon cannot be lit from the hut');
    const chestTick = host.state.tick;
    walk(TO_HEADLAND); walk(STAIR);
    assert.ok(player.position.y > 40, `The stair reaches the platform: ${player.position.y}`);
    assert.equal(player.motor.snapshot().result.grounded, true);
    press('shard-lookout'); assert.ok(!has('shard:lookout'), 'The shard is not there before the beacon burns');
    press('beacon'); assert.ok(has('lit:beacon'), 'The flint lights the beacon');
    press('shard-lookout'); assert.ok(has('shard:lookout') && has('taken:shard-lookout'), 'The shard rises out of the flames');
    for (const flag of ['shard:wreck', 'shard:cave', 'used:altar']) assert.ok(!has(flag), `The lookout alone never grants ${flag}`);
    console.log(`lookout-journey ${JSON.stringify({ chestTick, shardTick: host.state.tick, elapsedMs: Math.round(performance.now() - started) })}`);
  } finally { resident.dispose(); }
});

// NL5 (meta NET-LAG-PLAN, owned by opus-nl5): the server's collider set has no rope-bridge deck between its
// authored ends (16, 14) and (32, 30); a player walking the bridge route drops into the gully at about (18, 16).
// Kept as a red leg to unskip when NL5 lands; the journey above rounds the gully instead.
test('driftwood-isle: the rope bridge carries the player over the gully', { skip: 'NL5: the server has no rope-bridge deck; the walk falls into the gully', timeout: 30_000 }, async () => {
  const { resident } = await boot();
  try {
    const { player, walk } = rider(resident);
    walk([...TO_CASTAWAY, [-22, -76], [0, -40], [15.6, -7], [13.88, 11.88], [15.29, 13.29]]);
    for (const point of [[23.99, 21.99], [31.98, 29.98], [35.8, 33.8]]) { walk([point]); assert.ok(player.position.y > 5, `The deck holds at ${point}: ${player.position.y}`); }
  } finally { resident.dispose(); }
});
