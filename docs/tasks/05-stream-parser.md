# Task 05: Stream Parser (Core)

## Goal
Implement streaming Parse of Trivy JSON report without loading the entire file into memory.

## Key requirement
**Using `fs.readFile` or `JSON.parse` on scan results is prohibited.**

## Algorithm

Trivy JSON output has the following structure:
```json
{
  "Results": [
    {
      "Target": "package-lock.json",
      "Vulnerabilities": [
        {
          "VulnerabilityID": "CVE-2024-1234",
          "PkgName": "lodash",
          "Severity": "CRITICAL",
          "Title": "Prototype Pollution",
          "InstalledVersion": "4.17.20",
          "FixedVersion": "4.17.21",
          "PublishedDate": "2024-01-15"
        }
      ]
    }
  ]
}
```

## Implementation: Custom Char-by-Char Stream Parser

`stream-json` was initially used but caused OOM at 165MB heap for a 274MB input file (creating millions of short-lived token objects). Replaced with a custom `TrivyScanner` Transform — a char-by-char state machine with zero intermediate object allocation.

```typescript
class TrivyScanner extends Transform {
  private buf = '';
  private inVulnArray = false;
  private vulnDepth = 0;
  private expectingField = true;

  // Accumulators for current vulnerability fields
  private vId = '';
  private vPkg = '';
  private vSev = '';
  private vTitle = '';
  private vInstVer = '';
  private vFixedVer = '';
  private vPubDate = '';

  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    this.buf += chunk.toString('utf8');
    this.scan();
    callback();
  }
}
```

**State machine logic** (`scan()` method):
- Walks the buffer character by character
- On `"`: reads string value, accumulates characters via `parts[]` array (avoids SlicedString leak from `buf.slice()`)
- Tracks `vulnDepth` — integer counter for object nesting inside Vulnerabilities array; nested objects (CVSS, CweIDs) don't trigger false vuln starts/ends
- On `{` inside the vuln array at depth 0: starts new vulnerability accumulator
- On `}` when depth returns to 0: calls `emitVuln()` which pushes only CRITICAL severity vulns into the stream
- On `\uXXXX` escape: parses hex and advances `j += 4` (bug fix: was `j += 5` causing closing `"` to be skipped)

## \uXXXX Escape Bug Fix
When `\u003e"` appeared at end of a string value, the handler did `j += 5` plus outer loop `j += 2` = +7 instead of the correct `j += 4` + `j += 2` = +6. This skipped the closing `"`, corrupting parser state and returning 0 vulns. Fixed by changing `j += 5` to `j += 4`.

## Memory Efficiency
- `highWaterMark: 64KB` — read in 64KB chunks
- Zero intermediate objects — char-by-char state machine
- String values built via `parts[]` array + `join('')` to avoid SlicedString memory leaks
- Only CRITICAL vulns emitted downstream
- OOM test passes: 274MB input → 70MB heap (limit 150MB)
- 3.4s parse time for 499K vulnerabilities (~125K CRITICAL)

## Errors
- File does not exist → reject
- Invalid JSON → state machine may produce partial results or stall
- Disk I/O error → reject
