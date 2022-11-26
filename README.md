# Creations on fxhash.xyz

__#generativeart__ __#nft__ __#fxhash__ __#tezos__ __#creativecoding__

## Alea

Real-time deterministic animation based webgl2, fixed size, 2022

Grab it soon @ https://www.fxhash.xyz

### About

<img src="./public/preview.jpg" align="right" width="50%" style="margin: 0 20px 20px 20px" />

Roll the dice with shapes and capture the moment! 
Alea, by the way, is Latin and means dice / gambling.

How does it work?

Each Alea consists of 64 objects randomly arranged around a center and randomly differing in shape, texture, and movement. A curated 5
colors palette is picked and used for the textures. The colors are first sorted by saturation to select a reference color. With this, the
colors are then sorted again by luminance.

The animation itself is 32 frames long and stops abruptly. It consists of 3 layers. The first layer moves the objects around the center
and draws the animated objects. The second uses the first layer and a double buffer to capture the motion blur based on a depth mask. The
third is mainly for screen rendering, debugging and behind-the-scene looks.

Features:

- shapes [7] (toruses, cubes, planes, toruses & cubes, toruses & planes, cubes & planes, toruses, cubes & planes)
- palette [58] (based on German Max Magazine covers 1991 - 1995)
- color sort direction [2] (up, down) - sort by saturation
- color sort reference [3] (0, 1, 2) - used for sorting by luminance / background color

Animation and feature selection are based on the deterministic prng Xoshiro128 seeded with the fxhash. This allows repeated playback in the
same sequence. The animation is synchronized with frames and not with time.

The preview images are taken after 32 frames.

Shortcuts & interactions:

- spacebar to trigger a spinning animation (or single click / tap)
- `o` to trigger random object change animation followed by a rotation animation (or double click / tap)
- `r` to trigger a random feature change followed by a random object change and rotation animation (or triple click / tap)
- `k` to toggle this kiosk mode (off, 3, 5 or 10 secs)
- `c` to capture an image
- `f` for full screen mode
- `h` to see all options

Available query string parameters:

- size=8000 - sets the base size for width/height to 8000px (default 3000, useful if you want to capture bigger pngs)
- showannouncement - activates the announcement
- kioskspeed=5 - activates the kiosk mode and sets the speed in seconds
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

© 2022 Dirk Adler