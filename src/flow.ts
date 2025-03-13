import { add, normalize, type ReadonlyVec } from '@thi.ng/vectors'
import type { TransformVertexFn } from '@thi.ng/geom'

export type Attractor = { x: number, y: number, s: number }

export const flowVec = (attractors: Attractor[]) => ([x, y]: number[]) => {
  let field = [0, 0]

  attractors.forEach(attractor => {
    const dx = attractor.x - x
    const dy = attractor.y - y
    const distance = Math.sqrt(dx * dx + dy * dy) + 1
    const s = (attractor.s / distance)
    add(field, field, [dx / distance * s, dy / distance * s])
  })

  return normalize(null, field)
}

export const flowStrength = (attractors: Attractor[]) => ([x, y]: number[]) => {
  let s = 0

  attractors.forEach(attractor => {
    const dx = attractor.x - x
    const dy = attractor.y - y
    const distance = Math.sqrt(dx * dx + dy * dy) + 1
    s += (attractor.s / distance)
  })

  return normalize(null, [1, s])[1]
}

export const flow = (attractors: Attractor[]) => {
  const fn = flowVec(attractors)
  return ([x, y]: ReadonlyVec) => add(null, [x, y], fn([x, y]))
}

export const flowMat = (attractors: Attractor[]): TransformVertexFn => {
  const fn = flowVec(attractors)
  return ([x, y]: ReadonlyVec) => ([
    1, 0,
    0, 1,
    ...fn([x, y]),
  ])
}
