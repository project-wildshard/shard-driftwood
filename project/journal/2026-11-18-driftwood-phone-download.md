# Driftwood’s phone download

The r5 publish runner lacked ffmpeg, so all 18 recordings went out at
their source bitrates. The publish workflow now makes ffmpeg and ffprobe
available before the build. The current local build encodes those same
recordings and saves 583,550 bytes on the phone entry list.

Write the phone palm mesh with separate vertex attributes. The decoded
indices, attributes and transform match the previous product exactly.
The existing Brotli wire measurement falls from 949,228 to 795,473 bytes.
The curated portrait and landscape keep their framing and resolution.
Their new JPEG encodes save another 184,072 bytes.

Applying these measured changes to the d11a84fc release book estimates
21,296,823 bytes, down from 22,218,200. The size gate allows 21,338,585
bytes including its existing tolerance. The staged product and its
engine pin need their own gate reading because preparation and hosted
audio encoders can change the final list and bytes.
