import type { FillResult } from '@/lib/morphology'

interface StatsProps {
  result: FillResult
  width: number
  height: number
  foregroundArea: number
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-border pl-3">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-mono text-lg tabular-nums leading-none text-foreground">
        {value}
        {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
      </dd>
    </div>
  )
}

export function Stats({ result, width, height, foregroundArea }: StatsProps) {
  const total = width * height
  const filledArea = foregroundArea + result.holeArea
  const growth = foregroundArea > 0 ? (result.holeArea / foregroundArea) * 100 : 0

  return (
    <section className="rounded-md border bg-card p-4" aria-label="Measurements">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Objects" value={String(result.objectCount)} />
        <Stat label="Holes filled" value={String(result.holeCount)} />
        <Stat label="Holes kept" value={String(result.keptCount)} />
        <Stat label="Hole area" value={result.holeArea.toLocaleString()} unit="px" />
        <Stat label="Mask growth" value={growth.toFixed(2)} unit="%" />
        <Stat label="Iterations" value={String(result.iterations)} unit="dilations" />
      </dl>
      <div className="mt-5 flex flex-col gap-1.5">
        <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>Coverage of image</span>
          <span className="tabular-nums">
            {((foregroundArea / total) * 100).toFixed(1)}% → {((filledArea / total) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="presentation">
          <div className="bg-foreground" style={{ width: `${(foregroundArea / total) * 100}%` }} />
          <div className="bg-accent" style={{ width: `${(result.holeArea / total) * 100}%` }} />
        </div>
        {result.holeSizes.length > 0 && (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Hole sizes (px):{' '}
            {result.holeSizes.slice(0, 12).join(', ')}
            {result.holeSizes.length > 12 && ` … +${result.holeSizes.length - 12} more`}
          </p>
        )}
      </div>
    </section>
  )
}
