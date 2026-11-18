# Driftwood Phone Low lightmap and ocean budget

> Written by: Codex

> **State:** verified in local source builds, 2026-11-18 (MG11, J410).

Ship the phone cove AO at 512 square, using the existing 512 mip as
the top level of its GPU texture. The Blender post step writes the
desktop AO at 2048 and writes both phone lightmaps at 512. Sky and
horizon assets keep their existing files.

Use 16-bit ocean indices when the vertex count fits. The decoded
phone indices occupy 424,128 bytes, down from 848,256. Positions,
depth, wave seeds and all 212,064 index values compare byte for value.
The WebKit texture ledger at spawn shows a 4,194,304-byte AO cut.
Both the nine-view Phone Low board and all 55 shard tests passed.
