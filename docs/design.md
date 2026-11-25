# shard-driftwood: design

Status: draft 2026-11-05: scaffold only; the real design arrives with the import.

Living doc: **how** this repo is built. What it does and why is
`docs/prd.md`. Keep this true as the code changes.

## Today

Only the scaffold exists:

- `src/scripts/`: the repo's own tooling, plain JS; repo-kit's stamped
  copies sit in `src/scripts/.kit/` and its tests in `src/test/.kit/`.
- `scripts/blender/`: the Blender targets, at the root because the SDK
  reads `scripts/blender/targets.json` there.

## Dependencies

- `sharddev (build)`, by git tag (`github:project-wildshard/<repo>#vX.Y.Z`)
- `engine (runtime, via sharddev)`, by git tag (`github:project-wildshard/<repo>#vX.Y.Z`)

## Boundaries the checks enforce

- None yet beyond the shared lint and type rules.

## Coming with the import

- `src/`
- `src/static/assets/driftwood-isle/`
- `scripts/blender/driftwood-isle/`
- `art/driftwood*`
- tests naming driftwood (305 files in test/)
