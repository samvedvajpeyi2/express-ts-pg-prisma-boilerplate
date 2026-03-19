# 🚀 Express + TypeScript + Prisma + PostgreSQL Boilerplate

A production-ready backend boilerplate built with Node.js, Express, TypeScript, and Prisma ORM. Designed with a strict four-layer architecture, full JWT authentication (access + refresh token rotation), comprehensive test coverage (unit + integration), and a Docker-first development workflow.

---

## ✨ Features

### 🛠️ Core

✅ **TypeScript** — strict mode, full type safety throughout\
✅ **Express 5** — latest version with improved async error propagation\
✅ **Prisma ORM** — type-safe DB queries with auto-generated client\
✅ **PostgreSQL** — relational database via `pg` driver with Prisma adapter\
✅ **ESM modules** — native ES module support (`"type": "module"`)

### 🏗️ Architecture

✅ **Four-layer architecture** — Routes → Controllers → Services → Repositories\
✅ **Feature-based folder structure** — each domain (auth, user) is fully self-contained\
✅ **App factory pattern** — `createApp()` separates app setup from server startup, enabling supertest without a real port\
✅ **Dependency injection** — services and repositories are constructor-injected, not globally imported

### 🔐 Authentication & Security

✅ **JWT access tokens** — short-lived (15m), signed with HS256\
✅ **Refresh token rotation** — long-lived tokens (30d) stored as SHA-256 hashes in the DB; rotated on every refresh\
✅ **Unique JWT IDs (jti)** — `crypto.randomUUID()` added to every refresh token to prevent hash collisions\
✅ **HttpOnly refresh token cookie** — never exposed to JavaScript\
✅ **Role-based access control** — `USER` / `ADMIN` roles enforced via middleware\
✅ **Rate limiting** — `express-rate-limit` (skipped in test mode)\
✅ **Host whitelisting** — blocks requests from non-whitelisted origins\
✅ **Content-Type guard** — all POST/PUT/PATCH requests must send `application/json`

### ✅ Validation & Error Handling

✅ **Zod** — request body validation + environment variable validation at startup\
✅ **Centralised error handler** — maps `AppError`, Prisma errors (P2002 → 409, P2025 → 404), and Zod errors to clean HTTP responses\
✅ **No stack traces in responses** — only user-friendly messages

### 🧪 Testing

✅ **Vitest** — unit tests co-located in `__tests__/` inside each feature folder\
✅ **Supertest** — integration tests against a real Express app (no live port)\
✅ **Isolated test database** — separate PostgreSQL DB (`_test` suffix), migrated automatically before each run\
✅ **Per-test DB cleanup** — `beforeEach` truncates `User` and `RefreshToken` tables\
✅ **Sequential integration test execution** — `singleFork: true` prevents concurrent DB corruption

### 🛠️ Developer Experience

✅ **Docker Compose** — app + Postgres containers, full environment parity\
✅ **Makefile** — short commands for all common tasks (`make start`, `make test`, `make lint`, etc.)\
✅ **Husky + lint-staged** — pre-commit hook runs ESLint + Prettier on staged files\
✅ **ESLint** — strict TypeScript rules (`recommendedTypeChecked`), import sorting, security plugin, promise plugin\
✅ **Prettier** — auto-formatting\
✅ **Nodemon-free** — uses `tsx watch` for hot reload\
✅ **Graceful shutdown** — handles `SIGTERM`/`SIGINT`, closes DB connections cleanly

---

## 🏗️ Architecture

This project follows a strict **four-layer split**: Routes → Controllers → Services → Repositories. Each layer has a single, clearly defined responsibility.

