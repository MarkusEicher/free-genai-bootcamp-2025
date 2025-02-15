import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import Layout from './Layout'

describe('Layout', () => {
  it('renders navigation links', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('Study')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(
      <Layout>
        <div>Test content</div>
      </Layout>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })
}) 