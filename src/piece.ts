import { asSvg, bounds, circle, equilateralTriangle, extra, group, rect, scale, svgDoc, text, transform, translate } from '@thi.ng/geom'
import { asPolygons, asSDF, sample2d } from '@thi.ng/geom-sdf'
import { mulV23, skewX23 } from '@thi.ng/matrices'
import { type ReadonlyVec } from '@thi.ng/vectors'
import { RND } from '@thi.ng/random-fxhash'
import { flatten, iterate, map, repeatedly } from '@thi.ng/transducers'
import { features, IMAGE_SIZE } from './settings'
import { rad } from '@thi.ng/math'
import { palettes } from './palettes'
import packageJson from './../package.json'

const GRID_BASE = 64
const GRID = GRID_BASE + features.gap

const colors = [
  ...flatten(
    map((i) => RND.probability(0.5) ? palettes[i] : palettes[i].reverse(), features.palettes),
  )]

const italicize = skewX23([], Math.tan(rad(features.italic)))
const shapes = group(
  {},
  [
    ...map(
      ([x, y, h, w]) => transform(rect([(x - h) * GRID, (y - w) * GRID], [h * GRID, w * GRID]), italicize),
      repeatedly(() => [RND.minmaxInt(0, 8), RND.minmaxInt(0, 8), RND.minmax(0.5, 1.5), 4], features.rects),
    ),
    ...map(
      ([x, y, r]) => circle(mulV23(null, italicize, [x * GRID, y * GRID]), r * GRID),
      repeatedly(() => [RND.minmaxInt(0, 8), RND.minmaxInt(0, 8), RND.minmax(0.5, 1.5)], features.circles),
    ),
    ...map(
      ([x, y, r]) => transform(equilateralTriangle([x * GRID, y * GRID], [(x + r) * GRID, (y + r) * GRID]), italicize),
      repeatedly(() => [RND.minmaxInt(0, 8), RND.minmaxInt(0, 8), RND.minmax(0.5, 1.5)], features.triangles),
    ),
  ],
)

const shapesBound = bounds(shapes, GRID_BASE * colors.length)!

const ripple = (freqX: number, ampX: number, freqY: number, ampY: number) =>
  ([x, y]: ReadonlyVec) => [
    x - ampY * Math.abs(Math.sin(y * freqY - Math.abs(Math.sin(x * freqX)))),
    y - ampX * Math.abs(Math.sin(x * freqX - Math.abs(Math.sin(y * freqY)))),
  ]

const sdfShapes = sample2d(
  asSDF(shapes),
  shapesBound,
  [features.resX, features.resY],
  ripple(
    features.freqX * 0.001, features.ampX,
    features.freqY * 0.001, features.ampY,
  ),
)

const contourOffsets = [...iterate((x, i) => x + 1 / colors.length * GRID_BASE * (2 ** RND.minmaxInt(0, 4)), 0, colors.length)]

const contours = colors.map(
  (fill, i) =>
    group({ fill: fill, id: `c${i}`, stroke: colors.at(-2), 'stroke-width': '0.05%' },
      asPolygons(
        sdfShapes,
        shapesBound,
        [features.resX, features.resY],
        [contourOffsets[i]],
        0.25),
    ),
)

const backgroundBounds = bounds(group({}, contours), GRID_BASE * 2)!

const scaledShapes = [
  rect(
    backgroundBounds.pos,
    backgroundBounds.size,
    { fill: colors.at(-1), 'stroke-width': 0, id: 'bg' },
  ),
  ...contours.reverse(),
].map((shape) => translate(shape, [-backgroundBounds.pos[0], -backgroundBounds.pos[1]])).
  map((shape) => scale(shape, IMAGE_SIZE / Math.max(...backgroundBounds.size)))

const imageBounds = bounds(group({}, scaledShapes))!
const FONT_SIZE = 0.012 * imageBounds.size[1]

export const piece = asSvg(
  svgDoc({ __margin: 0 },
    ...[
      extra(`<!-- ${packageJson.config.title}, ${packageJson.description} -->`),
      extra(`<!-- ${packageJson.author.name}, ${packageJson.author.url} -->`),
      extra(`<!-- ${packageJson.config.releasedAt}, ${packageJson.config.releasedOn} -->`),
      extra(`<!-- #${window.$fx.iteration}, ${window.$fx.hash}, ${window.$fx.minter} -->`),
      ...scaledShapes,
      ...[
        [2, `${packageJson.config.title}`, 'bold'],
        [4, `${packageJson.config.releasedAt}, ${packageJson.config.releasedOn}`, 'normal'],
        [6, `s = download as svg`, 'normal'],
        [7, `p = download as png`, 'normal'],
      ].map(([row, p, fontWeight]) => text([FONT_SIZE, row as number * FONT_SIZE], p, {
        fill: colors.at(-4),
        stroke: 'none',
        'font-size': `${FONT_SIZE}`,
        'font-weight': fontWeight,
        'font-family': 'sans-serif',
        style: `display: none`,
      })),
    ],
  ),
)
