---
paths:
  - "frontend/**"
---

# Frontend

Single Nx project `frontend` at the `frontend/` root (`project.json`, `src/`, `test/`). All targets
are inferred from the plugins in `nx.json` (`@nx/vite`, `@nx/vitest`, `@nx/eslint`); `project.json`
declares none.

## Layout

`src/`, imported through the `@/*` alias:

- `app/` — shell: `app.tsx`, later routes and document title
- `pages/<page>/` — one route each, with page-local `components/`, `hooks/`, `utils/`
- `features/` — cross-page chrome (navigation, footer)
- `common/` — reusable components, hooks, contexts, utils

Imports only point downwards through the layers `app/` → `pages/` → `features/` → `common/`.
`eslint.config.mjs` enforces this with `no-restricted-imports`, and `import/no-cycle` rejects import
cycles. Only `app/` exists at first; create the others when something belongs there.

## Conventions

- Files are kebab-case. Components are arrow functions with `export default`; hooks are `use-*.ts`
  with a default export; props are a `type <Name>Props`.
- Use `@/` imports rather than relative ones. With a component library, use deep imports
  (`@mui/material/Box`), not the barrel.
- The `@/` alias is declared twice and both must stay in step: `paths` in `tsconfig.app.json` and
  `tsconfig.spec.json` for TypeScript, and `resolve.alias` in `vite.config.mts` for Vite and Vitest.
- Prettier (on save): printWidth 100, single quotes (also in JSX), trailing commas, LF endings, and
  `prettier-plugin-organize-imports`, so imports get sorted and unused ones removed on format. Don't
  hand-order imports.
- TypeScript is strict with `noUnusedLocals`, `noImplicitReturns`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`; `module: esnext`, `moduleResolution: bundler`.
- `tsc` output (declarations, build info) goes to `out-tsc/`; Vite output goes to `dist/`. Both are
  gitignored.

## UI And Routing

- MUI (`@mui/material`, `@mui/icons-material`, Emotion) for components and `react-router` for
  routing. `app/routes.tsx` declares the routes: `/login`, `/create` and `/profile`, with `/` and
  unknown paths sent to `/profile`. `app/require-auth.tsx` guards them: `/profile` needs a login and
  `/login` and `/create` (the `guest` routes) send a logged-in user to `/profile`.
- The theme lives in `app/theme.ts`. Light mode is `#000076` on `#FFDACF`, dark mode is the inverse,
  and the mode follows the system preference (`colorSchemeSelector: 'media'`); there is no toggle.
  Take colours from the theme palette rather than hard-coding them.
- `common/contexts/auth-context.tsx` loads the current user from `GET /api/auth/me` once on start and
  offers `login` and `logout`; read it through `common/hooks/use-auth.ts`. Call the backend through
  `apiFetch` in `common/utils/api.ts`, which throws an `ApiError` carrying the backend's message.

## Tests

Specs live in `test/` and keep the same path relative to `test/` as the file they test has relative
to `src/`: `src/features/footer/footer.tsx` is tested by `test/features/footer/footer.spec.tsx`.
They run in jsdom with `globals: true`, so `describe`/`it`/`expect` need no import.
`@testing-library/react`, `user-event` and `jest-dom` matchers (via `test/setup.ts`) are set up.
Test files are typed by `tsconfig.spec.json`, never included in `tsconfig.app.json`.

- Every input, button and error message has a `data-testid` named `<page>-<thing>`, such as
  `login-email` or `create-error`. On a MUI `TextField`, put it on the input through
  `slotProps={{ htmlInput: { 'data-testid': '...' } }}`. Tests look elements up by these ids.
- Page specs render the page inside `AuthProvider` and a `MemoryRouter`, and stub the backend with
  `test/mock-fetch.ts`, which answers `fetch` calls by `"METHOD /path"`.

## Dev Server And API

`pnpm nx dev frontend` serves on `http://localhost:4210` and proxies `/api` to the backend at
`http://localhost:8080`. Override the target with `VITE_API_URL` in `frontend/.env.local`
(gitignored, see `.env.example`). In production `frontend/nginx.conf` plays the same role: it
serves `dist/` with an SPA fallback and proxies `/api/` to the `backend` container. Both keep the
app same-origin, so there is no CORS configuration anywhere.

`frontend/Dockerfile` installs with the pinned pnpm, runs `pnpm nx build frontend` and copies
`dist/` into an Nginx image. `.dockerignore` keeps `node_modules`, build output and env files out of
the build context.
