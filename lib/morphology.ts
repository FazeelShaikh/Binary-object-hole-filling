export type Connectivity = 4 | 8

export interface FillResult {
  filled: Uint8Array
  holes: Uint8Array
  kept: Uint8Array
  depth: Int32Array
  iterations: number
  holeCount: number
  keptCount: number
  holeArea: number
  objectCount: number
  holeSizes: number[]
}

const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]
const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]]

export function toBinary(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
  invert: boolean,
): Uint8Array {
  const n = width * height
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    const gray = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2]
    const dark = gray < threshold
    out[i] = (invert ? !dark : dark) ? 1 : 0
  }
  return out
}

/**
 * Morphological reconstruction by dilation, restricted to the complement A^c:
 *   X_0 = border pixels of A^c
 *   X_k = (X_{k-1} ⊕ B) ∩ A^c   until X_k = X_{k-1}
 * Implemented as a breadth-first expansion so each BFS level equals one
 * dilation step. `depth` records the step at which each pixel was reached.
 */
function reconstructBackground(
  bin: Uint8Array,
  width: number,
  height: number,
  connectivity: Connectivity,
) {
  const n = width * height
  const depth = new Int32Array(n).fill(-1)
  const queue = new Int32Array(n)
  let head = 0
  let tail = 0

  const seed = (i: number) => {
    if (bin[i] === 0 && depth[i] === -1) {
      depth[i] = 0
      queue[tail++] = i
    }
  }
  for (let x = 0; x < width; x++) {
    seed(x)
    seed((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    seed(y * width)
    seed(y * width + width - 1)
  }

  const nb = connectivity === 4 ? N4 : N8
  let maxDepth = 0
  while (head < tail) {
    const p = queue[head++]
    const px = p % width
    const py = (p - px) / width
    const d = depth[p] + 1
    for (const [dx, dy] of nb) {
      const nx = px + dx
      const ny = py + dy
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const q = ny * width + nx
      if (bin[q] === 0 && depth[q] === -1) {
        depth[q] = d
        if (d > maxDepth) maxDepth = d
        queue[tail++] = q
      }
    }
  }
  return { depth, iterations: maxDepth }
}

function labelComponents(
  mask: Uint8Array,
  width: number,
  height: number,
  connectivity: Connectivity,
) {
  const n = width * height
  const labels = new Int32Array(n)
  const sizes: number[] = []
  const queue = new Int32Array(n)
  const nb = connectivity === 4 ? N4 : N8
  let current = 0

  for (let s = 0; s < n; s++) {
    if (mask[s] === 0 || labels[s] !== 0) continue
    current++
    let head = 0
    let tail = 0
    queue[tail++] = s
    labels[s] = current
    let size = 0
    while (head < tail) {
      const p = queue[head++]
      size++
      const px = p % width
      const py = (p - px) / width
      for (const [dx, dy] of nb) {
        const nx = px + dx
        const ny = py + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const q = ny * width + nx
        if (mask[q] === 1 && labels[q] === 0) {
          labels[q] = current
          queue[tail++] = q
        }
      }
    }
    sizes.push(size)
  }
  return { labels, sizes }
}

export function fillHoles(
  bin: Uint8Array,
  width: number,
  height: number,
  connectivity: Connectivity,
  maxHoleArea: number,
): FillResult {
  const n = width * height
  const { depth, iterations } = reconstructBackground(bin, width, height, connectivity)

  const candidates = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    if (bin[i] === 0 && depth[i] === -1) candidates[i] = 1
  }

  // Holes are regions of the complement; they connect through the opposite
  // connectivity of the foreground, so label them with the dual neighbourhood.
  const dual: Connectivity = connectivity === 4 ? 8 : 4
  const { labels, sizes } = labelComponents(candidates, width, height, dual)

  const holes = new Uint8Array(n)
  const kept = new Uint8Array(n)
  const filled = new Uint8Array(bin)
  let holeArea = 0
  let holeCount = 0
  let keptCount = 0
  const holeSizes: number[] = []

  sizes.forEach((size, idx) => {
    if (size <= maxHoleArea) {
      holeCount++
      holeArea += size
      holeSizes.push(size)
    } else {
      keptCount++
    }
  })

  for (let i = 0; i < n; i++) {
    const l = labels[i]
    if (l === 0) continue
    if (sizes[l - 1] <= maxHoleArea) {
      holes[i] = 1
      filled[i] = 1
    } else {
      kept[i] = 1
    }
  }

  const objectCount = labelComponents(bin, width, height, connectivity).sizes.length

  return {
    filled,
    holes,
    kept,
    depth,
    iterations,
    holeCount,
    keptCount,
    holeArea,
    objectCount,
    holeSizes: holeSizes.sort((a, b) => b - a),
  }
}
