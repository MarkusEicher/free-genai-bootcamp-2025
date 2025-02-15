import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import Card from './Card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Test content</Card>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Card className="custom-class">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('custom-class')
  })
}) 