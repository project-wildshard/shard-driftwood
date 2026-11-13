# Hero stamp

> Written by: Claude (opus-herostamp), 2026-11-12

sharddev now refuses a cut whose hero (the SHARD SELECT card) is older
than the shard's content, by a `hero.json` stamp beside the manifest.
This repo's heroes came with the lift on 2026-11-07 and had no stamp, so
the pin bump would have refused the next cut, and recapturing from the
spawn view would have put a plain shot over the curated art.

The commits since the heroes were made are mount and fallback fixes, not
changes to what the island looks like, so the existing heroes are stamped
as current with `wildshard hero src/shards/driftwood-isle
--stamp-existing`. The next real content change needs a capture:
`wildshard hero src/shards/driftwood-isle --base <served-build-url>`.

sharddev main needs shardfile `0786a04` (`featureSides`), so the format
pin and its override move with it, to sharddev's own pair.

The first push kept engine `80d5cc0`, and Ring 2's owned journey failed
("Native body scripts require admitted ground"): the old engine cannot
play a product the new sharddev builds. Engine moves to `867f3b9`, the
engine sharddev pins, and every Ring 2 step passes locally.

The engine's `packageExtensions` entry named `@wildshard/engine@0.1.2`, so
the new engine (0.1.13) lost its `vite` and the lint plugin could not
load; the selector now names the package, as sharddev's does.
