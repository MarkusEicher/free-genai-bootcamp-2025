import type { Meta, StoryObj } from '@storybook/react'
import VocabularyList from './VocabularyList'

const meta = {
  title: 'Vocabulary/VocabularyList',
  component: VocabularyList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VocabularyList>

export default meta
type Story = StoryObj<typeof VocabularyList>

export const Default: Story = {
  args: {
    items: [
      { id: 1, word: 'Hello', translation: 'Hola', group: 'Basics' },
      { id: 2, word: 'Goodbye', translation: 'Adiós', group: 'Basics' },
      { id: 3, word: 'Thank you', translation: 'Gracias' }
    ],
    onItemClick: (id) => console.log('Clicked item:', id),
  },
}

export const Empty: Story = {
  args: {
    items: [],
    onItemClick: (id) => console.log('Clicked item:', id),
  },
} 