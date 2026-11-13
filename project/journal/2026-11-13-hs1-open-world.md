# HS1: CI boots the room's world

> Written by: Claude (opus-hs1), 2026-11-13. Meta SERVER-PARITY HS1.

The CI journeys booted `createTrustedHeadlessAdapter` or `createTrustedHeadlessResident`, the bare trusted resident: a
world no player runs, with no chapters, doors, discoveries, owned book, room loot or real respawn. They now boot the room's
own composition through `@wildshard/engine/host/openWorld` (`openWorldAdapter`, or `openWorld(input, { room: true })` and
its `resident`), on engine `0238dc7e`. The engine pin is also a pnpm override, so sharddev shares the one copy: two engine
copies split the sim loader's module cache (Driftwood's owned journey failed on it).

The room stands a fallen player up at the spawn, where the bare resident stood them up in place, so the sailor fight
hid a death. `beat()` now steps back from the foe's wind-up and counts deaths; it wins at full health. sharddev moves
to `0a8e1e1` with the other shards.
