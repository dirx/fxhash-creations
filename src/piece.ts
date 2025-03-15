import { asSvg, bounds, circle, extra, group, rect, scale, svgDoc, text, transform, translate } from '@thi.ng/geom'
import { RND } from '@thi.ng/random-fxhash'
import { map, repeatedly, repeatedly2d } from '@thi.ng/transducers'
import { COLORS, DEBUG_VIEW, features, IMAGE_SIZE } from './settings'
import packageJson from './../package.json'
import { type Attractor, flowMat, flowStrength } from './flow'
import { css, oklch, srgb } from '@thi.ng/color'

const attractors: Attractor[] = [
  ...repeatedly(
    () => ({
      x: RND.minmax(0, features.gridSize),
      y: RND.minmax(0, features.gridSize),
      s: RND.minmax(-3, 3),
    }),
    features.attractors,
  ),
]

const shapes = group(
  {
    'stroke': 'none',
  },
  [
    ...repeatedly2d((x, y) => {
        let length = COLORS.length / 2
        let oc = COLORS[Math.floor(flowStrength(attractors)([x, y]) * length + length)]
        let c = oc
        if (RND.probability(0.1)) {
          let okc = oklch(oc)
          okc.c += RND.minmax(-0.05, 0.05)
          c = css(srgb(okc))
        }

        const attr = {
          'fill': c,
          'filter': 'drop-shadow(2px 2px 4px rgb(0 0 0 / 0.4))',
        }

        return transform(circle([x, y], features.dotSize * 0.5, attr), flowMat(attractors)([x, y]))
      },
      features.gridSize,
      features.gridSize,
    ),
    ...DEBUG_VIEW
      ? map((attractor) => {
        return circle([attractor.x, attractor.y], Math.abs(attractor.s),
          { fill: attractor.s > 0 ? 'red' : 'green', opacity: 0.2, stroke: 'none' })
      }, attractors)
      : [],
  ],
)

const backgroundBounds = bounds(group({}, shapes), 4)!

const scaledShapes = [
  rect(
    backgroundBounds.pos,
    backgroundBounds.size,
    {
      fill: 'none',
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
