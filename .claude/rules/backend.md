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
  reservations, fines and payments (`/api/loans`), `borrow/` holds the borrow page endpoints
  (`BorrowController`, `BorrowService`, `/api/borrow`), `returns/` holds the return page endpoints
  (`ReturnController`, `ReturnService`, `/api/return`; named `returns` because `return` is a Java
  keyword), `admin/` holds the admin users page endpoints
  (`AdminUserController`, `AdminUserService`, `/api/admin/users`), `notification/` holds the in-app
  notifications and their live stream (`/api/notifications`), and `config/` holds the security setup and the JSON error
  handler. A new feature gets its own package with its controller, service, repository
  and entities together; cross-cutting configuration goes in a `config/` package when needed.
- Every HTTP route sits under `/api/`; that prefix is what the Vite dev proxy and the Nginx
  container route to the backend. The backend is never exposed directly, so there is no CORS setup.
- Request and response bodies are Java records. No Lombok.
- Constructor injection only; no field `@Autowired`.
- Configuration comes from `application.yml` and is overridable with environment variables:
  `DB_URL`, `DB_USER`, `DB_PASSWORD`, `SERVER_PORT`, `ADMIN_EMAIL` (read as `app.admin-email`) and
  `ADMIN_PASSWORD` (`app.admin-password`). A local run also reads these from the root `.env` through
  `spring.config.import`; real environment variables win over the file.
  Never commit real credentials; `docker-compose.yml` reads them from the gitignored `.env`.

## Security

- Spring Security with a server-side session: `POST /api/auth/login` checks the email and BCrypt
  password hash and stores the login in the HTTP session, so the browser only carries the session
  cookie. `POST /api/auth/logout` invalidates it and `GET /api/auth/me` returns the current user.
  `DELETE /api/auth/me` deletes the caller's own account under the same loan and fine checks as
  the admin delete (`AdminUserService`, which `auth/` therefore depends on), refuses the root admin
  with `403`, and logs the session out.
- Public routes: `POST /api/users`, `POST /api/auth/login`, `GET /api/ping` and
  `/actuator/health`. Everything else needs a session and answers `401` without one, including
  `PUT /api/users/me`, `/api/interests/**`, `/api/loans/**`, `/api/borrow/**`, `/api/return/**` and
  `/api/notifications/**`, which any logged-in user may call; there are no login redirects or forms.
- Async dispatches are permitted in `SecurityConfig`, because the notification stream's completion
  dispatch comes after the request itself has already been checked.
- `/api/books/**`, `/api/catalogue/**` and `/api/admin/**` are admin only, both as a URL rule in
  `SecurityConfig` and through `@PreAuthorize` on `BookController`, `ColumnController` and
  `AdminUserController`. Non-admins get
  `403 { "message": "Forbidden" }`.
- Users have an `is_admin` flag. The account whose email matches `ADMIN_EMAIL` becomes admin on
  sign-up, and `AdminPromoter` promotes it at startup if it already exists. With `ADMIN_PASSWORD`
  also set, `AdminPromoter` creates that account at startup when it is missing
  (`UserService.seedAdmin`); an existing account keeps its password, and a password that breaks the
  sign-up rules stops the startup. Admins get `ROLE_ADMIN`
  on top of `ROLE_USER`, and `@EnableMethodSecurity` is on, so admin-only endpoints can use
  `@PreAuthorize("hasRole('ADMIN')")`. That `ADMIN_EMAIL` account is the root admin
  (`UserService.isRoot`). With `ADMIN_EMAIL` unset nobody is root, so admins with no recorded
  promoter cannot be demoted by anyone.
- Every login is registered in a `SessionRegistry` with the email as principal (`AuthController`
  does this by hand, because login does not go through a form-login filter). Promoting or demoting a
  user expires all of their sessions, so their next request answers `401` and they must log in
  again, which rebuilds their roles.
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
  unpaid, paid, forgiven, reserved, expired, queued, removed) and fine are derived from its dates and are
  never stored themselves. A fine being paid or forgiven is stored as a timestamp (`fine_paid_at`,
  `fine_forgiven_at`); paid wins when both are set.
- A reservation is a `loans` row with `reserved_at` and `reserved_until` set and no `borrowed_at`.
  It holds a copy for 7 days and costs a $5.00 fee (`LoanService.RESERVE_FEE`), paid when reserving
  and shown on the history row as `fee`; it is not a fine. Once `reserved_until` has passed it is
  expired, and `released_at` records when its copy went back into stock, so that happens exactly
  once. Borrowing a reserved book fills in `borrowed_at` and `due_at` on the same row.
