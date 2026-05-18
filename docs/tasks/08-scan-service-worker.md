# Task 08: Scan Service & Worker

## Goal
Orchestrate the full scan process in the background.

## ScanService (Controller → Service)

```typescript
class ScanService {
  constructor(
    private gitService: GitService,
    private trivyService: TrivyService,
    private scanWorker: ScanWorker,
    private scanStore: ScanStore
  ) {}

  async startScan(repoUrl: string): Promise<ScanResponse> {
    // 1. Create Scan in ScanStore (status: Queued)
    // 2. Submit task to ScanWorker
    // 3. Return { scanId, status: "Queued" }
  }

  async getScan(scanId: string): Promise<ScanResultResponse | null> {
    // 1. Get Scan from ScanStore by scanId
    // 2. Return data or null (for 404)
  }
}
```

## ScanWorker (Background Worker)

```typescript
class ScanWorker {
  private queue: Map<string, ScanTask> = new Map();

  async enqueue(scanId: string, repoUrl: string): Promise<void> {
    // Add task
    // Run processNext if worker is not busy
  }

  private async processScan(scanId: string, repoUrl: string): Promise<void> {
    // 1. Update status → "Scanning"
    // 2. GitService.clone(repoUrl, scanId)
    // 3. TrivyService.scan(repoPath, scanId) → outputPath
    // 4. StreamParser.parse(outputPath) → criticalVulns[]
    // 5. Update status → "Finished" with vulnerabilities
    // 6. cleanup: delete repo + JSON file
    // ...catch...
    // 7. on error: status → "Failed" + error message
    // 8. cleanup: delete repo + JSON file
  }
}
```

## Data flow
```
POST /api/scan
  → ScanController
    → ScanService.startScan(url)
      → ScanStore.create(Queued)
      → ScanWorker.enqueue(scanId, url)
      ← { scanId, "Queued" }

Background:
  → ScanWorker.processScan()
    → ScanStore.update(Scanning)
    → GitService.clone()
    → TrivyService.scan()
    → StreamParser.parse()  ← streams only, no fs.readFile!
    → ScanStore.update(Finished, vulns)
    → cleanup()

GET /api/scan/:scanId
  → ScanController
    → ScanService.getScan(scanId)
    → ScanStore.findById(scanId)
    ← { scanId, status, vulnerabilities? }
```
