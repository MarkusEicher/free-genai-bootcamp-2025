import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardProgress } from '../DashboardProgress';

const mockProgress = {
  total_items: 100,
  studied_items: 75,
  mastered_items: 30,
  progress_percentage: 75.0
};

describe('DashboardProgress', () => {
  it('renders progress information correctly', () => {
    render(<DashboardProgress progress={mockProgress} />);

    // Check headings
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('Track your learning journey progress')).toBeInTheDocument();

    // Check progress percentage
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Total Progress')).toBeInTheDocument();

    // Check mastered items
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
    expect(screen.getByText('Items Mastered')).toBeInTheDocument();

    // Check items in progress
    expect(screen.getByText('45')).toBeInTheDocument(); // 75 studied - 30 mastered
    expect(screen.getByText('items')).toBeInTheDocument();
    expect(screen.getByText('Items in Progress')).toBeInTheDocument();
  });

  it('has correct ARIA attributes for progress bars', () => {
    render(<DashboardProgress progress={mockProgress} />);

    const progressBar = screen.getByRole('progressbar', { name: 'Total Progress: 75%' });
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('provides proper keyboard navigation', async () => {
    render(<DashboardProgress progress={mockProgress} />);
    const user = userEvent.setup();

    // Focus the container
    await user.tab();
    expect(screen.getByRole('region')).toHaveFocus();

    // Focus the progress bar
    await user.keyboard('{Enter}');
    expect(screen.getByRole('progressbar')).toHaveFocus();
  });

  it('has accessible SVG visualization', () => {
    render(<DashboardProgress progress={mockProgress} />);

    const visualization = screen.getByRole('img', {
      name: 'Progress visualization: 75% complete'
    });
    expect(visualization).toBeInTheDocument();

    // SVG should be marked as decorative since we have text alternatives
    const svg = visualization.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('provides descriptive labels for screen readers', () => {
    render(<DashboardProgress progress={mockProgress} />);

    // Check section labels
    expect(screen.getByRole('region', { name: 'Learning Progress' })).toBeInTheDocument();

    // Check progress details
    expect(screen.getByRole('list', { name: 'Progress Details' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    // Check mastered items label
    const masteredItems = screen.getByLabelText(/30 out of 100 items mastered/i);
    expect(masteredItems).toBeInTheDocument();

    // Check in progress items label
    const inProgressItems = screen.getByLabelText(/45 items in progress/i);
    expect(inProgressItems).toBeInTheDocument();
  });

  it('updates progress bar value when progress changes', () => {
    const { rerender } = render(<DashboardProgress progress={mockProgress} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');

    // Update progress
    const newProgress = { ...mockProgress, progress_percentage: 80.0 };
    rerender(<DashboardProgress progress={newProgress} />);

    expect(progressBar).toHaveAttribute('aria-valuenow', '80');
  });

  it('maintains focus management', async () => {
    render(<DashboardProgress progress={mockProgress} />);
    const user = userEvent.setup();

    // Focus the container
    await user.tab();
    const container = screen.getByRole('region');
    expect(container).toHaveFocus();

    // Press Enter to focus progress bar
    await user.keyboard('{Enter}');
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveFocus();

    // Press Tab to cycle through focusable elements
    await user.tab();
    expect(document.activeElement).not.toBe(container);
  });
}); 