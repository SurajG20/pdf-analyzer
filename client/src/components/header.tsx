import { Moon, Sun } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { RegistrationMark } from '@/components/registration-mark'
import { useTheme } from '@/lib/use-theme'

export function Header() {
  const { theme, toggle } = useTheme()

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
      <div className="flex items-baseline gap-2">
        <RegistrationMark className="size-5 self-center text-sky-700 dark:text-sky-400" />
        <span className="font-heading text-xl font-bold tracking-tight">gather</span>
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
          — page shop
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={theme === 'paper' ? 'Switch to ink (dark) theme' : 'Switch to paper (light) theme'}
        title={theme === 'paper' ? 'Ink theme' : 'Paper theme'}
      >
        {theme === 'paper' ? <Moon weight="duotone" className="size-[18px]" /> : <Sun weight="duotone" className="size-[18px]" />}
      </Button>
    </header>
  )
}