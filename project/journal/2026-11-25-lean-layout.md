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
