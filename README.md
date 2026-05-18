# NodeGoat

Being lightweight, fast, and scalable, Node.js is becoming a widely adopted platform for developing web applications. This project provides an environment to learn how OWASP Top 10 security risks apply to web applications developed using Node.js and how to effectively address them.

## Getting Started

OWASP Top 10 for Node.js web applications:

### Know it!

This application bundled a tutorial page that explains the OWASP Top 10 vulnerabilities and how to fix them.

Once the application is running, you can access the tutorial page at [http://localhost:4000/tutorial](http://localhost:4000/tutorial) (or the port you have configured).

### Do it!

[A Vulnerable Node.js App for Ninjas](http://nodegoat.herokuapp.com/) to exploit, toast, and fix. You may like to [set up your own copy](#how-to-set-up-your-copy-of-nodegoat) of the app to fix and test vulnerabilities. Hint: Look for comments in the source code.

##### Default user accounts

The database comes pre-populated with these user accounts created as part of the seed data -
* Admin Account - u:`admin` p:`Admin_123`
* User Accounts (u:`user1` p:`User1_123`), (u:`user2` p:`User2_123`)
* New users can also be added using the sign-up page.

## How to Set Up Your Copy of NodeGoat

### OPTION 1 - Run NodeGoat on your machine

1) Install [Node.js](http://nodejs.org/) - NodeGoat requires Node v8 or above

2) Clone the github repository:
   ```
   git clone https://github.com/OWASP/NodeGoat.git
   ```

3) Go to the directory:
   ```
   cd NodeGoat
   ```

4) Install node packages:
   ```
   npm install
   ```

5) Set up MongoDB. You can either install MongoDB locally or create a remote instance:

   * Using local MongoDB:
     1) Install [MongoDB Community Server](https://docs.mongodb.com/manual/administration/install-community/)
     2) Start [mongod](http://docs.mongodb.org/manual/reference/program/mongod/#bin.mongod)

   * Using remote MongoDB instance:
     1) [Deploy a MongoDB Atlas free tier cluster](https://docs.atlas.mongodb.com/tutorial/deploy-free-tier-cluster/) (M0 Sandbox)
     2) [Enable network access](https://docs.atlas.mongodb.com/security/add-ip-address-to-list/) to the cluster from your current IP address
     3) [Add a database user](https://docs.atlas.mongodb.com/tutorial/create-mongodb-user-for-cluster/) to the cluster
     4) Set the `MONGODB_URI` environment variable to the connection string of your cluster, which can be viewed in the cluster's
        [connect dialog](https://docs.atlas.mongodb.com/tutorial/connect-to-your-cluster/#connect-to-your-atlas-cluster). Select "Connect your application",
        set the driver to "Node.js" and the version to "2.2.12 or later". This will give a connection string in the form:
        ```
        mongodb://<username>:<password>@<cluster>/<dbname>?ssl=true&replicaSet=<rsname>&authSource=admin&retryWrites=true&w=majority
        ```
        The `<username>` and `<password>` fields need filling in with the details of the database user added earlier. The `<dbname>` field sets the name of the
        database nodegoat will use in the cluster (eg "nodegoat"). The other fields will already be filled in with the correct details for your cluster.

6) Populate MongoDB with the seed data required for the app:
   ```
   npm run db:seed
   ```
   By default this will use the "development" configuration, but the desired config can be passed as an argument if required.

7) Start the server. You can run the server using node or nodemon:
   * Start the server with node. This starts the NodeGoat application at [http://localhost:4000/](http://localhost:4000/):
     ```
     npm start
     ```
   * Start the server with nodemon, which will automatically restart the application when you make any changes. This starts the NodeGoat application at [http://localhost:5000/](http://localhost:5000/):
     ```
     npm run dev
     ```

#### Customizing the Default Application Configuration

By default the application will be hosted on port 4000 and will connect to a MongoDB instance at localhost:27017. To change this set the environment variables `PORT` and `MONGODB_URI`.

Other settings can be changed by updating the [config file](https://github.com/OWASP/NodeGoat/blob/master/config/env/all.js).

### OPTION 2 - Run NodeGoat on Docker

The repo includes the Dockerfile and docker-compose.yml necessary to set up the app and db instance, then connect them together.

1) Install [docker](https://docs.docker.com/installation/) and [docker compose](https://docs.docker.com/compose/install/) 

2) Clone the github repository:
   ```
   git clone https://github.com/OWASP/NodeGoat.git
   ```

3) Go to the directory:
   ```
   cd NodeGoat
   ```

4) Build the images:
   ```
   docker-compose build
   ```

5) Run the app, this starts the NodeGoat application at http://localhost:4000/:
   ```
   docker-compose up
   ```

## Code Guardian — Vulnerability Scanner Service

Code Guardian is a service built on top of NodeGoat that scans any public Git repository for security vulnerabilities using [Trivy](https://github.com/aquasecurity/trivy). It features a streaming JSON parser (OOM-safe at 150MB heap), background scan queue, REST + GraphQL APIs, and a React frontend.

### Quick Start with Docker

```bash
# Start MongoDB + Code Guardian + NodeGoat
docker-compose up

# Open the dashboard:
open http://localhost:4000/guardian
```

### Run Locally (Development)

**1) Prerequisites**

