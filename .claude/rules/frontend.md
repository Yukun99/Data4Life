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

- `app/` — shell: `app.tsx`, routes, route guards, layout and document title
- `pages/<page>/` — one route each, with page-local `components/`, `hooks/`, `utils/`
- `features/` — cross-page chrome (navigation, footer)
- `store/` — the Redux Toolkit store, its typed hooks (`useAppDispatch`, `useAppSelector`) and
  slices
- `common/` — reusable components, hooks, utils and shared types; it must not import from `store/`.
  `common/utils/format.ts` holds the money, date and day formatters and the loan status labels and
  chip colours used by the profile and users pages.

Imports only point downwards through the layers `app/` → `pages/` → `features/` → `store/` →
`common/`.
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
  routing. `app/routes.tsx` declares the routes. `/login` and `/create` are guest routes, and
  `app/require-auth.tsx` sends a logged-in user from them to `/`. `/`, `/borrow`, `/return`
  and `/profile` need a login and render inside `app/layout.tsx`, which adds the header.
  `/users` and `/catalogue` are also wrapped in `app/require-admin.tsx`, which sends non-admins to
  `/`. Unknown paths go to `/`.
- `/profile` has two columns that stack on narrow screens. The left holds the profile card (edit
  name and icon; the edit dialog also has a Delete account button with a confirm step that calls
  `DELETE /api/auth/me` through the `deleteAccount` thunk and, on success, clears the user so the
  guard sends them to `/login`) and the interests card (genres and languages, at most 10, with a first-time dialog
  that can be skipped). The right holds the History / Payments panel with loan stats, statuses and
  fine payments; a fine an admin forgave shows a Forgiven chip and no Pay button. A reservation
  shows as Reserved (with its end date) or Expired, both with the $5.00 fee that was paid. Pay and
  Pay all ask for confirmation first. The `Loan` and
  `LoanStatus` types live in `common/types.ts` and are re-exported by the history slice. The loan
  history, its loading and error state and the `fetchHistory`,
  `payLoan` and `payAllFines` thunks live in the `history` slice (`store/history-slice.ts`);
  `pages/profile/hooks/use-history.ts` only dispatches them. The profile card and interests keep
  their form state in page-local hooks under `pages/profile/hooks/`.
- `/borrow` lists the books for any logged-in user, built on the data table framework. Each row
  offers Borrow and Reserve (a reservation costs $5.00 and holds a copy for 7 days). A book the user
  has on loan shows a Borrowed chip and no buttons; a reserved book shows a Reserved chip and a
  Borrow button that turns the reservation into a loan. The buttons are disabled, with a tooltip,
  when the book is out of stock or when the backend sends a block reason (unpaid fines, an overdue
  book, or 8 books held), which also shows as a banner above the table. The Borrow button on a
  reserved row follows the response's `convertBlock` instead, so the 8 book cap does not disable
  it. The `borrow` slice
  (`store/borrow-slice.ts`) holds the list, its query values, the block reason, the column widths
  (saved at `/api/borrow/columns`) and the thunks for every `/api/borrow` call.
  `pages/borrow/hooks/use-borrow-action.ts` drives the confirm dialog and reloads the list after a
  change.
- `common/components/confirm-dialog.tsx` is the shared confirm dialog (title, body, confirm label,
  error and loading state). It is used for borrowing and reserving, paying fines on the profile page
  and forgiving a fine on the users page. Older dialogs keep their own components.
- `/catalogue` is the admin book table, built on the data table framework described below. The
  list, the page, size, sort and filter values and the filter options live in the `catalogue` slice
  (`store/catalogue-slice.ts`), which also holds the thunks for every `/api/books` call. The add,
  edit, merge and delete dialogs keep their form state in hooks under `pages/catalogue/hooks/` and
  reload the list after a change. `book-table.tsx` holds the column list and calls
  `use-catalogue-columns.ts`, which loads and saves the column widths at `/api/catalogue/columns`.
- `/users` is the admin user table, also built on the data table framework. Each row shows the
  name and email, admin flag, join date, total and current borrows and total and current fines.
  Row actions promote a user, demote an admin, delete a user (each enabled only when the backend's
  `demotable` or `deletable` flag says the current admin may) and open a fines dialog where unpaid
  fines can be forgiven one loan at a time, after a confirm step. Promote, demote and delete share one confirm dialog
  (`action-dialog.tsx`, driven by `use-user-action.ts`). The `users` slice (`store/users-slice.ts`) holds the list, its query values, the
  column widths (saved at `/api/admin/users/columns`), the open user's fines and the thunks for
  every `/api/admin/users` call. The action and fines dialogs keep their local state in hooks under
  `pages/users/hooks/` and reload the list after a change.
