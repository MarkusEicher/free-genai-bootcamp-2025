import { Link, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useApi'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { data: profile } = useProfile()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-blue-600">
                LangPortal
              </Link>
              
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md ${
                    isActive('/') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/practice"
                  className={`px-3 py-2 rounded-md ${
                    isActive('/practice') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Practice
                </Link>
                <Link
                  to="/leaderboard"
                  className={`px-3 py-2 rounded-md ${
                    isActive('/leaderboard') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Leaderboard
                </Link>
                <Link
                  to="/vocabulary"
                  className={`px-3 py-2 rounded-md ${
                    isActive('/vocabulary') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Vocabulary
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                  isActive('/profile') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <span>{profile?.name || 'Profile'}</span>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
} 