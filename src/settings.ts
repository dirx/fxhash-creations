import { RND } from '@thi.ng/random-fxhash'
import { css, oklch } from '@thi.ng/color'

export const DEBUG = process.env.NODE_ENV === 'development'

const shapes = RND.minmaxInt(8, 17) * 4
const rects = RND.minmaxInt(4, shapes)
const circles = RND.minmaxInt(0, shapes - rects)
const triangles = shapes - rects - circles

export const features = {
  contours: RND.minmaxInt(8, 16) * 4,
  rects: rects,
  circles: circles,
  triangles: triangles,
  gap: RND.minmaxInt(0, 5),
  angle: RND.minmaxInt(-6, 7) * 15,
  resX: RND.minmaxInt(2, 6) * 100,
  resY: RND.minmaxInt(2, 6) * 100,
  background: css(oklch(RND.minmax(0.8, 0.9), RND.minmax(0.25, 0.3), RND.minmaxInt(0, 120) / 120)),
  accent: css(oklch(RND.minmax(0.6, 0.7), RND.minmax(0.25, 0.3), RND.minmaxInt(0, 120) / 120)),
}

export const IMAGE_SIZE = 4096
export const CAPTURE_SIZE = DEBUG ? 1280 : 2048
