# Cut Driftwood Isle to the 1.0 GB phone envelope

> Written by: Claude (lane mini-zonemem)

> **State:** draft, 2026-11-17. One cut row, unclaimed. Opened by meta
> `docs/plans/MEMORY-GATES-PLAN.md` MG11 (J410, Jake 2026-11-17 ~17:05
> Cancún: *"all the zones should be optimized for memory"*). The
> phone's target is engine `PHONE_PLAYING_BYTES`, 1.0 GB; J408's
> 1.5 GB refusal is only the safety net.

## Measured (2026-11-17, Mac mini)

Product: the pinned revision 4 (source `4fa47752`), which engine
`test/pins/shardfiles.json` ships. A local build at `371b391` has the
same estimate.

| Instrument | Reading |
| --- | --- |
| Epoch-2 estimate (format main `52f184e`) | worst loading 1,484 MB, playing 1,396 MB |
| `wildshard memory`, v0.1.36 client, Low, 2 runs | Chromium renderer + GPU 1,460 / 1,451 MB |
| Loading renderer peak x2.0 (engine `3cd2dd87`) | **1,604 MB predicted phone peak** |
| iOS Simulator Safari, boot / after 2 min | WebContent 0.853 / 0.893 GB + GPU 0.178 GB |

The predicted peak is over the 1.5 GB refusal line and the estimate
(1,484 MB) sits 16 MB under it.

## Top allocations

- **JS heap during the load:** 369 MB peak inside an 802 MB renderer
  (`finish`/`firstFrame`). Live JS heap at ready is 89 MB.
- **Native resident reading:** 284 MB (`progress/memory/
  dw-g258-2026-10-15`), plus 168 MB shader compile and 68 MB held
  spawn parts in the boot charge.
- **Scene at ready:** 46 MB geometry arrays, 1 MB textures (11).
- **Files, decoded, phone tiers:** image 104 MB, glb 83 MB. Largest:
  `world/island/lm-ao.webp` 18.7 MB, `models/foliage/
  hibiscus-desktop.glb` 9.6 MB (a desktop model counted on the phone
  tier), `ui/images/horizon-{day,night}` 9 MB each, and look-loop
  comparison images shipped as UI (`ui/images/compare-*`, 7 to 9 MB
  each).

## Rows

| Row | Work | Done when |
| --- | --- | --- |
| DM1 | Cut the shipped extras and the load transient. Drop the `compare-*` images if nothing in play shows them; keep `hibiscus-desktop.glb` off the phone tier; halve the 18.7 MB AO lightmap on phones; renew the 284 MB native reading on epoch 2 (MG5) after the cut. | `wildshard memory` on the prepared product predicts at most 1,000 MB (loading renderer x2.0) and the epoch-2 worst loading is at most 1,000 MB. Record shard and engine SHAs. Then lower the CI ratchet (MG11) to the new peak + 10%. |