- Reserving a book that is out of stock joins its queue instead: a queued row is a reservation with
  `reserved_until` still null. The $5.00 fee is paid when joining, and queued rows count toward the 8
  book limit. The queue is first come, first served per book (`reserved_at`, then `id`). Whenever a copy
  comes back (a return, a cancelled or expired reservation, or a raised `amount`),
  `LoanService.serveQueue` gives it to the first queued user by setting `reserved_until` to 7 days from
  then. A queued user with unpaid fines or an overdue book at that moment is removed instead:
  `removed_at` and `released_at` are set, the fee is not refunded, and the copy goes to the next user.
  Leaving the queue sets only `released_at`, so the row shows as expired.
- A book's `stock` is always `amount` minus the copies held: open loans (no return date) plus
  reservations that have a copy and are not yet released. Queued rows hold no copy, and a non-empty
  queue means `stock` is 0. The catalogue endpoints only take `amount` and recompute `stock`; an amount
  below the copies held is rejected. Returning a book sets `returned_at` and puts its copy back into
  stock or hands it to the queue.
- Expired reservations are released whenever the borrow page, the history, a catalogue update or a
  user delete needs exact numbers, and by `ReservationReleaser` every 10 minutes
  (`@EnableScheduling`), so catalogue stock does not go stale when nobody opens those pages.

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

## Borrow Endpoints

- `GET /api/borrow` lists books for any logged-in user with the same paging, sorting and filter
  parameters as `GET /api/books`, except that `amount` cannot be sorted on. Each book carries
  `stock`, `holding` (`BORROWED` for an open loan, `RESERVED` for an active reservation, `QUEUED` for a
  place in the queue, or null), `queueLength` and `queuePosition` (the caller's place, counted from 1,
  or null). The response also carries `block`: null when the user may borrow, otherwise the reason
  (unpaid fines, an overdue book, or already holding 8 books, checked in that order), and
  `convertBlock`, the same reason except that holding 8 books does not stop a reservation being
  borrowed, so the frontend can keep that one button enabled.
- `POST /api/borrow/{isbn}` borrows a book for 14 days and `POST /api/borrow/{isbn}/reserve`
  reserves it, or joins its queue when it is out of stock; both answer the updated book and `409` with a
  message when refused (already on loan, already reserved or queued, blocked, still in the queue, or out
  of stock when borrowing). Borrowing a book the user has reserved turns the
  reservation into a loan without touching stock, and the 8 book limit does not apply to that.
  The book row is locked (`BookRepository.lockByIsbn`) so two users cannot take the last copy.
- `GET` and `PUT /api/borrow/columns` store the user's borrow table column widths (five
  percentages) in `users.borrow_columns`, the same way as the catalogue column widths.

## Return Endpoints

- `GET /api/return` lists the caller's open loans, active reservations and returned loans whose
  late fine is still unpaid, with the same `page`, `size`, `sort` and `dir` parameters as the
  catalogue. Sort keys are `isbn`, `title`, `author`, `genre`, `language` and `due` (the default,
  ascending; a reservation sorts by `reservedUntil`); filters are `isbn`, `title`, `author`,
  `genreId` and `languageId`. Each row carries the loan `id`, the book details, `status`
  (`BORROWED`, `OVERDUE`, `UNPAID`, `RESERVED` or `QUEUED`), `dueAt`, `returnedAt`, `reservedUntil`,
  `overdueDays`, `fine` and `queuePosition` (null unless queued). Queued rows have no date and sort last
  by `due` in ascending order. The response also carries the filter options (distinct values across
  the caller's rows) and `totalUnpaid`, the sum of the unpaid fines. Expired reservations are
  released first, so they never appear. A user holds few loans, so this list is filtered, sorted
  and paged in memory like the admin users list.
- `POST /api/return/{loanId}` returns a loan and answers the updated row: `404` when the loan is
  not the caller's, `409` when it is a reservation or was already returned. It locks the book row
  and puts the copy back into stock or hands it to the queue. A late return then shows as `UNPAID`, and the fine is paid
  through the existing `/api/loans/{id}/pay` and `/api/loans/pay-all` endpoints.
- `POST /api/return/{loanId}/unreserve` cancels an active reservation or leaves the queue: it sets
  `released_at` and, for an active reservation, puts the copy back into stock or hands it to the queue,
  so the row shows as `EXPIRED` in the history afterwards. The fee is not refunded. `404` when the loan is not the caller's, `409` when it is a loan rather than a
  reservation or the reservation has already ended.
- `GET` and `PUT /api/return/columns` store the user's return table column widths (five
  percentages) in `users.return_columns`, the same way as the catalogue column widths.

## Notification Endpoints

