import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import LastSession from './LastSession'

describe('LastSession', () => {
  const mockActivities = [
    { id: 1, name: 'Vocabulary Quiz', score: 0.85 },
    { id: 2, name: 'Reading Exercise', score: 0.90 }
  ]

  it('renders session details', () => {
    render(
      <LastSession
        date="2024-03-15"
        activities={mockActivities}
        overallScore={0.875}
      />
    )
    
    expect(screen.getByText('2024-03-15')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary Quiz')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('Reading Exercise')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
  })
}) 