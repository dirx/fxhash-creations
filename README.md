# Creations on fxhash.xyz

__#generativeart__ __#nft__ __#fxhash__ __#tezos__ __#creativecoding__

## Iacta

Real-time deterministic animation based webgl2, fixed size, 2022

Grab it @ https://www.fxhash.xyz/generative/slug/iacta

### About

<img src="./public/preview.jpg" align="right" width="50%" style="margin: 0 20px 20px 20px" />

Roll the dice with shapes and capture the moment!
Iacta follows Alea. Iacta, by the way, is Latin and means throw / hurl / cast / fling.

How does it work?

Each Iacta consists of 64 objects randomly arranged around a center and randomly differing in shape size, texture, and movement. A curated 5
colors palette is picked and used for the textures. The colors are first sorted by saturation to select a reference color. With this, the
colors are then sorted again by luminance.

The animation itself is 32 frames long and stops abruptly. It consists of 3 layers. The first layer moves the objects around the center
and draws the animated objects displacing vertex positions and textures coordinates with perlin noise. The second uses the first layer and
a double buffer to capture the motion blur based on a depth mask. The third is mainly for screen rendering, debugging and behind-the-scene
looks.

Features:

- shapes [3] (more s, more m, more l)
- palette [30] (based on Ray Gun Magazine covers by David Carson, first 30 issues 1992 - 1995)
- color sort direction [2] (up, down) - sort by saturation
- color sort reference [3] (0, 1, 2) - used for sorting by luminance / background color

Animation and feature selection are based on the deterministic prng Xoshiro128 seeded with the fxhash. This allows repeated playback in the
same sequence. The animation is synchronized with frames and not with time.

The preview images are taken after 32 frames.

Shortcuts & interactions:

- spacebar to trigger a rotation animation (or single click / tap)
- `o` to trigger random object change animation followed by a rotation animation (or double click / tap)
- `r` to trigger a random feature change followed by a random object change and rotation animation (or triple click / tap)
- `k` to activate the kiosk mode and set the speed (off, 3, 5 or 10 secs)
- `m` to change the kiosk mode (animate, objects or features, default: features)
- `c` to capture an image
- `f` for full screen mode
- `h` to see all options

Available query string parameters:

- size=8000 - sets the base size for width/height to 8000px (default 3000, useful if you want to capture bigger pngs)
- subdivisions=255 - sets shape subdivisions to 255 (default 100, set to max 255 for highest resolution)
- showannouncement - activates the announcement
- kioskspeed=5 - activates the kiosk mode and sets the speed in seconds
- kioskmode=a - set the kiosk mode (default: f, a = animate, o = objects or f = features)
- showinfo - activates the info box

### Third Party Licenses

- based on [fxhash-boilerplate-webpack](https://github.com/fxhash/fxhash-webpack-boilerplate)
- [@fontsource/vt323](https://www.npmjs.com/package/@fontsource/vt323) ([font source](https://github.com/phoikoi/VT323))
- [@fontsource/outfit](https://www.npmjs.com/package/@fontsource/outfit) ([font source](https://github.com/Outfitio/Outfit-Fonts/))
- [stegu/webgl-noise](https://github.com/stegu/webgl-noise)
- [@thi.ng/color](https://www.npmjs.com/package/@thi.ng/color)
- [@thi.ng/math](https://www.npmjs.com/package/@thi.ng/math)
- [@thi.ng/random](https://www.npmjs.com/package/@thi.ng/random)
- [@thi.ng/random-fxhash](https://www.npmjs.com/package/@thi.ng/random-fxhash)
- [twgl.js](https://www.npmjs.com/package/twgl.js)

## License

© 2022 Dirk Adler