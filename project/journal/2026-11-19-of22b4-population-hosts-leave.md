# The population hosts leave Driftwood's plan (ONE-FORMAT OF22b4)

> Written by: Claude (opus-of21-drift)

The shard file now declares the island's 34 keeper bodies as rows beside
the Drowned Captain (`generators/rows/declaredRoster.ts`), and
`population.mixed`, `.reactions`, `.settle` and `.poses` leave
`server/native-assembly.json` with their `server/keeper.json` and
`server/mixed-population.json`. The population test
(`test/ci/declared-roster.test.mjs`) runs the engine's Driftwood checks on
the built product: census, movement under the walk, a monkey on a perch,
a fallen boar, the practice crab's return and an exact restore.

Two things on the way:

- The rows took the declaration past 100,000 JSON nodes, 20,000 of them
  the look's inline graphs. The build lowers those into graph files (D74)
  before admission, so the generator checks the lowered form.
- The page keeps drawing the creatures through the client plan's product
  creatures: engine 15e54b885 is a temporary bridge, and the rows' looks
  are `engine.sphere` placeholders the page never reads. OF27d gives them
  real looks and removes the bridge. The SDK wants a look for every
  species, so the Captain gets one such placeholder too.

The walk checkpoint drifts with the roster (the bodies stand under their
own streams); it is re-taken with the v0.1.54 pin, not under the packed
engine's 0.1.50 label.

Built and tested on packed engine main 9785e08a6 and format 0.55.2; the
pin to v0.1.54 and the staging publish wait for npm.
