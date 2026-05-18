declare module 'bfj' {
  import { Readable } from 'stream';

  interface MatchOptions {
    ndjson?: boolean;
    yieldRate?: number;
    maxDepth?: number;
    pauseTime?: number;
  }

  type Selector = string | RegExp | ((key: string, value: unknown, depth: number) => boolean);

  export function match(
    readStream: Readable,
    selector: Selector,
    options?: MatchOptions,
  ): Readable;
}
