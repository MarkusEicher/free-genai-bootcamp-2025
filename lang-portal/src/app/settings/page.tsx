'use client'

import { useState, useEffect } from 'react'

interface Settings {
  dailyGoal: number
  notificationsEnabled: boolean
  studyReminders: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    dailyGoal: 10,
    notificationsEnabled: true,
    studyReminders: true,
    theme: 'system',
    language: 'en'
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })
      if (response.ok) {
        setMessage('Settings updated successfully!')
      }
    } catch (error) {
      setMessage('Error updating settings')
      console.error('Error:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <div>
          <label className="block mb-2 font-medium">
            Daily Study Goal
            <input
              type="number"
              min="1"
              max="100"
              value={settings.dailyGoal}
              onChange={(e) => setSettings({
                ...settings,
                dailyGoal: parseInt(e.target.value)
              })}
              className="mt-1 block w-full border rounded-md p-2"
            />
          </label>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Theme
            <select
              value={settings.theme}
              onChange={(e) => setSettings({
                ...settings,
                theme: e.target.value as Settings['theme']
              })}
              className="mt-1 block w-full border rounded-md p-2"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Interface Language
            <select
              value={settings.language}
              onChange={(e) => setSettings({
                ...settings,
                language: e.target.value
              })}
              className="mt-1 block w-full border rounded-md p-2"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => setSettings({
                ...settings,
                notificationsEnabled: e.target.checked
              })}
              className="mr-2"
            />
            Enable Notifications
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.studyReminders}
              onChange={(e) => setSettings({
                ...settings,
                studyReminders: e.target.checked
              })}
              className="mr-2"
            />
            Daily Study Reminders
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save Settings
        </button>

        {message && (
          <p className={`mt-4 ${
            message.includes('Error') ? 'text-red-600' : 'text-green-600'
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>
  )
} 