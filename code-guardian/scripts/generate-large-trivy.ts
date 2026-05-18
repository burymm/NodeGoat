import fs from 'fs';
import path from 'path';

const TARGET_SIZE = parseInt(process.argv[2] || '200', 10);
const OUTPUT = path.resolve(process.argv[3] || `/tmp/code-guardian/large-trivy.json`);

const count = Math.max(1, Math.round(TARGET_SIZE * 1024 * 1024 / 420));

const vulnTemplate = (i: number) => `    {
      "VulnerabilityID": "CVE-2024-${String(i).padStart(4, '0')}",
      "PkgName": "pkg-${i}",
      "PkgPath": "node_modules/pkg-${i}",
      "InstalledVersion": "1.0.0",
      "FixedVersion": "1.0.1",
      "Severity": "${i % 4 === 0 ? 'CRITICAL' : i % 3 === 0 ? 'HIGH' : i % 2 === 0 ? 'MEDIUM' : 'LOW'}",
      "Title": "Test vulnerability ${i}",
      "PublishedDate": "2024-01-01T00:00:00Z",
      "CVSS": {
        "nvd": {
          "V2Score": 7.5,
          "V3Score": 9.8
        },
        "redhat": {
          "V3Score": 9.8
        }
      },
      "CweIDs": ["CWE-${79 + (i % 20)}"],
      "References": ["https://nvd.nist.gov/vuln/detail/CVE-2024-${String(i).padStart(4, '0')}"]
    }`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
const ws = fs.createWriteStream(OUTPUT);
ws.write('{\n  "Results": [\n    {\n      "Target": "package-lock.json",\n      "Class": "lang-pkgs",\n      "Type": "npm",\n      "Vulnerabilities": [\n');
const batch = 1000;
let written = 0;
function writeNext() {
  let ok = true;
  const end = Math.min(written + batch, count);
  for (let i = written; i < end; i++) {
    if (i > 0) ws.write(',\n');
    ws.write(vulnTemplate(i));
  }
  written = end;
  if (written < count) {
    if (ok) setImmediate(writeNext);
    else ws.once('drain', writeNext);
  } else {
    ws.write('\n      ]\n    }\n  ]\n}\n');
    ws.end();
    ws.on('close', () => {
      const stats = fs.statSync(OUTPUT);
      console.log(`Generated ${count} vulnerabilities (${(stats.size / 1024 / 1024).toFixed(1)} MB) → ${OUTPUT}`);
    });
  }
}
writeNext();
