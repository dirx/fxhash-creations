import type { IRandom } from '@thi.ng/random/api'

export type distributeFn<T> = (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
  orderFn: orderFn,
) => Generator<T, void, unknown>
export type traverseFn<T> = (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
  orderFn: orderFn,
) => Generator<T, void, unknown>
export type traverseCallback<T> = (x: number, y: number) => T
export type orderFn = (gridSizeX: number, gridSizeY: number) => Generator<[number, number, number], void, unknown>

export function * distributeFermatsSpiral<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
  orderFn: orderFn,
): Generator<T, void, unknown> {
  const total = gridSizeX * gridSizeY
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ≈ 2.39996 rad

  for (let [i, _x, _y] of orderFn(gridSizeX, gridSizeY)) {
    const r = Math.sqrt(i / total)
    const theta = i * goldenAngle
    const x = 0.5 + 0.5 * r * Math.cos(theta)
    const y = 0.5 + 0.5 * r * Math.sin(theta)
    yield fn(x * gridSizeX, y * gridSizeY)
  }
}

export function * distributeFibonacciLattice2D<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
  orderFn: orderFn,
): Generator<T, void, unknown> {
  const count = gridSizeX * gridSizeY
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  const angleIncrement = 2 * Math.PI / goldenRatio

  for (let [i, _x, _y] of orderFn(gridSizeX, gridSizeY)) {
    const t = i + 0.5
    const z = 1 - (2 * t) / count
    const r = Math.sqrt(1 - z * z)
    const phi = angleIncrement * i

    const x3d = r * Math.cos(phi)
    const y3d = r * Math.sin(phi)

    // orthographic projection
    const x = (x3d + 1) / 2
    const y = (y3d + 1) / 2

    yield fn(x * gridSizeX, y * gridSizeY)
  }
}

export function * distributeSphericalSpiral2D<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
  orderFn: orderFn,
): Generator<T, void, unknown> {
  const count = gridSizeX * gridSizeY
  const turns = Math.sqrt(count + gridSizeX)

  for (let [i, _x, _y] of orderFn(gridSizeX, gridSizeY)) {
    const t = i / (count - 1)
    const theta = 2 * Math.PI * turns * t // azimuthal angle
    const phi = Math.acos(1 - 2 * t)       // polar angle

    const x3d = Math.sin(phi) * Math.cos(theta)
    // const y3d = Math.sin(phi) * Math.sin(theta)
    const z3d = Math.cos(phi)

    // orthographic projection from top (prevent central spiral)
    const x = (x3d + 1) / 2
    // const y = (y3d + 1) / 2
    const z = (z3d + 1) / 2

    yield fn(x * gridSizeX, z * gridSizeY)
  }
}

export function * distributeGeodesicSphere<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
  orderFn: orderFn,
): Generator<T, void, unknown> {
  type Vec2 = [number, number]
  type Vec3 = [number, number, number]

  const normalize: ([x, y, z]: Vec3) => Vec3 = ([x, y, z]: Vec3): Vec3 => {
    const len = Math.hypot(x, y, z)
    return [x / len, y / len, z / len]
  }

  const project = ([x, y, z]: Vec3): Vec2 => [(x + 1) / 2, (y + 1) / 2]

  const t = (1 + Math.sqrt(5)) / 2
  const vertices: Vec3[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((v) => normalize(v as Vec3))

  const faces: Vec3[] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ]

  const subdivide = (a: Vec3, b: Vec3, c: Vec3, n: number): Vec3[] => {
    const points: Vec3[] = []
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= i; j++) {
        const u = i / n
        const v = j / n
        const w = 1 - u
        const p: Vec3 = normalize([
          a[0] * w + b[0] * (u - v) + c[0] * v,
          a[1] * w + b[1] * (u - v) + c[1] * v,
          a[2] * w + b[2] * (u - v) + c[2] * v,
        ])
        points.push(p)
      }
    }
    return points
  }

  const seen = new Set<string>()
  const subdivisions = Math.max(1, Math.floor(Math.sqrt(gridSizeX * gridSizeY / 9))) // 9 gives similar numbers of points
  const points2D: Vec2[] = []

  for (const [i1, i2, i3] of faces) {
    const tris = subdivide(vertices[i1], vertices[i2], vertices[i3], subdivisions)
    for (const point of tris) {
      const key = point.map(v => v.toFixed(4)).join(',')
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      points2D.push(project(point))
    }
  }

  for (let [i, _x, _y] of orderFn(gridSizeX, gridSizeY)) {
    const index = Math.floor(i * points2D.length / (gridSizeX * gridSizeY))
    const [x, y] = points2D[index % points2D.length]
    yield fn(x * gridSizeX, y * gridSizeY)
  }
}

