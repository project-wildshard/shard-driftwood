# Driftwood drops its day, sea and collision hosts (ONE-FORMAT OF22a2, OF22a3c)

> Written by: Claude (opus-of21-drift), from opus-of22b's solid rows

The server plan named three hosts for things the shard file already says.
On engine 0.1.53 a native plan with no day host runs the look's toon sky
clock, with no sea host takes the declared sea row's water (982b2647a),
and with no `collision` host stands its bake's ground and the shard's own
prop solids (c3b7fde16). So `day.toon`, `water.sea` and `collision` leave
`server/native-assembly.json`, and the bake's solids ride as
`props.colliders` rows (`data/solidRows.json`, from `solidRows.ts`).

Three things the first cut hit:

- The shard file holds at most 100,000 JSON nodes, and the rows went
  613 over. A turn about the up axis alone is now a `yaw` (one node, not
  a five-node quaternion), and `wood`, a prop collider's default surface,
  is left out.
- Its sections hold at most 2 MB, and the rows took them over. Rapier
  keeps every pose, extent and hull point as float32, so each number is
  the shortest decimal that is the same float32: 1.08 MB became 0.64 MB
  and every solid is the bake's to the bit (the test checks the boxes).
- The lookout beacon would not light. A
  prompt's sight ray passes when it meets the body it names; the
  collision host tagged colliders with the bake's owner
  (`piece:interact-beacon`), a prop row tags them with its id
  (`piece.interact-beacon`). The server's quest spots now name the row.

Both server builds were probed beside each other: from one eye in the
wreck's hold the sight rays meet the same solids at the same distances
with the collision host and with the prop rows.

On 0.1.53 the darwin walk checkpoint is 0.1.50's to the byte, so linux
takes 0.1.50's linux digest; CI proves it. The shrine journey stays red
on 0.1.53 with or without these rows (opus-of22e's bisect).
