# Task 04: TypeScript Types (Interfaces)

## Goal
Define TypeScript interfaces for the entire Code Guardian. No `any`.

## Interfaces

```typescript
enum ScanStatus {
  Queued = "Queued",
  Scanning = "Scanning",
  Finished = "Finished",
  Failed = "Failed"
}

interface Vulnerability {
  id: string;              // CVE ID: "CVE-2024-1234"
  package: string;         // "lodash"
  severity: string;        // "CRITICAL"
  title: string;           // "Prototype Pollution in lodash"
  installedVersion: string;
  fixedVersion: string;
  publishedDate: string;
}

interface Scan {
  scanId: string;          // UUID v4
  repoUrl: string;         // GitHub URL
  status: ScanStatus;
  vulnerabilities: Vulnerability[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ScanRequest {
  repoUrl: string;         // POST /api/scan input parameter
}

interface ScanResponse {
  scanId: string;
  status: ScanStatus;
}

interface ScanResultResponse {
  scanId: string;
  status: ScanStatus;
  vulnerabilities: Vulnerability[];
  error?: string;
}

// For Trivy JSON report structure
interface TrivyResult {
  Results?: TrivyResultItem[];
}

interface TrivyResultItem {
  Target: string;
  Vulnerabilities?: TrivyVulnerability[];
}

interface TrivyVulnerability {
  VulnerabilityID: string;
  PkgName: string;
  Severity: string;
  Title: string;
  InstalledVersion: string;
  FixedVersion: string;
  PublishedDate: string;
}
```
