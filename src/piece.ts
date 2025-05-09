import { asSvg, bounds, Circle, circle, extra, group, Polygon, polygon, Rect, rect, scale, svgDoc, text, translate } from '@thi.ng/geom'
import { filter, map, repeatedly } from '@thi.ng/transducers'
import {
  COLOR_BACKGROUND,
  COLOR_LIGHT,
  COLORS,
  DEBUG_VIEW,
  features,
  fills,
  IMAGE_SIZE,
  kFunction,
  traverserFunction,
  sFunction,
  SHAPE_CIRCLE,
  SHAPE_HEXAGON,
  SHAPE_QUAD,
  strokes,
  distributorFunction,
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
          let s = flowStrength(attractors)([x, y])
          let [xs, ys] = flowVec(attractors)([x, y])
          let xso = xFunction(xs, xOff)
          let yso = yFunction(ys, yOff)
          let k = kFunction(s, sOff)
          let ci = Math.floor(k * COLORS.length * features.repeat) % COLORS.length
          let c = COLORS[ci]

          const attr = {
            'fill': fills[Math.floor(fills.length * xso)]((xs > ys), c, s),
            'stroke': strokes[Math.floor(strokes.length * yso)]((xs > ys), c, s),
            'stroke-width': k + 1.682,
            'fill-opacity': xso * 0.682 + 0.328,
            'stroke-opacity': yso * 0.682 + 0.328,
          }

          let shape = null
          if (features.shape === SHAPE_QUAD) {
            shape = rect([x, y], features.dotSize * 0.5 * xso, attr)
          } else if (features.shape === SHAPE_CIRCLE) {
            shape = circle([x + features.dotSize * 0.2 * xso, y + features.dotSize * 0.2 * xso], features.dotSize * 0.4 * xso, attr)
          } else if (features.shape === SHAPE_HEXAGON) {
            const hexagon: Vec[] = []
            for (let i = 0; i < 6; i++) {
              const angle = i * Math.PI / 3
              hexagon.push([
                x + features.dotSize * 0.4 * xso * Math.cos(angle),
                y + features.dotSize * 0.4 * xso * Math.sin(angle),
              ])
            }
            shape = polygon(hexagon, attr)
          }
          return shape
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
