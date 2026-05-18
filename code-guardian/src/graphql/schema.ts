export const schema = `#graphql
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
`;
