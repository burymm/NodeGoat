import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const GENERATE_SCRIPT = path.resolve(PROJECT_ROOT, 'code-guardian/scripts/generate-large-trivy.ts');
const STRESS_SCRIPT = path.resolve(PROJECT_ROOT, 'code-guardian/scripts/stress-test.ts');
const OUTPUT_FILE = '/tmp/code-guardian/oom-test-trivy.json';

describe('OOM stress test', () => {
  it('processes 50MB Trivy JSON within 150MB heap limit', () => {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

    const gen = execFileSync('npx', ['tsx', GENERATE_SCRIPT, '50', OUTPUT_FILE], {
      timeout: 120_000,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });
    console.log('Generated:', gen.trim());

    const result = execFileSync('npx', [
      'tsx',
      STRESS_SCRIPT,
      OUTPUT_FILE,
      '31207',
    ], {
      timeout: 120_000,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=150' },
    });

    expect(result).toContain('OOM test PASSED');
    console.log(result.trim());
  });
}, 240_000);