```
src/
├── config/
│   ├── env-config.ts       # Loads & validates .env at startup via Zod
│   ├── env-schema.ts       # Zod schema for all environment variables
│   └── prisma.ts           # PrismaClient singleton (cached on globalThis)
├── constants/
│   └── roles.ts            # Role name constants
├── errors/
│   └── app-error.ts        # Custom AppError class with statusCode
├── features/
│   ├── auth/
│   │   ├── __tests__/      # Unit tests (Vitest)
│   │   ├── controllers/    # HTTP layer — extracts req data, calls service
│   │   ├── repositories/   # DB layer — all Prisma queries live here
│   │   ├── routes/         # Route definitions + middleware wiring
│   │   ├── schemas/        # Zod validation schemas
│   │   └── services/       # Business logic — no Express, no Prisma
│   └── user/
│       ├── __tests__/
│       ├── controllers/
│       └── routes/
├── middleware/
│   ├── authenticate.middleware.ts   # Verifies JWT, attaches user to req
│   ├── authorize.middleware.ts      # Checks role against allowed roles
│   ├── error.middleware.ts          # Global error handler
│   ├── request-guard.middleware.ts  # Content-Type + unmatched route guards
│   ├── security.middleware.ts       # Helmet, rate limiter, host whitelist
│   └── validation.middleware.ts     # Zod request body validation
├── types/
│   └── express.d.ts        # Extends Express Request with `user` property
├── utils/
│   ├── jwt.util.ts         # sign/verify access and refresh tokens
│   └── time.util.ts        # Duration string parser (e.g. "30d" → ms)
└── server.ts               # createApp() factory + server startup
```

### Layer responsibilities

| Layer            | File pattern      | Rule                                                              |
| ---------------- | ----------------- | ----------------------------------------------------------------- |
| **Routes**       | `*.routes.ts`     | Wire URLs to controllers + middleware. No logic.                  |
| **Controllers**  | `*.controller.ts` | Extract `req` data, call service, send `res`. Never touch Prisma. |
| **Services**     | `*.service.ts`    | All business logic. No Express types, no Prisma.                  |
| **Repositories** | `*.repository.ts` | All Prisma queries. Called only by services.                      |

### Why this separation matters

- **Services are framework-agnostic** — reusable in CLI tools, workers, or GraphQL APIs without changes
- **Repositories are ORM-agnostic** — swap Prisma for Drizzle by only changing the repository layer
- **Controllers are thin** — switching from Express to Fastify means only changing controllers and routes

---

## 🔐 Authentication Flow

```
POST /auth/register
  → hash password (bcrypt, 12 rounds)
  → create user
  → sign access token (JWT, 15m)
  → sign refresh token (JWT + jti, 30d) → store SHA-256 hash in DB
  → return access token in body + refresh token in HttpOnly cookie

POST /auth/login
  → verify password
  → sign access + refresh tokens (same as register)

POST /auth/refresh
  → read refresh token from HttpOnly cookie
  → look up token hash in DB (reject if missing / revoked / expired)
  → verify JWT signature
  → revoke old token (set revokedAt)
  → issue new access + refresh tokens (rotation)

POST /auth/logout
  → revoke refresh token in DB
  → clear cookie
```

**Refresh token security details:**

- Stored as a SHA-256 hash — raw token never persisted
- `jti` claim (`crypto.randomUUID()`) ensures uniqueness even when signed within the same second
- Rotation on every refresh — old token revoked, new token issued
- `revokedAt` timestamp preserved in DB for audit trail

---

## 🗄️ Database Schema

| Model          | Key fields                                                                               |
| -------------- | ---------------------------------------------------------------------------------------- |
| `User`         | `id`, `email` (unique), `password` (bcrypt), `firstname`, `lastname`, `roleId`, `active` |
| `Role`         | `id`, `name` (`USER` \| `ADMIN`)                                                         |
| `RefreshToken` | `id`, `tokenHash` (unique), `userId`, `expiresAt`, `revokedAt`                           |
| `Document`     | `id`, `filename`, `url`, `reviewStatus`, `userId`                                        |

Roles are seeded once via `prisma/seed.ts`. Foreign key cascade: deleting a user deletes their refresh tokens and documents.

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) + Docker Compose

That's it — Node.js and PostgreSQL run inside containers.

### ⚡ Single Command Setup

Clone the repo, then run this single command from inside the repo folder:

```bash
make setup
```

This handles everything: copies env files from examples, builds the Docker image, starts containers, waits for Postgres, runs all migrations, seeds roles, and creates the test database. The API will be available at `http://localhost:3000`.

> Before deploying to production, update the secrets in `.env.dev` with real values.

---

### Manual Setup

### 1. Clone and configure

```bash
git clone <repo-url>
cd express-ts-pg-prisma-boilterplate
```

Copy the environment files:

```bash
cp .env.example .env.dev
cp .env.db.example .env.db.dev
```

### 2. Start the containers

