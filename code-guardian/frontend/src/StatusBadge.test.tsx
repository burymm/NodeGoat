import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders Queued status', () => {
    render(<StatusBadge status='Queued' />);
    const badge = screen.getByText('Queued');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-amber-500');
  });

  it('renders Scanning status', () => {
    render(<StatusBadge status='Scanning' />);
    const badge = screen.getByText('Scanning');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-blue-500');
  });

  it('renders Finished status', () => {
    render(<StatusBadge status='Finished' />);
    const badge = screen.getByText('Finished');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-green-500');
  });

  it('renders Failed status', () => {
    render(<StatusBadge status='Failed' />);
    const badge = screen.getByText('Failed');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-red-500');
  });
});
