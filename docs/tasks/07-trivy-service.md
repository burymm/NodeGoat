# Task 07: Trivy Service

## Goal
Implement Trivy scanner execution and JSON report retrieval.

## Approach: Trivy in the same container

Trivy binary is installed in the Dockerfile. No sidecar needed.

- Run: `trivy filesystem --format json -o /tmp/result.json /tmp/repo-path`
- Output written to file, then read by StreamParser

## Interface

```typescript
class TrivyService {
  async scan(repoPath: string, scanId: string): Promise<string> {
    // 1. Run: trivy filesystem --format json -o {outputPath} {repoPath}
    // 2. Wait for completion
    // 3. Check exit code
    // 4. Return path to JSON result file
  }
}
```

## Output JSON
Trivy outputs JSON with a Results array, each containing Target + Vulnerabilities.
Structure is used in Task 05 (Stream Parser).

## Error handling
- Trivy not found → Error
- Trivy timeout → Error (kill process)
- Trivy returned non-zero exit → Error
- Empty repository / no packages → empty result, not an error
