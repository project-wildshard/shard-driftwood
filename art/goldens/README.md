# Goldens: driftwood-isle

> Written by: Claude (opus-k9, REPO-KIT K9, 2026-11-11). Carried from singleplayer `art/shardfile-goldens/` and
> `art/legacy-goldens/` (`08e4a21f69`). Jake, 2026-11-11 (J273): "goldens has to go into each major shard".

The look to hold for `driftwood-isle`: 24 cameras. The skill `goldens` runs them; the rules are engine `docs/goldens.md`.

- `shardfile/<nn>-<camera>.jpg`: the SHARDFILE goldens (G859, G873 L5), 22 px label strip on top.
- `legacy/<nn>-<camera>.jpg`: the frozen LEGACY record (10-28, G843). Never re-captured, never updated.
- `cameras24.json`: this shard's 24 cameras (eye, yaw, pitch, FOV, probe), the `driftwood-isle` entry of engine
  `scripts/perf/cameras24.json`.
- `runs/<date>-<sha10>-board.jpg`: the rerun board (<= 500 KB) a look change lands with.

## Source

The clean 144-camera rerun on `744c3ab7e2`, captured 2026-10-29 with the capture now at engine
`scripts/goldens/capture.mjs --mode=shardfile` (muted Chromium, iPhone 16 Pro portrait, phone tier, 2x, seed 357,
midday / clear). Re-encoded at 540 x 915 with a 22 px label strip, JPEG quality 72.

## Updates

- 2026-11-04, driftwood-isle 02, 13, 14, 15, 24 and nine-dragon-stack 22: promoted per wildshard-new's ruling (G872) on
  sp-x6's golden-drift bisect (`tmp/sp-x6-golden-bisect/`): Driftwood's foliage, frond and canopy shadows from the G913 palm
  folds (`afddc7b6f9`, `13bbae2567`) and Nine's detailed far facades from NF4's legacy paint restoration (`d6f1822f09`) are
  intended. driftwood-isle 23: its hands were dark from `180df449c9` (the GLSL graph back-end ignored `shadow.offset`);
  with that fixed its hands are bright again, as before, and it is re-taken with the fold changes only. Captured on
  `f437ca63d6` + the shadow-offset fix + DL7 P1, Chromium; WebKit matched. Boards:
  `../golden-runs/<slug>/2026-11-04-f437ca63d6-p1-dw23{,-webkit}-board.jpg`.

Add one line per promotion: date, cameras, ruling, board path.
