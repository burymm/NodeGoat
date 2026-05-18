export enum ScanStatus {
  Queued = 'Queued',
  Scanning = 'Scanning',
  Finished = 'Finished',
  Failed = 'Failed',
}

export interface Vulnerability {
  id: string;
  package: string;
  severity: string;
  title: string;
  installedVersion: string;
  fixedVersion: string;
  publishedDate: string;
}

export interface Scan {
  scanId: string;
  repoUrl: string;
  status: ScanStatus;
  vulnerabilities: Vulnerability[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanRequest {
  repoUrl: string;
}

export interface ScanResponse {
  scanId: string;
  status: ScanStatus;
}

export interface ScanResultResponse {
  scanId: string;
  status: ScanStatus;
  vulnerabilities: Vulnerability[];
  error?: string;
}

export interface TrivyVulnerability {
  VulnerabilityID: string;
  PkgName: string;
  Severity: string;
  Title: string;
  InstalledVersion: string;
  FixedVersion: string;
  PublishedDate: string;
}

export interface TrivyResultItem {
  Target: string;
  Vulnerabilities?: TrivyVulnerability[];
}

export interface TrivyResult {
  Results?: TrivyResultItem[];
}
