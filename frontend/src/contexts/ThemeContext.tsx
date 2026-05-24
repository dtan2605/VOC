import {
  createContext,
  startTransition,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

export type VocTheme = 'classic' | 'editorial'

interface ThemeContextValue {
  theme: VocTheme
  setTheme: (theme: VocTheme) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'voc-theme'

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<VocTheme>(() => {
    if (typeof window === 'undefined') {
      return 'classic'
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    return storedTheme === 'editorial' ? 'editorial' : 'classic'
  })

  useEffect(() => {
    document.documentElement.dataset.vocTheme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (value: VocTheme) => {
    startTransition(() => {
      setThemeState(value)
    })
  }

  const toggleTheme = () => {
    setTheme(theme === 'classic' ? 'editorial' : 'classic')
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
