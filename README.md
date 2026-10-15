# ATB Ltd — Healthcare Fintech Platform

**"টাকার অভাবে থামবে না চিকিৎসা"** — _Treatment will not stop due to lack of money._

A complete healthcare financial assistance platform for Bangladesh. ATB Ltd
provides 12,000 BDT in medical bill support to members for eligible hospital
stays.

> **Note:** This is a **monorepo** with backend and frontend in separate app directories.

## Project Structure

```text
atbltd-health/
├── package-lock.json               # ✅ Root workspace lockfile
├── jest.config.js                  # ✅ Root Jest projects (runs backend + frontend suites)
├── apps/
│   ├── backend/                    # NestJS API (port 3000)
│   │   ├── package.json
│   │   ├── jest.config.js          # ✅ Backend test & coverage thresholds
│   │   ├── .env.example            # ✅ Backend env vars
│   │   ├── .eslintrc.js            # ✅ Backend lint config
│   │   ├── .prettierrc             # ✅ Backend prettier
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/           # Authentication & OTP lifecycle
│   │       │   ├── admin/          # Admin dashboard & payment verification
│   │       │   ├── claim/          # Benefit application processing
│   │       │   ├── commission/     # Agent commission engine
│   │       │   ├── agent/          # Owner/Agent management
│   │       │   ├── hospital/       # Hospital partner portal
│   │       │   ├── notification/   # Real-time notifications
│   │       │   └── sms/            # SMS gateway integration
│   │       ├── entities/           # TypeORM entities
│   │       └── common/             # Guards, decorators, sentry filter
│   └── frontend/                   # Next.js 16 App (port 3001)
│       ├── package.json
│       ├── .env.example            # ✅ Frontend env vars
│       ├── eslint.config.mjs       # ✅ Frontend ESLint 9 flat config
│       ├── .prettierrc             # ✅ Frontend prettier
│       ├── jest.config.js          # ✅ Frontend test config & coverage thresholds
│       ├── jest.setup.js           # ✅ Test environment & motion mocks
│       └── app/
│           ├── admin/              # Admin/Owner/Agent dashboard
│           ├── dashboard/          # Member dashboard
│           ├── hospital/           # Hospital portal
│           ├── login/              # Login page
│           ├── components/         # Shared components
│           ├── i18n/               # Bengali/English translations
│           └── lib/                # API helpers & auth context
├── scripts/                        # ✅ Repository automation & operational scripts
│   ├── bootstrap.sh                # ✅ Single-command setup for fresh checkouts
│   └── check-coverage.mjs          # ✅ Numeric coverage gate used by CI
├── docs/                           # ✅ Repository policies & operational documentation
│   ├── branch-protection.md        # ✅ Branch protection policy & CI mapping
│   └── fresh-clone-verification.md # ✅ Clean checkout verification audit
├── base.Dockerfile                 # ✅ Multi-stage workspace Docker build
├── docker-compose.yml              # ✅ Docker Compose configuration
├── docker-compose.test.yml         # ✅ Disposable PostgreSQL for E2E tests
├── .env.example                    # ✅ Root env vars (all variables)
├── .eslintrc.json                  # ✅ Root lint config
├── Dockerfile                      # ✅ Root Dockerfile
├── .github/
│   ├── CODEOWNERS                  # ✅ Code ownership & PR review routing
│   ├── dependabot.yml              # ✅ Automated security dependency updates
│   ├── PULL_REQUEST_TEMPLATE.md    # ✅ PR review template
│   └── workflows/
│       ├── ci.yml                  # ✅ CI: lint, test, typecheck, audit
│       ├── codeql.yml              # ✅ SAST: CodeQL static security analysis
│       └── deploy.yml              # ✅ CD: Docker build & EC2 deploy
├── README.md                       # ✅ This file
├── CHANGELOG.md                    # ✅ Release history
├── CONTRIBUTING.md                 # ✅ Contribution guide
├── SECURITY.md                     # ✅ Security policy & vulnerability reporting
└── MONOREPO.md                     # ✅ Monorepo structure docs
```

## Key Files Location

