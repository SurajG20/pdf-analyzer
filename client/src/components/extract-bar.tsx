import { useState, type FormEvent } from 'react'
import { ArrowRight, Stack } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type ExtractBarProps = {
  count: number
  extracting: boolean
  disabled: boolean
  onExtract: (name: string) => void
}

export function ExtractBar({ count, extracting, disabled, onExtract }: ExtractBarProps) {
  const [name, setName] = useState('')

  const canExtract = count > 0 && !extracting && !disabled

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (canExtract) onExtract(name)
  }

  return (
    <div className="sticky bottom-4 z-10 mt-8">
      <form
        onSubmit={submit}
        className={cn(
          'mx-auto flex max-w-6xl flex-col gap-3 rounded-2xl border bg-card/95 p-3 shadow-lg shadow-black/[0.06] backdrop-blur sm:flex-row sm:items-center sm:justify-between',
          count === 0 && 'opacity-60'
        )}
      >
        <div className="flex items-center gap-3 px-2">
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-full font-mono text-sm font-medium',
              count > 0 ? 'bg-sky-600 text-white' : 'bg-muted text-muted-foreground'
            )}
            role="status"
            aria-label="Pages selected"
          >
            {count}
          </span>
          <p className="text-sm">
            {count === 0 ? (
              <span className="text-muted-foreground">Pick at least one page to gather.</span>
            ) : (
              <span>
                <strong className="font-heading font-semibold">{count}</strong>
                {count === 1 ? ' page' : ' pages'} in the booklet — drag marked pages to reorder
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-1 gap-2 sm:max-w-md">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name the new file (optional)"
            aria-label="Name of the output file"
            disabled={!canExtract}
            className="flex-1"
          />
          <Button type="submit" disabled={!canExtract} className="min-w-40">
            {extracting ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Gathering…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Gather pages
                <ArrowRight weight="bold" className="size-4" />
              </span>
            )}
          </Button>
        </div>
      </form>

      {extracting && (
        <div className="mx-auto mt-3 flex max-w-6xl items-center gap-3 px-4">
          <Stack weight="duotone" className="size-4 text-sky-600 dark:text-sky-400" />
          <Progress value={undefined} className="h-1.5 flex-1" />
        </div>
      )}
    </div>
  )
}