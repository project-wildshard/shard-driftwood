// J186 Ring 2, CI only, never a hook. The Wreck glyph shard (SH-drift-3, second leg) on the built product: from the pier
// over the plateau and east along the shore to Wreck Cove, down the hatch ramp into the hold, the drowned sailor risen
// and beaten by the player's own clicks, his hold key, the bilge pump, the cargo winch and the captain's strongbox.
// Only what the page sends drives it: movement frames, the attack a click on the locked sailor sends, and the [E] press
// each prompt's net route names. The sailor's position is read to steer by, never written. No flag, quest or pose is
// written. About 4,300 ticks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boot, rider } from './journey-rider.mjs';

// The pier and the plateau ramp (content-tapes.json), down to the creek and east along the shore to Wreck Cove, as the
// Sea Cave journey goes.
const TO_COVE = [[0, -186.5], [-8, -172], [-17, -161], [-20, -150], [-30, -142], [-30, -130], [-30, -118], [-30, -106], [-30, -104],
  [-24, -80], [-22, -76], [0, -40], [15.6, -7], [20, -3], [46, -3], [58, 2], [80, 1], [100, 1], [120, 0], [128, -6], [136, -6], [142, -4]];
// The hatch ramp into the hold and the hold stair (walk-routes.json `wreck`), where the sailor rises.
const INTO_HOLD = [[145.17, -0.15], [146.8, 0.62], [148.24, 1.3], [150.23, 2.24], [151.32, 2.75], [154.08, 2.07]];
// Over the sailor's fallen key, beside the bilge pump, then the cargo winch (the levers' wreck-frame rows in interactables.ts, a step short of each).
const TO_KEY = [[153.8, -0.7]], TO_PUMP = [[154.56, -0.14]], TO_WINCH = [[153.92, -1.11]];
// The sailor's hold row (enemyPlacement.ts): 0.5 m starboard, 2.2 m sternward of the wreck at (153, 2).
const SAILOR_HOME = { x: 153.49, z: -0.2 };

test('driftwood-isle: the Wreck glyph shard earned on real inputs', { timeout: 30_000 }, async () => {
  const started = performance.now(), { shard, resident } = await boot();
  try {
    const { host, player, head, walk, press, strike, has } = rider(resident);
    assert.ok(Math.hypot(player.position.x - shard.spawn.x, player.position.z - shard.spawn.z) < 0.5, 'The journey starts at the shard spawn');
    // The sailor the page draws; only read here, to steer and aim by, as a player does by what they see.
    const [sailorId, sailor] = [...host.entities].find(([, body]) => body.kind === 'sailor' && Math.hypot(body.position.x - SAILOR_HOME.x, body.position.z - SAILOR_HOME.z) < 1) ?? [];
    assert.ok(sailor?.alive, 'The drowned sailor lies in the hold');
    walk(TO_COVE);
    assert.ok(sailor.position.y < 0, `The sailor stays sunk while the player is on the beach: ${sailor.position.y}`);
    walk(INTO_HOLD);
    // Each refusal is pressed from the spot the same press succeeds from later, so it is the rule refusing, not reach.
    walk(TO_KEY); press('hold-key'); assert.ok(!has('key:hold'), 'The key is not there while the sailor stands');
    walk(TO_PUMP); press('hold-pump'); assert.ok(!has('lever:hold-pump'), 'The bilge pump stays padlocked without the key');

    // The fight: close on him at a walk, and click (one attack every half second) while he is in reach.
    assert.equal(sailor.hp, sailor.maxHp, 'The sailor is unhurt before the first click');
    const fightStart = host.state.tick;
    let clicks = 0, lastClick = -Infinity;
    for (let tick = 0; tick < 2400 && sailor.alive; tick++) {
      const dx = sailor.position.x - player.position.x, dz = sailor.position.z - player.position.z, distance = Math.hypot(dx, dz);
      if (distance > 1.5) head(dx, dz, false);
      else if (tick - lastClick >= 30) { strike(sailorId, dx, dz); clicks++; lastClick = tick; }
      else head(0, 0);
    }
    const fightTicks = host.state.tick - fightStart;
    assert.ok(!sailor.alive && has('dead:sailor'), `The player beats the drowned sailor: ${sailor.hp} hp left after ${clicks} clicks`);
    assert.ok(player.actor().alive, 'The player survives the fight');

    walk(TO_KEY); press('hold-key'); assert.ok(has('key:hold'), 'He drops the hold key');
    walk(TO_WINCH); press('hold-winch'); assert.ok(!has('winch:up'), 'The winch is jammed while the hold is flooded');
    press('strongbox'); assert.ok(!has('open:strongbox'), 'No strongbox before the winch');
    walk(TO_PUMP); press('hold-pump'); assert.ok(has('lever:hold-pump'), 'The key opens the padlock and the pump drains the bilge');
    walk(TO_WINCH); press('hold-winch'); assert.ok(has('winch:up'), 'The drained hold frees the winch');
    press('strongbox'); assert.ok(has('open:strongbox') && has('shard:wreck'), 'The strongbox comes up with the shard');
    for (const flag of ['shard:lookout', 'shard:cave', 'used:altar']) assert.ok(!has(flag), `The wreck alone never grants ${flag}`);
    console.log(`wreck-journey ${JSON.stringify({ fightTicks, clicks, shardTick: host.state.tick, elapsedMs: Math.round(performance.now() - started) })}`);
  } finally { resident.dispose(); }
});
