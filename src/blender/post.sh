#!/usr/bin/env bash
# post.sh — build.sh's post step for driftwood-isle/island (DRIFTWOOD-REMASTER X2, E52): the two lightmaps as PNG,
# desktop and phone (512-square). Linear data in 8-bit PNG (SF8c, J525: the cook makes any KTX2): Blender writes the PNG, this only resizes. build.sh has
# already meshopt'd island.glb and copied placements.bin + island.json. Env from build.sh: BUILD, BLENDER.
set -euo pipefail
DEST=src/static/assets/driftwood-isle/models/driftwood-blender
"$BLENDER" -b --factory-startup -noaudio --python-exit-code 1 --python-expr "
import bpy
for src, dst, size, q in [('lm-ao.png', 'lm-ao', 2048, 78), ('lm-bounce.png', 'lm-bounce', 1024, 90)]:
    for suffix, s in (('', size), ('.phone', 512)):
        img = bpy.data.images.load('$BUILD/' + src); img.colorspace_settings.name = 'Non-Color'
        if img.size[0] != s: img.scale(s, s)
        sc = bpy.context.scene; st = sc.render.image_settings
        st.file_format = 'PNG'; st.compression = 100; st.color_mode = 'RGB'
        sc.view_settings.view_transform = 'Standard'; sc.display_settings.display_device = 'sRGB'
        img.save_render('$DEST/' + dst + suffix + '.png', scene=sc)
" >/dev/null 2>&1
