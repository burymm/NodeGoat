# Task 03: Scan Endpoints (Controller)

## Goal
Create REST endpoints for scan management.

## Specification

### POST /api/scan
- **Input**: `{ "repoUrl": "https://github.com/owner/repo" }` (JSON body)
- **Response**: `{ "scanId": "uuid-string", "status": "Queued" }`
- **Status Code**: 202 Accepted
- **Behavior**:
  1. URL validation (must be http or https; `new URL()` syntax check)
  2. Generate scanId (uuid)
  3. Write to ScanStore: `{ scanId, repoUrl, status: "Queued", createdAt }`
  4. Submit task to ScanWorker (background)
  5. Instant response to client
- **Non-Blocking**: Do not wait for scan completion

### GET /api/scan/:scanId
- **Response**:
  ```json
  {
    "scanId": "uuid",
    "status": "Queued | Scanning | Finished | Failed",
    "vulnerabilities": [
      {
        "id": "CVE-2024-1234",
        "package": "lodash",
        "severity": "CRITICAL",
        "title": "...",
        "installedVersion": "4.17.20",
        "fixedVersion": "4.17.21"
      }
    ],
    "error": "Error message if Failed"
  }
  ```
- **Status Code**:
  - 200 — found (any status)
  - 404 — scanId not found

### Error handling in controller
- Invalid URL → 400 Bad Request
- scanId not found → 404 Not Found
- Always return JSON (not HTML)
