import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanWorker } from './ScanWorker';
import { ScanStatus } from '../types';

describe('ScanWorker', () => {
  let worker: ScanWorker;
  let mockStore: any;
  let mockGit: any;
  let mockTrivy: any;
  let mockParser: any;

  beforeEach(() => {
    mockStore = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
    };
    mockGit = {
      clone: vi.fn().mockResolvedValue('/tmp/repo'),
      cleanup: vi.fn().mockResolvedValue(undefined),
    };
    mockTrivy = {
      scan: vi.fn().mockResolvedValue('/tmp/output.json'),
    };
    mockParser = {
      parse: vi.fn().mockResolvedValue([]),
    };

    worker = new ScanWorker(mockStore, mockGit, mockTrivy, mockParser);
  });

  it('handles git clone failure gracefully', async () => {
    mockGit.clone.mockRejectedValue(new Error('Git failed: repository not found'));

    worker.enqueue('test-1', 'https://invalid/repo');

    await new Promise((r) => setTimeout(r, 50));

    expect(mockStore.update).toHaveBeenCalledWith('test-1', expect.objectContaining({
      status: ScanStatus.Failed,
      error: 'Git failed: repository not found',
    }));
    expect(mockGit.cleanup).not.toHaveBeenCalled();
  });

  it('handles trivy failure gracefully', async () => {
    mockTrivy.scan.mockRejectedValue(new Error('Trivy failed: timeout'));

    worker.enqueue('test-2', 'https://github.com/valid/repo');

    await new Promise((r) => setTimeout(r, 50));

    expect(mockStore.update).toHaveBeenCalledWith('test-2', expect.objectContaining({
      status: ScanStatus.Failed,
      error: 'Trivy failed: timeout',
    }));
    expect(mockGit.cleanup).toHaveBeenCalledWith('/tmp/repo');
  });

  it('handles stream parser failure', async () => {
    mockParser.parse.mockRejectedValue(new Error('Parse error: malformed JSON'));

    worker.enqueue('test-3', 'https://github.com/valid/repo');

    await new Promise((r) => setTimeout(r, 50));

    expect(mockStore.update).toHaveBeenCalledWith('test-3', expect.objectContaining({
      status: ScanStatus.Failed,
      error: 'Parse error: malformed JSON',
    }));
    expect(mockGit.cleanup).toHaveBeenCalledWith('/tmp/repo');
  });

  it('sets status to Finished on success', async () => {
    mockParser.parse.mockResolvedValue([
      { id: 'CVE-2024-001', package: 'test', severity: 'CRITICAL' },
    ]);

    worker.enqueue('test-4', 'https://github.com/valid/repo');

    await new Promise((r) => setTimeout(r, 50));

    expect(mockStore.update).toHaveBeenCalledWith('test-4', expect.objectContaining({
      status: ScanStatus.Finished,
      vulnerabilities: [expect.objectContaining({ id: 'CVE-2024-001' })],
    }));
  });

  it('cleans up repo and trivy output after success', async () => {
    worker.enqueue('test-5', 'https://github.com/valid/repo');

    await new Promise((r) => setTimeout(r, 50));

    expect(mockGit.cleanup).toHaveBeenCalled();
  });
});
