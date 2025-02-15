import { useState } from 'react'

interface ThemeToggleProps {
  onThemeChange: (isDark: boolean) => void;
  initialTheme?: boolean;
}

export default function ThemeToggle({ onThemeChange, initialTheme = false }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(initialTheme)

  const handleToggle = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    onThemeChange(newTheme)
  }

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
        isDark ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`${
          isDark ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
      />
    </button>
  )
} 