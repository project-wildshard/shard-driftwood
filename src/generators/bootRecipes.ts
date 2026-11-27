import { bakedBootTextureSource, sharedBootPhysics } from "@wildshard/dev/bootInventory";
import { PALM_FILES } from './palmFiles';
import { HIBISCUS_FILES } from './hibiscusFiles';
import ISLAND_COVER_FILES from '../data/islandCoverFiles.json' with { type: 'json' };

const BAKED_TEXTURE_SOURCE: ReturnType<typeof bakedBootTextureSource<'driftwood-isle'>> = bakedBootTextureSource("driftwood-isle");
const PHYSICS_WASM_FILES: ReturnType<typeof sharedBootPhysics> = sharedBootPhysics();

/** Ordered retained boot and late inventory selections. */
export const DRIFTWOOD_BOOT_FILES: { readonly empty: { readonly source: { readonly urls: readonly []; }; }; readonly baked: { readonly source: typeof BAKED_TEXTURE_SOURCE; readonly excludeParts: readonly [".phone."]; readonly map: readonly ["gpu"]; }; readonly physics: { readonly source: { readonly urls: typeof PHYSICS_WASM_FILES; }; }; readonly lut: { readonly source: { readonly urls: readonly ["/assets/driftwood-isle/lut.bin"]; }; }; readonly horizon: { readonly source: { readonly urls: readonly ["/assets/driftwood-isle/horizon/driftwood-isle-day.png", "/assets/driftwood-isle/horizon/driftwood-isle-night.png"]; }; readonly map: readonly ["gpu"]; }; readonly island: { readonly source: { readonly urls: readonly ["/assets/driftwood-isle/models/driftwood-blender/island.glb"]; }; readonly map: readonly ["gpu"]; }; readonly records: { readonly source: { readonly urls: { readonly phone: readonly ["/assets/driftwood-isle/models/driftwood-blender/placements.bin"]; readonly desktop: readonly ["/assets/driftwood-isle/models/driftwood-blender/placements.bin"]; }; }; }; readonly lights: { readonly source: { readonly urls: { readonly phone: readonly ["/assets/driftwood-isle/models/driftwood-blender/lm-ao.phone.png", "/assets/driftwood-isle/models/driftwood-blender/lm-bounce.phone.png"]; readonly desktop: readonly ["/assets/driftwood-isle/models/driftwood-blender/lm-ao.png", "/assets/driftwood-isle/models/driftwood-blender/lm-bounce.png"]; }; }; readonly map: readonly ["gpu"]; }; readonly reef: { readonly source: { readonly urls: readonly []; }; }; readonly ground: { readonly source: { readonly urls: readonly []; }; }; readonly ocean: { readonly source: { readonly urls: readonly []; }; }; readonly palms: { readonly source: { readonly urls: { readonly phone: readonly [typeof PALM_FILES.phone.world]; readonly desktop: readonly [typeof PALM_FILES.desktop.world]; }; }; }; readonly hibiscus: { readonly source: { readonly urls: { readonly phone: readonly [typeof HIBISCUS_FILES.phone.world]; readonly desktop: readonly [typeof HIBISCUS_FILES.desktop.world]; }; }; }; readonly cover: { readonly source: { readonly urls: { readonly phone: readonly [string]; readonly desktop: readonly [string]; }; }; }; readonly captain: { readonly source: { readonly urls: readonly ["/assets/driftwood-isle/models/driftwood-hero/captain/captain.glb"]; }; readonly map: readonly ["gpu"]; }; readonly late: { readonly source: { readonly concat: readonly ["lut", "horizon", "island", "records", "lights", "cover", "hibiscus", "palms", "reef", "ground", "captain"]; }; readonly present: true; }; } = {
  "empty": {
    "source": {
      "urls": []
    }
  },
  "baked": {
    "source": BAKED_TEXTURE_SOURCE,
    "excludeParts": [
      ".phone."
    ],
    "map": [
      "gpu"
    ]
  },
  "physics": {
    "source": {
      "urls": PHYSICS_WASM_FILES
    }
  },
  "lut": {
    "source": {
      "urls": [
        "/assets/driftwood-isle/lut.bin"
      ]
    }
  },
  "horizon": {
    "source": {
      "urls": [
        "/assets/driftwood-isle/horizon/driftwood-isle-day.png",
        "/assets/driftwood-isle/horizon/driftwood-isle-night.png"
      ]
    },
    "map": [
      "gpu"
    ]
  },
  "island": {
    "source": {
      "urls": [
        "/assets/driftwood-isle/models/driftwood-blender/island.glb"
      ]
    },
    "map": [
      "gpu"
    ]
  },
  "records": {
    "source": {
      "urls": {
        phone: ["/assets/driftwood-isle/models/driftwood-blender/placements.bin"],
        desktop: ["/assets/driftwood-isle/models/driftwood-blender/placements.bin"]
      }
    }
  },
  "lights": {
    "source": {
      "urls": {
        "phone": [
          "/assets/driftwood-isle/models/driftwood-blender/lm-ao.phone.png",
          "/assets/driftwood-isle/models/driftwood-blender/lm-bounce.phone.png"
        ],
        "desktop": [
          "/assets/driftwood-isle/models/driftwood-blender/lm-ao.png",
          "/assets/driftwood-isle/models/driftwood-blender/lm-bounce.png"
        ]
      }
    },
    "map": [
      "gpu"
    ]
  },
  "reef": { source: { urls: [] } },
  "ground": { source: { urls: [] } },
  "ocean": { source: { urls: [] } },
  "palms": { source: { urls: { phone: [PALM_FILES.phone.world], desktop: [PALM_FILES.desktop.world] } } },
  "hibiscus": { source: { urls: { phone: [HIBISCUS_FILES.phone.world], desktop: [HIBISCUS_FILES.desktop.world] } } },
  "cover": {
    "source": {
      "urls": {
        "phone": [
          ISLAND_COVER_FILES.phone.url
        ],
        "desktop": [
          ISLAND_COVER_FILES.desktop.url
        ]
      }
    }
  },
  "captain": {
    "source": {
      "urls": [
        "/assets/driftwood-isle/models/driftwood-hero/captain/captain.glb"
      ]
    },
    "map": [
      "gpu"
    ]
  },
  "late": {
    "source": {
      "concat": [
        "lut",
        "horizon",
        "island",
        "records",
        "lights",
        "cover",
        "hibiscus",
        "palms",
        "reef",
        "ground",
        "captain"
      ]
    },
    "present": true
  }
} as const;
export const DRIFTWOOD_BOOT_SOURCES = {
  "sky": "empty",
  "baked": "baked",
  "terrain": "empty",
  "trees": "empty",
  "physics": "physics",
  "cabins": "empty",
  "props": "empty",
  "art": "empty",
  "music": "empty",
  "sfx": "empty"
} as const;
