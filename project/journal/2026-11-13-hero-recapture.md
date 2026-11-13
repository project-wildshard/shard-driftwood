# Driftwood hero recapture

- opus-shardred-a: `ring-2-cook` went red at `43dbea9` because `hero.json`'s
  stamp (00:37 UTC, stamp-existing) named content from before `cee2d10`
  (format v0.4.6) and `44c2bcd` (imports from shard-format) changed
  `generators/`. Code moves, no visible change, but `wildshard pack`
  refuses moved content and stamp-existing will not re-stamp it.
- Recaptured with `wildshard hero` from the spawn view (no declared
  camera): the pier walking in to the beach. The old card was curated
  art (singleplayer `art/hero-images/round-5-stage-band/driftwood-isle`,
  beach from offshore), which the one-camera capture cannot reproduce;
  the new card is the spawn shot.
- Served as `sharddev`'s `_template` journal says: a detached engine
  worktree at `b53de789` (origin/main), `pnpm pins`, its
  `out/driftwood-isle` replaced by this candidate's `pnpm build:shards`
  output from a clean copy of `ef06513`, `validation.json` `revision` set
  to the engine's `shardfileValidationRevision`,
  `WILDSHARD_PREPARATION_ONLY=1` `build-app.mjs` under `heavy-lane.py`,
  served by `preview-server.mjs` on 127.0.0.1:4853.