export function * traverseTriangleBarycentricGrid<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
): Generator<T, void, unknown> {
  for (let i = 0; i <= gridSizeX; i++) {
    for (let j = 0; j <= gridSizeY; j++) {
      const u = i / gridSizeX
      const v = j / gridSizeY
      // outside?
      if (u + v > 1) {
        continue
      }

      const w = 1 - u - v

      // Vertices A, B, C of an equilateral triangle
      const A = [0, 0]
      const B = [1, 0]
      const C = [0.5, Math.sqrt(3) / 2]

      const x = u * A[0] + v * B[0] + w * C[0]
      const y = u * A[1] + v * B[1] + w * C[1]

      yield fn(x * gridSizeX, y * gridSizeY)
    }
  }
}

export function * traverseRowWise<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
): Generator<T, void, unknown> {
  for (let y = 0; y < gridSizeY; y++) {
    for (let x = 0; x < gridSizeX; x++) {
      yield fn(x, y)
    }
  }
}

export function * traverseColumnWise<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
): Generator<T, void, unknown> {
  for (let x = 0; x < gridSizeX; x++) {
    for (let y = 0; y < gridSizeY; y++) {
      yield fn(x, y)
    }
  }
}

export function * traverseZigZagRowWise<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
): Generator<T, void, unknown> {
  for (let y = 0; y < gridSizeY; y++) {
    if (y % 2 === 0) {
      for (let x = 0; x < gridSizeX; x++) {
        yield fn(x, y)
      }
    } else {
      for (let x = gridSizeX - 1; x >= 0; x--) {
        yield fn(x, y)
      }
    }
  }
}

export function * traverseZigZagColumnWise<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
): Generator<T, void, unknown> {
  for (let x = 0; x < gridSizeX; x++) {
    if (x % 2 === 0) {
      for (let y = 0; y < gridSizeY; y++) {
        yield fn(x, y)
      }
    } else {
      for (let y = gridSizeY - 1; y >= 0; y--) {
        yield fn(x, y)
      }
    }
  }
}

export function * traverseDiagonal<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
): Generator<T, void, unknown> {
  const maxSum = gridSizeX + gridSizeY - 2

  for (let sum = 0; sum <= maxSum; sum++) {
    for (let x = 0; x <= sum; x++) {
      const y = sum - x
      if (x < gridSizeX && y < gridSizeY) {
        yield fn(x, y)
      }
    }
  }
}

export function * traverseSpiralFromCenter<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
): Generator<T, void, unknown> {
  const seen = new Set<string>()
  const total = gridSizeX * gridSizeY
  const centerX = Math.floor(gridSizeX / 2)
  const centerY = Math.floor(gridSizeY / 2)

  let x = centerX, y = centerY
  let dx = 0, dy = -1
  let steps = 1, stepCount = 0, layer = 1

  while (seen.size < total) {
    if (x >= 0 && x < gridSizeX && y >= 0 && y < gridSizeY) {
      const key = `${x},${y}`
      if (!seen.has(key)) {
        seen.add(key)
        yield fn(x, y)
      }
    }

    x += dx
    y += dy
    stepCount++

    if (stepCount === steps) {
      stepCount = 0
      ;[dx, dy] = [-dy, dx] // rechts drehen
      if (dy === 0) {
        layer++
        steps = layer
      }
    }
  }
}

