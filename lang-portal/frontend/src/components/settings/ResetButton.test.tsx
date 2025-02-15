import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import ResetButton from './ResetButton'

describe('ResetButton', () => {
  it('shows confirmation before reset', async () => {
    const onReset = vi.fn()
    render(<ResetButton onReset={onReset} />)
    
    // First click shows confirmation
    fireEvent.click(screen.getByText('Reset Progress'))
    expect(screen.getByText('Confirm Reset')).toBeInTheDocument()
    expect(onReset).not.toHaveBeenCalled()
    
    // Second click triggers reset
    fireEvent.click(screen.getByText('Confirm Reset'))
    expect(onReset).toHaveBeenCalled()
  })
}) 