import type { ScanResult, ScanMode } from './types';

export const api = {
  rest: { start: startScan, poll: getScan },
  graphql: { start: startScanGraphQL, poll: getScanGraphQL },
} satisfies Record<ScanMode, { start: (url: string) => Promise<{ scanId: string }>; poll: (id: string) => Promise<ScanResult> }>;

export async function startScan(repoUrl: string): Promise<{ scanId: string }> {
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to start scan');
  }
  return res.json();
}

export async function getScan(scanId: string): Promise<ScanResult> {
  const res = await fetch(`/api/scan/${scanId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to get scan result');
  }
  return res.json();
}

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error('GraphQL request failed');
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data as T;
}

export async function startScanGraphQL(repoUrl: string): Promise<{ scanId: string }> {
  const data = await graphqlRequest<{ startScan: { id: string } }>(
    `mutation($repoUrl: String!) { startScan(repoUrl: $repoUrl) { id } }`,
    { repoUrl },
  );
  return { scanId: data.startScan.id };
}

export async function getScanGraphQL(scanId: string): Promise<ScanResult> {
  const data = await graphqlRequest<{ scan: { id: string; status: string; vulnerabilities?: Array<{ id: string; package: string; severity: string; title: string; installedVersion: string; fixedVersion: string; publishedDate: string }>; error?: string } }>(
    `query($id: ID!) { scan(id: $id) { id status vulnerabilities { id package severity title installedVersion fixedVersion publishedDate } error } }`,
    { id: scanId },
  );
  return {
    scanId: data.scan.id,
    status: data.scan.status as ScanResult['status'],
    vulnerabilities: (data.scan.vulnerabilities || []),
    error: data.scan.error,
  };
}
