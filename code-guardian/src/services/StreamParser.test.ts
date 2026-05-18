import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamParser, TrivyScanner } from './StreamParser';
import fs from 'fs';
import { Readable } from 'stream';

vi.mock('fs');

function makeJsonStream(json: object): any {
  const jsonStr = JSON.stringify(json);
  const chunks: Buffer[] = [];
  for (let i = 0; i < jsonStr.length; i += 20) {
    chunks.push(Buffer.from(jsonStr.slice(i, i + 20)));
  }
  return new Readable({
    read() {
      for (const c of chunks) this.push(c);
      this.push(null);
    },
  });
}

describe('StreamParser', () => {
  let parser: StreamParser;

  beforeEach(() => {
    parser = new StreamParser();
  });

  it('returns empty array when file has no Results key', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(makeJsonStream({}));
    const result = await parser.parse('/tmp/test.json');
    expect(result).toEqual([]);
  });

  it('returns empty array when Vulnerabilities array is empty', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(
      makeJsonStream({ Results: [{ Target: 'test', Vulnerabilities: [] }] })
    );
    const result = await parser.parse('/tmp/test.json');
    expect(result).toEqual([]);
  });

  it('returns empty array when no CRITICAL vulnerabilities exist', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(
      makeJsonStream({
        Results: [{
          Target: 'test',
          Vulnerabilities: [
            { VulnerabilityID: 'CVE-001', PkgName: 'pkg', Severity: 'HIGH', Title: 'h', InstalledVersion: '1', FixedVersion: '2', PublishedDate: '2024-01-01' },
            { VulnerabilityID: 'CVE-002', PkgName: 'pkg', Severity: 'MEDIUM', Title: 'm', InstalledVersion: '1', FixedVersion: '2', PublishedDate: '2024-01-01' },
          ],
        }],
      })
    );
    const result = await parser.parse('/tmp/test.json');
    expect(result).toEqual([]);
  });

  it('filters only CRITICAL vulnerabilities', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(
      makeJsonStream({
        Results: [{
          Target: 'test',
          Vulnerabilities: [
            { VulnerabilityID: 'CVE-2024-001', PkgName: 'pkg-a', Severity: 'CRITICAL', Title: 'Critical vuln', InstalledVersion: '1.0', FixedVersion: '1.1', PublishedDate: '2024-01-01' },
            { VulnerabilityID: 'CVE-2024-002', PkgName: 'pkg-b', Severity: 'HIGH', Title: 'High vuln', InstalledVersion: '1.0', FixedVersion: '1.1', PublishedDate: '2024-01-01' },
            { VulnerabilityID: 'CVE-2024-003', PkgName: 'pkg-c', Severity: 'CRITICAL', Title: 'Another critical', InstalledVersion: '2.0', FixedVersion: '2.1', PublishedDate: '2024-02-01' },
          ],
        }],
      })
    );
    const result = await parser.parse('/tmp/test.json');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('CVE-2024-001');
    expect(result[1].id).toBe('CVE-2024-003');
  });

  it('handles nested CVSS objects without corrupting vulnerability boundaries', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(
      makeJsonStream({
        Results: [{
          Target: 'test',
          Vulnerabilities: [
            {
              VulnerabilityID: 'CVE-2024-001',
              PkgName: 'pkg-a',
              Severity: 'CRITICAL',
              Title: 'Critical vuln',
              InstalledVersion: '1.0',
              FixedVersion: '1.1',
              PublishedDate: '2024-01-01',
              CVSS: { nvd: { V2Score: 7.5, V3Score: 9.8 } },
              CweIDs: ['CWE-79', 'CWE-89'],
            },
          ],
        }],
      })
    );
    const result = await parser.parse('/tmp/test.json');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('CVE-2024-001');
    expect(result[0].severity).toBe('CRITICAL');
  });

  it('handles multiple Result items with Vulnerabilities arrays', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(
      makeJsonStream({
        Results: [
          { Target: 'pkg.json', Vulnerabilities: [{ VulnerabilityID: 'CVE-001', PkgName: 'pkg-a', Severity: 'CRITICAL', Title: 'A', InstalledVersion: '1', FixedVersion: '2', PublishedDate: '2024-01-01' }] },
          { Target: 'Dockerfile', Vulnerabilities: [{ VulnerabilityID: 'CVE-002', PkgName: 'pkg-b', Severity: 'CRITICAL', Title: 'B', InstalledVersion: '1', FixedVersion: '2', PublishedDate: '2024-01-01' }] },
        ],
      })
    );
    const result = await parser.parse('/tmp/test.json');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('CVE-001');
    expect(result[1].id).toBe('CVE-002');
  });

  it('handles deeply nested objects inside vulnerabilities', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(
      makeJsonStream({
        Results: [{
          Target: 'test',
          Vulnerabilities: [
            {
              VulnerabilityID: 'CVE-2024-001',
              PkgName: 'pkg-a',
              Severity: 'CRITICAL',
              Title: 'Deep nested',
              InstalledVersion: '1.0',
              FixedVersion: '1.1',
              PublishedDate: '2024-01-01',
              CVSS: {
                nvd: { V2Score: 7.5, V3Score: 9.8, V3Vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
                redhat: { V3Score: 9.8 },
              },
            },
            {
              VulnerabilityID: 'CVE-2024-002',
              PkgName: 'pkg-b',
              Severity: 'CRITICAL',
              Title: 'After nested',
              InstalledVersion: '2.0',
              FixedVersion: '2.1',
              PublishedDate: '2024-02-01',
            },
          ],
        }],
      })
    );
    const result = await parser.parse('/tmp/test.json');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('CVE-2024-001');
    expect(result[0].title).toBe('Deep nested');
    expect(result[1].id).toBe('CVE-2024-002');
    expect(result[1].title).toBe('After nested');
  });

  it('rejects on file read error', async () => {
    const errStream = new Readable({ read() { this.destroy(new Error('ENOENT: no such file')); } });
    vi.mocked(fs.createReadStream).mockReturnValue(errStream);
    await expect(parser.parse('/tmp/nonexistent.json')).rejects.toThrow('ENOENT');
  });

  it('handles empty Results array', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(
      makeJsonStream({ Results: [] })
    );
    const result = await parser.parse('/tmp/test.json');
    expect(result).toEqual([]);
  });
});

