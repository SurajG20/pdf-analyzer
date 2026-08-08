import { FilePdf, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { DocumentMeta } from '@/lib/api'

type DocSummaryProps = {
  document: DocumentMeta
  onRemove: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function DocSummary({ document, onRemove }: DocSummaryProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
          <FilePdf weight="duotone" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium" title={document.originalName}>
            {document.originalName}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {document.pageCount} pages · {formatBytes(document.sizeBytes)}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} className="self-start text-muted-foreground sm:self-auto">
        <Trash className="size-4" />
        Remove
      </Button>
    </div>
  )
}