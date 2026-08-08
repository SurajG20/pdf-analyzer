import { useRef, useState } from 'react'
import { PageCard, type PageState } from '@/components/page-card'

type PageGridProps = {
  url: string
  pageCount: number
  /** Selected source page numbers, in output order. */
  selected: number[]
  disabled: boolean
  onToggle: (page: number) => void
  onReorder: (from: number, to: number) => void
}

export function PageGrid({ url, pageCount, selected, disabled, onToggle, onReorder }: PageGridProps) {
  // The dragged source page number lives in a ref so dragEnter sees fresh
  // values without re-registering handlers on every re-render.
  const dragged = useRef<number | null>(null)
  const [over, setOver] = useState<number | null>(null)

  const stateFor = (page: number): PageState => {
    const order = selected.indexOf(page)
    return {
      number: page,
      order: order === -1 ? undefined : order,
      totalSelected: selected.length,
    }
  }

  const handleDragStart = (page: number) => {
    if (selected.includes(page)) dragged.current = page
  }

  const handleDragEnter = (page: number) => {
    const from = dragged.current
    if (from === null || from === page) return
    const fromIndex = selected.indexOf(from)
    const toIndex = selected.indexOf(page)
    if (fromIndex === -1 || toIndex === -1) return
    onReorder(fromIndex, toIndex)
    setOver(page)
  }

  const handleDragEnd = () => {
    dragged.current = null
    setOver(null)
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
        <PageCard
          key={page}
          url={url}
          state={stateFor(page)}
          dragging={dragged.current === page}
          dropTarget={over === page}
          disabled={disabled}
          onToggle={onToggle}
          onDragStart={handleDragStart}
          onDragEnter={handleDragEnter}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  )
}