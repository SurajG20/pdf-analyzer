import { useCallback, useEffect, useState } from 'react'

const KEY = 'gather-theme'

export type Theme = 'paper' | 'ink'

function initialTheme(): Theme {
  const stored = localStorage.getItem(KEY)
  if (stored === 'paper' || stored === 'ink') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'ink' : 'paper'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'ink')
    localStorage.setItem(KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'paper' ? 'ink' : 'paper'))
  }, [])

  return { theme, toggle }
}