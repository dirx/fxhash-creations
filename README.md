# Creations on fxhash.xyz

See [my profile on fxhash.xyz](https://www.fxhash.xyz/u/dirx/creations).

__#generativeart__ __#nft__ __#fxhash__ __#tezos__ __#creativecoding__

## Driften

Real-time deterministic animation based webgl2, variable size, 2022

Grab it @ https://www.fxhash.xyz/generative/slug/driften

### About

<img src="./resources/driften/146051555351-ooft3yH1UXBTS5aA9GRNqSTzXxCXhHaSncf3u412iGq9w2PkMAT.png" align="right" width="50%" style="margin: 0 20px 0 20px" />

This piece evolved from the basic idea of having a simple animated, colorful, circular thing, like a colorful version of Moving
Blocks Mono crossed with Zebra. As so often happens, ideas evolve, new ideas emerge, intersect with old ones, and things drift in other
directions through beautiful pixel landscapes. And here we are - in Driften - and - once again - it's all about moving pixels and shifting
colors.

Driften, by the way, is German for drifting.

How does it work?

The animation is based on several layers.

The first layer uses psrdnoise combined with feedback with the last layer. This layer mainly determines
in which areas the colors should be shifted, which color should be reset (which depends on the color shifting
direction) and where and how pixels should be shifted and if the brush is applied. It also creates the moiré effects.

The second layer contains a simple variant of moving blocks, which are applied as brush strokes in the last layer.

The last layer uses a double buffer to store its state, allowing color and pixel shifts.

Features:

- Color
- Color shift direction [-1, 1] (backward, forward)
- Color shift speed [1, 2, 4] (slow, medium, fast)
- Brush moving blocks - number [100, 200, 1000] & size [0.1, 0.05, 0.01] (few large, some medium, many small)
- Brush moving directions - 28 pairs of up, left-up, left, left-down, down, right-down, right, right-up.
- Brush intensity [0.1, 1.0, 3.0] (low, medium, high)
- Moiré intensity [0.1, 1.0, 10.0] (fine, coarse, very coarse)
- Moving Speed [1, 3, 7] (slow, medium, fast)
- Gradient levels [1, 2, 6] (mono, duo, hexa)
- Gradient colors

Gradients consist of the base color and, depending on the steps, 1 (mono), 2 (duo) or 6 (hexa) additional colors. They are built from a
combination of low/high chroma and low/high lightness colors. Hexa gradients actually consist of 2 gradients, similar
to duo gradients, but with more intermediate steps along the hue.

Animation and feature selection are based on the deterministic prng Xoshiro128 seeded with the fxhash. This allows repeated playback in the
same sequence. The animation is synchronized with frames and not with time.

The preview images are taken after 400 frames.

The animation is automatically paused at 400 frames. Press spacebar, click mouse or touch to change pause.

Press `c` to take a picture. Press `f` for full screen mode. Press `h` to see all options.

Available query string parameters:

- autopause - disables automatic pausing
- pixelratio=2 - sets the pixel ratio (default: 2)
- showannouncement - activates the announcement
- cyclegradientspeed=3 - activates gradient playback and sets the speed factor
- speed=1 - sets the overall speed factor (experimental, default: 1)
- kioskspeed=10 - activates the kiosk mode and sets the speed in seconds
- showinfo - activates the info box

### Source Code

See https://github.com/dirx/fxhash-creations/tree/driften

### Third Party Licenses

- based on [fxhash-boilerplate-webpack](https://github.com/fxhash/fxhash-webpack-boilerplate)
- [@fontsource/vt323](https://www.npmjs.com/package/@fontsource/vt323) ([font source](https://github.com/phoikoi/VT323))
- [@thi.ng/color](https://www.npmjs.com/package/@thi.ng/color)
- [@thi.ng/geom-isec](https://www.npmjs.com/package/@thi.ng/geom-isec)
- [@thi.ng/math](https://www.npmjs.com/package/@thi.ng/math)
- [@thi.ng/random](https://www.npmjs.com/package/@thi.ng/random)
- [@thi.ng/random-fxhash](https://www.npmjs.com/package/@thi.ng/random-fxhash)
- [psrdnoise2.glsl](https://github.com/stegu/psrdnoise)
- [twgl.js](https://www.npmjs.com/package/twgl.js)

## Moving Blocks Mono

Real-time deterministic animation based webgl2, fixed size, 2022

Grab it @ https://www.fxhash.xyz/generative/slug/moving-blocks-mono

### About

<img src="./resources/moving-blocks/orange-3circlesand2quads-3-2584--21°-1597-left,left-up,right-down-negative-1-31947444-ootn2iTgutBGJMq2hSBWbA8kEJS54cGWWhbH1Ttx4MepLY7F4j4.png" align="right" width="50%" style="margin: 0 20px 0 20px" />
<img src="./resources/moving-blocks/orangered-2circlesand3quads-1-610-7°-377-up,left,down-positive-3-32097371-oo1111115FBfoH1111111111111111114YMUGC1111111111111.png" align="right" width="50%" style="margin: 20px 20px 0 20px; padding-top: 20px" />

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

Press `c` to capture an image. Press `f` for fullscreen. Press `h` to see all options.

### Source Code

See https://github.com/dirx/fxhash-creations/tree/mono

### Third Party Licenses

- based on [fxhash-boilerplate-webpack](https://github.com/fxhash/fxhash-webpack-boilerplate)
- [@fontsource/vt323](https://www.npmjs.com/package/@fontsource/vt323) ([font source](https://github.com/phoikoi/VT323))
- [@thi.ng/geom-isec](https://www.npmjs.com/package/@thi.ng/geom-isec)
- [@thi.ng/random](https://www.npmjs.com/package/@thi.ng/random)
- [@thi.ng/random-fxhash](https://www.npmjs.com/package/@thi.ng/random-fxhash)
- [twgl.js](https://www.npmjs.com/package/twgl.js)

## Zebra

Real-time deterministic animation based on vanilla js & canvas 2d rendering context, variable size, 2022

Grab it @ https://www.fxhash.xyz/generative/slug/zebra

### About

[<img src="https://gateway.ipfs.io/ipfs/Qme2g4LjLTDM8hV1TXZereU8wTT2pUqi8A9WKP38NWQ1Z1" align="right" width="50%" style="padding: 0 20px 0 20px" />](https://www.fxhash.xyz/generative/slug/zebra)

Zebra follows a simple idea: create an endless variation of new images by simply moving pixels up, down, right or left and rotating colors
according to different rules. Sometimes it's gone too fast, other times it's really slow and hardly changes, sometimes it's quite boring,
then it's surprising, then it's chaotic with glitches and suddenly it's simple and clear again and then it's displaced by the next one.

The animation is based on a deterministic prng. Width, height and pixel ratio change the order of the animation.

A touch/mouse click triggers the butterfly wing effect, which may have an influence on the animation.

Since it uses the canvas 2D renderings context, there is an auto-adjustment for the pixel ratio to keep the performance e.g. at fullscreen
even on larger monitors.

If you are curious you may press `h` for help and play around with the features like adjusting the frame rate, changing the pixel ratio or
simply looking at the behind the scene numbers.

Building Zebra and playing around with it was super fun and I learned a lot.

I hope you enjoy it, too.

Btw: there might be some specials like gold and rainbow.

### Source Code

See https://github.com/dirx/fxhash-creations/tree/zebra

### Third Party Licenses

- based on [fxhash-boilerplate-webpack](https://github.com/fxhash/fxhash-webpack-boilerplate)
- [@fontsource/vt323](https://www.npmjs.com/package/@fontsource/vt323) ([font source](https://github.com/phoikoi/VT323))
- [prando](https://www.npmjs.com/package/prando)

## License

© 2022 Dirk Adler