| File                      | Path                              |
| ------------------------- | --------------------------------- |
| Workspace lockfile        | `package-lock.json`               |
| Backend env example       | `apps/backend/.env.example`       |
| Frontend env example      | `apps/frontend/.env.example`      |
| Root env example          | `.env.example`                    |
| Backend ESLint            | `apps/backend/.eslintrc.js`       |
| Frontend ESLint           | `apps/frontend/eslint.config.mjs` |
| Backend Prettier          | `apps/backend/.prettierrc`        |
| Frontend Prettier         | `apps/frontend/.prettierrc`       |
| Typed API client          | `apps/frontend/app/lib/apiClient.ts` |
| Code Owners               | `.github/CODEOWNERS`              |
| Dependabot config         | `.github/dependabot.yml`          |
| Branch protection docs    | `docs/branch-protection.md`       |
| Clean verification record | `docs/fresh-clone-verification.md`|
| Security policy           | `SECURITY.md`                     |
| Docker (multi-stage)      | `base.Dockerfile`                 |
| Docker (root)             | `Dockerfile`                      |
| Docker Compose            | `docker-compose.yml`              |
| Test Compose (disposable) | `docker-compose.test.yml`         |
| Bootstrap script          | `scripts/bootstrap.sh`            |
| CI workflow               | `.github/workflows/ci.yml`        |
| CodeQL SAST workflow      | `.github/workflows/codeql.yml`    |
| CD workflow               | `.github/workflows/deploy.yml`    |

## Tech Stack

- **Backend:** NestJS, TypeScript, TypeORM, PostgreSQL, Jest
- **Frontend:** Next.js 16, React 19, Tailwind CSS, React Testing Library
- **Infrastructure:** AWS EC2, Docker, Nginx, GitHub Actions
- **Observability:** Prometheus (`@willsoto/nestjs-prometheus`), Sentry
  (`@sentry/node`), `pino-pretty`
- **SMS:** GreenWeb BD Gateway
- **Auth:** JWT with 5-tier role-based access control
- **Validation:** class-validator, class-transformer, Zod

## Prerequisites

- Node.js 22+
- PostgreSQL 16+
- npm 10+

## Quick Start (Automated Bootstrap)

For fresh checkouts, configure environment templates, install workspace dependencies, and run migrations/seeds with a single command:

```bash
git clone https://github.com/rehmanshawon/atbltd-health.git
cd atbltd-health
npm run bootstrap
```

Pass `--fresh` to force reinstalling dependencies via `npm ci`, or `--skip-db` if configuring the database later.

---

## Manual Installation (Step-by-Step)

### 1. Clone the repository

```bash
git clone https://github.com/rehmanshawon/atbltd-health.git
cd atbltd-health
```

### 2. Install Workspace Dependencies

```bash
npm ci  # Installs both workspaces from the root lockfile
```

Backend and frontend direct dependencies are declared in
`apps/backend/package.json` and `apps/frontend/package.json`; the root
`package.json` contains repository-level scripts and tooling. The committed
root lockfile resolves all workspaces.

### 3. Configure Environment Variables

```bash
# Backend
cd apps/backend
cp .env.example .env

# Frontend
cd ../frontend
cp .env.example .env.local
cd ../..
```

Reference `apps/backend/.env.example` and `apps/frontend/.env.example` for the
complete list of variables.

Check workspace dependency advisories with:

```bash
npm audit --workspaces --audit-level=high
```

### 4. Set up the Database

```bash
psql -U postgres -c "CREATE DATABASE atbltd;"
npm run migration:run --workspace=@atbltd-health/backend
```

### 5. Seed Initial Data

```bash
npm run seed
npm run seed:ref
```

## Running Tests

Tests use **Jest**. A fresh clone needs only `npm ci` — no `.env`, Docker, or
database is required for unit tests.

```bash
npm ci
npm test            # root Jest projects: 67 suites / 425 tests (backend + frontend)
```

`npm test` runs `jest` with the root [`jest.config.js`](jest.config.js), which
loads `apps/backend` and `apps/frontend` as Jest projects. `npx jest` works the
same way.

Coverage and the full quality gate:

```bash
npm run test:cov       # per-workspace coverage; Jest exits non-zero below coverageThreshold
npm run coverage:check # numeric gate: compares coverage-summary.json with each jest.config.js
npm run test:ci        # test:cov + coverage:check (exactly what CI runs)
npm run typecheck
npm run lint
npm run build
```

Target individual workspaces:

```bash
npm run test:backend
npm run test:frontend
npm run test:e2e:backend
```

### Isolated Zero-Network Test Run

Run backend unit suites with outbound `fetch` blocked by
`apps/backend/test/unit-network-guard.js`:

```bash
npm run test:isolated
```

| Test files                                  | Needs Docker/Postgres? | External services                     |
| ------------------------------------------- | ---------------------- | ------------------------------------- |
| `apps/backend/src/**/*.spec.ts` (28 suites) | No                     | Repositories, SMS and payment mocked  |
| `apps/frontend/app/**/__tests__/*` (39)     | No                     | API calls mocked; runs in jsdom       |
| `apps/backend/test/*.e2e-spec.ts` (2)       | **Yes**                | Disposable Postgres via compose       |

