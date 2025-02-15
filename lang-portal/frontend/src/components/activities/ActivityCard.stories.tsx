import type { Meta, StoryObj } from '@storybook/react'
import ActivityCard from './ActivityCard'

const meta = {
  title: 'Activities/ActivityCard',
  component: ActivityCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActivityCard>

export default meta
type Story = StoryObj<typeof ActivityCard>

export const Easy: Story = {
  args: {
    title: 'Vocabulary Basics',
    description: 'Learn basic vocabulary through simple exercises',
    duration: '10 minutes',
    difficulty: 'Easy',
    onStart: () => console.log('Starting activity'),
  },
}

export const Medium: Story = {
  args: {
    title: 'Reading Comprehension',
    description: 'Practice reading and understanding texts',
    duration: '15 minutes',
    difficulty: 'Medium',
    onStart: () => console.log('Starting activity'),
  },
}

export const Hard: Story = {
  args: {
    title: 'Advanced Grammar',
    description: 'Test your knowledge of complex grammar rules',
    duration: '20 minutes',
    difficulty: 'Hard',
    onStart: () => console.log('Starting activity'),
  },
} 