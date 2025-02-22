import { Link, useLocation } from 'react-router-dom'

export default function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/sessions', label: 'Sessions' },
    { path: '/vocabulary', label: 'Vocabulary' },
    { path: '/activities', label: 'Activities' }
  ]

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Desktop menu */}
          <div className="flex">
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-4 py-2 text-sm font-medium ${
                  isActive(path)
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
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