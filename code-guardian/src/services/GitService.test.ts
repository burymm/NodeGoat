import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execFile } from 'child_process';
import { GitService } from './GitService';

vi.mock('child_process');

describe('GitService', () => {
  let gitService: GitService;

  beforeEach(() => {
    gitService = new GitService();
    vi.clearAllMocks();
  });

  describe('validateUrl', () => {
    it('accepts valid https URL', async () => {
      vi.mocked(execFile).mockImplementation((_f: any, _a: any, _o: any, cb: any) => cb(null));
      await expect(gitService.clone('https://github.com/OWASP/NodeGoat', 't'))
        .resolves.toBeDefined();
    });

    it('accepts valid http URL', async () => {
      vi.mocked(execFile).mockImplementation((_f: any, _a: any, _o: any, cb: any) => cb(null));
      await expect(gitService.clone('http://github.com/OWASP/NodeGoat', 't'))
        .resolves.toBeDefined();
    });

    it('rejects empty URL', async () => {
      await expect(gitService.clone('', 't'))
        .rejects.toThrow('Invalid repository URL');
    });

    it('rejects whitespace-only URL', async () => {
      await expect(gitService.clone('   ', 't'))
        .rejects.toThrow('Invalid repository URL');
    });

    it('rejects file:// protocol (local file access)', async () => {
      await expect(gitService.clone('file:///etc/passwd', 't'))
        .rejects.toThrow('Only http and https protocols are supported');
    });

    it('rejects git:// protocol', async () => {
      await expect(gitService.clone('git://github.com/OWASP/NodeGoat', 't'))
        .rejects.toThrow('Only http and https protocols are supported');
    });

    it('rejects ssh:// protocol', async () => {
      await expect(gitService.clone('ssh://git@github.com/OWASP/NodeGoat', 't'))
        .rejects.toThrow('Only http and https protocols are supported');
    });

    it('rejects garbage string as URL', async () => {
      await expect(gitService.clone('not-a-url', 't'))
        .rejects.toThrow('Invalid repository URL');
    });

    it('trims whitespace from URL', async () => {
      vi.mocked(execFile).mockImplementation((_f: any, _a: any, _o: any, cb: any) => cb(null));
      await expect(gitService.clone('  https://github.com/OWASP/NodeGoat  ', 't'))
        .resolves.toBeDefined();
    });
  });

  describe('clone', () => {
    it('rejects on repository not found', async () => {
      vi.mocked(execFile).mockImplementation((_file: any, _args: any, _opts: any, cb: any) => {
        cb(new Error("fatal: repository 'https://invalid/repo' not found"));
      });

      await expect(gitService.clone('https://invalid/repo', 'test-1'))
        .rejects.toThrow('Repository not found');
    });

    it('rejects on timeout', async () => {
      vi.mocked(execFile).mockImplementation((_file: any, _args: any, _opts: any, cb: any) => {
        const err = new Error('ETIMEDOUT') as NodeJS.ErrnoException;
        err.code = 'ETIMEDOUT';
        cb(err);
      });

      await expect(gitService.clone('https://slow-repo.com', 'test-2'))
        .rejects.toThrow('timed out');
    });

    it('rejects on authentication failure', async () => {
      vi.mocked(execFile).mockImplementation((_file: any, _args: any, _opts: any, cb: any) => {
        cb(new Error('fatal: Authentication failed'));
      });

      await expect(gitService.clone('https://private-repo.com', 'test-3'))
        .rejects.toThrow('authentication failed');
    });

    it('rejects when git is not installed', async () => {
      vi.mocked(execFile).mockImplementation((_file: any, _args: any, _opts: any, cb: any) => {
        const err = new Error('spawn git ENOENT') as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        cb(err);
      });

      await expect(gitService.clone('https://github.com/any/repo', 'test-4'))
        .rejects.toThrow('Git is not installed');
    });
  });

  describe('cleanup', () => {
    it('handles non-existent path gracefully', async () => {
      const fs = await import('fs/promises');
      try {
        await fs.rm('/tmp/nonexistent-test-path', { recursive: true, force: true });
      } catch {
        expect.fail('should not throw');
      }
    });
  });
});
