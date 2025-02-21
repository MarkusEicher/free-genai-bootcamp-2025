import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/vocabulary', label: 'Vocabulary' },
  { path: '/practice', label: 'Practice' }
]

export default function Navigation() {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link 
              to="/dashboard" 
              className={`flex items-center px-2 py-2 text-sm font-medium ${
                isActive('/dashboard') 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/vocabulary" 
              className={`flex items-center px-2 py-2 text-sm font-medium ${
                isActive('/vocabulary') 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              Vocabulary
            </Link>
            <Link 
              to="/practice" 
              className={`flex items-center px-2 py-2 text-sm font-medium ${
                isActive('/practice') 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              Practice
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/monitoring/cache" 
              className={`flex items-center px-2 py-2 text-sm font-medium ${
                isActive('/monitoring/cache') 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              Cache Monitor
            </Link>
            <Link 
              to="/settings" 
              className={`flex items-center px-2 py-2 text-sm font-medium ${
                isActive('/settings') 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`
                block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                ${location.pathname === path
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
} 