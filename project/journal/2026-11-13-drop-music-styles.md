# Drop the folk and orchestral island tension

> Written by: Claude (opus-au17), 2026-11-13

Meta AUDIO AU17, after J304 and engine AU16: the engine plays one music
style, piano, and no longer offers a Settings choice, so the folk and
orchestral cuts of `island-tension` are never read. They go from
`public/assets/music/{folk,orchestral}/` with their two `mounts.json`
rows: 0.83 MB of source (829,702 bytes).

- The download never held them (AU1 and AU19 cook only the piano boot
  set), so AU6's report is unchanged: 91 audio rows, 3.62 MB phone.
- `mounts.json` sits in the shard folder, so the hero content hash moves
  and `wildshard pack` would refuse the stamp. No visible change, but
  `--stamp-existing` refuses moved content by design, so the hero is
  recaptured: a detached engine worktree at `42f0a8f1`, `pnpm pins`, its
  `out/driftwood-isle` swapped for this candidate's build with
  `validation.json` `revision` set to the engine's, then
  `WILDSHARD_PREPARATION_ONLY=1 build-app.mjs` under `heavy-lane.py` and
  `preview-server.mjs` on 127.0.0.1:4861. Same spawn shot as `66fd2c2`
  (only the gulls moved).
- The same swapped worktree ran AU6's cook over the candidate: Driftwood
  91 rows, 3.62 MB phone, no folk or orchestral row.
- A new revision for a release slot; this lane uploads nothing.
