// J186 Ring 2, CI only, never a hook. The Sea Cave glyph shard (SH-drift-3, first leg) on the built output: from the
// pier over the plateau and east along the shore to Wreck Cove, the shut tide gate, one plate alone, the tide barrel
// shoved onto the second plate, the gate latched open and the shard taken from the alcove. Only what the page sends
// drives it: movement frames and the [E] press each prompt's net route names. The barrel moves only because the
// player's body walks into it; its position is read, never written. No flag, quest or pose is written. About 4,600 ticks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boot, rider } from './journey-rider.mjs';
import { BARREL_TO_PLATE_A, findBarrel, GATE_TO_PLATE_A, GATE_Z, INTO_CAVE, PLATE_A_TO_BARREL, shoveBarrel, TO_COVE, TO_GATE } from './island-legs.mjs';

test('driftwood-isle: the Sea Cave glyph shard earned on real inputs', { timeout: 30_000 }, async () => {
  const started = performance.now(), { shard, resident } = await boot();
  try {
    const legs = rider(resident), { host, player, head, walk, press, has } = legs;
    const stand = ticks => { for (let tick = 0; tick < ticks; tick++) head(0, 0); };
    assert.ok(Math.hypot(player.position.x - shard.spawn.x, player.position.z - shard.spawn.z) < 0.5, 'The journey starts at the shard spawn');
    walk(TO_COVE); walk(TO_GATE);
    press('shard-cave'); assert.ok(!has('shard:cave'), 'The shard stays behind the shut tide gate');
    press('sluice'); assert.ok(!has('open:sluice'), 'The tide gate does not open by hand');
    for (let tick = 0; tick < 120; tick++) head(0, 1);
    assert.ok(player.position.z < GATE_Z - 0.3, `The shut gate holds the player out: ${player.position.z}`);

    walk(GATE_TO_PLATE_A); stand(10);
    assert.ok(has('plate:tide-plate-a') && !has('open:sluice'), 'One plate alone does not lift the gate');
    walk(PLATE_A_TO_BARREL); stand(10);
    assert.ok(!has('plate:tide-plate-a'), 'The first plate rises when the player steps off it');

    // The barrel the page draws; only read here, to steer by, as a player steers by what they see.
    const barrel = findBarrel(host); assert.ok(barrel, 'The tide barrel lies where it washed up');
    const pushTicks = shoveBarrel(legs, barrel);
    stand(10); assert.ok(has('plate:tide-plate-b') && !has('open:sluice'), 'The barrel alone holds one plate, not the gate');

    walk(BARREL_TO_PLATE_A); stand(10);
    assert.ok(has('open:sluice'), 'Both plates held lift the tide gate');
    walk(INTO_CAVE);
    assert.ok(player.position.z > GATE_Z, `The player walks through the open gate: ${player.position.z}`);
    assert.ok(has('open:sluice'), 'The gate stays latched once the player steps off the plate');
    press('shard-cave'); assert.ok(has('shard:cave') && has('taken:shard-cave'), 'The shard is taken from the alcove');
    for (const flag of ['shard:lookout', 'shard:wreck', 'used:altar']) assert.ok(!has(flag), `The cave alone never grants ${flag}`);
    console.log(`cave-journey ${JSON.stringify({ pushTicks, shardTick: host.state.tick, elapsedMs: Math.round(performance.now() - started) })}`);
  } finally { resident.dispose(); }
});
