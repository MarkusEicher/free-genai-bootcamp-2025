import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import Link from 'next/link'
import './globals.css'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/groups', label: 'Word Groups', icon: '📑' },
  { href: '/words', label: 'Words', icon: '📝' },
  { href: '/study', label: 'Study Activities', icon: '📚' },
  { href: '/sessions', label: 'Sessions', icon: '⏱️' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export const metadata: Metadata = {
  title: 'LangPortal',
  description: 'Language Learning Portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen dark:bg-gray-900">
            {/* Sidebar Navigation */}
            <nav className="w-64 bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
              <h1 className="text-xl font-bold mb-6 dark:text-white">LangPortal</h1>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Main Content */}
            <main className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
