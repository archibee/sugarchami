# Character image variants

Generated PNG character assets for mini-games, dialogue, collections, and rewards. The source art is retained here; Vite serves the smaller display copies from `public/images/variants/`.

## CHAMI

The master sprites are 512 × 512, grouped into three six-character sheets:

- Expressions A: cheerful, sleepy, determined, surprised, dozy, sparkle
- Expressions B: cheering, yawning, curious, bashful, grumpy, dizzy
- Leaf and silhouette variations: triple leaf, curled leaf, double sprout, mint leaf, dew leaf, pear shape

Runtime copies in `public/images/variants/chami/` are resized to 384 × 384 for lighter page loads. The original 3 × 2 sheets are kept in `chami/` as `chami-expressions-atlas-a.png`, `chami-expressions-atlas-b.png`, and `chami-leaf-variants-atlas.png`.

## SITRY SD

- `sitri-wave-mascot.png`: welcoming wave
- `sitri-pointing-mascot.png`: points toward a game or panel
- `sitri-trophy-mascot.png`: celebrates a trophy
- `sitri-sugar-meter-mascot.png`: reacts to a sugar-meter result
- `sitri-sd-actions-atlas.png` and `sitri-sd-expressions-atlas.png`: additional four-pose SD sheets

Runtime standalone copies are resized to fit within 512 × 512 in `public/images/variants/sitri/`. High-resolution source images and atlases remain in this folder for future use.
