export type SampleId = 'washers' | 'rings' | 'text' | 'nested' | 'noisy'

export const SAMPLES: { id: SampleId; label: string; hint: string }[] = [
  { id: 'washers', label: 'Photo', hint: 'Real washers and nuts' },
  { id: 'rings', label: 'Rings', hint: 'Discs with pinholes' },
  { id: 'text', label: 'Glyphs', hint: 'Letters with enclosed loops' },
  { id: 'nested', label: 'Nested', hint: 'Islands inside holes' },
  { id: 'noisy', label: 'Noisy', hint: 'Segmentation artefacts' },
]

export const SAMPLE_SIZE = 384

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function drawSample(ctx: CanvasRenderingContext2D, id: SampleId, size: number) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000000'
  const rand = seeded(7)

  if (id === 'rings') {
    const discs = [
      [80, 90, 58],
      [230, 75, 44],
      [310, 170, 52],
      [120, 230, 66],
      [250, 285, 50],
      [330, 320, 36],
    ]
    for (const [x, y, r] of discs) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#ffffff'
    for (const [x, y, r] of discs) {
      const holes = 1 + Math.floor(rand() * 4)
      for (let i = 0; i < holes; i++) {
        const a = rand() * Math.PI * 2
        const d = rand() * r * 0.5
        ctx.beginPath()
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 3 + rand() * r * 0.22, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    return
  }

  if (id === 'text') {
    ctx.font = 'bold 150px Arial, Helvetica, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText('ABO', size / 2, size * 0.32)
    ctx.fillText('8Rg', size / 2, size * 0.7)
    return
  }

  if (id === 'nested') {
    ctx.fillRect(40, 40, 200, 200)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(80, 80, 120, 120)
    ctx.fillStyle = '#000000'
    ctx.fillRect(110, 110, 60, 60)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(130, 130, 20, 20)

    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(300, 300, 70, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(300, 300, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(300, 300, 14, 0, Math.PI * 2)
    ctx.fill()

    // Open notch: a gap that touches the border so it is NOT a hole.
    ctx.fillRect(250, 30, 110, 110)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(280, 0, 40, 100)
    return
  }

  if (id === 'noisy') {
    const blobs = [
      [100, 110, 70],
      [270, 120, 55],
      [180, 280, 80],
      [320, 300, 45],
    ]
    for (const [x, y, r] of blobs) {
      ctx.beginPath()
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.15) {
        const rr = r * (0.85 + rand() * 0.3)
        const px = x + Math.cos(a) * rr
        const py = y + Math.sin(a) * rr
        if (a === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 260; i++) {
      const [x, y, r] = blobs[Math.floor(rand() * blobs.length)]
      const a = rand() * Math.PI * 2
      const d = rand() * r * 0.75
      const s = 1 + rand() * 4
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s)
    }
    return
  }
}

export function loadSample(id: SampleId): Promise<ImageData> {
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_SIZE
  canvas.height = SAMPLE_SIZE
  const ctx = canvas.getContext('2d')!

  if (id === 'washers') {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
        resolve(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE))
      }
      img.onerror = reject
      img.src = '/samples/washers.png'
    })
  }

  drawSample(ctx, id, SAMPLE_SIZE)
  return Promise.resolve(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE))
}

export function loadFile(file: File, maxSide = 512): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(ctx.getImageData(0, 0, w, h))
    }
    img.onerror = reject
    img.src = url
  })
}
