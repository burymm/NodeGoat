# Bonus B: GraphQL API

## Goal
Implement a GraphQL layer on top of Code Guardian instead of/in addition to REST.

## Schema

```graphql
type Vulnerability {
  id: ID!
  package: String!
  severity: String!
  title: String!
  installedVersion: String!
  fixedVersion: String!
  publishedDate: String!
}

type Scan {
  id: ID!
  status: ScanStatus!
  repoUrl: String!
  vulnerabilities: [Vulnerability!]
  error: String
  createdAt: String!
  updatedAt: String!
}

enum ScanStatus {
  Queued
  Scanning
  Finished
  Failed
}

type Query {
  scan(id: ID!): Scan
  scans: [Scan!]!
}

type Mutation {
  startScan(repoUrl: String!): Scan!
}
```

## Setup
- `graphql()` function directly (not `graphql-http` or `apollo-server`)
- Custom Express handler parses GET/POST requests and calls `graphql({ schema, source, rootValue, contextValue })`
- Resolvers use ScanStore (for queries) and ScanService (for mutations)
- Mounted at `/graphql` in the same Express server

## Why not graphql-http
`graphql-http`'s express handler is incompatible with `express-session` — `on-headers` wraps `res.writeHead` without returning `this`, breaking `res.writeHead().end()` chaining. Using `graphql()` directly avoids this.

## mapScan resolver
GraphQL schema uses `id` instead of `scanId` and `String` instead of `Date`. The `mapScan()` resolver maps field names and converts Date objects to ISO strings.

## Deployment
Same Docker image — no additional dependencies. Both REST and GraphQL read from the same MongoDB collection, returning identical results.
