# Data4Life

A React frontend and a Spring Boot backend with PostgreSQL, packaged for self-hosting with Docker
Compose on any Docker host behind a reverse proxy or tunnel. Nginx serves the frontend and proxies
`/api` to the backend, so the whole site is one origin.

## Layout

| Path                 | What                                                               |
|----------------------|--------------------------------------------------------------------|
| `frontend/`          | Nx 23 single-app workspace: React 19, TypeScript, Vite 8, Vitest 4 |
| `backend/`           | Spring Boot 4.1 / Java 21 Maven project: MVC, Data JPA, Flyway     |
| `docker-compose.yml` | `web` (Nginx + frontend), `backend`, `db` (PostgreSQL)             |
| `CLAUDE.md`          | Working conventions (for developers and Claude Code)               |

## Prerequisites

- Node 24 and pnpm 11 (`corepack enable` picks the version from `frontend/package.json`)
- JDK 21 or newer (Maven comes from the wrapper)
- PostgreSQL for running the backend locally, or `DB_*` variables pointing at another instance
- Docker with Compose on the host that will serve the site

## Frontend

```sh
cd frontend
pnpm install
pnpm nx dev frontend                             # http://localhost:4210
pnpm nx run-many -t lint typecheck test build    # checks; build output in frontend/dist
```

The dev server proxies `/api` to `http://localhost:8080`. Copy `frontend/.env.example` to
`frontend/.env.local` to point it elsewhere.

## Backend

```sh
cd backend
./mvnw verify              # tests on H2, no database needed
./mvnw spring-boot:run     # http://localhost:8080, needs PostgreSQL (defaults: localhost:5432, data4life/data4life)
```

`GET /api/ping` returns `{ "status": "ok" }`; `GET /actuator/health` reports liveness.

## Deploy

On the Docker host, copy `.env.example` to `.env`, set the database password, then:

```sh
docker compose up -d --build
```

Both images build from source inside Docker. The site is then on port 8088 of the host for testing
on the local network. For public access, add a reverse proxy or tunnel client (Caddy, Traefik,
cloudflared, ...) to the compose file and point it at `http://web:80`; the comment in the file marks
the spot. A CI pipeline that runs this on push is still to be written.
