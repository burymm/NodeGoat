# Task 01: Project Setup

## Goal
Prepare the project for Code Guardian development:
- Add TypeScript (only for `code-guardian/`)
- Install required dependencies
- Create directory structure

## Tasks

### 1. TypeScript setup
- Create `code-guardian/tsconfig.json`
- Install `typescript` as a dev dependency (in root `package.json`)
- Configure compilation from `code-guardian/src/` to `code-guardian/dist/`
- Add script `"build:guardian": "tsc -p code-guardian"` to root `package.json`

### 2. Dependencies
Add to `package.json`:
- `stream-json` — streaming JSON parsing
- `typescript`, `@types/node` — TypeScript
- `uuid` — scanId generation

### 3. Directory structure
```
code-guardian/
├── src/
│   ├── types/
│   │   └── index.ts          # Scan, Vulnerability, ScanStatus interfaces
│   ├── controllers/
│   │   └── ScanController.ts  # HTTP handlers
│   ├── services/
│   │   ├── ScanService.ts     # Orchestration
│   │   ├── GitService.ts      # Repository cloning
│   │   ├── TrivyService.ts    # Trivy execution
│   │   └── StreamParser.ts    # Streaming parse + filter
│   ├── workers/
│   │   └── ScanWorker.ts      # Background task queue
│   ├── store/
│   │   └── ScanStore.ts       # Result storage (MongoDB)
│   └── index.ts               # Entry point, router export
├── dist/                       # Compiled JS
└── tsconfig.json
```

### 4. Integration into server.js
```js
const { createGuardianRouter } = require('./code-guardian/dist/index');
app.use('/api', createGuardianRouter(db));

// GraphQL endpoint
const { createGraphqlHandler } = require('./code-guardian/dist/index');
app.all('/graphql', createGraphqlHandler(db));

// Frontend (served at /guardian with Vite base)
app.use('/guardian', express.static('code-guardian/frontend/dist'));
app.get('/guardian/*', (req, res) => {
    res.sendFile('code-guardian/frontend/dist/index.html', { root: __dirname });
});
```

### 5. Dev Workflow (Hot Reload)

Automatic TS → JS rebuild on changes + Node restart in Docker.

**package.json scripts:**
```json
"scripts": {
  "build:guardian": "tsc -p code-guardian",
  "dev:guardian": "concurrently -n tsc,node \"npm run build:guardian -- --watch --preserveWatchOutput\" \"nodemon --watch code-guardian/dist -e js server.js\""
}
```

**How it works:**
1. `tsc --watch` — watches `code-guardian/src/*.ts`, compiles to `dist/` on change
2. `nodemon` — watches `code-guardian/dist/*.js`, restarts `server.js` on change
3. `concurrently` runs both processes in parallel

**Dev mode (no Docker):**
```bash
# Terminal 1: MongoDB
npm run start-infra

# Terminal 2: TypeScript + server with hot reload
npm run dev:guardian
```

This runs the existing server.js (with the NodeGoat app + Code Guardian REST API) locally via nodemon with automatic TypeScript recompilation. For the frontend, run `cd code-guardian/frontend && npm run dev` separately.

**devDependencies:**
- `concurrently` — parallel process runner
- `nodemon` — auto-restart on file changes
- `typescript`, `@types/node`, `@types/express` — TypeScript
