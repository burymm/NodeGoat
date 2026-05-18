export type ScanMode = 'rest' | 'graphql';

export type ScanStatus = 'Queued' | 'Scanning' | 'Finished' | 'Failed';

export interface Vulnerability {
  id: string;
  package: string;
  severity: string;
  title: string;
  installedVersion: string;
  fixedVersion: string;
  publishedDate: string;
}

export interface ScanResult {
  scanId: string;
  status: ScanStatus;
  vulnerabilities: Vulnerability[];
  error?: string;
}
