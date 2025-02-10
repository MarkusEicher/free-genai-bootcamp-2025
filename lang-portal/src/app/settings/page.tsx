'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [message, setMessage] = useState('')

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleResetHistory = async () => {
    try {
      const response = await fetch('/api/settings/reset-history', {
        method: 'POST',
      })
      if (response.ok) {
        setMessage('History has been reset successfully')
      } else {
        setMessage('Failed to reset history')
      }
    } catch (error) {
      setMessage('Error resetting history')
      console.error('Error:', error)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6 max-w-md">
        {/* Theme Selection */}
        <div>
          <h2 className="text-lg font-medium mb-2">Theme</h2>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="border rounded-md p-2 w-full"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Reset History */}
        <div>
          <h2 className="text-lg font-medium mb-2">Reset Data</h2>
          <button
            onClick={handleResetHistory}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Reset History
          </button>
          {message && (
            <p className={`mt-2 ${
              message.includes('successfully') ? 'text-green-600' : 'text-red-600'
            }`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 