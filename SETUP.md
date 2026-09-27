# Setup

How to run the app on your own machine. No Docker needed.

## You Need

- Node 24
- pnpm 11 (`corepack enable` picks the right version)
- JDK 21 or newer (Maven comes with the wrapper)
- PostgreSQL 17

## 1. Database

- Install PostgreSQL. On Windows: `winget install PostgreSQL.PostgreSQL.17`
- Create the role and database once:

```sh
psql -U postgres -c "CREATE ROLE data4life LOGIN PASSWORD 'data4life'"
psql -U postgres -c "CREATE DATABASE data4life OWNER data4life"
```

- Tables and sample books are made on the first backend start.

## 2. Backend

```sh
cd backend
./mvnw spring-boot:run
```

- Runs on http://localhost:8080
- Check it: http://localhost:8080/api/ping shows `{ "status": "ok" }`

### Admin Account

- Copy `.env.example` (repo root) to `.env` before starting.
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (8 to 32 characters, no spaces).
- The admin account is made on start. Log in with those values.
- No `ADMIN_PASSWORD`: sign up with the `ADMIN_EMAIL` address to become admin.
- An account that already exists keeps its password.

## 3. Frontend

In a second terminal:

```sh
cd frontend
pnpm install
pnpm nx dev frontend
```

- Runs on http://localhost:4210
- Calls to `/api` go to the backend on port 8080.

## 4. Use It

- Open http://localhost:4210
- Log in as the admin at `/login`, or sign up at `/create`.
- Admin pages (`/catalogue`, `/users`) only show for admins.

## Settings

Only needed when the defaults do not fit. Backend values go in `.env` or the shell environment; the
shell wins.

| Variable         | Default                                      | Where                 |
|------------------|----------------------------------------------|-----------------------|
| `DB_URL`         | `jdbc:postgresql://localhost:5432/data4life` | Backend               |
| `DB_USER`        | `data4life`                                  | Backend               |
| `DB_PASSWORD`    | `data4life`                                  | Backend               |
| `SERVER_PORT`    | `8080`                                       | Backend               |
| `ADMIN_EMAIL`    | none                                         | Backend               |
| `ADMIN_PASSWORD` | none                                         | Backend               |
| `VITE_API_URL`   | `http://localhost:8080`                      | `frontend/.env.local` |

## Checks

```sh
cd backend && ./mvnw verify                                       # tests on H2, no database needed
cd frontend && pnpm nx run-many -t lint typecheck test build
```

## Problems

- Backend stops at start: PostgreSQL not running, or role / database missing.
- Frontend shows API errors: backend not running on port 8080.
- Port in use: set `SERVER_PORT`, then point `VITE_API_URL` at the new port.
