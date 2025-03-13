import { asSvg, bounds, circle, extra, group, rect, scale, svgDoc, text, transform, translate } from '@thi.ng/geom'
import { RND } from '@thi.ng/random-fxhash'
import { flatten, map, repeatedly, repeatedly2d } from '@thi.ng/transducers'
import { features, IMAGE_SIZE } from './settings'
import { rad } from '@thi.ng/math'
import packageJson from './../package.json'
import { type Attractor, flowMat, flowStrength } from './flow'
import { rotationAroundPoint23, skewX23 } from '@thi.ng/matrices'
import { colors } from './colors'

const DOT_SIZE = features.dotSize
const GRID = 1
const GRID_SIZE = features.gridSize
const COLORS = [...flatten(map((i) => colors[i], features.palettes))]
const rotate = (x: number, y: number, angle: number) => rotationAroundPoint23([], [x, y], rad(angle))

const skew = (angle: number) => skewX23([], rad(angle))

const attractors: Attractor[] = [
  ...repeatedly(
    () => ({
      x: RND.minmax(0, GRID_SIZE),
      y: RND.minmax(0, GRID_SIZE),
      s: RND.minmax(-1, 1),
    }),
    features.attractors,
  ),
]

const shapes = group(
  {
    __sdf: {
      combine: 'isect',
    },
  },
  [
    ...repeatedly2d((x, y) => {

        let c = Math.floor(flowStrength(attractors)([x, y]) * COLORS.length + COLORS.length / 2)
        const attr = {
          'id': `c${x * y}`,
          'fill': COLORS[c],
          'stroke': 'none',
          'stroke-width': `${RND.minmax(0.001, 0.05)}%`,
          'stroke-linecap': 'round',
          'filter': 'drop-shadow(2px 2px 4px rgb(0 0 0 / 0.4))',
          'stroke-dasharray': [...repeatedly(() => RND.minmaxInt(30, 60), RND.minmaxInt(4, 8))].join(' '),
          'paint-order': 'stroke',
        }

        return transform(circle([x, y], DOT_SIZE * 0.5, attr), flowMat(attractors)([x, y]))
      },
      GRID_SIZE,
      GRID_SIZE,
    ),
  ],
)

const backgroundBounds = bounds(group({}, shapes), GRID * 4)!

const scaledShapes = [
  rect(
    backgroundBounds.pos,
    backgroundBounds.size,
    {
      id: 'bg',
      fill: 'none',
      stroke: 'none',
      'stroke-width': 0,
    },
  ),
  shapes,
].map((shape) => translate(shape,
  [-backgroundBounds.pos[0], -backgroundBounds.pos[1]])).
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
      ].map(
        ([row, p, fontWeight]) => text([FONT_SIZE, row as number * FONT_SIZE],
          p, {
            fill: '#000000',
            stroke: 'none',
            'font-size': `${FONT_SIZE}`,
            'font-weight': fontWeight,
            'font-family': 'sans-serif',
            style: 'display:none',
          })),
    ],
  ),
)
