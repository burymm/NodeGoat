import { Router } from 'express';
import { ScanController } from './controllers/ScanController';
import { ScanService } from './services/ScanService';
import { ScanWorker } from './workers/ScanWorker';
import { ScanStore } from './store/ScanStore';
import { GitService } from './services/GitService';
import { TrivyService } from './services/TrivyService';
import { StreamParser } from './services/StreamParser';
import { createGraphqlHandler } from './graphql/index';

export function createGuardianRouter(db: import('mongodb').Db): Router {
  const scanStore = new ScanStore(db);
  const gitService = new GitService();
  const trivyService = new TrivyService();
  const streamParser = new StreamParser();
  const scanWorker = new ScanWorker(scanStore, gitService, trivyService, streamParser);
  const scanService = new ScanService(scanStore, scanWorker);
  const scanController = new ScanController(scanService);

  return scanController.router;
}

export { createGraphqlHandler };
