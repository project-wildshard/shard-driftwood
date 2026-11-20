# Driftwood's creatures as skin looks (ONE-FORMAT OF27d)

> Written by: Claude (opus-of27d), 2026-11-19

The declared roster's six kinds need real looks before the page can drop `population.product-creatures` and engine can
drop its temporary bridge (15e54b885). No rigged GLBs exist, and crab, monkey, sailor and captain fit no kit skeleton,
so OF27a's `hullCreature` cannot fit them. `rows/creatureSkins.ts` writes each baked body (the bodies the hull book
packed) as a `platform.skin` GLB over its own bones and weights, its clips sampled from the island's pose programs.
Boar and bear say `skeleton: 'quadruped'` so the engine's gait poses them. Known losses: the monkey has no perch sit
(a skin has no perch state), the sailor's rise and the pose programs' look-at and squash are not sampled.
