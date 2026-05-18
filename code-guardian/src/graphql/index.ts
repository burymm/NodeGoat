import { buildSchema, graphql } from 'graphql';
import type { Request, Response } from 'express';
import { schema as sdl } from './schema';
import { resolvers } from './resolvers';
import { ScanStore } from '../store/ScanStore';
import { ScanService } from '../services/ScanService';
import { ScanWorker } from '../workers/ScanWorker';
import { GitService } from '../services/GitService';
import { TrivyService } from '../services/TrivyService';
import { StreamParser } from '../services/StreamParser';
import { Db } from 'mongodb';

export function createGraphqlHandler(db: Db) {
  const scanStore = new ScanStore(db);
  const gitService = new GitService();
  const trivyService = new TrivyService();
  const streamParser = new StreamParser();
  const scanWorker = new ScanWorker(scanStore, gitService, trivyService, streamParser);
  const scanService = new ScanService(scanStore, scanWorker);

  const schema = buildSchema(sdl);

  return async (req: Request, res: Response) => {
    try {
      if (req.method !== 'GET' && req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
      }

      let query: string | undefined;
      let variables: Record<string, unknown> | undefined;
      let operationName: string | undefined;

      if (req.method === 'GET') {
        try {
          const searchParams = new URLSearchParams(req.url.split('?')[1] || '');
          query = searchParams.get('query') || undefined;
          operationName = searchParams.get('operationName') || undefined;
          const vars = searchParams.get('variables');
          if (vars) variables = JSON.parse(vars);
        } catch {
          res.status(400).json({ error: 'Invalid query parameters' });
          return;
        }
      } else {
        const body = req.body || {};
        query = body.query;
        variables = body.variables;
        operationName = body.operationName;
      }

      if (!query) {
        res.status(400).json({ error: 'Missing query' });
        return;
      }

      const result = await graphql({
        schema,
        source: query,
        rootValue: resolvers,
        contextValue: { scanStore, scanService },
        variableValues: variables,
        operationName,
      });

      res.json(result);
    } catch (err) {
      console.error('GraphQL handler error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
