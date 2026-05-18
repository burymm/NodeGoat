import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execFile } from 'child_process';
import { TrivyService } from './TrivyService';

vi.mock('child_process');

describe('TrivyService', () => {
  let trivyService: TrivyService;

  beforeEach(() => {
    trivyService = new TrivyService();
    vi.clearAllMocks();
  });

  describe('scan', () => {
    it('rejects when trivy is not installed', async () => {
      vi.mocked(execFile).mockImplementation((_file: any, _args: any, _opts: any, cb: any) => {
        const err = new Error('spawn trivy ENOENT') as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        cb(err);
      });

      await expect(trivyService.scan('/tmp/repo', 'test-1'))
        .rejects.toThrow('Trivy is not installed');
    });

    it('rejects on timeout', async () => {
      vi.mocked(execFile).mockImplementation((_file: any, _args: any, _opts: any, cb: any) => {
        const err = new Error('ETIMEDOUT') as NodeJS.ErrnoException;
        err.code = 'ETIMEDOUT';
        cb(err);
      });

      await expect(trivyService.scan('/tmp/repo', 'test-2'))
        .rejects.toThrow('timed out');
    });

    it('rejects when trivy returns stderr', async () => {
      vi.mocked(execFile).mockImplementation((_file: any, _args: any, _opts: any, cb: any) => {
        const err = new Error('FATAL: unable to initialize DB') as any;
        err.stderr = 'FATAL: unable to initialize DB';
        cb(err);
      });

      await expect(trivyService.scan('/tmp/repo', 'test-3'))
        .rejects.toThrow('FATAL: unable to initialize DB');
    });

    it('resolves with output path on success', async () => {
      vi.mocked(execFile).mockImplementation((_file: any, _args: any, _opts: any, cb: any) => {
        cb(null, '', '');
      });

      const result = await trivyService.scan('/tmp/repo', 'test-4');
      expect(result).toContain('test-4-trivy.json');
    });

    it('rejects on ENOSPC (disk full)', async () => {
      vi.mocked(execFile).mockImplementation((_file: any, _args: any, _opts: any, cb: any) => {
        const err = new Error('ENOSPC') as NodeJS.ErrnoException;
        err.code = 'ENOSPC';
        cb(err);
      });

      await expect(trivyService.scan('/tmp/repo', 'test-5'))
        .rejects.toThrow('Disk full');
    });
  });
});
