// J186 Ring 2, CI only, never a hook. The Sea Cave glyph shard (SH-drift-3, first leg) on the built product: from the
// pier over the plateau and east along the shore to Wreck Cove, the shut tide gate, one plate alone, the tide barrel
// shoved onto the second plate, the gate latched open and the shard taken from the alcove. Only what the page sends
// drives it: movement frames and the [E] press each prompt's net route names. The barrel moves only because the
// player's body walks into it; its position is read, never written. No flag, quest or pose is written. About 4,600 ticks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boot, rider } from './journey-rider.mjs';

// The pier and the plateau ramp (content-tapes.json), down to the creek as the Lookout journey goes, then east along
// the shore past the crabs' sand to Wreck Cove, south of the driftwood piles.
const TO_COVE = [[0, -186.5], [-8, -172], [-17, -161], [-20, -150], [-30, -142], [-30, -130], [-30, -118], [-30, -106], [-30, -104],
  [-24, -80], [-22, -76], [0, -40], [15.6, -7], [20, -3], [46, -3], [58, 2], [80, 1], [100, 1], [120, 0], [128, -6], [136, -6], [142, -4]];
// Round the driftwood piles to the shut sluice (walk-routes.json `cave`), and back out.
const TO_GATE = [[145.6, 0.8], [146.4, 6], [146.2, 10.2], [144.75, 12.95], [142.6, 14.4], [142, 16], [142, 17.5], [142, 19.25]];
const GATE_TO_PLATE_A = [[142, 17.5], [142, 16], [140, 12], [139.1, 10]];
const PLATE_A_TO_BARREL = [[140, 12], [144.75, 12.95], [146.2, 10.2], [146.4, 6], [145.6, 0.8], [149, -1], [148.3, 1.9]];
const BARREL_TO_PLATE_A = [[144.5, 6], [146.2, 10.2], [144.75, 12.95], [142.6, 14.4], [140, 12], [139.1, 10]];
const INTO_CAVE = [[140, 12], [142.6, 14.4], [142, 16], [142, 17.5], [142, 19.25], [142, 21.2]];
// The built rows (interactables.ts): the barrel washed up at (147.5, 3.5), tide plate B at (144.9, 9.9), the gate at z 19.95.
const BARREL_HOME = { x: 147.5, z: 3.5 }, PLATE_B = { x: 144.9, z: 9.9 }, GATE_Z = 19.95;

test('driftwood-isle: the Sea Cave glyph shard earned on real inputs', { timeout: 30_000 }, async () => {
  const started = performance.now(), { shard, resident } = await boot();
  try {
    const { host, player, head, walk, press, has } = rider(resident);
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
    let barrel = null;
    host.physics.world.forEachRigidBody(body => { const at = body.translation(); if (body.isDynamic() && Math.hypot(at.x - BARREL_HOME.x, at.z - BARREL_HOME.z) < 1) barrel = body; });
    assert.ok(barrel, 'The tide barrel lies where it washed up');
    // Walk (no sprint) into the barrel, as a player shoves it: line up on its far side from where it should go, then lean
    // through its centre. It goes by a point east of the straight line, clear of the driftwood piles it would wedge on.
    const pushStart = host.state.tick, BARREL_LINE = [[146.3, 7.6], [PLATE_B.x, PLATE_B.z]];
    let leg = 0;
    for (let tick = 0; tick < 1500 && !has('plate:tide-plate-b'); tick++) {
      const at = barrel.translation();
      if (leg < BARREL_LINE.length - 1 && Math.hypot(BARREL_LINE[leg][0] - at.x, BARREL_LINE[leg][1] - at.z) < 0.5) leg++;
      const ux = BARREL_LINE[leg][0] - at.x, uz = BARREL_LINE[leg][1] - at.z, u = Math.hypot(ux, uz);
      const vx = at.x - player.position.x, vz = at.z - player.position.z, v = Math.hypot(vx, vz);
      if ((vx * ux + vz * uz) / (v * u) > 0.99 && v < 1.6) head(vx / v + ux / u, vz / v + uz / u, false);
      else head(at.x - ux / u * 1.5 - player.position.x, at.z - uz / u * 1.5 - player.position.z, false);
    }
    assert.ok(has('plate:tide-plate-b'), `The barrel is shoved onto the second plate: ${JSON.stringify(barrel.translation())}`);
    const pushTicks = host.state.tick - pushStart;
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
