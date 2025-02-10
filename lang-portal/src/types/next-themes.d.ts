declare module 'next-themes' {
  import { ReactNode } from 'react'
  
  interface ThemeProviderProps {
    children: ReactNode
    attribute?: string
    defaultTheme?: string
    enableSystem?: boolean
    storageKey?: string
    value?: {
      light?: string
      dark?: string
      system?: string
    }
  }
  
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element
  
  export function useTheme(): {
    theme: string | undefined
    setTheme: (theme: string) => void
    systemTheme: string | undefined
  }
} 