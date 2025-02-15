import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useNotification } from '../contexts/NotificationContext'
import { useReset } from '../hooks/useReset'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { showNotification } = useNotification()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const resetMutation = useReset()

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync()
      showNotification('Application reset successfully', 'success')
      setShowResetConfirm(false)
    } catch (error) {
      showNotification('Failed to reset application', 'error')
    }
  }

  if (resetMutation.isPending) {
    return <LoadingState message="Resetting application..." />
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Settings</h1>

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-medium mb-4 dark:text-white">Appearance</h2>
          <div className="flex items-center justify-between">
            <span className="dark:text-white">Dark Mode</span>
            <button
              onClick={toggleTheme}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition
                  ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium mb-4 dark:text-white">Reset Application</h2>
          <p className="text-gray-600 mb-4 dark:text-gray-300">
            This will reset all your progress and remove all vocabulary. This action cannot be undone.
          </p>
          {showResetConfirm ? (
            <div className="space-y-4">
              <p className="text-red-600 font-medium">Are you sure you want to reset everything?</p>
              <div className="space-x-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowResetConfirm(true)}
              variant="secondary"
            >
              Reset Application
            </Button>
          )}
        </Card>
      </div>
    </div>
  )
} 