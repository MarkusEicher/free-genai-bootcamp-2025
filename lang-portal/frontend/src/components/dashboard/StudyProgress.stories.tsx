import type { Meta, StoryObj } from '@storybook/react'
import StudyProgress from './StudyProgress'

const meta = {
  title: 'Dashboard/StudyProgress',
  component: StudyProgress,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StudyProgress>

export default meta
type Story = StoryObj<typeof StudyProgress>

export const Default: Story = {
  args: {
    wordsLearned: 75,
    totalWords: 100,
  },
}

export const NoProgress: Story = {
  args: {
    wordsLearned: 0,
    totalWords: 100,
  },
}

export const Complete: Story = {
  args: {
    wordsLearned: 100,
    totalWords: 100,
  },
} 