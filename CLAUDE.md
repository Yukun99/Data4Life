# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
It is also the onboarding doc for developers, so keep it readable by humans.

## What This Repo Is

Data4Life: a React frontend and a Java backend with PostgreSQL, packaged as Docker containers and
meant for self-hosting on any Docker host (a home server, NAS or VPS) behind a reverse proxy or
tunnel. Nginx serves the static frontend and proxies `/api` to the backend, so the browser only ever
sees one origin. The two halves are separate projects in one git repository:

- `frontend/` is a single-app Nx 23 workspace on pnpm: React 19, TypeScript, Vite 8, Vitest 4,
  ESLint (flat config) and Prettier. There are no `apps/` or `libs/` folders; the app is the
  workspace root.
- `backend/` is a Spring Boot 4 / Java 21 Maven project: Spring MVC, Spring Data JPA, Flyway,
  Validation, Actuator, PostgreSQL. Tests run on H2.
- `docker-compose.yml` at the root runs `web` (Nginx + frontend build), `backend` and `db` on the
  Docker host.

Topic-specific instructions live in `.claude/rules/` and load automatically when matching files are
touched (`paths` frontmatter). Add new specifics there, not here. Details of the developer's actual
hosting environment (devices, providers, domains, accounts) live only in gitignored
`.claude/rules/*.local.md` files. Keep every tracked file generic; never copy that content into one.

## How To Work In This Repo

- Start every session in caveman ultra mode: run `/caveman ultra` before anything else.
- Before a large task, ask the developer to run `/clear` (Claude cannot) and restate the task, unless
  the session is already fresh.
- For big tasks, enter plan mode first. Raise every doubt as a question instead of assuming, and only
  start once the doubts are answered and the plan is confirmed.
- Never run Prettier manually. The IDE formats on save.
- Don't run `nx configure-ai-agents` or similar; it regenerates config for other AI tools, which this
  repo intentionally does not keep.
- Documentation files (`CLAUDE.md`, `.claude/rules/`, READMEs) are read by developers as well as
  Claude. Keep every change brief and human readable: full sentences, no shorthand only Claude would
  follow. Headings use Title Case With Spaces. Prefer leaving a placeholder and asking the developer
  to fill it in, unless told otherwise.
- After any code change, run the checks for the project you touched (see Commands) before reporting
  done. Run them in the background so they don't block other work, then collect and report the
  results. When a large task is complete, ask the developer to test it in the browser.
- Before the developer commits, list any new untracked files so none are left out of the commit.
- Naming: prefer the shortest name that still explains the thing clearly. `fetchWeather`, not
  `fetchWeatherDataFromApi` and not `fw`.
- For anything not covered here with no clear industry standard, ask the developer before choosing.

## Commands

Frontend commands run from `frontend/`. Always go through Nx with the workspace package manager
(`pnpm nx ...`), never the underlying tool directly, and never `npm`. Don't guess CLI flags; check
`--help` first. Plugin tips live in `node_modules/@nx/<plugin>/PLUGIN.md` where present.

```sh
pnpm install
pnpm nx dev frontend         # Vite dev server on http://localhost:4210, /api proxied to :8080
pnpm nx build frontend       # outputs to frontend/dist
pnpm nx preview frontend     # serves the build on http://localhost:4210
pnpm nx test frontend        # Vitest (jsdom), single run
pnpm nx lint frontend
pnpm nx typecheck frontend
pnpm nx run-many -t lint typecheck test build   # everything
```

Single test file / single test name (args after `--` go to Vitest):

```sh
pnpm nx test frontend -- test/app/app.spec.tsx
pnpm nx test frontend -- -t "renders the title"
```

Backend commands run from `backend/` through the Maven wrapper; no local Maven install is needed.

```sh
./mvnw verify                # compile + tests (H2, no database needed)
./mvnw spring-boot:run       # http://localhost:8080, needs PostgreSQL (see .claude/rules/backend.md)
./mvnw -DskipTests package   # jar in backend/target
```

Deployment runs from the repo root on the Docker host: `docker compose up -d --build` after copying
`.env.example` to `.env`. Both Dockerfiles build from source, so nothing is built on the dev machine.

## Code Structure

- If a component's logic exceeds ~50 lines, move the logic into a `use-<name>.ts` hook in its own
  file. The component then only maps the hook's returned values onto display components.
- Put code at the narrowest level that fits: page-local first, `common/` only once it is shared.
- Prefer `type` over `interface`.
- Avoid code comments. Only where a weird interaction or complicated logic really needs one, keep it to
  1 line (2 at most). Short doc comments on helper functions are fine.
- Dependency versions are pinned exactly (no `^` or `~`) in both `package.json` and `pom.xml`.
- Tests never sit next to the code: frontend specs live in `frontend/test/` mirroring `src/`, backend
  tests mirror the package under `backend/src/test/java`.

## Naming

| Thing                              | Convention                  | Example                                   |
|------------------------------------|-----------------------------|-------------------------------------------|
| Frontend files                     | kebab-case                  | `price-ticker.tsx`, `use-price-ticker.ts` |
| Components                         | UpperCamelCase              | `PriceTicker`                             |
| Component prop types               | `<ComponentName>Props`      | `PriceTickerProps`                        |
| Non-component function param types | `<FunctionName>Params`      | `FormatPriceParams`                       |
| Java packages                      | one per feature             | `com.yukunxu.data4life.ping`              |
| Java classes                       | UpperCamelCase, role suffix | `PingController`, `OrderService`          |
| Flyway migrations                  | `V<n>__<snake_case>.sql`    | `V1__create_orders.sql`                   |
| Markdown headings                  | Title Case With Spaces      | `## Code Structure`                       |
