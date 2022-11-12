# Creations on fxhash.xyz

__#generativeart__ __#nft__ __#fxhash__ __#tezos__ __#creativecoding__

## Fischbach

Real-time deterministic animation based webgl2, variable size, 2022

Grab it @ https://www.fxhash.xyz/generative/slug/fischbach

### About

<img src="./public/preview.jpg" align="right" width="50%" style="margin: 0 20px 20px 20px" />

#fxhashturnsone

The first 365 crazy days of fxhash - time to celebrate this and take a look back.

The entropy of memories in a vivid photo collage that gives me goosebumps while others might just see moving eye candy.
Perspective and perception can be so different.

Based on some of my photos from the last 365 days that trigger emotional memories, even if they are not directly connected.
By the way, Fischbach is the name of the small village where I grew up. It was a great time!

How does it work?

Each piece uses pairs of photos and colors (top/bottom).

The animated collage itself is based on two layers. The first layer uses a double buffer to cut, colorize and animate the photos.
The second layer is mainly just for screen rendering, debugging and behind-the-scene looks.

Cutting and pasting photos is based on a variable moving color grid, the fixed horizon, the variable position of the photos top/bottom, the
previous buffer and some *magic* distance calculations between them.

The grid itself is a combination of vertical color stripes with variable position and distance factors that determine the color gradient
between the two colors, and folds that alternate between the two colors depending on the horizontal and vertical values.

Especially the entropy of the photos and the colored grid influence the pixel movement.

Animation changes are triggered after a random number of frames and effect folds, stripes and photo position.
These replace parts of the current collage (fade to black) or add some (discard fragment updates).

Features:

- top color [12] - hue, colorful & bright
- bottom color [6] - hue, less colorful & bright
- top photo [16] (zingst, birds, xmas, zustand, zebra, moving-blocks-mono, fischbach, santanyi, goldblume, ♠4, driften, brand-pyramide,
  zäpfle, bc, tisa, lieblingspulli)
- bottom photo: [16] (zingst, birds, xmas, zustand, zebra, moving-blocks-mono, fischbach, santanyi, goldblume, ♠4, driften, brand-pyramide,
  zäpfle, bc, tisa, lieblingspulli)
- horizon [0.618, 0.5, 0.382] (down, center, up)
- hectic [3, 5, 11] (calm, slightly, very)
- horizontal folds [113, 365, 997, 2153, 3987] - used for first animation iteration, variable
- vertical folds [7, 37, 127, 571, 1501, 3147] - used for first animation iteration, variable
- min stripes [1, 3, 5] - used for first animation iteration, variable

Animation and feature selection are based on the deterministic prng Xoshiro128 seeded with the fxhash. This allows repeated playback in the
same sequence. The animation is synchronized with frames and not with time.

The preview images are taken after 300 frames.

Shortcuts & interactions:

- spacebar, mouse click or tap touch to trigger animation changes
- `c` to take a picture
- `f` for full screen mode
- `p` to pause
- `h` to see all options

Available query string parameters:

- autopause - enable automatic pausing
- pixelratio=2 - sets the pixel ratio (default: device)
- showannouncement - activates the announcement
- kioskspeed=10 - activates the kiosk mode and sets the speed in seconds
- showinfo - activates the info box

### Third Party Licenses

- based on [fxhash-boilerplate-webpack](https://github.com/fxhash/fxhash-webpack-boilerplate)
- [@fontsource/vt323](https://www.npmjs.com/package/@fontsource/vt323) ([font source](https://github.com/phoikoi/VT323))
- [@thi.ng/color](https://www.npmjs.com/package/@thi.ng/color)
- [@thi.ng/math](https://www.npmjs.com/package/@thi.ng/math)
- [@thi.ng/random](https://www.npmjs.com/package/@thi.ng/random)
- [@thi.ng/random-fxhash](https://www.npmjs.com/package/@thi.ng/random-fxhash)
- [twgl.js](https://www.npmjs.com/package/twgl.js)

## License

© 2022 Dirk Adler