- `features/navigation/` holds the header (menu button, `Library` title, theme toggle), the nav
  drawer and `pages.ts`, the list of pages with their labels, icons and admin flag.
  `app/document-title.tsx` sets the tab title to `Library - <Page>` from that list.
- The theme lives in `app/theme.ts`. Light mode is `#000040` on `#FFDACF`, dark mode is the inverse.
  The header toggle switches modes through MUI's `useColorScheme`, which stores the choice as
  `mui-mode` in localStorage and sets `data-mui-color-scheme` on `<html>`; until the user picks one
  the mode follows the system. An inline script in `index.html` applies the stored mode before the
  app loads, so a reload does not flash. Take colours from the theme palette rather than hard-coding
  them. The favicon is `public/favicon.svg`.
- The `user` slice in `store/user-slice.ts` holds the current user (`fetchMe` loads it from
  `GET /api/auth/me` on start) and offers the `login`, `updateProfile` and `logout` thunks and the `selectUser`,
  `selectUserLoading` and `selectIsAdmin` selectors. Call the backend through `apiFetch` in
  `common/utils/api.ts`, which throws an `ApiError` carrying the backend's message.

## Data Tables

`common/components/data-table/` is a reusable, store-free table framework; a page supplies the data
and callbacks through props. Paging, sorting and filtering all happen on the backend, so a page only
sends the page, size, sort and filter values.

- `data-table.tsx` renders a full-width, fixed-layout MUI table from a list of column specs
  (`types.ts`). A column has one or more stacked headers, each optionally sortable, and either
  `lines` (stacked values: the first in the normal colour, the rest in the secondary colour, cut
  with an ellipsis) or a custom `render`. It also shows the error, loading and empty rows, with test
  ids `<prefix>-error`, `<prefix>-loading` and `<prefix>-empty`.
- Clicking a single header cycles its sort ascending, descending, off (`cycleSort` in `sort.ts`).
  In a stacked header, clicking the other key while a sort is active switches to it and keeps the
  direction (`keepDirSort`).
- Column widths are percentages summing to 100. Dragging the divider on the right of a header
  (`use-column-resize.ts`) moves width between that column and the next, never below 5% each, and
  reports the final widths once on release so the page can save them.
- `table-toolbar.tsx` (filter button with an active filter count, page size select and an optional
  slot for extra buttons), `table-pagination.tsx` and `filter-dialog.tsx` (one exact-match dropdown
  per field) complete a page. `buildQuery` (`build-query.ts`) writes the list query string in a
  fixed order (`page`, `size`, `sort`, `dir`, then set filters in the given key order) so specs can
  stub exact URLs.
- Three pages use it: `/catalogue`, `/users` and `/borrow`.
- To add a table page: define its column keys, default widths, sort keys and filter keys in a slice
  with the same reducers as the catalogue or users slice, write the column specs in a page
  component, and pass the slice values and actions to these components.

## Tests

Specs live in `test/` and keep the same path relative to `test/` as the file they test has relative
to `src/`: `src/features/footer/footer.tsx` is tested by `test/features/footer/footer.spec.tsx`.
They run in jsdom with `globals: true`, so `describe`/`it`/`expect` need no import.
`@testing-library/react`, `user-event` and `jest-dom` matchers (via `test/setup.ts`) are set up.
Test files are typed by `tsconfig.spec.json`, never included in `tsconfig.app.json`.

- Every input, button and error message has a `data-testid` named `<page>-<thing>`, such as
  `login-email` or `create-error`. On a MUI `TextField`, put it on the input through
  `slotProps={{ htmlInput: { 'data-testid': '...' } }}`. Tests look elements up by these ids.
- Page specs render the page inside `withStore` from `test/with-store.tsx` (a fresh store with a
  preloaded user; sample users live in `test/users.ts`) and a `MemoryRouter`, and stub the backend
  with `test/mock-fetch.ts`, which answers `fetch` calls by `"METHOD /path"`.

## Dev Server And API

`pnpm nx dev frontend` serves on `http://localhost:4210` and proxies `/api` to the backend at
`http://localhost:8080`. Override the target with `VITE_API_URL` in `frontend/.env.local`
(gitignored, see `.env.example`). In production `frontend/nginx.conf` plays the same role: it
serves `dist/` with an SPA fallback and proxies `/api/` to the `backend` container. Both keep the
app same-origin, so there is no CORS configuration anywhere.

`frontend/Dockerfile` installs with the pinned pnpm, runs `pnpm nx build frontend` and copies
`dist/` into an Nginx image. `.dockerignore` keeps `node_modules`, build output and env files out of
the build context.
