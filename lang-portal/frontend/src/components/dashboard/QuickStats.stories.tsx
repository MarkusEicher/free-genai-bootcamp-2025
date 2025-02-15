import type { Meta, StoryObj } from '@storybook/react'
import QuickStats from './QuickStats'

const meta = {
  title: 'Dashboard/QuickStats',
  component: QuickStats,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof QuickStats>

export default meta
type Story = StoryObj<typeof QuickStats>

export const Default: Story = {
  args: {
    stats: [
      { label: 'Total Words', value: '100', change: '+10 this week' },
      { label: 'Sessions', value: '25', change: '+5 this week' },
      { label: 'Average Score', value: '85%' }
    ],
  },
}

export const NoChanges: Story = {
  args: {
    stats: [
      { label: 'Total Words', value: '100' },
      { label: 'Sessions', value: '25' },
      { label: 'Average Score', value: '85%' }
    ],
  },
} 