```bash
make build   # first time (builds Docker image)
make start   # subsequent starts
```

The API will be available at `http://localhost:3000`.

### 3. Run migrations and seed

```bash
make pri-mig name=init   # create and apply first migration
make seed                 # seed roles (USER, ADMIN)
```

---

## ⚙️ Environment Variables

### `.env.dev` (app)

| Variable                   | Description                                | Example                             |
| -------------------------- | ------------------------------------------ | ----------------------------------- |
| `NODE_ENV`                 | Environment                                | `development`                       |
| `DATABASE_URL`             | Postgres connection string                 | `postgres://user:pass@db:5432/mydb` |
| `PORT`                     | Server port                                | `3000`                              |
| `LOG_LEVEL`                | Log verbosity                              | `info`                              |
| `WHITE_LIST_URLS`          | Comma-separated allowed origins            | `https://myapp.com`                 |
| `JWT_SECRET`               | Access token signing secret (min 32 chars) | `...`                               |
| `JWT_EXPIRES_IN`           | Access token TTL                           | `15m`                               |
| `REFRESH_TOKEN_SECRET`     | Refresh token signing secret               | `...`                               |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL                          | `30d`                               |

### `.env.db.dev` (postgres container)

| Variable            | Description |
| ------------------- | ----------- |
| `POSTGRES_USER`     | DB username |
| `POSTGRES_PASSWORD` | DB password |
| `POSTGRES_DB`       | DB name     |

> All environment variables are validated at startup with Zod (`src/config/env-schema.ts`). The app exits immediately with a clear error message if any required variable is missing or invalid. Never access `process.env` directly — always import `env` from `src/config/env-config.ts`.

---

## 🛠️ Make Commands

### Setup

| Command      | Description                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| `make setup` | Full first-time setup: copies env files, builds image, starts containers, runs migrations, seeds DB, creates test DB |

### Docker

| Command        | Description                        |
| -------------- | ---------------------------------- |
| `make start`   | Start all containers               |
| `make stop`    | Stop containers (keep volumes)     |
| `make build`   | Build and start in detached mode   |
| `make restart` | Stop and start                     |
| `make reset`   | Wipe volumes, rebuild, start fresh |
| `make remove`  | Stop and remove volumes            |
| `make logs`    | Follow container logs              |
| `make sh`      | Shell into app container           |
| `make prune`   | Clean unused Docker resources      |

### Prisma

| Command                    | Description                        |
| -------------------------- | ---------------------------------- |
| `make pri-mig name=<name>` | Create and apply a new migration   |
| `make pri-gen`             | Regenerate Prisma client           |
| `make pri-studio`          | Open Prisma Studio at port 5555    |
| `make pri-reset`           | Reset DB and re-run all migrations |
| `make seed`                | Run `prisma/seed.ts`               |

### Code Quality

| Command              | Description                                                                   |
| -------------------- | ----------------------------------------------------------------------------- |
| `make test`          | Run unit tests                                                                |
| `make test-int`      | Run integration tests                                                         |
| `make test-all`      | Run unit tests then integration tests (stops on first failure)                |
| `make test-ci`       | Same as `test-all` but without `-it` flag — safe for headless CI environments |
| `make test-db-setup` | Create test DB (one-time)                                                     |
| `make lint`          | Run ESLint                                                                    |
| `make lint-fix`      | Run ESLint with auto-fix                                                      |

---

## 🧪 Testing

### Unit Tests

Co-located with source code in `__tests__/` folders inside each feature. Run with:

```bash
make test
```

- All external dependencies (Prisma, JWT, bcrypt) are mocked with `vi.mock()`
- Each test file manages its own mocks via `vi.clearAllMocks()` in `beforeEach`
- Typed with `Mocked<T>` from Vitest for full type safety on mock repos

### Integration Tests

Located in `tests/integration/`. Run with:

```bash
make test-db-setup   # one-time: creates the test DB
make test-int        # runs all integration tests
```

- Tests run against a real PostgreSQL test database
- Migrations applied automatically via `global-setup.ts` before each run
- `beforeEach` truncates `User` and `RefreshToken` tables — every test starts clean
- Uses `supertest.agent(app)` for cookie-based flows (refresh, logout)
- Tests run sequentially (`singleFork: true`) to prevent DB state conflicts

