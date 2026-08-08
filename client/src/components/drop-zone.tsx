import { useCallback, useRef, useState, type DragEvent } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { hasPdfMagic } from '@/lib/pdf'
import { RegistrationMark } from '@/components/registration-mark'

const MAX_BYTES = 25 * 1024 * 1024

/** Returns a friendly reason the file cannot be used, or null when it can. */
export function validatePdfFile(file: File): string | null {
  if (file.type && file.type !== 'application/pdf') {
    return `"${file.name}" is not a PDF — only PDF files can be gathered.`
  }
  if (file.size > MAX_BYTES) {
    return `"${file.name}" is ${Math.round(file.size / 1024 / 1024)} MB. Keep files under 25 MB.`
  }
  return null
}

function looksLikePdf(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    file.slice(0, 5).arrayBuffer().then((buf) => resolve(hasPdfMagic(new Uint8Array(buf))))
      .catch(() => resolve(false))
  })
}

type DropZoneProps = {
  busy: boolean
  serverError: string | null
  onFile: (file: File) => void
}

export function DropZone({ busy, serverError, onFile }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  const invalid = (reason: string) => {
    setLocalError(reason)
    errorRef.current?.focus()
  }

  const accept = useCallback(
    async (file: File | undefined) => {
      if (!file || busy) return
      const reason = validatePdfFile(file)
      if (reason) return invalid(reason)
      if (!(await looksLikePdf(file))) {
        return invalid(`"${file.name}" is not a valid PDF file.`)
      }
      onFile(file)
    },
    [busy, onFile]
  )

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setOver(false)
    accept(event.dataTransfer.files?.[0])
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          void accept(e.target.files?.[0])
          e.target.value = ''
        }}
        data-testid="file-input"
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a PDF file"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          'group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed bg-card/70 px-6 py-14 text-center shadow-sm transition-all sm:py-20',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          over ? 'border-sky-600 bg-sky-50/60 dark:border-sky-400 dark:bg-sky-950/30' : 'border-border hover:border-foreground/30',
          busy && 'pointer-events-none opacity-70'
        )}
      >
        {over ? (
          <RegistrationMark className="size-9 text-sky-600 dark:text-sky-400" />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-transform group-hover:-translate-y-0.5">
            <UploadSimple weight="duotone" className="size-6 text-muted-foreground" />
          </span>
        )}

        <div className="space-y-1.5">
          <p className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Drop a PDF on the table
          </p>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            or{' '}
            <span className="cursor-pointer underline decoration-dotted underline-offset-4">
              browse for one
            </span>
            . It stays in your possession — every page is shown, nothing is shared.
          </p>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
          pdf · up to 25&nbsp;MB
        </p>

        {localError ?? serverError ? (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="max-w-md rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive"
          >
            {localError ?? serverError}
          </p>
        ) : null}

        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            Reading the doc…
          </p>
        )}
      </div>
    </div>
  )
}