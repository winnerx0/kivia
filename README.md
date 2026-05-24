# Kivia

API observability platform for capturing, queueing, storing, and viewing HTTP request logs from applications that use the Kivia SDK.

## Architecture

```mermaid
flowchart LR
  dashboardUser[Dashboard User]
  sdkApp[Application + Kivia SDK]

  subgraph client[Client Layer]
    frontend[Next.js Frontend]
    sdk[SDK Middleware]
  end

  subgraph edge[Edge Layer]
    nginx[NGINX Reverse Proxy]
  end

  subgraph backend[Backend Services]
    core[Core API<br/>Go + Fiber]
    email[Email Service<br/>Go + Fiber]
    sse[SSE Event Server]
    consumer[Log Queue Consumer]
  end

  subgraph data[Data Layer]
    postgres[(PostgreSQL)]
    rabbit[(RabbitMQ Log Queue)]
  end

  migrate[Migration Service]

  dashboardUser --> frontend
  frontend -->|JWT protected dashboard APIs| nginx
  sdkApp --> sdk
  sdk -->|API key protected log events| nginx

  nginx --> core
  core -->|users, projects, API keys, logs| postgres
  core -->|OTP and transactional email| email
  core -->|publish log event| rabbit

  rabbit --> consumer
  consumer -->|persist logs| postgres
  consumer -->|broadcast new logs| sse
  sse -->|/api/v1/logs/stream/:projectId| frontend

  migrate -->|apply SQL migrations before startup| postgres
```

- **NGINX**: reverse proxy, CORS, rate limiting, and auth request checks.
- **Core API**: authentication, users, projects, API keys, log ingestion, log retrieval, and SSE log streaming.
- **RabbitMQ**: async queue for non-blocking log ingestion.
- **PostgreSQL**: primary data store.
- **Email Service**: OTP and transactional email delivery.
- **Frontend**: Next.js dashboard in `frontend/`.

## Tech Stack

| Component | Technology |
| --- | --- |
| Backend | Go, Fiber v3 |
| Frontend | Next.js |
| Database | PostgreSQL |
| Queue | RabbitMQ |
| Proxy | NGINX |
| Auth | JWT access and refresh tokens |
| Containers | Docker Compose |

## System Design

Kivia is designed as a small observability platform with clear separation between user-facing dashboard traffic, authenticated management APIs, SDK log ingestion, asynchronous processing, and email delivery.

### Components

| Component | Responsibility |
| --- | --- |
| Frontend | Next.js dashboard for authentication, project management, API key management, log browsing, charts, and live log updates. |
| NGINX | Public edge proxy for the backend services. It centralizes routing, CORS handling, rate limiting, TLS in production, and API key auth checks for protected ingestion routes. |
| Core API | Main Go/Fiber service. Owns users, auth, projects, API keys, log ingestion, log retrieval, chart aggregation, and SSE streams. |
| PostgreSQL | System of record for users, refresh tokens, projects, API keys, request logs, and email verification state. |
| RabbitMQ | Buffer between synchronous SDK ingestion and durable log storage. This keeps SDK-facing requests fast and isolates short database slowdowns from client applications. |
| Email Service | Go/Fiber service responsible for OTP and transactional email workflows. |
| Migration Service | One-shot container that applies SQL migrations before the core service starts. |

### Request Flow

```text
Dashboard user
    |
    v
Frontend
    |
    v
NGINX
    |
    v
Core API
    |
    +--> PostgreSQL
    |
    +--> Email Service
```

Dashboard requests use JWT access tokens. The core API validates the token, authorizes ownership by `user_id`, and reads or writes project, key, user, and log data in PostgreSQL.

```text
Application using Kivia SDK
    |
    v
NGINX auth check
    |
    v
Core API log ingestion
    |
    v
RabbitMQ log_queue
    |
    v
Core API consumer
    |
    +--> PostgreSQL logs
    |
    +--> SSE broadcast to dashboard clients
```

SDK log ingestion is API-key protected. The core API validates the key, resolves the project, publishes the log event to RabbitMQ, and returns quickly. A consumer persists log events and broadcasts new entries to any active SSE clients for the project.

### Data Model

```text
users
  ├── refresh_tokens
  ├── email_verifications
  ├── projects
  │     ├── api_keys
  │     └── logs through api_keys
```

- `users` own projects and authentication state.
- `projects` group API keys and request logs by application or environment.
- `api_keys` authenticate SDK traffic and are scoped to one project.
- `logs` store captured request metadata such as path, status, location, timestamp, latency, and API key reference.
- `refresh_tokens` support session renewal and token revocation.
- `email_verifications` store OTP verification state.

### Auth And Authorization

