import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitButton } from './SplitButton';

describe('SplitButton', () => {
  it('renders with default REST mode', () => {
    render(
      <SplitButton
        mode='rest'
        onModeChange={() => {}}
        onScan={() => {}}
        disabled={false}
        scanning={false}
      />,
    );
    expect(screen.getByText('Start Scan')).toBeInTheDocument();
  });

  it('shows Scanning label when scanning', () => {
    render(
      <SplitButton
        mode='rest'
        onModeChange={() => {}}
        onScan={() => {}}
        disabled={false}
        scanning={true}
      />,
    );
    expect(screen.getByText('Scanning...')).toBeInTheDocument();
  });

  it('shows GraphQL label in graphql mode', () => {
    render(
      <SplitButton
        mode='graphql'
        onModeChange={() => {}}
        onScan={() => {}}
        disabled={false}
        scanning={false}
      />,
    );
    expect(screen.getByText('Start Scan (GraphQL)')).toBeInTheDocument();
  });

  it('opens dropdown on caret click', async () => {
    const user = userEvent.setup();
    render(
      <SplitButton
        mode='rest'
        onModeChange={() => {}}
        onScan={() => {}}
        disabled={false}
        scanning={false}
      />,
    );
    const caret = screen.getByLabelText('Select scan mode');
    await user.click(caret);
    expect(screen.getByText('REST')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
  });

  it('switches mode when clicking GraphQL option', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(
      <SplitButton
        mode='rest'
        onModeChange={onModeChange}
        onScan={() => {}}
        disabled={false}
        scanning={false}
      />,
    );
    await user.click(screen.getByLabelText('Select scan mode'));
    await user.click(screen.getByText('GraphQL'));
    expect(onModeChange).toHaveBeenCalledWith('graphql');
  });

  it('calls onScan when clicking Scan button', async () => {
    const user = userEvent.setup();
    const onScan = vi.fn();
    render(
      <SplitButton
        mode='rest'
        onModeChange={() => {}}
        onScan={onScan}
        disabled={false}
        scanning={false}
      />,
    );
    await user.click(screen.getByText('Start Scan'));
    expect(onScan).toHaveBeenCalledOnce();
  });
});
