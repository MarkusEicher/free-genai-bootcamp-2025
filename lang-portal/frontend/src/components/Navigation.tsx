import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/vocabulary', label: 'Vocabulary' },
  { path: '/practice', label: 'Practice' }
]

export default function Navigation() {
  const location = useLocation()

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">LangPortal</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`
                    inline-flex items-center px-1 pt-1 border-b-2
                    text-sm font-medium
                    ${location.pathname === path
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  {label}
                </Link>
              ))}
            </div>
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