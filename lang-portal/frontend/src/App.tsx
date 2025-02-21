import { ErrorBoundary } from './components/ErrorBoundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './hooks/useApi'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { StatsProvider } from './contexts/StatsContext'
import { CacheProvider } from './contexts/CacheContext'
import Router from './Router'

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <StatsProvider>
              <CacheProvider>
                <Router />
              </CacheProvider>
            </StatsProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
