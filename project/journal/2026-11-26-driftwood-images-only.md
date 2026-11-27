# Driftwood carries images only (SF8c)

J525: the cook makes every KTX2, so Driftwood stops carrying its hand-made ones. The horizon strips and the two
lightmaps were WebP, which the cook never encodes, so each became a lossless PNG of the same texels; the captain GLB's
WebP atlas became a PNG inside the GLB, and the captain's coat pin is that PNG instead of a UASTC KTX2. `gpu/` and the
`.phone.webp` giant copy are no longer mounted and the zone's KTX2 table is empty. The hand-made KTX2 files stay in the
repo until Jake has seen the look board (SF8f, SF8g). The Blender post step writes PNG now.
