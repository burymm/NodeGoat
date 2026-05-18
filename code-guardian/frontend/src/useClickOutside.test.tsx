import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside } from './useClickOutside';

function TestComponent({ onOutside }: { onOutside: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onOutside);
  return (
    <div>
      <div ref={ref} data-testid='inside'>inside</div>
      <div data-testid='outside'>outside</div>
    </div>
  );
}

describe('useClickOutside', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls handler when clicking outside', () => {
    const handler = vi.fn();
    render(<TestComponent onOutside={handler} />);

    fireEvent.pointerDown(screen.getByTestId('outside'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not call handler when clicking inside', () => {
    const handler = vi.fn();
    render(<TestComponent onOutside={handler} />);

    fireEvent.pointerDown(screen.getByTestId('inside'));
    expect(handler).not.toHaveBeenCalled();
  });
});
