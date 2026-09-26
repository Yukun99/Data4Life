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
  (`GET /api/ping`). A new feature gets its own package with its controller, service, repository
  and entities together; cross-cutting configuration goes in a `config/` package when needed.
- Every HTTP route sits under `/api/`; that prefix is what the Vite dev proxy and the Nginx
  container route to the backend. The backend is never exposed directly, so there is no CORS setup.
- Request and response bodies are Java records. No Lombok.
- Constructor injection only; no field `@Autowired`.
- Configuration comes from `application.yml` and is overridable with environment variables:
  `DB_URL`, `DB_USER`, `DB_PASSWORD`, `SERVER_PORT`.
  Never commit real credentials; `docker-compose.yml` reads them from the gitignored `.env`.

## Database

- PostgreSQL in production and local development. `spring.jpa.hibernate.ddl-auto` is `validate`, so
  the schema only changes through Flyway migrations in `src/main/resources/db/migration/`, named
  `V<n>__<snake_case_description>.sql`. Write migrations in PostgreSQL syntax that H2 in PostgreSQL
  mode also accepts; the test run will tell you when it does not.
- Local development needs a PostgreSQL reachable at `localhost:5432` with database, user and
  password `data4life` (the defaults in `application.yml`), or `DB_*` variables pointing elsewhere.

## Tests

- Tests mirror the main package under `src/test/java`. `Data4LifeApplicationTests` boots the full
  context; `PingControllerTest` is a `@WebMvcTest` slice.
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
