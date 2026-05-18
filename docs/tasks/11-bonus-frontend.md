# Bonus A: Frontend (React + Vite)

## Goal
React SPA for demonstrating Code Guardian.

## Stack
- Vite + React + TypeScript
- Tailwind CSS

## Features
1. Form: `repoUrl` input + "Start Scan" button
2. POST /api/scan → get scanId (or GraphQL mutation)
3. Polling every 2s: GET /api/scan/:scanId (or GraphQL query)
4. When `Finished` — table with critical vulnerabilities
5. When `Failed` — error message
6. Loading indicator while `Scanning`
7. Split Button to switch between REST and GraphQL API modes

## Integration with SSR app

### Dev
- Vite dev server on port 5173
- Vite proxy: `/api` → `http://localhost:4000`
- Run: `cd code-guardian/frontend && npm run dev`

### Prod
- `vite build` → `code-guardian/frontend/dist/` (Vite `base: '/guardian'`)
- Express serves static files at `/guardian`: `app.use('/guardian', express.static('code-guardian/frontend/dist'))`
- SPA fallback: `app.get('/guardian/*', (req, res) => res.sendFile(...))`

## Structure
```
code-guardian/frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx
│   ├── App.tsx            # State, polling, layout
│   ├── StatusBadge.tsx     # Status pill component
│   ├── VulnerabilityTable.tsx  # Vulnerability table component
│   ├── SplitButton.tsx     # REST/GraphQL mode switcher
│   ├── types.ts
│   └── api.ts             # Config map: api[ScanMode] = { start, poll }
```

Single Responsibility Principle: each component in its own file. `api.ts` uses a config map (`api[ScanMode]`) instead of ternaries for REST vs GraphQL endpoint lookup.

## Routing
Not needed. Single-screen SPA: form on top, results below.
