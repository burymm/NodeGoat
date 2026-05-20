import { execFile } from 'child_process';
import path from 'path';

const SCAN_TIMEOUT = 300_000;
const MAX_RETRIES = 2;

export class TrivyService {
  private outputDir = '/tmp/code-guardian';

  async scan(repoPath: string, scanId: string): Promise<string> {
    const outputPath = path.join(this.outputDir, `${scanId}-trivy.json`);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.execTrivy([
          'filesystem', '--format', 'json', '-o', outputPath,
          '--skip-db-update', '--offline-scan',
          '--scanners', 'vuln',
          repoPath,
        ]);
        return outputPath;
      } catch (err) {
        const isLastAttempt = attempt === MAX_RETRIES;
        if (isLastAttempt) throw err;

        await this.clearCache();
      }
    }

    return outputPath;
  }

  private async clearCache(): Promise<void> {
    return new Promise((resolve) => {
      execFile('trivy', ['image', '--clear-cache'], { timeout: 30_000 }, () => resolve());
    });
  }

  private execTrivy(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = execFile('trivy', args, { timeout: SCAN_TIMEOUT }, (err, _stdout, stderr) => {
        if (!err) return resolve();

        const msg = err.message.toLowerCase();

        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          return reject(new Error('Trivy is not installed or not found in PATH'));
        }
        if ((err as NodeJS.ErrnoException).code === 'ENOSPC') {
          return reject(new Error('Disk full: insufficient space for scan output'));
        }
        if ((err as NodeJS.ErrnoException).code === 'ETIMEDOUT' || msg.includes('timed out')) {
          return reject(new Error(`Trivy scan timed out after ${SCAN_TIMEOUT / 1000}s`));
        }

        const stderrMsg = stderr?.toString?.() || '';
        const firstLine = stderrMsg.split('\n')[0] || err.message;
        reject(new Error(`Trivy scan failed: ${firstLine}`));
      });

      child.on('error', (err: Error) => {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          reject(new Error('Trivy is not installed or not found in PATH'));
        } else {
          reject(new Error(`Trivy scan failed: ${err.message}`));
        }
      });
    });
  }
}
