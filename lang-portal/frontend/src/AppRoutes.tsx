import { Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/dashboard/DashboardPage'
import SessionsPage from './pages/sessions/SessionsPage'
import SessionDetailsPage from './pages/sessions/SessionDetailsPage'
import ActivityDetailsPage from './pages/sessions/ActivityDetailsPage'
import LaunchpadPage from './pages/launchpad/LaunchpadPage'
import VocabularyPage from './pages/vocabulary/VocabularyPage'
import VocabularyDetailsPage from './pages/vocabulary/VocabularyDetailsPage'
import VocabularyGroupsPage from './pages/vocabulary/VocabularyGroupsPage'
import SettingsPage from './pages/settings/SettingsPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/sessions" element={<SessionsPage />} />
      <Route path="/sessions/:sessionId" element={<SessionDetailsPage />} />
      <Route path="/sessions/:sessionId/activities/:activityId" element={<ActivityDetailsPage />} />
      <Route path="/launchpad" element={<LaunchpadPage />} />
      <Route path="/vocabulary" element={<VocabularyPage />} />
      <Route path="/vocabulary/:vocabularyId" element={<VocabularyDetailsPage />} />
      <Route path="/vocabulary-groups" element={<VocabularyGroupsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

export default AppRoutes 