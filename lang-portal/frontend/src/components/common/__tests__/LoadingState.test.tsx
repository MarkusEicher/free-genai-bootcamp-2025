import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingState, SkeletonText, SkeletonCard } from '../LoadingState';

describe('LoadingState', () => {
  it('renders spinner by default', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders skeleton when variant is skeleton', () => {
    render(<LoadingState variant="skeleton" height={100} width={200} />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveStyle({ height: '100px', width: '200px' });
  });

  it('applies custom className', () => {
    render(<LoadingState className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('displays custom loading text', () => {
    render(<LoadingState text="Custom loading text" />);
    expect(screen.getByText('Custom loading text')).toBeInTheDocument();
  });
});

describe('SkeletonText', () => {
  it('renders single line by default', () => {
    render(<SkeletonText />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('renders multiple lines when specified', () => {
    render(<SkeletonText lines={3} />);
    expect(screen.getAllByRole('status')).toHaveLength(3);
  });

  it('applies custom className', () => {
    render(<SkeletonText className="custom-class" />);
    expect(screen.getByRole('status').parentElement).toHaveClass('custom-class');
  });

  it('renders last line shorter in multi-line mode', () => {
    render(<SkeletonText lines={2} />);
    const lines = screen.getAllByRole('status');
    expect(lines[0]).toHaveStyle({ width: '100%' });
    expect(lines[1]).toHaveStyle({ width: '75%' });
  });
});

describe('SkeletonCard', () => {
  it('renders card structure', () => {
    render(<SkeletonCard />);
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(5); // Header + 3 lines + footer
  });

  it('applies custom className', () => {
    render(<SkeletonCard className="custom-class" />);
    expect(screen.getByRole('status').closest('div')).toHaveClass('custom-class');
  });

  it('maintains consistent structure', () => {
    render(<SkeletonCard />);
    expect(screen.getByRole('status', { name: /loading content/i })).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(5);
  });
}); 