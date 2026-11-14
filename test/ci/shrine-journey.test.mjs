// J186 Ring 2, CI only, never a hook. The Ring Shrine (SH-drift-3, third and fourth legs) on the built output: all
// three glyph shards earned in one run, as the Sea Cave, Wreck and Lookout journeys earn them, set in the shrine's
// altar, and the Drowned Captain who rises from its pool beaten by the player's clicks. The altar is first tried with
// two shards (Sea Cave and Wreck) from the spot it later takes all three from, so it is the three-shard rule refusing,
// not reach; then by the hut to the Lookout for the third and up the shrine stair again. Only what the page sends
// drives it: movement frames, the attack a click on the locked foe sends, and the [E] press each prompt's net route
// names. Bodies are read to steer and aim by, never written. No flag, quest or pose is written. About 20,000 ticks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boot, rider } from './journey-rider.mjs';
import {
  back, BARREL_TO_PLATE_A, beat, findBarrel, findSailor, GATE_TO_PLATE_A, INTO_CAVE, INTO_HOLD, PLATE_A_TO_BARREL, SHRINE_STAIR,
  shoveBarrel, STAIR, TO_ALTAR, TO_CASTAWAY, TO_CHEST, TO_COVE, TO_GATE, TO_HEADLAND, TO_KEY, TO_PUMP, TO_SHRINE, TO_WINCH,
} from './island-legs.mjs';

/** A route up to and including the point it passes at (x, z). */
const until = (route, [x, z]) => { const at = route.findIndex(([px, pz]) => px === x && pz === z); assert.ok(at >= 0, `The route passes ${x}, ${z}`); return route.slice(0, at + 1); };
// Out of the cave past the driftwood piles to the hatch ramp's foot (INTO_HOLD's first point); out of the hold to the
// cove's mouth, and back along the shore to the creek (TO_COVE the other way).
const CAVE_TO_HATCH = [...back(TO_GATE), [145.17, -0.15]], HOLD_TO_COVE = [...back(INTO_HOLD), [145.6, 0.8], [142, -4]];
// Up from the creek the walk keeps east of the straight line to the hut front (a hut-side post stops it at (-16, -68)).
const UP_TO_HUT = [[-6, -58], [-16, -74], [-22, -76]], COVE_TO_HUT = [...until(back(TO_COVE), [0, -40]), ...UP_TO_HUT];
// Down the headland the other way, a few metres south of the plank trail to (66, 66): straight down the trail the walk
// snags on its steps and fence posts ((81.3, 79.3), (77.5, 75.3)) as soon as it arrives a few centimetres off.
const HEADLAND_TO_CREEK = [[86.1, 82.45], [86, 79], [80, 74], [72, 70], ...until(back(TO_HEADLAND), [0, -40]).slice(2)];
const SHARDS = ['shard:lookout', 'shard:cave', 'shard:wreck'];

