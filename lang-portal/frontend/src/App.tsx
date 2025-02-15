import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import PracticePage from './pages/PracticePage'
import LeaderboardPage from './pages/LeaderboardPage'
// import SettingsPage from './pages/SettingsPage'  // Comment out import
import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          {/* Remove or comment out settings route
          <Route path="/settings" element={<SettingsPage />} /> 
          */}
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
