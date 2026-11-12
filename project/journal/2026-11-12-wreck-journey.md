# Wreck journey on real inputs (meta BUILD-MAX DRF-2)

- `test/ci/wreck-journey.test.mjs` earns the Wreck glyph shard from the shard spawn. It is the second leg of
  SH-drift-3, the sailor fight. The shrine and the captain are left; both need all three shards first.
- The walk takes the Sea Cave journey's road to Wreck Cove, then the `wreck` walk route down the hatch ramp and the
  hold stair. The sailor stays sunk while the player is on the beach and rises as the player comes down.
- The fight: the player closes on him at a walk and clicks once every half second while he is within 1.5 m. Each
  click is the page's attack frame on the locked sailor, `attack: { targetId }`, now `strike` in the shared
  `journey-rider.mjs`. He goes down in about 970 ticks and 30 clicks; the player survives. His position is only
  read, to steer and aim by.
- After the fight: his key, the bilge pump, the cargo winch and the strongbox. About 4,300 ticks, about 3 s locally,
  the same count each run.
- Refusals checked, each pressed from the spot the same press later succeeds from, so the rule refuses and not
  reach: no key while he stands, the pump padlocked without the key, the winch jammed before the pump, and no
  strongbox before the winch. The wreck grants no other shard and doesn't use
  the altar.
- The engine's damage book records no melee hits from this path (`host.damage.dealt` stays 0), so the test checks the
  sailor is unhurt before the first click and dead after the clicks instead.
