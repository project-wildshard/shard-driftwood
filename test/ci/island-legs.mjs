// The routes and the two hands-on moves the glyph-shard journeys share (SH-drift-3): the pier to the castaway, the
// headland and Wreck Cove, the shove that rolls the tide barrel onto its plate, and the fights.
// Every move is only what the page sends (journey-rider.mjs): movement frames and clicks. Bodies are read to steer and
// aim by, as a player does by what they see, never written.
import assert from 'node:assert/strict';

/** Back over a route the way it came: the same points, last to first. */
export const back = route => [...route].reverse();

// The pier and the plateau ramp to the castaway (content-tapes.json), then into the hut to his chest.
export const TO_CASTAWAY = [[0, -186.5], [-8, -172], [-17, -161], [-20, -150], [-30, -142], [-30, -130], [-30, -118], [-30, -106], [-30, -104],
  [-24, -80], [-22, -74], [-22, -71.5]];
export const TO_CHEST = [[-22, -68.9], [-22, -67.6], [-22, -66.7], [-22, -65.2], [-22, -62.9]];
// Out of the hut and down to the creek, by the hut path east of Wendell, who has a body since SERVER-PARITY SS10b. The rope bridge has no server deck (NL5), so the walk rounds the gully's
// south-east end, climbs its far bank and joins the headland's plank trail (GRADED path 2) to the lookout's foot.
export const TO_HEADLAND = [[-22, -71.5], [-22, -76], [-16, -74], [-6, -58], [0, -40], [15.6, -7], [20, -3], [46, -3], [46, 8], [47, 16], [47, 24], [45, 26], [42, 25],
  [36, 27], [34, 30], [35, 34], [37.5, 36], [40, 39], [46, 46], [56, 56], [66, 66], [76, 76], [86.1, 82.45]];
// The lookout stair to the platform (walk-routes.json `lookout`).
export const STAIR = [[86.94, 83.68], [87.68, 84.76], [90.27, 88.55], [92.76, 92.18], [93.44, 93.17], [94.17, 94.25]];

// From the lookout's foot south-east over the headland to the zipline's launch deck, 1.8 m back up the slope from the
// cable's top (spotsRows.json `zipline`, laid out as the engine's CableLayout lays it); the deck is in the prompt's reach.
// It is stepped onto from the north-west, where the ground is 0.3 m under it: its back edge stands 0.6 m proud and the
// west slope is too steep to climb. Six arrival offsets of up to 0.4 m on the first two points pass.
export const TO_ZIPLINE = [[101, 70.5], [112, 59.2], [116.23, 58.33]];

// The pier and the plateau ramp (content-tapes.json), down to the creek as the Lookout journey goes, then east along
// the shore past the crabs' sand to Wreck Cove, south of the driftwood piles.
export const TO_COVE = [[0, -186.5], [-8, -172], [-17, -161], [-20, -150], [-30, -142], [-30, -130], [-30, -118], [-30, -106], [-30, -104],
  [-24, -80], [-22, -76], [-16, -74], [-6, -58], [0, -40], [15.6, -7], [20, -3], [46, -3], [58, 2], [80, 1], [100, 1], [120, 0], [128, -6], [136, -6], [142, -4]];

// Round the driftwood piles to the shut sluice (walk-routes.json `cave`), and back out.
export const TO_GATE = [[145.6, 0.8], [146.4, 6], [146.2, 10.2], [144.75, 12.95], [142.6, 14.4], [142, 16], [142, 17.5], [142, 19.25]];
export const GATE_TO_PLATE_A = [[142, 17.5], [142, 16], [140, 12], [139.1, 10]];
export const PLATE_A_TO_BARREL = [[140, 12], [144.75, 12.95], [146.2, 10.2], [146.4, 6], [145.6, 0.8], [149, -1], [148.3, 1.9]];
export const BARREL_TO_PLATE_A = [[144.5, 6], [146.2, 10.2], [144.75, 12.95], [142.6, 14.4], [140, 12], [139.1, 10]];
export const INTO_CAVE = [[140, 12], [142.6, 14.4], [142, 16], [142, 17.5], [142, 19.25], [142, 21.2]];
// The built rows (interactables.ts): the barrel washed up at (147.5, 3.5), tide plate B at (144.9, 9.9), the gate at z 19.95.
export const BARREL_HOME = { x: 147.5, z: 3.5 }, PLATE_B = { x: 144.9, z: 9.9 }, GATE_Z = 19.95;

// The hatch ramp into the hold and the hold stair (walk-routes.json `wreck`), where the sailor rises.
export const INTO_HOLD = [[145.17, -0.15], [146.8, 0.62], [148.24, 1.3], [150.23, 2.24], [151.32, 2.75], [154.08, 2.07]];
// Over the sailor's fallen key, beside the bilge pump, then the cargo winch (the levers' wreck-frame rows in interactables.ts, a step short of each).
export const TO_KEY = [[153.8, -0.7]], TO_PUMP = [[154.56, -0.14]], TO_WINCH = [[153.92, -1.11]];
// The sailor's hold row (enemyPlacement.ts): 0.5 m starboard, 2.2 m sternward of the wreck at (153, 2).
export const SAILOR_HOME = { x: 153.49, z: -0.2 };

