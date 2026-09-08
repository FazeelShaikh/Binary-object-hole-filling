'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { SAMPLES, type SampleId } from '@/lib/samples'
import type { Connectivity } from '@/lib/morphology'

interface ControlsProps {
  sample: SampleId | null
  onSample: (id: SampleId) => void
  onFile: (file: File) => void
  threshold: number
  onThreshold: (v: number) => void
  invert: boolean
  onInvert: (v: boolean) => void
  connectivity: Connectivity
  onConnectivity: (v: Connectivity) => void
  maxHolePct: number
  onMaxHolePct: (v: number) => void
  onDownload: () => void
  canDownload: boolean
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between font-mono text-xs">
        <span className="uppercase tracking-wider text-muted-foreground">{label}</span>
        {value && <span className="tabular-nums text-foreground">{value}</span>}
      </div>
      {children}
    </div>
  )
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  name,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  name: string
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-flow-col auto-cols-fr rounded-md border bg-muted p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-sm px-2 py-1.5 font-mono text-xs transition-colors ${
              active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Controls(props: ControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <aside className="flex flex-col gap-6 rounded-md border bg-card p-4" aria-label="Pipeline parameters">
      <Field label="Source">
        <div className="grid grid-cols-3 gap-1.5">
          {SAMPLES.map((s) => {
            const active = props.sample === s.id
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                title={s.hint}
                onClick={() => props.onSample(s.id)}
                className={`rounded-sm border px-2 py-1.5 font-mono text-xs transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:border-foreground/40'
                }`}
              >
                {s.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`rounded-sm border border-dashed px-2 py-1.5 font-mono text-xs transition-colors hover:border-foreground/40 ${
              props.sample === null ? 'border-primary bg-primary text-primary-foreground' : 'text-foreground'
            }`}
          >
            Upload…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) props.onFile(f)
              e.target.value = ''
            }}
          />
        </div>
      </Field>

      <Field label="Threshold T" value={String(props.threshold)}>
        <input
          type="range"
          min={1}
          max={254}
          value={props.threshold}
          onChange={(e) => props.onThreshold(Number(e.target.value))}
          aria-label="Threshold"
        />
        <label className="flex items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={props.invert}
            onChange={(e) => props.onInvert(e.target.checked)}
          />
          Invert (objects are brighter than background)
        </label>
      </Field>

      <Field label="Structuring element B">
        <Segmented
          name="Connectivity"
          value={props.connectivity}
          onChange={props.onConnectivity}
          options={[
            { value: 4, label: '4-conn (cross)' },
            { value: 8, label: '8-conn (square)' },
          ]}
        />
      </Field>

      <Field
        label="Max hole area"
        value={props.maxHolePct >= 100 ? 'all' : `≤ ${props.maxHolePct}% img`}
      >
        <input
          type="range"
          min={1}
          max={100}
          value={props.maxHolePct}
          onChange={(e) => props.onMaxHolePct(Number(e.target.value))}
          aria-label="Maximum hole area as percent of image"
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Holes larger than this are treated as intentional cavities and left open.
        </p>
      </Field>

      <Button onClick={props.onDownload} disabled={!props.canDownload} className="font-mono text-xs">
        Download filled mask (PNG)
      </Button>
    </aside>
  )
}
