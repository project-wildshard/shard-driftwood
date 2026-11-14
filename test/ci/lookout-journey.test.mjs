// J186 Ring 2, CI only, never a hook. The Lookout glyph shard (SH-drift-2) on the built output: from the pier to
// Wendell on the plateau, his sea chest for the flint, round the gully's south end and up the headland's plank trail,
// the lookout stair to the platform, the beacon lit and the shard taken. Only what the page sends drives it: movement
// and the [E] press each prompt's net route names. No flag, quest or pose is written. About 3,700 ticks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boot, rider } from './journey-rider.mjs';
import { STAIR, TO_CASTAWAY, TO_CHEST, TO_HEADLAND } from './island-legs.mjs';

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
