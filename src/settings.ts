import { RND } from '@thi.ng/random-fxhash'
import { colors } from './colors'
import { flatten, repeatedly } from '@thi.ng/transducers'

export const DEBUG = process.env.NODE_ENV === 'development'



const gridSizeBase = RND.minmaxInt(3, 9);
export const features = {
  dotSize: RND.minmax(0.7, 0.9),
  gridSize: gridSizeBase * 7,
  palettes: [...repeatedly(() => RND.minmaxInt(0, colors.length), RND.minmaxInt(2,8))],
  attractors: RND.minmaxInt(3, gridSizeBase) * 7,
}

console.log(features)

export const IMAGE_SIZE = 4096
export const CAPTURE_SIZE = DEBUG ? 1280 : 2048
