# Moving to repo-kit's lean layout

Jake asked repo-kit's agent to move every repo to the lean layout
(repo-kit plan `opus-2026-11-25-shard-lean-layout`, R1). t16 handed
Driftwood over once its 0.5.0 work landed (69ed5b0).

Before step 1, the canonical checkout was 115 commits behind with a
stale lane's leftovers. Its unpushed commit 994735f was already on main
under another SHA. The uncommitted ci21 ring-3 edit (2026-11-17) had
landed differently as d527b43. That edit is kept in
`git stash` ("stale lane leftovers ...") rather than discarded.

Step 1: on the old layout, `agent-sync --from` repo-kit and
`kit.mjs apply`. hc replaces the herdr guard (hooks and the hook
tests), and the git hooks, skills and kit scripts take the kit's
current copies.

Step 2: the move itself (repo-kit `scripts/lean-move.mjs`).
- **Kit:** its scripts are in `src/scripts/.kit/` and its tests in
  `src/test/.kit/`. Our own scripts are in `src/scripts/`, except
  `scripts/blender/`, which stays at the root because the SDK's lint
  plugin and `check-model-sources.mjs` read
  `scripts/blender/targets.json` there. Moving it failed
  `no-shard-runtime` on every Blender source.
- **Own tests:** `ci21-source-product.test.mjs` was in `test/tooling/`
  but is ours, not the kit's. It moves to the root `test/`, because
  `src/` is shard source and the shard lint refuses a Node test there.
- **Retired:** `kit/`, meaning the stub CLI (and the package's `bin`),
  its git test helpers, `lint.mjs` and the old configs. Land is retired
  too, per repo-kit's land audit: `land.config.json`, `land.mjs`,
  `worktree.mjs` and the disk lane's land tests go. Work is main-only
  now (AGENTS.md).
- **Verbs** follow D33: `dev` and `build` are `wildshard dev src` and
  `wildshard build src`, plus `fix`. `test` is `test:kit` (the kit's,
  the git hooks' and the agent hooks' tests) plus `test:shards`.
  Typecheck is the root strict config plus `test/tsconfig.json`; lint
  is `lint:ci21` then `lint:shards`. The order matters: the pre-commit
  hook appends staged `src/` paths to `pnpm lint`, so they reach the
  last command. Under `lint:ci21`, whose type-aware run uses
  `test/tsconfig.json`, every generator was typed `error`.
- **Format:** the shard source has never been formatted. The old
  `format:check` covered `kit/` only, and oxfmt over `src/` would
  rewrite 395 files, including canonical baked JSON. `.prettierignore`
  keeps `src/**` out, for Jake to opt folders in.
- **Checks:** `pnpm check` and `pnpm test:shards` are green.

An untracked, pre-0.5.0 `public/` (7.2 MB of old pin mounts, no
owner) was parked in `tmp/` for the move and put back afterwards.

Step 3: once the move was committed, `agent-sync --from` re-pointed the
kit skills at `src/scripts/.kit/`.
