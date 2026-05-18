# Task 10: Error Handling

## Goal
Clear error messages for every scenario + tests.

## Scenarios

### GitService
| Situation | Message |
|---|---|---|
| Invalid URL (syntax) | `Invalid repository URL: <url>` |
| Invalid URL (protocol) | `Only http and https protocols are supported` |
| git not installed | `Git is not installed or not found in PATH` |
| Repository not found | `Repository not found: <url>` |
| Timeout | `Git clone timed out after 120s` |
| Authentication error | `Git authentication failed. Check repository permissions` |
| Disk full | `Disk full: insufficient space to clone repository` |

### TrivyService
| Situation | Message |
|---|---|
| trivy not installed | `Trivy is not installed or not found in PATH` |
| Timeout | `Trivy scan timed out after 300s` |
| Scan error | `Trivy scan failed: <stderr>` |
| Disk full | `Disk full: insufficient space for scan output` |

### Other improvements
- GitService cleans up temp directory on clone error
- Clean `Partial<Scan>` usage in `ScanStore.update` — no type casts
- Tests for all scenarios (39 tests, vitest — 5 test files)
- Tests excluded from `tsconfig` (not compiled in production)