describe('TrivyScanner (direct write tests)', () => {
  function scanJson(json: object): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const scanner = new TrivyScanner();
      const results: any[] = [];
      scanner.on('data', (d: any) => results.push(d));
      scanner.on('end', () => resolve(results));
      scanner.on('error', reject);
      const jsonStr = JSON.stringify(json);
      const chunkSize = 10;
      for (let i = 0; i < jsonStr.length; i += chunkSize) {
        scanner.write(Buffer.from(jsonStr.slice(i, i + chunkSize)));
      }
      scanner.end();
    });
  }

  it('emits nothing for non-CRITICAL vulnerabilities', async () => {
    const result = await scanJson({
      Results: [{ Vulnerabilities: [{ Severity: 'HIGH' }, { Severity: 'LOW' }] }],
    });
    expect(result).toHaveLength(0);
  });

  it('emits CRITICAL vulnerabilities with mapped fields', async () => {
    const result = await scanJson({
      Results: [{
        Vulnerabilities: [{
          VulnerabilityID: 'CVE-001',
          PkgName: 'pkg-a',
          Severity: 'CRITICAL',
          Title: 'Test vuln',
          InstalledVersion: '1.0',
          FixedVersion: '1.1',
          PublishedDate: '2024-01-01',
        }],
      }],
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'CVE-001',
      package: 'pkg-a',
      severity: 'CRITICAL',
      title: 'Test vuln',
      installedVersion: '1.0',
      fixedVersion: '1.1',
      publishedDate: '2024-01-01',
    });
  });

  it('does not capture fields from nested CVSS objects', async () => {
    const result = await scanJson({
      Results: [{
        Vulnerabilities: [{
          VulnerabilityID: 'CVE-001',
          Severity: 'CRITICAL',
          CVSS: { nvd: { V3Score: 9.8 } },
        }],
      }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('CVE-001');
  });

  it('emits multiple CRITICAL vulns and skips non-CRITICAL', async () => {
    const result = await scanJson({
      Results: [{
        Vulnerabilities: [
          { VulnerabilityID: 'CVE-001', Severity: 'CRITICAL' },
          { VulnerabilityID: 'CVE-002', Severity: 'HIGH' },
          { VulnerabilityID: 'CVE-003', Severity: 'CRITICAL' },
        ],
      }],
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('CVE-001');
    expect(result[1].id).toBe('CVE-003');
  });

  it('handles multiple Results with Vulnerabilities arrays', async () => {
    const result = await scanJson({
      Results: [
        { Target: 'a', Vulnerabilities: [{ VulnerabilityID: 'CVE-001', Severity: 'CRITICAL' }] },
        { Target: 'b', Vulnerabilities: [{ VulnerabilityID: 'CVE-002', Severity: 'CRITICAL' }] },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('CVE-001');
    expect(result[1].id).toBe('CVE-002');
  });
});
