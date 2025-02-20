import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardStats } from '../DashboardStats';

const mockStats = {
  success_rate: 0.756,
  study_sessions_count: 42,
  active_activities_count: 3,
  active_groups_count: 2,
  study_streak: {
    current_streak: 5,
    longest_streak: 7
  }
};

describe('DashboardStats', () => {
  it('renders all stat cards with correct values', () => {
    render(<DashboardStats stats={mockStats} />);

    // Check success rate
    expect(screen.getByText('76%')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Overall learning success rate')).toBeInTheDocument();

    // Check study sessions
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Study Sessions')).toBeInTheDocument();
    expect(screen.getByText('Total completed sessions')).toBeInTheDocument();

    // Check active activities
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Active Activities')).toBeInTheDocument();
    expect(screen.getByText('Currently active learning activities')).toBeInTheDocument();

    // Check study streak
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Study Streak')).toBeInTheDocument();
    expect(screen.getByText('Longest streak: 7 days')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<DashboardStats stats={mockStats} />);

    // Check container
    const container = screen.getByRole('region', { name: 'Dashboard Statistics' });
    expect(container).toBeInTheDocument();

    // Check individual stat cards
    const statCards = screen.getAllByRole('article');
    expect(statCards).toHaveLength(4);

    statCards.forEach(card => {
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveAttribute('aria-labelledby');
    });
  });

  it('handles keyboard navigation', async () => {
    render(<DashboardStats stats={mockStats} />);
    const user = userEvent.setup();

    const statCards = screen.getAllByRole('article');
    
    // Focus first card
    await user.tab();
    expect(statCards[0]).toHaveFocus();

    // Press Enter to interact
    await user.keyboard('{Enter}');
    expect(statCards[0]).toHaveFocus();

    // Move to next card
    await user.tab();
    expect(statCards[1]).toHaveFocus();
  });

  it('provides descriptive labels for screen readers', () => {
    render(<DashboardStats stats={mockStats} />);

    // Check success rate label
    expect(screen.getByLabelText('Success Rate: 76%')).toBeInTheDocument();

    // Check study sessions label
    expect(screen.getByLabelText('Study Sessions: 42')).toBeInTheDocument();

    // Check active activities label
    expect(screen.getByLabelText('Active Activities: 3')).toBeInTheDocument();

    // Check study streak label
    expect(screen.getByLabelText('Study Streak: 5')).toBeInTheDocument();
  });

  it('maintains focus within the component', async () => {
    render(<DashboardStats stats={mockStats} />);
    const user = userEvent.setup();

    // Tab through all cards
    for (let i = 0; i < 4; i++) {
      await user.tab();
      expect(screen.getAllByRole('article')[i]).toHaveFocus();
    }

    // Tab again should keep focus within the component
    await user.tab();
    expect(screen.getAllByRole('article')[0]).toHaveFocus();
  });

  it('shows tooltip on hover and keyboard focus', async () => {
    render(<DashboardStats stats={mockStats} />);
    const user = userEvent.setup();

    const firstCard = screen.getAllByRole('article')[0];
    
    // Test mouse hover
    await user.hover(firstCard);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Click to view details')).toBeInTheDocument();

    // Test keyboard focus
    await user.unhover(firstCard);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('handles keyboard interactions for expanded state', async () => {
    render(<DashboardStats stats={mockStats} />);
    const user = userEvent.setup();

    const firstCard = screen.getAllByRole('article')[0];
    
    // Enter key expands the card
    await user.tab();
    await user.keyboard('{Enter}');
    expect(firstCard).toHaveAttribute('aria-expanded', 'true');

    // Escape key collapses the card
    await user.keyboard('{Escape}');
    expect(firstCard).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows additional details when expanded', async () => {
    render(<DashboardStats stats={mockStats} />);
    const user = userEvent.setup();

    const firstCard = screen.getAllByRole('article')[0];
    
    // Expand card
    await user.hover(firstCard);

    // Check for additional details region
    const detailsRegion = screen.getByRole('region', { name: /Additional details for/i });
    expect(detailsRegion).toBeInTheDocument();

    // Check for details button
    const detailsButton = screen.getByRole('button', { name: /View detailed statistics for/i });
    expect(detailsButton).toBeInTheDocument();
  });

  it('maintains accessibility when showing additional content', async () => {
    render(<DashboardStats stats={mockStats} />);
    const user = userEvent.setup();

    const firstCard = screen.getAllByRole('article')[0];
    
    // Expand card
    await user.hover(firstCard);

    // Check ARIA attributes
    expect(firstCard).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');

    // Check focus management for new button
    const detailsButton = screen.getByRole('button', { name: /View detailed statistics for/i });
    await user.tab();
    expect(detailsButton).toHaveFocus();
  });

  it('animates content on hover and focus', async () => {
    render(<DashboardStats stats={mockStats} />);
    const user = userEvent.setup();

    const firstCard = screen.getAllByRole('article')[0];
    
    // Initial state
    expect(firstCard).not.toHaveClass('scale-105');
    
    // Hover state
    await user.hover(firstCard);
    expect(firstCard).toHaveClass('scale-105');
    expect(firstCard).toHaveClass('shadow-lg');

    // Unhover state
    await user.unhover(firstCard);
    expect(firstCard).not.toHaveClass('scale-105');
    expect(firstCard).not.toHaveClass('shadow-lg');
  });
}); 