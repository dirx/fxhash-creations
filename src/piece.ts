import {
  asSvg,
  type Attribs,
  bounds,
  Circle,
  circle,
  extra,
  group,
  Polygon,
  polygon,
  Rect,
  rect,
  scale,
  svgDoc,
  text,
  translate,
} from '@thi.ng/geom'
import { filter, map, repeatedly } from '@thi.ng/transducers'
import {
  COLOR_BACKGROUND,
  COLOR_LIGHT,
  COLORS,
  DEBUG_VIEW,
  distributorFunction,
  features,
  fills,
  IMAGE_SIZE,
  kFunction,
  sFunction,
  SHAPE_CIRCLE,
  SHAPE_HEXAGON,
  SHAPE_QUAD,
  strokes,
  traverserFunction,
  xFunction,
  yFunction,
} from './settings'
import packageJson from './../package.json'
import { type Attractor, flowStrength, flowVec } from './flow'
import { oklch, srgb } from '@thi.ng/color'
import { colorsSize } from './colors'
import type { Vec } from '@thi.ng/vectors'

const off = oklch(srgb(COLORS[0]))
const xOff = off.l
const yOff = off.c
const sOff = off.h

const attractors: Attractor[] = [
  ...repeatedly(
    (i) => ({
      x: (xFunction(i / features.attractors, kFunction(i / features.attractors * 2 - 1, xOff))) * features.gridSize,
      y: (yFunction(i / features.attractors, kFunction(i / features.attractors * 2 - 1, yOff))) * features.gridSize,
      s: (sFunction(i / features.attractors, kFunction(i / features.attractors * 2 - 1, sOff)) * 2 - 1) * colorsSize,
    }),
    features.attractors,
  ),
]

const shapes = group(
  {
    'stroke': 'none',
    'fill': 'none',
  },
  [
    ...filter(
      (x: any) => x !== null,
      distributorFunction((x: number, y: number): Rect | Circle | Polygon | null => {
          const s = flowStrength(attractors)([x, y])
          const [xs, ys] = flowVec(attractors)([x, y])
          const xso = xFunction(xs, xOff)
          const yso = yFunction(ys, yOff)
          const k = kFunction(s, sOff)
          const ci = Math.floor(k * COLORS.length * features.repeat) % COLORS.length
          const color = COLORS[ci]
          const fill = fills[Math.floor(fills.length * xso)]((xs > ys), color, s)
          const stroke = strokes[Math.floor(strokes.length * yso)]((xs > ys), color, s)
          const attr: Attribs = (fill === 'none' && stroke === 'none')
            ? {
              display: 'none',
            }
            : {
              'fill': fill,
              'stroke': stroke,
              'stroke-width': k + 1.682,
              'fill-opacity': xso * 0.682 + 0.328,
              'stroke-opacity': yso * 0.682 + 0.328,
            }

          if (features.shape === SHAPE_QUAD) {
            const points = [
              [x, y],
              [x, y + features.dotSize * 0.5 * xso],
              [x + features.dotSize * 0.5 * xso, y + features.dotSize * 0.5 * xso],
              [x + features.dotSize * 0.5 * xso, y],
            ]
            return polygon(points, attr)
          } else if (features.shape === SHAPE_CIRCLE) {
            return circle([x + features.dotSize * 0.2 * xso, y + features.dotSize * 0.2 * xso], features.dotSize * 0.4 * xso, attr)
          } else if (features.shape === SHAPE_HEXAGON) {
            const points: Vec[] = []
            for (let i = 0; i < 6; i++) {
              const angle = i * Math.PI / 3
              points.push([
                x + features.dotSize * 0.4 * xso * Math.cos(angle),
                y + features.dotSize * 0.4 * xso * Math.sin(angle),
              ])
            }
            return polygon(points, attr)
          }
          return null
        },
        features.gridSize,
        features.gridSize,
        traverserFunction,
      )),
    ...DEBUG_VIEW
      ? map((attractor) => {
        return circle([attractor.x, attractor.y], Math.abs(attractor.s),
          { fill: attractor.s > 0 ? 'red' : 'green', opacity: 0.2, stroke: 'none' })
      }, attractors)
      : [],
  ],
)

const shapesBounds = bounds(group({}, shapes))!
const backgroundBounds = bounds(group({}, shapes), Math.max(...shapesBounds.size) * 0.1)!

const scaledShapes = [
  rect(
    backgroundBounds.size[0] > backgroundBounds.size[1]
      ? [
        backgroundBounds.pos[0],
        backgroundBounds.pos[1] - (backgroundBounds.size[0] - backgroundBounds.size[1]) / 2,
      ]
      : [
        backgroundBounds.pos[0] - (backgroundBounds.size[1] - backgroundBounds.size[0]) / 2,
        backgroundBounds.pos[1],
      ],
    Math.max(...backgroundBounds.size),
    {
      fill: COLOR_BACKGROUND,
      stroke: 'none',
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
            fill: COLOR_LIGHT,
            stroke: 'none',
            'font-size': `${FONT_SIZE}`,
            'font-weight': fontWeight,
            'font-family': 'sans-serif',
            style: 'display:none',
          })),
    ],
  ),
)
