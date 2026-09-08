'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fillHoles, toBinary, type Connectivity } from '@/lib/morphology'
import { renderBinary, renderGray, renderStep } from '@/lib/render'
import { loadFile, loadSample, type SampleId } from '@/lib/samples'
import { Controls } from './controls'
import { PixelCanvas } from './pixel-canvas'
import { Stats } from './stats'
import { AlgorithmNote } from './algorithm-note'

export function HoleFillingLab() {
  const [source, setSource] = useState<ImageData | null>(null)
  const [sample, setSample] = useState<SampleId | null>('washers')
  const [threshold, setThreshold] = useState(128)
  const [invert, setInvert] = useState(false)
  const [connectivity, setConnectivity] = useState<Connectivity>(4)
  const [maxHolePct, setMaxHolePct] = useState(100)
  const [step, setStep] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const filledCanvas = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!sample) return
    let cancelled = false
    loadSample(sample).then((img) => {
      if (!cancelled) setSource(img)
    })
    return () => {
      cancelled = true
    }
  }, [sample])

  const width = source?.width ?? 0
  const height = source?.height ?? 0

  const binary = useMemo(
    () => (source ? toBinary(source.data, width, height, threshold, invert) : null),
    [source, width, height, threshold, invert],
  )

  const result = useMemo(() => {
    if (!binary) return null
    const maxArea = maxHolePct >= 100 ? Infinity : Math.round((maxHolePct / 100) * width * height)
    return fillHoles(binary, width, height, connectivity, maxArea)
  }, [binary, width, height, connectivity, maxHolePct])

  const foregroundArea = useMemo(() => {
    if (!binary) return 0
    let n = 0
    for (let i = 0; i < binary.length; i++) n += binary[i]
    return n
  }, [binary])

  const grayPixels = useMemo(() => (source ? renderGray(source.data) : null), [source])
  const binaryPixels = useMemo(() => (binary ? renderBinary(binary) : null), [binary])
  const filledPixels = useMemo(() => (result ? renderBinary(result.filled) : null), [result])

  const effectiveStep = result ? (step === null ? result.iterations : Math.min(step, result.iterations)) : 0
  const stepPixels = useMemo(
    () => (binary && result ? renderStep(binary, result, effectiveStep) : null),
    [binary, result, effectiveStep],
  )

  useEffect(() => {
    if (!playing || !result) return
    const id = window.setInterval(() => {
      setStep((s) => {
        const cur = s === null ? 0 : s
        const inc = Math.max(1, Math.round(result.iterations / 120))
        if (cur + inc >= result.iterations) {
          setPlaying(false)
          return null
        }
        return cur + inc
      })
    }, 40)
    return () => window.clearInterval(id)
  }, [playing, result])

  const onSample = (id: SampleId) => {
    setSample(id)
    setStep(null)
    setPlaying(false)
    setInvert(false)
  }

  const onFile = async (file: File) => {
    const img = await loadFile(file)
    setSample(null)
    setSource(img)
    setStep(null)
    setPlaying(false)
  }

  const onDownload = () => {
    const c = filledCanvas.current
    if (!c) return
    const a = document.createElement('a')
    a.href = c.toDataURL('image/png')
    a.download = 'filled-mask.png'
    a.click()
  }

  const captureFilled = useCallback((c: HTMLCanvasElement | null) => {
    filledCanvas.current = c
  }, [])

  const isFinal = result ? effectiveStep >= result.iterations : true

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Controls
          sample={sample}
          onSample={onSample}
          onFile={onFile}
          threshold={threshold}
          onThreshold={setThreshold}
          invert={invert}
          onInvert={setInvert}
          connectivity={connectivity}
          onConnectivity={setConnectivity}
          maxHolePct={maxHolePct}
          onMaxHolePct={setMaxHolePct}
          onDownload={onDownload}
          canDownload={!!result}
        />

        <div className="flex flex-col gap-4">
          {source && grayPixels && binaryPixels && stepPixels && filledPixels && result ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <PixelCanvas
                  step="01"
                  label="Input f(x,y)"
                  pixels={grayPixels}
                  width={width}
                  height={height}
                  caption="Grayscale intensity image."
                />
                <PixelCanvas
                  step="02"
                  label={`Binary A = f ${invert ? '≥' : '<'} ${threshold}`}
                  pixels={binaryPixels}
                  width={width}
                  height={height}
                  caption="Segmented objects (dark). Enclosed background pockets are the holes we want to remove."
                />
                <PixelCanvas
                  step="03"
                  label={isFinal ? 'Holes H = A^c - X' : `Reconstruction X_${effectiveStep}`}
                  pixels={stepPixels}
                  width={width}
                  height={height}
                  emphasis={!isFinal}
                  caption={
                    isFinal
                      ? 'Amber = detected holes (unreached complement). Grey = holes kept open by the area limit.'
                      : 'Blue wavefront = current dilation X_k spreading inward from the border. Amber = not yet reached.'
                  }
                />
                <PixelCanvas
                  step="04"
                  label="Filled A OR H"
                  pixels={filledPixels}
                  width={width}
                  height={height}
                  onCanvas={captureFilled}
                  caption="Final mask: every enclosed pocket has been absorbed into its object."
                />
              </div>

              <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-baseline gap-2 font-mono text-xs">
                    <span className="uppercase tracking-wider text-muted-foreground">Reconstruction step</span>
                    <span className="tabular-nums text-foreground">
                      k = {effectiveStep} / {result.iterations}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(0)
                        setPlaying(true)
                      }}
                      className="rounded-sm border bg-primary px-3 py-1 font-mono text-xs text-primary-foreground hover:bg-primary/90"
                    >
                      {playing ? 'Restart' : 'Animate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaying(false)
                        setStep(null)
                      }}
                      className="rounded-sm border bg-background px-3 py-1 font-mono text-xs text-foreground hover:border-foreground/40"
                    >
                      Jump to end
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={result.iterations}
                  value={effectiveStep}
                  onChange={(e) => {
                    setPlaying(false)
                    setStep(Number(e.target.value))
                  }}
                  aria-label="Reconstruction iteration"
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Each step is one geodesic dilation of the marker inside the complement of A. Drag to watch the background
                  flood inward; whatever it never reaches is a hole.
                </p>
              </div>

              <Stats result={result} width={width} height={height} foregroundArea={foregroundArea} />
            </>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-md border bg-card font-mono text-xs text-muted-foreground">
              Loading sample…
            </div>
          )}
        </div>
      </div>

      <AlgorithmNote />
    </div>
  )
}