Only the e2e suites need the disposable test database:

```bash
docker compose -f docker-compose.test.yml up -d --wait
npm run test:e2e:backend
docker compose -f docker-compose.test.yml down -v
```

## Linting & Type Checking

```bash
npm run lint
npm run typecheck
```

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable                 | Description                | Required |
| ------------------------ | -------------------------- | -------- |
| `DB_HOST`                | PostgreSQL host            | Yes      |
| `DB_PORT`                | PostgreSQL port            | Yes      |
| `DB_USERNAME`            | Database username          | Yes      |
| `DB_PASSWORD`            | Database password          | Yes      |
| `DB_DATABASE`            | Database name              | Yes      |
| `DB_SYNCHRONIZE`         | Allow TypeORM schema sync  | No       |
| `DB_MIGRATIONS_RUN`      | Run TypeORM migrations     | No       |
| `JWT_SECRET`             | JWT signing secret         | Yes      |
| `SENTRY_DSN`             | Sentry error tracking DSN  | Optional |
| `SMS_DISABLED`           | Disable outbound SMS calls | No       |
| `GREENWEB_API_TOKEN`     | GreenWeb SMS API token     | Optional |
| `GREENWEB_SENDER_ID`     | SMS sender ID              | Optional |
| `BKASH_MERCHANT_NUMBER`  | bKash merchant number      | Optional |
| `NAGAD_MERCHANT_NUMBER`  | Nagad merchant number      | Optional |
| `ROCKET_MERCHANT_NUMBER` | Rocket merchant number     | Optional |
| `BANK_ACCOUNT`           | Bank account for transfers | Optional |
| `SEED_ADMIN_PASSWORD`    | Seed admin password        | Yes      |
| `SEED_ADMIN2_PASSWORD`   | Seed admin2 password       | Yes      |
| `SEED_OWNER_PASSWORD`    | Seed owner password        | Yes      |
| `SEED_AGENT_PASSWORD`    | Seed agent password        | Yes      |
| `TEST_MEMBER_PASSWORD`   | Seed/test member password  | Yes      |

### Frontend (`apps/frontend/.env.local`)

| Variable              | Description     | Required |
| --------------------- | --------------- | -------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes      |

## Security and Reliability Controls

- CI blocks high and critical vulnerabilities in production dependencies. The
  full dependency audit, including development tools, is also reported so
  upstream advisories remain visible; transient registry failures retry 3x.
- Payment authorization is atomic, checked for idempotency, and guarded against
  race conditions.
- Sentry captures all unhandled 5xx exceptions and operational faults.
- Prometheus exposes application telemetry and runtime metrics.
- Backend Jest enforces minimum 70% coverage for branches, functions, lines, and
  statements. Frontend Jest enforces minimum 70% lines, 70% statements, 60%
  functions, and 55% branches. CI re-checks both numerically with
  `scripts/check-coverage.mjs` and fails the build on any regression.
- Financial approval follows the Maker-Checker workflow.
- Production deploys require passing CI and automated post-deploy health validation.

## Architecture

### Role Hierarchy

```text
SUPER_ADMIN → ADMIN → OWNER → AGENT → MEMBER
```

### Maker-Checker Approval Flow

- **Admin** = Maker (initial review)
- **Super Admin** = Checker (final verification & authorization)
- Items move sequentially from Admin queue to SA queue
- All financial operations require dual control
- Every action produces an audit log

## API Documentation

Base URL: `https://api.atbltd.health/api`

### Observability & Health

- `GET /api/health` — Service health status
- `GET /api/metrics` — Prometheus telemetry & runtime metrics

### Authentication

- `POST /api/auth/login` — Staff login (ID + password)
- `POST /api/auth/member-login` — Member login (ID only)
- `POST /api/auth/register` — Member registration
- `GET /api/auth/profile` — Get profile

### Benefits (Claims)

- `GET /api/claims` — List applications (admin)
- `POST /api/claims` — Submit application (member)
- `GET /api/claims/mine` — Get own applications
- `PUT /api/claims/:id/status` — Update status (Maker-Checker)
- `POST /api/claims/:id/documents/upload` — Upload documents

### Admin & Payments

- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/payments` — Payment list
- `POST /api/admin/payments/:id/verify` — Verify payment (Maker-Checker)

### Notifications

- `GET /api/notifications` — Get notifications
- `PUT /api/notifications/:id/read` — Mark as read
- `PUT /api/notifications/mark-all-read` — Mark all read

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

Proprietary — Sustho Thaki BD Ltd. All rights reserved.
