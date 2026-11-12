# Zipline journey on real inputs (meta TEST-COVERAGE SH-drift-1)

- `test/ci/zipline-journey.test.mjs` closes SH-drift-1's cable leg: from the pier past the hut and over the headland
  to the zipline's launch deck, one [E] press, the ride down to the beach, then a walk on into Wreck Cove (about
  4,500 ticks, a few seconds locally). Only movement frames and the prompt's net route drive it.
- The ride is read against the authored cable (`spotsRows.json` `zipline`): it stays on the wire's line (0 m off),
  never climbs once off the deck, moves at most 0.26 m a tick, spends about 200 ticks mid-span, takes 279 ticks, and raises `used:zipline` only when it lets go at the foot.
- Refusals: [E] from the lookout's foot does not start it, and [E] at the foot rides nothing: the prompt is the deck's alone.
- The deck is stepped onto from the north-west (ground 0.3 m under it). Its back edge stands 0.6 m proud and its west
  slope is too steep, so a walk straight from the lookout's foot only gets on by luck: two of four arrival offsets
  failed there. `TO_ZIPLINE` in `test/ci/island-legs.mjs` goes by (112, 59.2); six offsets of up to 0.4 m pass.
- Renaming the cable's end flag in `modes.ts`, or closing its prompt route in `questHost.ts`, fails the run.
