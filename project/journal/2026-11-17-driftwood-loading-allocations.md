# Driftwood loading-renderer allocations

> Written by: Codex
> **State:** Measured 2026-11-17 for MEMORY-GATES MG11. Driftwood's 1.0 GB row stays open.

Driftwood product `4fa47752` ran against preparation client `4a7ba050`,
also used for Pine, Sky Reach and Template. Headless Chromium used phone
Low, a 402 × 874 viewport, DPR 3 and no service worker. The survey reached
838 MB of native renderer footprint. The profile captured the loading
ledger, one allocation sample and one heap snapshot at `readyFrame`,
5.262 s after navigation, at 799 MB of renderer footprint. That capture
corresponds to 1.598 GB with the existing renderer ×2 calibration and
reached player control. The main isolate had 102 MB of JS in use and
213 MB of backing storage before the snapshot.

All sizes are decimal MB. The buckets overlap across instruments. The
heap snapshot reports retained bytes after collection. The 16 KiB V8
sample estimates cumulative allocations, including collected objects.
The native allocator survey's most complete loading dump was at
689 MB of renderer footprint, below the profile trigger.

| Bucket over 50 MB | MB | Owner and evidence |
| --- | ---: | --- |
| Native PartitionAlloc | 274 | Chromium and shared engine buffer lifetimes. Its ArrayBuffer partition accounts for 204 MB of allocated objects. |
| Native V8 main and workers | 171 / 118 | Shared engine and Chromium. Main old space 72 MB, main new space 64 MB, worker new space 68 MB. The dump cannot attribute the worker space to an asset. |
| Native malloc | 104 | Chromium and shared engine. 69 MB of allocated objects. No asset labels in this meter. |
| Native WebGL | 70 | Shared WebGL implementation with Driftwood draw inputs. Buffers account for 60 MB. |
| Snapshot ArrayBuffer backing stores | 186 | Mixed residency, controlled by engine lifetimes. Geometry edges reach 122 MB, split across 2,054 backing stores. The 108 MB without names spans 1,946 stores. The separately identifiable product wire cache is 22 MB. |
| Snapshot JS objects and code | 80 | Shared engine and V8. Includes objects, arrays, compiled code and strings. |
| Loading ledger RAM ArrayBuffers | 79 | Mixed. The Driftwood product cache accounts for 25.6 MB. Other views have separate scene and engine owners. |
| Loading ledger GPU textures | 79 | Mixed. Shared render targets use 45.4 MB, including five 2,048² depth textures. Driftwood's painted horizon uses 22.4 MB. |
| Loading ledger GPU buffers | 59 | Mixed. Driftwood ground cover uses 12.0 MB. Shared scene and individual asset groups account for the rest. |
| Sampled Three allocations | 154 | Shared renderer and model intake. Three core and WebGL account for 115 and 22 MB, and other Three modules for 17 MB. |
| Sampled format and schema allocations | 147 | Shared intake, including 63 MB in Valibot. |
| Sampled `ownedGeometry.ts` | 63 | Shared engine. The leading `dequantizeIntoSpace` stacks allocate converted arrays while preparing draw geometry. |

The largest identifiable content groups were the horizon at 39.1 MB
across decoded images and GPU textures, the product wire cache at
25.6 MB, and ground cover at 23.8 MB across CPU and GPU. The sample
estimated 686 MB of cumulative allocation. Its mapped allocation sites
were shared code and dependencies. No isolated Driftwood-owned bucket
crossed 50 MB. The 122 MB of retained geometry is an engine lifetime
lead, with the original asset ownership unresolved for most stores.
The source and Low presentation took no cut from this census.

The Mac mini evidence is under
`~/.cache/wildshard/plan-artifacts/memory-gates/zone-loading-peaks-2026-11-17/driftwood-isle`.
The allocation receipt is addressed to mini-ninemem2 and mini-memplan.
