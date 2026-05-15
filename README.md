# Kivia

API observability platform for capturing, queueing, storing, and viewing HTTP request logs from applications that use the Kivia SDK.

## Architecture

```text
Your App + SDK
      |
      v
    NGINX
      |
      +--> Core API (Go/Fiber)
      |        |
      |        +--> PostgreSQL
      |        |
      |        +--> RabbitMQ log_queue
      |
      +--> Email Service (Go/Fiber)
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
