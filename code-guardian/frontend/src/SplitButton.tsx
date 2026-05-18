import { useState, useRef } from 'react';
import type { ScanMode } from './types';
import { useClickOutside } from './useClickOutside';

export function SplitButton({
  mode,
  onModeChange,
  onScan,
  disabled,
  scanning,
}: {
  mode: ScanMode;
  onModeChange: (m: ScanMode) => void;
  onScan: () => void;
  disabled: boolean;
  scanning: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const label = scanning ? 'Scanning...' : mode === 'rest' ? 'Start Scan' : 'Start Scan (GraphQL)';

  return (
    <div ref={ref} className='relative flex'>
      <button
        onClick={onScan}
        disabled={disabled}
        className='px-6 py-2.5 text-base font-semibold text-white bg-blue-500 rounded-l-lg hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer border-r border-blue-400'
      >
        {label}
      </button>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className='px-2 py-2.5 text-white bg-blue-500 rounded-r-lg hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer'
        aria-label='Select scan mode'
      >
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>
      {open && (
        <div className='absolute top-full right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-10'>
          <button
            onClick={() => { onModeChange('rest'); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 cursor-pointer ${mode === 'rest' ? 'font-semibold text-blue-600' : 'text-slate-700'}`}
          >
            <span className='mr-2'>{mode === 'rest' ? '✓' : ''}</span>
            REST
          </button>
          <button
            onClick={() => { onModeChange('graphql'); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 cursor-pointer rounded-b-lg ${mode === 'graphql' ? 'font-semibold text-blue-600' : 'text-slate-700'}`}
          >
            <span className='mr-2'>{mode === 'graphql' ? '✓' : ''}</span>
            GraphQL
          </button>
        </div>
      )}
    </div>
  );
}