- A notification belongs to a user and points at a loan (`notifications` table), so book merges and
  ISBN changes need no extra handling. Types are `AVAILABLE` (a queued copy is ready), `REMOVED_UNPAID`
  and `REMOVED_OVERDUE` (removed from a queue, with the reason). They are kept until the user deletes
  them, and are deleted along with the user.
- `GET /api/notifications?before=<id>` lists the caller's notifications newest first, 20 at a time;
  `before` is the id of the last item already shown, and `hasMore` says whether older ones exist. Each
  item carries `id`, `type`, `isbn`, `title`, `createdAt` and `read`.
- `GET /api/notifications/unread` answers `{ "count": n }`. `POST /api/notifications/{id}/read`,
  `POST /api/notifications/read-all`, `DELETE /api/notifications/{id}` and `DELETE /api/notifications`
  change the notifications and answer the new unread count. Another user's notification answers `404`.
- `GET /api/notifications/stream` is a Server-Sent Events stream (`NotificationStream`). A new
  notification is sent as an event named `notification` once its transaction commits, and a comment
  every 25 seconds keeps proxies from closing the idle connection. Each stream lasts 30 minutes and the
  browser reconnects by itself. The response carries `X-Accel-Buffering: no`, and `frontend/nginx.conf`
  has a separate unbuffered location for this path.

## Admin User Endpoints

- `GET /api/admin/users` lists users with their borrow and fine statistics, with the same `page`,
  `size`, `sort`, `dir` and exact-match filter parameters as the catalogue. Sort keys and filters
  are `name`, `email`, `admin`, `joined` (sort only), `totalBorrows`, `currentBorrows`, `totalFines`
  and `currentFines`. Current fines are unpaid fines plus fines still growing on overdue loans;
  total fines also include paid and forgiven ones. Each row carries `demotable`, computed for the
  caller, so the frontend never repeats the demotion rules.
- This list is filtered, sorted and paged in memory, not in SQL, because fines depend on the
  current time and started-day rounding that would otherwise be duplicated in queries. A library
  has few enough users for this to be cheap.
- `POST /api/admin/users/{id}/promote` makes a user admin and records the promoter in
  `users.promoted_by`. `POST /api/admin/users/{id}/demote` follows these rules: the root admin can
  never be demoted, nobody can demote themselves, root can demote any other admin, and otherwise
  only the recorded promoter can (an admin with no recorded promoter counts as promoted by root).
- Borrow counts only include real loans, not reservations.
- `DELETE /api/admin/users/{id}` removes a user with their loans and interests. Who may delete whom
  follows the demotion rules (never root, never yourself, an admin only by root or their promoter,
  a non-admin by any admin). It answers `409` while the user still has books on loan, an active or
  queued reservation or unpaid fines, so those must be returned, expire, or be paid or forgiven first. Users the deleted admin had promoted
  keep their admin flag with no recorded promoter. Each row carries `deletable` for the caller.
- `GET /api/admin/users/{id}/fines` lists the user's loans that carry a fine, and
  `POST /api/admin/users/{id}/loans/{loanId}/forgive` forgives an unpaid fine (`409` for any other
  status). Forgiven fines no longer count as owed and cannot be paid.
- `GET` and `PUT /api/admin/users/columns` store the admin's users table column widths in
  `users.users_columns`, the same way as the catalogue column widths.

## Tests

- Tests mirror the main package under `src/test/java`. `Data4LifeApplicationTests` boots the full
  context; `PingControllerTest` is a `@WebMvcTest` slice (it uses `@WithMockUser`, because the
  slice does not load `SecurityConfig`). `UserFlowTest` covers the whole sign-up and login flow
  through `MockMvc`, carrying the session between requests; `InterestFlowTest`, `LoanFlowTest`,
  `BookFlowTest`, `ColumnFlowTest`, `BorrowFlowTest`, `ReturnFlowTest`, `AdminUserFlowTest` and
  `NotificationFlowTest` do the same for their routes, and `LoanServiceTest` covers every loan status,
  fine rule, borrow block, reservation release and queue hand-over. `NotificationStreamTest` is a plain
  unit test of the stream. `AdminUserFlowTest` also checks that a
  demoted admin's old session answers `401`, the delete rules and self-deletion.
- Full-context tests carry `@ActiveProfiles("test")`, which loads `application-test.yml` (H2
  in-memory, PostgreSQL mode) on top of `application.yml`. Keep it a profile file rather than a
  second `application.yml`, because a test `application.yml` would shadow the main one entirely.
- Flow tests are `@Transactional` and roll back, so after-commit listeners never run in them. Check
  notifications through the REST list and the published `NotificationCreated` event with
  `@RecordApplicationEvents`.
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
