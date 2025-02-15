import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navbar } from './components/common'
import {
  HomePage,
  ActivityPage,
  ActivityNewPage,
  ActivityDetailsPage,
  ActivityEditPage,
  ActivityPracticePage,
  ActivityCompletePage
} from './pages'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/activities" element={<ActivityPage />} />
            <Route path="/activities/new" element={<ActivityNewPage />} />
            <Route path="/activities/:id" element={<ActivityDetailsPage />} />
            <Route path="/activities/:id/edit" element={<ActivityEditPage />} />
            <Route path="/activities/:id/practice" element={<ActivityPracticePage />} />
            <Route path="/activities/:id/complete" element={<ActivityCompletePage />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  )
}
