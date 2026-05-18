import { Router, Request, Response } from 'express';
import { ScanService } from '../services/ScanService';

export class ScanController {
  public router: Router;

  constructor(private scanService: ScanService) {
    this.router = Router();
    this.router.post('/scan', this.startScan.bind(this));
    this.router.get('/scan/:scanId', this.getScan.bind(this));
  }

  async startScan(req: Request, res: Response): Promise<void> {
    const { repoUrl } = req.body;
    if (!repoUrl || typeof repoUrl !== 'string') {
      res.status(400).json({ error: 'repoUrl is required' });
      return;
    }
    const result = await this.scanService.startScan(repoUrl);
    res.status(202).json(result);
  }

  async getScan(req: Request, res: Response): Promise<void> {
    const scanId = req.params.scanId as string;
    const result = await this.scanService.getScan(scanId);
    if (!result) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }
    res.json(result);
  }
}
