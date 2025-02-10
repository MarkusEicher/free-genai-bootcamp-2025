'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/activities', label: 'Study Activities' },
    { href: '/words', label: 'Words' },
    { href: '/groups', label: 'Word Groups' },
    { href: '/sessions', label: 'Sessions' },
    { href: '/settings', label: 'Settings' }
  ]

  return (
    <nav className="w-64 bg-gray-900 text-white h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">LangPortal</h1>
      </div>
      <ul className="space-y-2">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={`block p-2 rounded-lg ${
                pathname === href
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-800'
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
} 