import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardLatestSessions } from '../DashboardLatestSessions';

const mockSessions = [
  {
    activity_name: 'Basic Vocabulary',
    activity_type: 'flashcard',
    practice_direction: 'forward',
    group_count: 2,
    start_time: '2024-02-17T14:30:00Z',
    end_time: '2024-02-17T14:45:00Z',
    success_rate: 0.85,
    correct_count: 17,
    incorrect_count: 3
  },
  {
    activity_name: 'Advanced Grammar',
    activity_type: 'quiz',
    practice_direction: 'both',
    group_count: 1,
    start_time: '2024-02-17T13:00:00Z',
    end_time: '2024-02-17T13:20:00Z',
    success_rate: 0.65,
    correct_count: 13,
    incorrect_count: 7
  }
];

describe('DashboardLatestSessions', () => {
  it('renders empty state correctly', () => {
    render(<DashboardLatestSessions sessions={[]} />);

    const emptyMessage = screen.getByRole('status', { name: 'No recent sessions' });
    expect(emptyMessage).toBeInTheDocument();
    expect(emptyMessage).toHaveTextContent(
      'No recent sessions found. Start a new learning session to see your activity here.'
    );
  });

  it('renders session list correctly', () => {
    render(<DashboardLatestSessions sessions={mockSessions} />);

    // Check section title
    expect(screen.getByText('Latest Sessions')).toBeInTheDocument();
    expect(screen.getByText('Your most recent learning activities')).toBeInTheDocument();

    // Check session details
    mockSessions.forEach(session => {
      expect(screen.getByText(session.activity_name)).toBeInTheDocument();
      expect(screen.getByText(`${Math.round(session.success_rate * 100)}% Success`)).toBeInTheDocument();
      expect(screen.getByText(`${session.correct_count} / ${session.correct_count + session.incorrect_count} correct`)).toBeInTheDocument();
    });
  });

  it('has correct ARIA attributes', () => {
    render(<DashboardLatestSessions sessions={mockSessions} />);

    // Check container
    const container = screen.getByRole('region', { name: 'Latest Sessions' });
    expect(container).toBeInTheDocument();

    // Check feed
    const feed = screen.getByRole('feed', { name: 'Latest learning sessions' });
    expect(feed).toBeInTheDocument();

    // Check articles
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(mockSessions.length);

    articles.forEach(article => {
      expect(article).toHaveAttribute('tabindex', '0');
      expect(article).toHaveAttribute('aria-labelledby');
      expect(article).toHaveAttribute('aria-describedby');
    });
  });

  it('provides keyboard navigation', async () => {
    render(<DashboardLatestSessions sessions={mockSessions} />);
    const user = userEvent.setup();

    // Focus container
    await user.tab();
    expect(screen.getByRole('region')).toHaveFocus();

    // Focus first session
    await user.keyboard('{Enter}');
    const articles = screen.getAllByRole('article');
    expect(articles[0]).toHaveFocus();

    // Move to next session
    await user.tab();
    expect(articles[1]).toHaveFocus();
  });

  it('provides descriptive labels for screen readers', () => {
    render(<DashboardLatestSessions sessions={mockSessions} />);

    mockSessions.forEach(session => {
      // Check success rate description
      const successRate = Math.round(session.success_rate * 100);
      const description = successRate >= 80 ? 'Excellent performance' :
                         successRate >= 60 ? 'Good performance' :
                         'Needs improvement';
      
      expect(screen.getByLabelText(`${description} with ${successRate}% success rate`)).toBeInTheDocument();

      // Check answers count
      const totalAnswers = session.correct_count + session.incorrect_count;
      expect(screen.getByLabelText(`${session.correct_count} correct answers out of ${totalAnswers} total answers`)).toBeInTheDocument();

      // Check session time
      const startTime = new Date(session.start_time);
      const endTime = new Date(session.end_time!);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60);
      
      expect(screen.getByLabelText(new RegExp(`Session time: ${startTime.toLocaleDateString()}.*Duration: ${duration} minutes`))).toBeInTheDocument();
    });
  });

  it('handles progress bar accessibility', () => {
    render(<DashboardLatestSessions sessions={mockSessions} />);

    mockSessions.forEach(session => {
      const successRate = Math.round(session.success_rate * 100);
      const progressBar = screen.getByRole('progressbar', { name: `Session success rate: ${successRate}%` });
      
      expect(progressBar).toHaveAttribute('aria-valuenow', successRate.toString());
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  it('maintains focus within the component', async () => {
    render(<DashboardLatestSessions sessions={mockSessions} />);
    const user = userEvent.setup();

    // Focus container
    await user.tab();
    const container = screen.getByRole('region');
    expect(container).toHaveFocus();

    // Focus first session
    await user.keyboard('{Enter}');
    const articles = screen.getAllByRole('article');
    expect(articles[0]).toHaveFocus();

    // Tab through all sessions
    for (let i = 1; i < articles.length; i++) {
      await user.tab();
      expect(articles[i]).toHaveFocus();
    }

    // Tab again should move focus out of the component
    await user.tab();
    expect(document.activeElement).not.toBe(container);
    expect(document.activeElement).not.toBe(articles[articles.length - 1]);
  });
}); 