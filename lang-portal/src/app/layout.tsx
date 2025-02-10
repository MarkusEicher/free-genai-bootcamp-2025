import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import Link from 'next/link'
import './globals.css'

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
              <Link 
                href="/" 
                className="block p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded dark:text-gray-200"
              >
                Home
              </Link>
              <Link 
                href="/activities" 
                className="block p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded dark:text-gray-200"
              >
                Study Activities
              </Link>
              <Link 
                href="/words" 
                className="block p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded dark:text-gray-200"
              >
                Words
              </Link>
              <Link 
                href="/sessions" 
                className="block p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded dark:text-gray-200"
              >
                Sessions
              </Link>
              <Link 
                href="/settings" 
                className="block p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded dark:text-gray-200"
              >
                Settings
              </Link>
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
