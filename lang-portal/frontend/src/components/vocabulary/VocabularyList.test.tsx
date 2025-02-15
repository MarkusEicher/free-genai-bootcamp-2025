import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import VocabularyList from './VocabularyList'

describe('VocabularyList', () => {
  const mockItems = [
    { id: 1, word: 'Hello', translation: 'Hola', group: 'Basics' },
    { id: 2, word: 'Goodbye', translation: 'Adiós' }
  ]

  it('renders vocabulary items', () => {
    const onItemClick = vi.fn()
    render(<VocabularyList items={mockItems} onItemClick={onItemClick} />)
    
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hola')).toBeInTheDocument()
    expect(screen.getByText('Basics')).toBeInTheDocument()
    expect(screen.getByText('Goodbye')).toBeInTheDocument()
    expect(screen.getByText('Adiós')).toBeInTheDocument()
  })

  it('handles item clicks', () => {
    const onItemClick = vi.fn()
    render(<VocabularyList items={mockItems} onItemClick={onItemClick} />)
    
    fireEvent.click(screen.getByText('Hello'))
    expect(onItemClick).toHaveBeenCalledWith(1)
  })
}) 