### Test File Locations

| Type                 | Location                           |
| -------------------- | ---------------------------------- |
| Unit                 | `src/features/{domain}/__tests__/` |
| Integration          | `tests/integration/`               |
| Functional (planned) | `tests/functional/`                |
| E2E (planned)        | `tests/e2e/`                       |

---

## 🔄 CI / CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs automatically on every pull request targeting `main` or `master`.

**What it does:**

1. Checks out the code
2. Creates `.env.dev` and `.env.db.dev` from the example files
3. Builds and starts the Docker containers (`make build`)
4. Waits for the app container to be ready
5. Creates the test database (`make test-db-setup`)
6. Runs all tests — unit then integration (`make test-ci`)

`make test-ci` is identical to `make test-all` but omits the `-it` flag, which is required because GitHub Actions runners have no TTY.

---

## 📐 Code Quality

### ESLint

Strict TypeScript rules via `typescript-eslint/recommendedTypeChecked`, plus:

- `eslint-plugin-import` + `simple-import-sort` — sorted, clean imports
- `eslint-plugin-security` — catches unsafe patterns
- `eslint-plugin-promise` — promise best practices
- `eslint-plugin-n` — Node.js safety rules
- `no-restricted-properties` on `process.env` — forces all env access through `src/config/env-config.ts`

### Prettier

Auto-formatting on save (VSCode) and enforced on commit via lint-staged.

### Husky + lint-staged

Pre-commit hook runs ESLint + Prettier on all staged `.ts` files. Bad commits are blocked automatically.

---

## 🔒 Security

| Measure               | Implementation                                                        |
| --------------------- | --------------------------------------------------------------------- |
| Rate limiting         | `express-rate-limit` (skipped in test env)                            |
| Host whitelisting     | Custom middleware checks `req.hostname` against `WHITE_LIST_URLS`     |
| Content-Type guard    | All POST/PUT/PATCH require `application/json`                         |
| Password hashing      | `bcryptjs` with 12 salt rounds                                        |
| Refresh token storage | SHA-256 hash only — raw token never stored                            |
| Token rotation        | Old refresh token revoked on every use                                |
| HttpOnly cookie       | Refresh token unreachable from JavaScript                             |
| No stack traces       | Error handler returns only user-safe messages                         |
| Env validation        | Zod schema at startup — missing vars crash early with a clear message |

---

## 🔮 Upcoming Improvements

- [x] **GitHub Actions CI** — unit + integration tests run automatically on every pull request
- [ ] **Helmet** — add `helmet` middleware for standard security headers (HSTS, X-Frame-Options, etc.)
- [ ] **`catchAsync` wrapper** — eliminate try/catch in controllers; async errors forwarded to global error handler automatically
- [ ] **HTTP status code constants** — replace magic numbers with named constants (`HTTP_STATUS.CREATED`, etc.)
- [ ] **Consistent response envelope** — standardise all responses to `{ success, data?, error?: { message, code } }`
- [ ] **Pino logger** — structured JSON logging with `pino-http` for automatic request logging; replace all `console.log/error` calls
- [ ] **`jose` for JWT** — replace `jsonwebtoken` with `jose` (actively maintained, ESM-native, supports JWK sets for secret rotation without redeployment)
- [ ] **Redis-backed rate limiting** — replace in-memory `express-rate-limit` with `rate-limit-redis` for distributed environments
- [ ] **`vitest-mock-extended`** — use for more ergonomic Prisma mocking in unit tests

---

## 📦 Tech Stack

| Category         | Technology                    |
| ---------------- | ----------------------------- |
| Runtime          | Node.js 24+                   |
| Language         | TypeScript 5.9+ (strict mode) |
| Framework        | Express 5                     |
| ORM              | Prisma 7                      |
| Database         | PostgreSQL 16                 |
| Validation       | Zod 4                         |
| Authentication   | JWT (`jsonwebtoken`)          |
| Password hashing | bcryptjs                      |
| Testing          | Vitest 4 + Supertest          |
| Linting          | ESLint 9 + typescript-eslint  |
| Formatting       | Prettier                      |
| Git hooks        | Husky + lint-staged           |
| Containerisation | Docker + Docker Compose       |
| Package manager  | npm                           |

---

If this was useful, consider ⭐ starring the repo.