export function * traverseSpiralFromEdge<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
): Generator<T, void, unknown> {
  let top = 0, bottom = gridSizeY - 1
  let left = 0, right = gridSizeX - 1
  const total = gridSizeX * gridSizeY
  const seen = new Set<string>()

  while (seen.size < total) {
    for (let x = left; x <= right; x++) {
      const key = `${x},${top}`
      if (!seen.has(key)) {
        seen.add(key)
        yield fn(x, top)
      }
    }
    top++

    for (let y = top; y <= bottom; y++) {
      const key = `${right},${y}`
      if (!seen.has(key)) {
        seen.add(key)
        yield fn(right, y)
      }
    }
    right--

    for (let x = right; x >= left; x--) {
      const key = `${x},${bottom}`
      if (!seen.has(key)) {
        seen.add(key)
        yield fn(x, bottom)
      }
    }
    bottom--

    for (let y = bottom; y >= top; y--) {
      const key = `${left},${y}`
      if (!seen.has(key)) {
        seen.add(key)
        yield fn(left, y)
      }
    }
    left++
  }
}

export function * traverseHexGrid<T> (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
): Generator<T, void, unknown> {
  const dy = Math.sqrt(3) / 2

  for (let q = 0; q < gridSizeX; q++) {
    for (let r = 0; r < gridSizeY; r++) {
      const x = q + (r % 2) * 0.5
      const y = r * dy
      yield fn(x, y / dy)
    }
  }
}

export function createTraverseBFS<T> (
  rnd: IRandom,
): (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
) => Generator<T, void, unknown> {
  return function * traverseBFS (
    fn: traverseCallback<T>,
    gridSizeX: number,
    gridSizeY: number,
  ): Generator<T, void, unknown> {
    const seen = new Set<string>()
    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0],  // right, down, left, top
    ]

    // random start
    let startX = rnd.minmaxInt(0, gridSizeX - 1)
    let startY = rnd.minmaxInt(0, gridSizeY - 1)

    const queue: [number, number][] = [[startX, startY]]
    seen.add(`${startX},${startY}`)

    while (queue.length > 0) {
      const [x, y] = queue.shift()! // get first
      yield fn(x, y)

      // add neighbor points
      for (const [dx, dy] of directions) {
        const nx = x + dx
        const ny = y + dy

        // valid and not yet seen?
        if (nx >= 0 && nx < gridSizeX && ny >= 0 && ny < gridSizeY && !seen.has(`${nx},${ny}`)) {
          queue.push([nx, ny])
          seen.add(`${nx},${ny}`)
        }
      }
    }
  }
}

export function createTraversekDFS<T> (
  rnd: IRandom,
): (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
) => Generator<T, void, unknown> {
  return function * traverseDFS (
    fn: traverseCallback<T>,
    gridSizeX: number,
    gridSizeY: number,
  ): Generator<T, void, unknown> {
    const seen = new Set<string>()
    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0],  // right, down, left, top
    ]

    // random start
    let startX = rnd.minmaxInt(0, gridSizeX - 1)
    let startY = rnd.minmaxInt(0, gridSizeY - 1)
    const stack: [number, number][] = [[startX, startY]]
    seen.add(`${startX},${startY}`)

    while (stack.length > 0) {
      const [x, y] = stack.pop()! // get last

      yield fn(x, y)

      // add neighbor points
      for (const [dx, dy] of directions) {
        const nx = x + dx
        const ny = y + dy

        // valid and not yet seen?
        if (nx >= 0 && nx < gridSizeX && ny >= 0 && ny < gridSizeY && !seen.has(`${nx},${ny}`)) {
          stack.push([nx, ny])
          seen.add(`${nx},${ny}`)
        }
      }
    }
  }
}

