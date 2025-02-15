import type { Meta, StoryObj } from '@storybook/react'
import Card from './Card'

const meta = {
  title: 'Common/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    children: 'This is a card component',
  },
}

export const WithCustomClass: Story = {
  args: {
    children: 'Card with custom class',
    className: 'bg-blue-50',
  },
}

export const WithComplexContent: Story = {
  args: {
    children: (
      <div>
        <h2 className="text-xl font-bold">Card Title</h2>
        <p className="mt-2">Card content with multiple elements</p>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Action
        </button>
      </div>
    ),
  },
} 