# Creations on fxhash.xyz

__#generativeart__ __#nft__ __#fxhash__ __#tezos__ __#creativecoding__

## Moving Blocks Mono

Real-time deterministic animation based webgl2, fixed size, 2022

__soon on fxhash__

### About

<img src="./resources/moving-blocks/orange-3circlesand2quads-3-2584--21°-1597-left,left-up,right-down-negative-1-31947444-ootn2iTgutBGJMq2hSBWbA8kEJS54cGWWhbH1Ttx4MepLY7F4j4.png" align="right" width="50%" style="margin: 0 20px 0 20px" />
<img src="./resources/moving-blocks/orangered-2circlesand3quads-1-610-7°-377-up,left,down-positive-3-32097371-oo1111115FBfoH1111111111111111114YMUGC1111111111111.png" align="right" width="50%" style="margin: 20px 20px 0 20px" />

Moving blocks formed by moving blocks.

How does it work?

Several shapes form boundaries. Within these boundaries, the moving blocks move pixels and rotate their color values from a specific color
to black.
Each shape has its own direction vector, which affects the feature-based directions and speed of the moving blocks.

Features:

- 109 colors: one from a unified color list (based on W3C SVG 1.0 color keyword names)
- 3, 5 or 7 shapes: 3 different sizes and 2 types (quads and circles)
- 1 - 3 clusters: shapes are assigned round-robin
- 10 rotation angles: from -168° to 168
- 5 grid sizes: based on Fibonacci numbers, starting with 377, block size is always 21
- Movable blocks: based on grid size (one Fibonacci number before)
- 127 directions of movement: based on 8 basic directions (up, up, left, left-up, left-down, right, right-up, right-down), limited to the 3,
  4, 8
  long combinations
- 2 behavior modes for movement distance: negative = decreasing and limited by range or shape, positive = increasing and limited by shape

Animation and feature selection are based on the deterministic prng XorShift128 seeded with the fxhash. This allows repeated playback in the
same order.

The size is fixed at 1980x1980 pixels.

The preview images are taken after 900 frames.

The animation will stop automatically at 900 frames. Press spacebar, click mouse or touch to change pausing. You can add `autopause` as
query string parameter to disable automatic pausing.

Press `c` to capture an image. Press `h` to see all options.

### Third Party Licenses

- based on [fxhash-boilerplate-webpack](https://github.com/fxhash/fxhash-webpack-boilerplate)
- [@fontsource/vt323](https://www.npmjs.com/package/@fontsource/vt323) ([font source](https://github.com/phoikoi/VT323))
- [@thi.ng/geom-isec](https://www.npmjs.com/package/@thi.ng/geom-isec)
- [@thi.ng/random](https://www.npmjs.com/package/@thi.ng/random)
- [@thi.ng/random-fxhash](https://www.npmjs.com/package/@thi.ng/random-fxhash)
- [twgl.js](https://www.npmjs.com/package/twgl.js)

## License

© 2022 Dirk Adler