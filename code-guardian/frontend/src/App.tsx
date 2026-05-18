import { useState, useCallback, useRef, useEffect } from 'react';
import type { ScanMode, ScanResult } from './types';
import { api } from './api';
import { SplitButton } from './SplitButton';
import { StatusBadge } from './StatusBadge';
import { VulnerabilityTable } from './VulnerabilityTable';

const POLL_INTERVAL = 2000;

export function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ScanMode>('rest');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    stopPolling();

    try {
      const { start, poll } = api[mode];
      const { scanId } = await start(repoUrl.trim());
      scanIdRef.current = scanId;
      setResult({ scanId, status: 'Queued', vulnerabilities: [] });

      pollRef.current = setInterval(async () => {
        if (!scanIdRef.current) return;
        try {
          const scan = await poll(scanIdRef.current);
          setResult(scan);
          if (scan.status === 'Finished' || scan.status === 'Failed') {
            stopPolling();
            setLoading(false);
          }
        } catch {
          stopPolling();
          setError('Failed to fetch scan status');
          setLoading(false);
        }
      }, POLL_INTERVAL);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [repoUrl, stopPolling, mode]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const isActive = result && (result.status === 'Queued' || result.status === 'Scanning');

  return (
    <div className='max-w-4xl mx-auto p-10 font-sans'>
      <h1 className='text-3xl font-bold text-slate-900 mb-2'>Code Guardian</h1>
      <p className='text-slate-500 mb-8'>
        Scan any GitHub repository for critical security vulnerabilities.
      </p>

      <div className='flex gap-3 mb-6'>
        <input
          type='text'
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder='https://github.com/OWASP/NodeGoat'
          disabled={loading || !!isActive}
          className='flex-1 px-4 py-2.5 text-base border border-slate-300 rounded-lg outline-none focus:border-blue-400 disabled:bg-slate-100'
        />
        <SplitButton
          mode={mode}
          onModeChange={setMode}
          onScan={handleSubmit}
          disabled={loading || !!isActive || !repoUrl.trim()}
          scanning={loading || !!isActive}
        />
      </div>

      {mode === 'graphql' && (
        <div className='mb-4 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs rounded-lg inline-block'>
          Using GraphQL API
        </div>
      )}

      {error && (
        <div className='p-3 mb-4 bg-red-50 text-red-600 rounded-lg'>
          {error}
        </div>
      )}

      {result && (
        <div>
          <div className='flex items-center gap-3 mb-4'>
            <span className='text-sm text-slate-500'>Scan ID: {result.scanId}</span>
            <StatusBadge status={result.status} />
          </div>

          {result.status === 'Finished' && <VulnerabilityTable vulns={result.vulnerabilities} />}

          {result.status === 'Failed' && result.error && (
            <div className='p-3 bg-red-50 text-red-600 rounded-lg'>{result.error}</div>
          )}

          {isActive && <p className='text-slate-500'>Scan in progress, please wait...</p>}
        </div>
      )}
    </div>
  );
}
