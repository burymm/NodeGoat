import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const CLONE_TIMEOUT = 120_000;

export class GitService {
  private baseDir = '/tmp/code-guardian';

  async clone(rawUrl: string, scanId: string): Promise<string> {
    const repoUrl = this.validateUrl(rawUrl);
    const dest = path.join(this.baseDir, scanId);
    await fs.mkdir(dest, { recursive: true });
    try {
      await this.execGit(['clone', '--depth', '1', repoUrl, dest], repoUrl);
      return dest;
    } catch (err) {
      await fs.rm(dest, { recursive: true, force: true });
      throw err;
    }
  }

  async cleanup(repoPath: string): Promise<void> {
    await fs.rm(repoPath, { recursive: true, force: true });
  }

  private validateUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) throw new Error('Invalid repository URL: URL is empty');

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error(`Invalid repository URL: ${trimmed}`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Only http and https protocols are supported');
    }

    return trimmed;
  }

  private execGit(args: string[], repoUrl?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = execFile('git', args, { timeout: CLONE_TIMEOUT }, (err) => {
        if (!err) return resolve();

        const msg = err.message.toLowerCase();

        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          return reject(new Error('Git is not installed or not found in PATH'));
        }
        if ((err as NodeJS.ErrnoException).code === 'ENOSPC') {
          return reject(new Error('Disk full: insufficient space to clone repository'));
        }
        if ((err as NodeJS.ErrnoException).code === 'ETIMEDOUT' || msg.includes('timed out')) {
          return reject(new Error(`Git clone timed out after ${CLONE_TIMEOUT / 1000}s`));
        }
        if (msg.includes('authentication failed')) {
          return reject(new Error('Git authentication failed. Check repository permissions'));
        }
        if (msg.includes('repository not found') || msg.includes('not found')) {
          return reject(new Error(`Repository not found${repoUrl ? ': ' + repoUrl : ''}`));
        }

        reject(new Error(`Git clone failed: ${err.message}`));
      });

      child.on('error', (err: Error) => {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          reject(new Error('Git is not installed or not found in PATH'));
        } else {
          reject(new Error(`Git clone failed: ${err.message}`));
        }
      });
    });
  }
}
