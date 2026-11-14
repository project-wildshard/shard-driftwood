// J186 Ring 2, CI only, never a hook. The zipline (SH-drift-1's cable leg) on the built output: from the pier past
// Wendell's hut and over the headland to the launch deck, [E] there, then the ride down the cable to its foot on the
// beach north of Wreck Cove, and a walk on from where it lets go into the cove. Only what the page sends drives it:
// movement and the [E] press the prompt's net route names. No flag, ride state or pose is written. About 4,500 ticks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import spots from '../../src/data/spotsRows.json' with { type: 'json' };
import { boot, rider } from './journey-rider.mjs';
import { TO_CASTAWAY, TO_COVE, TO_HEADLAND, TO_ZIPLINE } from './island-legs.mjs';

// The authored cable's floor ends; the ride is read against their straight line, as a player sees the wire.
const { top, bottom, prompt } = spots.zipline;
const fx = bottom.x - top.x, fz = bottom.z - top.z, span = Math.hypot(fx, fz);
const along = at => ((at.x - top.x) * fx + (at.z - top.z) * fz) / span;
const offLine = at => Math.abs((at.x - top.x) * fz - (at.z - top.z) * fx) / span;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('driftwood-isle: the zipline carries the player down to the beach', { timeout: 30_000 }, async () => {
  const started = performance.now(), { resident } = await boot();
  try {
    const { host, player, head, walk, press, has } = rider(resident);
    const still = ticks => { for (let tick = 0; tick < ticks; tick++) head(0, 0); };
    walk(TO_CASTAWAY); walk(TO_HEADLAND); still(30);
    const foot = player.position.clone();
    press('zipline'); still(60);
    assert.ok(flat(player.position, foot) < 0.5 && !has('used:zipline'), 'The cable cannot be taken from the lookout\'s foot');

    walk(TO_ZIPLINE);
    assert.ok(flat(player.position, prompt) < prompt.radius, `The launch deck is in the prompt's reach: ${flat(player.position, prompt)}`);
    assert.equal(player.motor.snapshot().result.grounded, true, 'The player stands on the launch deck');
    assert.ok(!has('used:zipline'), 'Nothing is ridden before the press');
    const deckTick = host.state.tick, deckY = player.position.y;
    press('zipline');

    // Ride on still frames until the cable lets go: along the wire, a tick at a time, always downhill, the end flag
    // only at the foot.
    let lowest = Infinity, widest = 0, rideTicks = 0, midTicks = 0, longestStep = 0;
    for (; rideTicks < 900 && !has('used:zipline'); rideTicks++) {
      const before = player.position.clone();
      head(0, 0);
      const at = player.position;
      widest = Math.max(widest, offLine(at)); longestStep = Math.max(longestStep, at.distanceTo(before));
      if (along(at) > 5 && along(at) < span - 5) midTicks++;
      if (along(at) > 1) { assert.ok(at.y <= lowest + 0.05, `The ride never climbs: ${at.y} after ${lowest}`); lowest = Math.min(lowest, at.y); }
    }
    assert.ok(has('used:zipline'), `The ride ends with the cable's end flag: ${JSON.stringify(player.position)}`);
    assert.ok(midTicks > 100 && longestStep < 0.6, `The cable carries the player down its span, no teleport: ${midTicks} ticks mid-span, longest step ${longestStep} m`);
    assert.ok(widest < 0.6, `The rider stays under the wire: ${widest} m off its line`);
    assert.ok(along(player.position) > span - 2 && flat(player.position, bottom) < 2, `It lets go at the cable's foot: ${JSON.stringify(player.position)}`);

    still(30);
    assert.ok(player.position.y < bottom.y + 1 && deckY - player.position.y > 30, `The ride comes down off the headland: ${deckY} to ${player.position.y}`);
    assert.equal(player.motor.snapshot().result.grounded, true, 'The player lands on the beach');
    assert.ok(player.actor().alive, 'The player survives the ride');
    const landed = player.position.clone();
    press('zipline'); still(60);
    assert.ok(Math.abs(player.position.y - landed.y) < 0.5 && flat(player.position, landed) < 1, 'The prompt is the deck\'s alone: [E] at the foot rides nothing');
    walk([[128, 4], ...TO_COVE.slice(-3)]);
    console.log(`zipline-journey ${JSON.stringify({ deckTick, rideTicks, midTicks, longestStep: Number(longestStep.toFixed(3)), widest: Number(widest.toFixed(3)), endTick: host.state.tick,
      elapsedMs: Math.round(performance.now() - started) })}`);
  } finally { resident.dispose(); }
});
