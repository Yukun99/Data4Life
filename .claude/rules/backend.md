---
paths:
  - "backend/**"
  - "docker-compose.yml"
  - ".env.example"
  - "frontend/Dockerfile"
  - "frontend/nginx.conf"
---

# Backend

`backend/` is a Spring Boot 4.1 / Java 21 Maven project built only through the wrapper (`./mvnw`,
`mvnw.cmd` on Windows). The local JDK can be newer than 21; the compiler targets 21 via
`java.version` in `pom.xml`, and the Docker image runs Temurin 21.

## Layout

- Package by feature under `com.yukunxu.data4life`: `ping/` holds `PingController`
  (`GET /api/ping`), `user/` holds the `users` table, sign-up (`POST /api/users`), profile edits
  (`PUT /api/users/me`) and the `UserDetailsService`, `auth/` holds login, logout and the current
  user (`/api/auth/*`), `catalogue/` holds the books, genres and languages tables and the admin book endpoints
  (`BookController`, `BookService`, `/api/books`),
  `interest/` holds a user's genre and language interests (`/api/interests`), `loan/` holds loans,
  fines and payments (`/api/loans`), and `config/` holds the security setup and the JSON error
  handler. A new feature gets its own package with its controller, service, repository
  and entities together; cross-cutting configuration goes in a `config/` package when needed.
- Every HTTP route sits under `/api/`; that prefix is what the Vite dev proxy and the Nginx
  container route to the backend. The backend is never exposed directly, so there is no CORS setup.
- Request and response bodies are Java records. No Lombok.
- Constructor injection only; no field `@Autowired`.
- Configuration comes from `application.yml` and is overridable with environment variables:
  `DB_URL`, `DB_USER`, `DB_PASSWORD`, `SERVER_PORT`, `ADMIN_EMAIL` (read as `app.admin-email`).
  Never commit real credentials; `docker-compose.yml` reads them from the gitignored `.env`.

## Security

- Spring Security with a server-side session: `POST /api/auth/login` checks the email and BCrypt
  password hash and stores the login in the HTTP session, so the browser only carries the session
  cookie. `POST /api/auth/logout` invalidates it and `GET /api/auth/me` returns the current user.
- Public routes: `POST /api/users`, `POST /api/auth/login`, `GET /api/ping` and
  `/actuator/health`. Everything else needs a session and answers `401` without one, including
  `PUT /api/users/me`, `/api/interests/**` and `/api/loans/**`; there are no login redirects or
  forms.
- `/api/books/**` and `/api/catalogue/**` are admin only, both as a URL rule in `SecurityConfig`
  and through `@PreAuthorize` on `BookController` and `ColumnController`. Non-admins get
  `403 { "message": "Forbidden" }`.
- Users have an `is_admin` flag. The account whose email matches `ADMIN_EMAIL` becomes admin on
  sign-up, and `AdminPromoter` promotes it at startup if it already exists. Admins get `ROLE_ADMIN`
  on top of `ROLE_USER`, and `@EnableMethodSecurity` is on, so admin-only endpoints can use
  `@PreAuthorize("hasRole('ADMIN')")`.
- CSRF protection is off because the site is same-origin and the API only accepts JSON.
- Errors come back as `{ "message": "..." }` from `ApiExceptionHandler`: `400` for validation, `401`
  for bad credentials and `409` for an email that is already taken. Services throw
  `ResponseStatusException` for other business errors, which the handler also turns into `{ "message" }`.

## Database

- PostgreSQL in production and local development. `spring.jpa.hibernate.ddl-auto` is `validate`, so
  the schema only changes through Flyway migrations in `src/main/resources/db/migration/`, named
  `V<n>__<snake_case_description>.sql`. Write migrations in PostgreSQL syntax that H2 in PostgreSQL
  mode also accepts; the test run will tell you when it does not.
- Local development needs a PostgreSQL reachable at `localhost:5432` with database, user and
  password `data4life` (the defaults in `application.yml`), or `DB_*` variables pointing elsewhere.
  Install PostgreSQL 17 and create the role and database once, as shown in the README. Flyway creates
  the tables on the first `./mvnw spring-boot:run`.
- Genres, languages and ten sample books are seeded by migrations. Loans last 14 days and overdue
  fines are $1.00 per started day (`LoanService`). A loan's status (borrowed, overdue, returned,
  unpaid, paid) and fine are derived from its dates, never stored.
- A book's `stock` is always `amount` minus its open loans (loans with no return date). The
  catalogue endpoints only take `amount` and recompute `stock`; an amount below the open loans is
  rejected.

## Catalogue Endpoints

- `GET /api/books` lists books a page at a time. Query parameters: `page` (from 0, clamped to the
  last page), `size` (10, 20 or 50), `sort` (`isbn`, `title`, `author`, `genre`, `language`,
  `amount`, `stock`; default `title`) with `dir` (`asc` or `desc`), and exact-match filters `isbn`,
  `title`, `author`, `genreId`, `languageId`, `amount`, `stock`. The response carries the page
  actually returned and the filter options (distinct values across the whole catalogue).
- `GET /api/books/{isbn}`, `POST /api/books` (409 when the ISBN exists), `PUT /api/books/{isbn}`
  (changing the ISBN moves the book's loans to the new ISBN; 409 when the new ISBN exists),
  `POST /api/books/{isbn}/merge` (merges the book into the one named in the body, moving its
  loans) and `DELETE /api/books/{isbn}` (409 when the book has any loan records).
- `GET` and `PUT /api/catalogue/columns` read and save the admin's catalogue column widths (six
  percentages that must total 100, each at least 5). They are stored per user in
  `users.catalogue_columns` as a comma separated string; `GET` answers an empty body until the
  user has saved once.
- `LoanSeeder` gives every user without loans five sample loans at startup, one per status. It
  carries a `TODO` to remove it once the borrow and return flow creates real loans.

## Tests

- Tests mirror the main package under `src/test/java`. `Data4LifeApplicationTests` boots the full
  context; `PingControllerTest` is a `@WebMvcTest` slice (it uses `@WithMockUser`, because the
  slice does not load `SecurityConfig`). `UserFlowTest` covers the whole sign-up and login flow
  through `MockMvc`, carrying the session between requests; `InterestFlowTest`, `LoanFlowTest` and
  `BookFlowTest` and `ColumnFlowTest` do the same for their routes, and `LoanServiceTest` covers every loan status and fine rule.
- Full-context tests carry `@ActiveProfiles("test")`, which loads `application-test.yml` (H2
  in-memory, PostgreSQL mode) on top of `application.yml`. Keep it a profile file rather than a
  second `application.yml`, because a test `application.yml` would shadow the main one entirely.
- H2 is test scope only. When Docker is available on the dev machine, Testcontainers can replace it.

## Docker

`backend/Dockerfile` is a two-stage build (wrapper build on `eclipse-temurin:21-jdk`, run on
`eclipse-temurin:21-jre` as a non-root user). `docker-compose.yml` at the repo root starts `web`
(`frontend/Dockerfile`: Nginx serving the build and proxying `/api/`), `backend` and `db`
(`postgres:17-alpine`, named volume, healthcheck) on one compose network. Only `web` publishes a
port (`8088` on the host, for testing on the local network). Public exposure is left to a reverse
proxy or tunnel client added to the compose file, pointing the public hostname at `http://web:80`;
the comment in the file marks where it goes. The developer's actual choice of proxy, host and domain
is recorded in the gitignored `hosting.local.md` beside this file, not in tracked files.
