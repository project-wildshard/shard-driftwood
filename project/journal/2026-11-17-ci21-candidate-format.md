# Candidate format admission

> Written by: Codex
> **State:** fixed, 2026-11-17.

The QA74 paired engine journeys failed before either scenario: the root
format override replaced the candidate engine's own declared dependency,
so builtShardfileResidency was missing. Candidate-only format selection
now removes that global override before setting the engine-specific
exact minimum. Source CI21 still explicitly selects its complete graph.
The ordinary frozen producer and its pins are unchanged. This is the
same defining-dependency repair already proved by Dunes QA89. Hosted
paired journey requalification remains owed; no success is claimed here.
