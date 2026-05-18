# Task 09: Scan Store (MongoDB)

## Goal
Implement scan result storage and retrieval.

## Why MongoDB instead of in-memory
- With a 256MB limit, storing objects in application memory is risky
- MongoDB already exists in the project, no new infrastructure needed
- Data persists across container restarts

## Interface

```typescript
class ScanStore {
  constructor(private db: Db) {}  // MongoDB Db from driver

  async create(scan: Scan): Promise<void>
  async update(scanId: string, update: Partial<Scan>): Promise<void>
  async findById(scanId: string): Promise<Scan | null>
}
```

## Collection

```
Collection: codeGuardian.scans

{
  "_id": "uuid-scan-id",
  "repoUrl": "https://github.com/owner/repo",
  "status": "Queued | Scanning | Finished | Failed",
  "vulnerabilities": [
    {
      "id": "CVE-2024-1234",
      "package": "lodash",
      "severity": "CRITICAL",
      "title": "Prototype Pollution",
      "installedVersion": "4.17.20",
      "fixedVersion": "4.17.21",
      "publishedDate": "2024-01-15"
    }
  ],
  "error": "optional error message",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## Connection options

### Option 1: Reuse existing connection
- `server.js` already has MongoClient.connect
- Pass `db` to Code Guardian constructor during initialization
- Pro: single connection, no additional setup

### Option 2: Separate connection
- Code Guardian connects to MongoDB independently
- Pro: independence from the main application

Recommended: Option 1 — reuse existing connection.
