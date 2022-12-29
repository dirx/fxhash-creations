# Creations on fxhash.xyz

__#generativeart__ __#nft__ __#fxhash__ __#tezos__ __#creativecoding__

## Est

Real-time deterministic animation based webgl2, fixed size, 2023

Grab it @ https://www.fxhash.xyz/generative/slug/est

### About

<img src="./public/preview.jpg" align="right" width="50%" style="margin: 0 20px 20px 20px" />

Roll the dice with shapes and capture the moment!
Est follows Iacta which follows Alea. So here we are now: alea iacta est.

How does it work?

Each Est consists of 64 objects randomly arranged around a center and randomly differing in shape, size, texture, and movement. A curated 6
colors palette is picked and used for the textures. The color palette is sorted by hue, luminosity and/or colorfulness based on the color
reference and direction variables.

The animation itself is 32 frames long and stops abruptly. It consists of 3 layers. The first layer moves the objects around the center
and draws the animated objects displacing vertex positions and textures coordinates based on modulated sinus waves. Textures are
additionally dithered based on a randomized fake 6x6 bayer matrix.

The second layer uses the first one and a double buffer to capture the motion blur based on a depth mask.

The third layer is mainly used for screen rendering, debugging and behind-the-scene looks. In addition, postprocessing is performed by
shifting the drawing position based on color and center distance.

Features:

- shapes [3] (more s, more m, more l)
- palette [102] (based on YPS magazine covers (Germany), issues 700-750 / 800-850, published 1989 - 1992)
- color sort direction [2] (up, down)
- color sort reference [3] (0, 1, 2) - used for selecting the sorting mode ()

Animation and feature selection are based on the deterministic prng Xoshiro128 seeded with the fxhash. This allows repeated playback in the
same sequence. The animation is synchronized with frames and not with time.

The preview images are taken after 32 frames.

Shortcuts & interactions:

- spacebar to trigger a rotation animation (or single click / tap)
- `o` to trigger random object change animation followed by a rotation animation (or double click / tap)
- `r` to trigger a random feature change followed by a random object change and rotation animation (or triple click / tap)
- `k` to enable the kiosk mode and set the speed (off, 3, 5 or 10 secs)
- `m` to set the kiosk mode (animate, objects, features (default), special)
- `s` to toggle the postprocessing screen mode (default, raw, alternative, rasterized, facetes, lineblocks, all)
- `c` to capture an image
- `f` for full screen mode
- `h` to see all options

Available query string parameters:

- size=8000 - sets the base size for width/height to 8000px (default 3000, useful if you want to capture bigger pngs)
- showannouncement - activates the announcement
- kioskspeed=5 - activates the kiosk mode and sets the speed in seconds
- kioskmode=animate - set the kiosk mode (animate, objects, features (default), special)
- screenmode=default - set the postprocessing screen mode (default, raw, alternative, rasterized, facetes, lineblocks, all)
- showinfo - activates the info box

### Third Party Licenses

- based on [fxhash-boilerplate-webpack](https://github.com/fxhash/fxhash-webpack-boilerplate)
- [@fontsource/vt323](https://www.npmjs.com/package/@fontsource/vt323) ([font source](https://github.com/phoikoi/VT323))
- [@fontsource/outfit](https://www.npmjs.com/package/@fontsource/outfit) ([font source](https://github.com/Outfitio/Outfit-Fonts/))
- [@thi.ng/color](https://www.npmjs.com/package/@thi.ng/color)
- [@thi.ng/math](https://www.npmjs.com/package/@thi.ng/math)
- [@thi.ng/random](https://www.npmjs.com/package/@thi.ng/random)
- [@thi.ng/random-fxhash](https://www.npmjs.com/package/@thi.ng/random-fxhash)
- [twgl.js](https://www.npmjs.com/package/twgl.js)

## License

© 2023 Dirk Adler