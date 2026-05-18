import type { ScanResult } from './types';

const statusStyles: Record<ScanResult['status'], string> = {
  Queued: 'bg-amber-500',
  Scanning: 'bg-blue-500',
  Finished: 'bg-green-500',
  Failed: 'bg-red-500',
};

export function StatusBadge({ status }: { status: ScanResult['status'] }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
