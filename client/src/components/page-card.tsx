import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { renderPageToCanvas } from '@/lib/pdf'
import { Skeleton } from '@/components/ui/skeleton'
import { Check } from '@phosphor-icons/react'

export type PageState = {
  /** 1-based page number inside the source document. */
  number: number
  /** Position in the extraction order (undefined = not selected). */
  order: number | undefined
  totalSelected: number
}

type PageCardProps = {
  url: string
  state: PageState
  dragging: boolean
  dropTarget: boolean
  disabled: boolean
  onToggle: (page: number) => void
  onDragStart: (page: number) => void
  onDragEnter: (page: number) => void
  onDragEnd: () => void
}

export function PageCard({
  url,
  state,
  dragging,
  dropTarget,
  disabled,
  onToggle,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: PageCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const host = canvasRef.current
    if (!host) return
    let cancelled = false

    const width = host.clientWidth
    if (width === 0) return

    renderPageToCanvas(url, state.number, width)
      .then((next) => {
        if (!cancelled) setCanvas(next)
      })
      .catch((err) => console.error(`page ${state.number} failed to render`, err))
    return () => {
      cancelled = true
    }
  }, [url, state.number])

  useEffect(() => {
    if (!canvas) return
    const host = canvasRef.current
    if (!host) return
    host.replaceChildren(canvas)
  }, [canvas])

  const selected = state.order !== undefined

  return (
    <div
      data-page={state.number}
      draggable={selected && !disabled}
      onDragStart={() => onDragStart(state.number)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => onDragEnter(state.number)}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative rounded-xl bg-card p-2 shadow-sm outline outline-1 -outline-offset-1 outline-border transition-all',
        dragging && 'opacity-40',
        dropTarget && 'outline-2 -outline-offset-2 outline-sky-600',
        selected
          ? 'outline-2 -outline-offset-2 outline-sky-600 shadow-md shadow-sky-600/15'
          : 'hover:-translate-y-0.5 hover:shadow-md',
        disabled && 'pointer-events-none'
      )}
    >
      {/* crop tick — the corner mark of every selected sheet */}
      {selected && (
        <span className="pointer-events-none absolute -right-[5px] -top-[5px] size-3 rotate-45 rounded-[2px] border border-sky-600/60 bg-background shadow-sm" />
      )}

      {/* thumbnail */}
      <canvas ref={canvasRef} className="w-full cursor-pointer rounded-lg bg-background" />

      <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          {String(state.number).padStart(2, '0')}
        </span>

        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={selected ? `Remove page ${state.number} from the selection` : `Add page ${state.number} to the selection`}
          disabled={disabled}
          onClick={() => onToggle(state.number)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
            selected
              ? 'border-transparent bg-sky-600 text-white'
              : 'border-border text-muted-foreground hover:border-sky-600 hover:text-sky-700 dark:hover:text-sky-400'
          )}
        >
          {selected && <Check weight="bold" className="size-3" />}
          {selected ? `no. ${state.order! + 1} of ${state.totalSelected}` : 'add'}
        </button>
      </div>

      {!canvas && <Skeleton className="absolute inset-x-2 top-2 bottom-9 rounded-lg" />}
    </div>
  )
}