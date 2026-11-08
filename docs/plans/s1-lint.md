# S1 byte-preserving lint debt

**Status:** in progress (2026-11-08): both real arm-baker counts
remain; a defining SDK arm-rig API is required.

Baseline: 9dd8f13f85fe7397c339f3e5254eafcce1744573.
The zero-allowance AST census confirms one shard-game-imports and
one shard-game-plugins count in the same file:

| File | Counts | Open boundary |
| --- | ---: | --- |
| blender/fp-arms/bake.mjs | 2 | game/systems/viewmodel/armRig |

This offline baker imports armConst, buildBones, measure, twoBone,
LEFT_HAND and RIGHT_HAND. The pinned sharddev v0.1.0 exports none of
these arm-rig operations. Its riderArms helpers construct different
geometry and cannot replace the rig/IK/measurement contract.
Do not duplicate engine rig source in the shard, hide a dynamic
import or rewrite rig behavior merely to lower a lint ceiling.

This row is not claimed to be a map-input byte blocker: blender/
is outside the default map roots. It needs an SDK API/release and
its own baker-output parity proof, outside this shard-only cleanup.
No new SDK release or dependency bump was attempted.

Fresh before/after pnpm build:shards outputs match every path and
byte: 534 files, 125443104 bytes. Map, packs, index
and validation are included. No source, rule or ceiling changes.

Acceptance: expose the defining owned arm-rig author operation in a
separately authorized SDK release, migrate this baker, prove its
actual arm GLB and shard products unchanged, then retire both counts.
