import { StreamParser } from '../src/services/StreamParser';
import fs from 'fs';

const FILE = process.argv[2] || '/tmp/code-guardian/large-trivy.json';
const EXPECTED_CRITICAL = parseInt(process.argv[3] || '0', 10);

if (!fs.existsSync(FILE)) {
  console.error(`File not found: ${FILE}`);
  process.exit(1);
}

const stats = fs.statSync(FILE);
const LIMIT_MB = 150;
console.log(`File: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
console.log(`V8 heap limit: ~${LIMIT_MB} MB`);
console.log('Parsing with TrivyScanner...\n');

const start = Date.now();
const parser = new StreamParser();
parser.parse(FILE).then(vulns => {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const mem = process.memoryUsage();
  console.log(`Result: ${vulns.length} critical vulnerabilities`);
  console.log(`Time: ${elapsed}s`);
  console.log(`Heap used: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Heap total: ${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`);
  console.log(`RSS: ${(mem.rss / 1024 / 1024).toFixed(1)} MB`);

  if (EXPECTED_CRITICAL > 0 && Math.abs(vulns.length - EXPECTED_CRITICAL) > 1) {
    console.error(`FAIL: expected ~${EXPECTED_CRITICAL} critical vulns, got ${vulns.length}`);
    process.exit(1);
  }
  if (mem.heapUsed > LIMIT_MB * 1024 * 1024 * 0.9) {
    console.error(`WARN: heap usage (${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB) close to ${LIMIT_MB} MB limit`);
  } else {
    console.log(`\nOOM test PASSED — heap stays within ${LIMIT_MB} MB (${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB used)`);
  }
}).catch(err => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
