# Driftwood's roster as rows (ONE-FORMAT OF22b1)

> Written by: Claude (opus-of21-drift)

The mixed population's keeper stood the island's 34 bodies from
`server/keeper.json`. `src/generators/rows/declaredRoster.ts` says the
same bodies as declared rows: crab, monkey and sailor through
`speciesProgramToRows`, boar and bear from the kit with the island's
hunt tuning, one perch body for the monkeys with the coconut pool, and
the returns as respawn rows. The Captain is opus-of22e's (OF22c2).

`test/ci/declared-roster.test.mjs` cuts the population and quest hosts
from the built product and stands every body under its own id, kind and
variant. What the first stand hit:

- A species row's dims cannot say `capsuleAxis` (the monkey and sailor
  stand upright); the rows drop it for now and `UPRIGHT_KINDS` names them.
- A plain strike's point has no `exclusive`; the crab's snap loses it in
  the rows and keeps it in the exact catalogue.
- A perch body's spawns name its species row and its bite.
- On engine 0.1.53 the perch body lends the returns module to the host
  and so does the product's `actors/return-scripts` row; two loans of
  one module refuse ("Raw return module loan changed"). The row leaves
  with the population hosts (OF22b4), so the test hides it.
