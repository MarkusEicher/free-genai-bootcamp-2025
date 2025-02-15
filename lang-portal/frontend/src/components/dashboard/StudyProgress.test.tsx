import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import StudyProgress from './StudyProgress'

describe('StudyProgress', () => {
  it('renders progress correctly', () => {
    render(<StudyProgress wordsLearned={75} totalWords={100} />)
    
    expect(screen.getByText('75% Complete')).toBeInTheDocument()
    expect(screen.getByText('75/100 words')).toBeInTheDocument()
  })

  it('handles zero progress', () => {
    render(<StudyProgress wordsLearned={0} totalWords={100} />)
    
    expect(screen.getByText('0% Complete')).toBeInTheDocument()
    expect(screen.getByText('0/100 words')).toBeInTheDocument()
  })
}) 