import { v4 as uuidv4 } from "uuid";
import { ScanStore } from '../store/ScanStore';
import { ScanWorker } from '../workers/ScanWorker';
import { ScanStatus, ScanResponse, ScanResultResponse } from '../types';

export class ScanService {
  constructor(
    private scanStore: ScanStore,
    private scanWorker: ScanWorker,
  ) {}

  async startScan(repoUrl: string): Promise<ScanResponse> {
    const scanId = uuidv4();
    await this.scanStore.create({
      scanId,
      repoUrl,
      status: ScanStatus.Queued,
      vulnerabilities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.scanWorker.enqueue(scanId, repoUrl);
    return { scanId, status: ScanStatus.Queued };
  }

  async getScan(scanId: string): Promise<ScanResultResponse | null> {
    const scan = await this.scanStore.findById(scanId);
    if (!scan) return null;
    return {
      scanId: scan.scanId,
      status: scan.status,
      vulnerabilities: scan.vulnerabilities,
      error: scan.error,
    };
  }
}
