import { asSvg, bounds, circle, equilateralTriangle, extra, group, rect, scale, svgDoc, text, transform, translate } from '@thi.ng/geom'
import { asPolygons, asSDF, sample2d } from '@thi.ng/geom-sdf'
import { mulV23 } from '@thi.ng/matrices'
import { RND } from '@thi.ng/random-fxhash'
import { iterate, map, repeatedly } from '@thi.ng/transducers'
import { features, IMAGE_SIZE } from './settings'
import { rad } from '@thi.ng/math'
import { css, mix, srgb } from '@thi.ng/color'
import packageJson from './../package.json'
import { rotation23 } from '@thi.ng/matrices/rotation'

const GRID_BASE = 1
const GRID = GRID_BASE + features.gap
const GRID_SIZE = RND.minmaxInt(8, 16)

const rotate = rotation23([], rad(features.angle))
const shapes = group(
  {
    __sdf: {
      combine: 'isect',
    },
  },
  [
    ...map(
      ([x, y, h, w]) => transform(
        rect([(x - h) * GRID, (y - w) * GRID], [h * GRID, w * GRID]), rotate),
      repeatedly(() => [
        RND.minmax(0, GRID_SIZE),
        RND.minmax(0, GRID_SIZE),
        RND.minmax(GRID_SIZE * 0.01, GRID_SIZE * 0.2),
        RND.minmax(GRID_SIZE * 0.01, GRID_SIZE * 0.2)], features.rects),
    ),
    ...map(
      ([x, y, r]) => circle(mulV23(null, rotate, [x * GRID, y * GRID]),
        r * GRID),
      repeatedly(
        () => [RND.minmax(0, GRID_SIZE), RND.minmax(0, GRID_SIZE), RND.minmax(GRID_SIZE * 0.01, GRID_SIZE * 0.2)],
        features.circles),
    ),
    ...map(
      ([x, y, r]) => transform(equilateralTriangle([x * GRID, y * GRID],
        [(x + r) * GRID, (y + r) * GRID]), rotate),
      repeatedly(
        () => [RND.minmax(0, GRID_SIZE), RND.minmax(0, GRID_SIZE), RND.minmax(GRID_SIZE * 0.01, GRID_SIZE * 0.2)],
        features.triangles),
    ),
  ],
)

const shapesBound = bounds(shapes, GRID * features.contours)!

const sdfShapes = sample2d(
  asSDF(shapes),
  shapesBound,
  [features.resX, features.resY],
)

const contourOffsets = [
  ...iterate(
    (x, i) => x + 1 / features.contours * GRID_BASE * (2 ** RND.minmaxInt(0, 5)), 0,
    features.contours)]

let contours = [
  ...repeatedly((i) => group({
      fill: RND.probability(0.382) ? `url(#pattern${RND.minmaxInt(0, 10)})` : (RND.probability(0.382) ? features.background : 'none'),
      id: `c${i}`,
      stroke: css(
        mix([], srgb(RND.probability(0.382) ? (RND.probability(0.382) ? features.accent : '#ffffff') : '#000000'), srgb(features.background),
          RND.minmax(0.0, 0.5))),
      'stroke-width': `${RND.minmax(0.001, 0.2)}%`,
      'stroke-dasharray': [...repeatedly(() => RND.minmaxInt(1, 64), RND.minmaxInt(0, 4))].join(' '),
      'stroke-linecap': 'round',
      'paint-order': 'stroke',
    },
    asPolygons(
      sdfShapes,
      shapesBound,
      [features.resX, features.resY],
      [contourOffsets[i]],
      0.25,
    ),
  ), features.contours)]

const backgroundBounds = bounds(group({}, contours), GRID_BASE * 4)!

const scaledShapes = [
  rect(
    backgroundBounds.pos,
    backgroundBounds.size,
    { fill: features.background, 'stroke-width': 0, id: 'bg' },
  ),
  ...contours.reverse(),
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
      ...repeatedly((i) => {
        const height = RND.minmaxInt(8, 16)
        const dashArray = [...repeatedly(() => RND.minmaxInt(1, 4), RND.minmaxInt(2, 8))].join(' ')
        const rotate = RND.minmaxInt(0, 90)
        const stroke = css(
          mix([], srgb(RND.probability(0.328) ? (RND.probability(0.382) ? features.accent : '#ffffff') : '#000000'), srgb(features.background),
            RND.minmax(0.0, 0.5)))
        const strokeWidth = RND.minmax(0.001, 0.2)
        return extra(
          `<pattern id="pattern${i}" x="0" y="0" width="5000" height="${height}" patternUnits="userSpaceOnUse" stroke-dasharray="${dashArray}" stroke-width="${strokeWidth}%" patternTransform="rotate(${rotate})" ><path d="M0,0 L4980,0" stroke="${stroke}" fill="none" /></pattern>`,
        )
      }, 10),
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
