import { DownloadSimple, ArrowsClockwise, FilePdf } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { RegistrationMark } from '@/components/registration-mark'
import { fileUrl, type DocumentMeta } from '@/lib/api'

type ResultPanelProps = {
  document: DocumentMeta
  onStartOver: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ResultPanel({ document, onStartOver }: ResultPanelProps) {
  const href = fileUrl(document)

  return (
    <section className="mx-auto mt-10 w-full max-w-xl" aria-live="polite">
      <div className="rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-8">
        <RegistrationMark className="mx-auto size-8 text-sky-600 dark:text-sky-400" />

        <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight">The pages are gathered</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your new PDF is ready — download it or keep going.
        </p>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border bg-muted/40 px-4 py-3 text-left">
          <span className="flex min-w-0 items-center gap-3">
            <FilePdf weight="duotone" className="size-6 shrink-0 text-sky-600 dark:text-sky-400" />
            <span className="min-w-0">
              <span className="block truncate font-medium" title={document.originalName}>
                {document.originalName}
              </span>
              <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {document.pageCount} page{document.pageCount === 1 ? '' : 's'} · {formatBytes(document.sizeBytes)}
              </span>
            </span>
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="min-w-44">
            <a href={href} download={document.originalName} data-testid="download-link">
              <DownloadSimple weight="bold" className="size-4" />
              Download PDF
            </a>
          </Button>
          <Button variant="outline" onClick={onStartOver}>
            <ArrowsClockwise className="size-4" />
            Gather another
          </Button>
        </div>
      </div>
    </section>
  )
}