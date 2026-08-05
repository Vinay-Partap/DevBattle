# DevBattle

DevBattle is a coding battle platform for college students and mentors. The current repository contains the React frontend plus the implemented backend microservices for authentication, user profiles, and the question bank.

## Repository layout

```
.
├── docker-compose.yml     # Auth/User/Question services + isolated PostgreSQL databases
├── frontend/              # React + Vite + TypeScript UI (student / mentor / admin)
├── auth-service/          # Identity, JWT, refresh tokens, account activation (port 4000)
├── user-service/          # User profiles, avatars, skills, education, stats (port 4001)
└── question-service/      # Question bank, test cases, bookmarks, stats (port 4002)
```

Planned services not yet implemented in this repository: API Gateway/BFF, Contest Service, Submission/Judge Service, Evaluation/AI Review Service, Leaderboard Service, Notification Service, Organization Service, Analytics Service, and standalone Storage Service.

## Current architecture

```
Browser / React UI
      |
      |  Relative /api/v1/* requests (Vite dev proxy today; API Gateway planned)
      v
+----------------+       internal API key        +----------------+
|  Auth Service  | ----------------------------> |  User Service  |
|  :4000         |   profile provisioning/sync   |  :4001         |
+--------+-------+                               +--------+-------+
         |                                                |
         | JWT access token (issuer: devbattle-auth-service,
         | audience: devbattle-client)
         v                                                v
+----------------+                               +----------------+
| Question       |                               | User Profile DB |
| Service :4002  |                               +----------------+
+--------+-------+
         |
         v
+----------------+
| Question DB    |
+----------------+
```

- **Auth Service** owns credentials, password hashing, refresh-token storage, account active status, and JWT issuance.
- **User Service** owns profile data. Auth registration provisions an inactive profile; admin activation/role changes synchronize back to Auth through an internal API key.
- **Question Service** owns published/draft/archived questions, examples, starter code, test cases, bookmarks, and question statistics.
- **Frontend** uses relative backend URLs only. In local development Vite proxies `/api/v1/auth`, `/api/v1/users`, and `/api/v1/questions` to the corresponding service.

## Quick start

### Backend services with Docker Compose

```bash
docker compose up --build
```

This starts:

- Auth Service: `http://localhost:4000`
- User Service: `http://localhost:4001`
- Question Service: `http://localhost:4002`
- PostgreSQL containers for each service

Each service exposes:

- Swagger UI: `http://localhost:<port>/api-docs`
- Health check:
  - Auth: `http://localhost:4000/health`
  - User: `http://localhost:4001/api/v1/health`
  - Question: `http://localhost:4002/api/v1/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Local development without Docker

Install dependencies in each service and start them individually:

```bash
cd auth-service && npm install && npm run dev
cd user-service && npm install && npm run dev
cd question-service && npm install && npm run dev
cd frontend && npm install && npm run dev
```

For database-backed local development, run migrations and seeds for each service before using authenticated flows.
