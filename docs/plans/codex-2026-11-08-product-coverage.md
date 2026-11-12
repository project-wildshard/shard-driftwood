# Shard product coverage

> Written by: Codex

Status: in progress 2026-11-08: installed product coverage.

| Row | State |
| --- | --- |
| Installed product admission, boot, walk and save continuation | CI-only outer-edge proof; 9.5 second cap per product |
| Ring 3 candidate | Full commit dispatch overrides all engine dependency edges and runs build plus own tests |
| Cooked server play | Actual cold cook, castaway approach/talk, chest/flint and five identical resumed ticks use only hash-verified server-pack files. Ring 2: 36.18 s cook, 39.52 s case locally |
| Cook size ceiling | Open; the real cook emits manifests, without an invented wire threshold |
| Client title to play | Open: requires the installed dev-client path, not this server proof |
| Authored quest, fight and traversal tapes | Partly open. Done 2026-11-12 (meta DRF-1, SH-drift-2): `test/ci/lookout-journey.test.mjs` runs pier, Wendell, chest flint, the headland plank trail, the lookout stair, then the beacon and the Lookout shard, on page inputs only (about 3,700 ticks, 1.4 s locally). Cave done 2026-11-12 (meta DRF-2, SH-drift-3 first leg): `test/ci/cave-journey.test.mjs` walks to Wreck Cove, shoves the tide barrel onto one plate, stands on the other and takes the Sea Cave shard through the latched gate (about 4,600 ticks). Wreck done 2026-11-12 (meta DRF-2, SH-drift-3 second leg): `test/ci/wreck-journey.test.mjs` goes down into the hold, beats the drowned sailor with clicks on him, takes his key, works the pump and the winch and opens the strongbox for the Wreck shard (about 4,300 ticks). Shrine and captain done 2026-11-12 (meta DRF-2, SH-drift-3 last legs): `test/ci/shrine-journey.test.mjs` earns all three shards in one run, is refused at the altar with two, sets it with three and beats the Drowned Captain by clicks (about 19,900 ticks) |
| Rope bridge has no server deck (NL5) | Open, owned by meta NET-LAG NL5. Repro: the skipped leg in `test/ci/lookout-journey.test.mjs`. Walking the `bridge` route from (15.29, 13.29) toward (23.99, 21.99) drops the player to y −1.3 in the gully. Downward rays find no collider between the authored ends (16, 14) and (32, 30); the page has planks there. Unskip that leg when NL5 lands |
| Goldens and GPU | Existing graphical owner and Mac mini; outside this lane |

New coverage stays outside hooks under J186. Nothing uploads or deploys.
