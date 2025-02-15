import type { Meta, StoryObj } from '@storybook/react'
import Layout from './Layout'
import { BrowserRouter } from 'react-router-dom'

const meta = {
  title: 'Common/Layout',
  component: Layout,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Layout>

export default meta
type Story = StoryObj<typeof Layout>

export const Default: Story = {
  args: {
    children: <div className="p-4">Page Content</div>,
  },
}

export const WithLongContent: Story = {
  args: {
    children: (
      <div className="p-4 space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded">
            Section {i + 1}
          </div>
        ))}
      </div>
    ),
  },
} 