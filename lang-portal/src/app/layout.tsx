import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LangPortal",
  description: "Language Learning Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-gray-50 p-4 space-y-2">
            <h1 className="text-xl font-bold mb-6">LangPortal</h1>
            <Link 
              href="/" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              Home
            </Link>
            <Link 
              href="/activities" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              Study Activities
            </Link>
            <Link 
              href="/words" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              Words
            </Link>
            <Link 
              href="/sessions" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              Sessions
            </Link>
            <Link 
              href="/settings" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              Settings
            </Link>
          </nav>

          {/* Main Content */}
          <main className="flex-1 bg-gray-100">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
