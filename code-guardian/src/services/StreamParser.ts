import { Transform, TransformCallback } from 'stream';
import fs from 'fs';
import { Vulnerability } from '../types';

class TrivyScanner extends Transform {
  private buf = '';
  private expectingVulnArray = false;
  private inVulnArray = false;
  private vulnDepth = 0;
  private expectingField = true;
  private currentField = '';

  private vId = '';
  private vPkg = '';
  private vSev = '';
  private vTitle = '';
  private vInstVer = '';
  private vFixedVer = '';
  private vPubDate = '';

  constructor() {
    super({ objectMode: true, readableObjectMode: true });
  }

  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    this.buf += chunk.toString('utf8');
    this.scan();
    callback();
  }

  private emitVuln(): void {
    if (this.vSev === 'CRITICAL') {
      this.push({
        id: this.vId,
        package: this.vPkg,
        severity: this.vSev,
        title: this.vTitle,
        installedVersion: this.vInstVer,
        fixedVersion: this.vFixedVer,
        publishedDate: this.vPubDate,
      });
    }
  }

  private resetVuln(): void {
    this.vId = '';
    this.vPkg = '';
    this.vSev = '';
    this.vTitle = '';
    this.vInstVer = '';
    this.vFixedVer = '';
    this.vPubDate = '';
  }

  private setField(val: string): void {
    switch (this.currentField) {
      case 'VulnerabilityID': this.vId = val; break;
      case 'PkgName': this.vPkg = val; break;
      case 'Severity': this.vSev = val; break;
      case 'Title': this.vTitle = val; break;
      case 'InstalledVersion': this.vInstVer = val; break;
      case 'FixedVersion': this.vFixedVer = val; break;
      case 'PublishedDate': this.vPubDate = val; break;
    }
  }

  private scan(): void {
    let i = 0;
    const len = this.buf.length;

    while (i < len) {
      const c = this.buf[i];

      if (c === '"') {
        let j = i + 1;
        const parts: string[] = [];
        while (j < len) {
          const ch = this.buf[j];
          if (ch === '\\' && j + 1 < len) {
            const next = this.buf[j + 1];
            switch (next) {
              case '"': parts.push('"'); break;
              case '\\': parts.push('\\'); break;
              case '/': parts.push('/'); break;
              case 'b': parts.push('\b'); break;
              case 'f': parts.push('\f'); break;
              case 'n': parts.push('\n'); break;
              case 'r': parts.push('\r'); break;
              case 't': parts.push('\t'); break;
              case 'u': {
                const hex = this.buf.slice(j + 2, j + 6);
                parts.push(String.fromCharCode(parseInt(hex, 16)));
                j += 4;
                break;
              }
              default: parts.push(next);
            }
            j += 2;
          } else if (ch === '"') {
            break;
          } else {
            parts.push(ch);
            j++;
          }
        }
        const val = parts.join('');
        if (j >= len) {
          this.buf = this.buf.slice(i);
          return;
        }
        i = j + 1;

        if (this.expectingField) {
          if (this.vulnDepth === 0 && val === 'Vulnerabilities') {
            this.expectingVulnArray = true;
          }
          this.currentField = val;
          this.expectingField = false;
        } else if (this.vulnDepth > 0 && this.currentField) {
          this.setField(val);
          this.currentField = '';
        } else {
          this.currentField = '';
        }
        continue;
      }

      switch (c) {
        case '{':
          if (this.inVulnArray && this.vulnDepth === 0) {
            this.vulnDepth = 1;
            this.expectingField = true;
            this.resetVuln();
          } else if (this.vulnDepth > 0) {
            this.vulnDepth++;
          }
          this.expectingField = true;
          break;
        case '}':
          if (this.vulnDepth > 0) {
            this.vulnDepth--;
            if (this.vulnDepth === 0) {
              this.emitVuln();
              this.resetVuln();
            }
          }
          this.expectingField = true;
          break;
        case '[':
          if (this.expectingVulnArray) {
            this.inVulnArray = true;
            this.expectingVulnArray = false;
          }
          this.expectingField = true;
          break;
        case ']':
          if (this.vulnDepth === 0) {
            this.inVulnArray = false;
          }
          this.expectingField = true;
          break;
        case ':':
          this.expectingField = false;
          break;
        case ',':
          this.expectingField = true;
          this.currentField = '';
          break;
      }
      i++;
    }

    this.buf = '';
  }
}

export { TrivyScanner };

export class StreamParser {
  async parse(filePath: string): Promise<Vulnerability[]> {
    return new Promise((resolve, reject) => {
      const criticalVulns: Vulnerability[] = [];

      const readStream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });
      const scanner = new TrivyScanner();

      scanner.on('data', (vuln: Vulnerability) => criticalVulns.push(vuln));
      scanner.on('end', () => resolve(criticalVulns));
      scanner.on('error', (err: Error) => reject(err));
      readStream.on('error', (err: Error) => reject(err));

      readStream.pipe(scanner);
    });
  }
}