export function createTraverseRandom<T> (
  rnd: IRandom,
): (
  fn: traverseCallback<T>,
  gridSizeX: number,
  gridSizeY: number,
) => Generator<T, void, unknown> {
  return function * traverseRandom (
    fn: traverseCallback<T>,
    gridSizeX: number,
    gridSizeY: number,
  ): Generator<T, void, unknown> {
    const unvisited: [number, number][] = []

    // prepare list of points
    for (let x = 0; x < gridSizeX; x++) {
      for (let y = 0; y < gridSizeY; y++) {
        unvisited.push([x, y])
      }
    }

    // yield random points
    while (unvisited.length > 0) {
      // Einen zufälligen Punkt aus der Liste wählen
      const randomIndex = rnd.minmaxInt(0, unvisited.length - 1)
      const [x, y] = unvisited.splice(randomIndex, 1)[0]  // Entfernt und gibt den Punkt zurück

      // Punkt verarbeiten
      yield fn(x, y)
    }
  }
}

export function * rowWise (
  gridSizeX: number,
  gridSizeY: number,
): Generator<[number, number, number], void, unknown> {
  yield * traverseRowWise((x, y) => [y * gridSizeX + x, x, y], gridSizeX, gridSizeY)
}

export function * columnWise (
  gridSizeX: number,
  gridSizeY: number,
): Generator<[number, number, number], void, unknown> {
  yield * traverseColumnWise((x, y) => [y * gridSizeX + x, x, y], gridSizeX, gridSizeY)
}

export function * zigZagRowWise (
  gridSizeX: number,
  gridSizeY: number,
): Generator<[number, number, number], void, unknown> {
  yield * traverseZigZagRowWise((x, y) => [y * gridSizeX + x, x, y], gridSizeX, gridSizeY)
}

export function * zigZagColumnWise (
  gridSizeX: number,
  gridSizeY: number,
): Generator<[number, number, number], void, unknown> {
  yield * traverseZigZagColumnWise((x, y) => [y * gridSizeX + x, x, y], gridSizeX, gridSizeY)
}

export function * diagonal (
  gridSizeX: number,
  gridSizeY: number,
): Generator<[number, number, number], void, unknown> {
  yield * traverseDiagonal((x, y) => [y * gridSizeX + x, x, y], gridSizeX, gridSizeY)
}

export function createBFS (
  rnd: IRandom,
): (
  gridSizeX: number,
  gridSizeY: number,
) => Generator<[number, number, number], void, unknown> {
  const walkBFS = createTraverseBFS<[number, number, number]>(rnd)
  return function * bfs (
    gridSizeX: number,
    gridSizeY: number,
  ): Generator<[number, number, number], void, unknown> {
    yield * walkBFS((x, y) => [y * gridSizeX + x, x, y], gridSizeX, gridSizeY)
  }
}

export function createDFS (
  rnd: IRandom,
): (
  gridSizeX: number,
  gridSizeY: number,
) => Generator<[number, number, number], void, unknown> {
  const walkDFS = createTraversekDFS<[number, number, number]>(rnd)
  return function * dfs (
    gridSizeX: number,
    gridSizeY: number,
  ): Generator<[number, number, number], void, unknown> {
    yield * walkDFS((x, y) => [y * gridSizeX + x, x, y], gridSizeX, gridSizeY)
  }
}

export function createRandom (
  rnd: IRandom,
): (
  gridSizeX: number,
  gridSizeY: number,
) => Generator<[number, number, number], void, unknown> {
  const walkRandom = createTraverseRandom<[number, number, number]>(rnd)
  return function * random (
    gridSizeX: number,
    gridSizeY: number,
  ): Generator<[number, number, number], void, unknown> {
    yield * walkRandom((x, y) => [y * gridSizeX + x, x, y], gridSizeX, gridSizeY)
  }
}
