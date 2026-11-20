# Driftwood's sea floor: coarse fans under 1.6 m of water (2026-11-20)

> Written by: Claude (lane mini-driftwood13j, meta DRIFTWOOD-FPS DF9)

`driftwood-ground` was 107.7k triangles, drawn whole at every yaw, and 64.9k of them lie under the sea. The sea's
Beer–Lambert body hides most of that floor (a 1.6 m column is over 99% opaque past about 9 m), and from 1.6 m down the
paint is the flat seabed colour. So a 4×4 block of cells whose every vertex is 1.6 m or more under the sea, gently
sloped and within 10 cm of a fan through its corners and centre, now draws as that fan: 4 triangles instead of 32 when
the blocks beside it are coarse too. A side next to a fine block keeps all its vertices, so there are no cracks (the test
checks every inner edge is shared by two triangles). 913 blocks: 107,676 to 83,372 triangles. Shallower water and its
sand are untouched.

A 1 m line took 33.4k off, but straight down over the shallowest blocks (1.1 m) the larger facets showed through the
water, so the line is 1.6 m.
