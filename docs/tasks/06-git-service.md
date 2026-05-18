# Task 06: Git Service

## Goal
Implement GitHub repository cloning into a temporary directory.

## Tasks

```typescript
interface GitServiceConfig {
  tempDir: string;  // Base path for temporary directories
  timeout: number;  // Clone timeout (ms)
}

class GitService {
  async clone(repoUrl: string, scanId: string): Promise<string> {
    // 0. Validate URL before passing to git:
    //    - new URL() checks syntax
    //    - protocol must be http: or https:
    //    - file://, git://, ssh:// — block
    // 1. Create temp directory: /tmp/code-guardian/{scanId}
    // 2. Execute: git clone --depth 1 {repoUrl}
    //    --depth 1 saves space (full history not needed)
    // 3. Return path to cloned repository
    // 4. On error — delete temp directory and throw error
  }

  async cleanup(repoPath: string): Promise<void> {
    // Delete temp directory with repository
    // Use fs.rm(path, { recursive: true, force: true })
  }
}
```

## Implementation
- `child_process.execFile('git', ['clone', '--depth', '1', url, dest])`
- Wrap in Promise with timeout
- Check exit code

## Error handling
- Invalid URL → `Invalid repository URL: <url>` or `Only http and https protocols are supported`
- Repository not found → Error
- Clone timeout → Error with timeout
- Insufficient disk space → Error
