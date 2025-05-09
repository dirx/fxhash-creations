import { RND } from '@thi.ng/random-fxhash'
import { colors } from './colors'
import { flatten, map, range, repeatedly } from '@thi.ng/transducers'
import { mod } from '@thi.ng/math'
import {
  columnWise,
  createBFS,
  createDFS,
  createRandom,
  diagonal,
  distributeFermatsSpiral,
  distributeFibonacciLattice2D,
  type distributeFn,
  distributeGeodesicSphere,
  distributeSphericalSpiral2D,
  rowWise,
  traverseRowWise,
  zigZagColumnWise,
  zigZagRowWise,
} from './traverse'
import { shuffle } from './utils'

export const DEBUG = process.env.NODE_ENV === 'development'
export const DEBUG_VIEW = new URLSearchParams(window.location.search).has('debug')
export const PREVIEW_DOWNLOAD = new URLSearchParams(window.location.search).has('preview-download')

export const COLOR_LIGHT = '#dddddd'
export const COLOR_DARK = '#222222'
export const COLOR_BACKGROUND = '#222222'

// repeatedly(() => RND.float(),RND.minmaxInt(0, 100)).toArray()

const shift = (x: number, o: number) => mod(x + o, 1)
const transformer = {
  linear: (x: number, o: number) => shift(x, o),
  sine: (x: number, o: number) => shift(Math.sin(x * Math.PI + o * Math.PI) * 0.5 + 0.5, o),
  sineSquared: (x: number, o: number) => shift(Math.pow(Math.sin(x * Math.PI + o * Math.PI), 2), o),
  easeIn: (x: number, o: number) => shift(Math.pow(Math.abs(x), 3 - o), o),
  smoothstep: (x: number, o: number) => {
    const t = Math.max(0, Math.min(1, Math.abs(x)))
    return shift(t * t * (3 - 2 * t), o)
  },
  parabola: (x: number, o: number) => shift(x * (2 - x + o), o),
  sigmoid: (x: number, o: number) => shift(1 / (1 + Math.exp(-(3 - o) * x)), o),
  random: (x: number, o: number) => shift(RND.minmax(0, 1), o),
}
const transformerIds = Object.keys(transformer)

const traverser = {
  row: rowWise,
  column: columnWise,
  zigZagRow: zigZagRowWise,
  zigZagColumn: zigZagColumnWise,
  diagonal: diagonal,
  bfs: createBFS(RND),
  dfs: createDFS(RND),
  random: createRandom(RND),
}

const traverserIds = Object.keys(traverser)

const distributor: object = {
  fermatsSpiral: distributeFermatsSpiral,
  fibonacciLattice: distributeFibonacciLattice2D,
  sphericalSpiral: distributeSphericalSpiral2D,
  geodesicSphere: distributeGeodesicSphere,
}
const distributorIds = Object.keys(distributor)

const gridSizeBase = RND.minmaxInt(14, 26)

type colorFunctionType = (d: boolean, c: string, s: number) => string
const colorFunctions: colorFunctionType[] = [
  (d: boolean, c: string, s: number) => d ? c : (Math.abs(s) > 0.328 ? 'none' : COLOR_LIGHT),
  (d: boolean, c: string, s: number) => d ? COLOR_LIGHT : (Math.abs(s) > 0.328 ? c : 'none'),
  (d: boolean, c: string, s: number) => d ? 'none' : (Math.abs(s) > 0.328 ? COLOR_LIGHT : c),
  (d: boolean, c: string, s: number) => d ? c : (Math.abs(s) > 0.328 ? 'none' : COLOR_DARK),
  // (d: boolean, c: string, s: number) => d ? COLOR_DARK : (Math.abs(s) > 0.328 ?  c : 'none'),
  // (d: boolean, c: string, s: number) => d ? 'none' : (Math.abs(s) > 0.328 ?  COLOR_DARK : c),
]

export const SHAPE_QUAD = 'quad'
export const SHAPE_HEXAGON = 'hexagon'
export const SHAPE_CIRCLE = 'circle'
export const shapes = [SHAPE_QUAD, SHAPE_HEXAGON, SHAPE_CIRCLE]

export const features = {
  dotSize: RND.minmaxInt(2, 8),
  gridSize: gridSizeBase * 7,
  palettes: [...repeatedly(() => RND.minmaxInt(0, colors.length), RND.minmaxInt(1, 5))],
  attractors: RND.minmaxInt(3, gridSizeBase) * 7,
  attractorStrength: transformerIds[RND.minmaxInt(0, transformerIds.length - 1)],
  x: transformerIds[RND.minmaxInt(0, transformerIds.length - 1)],
  y: transformerIds[RND.minmaxInt(0, transformerIds.length - 1)],
  distributor: distributorIds[RND.minmaxInt(0, distributorIds.length)],
  traverser: traverserIds[RND.minmaxInt(0, traverserIds.length)],
  kick: transformerIds[RND.minmaxInt(0, transformerIds.length - 1)],
  repeat: RND.minmaxInt(1, gridSizeBase),
  fills: shuffle([...range(0, colorFunctions.length)], RND, colorFunctions.length - 1),
  strokes: shuffle([...range(0, colorFunctions.length)], RND, colorFunctions.length - 1),
  shape: shapes[RND.minmaxInt(0, shapes.length)],
}

export const COLORS = [...flatten(map((i) => colors[i], features.palettes))]

export const xFunction = transformer[features.x as keyof typeof transformer]
export const yFunction = transformer[features.y as keyof typeof transformer]
export const sFunction = transformer[features.attractorStrength as keyof typeof transformer]
export const kFunction = transformer[features.kick as keyof typeof transformer]

export const distributorFunction: distributeFn<any> = DEBUG_VIEW
  ? traverseRowWise
  : distributor[features.distributor as keyof typeof distributor]
export const traverserFunction = traverser[features.traverser as keyof typeof traverser]

export const fills = features.fills.map((i) => colorFunctions[i])
export const strokes = features.strokes.map((i) => colorFunctions[i])

export const IMAGE_SIZE = 4096
export const CAPTURE_SIZE = DEBUG ? 1280 : 2048
