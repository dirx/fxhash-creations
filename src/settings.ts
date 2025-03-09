import { RND } from '@thi.ng/random-fxhash'
import { repeatedly } from '@thi.ng/transducers'
import { palettes } from './palettes'

const shapes = RND.minmaxInt(4, 8)
const rects = RND.minmaxInt(0, shapes)
const circles = RND.minmaxInt(0, shapes - rects)
const triangles = shapes - rects - circles

export const features = {
  gap: RND.minmaxInt(0, 8) * 8,
  italic: RND.minmaxInt(-15, 15) * 3,
  resX: 2 ** RND.minmaxInt(5, 10),
  resY: 2 ** RND.minmaxInt(5, 10),
  palettes: [...repeatedly(() => RND.minmaxInt(0, palettes.length - 1), RND.minmaxInt(2, 8))],
  rects: rects,
  circles: circles,
  triangles: triangles,
  freqX: RND.minmaxInt(0, 16),
  freqY: RND.minmaxInt(0, 16),
  ampX: RND.minmaxInt(0, 32),
  ampY: RND.minmaxInt(0, 32),
}

export const IMAGE_SIZE = 4096
export const CAPTURE_SIZE = 2048
