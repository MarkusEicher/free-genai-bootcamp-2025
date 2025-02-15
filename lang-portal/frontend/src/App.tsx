import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './hooks/useApi'
import { StatsProvider } from './contexts/StatsContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Router from './Router'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <StatsProvider>
          <Router />
        </StatsProvider>
      </NotificationProvider>
    </QueryClientProvider>
  )
}
