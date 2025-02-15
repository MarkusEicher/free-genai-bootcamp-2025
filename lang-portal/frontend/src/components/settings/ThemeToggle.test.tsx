import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import ThemeToggle from './ThemeToggle'

describe('ThemeToggle', () => {
  it('toggles theme on click', () => {
    const onThemeChange = vi.fn()
    render(<ThemeToggle onThemeChange={onThemeChange} initialTheme={false} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(onThemeChange).toHaveBeenCalledWith(true)
    
    fireEvent.click(screen.getByRole('button'))
    expect(onThemeChange).toHaveBeenCalledWith(false)
  })
}) 