- Dashboard routes use JWT access tokens and refresh tokens.
- Project, API key, and log reads are scoped to the authenticated user.
- SDK ingestion uses API keys instead of user JWTs.
- Revoked or deleted API keys cannot authenticate log ingestion.
- Production traffic is intended to enter through NGINX, keeping internal services off the public network.

### Realtime Logs

The dashboard uses Server-Sent Events through `/api/v1/logs/stream/:projectId`. The SSE server keeps project-scoped client channels in memory and broadcasts new persisted log events only to clients subscribed to that project.

### Reliability Boundaries

- RabbitMQ absorbs ingestion bursts and decouples SDK request latency from database writes.
- PostgreSQL remains the durable source of truth.
- Migrations run before the core service starts so schema changes are applied deterministically.
- NGINX provides edge-level rate limiting and request routing.
- If no dashboard clients are connected, logs are still persisted and can be queried later.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- A root `.env` file

### Environment

Create a `.env` file in the repo root. It is ignored by git.

```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/kivia?sslmode=disable
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=kivia

PORT=8081
JWT_ACCESS_TOKEN_SECRET=<secret>
JWT_REFRESH_TOKEN_SECRET=<secret>
RABBITMQ_CONNECTION_URL=amqp://guest:password@rabbitmq:5672
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=password

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback
GOOGLE_FRONTEND_URL=http://localhost:3000
KIVIA_API_KEY=
CERTBOT_EMAIL=admin@example.com
```

`core` and `email_service` both read from the root `.env`; their service-specific ports are set by Docker Compose.
The `migrate` service applies `core/migrations` before `core` starts.

### Local Run

```bash
docker compose up --build
```

Local services:

| Service | URL |
| --- | --- |
| Core API | http://localhost:8081 |
| Email Service | http://localhost:8082 |
| NGINX | http://localhost:8080 |
| RabbitMQ Console | http://localhost:15672 |
| PostgreSQL | localhost:5000 |

### Production Compose

Use `docker-compose-prod.yml` for the production-style container network and port exposure:

```bash
docker compose -f docker-compose-prod.yml up --build
```

Production compose exposes NGINX on `http://localhost:80` and `https://localhost:443`, keeps internal services on the `internal` Docker network, and uses Certbot to issue and renew TLS certificates for `kivia.winnerx0.dev`.

## API Routes

### Public Auth

| Method | Route | Description |
| --- | --- | --- |
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Login and receive tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |
| POST | `/auth/verify-otp` | Verify OTP |
| POST | `/auth/resend-otp` | Resend OTP |

### JWT Protected

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/v1/user/me` | Get current user |
| PUT | `/api/v1/user/me` | Update current user |
| DELETE | `/api/v1/user/me` | Delete current user |
| POST | `/api/v1/projects/create` | Create a project |
| GET | `/api/v1/projects/all` | List projects |
| DELETE | `/api/v1/projects/:projectId` | Delete a project |
| POST | `/api/v1/api-keys/create` | Create an API key |
| GET | `/api/v1/api-keys/all/:projectId` | List project API keys |
| PATCH | `/api/v1/api-keys/revoke/:id` | Revoke an API key |
| DELETE | `/api/v1/api-keys/:id` | Delete an API key |
| GET | `/api/v1/logs/all/:projectId` | Get paginated logs |
| GET | `/api/v1/logs/stream/:projectId` | Stream logs over SSE |
| GET | `/api/v1/logs/chart/:projectId` | Get log chart data |

### API Key Protected

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/v1/logs/create` | Ingest a log entry |

## SDK Integration

Install the Go SDK:

```bash
go get github.com/kivia-observe/kivia-sdk-go
```

Wrap your HTTP handlers:

```go
package main

import (
	"net/http"

	kivia "github.com/kivia-observe/kivia-sdk-go"
)

func main() {
	client := kivia.NewClient("your-api-key")

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello"))
	})

	http.ListenAndServe(":8080", client.NewLog(mux))
}
```

The SDK captures path, status code, IP address, timestamp, and latency, then sends logs asynchronously to Kivia.

## Project Structure

```text
kivia/
├── core/                  # Main backend API
│   ├── cmd/core/          # Core service entry point
│   ├── api/               # Server and route setup
│   ├── internal/          # Auth, users, projects, API keys, logs, middleware, config
│   └── migrations/        # SQL migrations
├── email_service/         # Email microservice
├── nginx/                 # NGINX reverse proxy config
├── frontend/              # Next.js dashboard
├── kivia-sdk-go/          # Go SDK
├── kivia-sdk-js/          # JS SDK
├── docker-compose.yml
└── docker-compose-prod.yml
```

## Notes

- Local env files are ignored by git. Do not commit secrets.
- If a secret has ever been committed, rotate it even after rewriting git history.
- Frontend and SDK sources are tracked directly by the root repo.
