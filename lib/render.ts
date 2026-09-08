import type { FillResult } from './morphology'

type RGB = [number, number, number]

export const PALETTE = {
  object: [26, 37, 64] as RGB,
  background: [246, 247, 250] as RGB,
  hole: [245, 158, 11] as RGB,
  kept: [200, 205, 218] as RGB,
  front: [58, 110, 255] as RGB,
}

function paint(out: Uint8ClampedArray, i: number, c: RGB) {
  const o = i * 4
  out[o] = c[0]
  out[o + 1] = c[1]
  out[o + 2] = c[2]
  out[o + 3] = 255
}

export function renderGray(rgba: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length)
  for (let i = 0; i < rgba.length; i += 4) {
    const g = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]
    out[i] = out[i + 1] = out[i + 2] = g
    out[i + 3] = 255
  }
  return out
}

export function renderBinary(bin: Uint8Array): Uint8ClampedArray {
  const out = new Uint8ClampedArray(bin.length * 4)
  for (let i = 0; i < bin.length; i++) {
    paint(out, i, bin[i] ? PALETTE.object : PALETTE.background)
  }
  return out
}

/**
 * Shows reconstruction progress at a given step. Pixels of the complement not
 * yet reached by the marker are drawn as hole candidates; the current
 * wavefront is highlighted.
 */
export function renderStep(
  bin: Uint8Array,
  result: FillResult,
  step: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(bin.length * 4)
  const final = step >= result.iterations
  for (let i = 0; i < bin.length; i++) {
    if (bin[i]) {
      paint(out, i, PALETTE.object)
      continue
    }
    const d = result.depth[i]
    if (d === -1) {
      paint(out, i, result.kept[i] ? PALETTE.kept : PALETTE.hole)
    } else if (d > step) {
      paint(out, i, PALETTE.hole)
    } else if (!final && d === step) {
      paint(out, i, PALETTE.front)
    } else {
      paint(out, i, PALETTE.background)
    }
  }
  return out
}
