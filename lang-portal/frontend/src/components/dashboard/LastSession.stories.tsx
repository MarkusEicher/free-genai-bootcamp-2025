import type { Meta, StoryObj } from '@storybook/react'
import LastSession from './LastSession'

const meta = {
  title: 'Dashboard/LastSession',
  component: LastSession,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LastSession>

export default meta
type Story = StoryObj<typeof LastSession>

export const Default: Story = {
  args: {
    date: '2024-03-15',
    activities: [
      { id: 1, name: 'Vocabulary Quiz', score: 0.85 },
      { id: 2, name: 'Reading Exercise', score: 0.90 }
    ],
    overallScore: 0.875,
  },
}

export const SingleActivity: Story = {
  args: {
    date: '2024-03-15',
    activities: [
      { id: 1, name: 'Vocabulary Quiz', score: 0.85 }
    ],
    overallScore: 0.85,
  },
} 