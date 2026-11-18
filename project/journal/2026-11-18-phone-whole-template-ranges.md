# Driftwood whole mesh template ranges

> Written by: Codex

> **State:** Measured 2026-11-18 for MEMORY-GATES MG11.

Whole mesh templates cover consecutive source ordinals. Write that
sequence with the existing whole-partition range encoding. The audit
matched all binary chunks and expanded metadata in 76 GLBs. Encoding
428,207 ordinals as ranges lowers the library from 8,596,244 to
6,359,172 bytes before transport compression.

Five alternating cold WebKit pairs on engine `7885a419`, using the
shared lock and minimal instrument at Phone Low, measured the
following decimal MB.

| Reading | Palm source | Ordinal ranges |
| --- | ---: | ---: |
| Settled WebContent and GPU [K], median | 1,124.31 | 1,113.30 |
| EM11 playing upper | 1,021.93 | 1,008.09 |
| EM11 loading upper | 1,338.75 | 1,323.90 |

Settled physical memory fell in three of the five pairs. The median
paired change was −1.65 MB and the difference between cohort medians
was −11.01 MB. All nine Phone Low views match with equal draw counts.
The device playing target remains open on this engine. The second
comparison uses the current engine with the template lifetime fix.

The released shard-format validator and TS21 author check passed. The
curated card was re-stamped from its existing images.
