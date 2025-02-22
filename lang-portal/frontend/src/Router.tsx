import { createBrowserRouter, Outlet } from 'react-router-dom'
import Dashboard from './pages/dashboard/Dashboard'
import VocabularyPage from './pages/vocabulary/VocabularyPage'
import SessionsPage from './pages/sessions/SessionsPage'
import Activities from './pages/Activities'
import SettingsPage from './pages/settings/SettingsPage'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Outlet /></Layout>,
    errorElement: <NotFound />,
    children: [
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: '/vocabulary',
        element: <VocabularyPage />
      },
      {
        path: '/sessions',
        element: <SessionsPage />
      },
      {
        path: '/activities',
        element: <Activities />
      },
      {
        path: '/settings',
        element: <SettingsPage />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
])

export default router 