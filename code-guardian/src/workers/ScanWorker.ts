import { ScanStore } from '../store/ScanStore';
import { GitService } from '../services/GitService';
import { TrivyService } from '../services/TrivyService';
import { StreamParser } from '../services/StreamParser';
import { ScanStatus } from '../types';

interface ScanTask {
  scanId: string;
  repoUrl: string;
}

export class ScanWorker {
  private queue: ScanTask[] = [];
  private busy = false;

  constructor(
    private scanStore: ScanStore,
    private gitService: GitService,
    private trivyService: TrivyService,
    private streamParser: StreamParser,
  ) {}

  enqueue(scanId: string, repoUrl: string): void {
    this.queue.push({ scanId, repoUrl });
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.busy || this.queue.length === 0) return;
    this.busy = true;

    const task = this.queue.shift()!;
    await this.execute(task);

    this.busy = false;
    this.processNext();
  }

  private async execute(task: ScanTask): Promise<void> {
    const { scanId, repoUrl } = task;
    let repoPath = '';
    let trivyOutputPath = '';

    try {
      await this.scanStore.update(scanId, {
        status: ScanStatus.Scanning,
        updatedAt: new Date(),
      });

      repoPath = await this.gitService.clone(repoUrl, scanId);
      trivyOutputPath = await this.trivyService.scan(repoPath, scanId);
      const vulns = await this.streamParser.parse(trivyOutputPath);

      await this.scanStore.update(scanId, {
        status: ScanStatus.Finished,
        vulnerabilities: vulns,
        updatedAt: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await this.scanStore.update(scanId, {
        status: ScanStatus.Failed,
        error: message,
        updatedAt: new Date(),
      });
    } finally {
      if (repoPath) {
        await this.gitService.cleanup(repoPath).catch(() => {});
      }
      if (trivyOutputPath) {
        const fs = await import('fs/promises');
        await fs.rm(trivyOutputPath, { force: true }).catch(() => {});
      }
    }
  }
}
