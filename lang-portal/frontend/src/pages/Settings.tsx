import { useState, useEffect, useRef } from 'react'
import { Card, Button, LoadingSpinner, ColorPicker } from '../components/common'
import { useSettings, useUpdateSettings, useExportData, useImportData } from '../hooks/useApi'
import type { ThemeSettings, ThemePreset } from '../types/theme'
import { themePresets } from '../types/theme'
import { validateImportData } from '../utils/dataValidation'

interface UserSettings {
  language: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  dailyGoal: number
  emailNotifications: boolean
  soundEffects: boolean
  darkMode: boolean
  showTimer: boolean
  theme: ThemeSettings
}

export default function Settings() {
  const { data: settings, isLoading, isError } = useSettings()
  const updateSettings = useUpdateSettings()
  const exportData = useExportData()
  const importData = useImportData()
  const [formData, setFormData] = useState<UserSettings | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  if (isLoading) return <LoadingSpinner />
  if (isError) return <div>Error loading settings</div>
  if (!formData) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateSettings.mutateAsync(formData)
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  const handleExportData = async () => {
    try {
      const data = await exportData.mutateAsync()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'language-learning-data.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        const validationResult = validateImportData(data)
        if (!validationResult.success) {
          alert('Invalid data format: ' + validationResult.error.message)
          return
        }

        await importData.mutateAsync(validationResult.data)
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('Failed to import data:', error)
      alert('Failed to import data: Invalid file format')
    }
  }

  const applyThemePreset = (preset: ThemePreset) => {
    setFormData({
      ...formData,
      theme: {
        colors: preset.colors,
        fontSize: preset.fontSize,
        borderRadius: preset.borderRadius,
        spacing: preset.spacing,
        buttonStyle: 'filled',
        animationSpeed: 'normal',
        fontFamily: 'sans',
        fontWeight: 'normal'
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Learning Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <select
                value={formData.language}
                onChange={e => setFormData({ ...formData, language: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Difficulty Level</label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData({ 
                  ...formData, 
                  difficulty: e.target.value as UserSettings['difficulty']
                })}
                className="w-full p-2 border rounded"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Daily Goal (minutes)</label>
              <input
                type="number"
                value={formData.dailyGoal}
                onChange={e => setFormData({ 
                  ...formData, 
                  dailyGoal: parseInt(e.target.value) 
                })}
                min="1"
                max="240"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">App Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-600">
                  Receive daily reminders and progress updates
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={e => setFormData({ 
                    ...formData, 
                    emailNotifications: e.target.checked 
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Sound Effects</div>
                <div className="text-sm text-gray-600">
                  Play sounds for correct/incorrect answers
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.soundEffects}
                  onChange={e => setFormData({ 
                    ...formData, 
                    soundEffects: e.target.checked 
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-gray-600">
                  Use dark theme for the application
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.darkMode}
                  onChange={e => setFormData({ 
                    ...formData, 
                    darkMode: e.target.checked 
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Timer</div>
                <div className="text-sm text-gray-600">
                  Display timer during activities
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showTimer}
                  onChange={e => setFormData({ 
                    ...formData, 
                    showTimer: e.target.checked 
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Theme Customization</h2>
          
          {/* Theme Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Theme Presets</label>
            <div className="grid grid-cols-3 gap-4">
              {themePresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyThemePreset(preset)}
                  className={`p-4 rounded-lg border transition-all ${
                    JSON.stringify(formData.theme) === JSON.stringify(preset)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <span className="font-medium">{preset.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {Object.values(preset.colors).map((color, index) => (
                      <div
                        key={index}
                        className="w-full h-2 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Theme Customization */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Color Scheme</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Primary Color</label>
                  <ColorPicker
                    color={formData.theme.colors.primary}
                    onChange={(color) => setFormData({
                      ...formData,
                      theme: {
                        ...formData.theme,
                        colors: { ...formData.theme.colors, primary: color }
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Secondary Color</label>
                  <ColorPicker
                    color={formData.theme.colors.secondary}
                    onChange={(color) => setFormData({
                      ...formData,
                      theme: {
                        ...formData.theme,
                        colors: { ...formData.theme.colors, secondary: color }
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Font Size</label>
              <select
                value={formData.theme.fontSize}
                onChange={(e) => setFormData({
                  ...formData,
                  theme: { ...formData.theme, fontSize: e.target.value as ThemeSettings['fontSize'] }
                })}
                className="w-full p-2 border rounded"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Border Radius</label>
              <select
                value={formData.theme.borderRadius}
                onChange={(e) => setFormData({
                  ...formData,
                  theme: { ...formData.theme, borderRadius: e.target.value as ThemeSettings['borderRadius'] }
                })}
                className="w-full p-2 border rounded"
              >
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Layout Spacing</label>
              <select
                value={formData.theme.spacing}
                onChange={(e) => setFormData({
                  ...formData,
                  theme: { ...formData.theme, spacing: e.target.value as ThemeSettings['spacing'] }
                })}
                className="w-full p-2 border rounded"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>

            {/* Additional Theme Options */}
            <div>
              <label className="block text-sm font-medium mb-2">Advanced Options</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Button Style</label>
                  <select
                    value={formData.theme.buttonStyle}
                    onChange={(e) => setFormData({
                      ...formData,
                      theme: { ...formData.theme, buttonStyle: e.target.value as ThemeSettings['buttonStyle'] }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="filled">Filled</option>
                    <option value="outlined">Outlined</option>
                    <option value="text">Text Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Animation Speed</label>
                  <select
                    value={formData.theme.animationSpeed}
                    onChange={(e) => setFormData({
                      ...formData,
                      theme: { 
                        ...formData.theme, 
                        animationSpeed: e.target.value as ThemeSettings['animationSpeed']
                      }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="none">None</option>
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Font Customization */}
            <div>
              <label className="block text-sm font-medium mb-2">Typography</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Font Family</label>
                  <select
                    value={formData.theme.fontFamily}
                    onChange={(e) => setFormData({
                      ...formData,
                      theme: { ...formData.theme, fontFamily: e.target.value as ThemeSettings['fontFamily'] }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="sans">Sans Serif</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Monospace</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Font Weight</label>
                  <select
                    value={formData.theme.fontWeight}
                    onChange={(e) => setFormData({
                      ...formData,
                      theme: { ...formData.theme, fontWeight: e.target.value as ThemeSettings['fontWeight'] }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                onClick={handleExportData}
                className="w-full"
                disabled={exportData.isPending}
              >
                {exportData.isPending ? 'Exporting...' : 'Export Learning Data'}
              </Button>
              
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportData}
                  accept=".json"
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={importData.isPending}
                >
                  {importData.isPending ? 'Importing...' : 'Import Learning Data'}
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button
                type="button"
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (confirm('Are you sure? This will delete all your learning data.')) {
                    // Handle data deletion
                  }
                }}
              >
                Delete All Data
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateSettings.isPending}
            className="px-6"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
} 