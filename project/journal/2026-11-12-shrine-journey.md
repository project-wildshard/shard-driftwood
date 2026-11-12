# Shrine journey on real inputs (meta BUILD-MAX DRF-2)

- `test/ci/shrine-journey.test.mjs` closes SH-drift-3's last two legs, the shrine altar and the Drowned Captain, in
  one run from the shard spawn on page inputs only (about 19,900 ticks, about 4.5 s locally).
- Order: the Sea Cave first, on the cave journey's exact inputs up to the shove. The barrel's roll is chaotic: reached
  from another route with the player 7 mm off, it wedged west of plate B for good. Then the Wreck, the shrine with two
  shards (refused), the Lookout by the hut, and the shrine again.
- The altar is pressed both times from the same spot, so the two-shard refusal is the three-shard rule, not reach.
  The `shrine` walk route ends 0.6 m short of the altar's reach; `TO_ALTAR` is one step on toward the monolith.
- No captain exists before `used:altar`. He rises from the pool at full health (320) and falls to about 37 clicks
  in about 1,300 ticks; the player survives.
- Routes the other way needed two detours: up from the creek to the hut front (a hut-side post at (-16, -68)) and
  down the headland trail (a plank step at (81.3, 79.3)).
- The shared routes, the barrel shove and the fight loop move to `test/ci/island-legs.mjs`; the Lookout, Cave and
  Wreck journeys import them, with the same tick counts.
- Breaking the altar rule on purpose (a fourth needed flag in `questGraph.ts`) fails the run at the altar.
