# Task 02: Docker Setup

## Goal
Single docker-compose.yml for all scenarios.

## docker-compose.yml
```yaml
services:
  web:
    build: .
    mem_limit: 200m
    environment:
      MONGODB_URI: mongodb://mongo:27017/nodegoat
    command: sh -c "until nc -z -w 2 mongo 27017 && echo 'mongo is ready' && node artifacts/db-reset.js && npm start; do sleep 2; done"
    ports:
      - "4000:4000"

  mongo:
    image: mongo:4.4
    expose:
      - 27017
```

`mem_limit: 200m` — container-level cgroup memory limit.
`NODE_OPTIONS=--max-old-space-size=150` set via `ENV` in Dockerfile (not docker-compose.yml) for early OOM detection.

## Dockerfile
- Node 20-alpine
- Install `git` (repository cloning)
- Trivy in-container: install via AquaSecurity install script (`curl ... | sh`)
- Multi-stage build: `deps` (npm install) + `frontend-deps` / `frontend-build` (Vite) + final stage
- `ENV NODE_OPTIONS="--max-old-space-size=150"` for early OOM detection
- TypeScript compiled during image build (`npx tsc -p code-guardian`)

## OOM Verification
```bash
# Docker cgroups (mem_limit: 200m):
docker compose up

# V8 heap (already in NODE_OPTIONS via Dockerfile ENV):
npm run test:stress-stream

# Full cycle: generate 200MB file → build → parse → cleanup:
npm run test:stress-full
```

Streams pass both tests — process data in 64KB chunks, not loading the entire 500MB file. OOM test confirmed: 274MB input → 80MB heap (limit 150MB).
