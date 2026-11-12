# Sea Cave journey on real inputs (meta BUILD-MAX DRF-2)

- `test/ci/cave-journey.test.mjs` earns the Sea Cave glyph shard from the shard spawn. It is the first leg of
  SH-drift-3, picked because it is the shortest of the four left: no fight and no other shard first. The wreck needs
  the drowned sailor beaten, and the shrine and the captain need all three shards.
- The walk crosses the plateau, goes down to the creek and runs east along the shore to Wreck Cove. It goes round the
  driftwood piles to the shut tide gate, stands on one plate alone, and shoves the barrel onto the other. Then it steps
  back onto the first plate, walks through the latched gate and takes the shard. About 4,600 ticks, 1.7 s locally.
- Refusals checked: the shard can't be taken through the shut gate, the gate doesn't open by hand, it holds the
  player out, and one plate alone or the barrel alone doesn't lift it. The cave grants no other shard and doesn't use
  the altar.
- The barrel is pushed only by the player's body. The test reads its position to steer by, the way a player sees it,
  and never writes it. A straight shove from where it washed up drifts west and can wedge on the piles near x 143.
  So the push goes by a point east of the line, (146.3, 7.6), and needs the player well lined up behind it. Seven
  different start positions all reached the plate.
- The headless rider (boot, walk, press) moved to `test/ci/journey-rider.mjs`, shared with the Lookout journey. The
  Lookout journey's tick count is unchanged (3,720).
