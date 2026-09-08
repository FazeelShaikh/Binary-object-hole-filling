'use client'

import { useEffect, useRef } from 'react'

interface PixelCanvasProps {
  pixels: Uint8ClampedArray
  width: number
  height: number
  label: string
  step: string
  caption?: string
  emphasis?: boolean
  onCanvas?: (canvas: HTMLCanvasElement | null) => void
}

export function PixelCanvas({
  pixels,
  width,
  height,
  label,
  step,
  caption,
  emphasis,
  onCanvas,
}: PixelCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.putImageData(new ImageData(pixels, width, height), 0, 0)
    onCanvas?.(canvas)
  }, [pixels, width, height, onCanvas])

  return (
    <figure
      className={`flex flex-col gap-2 rounded-md border bg-card p-3 ${
        emphasis ? 'border-primary/60 ring-1 ring-primary/30' : ''
      }`}
    >
      <figcaption className="flex items-baseline justify-between gap-2 font-mono text-xs">
        <span className="flex items-baseline gap-2">
          <span className="text-muted-foreground">{step}</span>
          <span className="font-medium text-foreground">{label}</span>
        </span>
        <span className="text-muted-foreground">
          {width}×{height}
        </span>
      </figcaption>
      <div className="grid-bg flex items-center justify-center overflow-hidden rounded-sm border">
        <canvas
          ref={ref}
          width={width}
          height={height}
          role="img"
          aria-label={label}
          className="h-auto max-h-[360px] w-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      {caption && <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>}
    </figure>
  )
}