test('driftwood-isle: the glyph shards set in the altar and the Captain beaten on real inputs', { timeout: 90_000 }, async () => {
  const started = performance.now(), { shard, resident } = await boot();
  try {
    const legs = rider(resident), { host, player, head, walk, press, has } = legs;
    const stand = ticks => { for (let tick = 0; tick < ticks; tick++) head(0, 0); };
    const toAltar = () => { walk(TO_SHRINE); walk(SHRINE_STAIR); walk(TO_ALTAR); };
    const captain = () => [...host.entities].find(([, body]) => body.kind === 'captain') ?? [];
    assert.ok(Math.hypot(player.position.x - shard.spawn.x, player.position.z - shard.spawn.z) < 0.5, 'The journey starts at the shard spawn');
    const [sailorId, sailor] = findSailor(host);
    assert.ok(sailor?.alive, 'The drowned sailor lies in the hold');

    // The Sea Cave first, on the cave journey's own inputs up to the shove (the barrel's roll is chaotic, so the run
    // reaches it in the state that journey proves): the shut gate, one plate, the barrel, both plates, the alcove.
    walk(TO_COVE); walk(TO_GATE); press('shard-cave'); press('sluice'); for (let tick = 0; tick < 120; tick++) head(0, 1);
    walk(GATE_TO_PLATE_A); stand(10); walk(PLATE_A_TO_BARREL); stand(10);
    const barrel = findBarrel(host); assert.ok(barrel, 'The tide barrel lies where it washed up');
    const pushTicks = shoveBarrel(legs, barrel);
    stand(10); walk(BARREL_TO_PLATE_A); stand(10); walk(INTO_CAVE); press('shard-cave');
    assert.ok(has('shard:cave'), 'The Sea Cave shard is taken from the alcove');
    const caveTick = host.state.tick;

    // The Wreck: out of the cave and into the hold, the sailor, his key, the pump, the winch, the strongbox.
    walk(CAVE_TO_HATCH); walk(INTO_HOLD);
    assert.equal(sailor.hp, sailor.maxHp, 'The sailor is unhurt before the first click');
    const sailorFight = beat(legs, sailorId, sailor, 'dead:sailor');
    walk(TO_KEY); press('hold-key'); walk(TO_PUMP); press('hold-pump'); walk(TO_WINCH); press('hold-winch'); press('strongbox');
    assert.ok(has('shard:wreck'), 'The strongbox comes up with the Wreck shard');
    const wreckTick = host.state.tick;

    // Two shards to the shrine: the altar keeps its third socket empty, and the pool stays still.
    walk(HOLD_TO_COVE); walk(COVE_TO_HUT); toAltar(); press('altar');
    assert.ok(!has('used:altar') && !has('quest:shrine-set'), 'Two shards do not wake the altar');
    assert.ok(has('shard:cave') && has('shard:wreck') && !has('shard:lookout'), 'The refused altar keeps the two shards');
    stand(60); assert.equal(captain().length, 0, 'No captain rises while the altar is unset');
    const refusedAt = { x: player.position.x, z: player.position.z };

    // The Lookout: down to the hut, Wendell, his chest's flint, the headland and the beacon, and back to the hut.
    walk(back(SHRINE_STAIR)); walk(back(TO_SHRINE)); walk(TO_CASTAWAY.slice(-2));
    press('castaway.talk'); walk(TO_CHEST); press('castaway-chest');
    walk(TO_HEADLAND); walk(STAIR); press('beacon'); press('shard-lookout');
    assert.ok(has('shard:lookout'), 'The Lookout shard rises out of the beacon');
    const lookoutTick = host.state.tick;

    // All three to the shrine: the same spot, the same press.
    walk(back(STAIR)); walk(HEADLAND_TO_CREEK); walk(UP_TO_HUT); toAltar();
    assert.ok(Math.hypot(player.position.x - refusedAt.x, player.position.z - refusedAt.z) < 0.5, 'The altar is pressed from where it refused');
    for (const flag of SHARDS) assert.ok(has(flag), `The altar is pressed holding ${flag}`);
    press('altar');
    assert.ok(has('used:altar') && has('quest:shrine-set'), 'The three shards lock into the altar and the ring wakes');
    const altarTick = host.state.tick;

    // The Drowned Captain rises out of the shrine's pool and falls to the player's clicks.
    const [captainId, foe] = captain();
    assert.ok(foe?.alive && foe.hp === foe.maxHp, 'The Captain rises from the pool, unhurt, once the altar is set');
    assert.ok(!has('dead:captain'), 'The Captain is not beaten before the first click');
    const captainFight = beat(legs, captainId, foe, 'dead:captain', 6000);
    console.log(`shrine-journey ${JSON.stringify({ pushTicks, caveTick, sailorFight, wreckTick, lookoutTick, altarTick, captainFight,
      captainTick: host.state.tick, elapsedMs: Math.round(performance.now() - started) })}`);
  } finally { resident.dispose(); }
});
