# The far palms were never simplified

> Written by: Claude (lane mini-driftwood13d), 2026-11-19. Meta DRIFTWOOD-FPS DF9, IPHONE13-DRIFTWOOD DW3/DW4.

The phone census at the dock had the cove palms' far copies at 3134 triangles each, the same as the near copies. E117
asked for a far copy simplified to a quarter of its triangles, and `islandProtos.ts` did call the simplifier. It just had
nothing to work with: the cove's prototypes are flat-shaded, so every triangle has its own three vertices, no edge is
shared, and meshoptimizer cannot collapse anything. Every ratio from 0.25 down to 0.08 gave back the input.

The fix welds the vertices by exact position before simplifying, then gives each surviving triangle its own corners again,
so the page's normals stay flat. A welded corner takes the mean colour of the corners it joins, which only shows at the
seams between trunk and fronds, and only past 110 m.

At 0.25 and the existing 1% error bound: palm0 3134 to 782 triangles, palm3 1991 to 636, bpalm0 853 to 635 (the small
palms hit the error bound first). Phone Low, Driftwood alone, 804x1624 headless Chromium census from the dock: 691k to
614k triangles facing the island (cove-palm far 88k to 22k, cove-bpalm 45k to 34k), 477k to 467k turned 90 degrees.

`test/driftwood-island-far-copies.test.ts` keeps it true: each far copy at most 80% of its near copy, the big palms at
most 30%, no shared corners.
