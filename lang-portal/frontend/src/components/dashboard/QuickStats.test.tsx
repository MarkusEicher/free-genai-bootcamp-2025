import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import QuickStats from './QuickStats'

describe('QuickStats', () => {
  const mockStats = [
    { label: 'Total Words', value: '100', change: '+10 this week' },
    { label: 'Sessions', value: '25', change: '+5 this week' },
    { label: 'Average Score', value: '85%' }
  ]

  it('renders all stats items', () => {
    render(<QuickStats stats={mockStats} />)
    
    expect(screen.getByText('Total Words')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('+10 this week')).toBeInTheDocument()
    
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('+5 this week')).toBeInTheDocument()
    
    expect(screen.getByText('Average Score')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
  })
}) 