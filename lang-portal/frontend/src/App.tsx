import { ErrorBoundary } from './components/ErrorBoundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './hooks/useApi'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { StatsProvider } from './contexts/StatsContext'
import Router from './Router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <StatsProvider>
              <Router />
            </StatsProvider>
          </NotificationProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