// From the hut's front down the plateau's west side and north up the jungle path (PATHS[3], landscapeRows.ts) to the
// shrine's causeway, then up its stair to the top terrace (walk-routes.json `shrine`) and to the altar.
export const TO_SHRINE = [[-30, -76], [-38, -60], [-45, -45], [-52, -30], [-58.6, -13.5], [-65, 3], [-72, 20], [-80, 45], [-88, 70], [-94, 88],
  [-87.5, 93.7], [-86.49, 92.26]];
export const SHRINE_STAIR = [[-88.26, 94.68], [-89.62, 96.54], [-91.51, 99.12], [-93.39, 101.7], [-93.87, 102.35], [-95.34, 104.37],
  [-96.82, 106.39], [-97.35, 107.11]];
// The stair route stops 0.6 m short of the altar's reach; one step on toward the monolith (from 107.11 the press does nothing).
export const TO_ALTAR = [[-97.8, 107.7]];

/** The tide barrel the page draws, where it washed up. */
export function findBarrel(host) {
  let barrel = null;
  host.physics.world.forEachRigidBody(body => { const at = body.translation(); if (body.isDynamic() && Math.hypot(at.x - BARREL_HOME.x, at.z - BARREL_HOME.z) < 1) barrel = body; });
  return barrel;
}

/** Walk (no sprint) into the barrel until it rests on tide plate B, as a player shoves it: line up on its far side from
 *  where it should go, then lean through its centre. It goes by a point east of the straight line, clear of the
 *  driftwood piles it would wedge on, and stop once it rests on the plate. Returns the ticks the shove took. */
export function shoveBarrel({ host, player, head, has }, barrel) {
  const pushStart = host.state.tick, BARREL_LINE = [[146.3, 7.6], [PLATE_B.x, PLATE_B.z]];
  let leg = 0;
  // Shoved at a full walk the barrel can tip onto its side and roll on past the plate (SERVER-PARITY SS10b moved the
  // contacts enough to show it), so within 3.5 m of the plate the player leans on it every other tick. The shove ends
  // once the barrel rests (30 still ticks) with the plate held; a plate the player alone holds does not count.
  let resting = 0;
  for (let tick = 0; tick < 2400 && resting < 30; tick++) {
    const at = barrel.translation(), speed = Math.hypot(barrel.linvel().x, barrel.linvel().z);
    const toPlate = Math.hypot(PLATE_B.x - at.x, PLATE_B.z - at.z);
    if (has('plate:tide-plate-b') && toPlate < 1) { resting = speed < 0.05 ? resting + 1 : 0; head(0, 0, false); continue; }
    resting = 0;
    if (toPlate < 3.5 && tick % 2 === 1) { head(0, 0, false); continue; }
    if (leg < BARREL_LINE.length - 1 && Math.hypot(BARREL_LINE[leg][0] - at.x, BARREL_LINE[leg][1] - at.z) < 0.5) leg++;
    const ux = BARREL_LINE[leg][0] - at.x, uz = BARREL_LINE[leg][1] - at.z, u = Math.hypot(ux, uz);
    const vx = at.x - player.position.x, vz = at.z - player.position.z, v = Math.hypot(vx, vz);
    if ((vx * ux + vz * uz) / (v * u) > 0.99 && v < 1.6) head(vx / v + ux / u, vz / v + uz / u, false);
    else head(at.x - ux / u * 1.5 - player.position.x, at.z - uz / u * 1.5 - player.position.z, false);
  }
  assert.ok(resting >= 30 && has('plate:tide-plate-b'), `The barrel is shoved onto the second plate: ${JSON.stringify(barrel.translation())}`);
  return host.state.tick - pushStart;
}

/** The drowned sailor the page draws, at his hold row. */
export function findSailor(host) {
  return [...host.entities].find(([, body]) => body.kind === 'sailor' && Math.hypot(body.position.x - SAILOR_HOME.x, body.position.z - SAILOR_HOME.z) < 1) ?? [];
}

/** A fight (the drowned sailor, the Drowned Captain): close on the foe at a walk, and click (one attack every half
 *  second) while it is in reach, until it falls and raises its kill flag. Returns the ticks and clicks it took. */
export function beat({ host, player, head, strike, has }, foeId, foe, deadFlag, limit = 2400) {
  const fightStart = host.state.tick;
  // A room stands a fallen player up again at the shard spawn, alive: count the deaths, so a fight lost and won again fails.
  let clicks = 0, lastClick = -Infinity, deaths = 0;
  host.events.on('player.died', () => { deaths++; }, host.scope);
  for (let tick = 0; tick < limit && foe.alive; tick++) {
    const dx = foe.position.x - player.position.x, dz = foe.position.z - player.position.z, distance = Math.hypot(dx, dz);
    // Step back out of a wind-up the player sees coming, then close in: a room (HS1's world) sends a player who dies here back
    // to the shard spawn, where the bare resident used to stand them up in place.
    if (foe.state === 'attack' && distance < 2.6) head(-dx, -dz, false);
    else if (distance > 1.5) head(dx, dz, false);
    else if (tick - lastClick >= 30) { strike(foeId, dx, dz); clicks++; lastClick = tick; }
    else head(0, 0);
  }
  assert.ok(!foe.alive && has(deadFlag), `The player beats the ${foe.kind}: ${foe.hp} hp left after ${clicks} clicks`);
  assert.ok(player.actor().alive && deaths === 0, `The player survives the ${foe.kind}: ${deaths} deaths`);
  return { fightTicks: host.state.tick - fightStart, clicks };
}
