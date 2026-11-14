// J186 Ring 2, CI only, never a hook. The Wreck glyph shard (SH-drift-3, second leg) on the built output: from the pier
// over the plateau and east along the shore to Wreck Cove, down the hatch ramp into the hold, the drowned sailor risen
// and beaten by the player's own clicks, his hold key, the bilge pump, the cargo winch and the captain's strongbox.
// Only what the page sends drives it: movement frames, the attack a click on the locked sailor sends, and the [E] press
// each prompt's net route names. The sailor's position is read to steer by, never written. No flag, quest or pose is
// written. About 4,300 ticks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boot, rider } from './journey-rider.mjs';
import { beat, findSailor, INTO_HOLD, TO_COVE, TO_KEY, TO_PUMP, TO_WINCH } from './island-legs.mjs';

test('driftwood-isle: the Wreck glyph shard earned on real inputs', { timeout: 30_000 }, async () => {
  const started = performance.now(), { shard, resident } = await boot();
  try {
    const legs = rider(resident), { host, player, walk, press, has } = legs;
    assert.ok(Math.hypot(player.position.x - shard.spawn.x, player.position.z - shard.spawn.z) < 0.5, 'The journey starts at the shard spawn');
    // The sailor the page draws; only read here, to steer and aim by, as a player does by what they see.
    const [sailorId, sailor] = findSailor(host);
    assert.ok(sailor?.alive, 'The drowned sailor lies in the hold');
    walk(TO_COVE);
    assert.ok(sailor.position.y < 0, `The sailor stays sunk while the player is on the beach: ${sailor.position.y}`);
    walk(INTO_HOLD);
    // Each refusal is pressed from the spot the same press succeeds from later, so it is the rule refusing, not reach.
    walk(TO_KEY); press('hold-key'); assert.ok(!has('key:hold'), 'The key is not there while the sailor stands');
    walk(TO_PUMP); press('hold-pump'); assert.ok(!has('lever:hold-pump'), 'The bilge pump stays padlocked without the key');

    assert.equal(sailor.hp, sailor.maxHp, 'The sailor is unhurt before the first click');
    const { fightTicks, clicks } = beat(legs, sailorId, sailor, 'dead:sailor');

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
