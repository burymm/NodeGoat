import { Scan, ScanStatus } from '../types';

function mapScan(scan: Scan) {
  return {
    id: scan.scanId,
    status: scan.status,
    repoUrl: scan.repoUrl,
    vulnerabilities: scan.vulnerabilities,
    error: scan.error || null,
    createdAt: scan.createdAt instanceof Date
      ? scan.createdAt.toISOString()
      : String(scan.createdAt),
    updatedAt: scan.updatedAt instanceof Date
      ? scan.updatedAt.toISOString()
      : String(scan.updatedAt),
  };
}

export interface ResolverContext {
  scanStore: {
    findById(id: string): Promise<Scan | null>;
    findAll(): Promise<Scan[]>;
  };
  scanService: {
    startScan(repoUrl: string): Promise<{ scanId: string; status: ScanStatus }>;
  };
}

export const resolvers = {
  scan: async ({ id }: { id: string }, context: ResolverContext) => {
    const scan = await context.scanStore.findById(id);
    return scan ? mapScan(scan) : null;
  },
  scans: async (_args: unknown, context: ResolverContext) => {
    const scans = await context.scanStore.findAll();
    return scans.map(mapScan);
  },
  startScan: async ({ repoUrl }: { repoUrl: string }, context: ResolverContext) => {
    const result = await context.scanService.startScan(repoUrl);
    const scan = await context.scanStore.findById(result.scanId);
    if (!scan) throw new Error('Scan not found after creation');
    return mapScan(scan);
  },
};
