# Node 26 strip-only children

- opus-pins (SF24): with --experimental-transform-types gone (4d1676a), witness.ts's parameter property broke the native witness child on Node 26 (ci21-source red on 150727a). It assigns the field in the constructor now.
- Guard: test/node-strip-only.test.ts strips every test/fixtures and test/proof TypeScript file with Node's own strip-only parser.
