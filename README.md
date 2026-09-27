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

### Local Database

Install PostgreSQL 17 (on Windows: `winget install PostgreSQL.PostgreSQL.17`), then create the role
and database the backend expects by default:

```sh
psql -U postgres -c "CREATE ROLE data4life LOGIN PASSWORD 'data4life'"
psql -U postgres -c "CREATE DATABASE data4life OWNER data4life"
```

Flyway creates the tables the first time the backend starts.

## User Management

The app has three pages: `/create` (sign up), `/login` and `/profile`. Assumptions made:

- A user is a name, an email and a password. The email is the login name, is unique and is stored in
  lower case.
- Passwords are 8 to 32 characters with no spaces and are stored only as BCrypt hashes.
- Creating an account logs the new user in straight away.
- Logins use a server-side session cookie, not tokens. The site is same-origin, so there is no CORS
  and CSRF protection is off for the JSON API.
- There are no password resets yet. Users can change their name and pick a profile icon.
- The colour scheme follows the system's light or dark mode.

| Method | Path               | Body                        | Result                                  |
|--------|--------------------|-----------------------------|-----------------------------------------|
| POST   | `/api/users`       | `{ name, email, password }` | `201` user, `400` invalid, `409` taken  |
| POST   | `/api/auth/login`  | `{ email, password }`       | `200` user and session cookie, or `401` |
| POST   | `/api/auth/logout` |                             | `204`                                   |
| GET    | `/api/auth/me`     |                             | `200` user, or `401` when logged out    |

A user is returned as `{ id, name, email, createdAt, admin, avatar }`; errors as `{ message }`.

## Assumptions

- A loan lasts 14 days from the day the book is borrowed.
- A book returned late is fined $1.00 for every started day past the due date.
- Fines can only be paid after the book is returned. A book still out shows its fine so far, which
  becomes payable on return.
- "Total Overdue Fines" and "Pay all" cover only returned books with unpaid fines.
- A user can pick at most 10 interests in total across genres and languages.
- A book is returned from the Return page, which puts the copy back into stock and makes any late
  fine payable. The same page cancels a reservation; the $5.00 fee is not refunded.

## Deploy

On the Docker host, copy `.env.example` to `.env`, set the database password and optionally
`ADMIN_EMAIL` and `ADMIN_PASSWORD` (the admin account is then created at startup), then:

```sh
docker compose up -d --build
```

Both images build from source inside Docker. The site is then on port 8088 of the host for testing
on the local network. For public access, add a reverse proxy or tunnel client (Caddy, Traefik,
cloudflared, ...) to the compose file and point it at `http://web:80`; the comment in the file marks
the spot. A CI pipeline that runs this on push is still to be written.
