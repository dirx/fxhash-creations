import { RND } from '@thi.ng/random-fxhash'
import { colors } from './colors'

const shapes = RND.minmaxInt(8, 16) * 4
const rects = RND.minmaxInt(4, shapes)
const circles = RND.minmaxInt(0, shapes - rects)
const triangles = shapes - rects - circles

export const features = {
  contours: RND.minmaxInt(8, 16) * 4,
  rects: rects,
  circles: circles,
  triangles: triangles,
  gap: RND.minmaxInt(0, 5),
  angle: RND.minmaxInt(-6, 6) * 15,
  resX: 2 ** RND.minmaxInt(8, 10),
  resY: 2 ** RND.minmaxInt(8, 10),
  background: colors[RND.minmaxInt(0, colors.length - 1)],
  marker: colors[RND.minmaxInt(0, colors.length - 1)],
}

export const IMAGE_SIZE = 4096
export const CAPTURE_SIZE = 1280
