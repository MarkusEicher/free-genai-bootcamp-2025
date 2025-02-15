import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center text-xl font-bold">
              Language Portal
            </Link>
            <div className="ml-10 flex items-center space-x-4">
              <Link to="/activities" className="text-gray-700 hover:text-gray-900">
                Activities
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 