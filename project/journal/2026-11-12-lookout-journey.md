# Lookout journey on real inputs (meta BUILD-MAX DRF-1)

- `test/ci/lookout-journey.test.mjs` boots the built product headless and earns the Lookout glyph shard from the
  shard spawn. The player walks the pier and the plateau ramp to Wendell, talks to him, opens his sea chest for the
  flint, crosses to the headland, climbs the lookout stair, lights the beacon and takes the shard. Only page inputs
  drive it: movement and the [E] act each prompt's net route names (`actRoutes(host).interactions`). It runs in the
  quick `ci` leg after the owned walk, about 3,700 ticks and 1.4 s locally on the pinned engine.
- Four refusals are checked on the way. The chest stays shut before the talk, the beacon can't be lit from the hut,
  and the shard isn't there before the beacon burns. Taking the shard grants no other shard and does not use the altar.
- The rope bridge has no deck on the server. Walking its route drops the player into the gully at about (18, 16), and
  downward rays find nothing between the authored ends. This is NL5's suspect (the server's collider set lacks the
  planks the page has), so it stays a skipped red leg in the same file. The journey rounds the gully's south-east end
  and joins the headland's plank trail instead.
- One spot on the gully's far bank, near (39, 30), stops a sprinting player even though the ground there is gentle.
  The route goes west of it through (36, 27) and (34, 30).
