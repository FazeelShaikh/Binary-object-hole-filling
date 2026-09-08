import { HoleFillingLab } from '@/components/hole-filling/lab'

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">Digital Image Processing · Morphological Operations</span>
          <span className="tabular-nums">24315A0040 Fazeel Shaikh · 24315A0069 Ajit Rajak</span>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Hole Filling in Binary Objects
          </h1>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            Detect and fill holes inside segmented objects using morphological reconstruction. Adjust the
            threshold, choose a structuring element, and step through the dilation iterations.
          </p>
        </div>
      </header>

      <HoleFillingLab />

      <footer className="border-t pt-4 font-mono text-[11px] text-muted-foreground">
        All processing runs in your browser. Reference: Gonzalez &amp; Woods, <em>Digital Image Processing</em>,
        §9.5 — Hole filling via geodesic dilation.
      </footer>
    </main>
  )
}
