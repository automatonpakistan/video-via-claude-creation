# Liberia 1927 — The Impossible Election

Original animated short. Approved script and production provenance are under `work/liberia-1927/`.

## Render

Composition `Liberia1927`, 1392 frames at 30 fps (46.4 seconds). The composition is 1080×1920 and is rendered at scale 4/3 with an explicitly verified 1440×2560 Three.js drawing buffer.

Install `npm ci`, then run `node scripts/render-chunk.mjs INDEX 12` for each index 0–11. Assemble with `node scripts/assemble-render.mjs`. The dedicated GitHub Actions workflow does this in parallel and uploads the final video plus QA reports.

Only the new production directory and its render workflow are added. Existing reference files are preserved. Historical totals differ across sources; the approved script follows the 243,000/15,000 account documented in SCRIPT.md. Printed ballots and environments are illustrative designs, not reproductions of surviving official documents.

## Audio and attribution

Approved narration uses native Piper 1.8.0, en_US-ryan-high, length_scale 1.2. The model card and attribution are retained under `work/liberia-1927/voice/`. Original music and synthesized effects are preserved as separate stems. Word timings are model-derived with uncertainty records, not independently verified listening/ASR.

The mastered track is 48 kHz stereo PCM24, 46.4 seconds, measured at -15.00 LUFS and -2.08 dBTP before AAC encoding. Final artifact QA rechecks encoded loudness and all video frames.
