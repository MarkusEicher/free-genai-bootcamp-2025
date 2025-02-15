import type { Meta, StoryObj } from '@storybook/react'
import ResetButton from './ResetButton'

const meta = {
  title: 'Settings/ResetButton',
  component: ResetButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResetButton>

export default meta
type Story = StoryObj<typeof ResetButton>

export const Default: Story = {
  args: {
    onReset: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Reset completed')
    },
  },
} 