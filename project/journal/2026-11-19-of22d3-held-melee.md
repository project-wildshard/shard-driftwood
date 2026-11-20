# The swords are the held/melee section

ONE-FORMAT OF22d3. The native plan's `item.swept` host read the sword
policy from `server/swords.json`. Format 0.55.0 declares that policy as
the `held/melee` platform section, and engine (OF22d2, 53686ff1b) stands
the sword from it before any host when no `item.swept` row is named. So
the shard writes `nativeSwords.json` as `held/melee` and drops the host
row and the server file.
