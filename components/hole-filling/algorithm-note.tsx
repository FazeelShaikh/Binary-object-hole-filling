export function AlgorithmNote() {
  return (
    <section className="grid gap-6 rounded-md border bg-card p-5 lg:grid-cols-[1.2fr_1fr]" aria-labelledby="algo">
      <div className="flex flex-col gap-3">
        <h2 id="algo" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Method: reconstruction by dilation
        </h2>
        <p className="text-sm leading-relaxed text-pretty text-foreground">
          A <em>hole</em> is a background region that cannot be reached from the image border
          without crossing the object. Instead of searching for holes directly, we grow the
          background inward from the frame and declare everything left unreached to be a hole.
        </p>
        <ol className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
          <li>
            <span className="font-mono text-muted-foreground">1&nbsp;</span>
            Segment the image into a binary set <span className="font-mono">A</span> by thresholding.
          </li>
          <li>
            <span className="font-mono text-muted-foreground">2&nbsp;</span>
            Marker <span className="font-mono">X0</span> = border pixels of the complement{' '}
            <span className="font-mono">A^c</span>.
          </li>
          <li>
            <span className="font-mono text-muted-foreground">3&nbsp;</span>
            Iterate <span className="font-mono">Xk = dilate(Xk-1, B) AND A^c</span> until{' '}
            <span className="font-mono">Xk = Xk-1</span>. The mask <span className="font-mono">A^c</span>{' '}
            stops the dilation at object boundaries.
          </li>
          <li>
            <span className="font-mono text-muted-foreground">4&nbsp;</span>
            Holes <span className="font-mono">H = A^c - Xk</span>; filled result{' '}
            <span className="font-mono">A OR H</span> = <span className="font-mono">NOT Xk</span>.
          </li>
        </ol>
      </div>
      <div className="flex flex-col gap-3 rounded-sm bg-muted p-4 font-mono text-xs leading-relaxed text-foreground">
        <p className="text-muted-foreground">// per-iteration cost is one dilation of the frontier</p>
        <pre className="whitespace-pre-wrap">{`X <- border(NOT A)
repeat
  X' <- dilate(X, B) AND (NOT A)
  converged <- (X' == X)
  X <- X'
until converged
filled <- NOT X`}</pre>
        <p className="text-muted-foreground">
          B is the 3x3 cross (4-connectivity) or full 3x3 square (8-connectivity). Using 4-conn for
          the background implies 8-conn objects, and vice versa; the dual pair avoids paradoxes at
          diagonal gaps.
        </p>
      </div>
    </section>
  )
}
