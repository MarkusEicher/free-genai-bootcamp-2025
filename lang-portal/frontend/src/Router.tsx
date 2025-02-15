import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import DashboardPage from './pages/DashboardPage'
import VocabularyPage from './pages/VocabularyPage'
import PracticePage from './pages/PracticePage'

export default function Router() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="py-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
} 