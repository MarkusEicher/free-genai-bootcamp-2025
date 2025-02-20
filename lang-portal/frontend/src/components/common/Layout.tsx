import { Link } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link to="/" className="flex items-center px-2 py-2 text-gray-900">
                Dashboard
              </Link>
              <Link to="/sessions" className="flex items-center px-2 py-2 text-gray-900">
                Sessions
              </Link>
              <Link to="/launchpad" className="flex items-center px-2 py-2 text-gray-900">
                Study
              </Link>
              <Link to="/vocabulary" className="flex items-center px-2 py-2 text-gray-900">
                Vocabulary
              </Link>
              <Link to="/vocabulary-groups" className="flex items-center px-2 py-2 text-gray-900">
                Groups
              </Link>
            </div>
            <Link to="/settings" className="flex items-center px-2 py-2 text-gray-900">
              Settings
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
} 