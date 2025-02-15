import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import ActivityCard from './ActivityCard'

describe('ActivityCard', () => {
  const defaultProps = {
    title: 'Vocabulary Quiz',
    description: 'Test your vocabulary knowledge',
    duration: '10 minutes',
    difficulty: 'Medium' as const,
    onStart: vi.fn()
  }

  it('renders activity details', () => {
    render(<ActivityCard {...defaultProps} />)
    
    expect(screen.getByText('Vocabulary Quiz')).toBeInTheDocument()
    expect(screen.getByText('Test your vocabulary knowledge')).toBeInTheDocument()
    expect(screen.getByText('10 minutes')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('handles start button click', () => {
    render(<ActivityCard {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Start Activity'))
    expect(defaultProps.onStart).toHaveBeenCalled()
  })
}) 