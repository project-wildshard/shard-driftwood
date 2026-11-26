# The push lane runs the script-paths guard (opus-guard119, meta QA 11-25 row 119)

- `.githooks/run-checks.mjs` was row 113's hand-edited copy, which never ran the script-paths, chunk-param or
  gate-report steps. It is the kit's copy again; the only local edit was a dynamic `branch-restore.mjs` import.
- `kit.mjs apply` brought the guard and its helpers, and publish.yml without the pre-lean
  `scripts/select-candidate.mjs` fallback; `agent-sync --from repo-kit` restamped agent-sync.mjs (row 97's wording)
  and the NotebookEdit matcher (row 108).
- `scripts/blender/` stays: the SDK's Blender build reads `./scripts/blender/targets.json` from the repo root, and
  live targets build models here. Its baseline entry says so.
