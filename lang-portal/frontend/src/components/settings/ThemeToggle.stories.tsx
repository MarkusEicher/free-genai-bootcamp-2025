import type { Meta, StoryObj } from '@storybook/react'
import ThemeToggle from './ThemeToggle'

const meta = {
  title: 'Settings/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof ThemeToggle>

export const LightTheme: Story = {
  args: {
    initialTheme: false,
    onThemeChange: (isDark) => console.log('Theme changed to:', isDark ? 'dark' : 'light'),
  },
}

export const DarkTheme: Story = {
  args: {
    initialTheme: true,
    onThemeChange: (isDark) => console.log('Theme changed to:', isDark ? 'dark' : 'light'),
  },
} 