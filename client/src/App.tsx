import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { Header } from '@/components/header'
import { DropZone } from '@/components/drop-zone'
import { DocSummary } from '@/components/doc-summary'
import { PageGrid } from '@/components/page-grid'
import { ExtractBar } from '@/components/extract-bar'
import { ResultPanel } from '@/components/result-panel'
import { RegistrationMark } from '@/components/registration-mark'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { fileUrl, extractPages, uploadPdf, type DocumentMeta } from '@/lib/api'

type Phase = 'idle' | 'uploading' | 'ready' | 'extracting' | 'done'

const STEPS = [
  { no: '01', label: 'Drop a doc' },
  { no: '02', label: 'Mark & order' },
  { no: '03', label: 'Gather' },
]

export default function App() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [document, setDocument] = useState<DocumentMeta | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [result, setResult] = useState<DocumentMeta | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const sourceUrl = document ? fileUrl(document) : ''

  const stepIndex = ({ idle: 0, uploading: 0, ready: 1, extracting: 2, done: 3 })[phase]

  const handleFile = useCallback(async (file: File) => {
    setPhase('uploading')
    setServerError(null)
    setResult(null)
    setSelected([])
    try {
      const { document: doc } = await uploadPdf(file)
      setDocument(doc)
      setPhase('ready')
      toast.success(`${doc.originalName} — ${doc.pageCount} pages on the table.`)
    } catch (err) {
      setPhase('idle')
      setServerError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    }
  }, [])

  const togglePage = useCallback(
    (page: number) => {
      if (phase !== 'ready') return
      setSelected((current) =>
        current.includes(page) ? current.filter((p) => p !== page) : [...current, page]
      )
    },
    [phase]
  )

  const reorder = useCallback((from: number, to: number) => {
    setSelected((current) => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const handleExtract = useCallback(
    async (name: string) => {
      if (!document || selected.length === 0) return
      setPhase('extracting')
      try {
        const { document: doc } = await extractPages(document.id, selected, name || undefined)
        setResult(doc)
        setPhase('done')
        toast.success('Your new PDF is ready to download.')
      } catch (err) {
        setPhase('ready')
        toast.error(err instanceof Error ? err.message : 'Extraction failed.')
      }
    },
    [document, selected]
  )

  const reset = useCallback(() => {
    setDocument(null)
    setResult(null)
    setSelected([])
    setServerError(null)
    setPhase('idle')
  }, [])

  return (
    <div className="paper-grain flex min-h-dvh flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 sm:px-6">
        {(phase === 'idle' || phase === 'uploading') && (
          <section className="pb-8 pt-6 text-center sm:pt-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-sky-700 dark:text-sky-400">
              gather — a pdf page shop
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-bold leading-[1.04] tracking-tight text-balance sm:text-6xl">
              Pull the pages you need out of any PDF.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-balance text-base leading-relaxed text-muted-foreground">
              Upload a document, mark the sheets you want, set their order, and download
              the new file. No accounts, no cloud, no waiting.
            </p>
          </section>
        )}

        <StepRail index={stepIndex} className="mb-6 sm:mb-8" />

        {phase === 'done' && result ? (
          <ResultPanel document={result} onStartOver={reset} />
        ) : (
          <>
            {phase === 'idle' || phase === 'uploading' ? (
              <DropZone busy={phase === 'uploading'} serverError={serverError} onFile={handleFile} />
            ) : (
              <section>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-sky-700 dark:text-sky-400">
                      step 2 — mark &amp; order
                    </p>
                    <h2 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                      Make your booklet
                    </h2>
                    <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                      Mark the sheets you want, then drag marked pages to set their order
                      in the new file.
                    </p>
                  </div>
                  {document && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(Array.from({ length: document.pageCount }, (_, i) => i + 1))}
                        disabled={phase !== 'ready'}
                      >
                        Mark all
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected([])}
                        disabled={phase !== 'ready' || selected.length === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {document && <DocSummary document={document} onRemove={reset} />}

                <div className="mt-6">
                  <PageGrid
                    url={sourceUrl}
                    pageCount={document?.pageCount ?? 0}
                    selected={selected}
                    disabled={phase !== 'ready'}
                    onToggle={togglePage}
                    onReorder={reorder}
                  />
                </div>

                <ExtractBar
                  count={selected.length}
                  extracting={phase === 'extracting'}
                  disabled={phase !== 'ready'}
                  onExtract={handleExtract}
                />
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center sm:px-6">
          <RegistrationMark className="size-4 text-muted-foreground/70" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            gather — pages pulled locally through your own server. Your documents are never
            uploaded to a third party.
          </p>
        </div>
      </footer>
    </div>
  )
}

function StepRail({ index, className }: { index: number; className?: string }) {
  return (
    <nav aria-label="Progress" className={cn('flex items-center justify-center gap-0', className)}>
      {STEPS.map((step, i) => (
        <div key={step.no} className="flex items-center">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em]',
              i <= index
                ? 'border-sky-700/30 bg-sky-700/5 text-sky-700 dark:border-sky-400/30 dark:text-sky-400'
                : 'border-border text-muted-foreground/70'
            )}
          >
            <span className={cn('size-1.5 rounded-full', i <= index ? 'bg-current' : 'bg-border')} />
            <span className="hidden sm:inline">{step.label}</span>
            <span className="sm:hidden">{step.no}</span>
          </div>
          {i < STEPS.length - 1 && <Separator className="w-6 sm:w-10 bg-border" />}
        </div>
      ))}
    </nav>
  )
}