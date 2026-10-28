# AKFA Workshop Management System

Management system for aluminum and PVC window/door manufacturing workshops.

## Phase 2: Production Backend and Database Integration

The application has been upgraded from prototype state to a persistent **PostgreSQL** application (compatible with local PostgreSQL and Neon serverless), backed by **Prisma ORM**, secure JWT authentication with refresh token rotation, decimal-safe monetary arithmetic, and automated integration tests.

---

## Architecture

- **Monorepo**: `pnpm` workspaces
- **Frontend** (`apps/web`): React 18, TypeScript, Vite, Tailwind CSS (tactile claymorphism design system), API client with transparent token refresh rotation
- **Backend API** (`apps/api`): Node.js, Express, TypeScript, Prisma ORM, bcryptjs password hashing, JWT sessions, rate limiting
- **Shared Library** (`packages/shared`): Shared TypeScript contracts, Zod schemas, localized dictionaries (Uzbek Latin default, Russian secondary) & currency/date formatters
- **Database**: PostgreSQL 18 / Neon (with `DATABASE_URL` pooled and `DIRECT_URL` direct connection strings)
- **Deployment Targets**: Vercel for Frontend, Render for API

---

## Getting Started

### Prerequisites

- Node.js >= 20.x (Detected: Node `v25.8.2`)
- pnpm >= 9.x (Detected: pnpm `12.15.0`)
- PostgreSQL (Local or Neon instance)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Copy environment templates and configure database credentials:

```bash
# In apps/api
cp .env.example .env

# In apps/web
cp .env.example .env
```

### 3. Run Prisma Migrations

```bash
# Run versioned migrations on development database
pnpm --filter @akfa/api prisma:migrate

# Or apply migrations on production/test
pnpm --filter @akfa/api prisma:deploy
```

### 4. Build Shared Package & Apps

```bash
pnpm build
```

### 5. Start Development Servers

```bash
# Terminal 1: Web application (http://localhost:5173)
pnpm dev:web

# Terminal 2: API server (http://localhost:4000)
pnpm dev:api
```

---

## Verification Commands & Test Suite

### Run Automated Test Suite (11 Scenarios)
The automated test suite runs against an isolated test database verifying:
- Unauthenticated access rejection (`401`)
- Owner setup & login flow
- Refresh token rotation & session security
- Worker CRUD & soft-archiving
- Concurrency-safe attendance upsert & duplicate prevention
- Historical wage preservation across rate modifications
- Attendance corrections & financial recalculation
- Partial payments & balance calculations
- Validation rejections (`400`) on malformed inputs and negative amounts
- Data persistence across API server restarts

```bash
# Run all workspace tests (shared unit tests + backend integration tests)
pnpm test
```

### Run Typecheck
```bash
pnpm typecheck
```

### Run Full Production Build
```bash
pnpm build
```

---

## Production Security & Domain Rules

1. **Owner-Only Authentication**: Single owner tenant. Unrestricted public registration is blocked; only controlled initial setup via `/api/auth/setup` is allowed when no owner exists.
2. **Token Rotation**: Short-lived JWT access tokens (`15m`) paired with single-use rotating refresh tokens (`7d`). Reuse of revoked refresh tokens immediately invalidates all active sessions for the owner.
3. **Decimal-Safe Financial Calculations**: Daily rates, attendance snapshots, and payments are stored as `Decimal(14, 2)` to eliminate 32-bit integer overflow and floating-point errors.
4. **Attendance Historical Integrity**: Marking attendance captures a permanent rate snapshot. Retroactive rate changes never alter past payroll history.
5. **Non-Destructive Archiving**: Archived workers retain all attendance records and balances (`ON DELETE RESTRICT` foreign keys prevent accidental data deletion).
6. **Rate Limiting**: Authentication endpoints are rate-limited to mitigate brute-force attacks.
