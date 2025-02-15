import { useState } from 'react'
import { Card } from '../components/common'
import { useSettings } from '../hooks/useApi'

export default function Settings() {
  const { data: settings } = useSettings()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Theme Settings */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Theme</h2>
        <div className="flex items-center space-x-4">
          <button
            className={`px-4 py-2 rounded ${
              settings?.theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => console.log('Set light theme')}
          >
            Light
          </button>
          <button
            className={`px-4 py-2 rounded ${
              settings?.theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => console.log('Set dark theme')}
          >
            Dark
          </button>
        </div>
      </Card>

      {/* Reset Progress */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Reset Progress</h2>
        {!showResetConfirm ? (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => setShowResetConfirm(true)}
          >
            Reset Progress
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-red-600">Are you sure? This cannot be undone.</p>
            <div className="flex space-x-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => console.log('Reset confirmed')}
              >
                Confirm Reset
              </button>
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
} 