- Node.js 20+, MongoDB running on `localhost:27017`
- Install Trivy: `brew install aquasecurity/trivy/trivy` (macOS) or follow [docs](https://trivy.dev/latest/getting-started/installation/)

**2) Install & Build**

```bash
npm install
npm run build:guardian          # Compile TypeScript
cd code-guardian/frontend && npm install && cd ../..
```

**3) Start Backend (API + GraphQL + NodeGoat)**

```bash
npm run start-infra             # Start MongoDB via Docker (or use your own)
npm start                       # Starts on http://localhost:4000
```

**4) Start Frontend (separate terminal)**

```bash
cd code-guardian/frontend
npm run dev                     # Dev server on http://localhost:5173/guardian
```

### API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/scan` | Start a scan — body: `{"repoUrl": "https://github.com/owner/repo"}` |
| GET | `/api/scan/:scanId` | Get scan status + CRITICAL vulnerabilities |
| GET/POST | `/graphql` | GraphQL — queries: `scan(id)`, `scans`; mutation: `startScan(repoUrl)` |
| GET | `/guardian` | React SPA frontend |

### How to Test a Scan

```bash
# Using curl:
curl -X POST http://localhost:4000/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"repoUrl":"https://github.com/OWASP/NodeGoat"}'

# Response: { "scanId": "uuid", "status": "Queued" }

# Poll for results (replace scanId):
curl http://localhost:4000/api/scan/<scanId>

# When finished — shows CRITICAL vulnerabilities found in the repo.
```

### Run Tests

```bash
npm run test:all                # All tests (backend 39 + frontend 17)
npm run test:guardian           # Backend unit tests only
npm run test:stress-full        # OOM safety validation (generates 200MB JSON, parses it)
cd code-guardian/frontend && npx vitest run   # Frontend tests only
```

### Architecture

```
POST /api/scan  →  ScanController  →  ScanService  →  ScanWorker (async)
                                                      ├─ GitService.clone()
                                                      ├─ TrivyService.scan()
                                                      └─ StreamParser.parse()
                                                      └─ ScanStore (MongoDB)

GET /api/scan/:scanId  →  ScanController  →  ScanService  →  ScanStore
GET/POST /graphql      →  GraphQL handler  →  resolvers  →  ScanStore / ScanService
```

### OPTION 3 - Deploy to Heroku

This option uses a free ($0/month) Heroku node server.

Though not essential, it is recommended that you fork this repository and deploy the forked repo.
This will allow you to fix vulnerabilities in your own forked version, then deploy and test it on Heroku.

1) Set up a publicly accessible MongoDB instance:
   1) [Deploy a MongoDB Atlas free tier cluster](https://docs.atlas.mongodb.com/tutorial/deploy-free-tier-cluster/) (M0 Sandbox)
   2) [Enable network access](https://docs.atlas.mongodb.com/security/ip-access-list/#add-ip-access-list-entries) to the cluster from anywhere (CIDR range 0.0.0.0/0)
   3) [Add a database user](https://docs.atlas.mongodb.com/tutorial/create-mongodb-user-for-cluster/) to the cluster

2) Deploy NodeGoat to Heroku by clicking the button below:

   [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

   In the Create New App dialog, set the `MONGODB_URI` config var to the connection string of your MongoDB Atlas cluster.
   This can be viewed in the cluster's [connect dialog](https://docs.atlas.mongodb.com/tutorial/connect-to-your-cluster/#connect-to-your-atlas-cluster).
   Select "Connect your application", set the driver to "Node.js" and the version to "2.2.12 or later".
   This will give a connection string in the form:
   ```
   mongodb://<username>:<password>@<cluster>/<dbname>?ssl=true&replicaSet=<rsname>&authSource=admin&retryWrites=true&w=majority
   ```
   The `<username>` and `<password>` fields need filling in with the details of the database user added earlier. The `<dbname>` field sets the name of the
   database nodegoat will use in the cluster (eg "nodegoat"). The other fields will already be filled in with the correct details for your cluster.

## Report bugs, Feedback, Comments

*  Open a new [issue](https://github.com/OWASP/NodeGoat/issues) or contact team by joining chat at [Slack](https://owasp.slack.com/messages/project-nodegoat/) or [![Join the chat at https://gitter.im/OWASP/NodeGoat](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/OWASP/NodeGoat?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Contributing

Please Follow [the contributing guide](CONTRIBUTING.md)

## Code Of Conduct (CoC)

This project is bound by a [Code of Conduct](CODE_OF_CONDUCT.md).

## Contributors

Here are the amazing [contributors](https://github.com/OWASP/NodeGoat/graphs/contributors) to the NodeGoat project.

## Supports

- Thanks to JetBrains for providing licenses to fantastic [WebStorm IDE](https://www.jetbrains.com/webstorm/) to build this project.

## License

Code licensed under the [Apache License v2.0.](http://www.apache.org/licenses/LICENSE-2.0)
