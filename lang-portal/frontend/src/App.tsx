import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './hooks/useApi'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { StatsProvider } from './contexts/StatsContext'
import Router from './Router'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <StatsProvider>
            <Router />
          </StatsProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
