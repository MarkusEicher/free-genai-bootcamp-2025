import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation'
import Dashboard from './pages/dashboard/Dashboard'
import VocabularyPage from './pages/VocabularyPage'
import PracticePage from './pages/PracticePage'
import SettingsPage from './pages/SettingsPage'
import { CacheMonitoringPage } from './pages/monitoring/CacheMonitoringPage'

export default function Router() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/monitoring/cache" element={<CacheMonitoringPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
} 