# AKFA Workshop Management System — Phase 1

Management system for aluminum and PVC window/door manufacturing workshops.

## Architecture

- **Monorepo**: `pnpm` workspaces
- **Frontend** (`apps/web`): React 18, TypeScript, Vite, Tailwind CSS (custom restrained claymorphism design system)
- **Backend API** (`apps/api`): Node.js, Express, TypeScript, Prisma ORM
- **Shared Library** (`packages/shared`): Shared TypeScript types, Zod validation schemas, localized dictionaries & currency/date formatters
- **Database**: PostgreSQL with Neon serverless driver support
- **Hosting Targets**: Vercel for Frontend, Render for API, Capacitor Android packaging in later phase

---

## Getting Started

### Prerequisites

- Node.js >= 20.x (Detected: Node v25.8.2)
- pnpm >= 9.x (Detected: pnpm 12.15.0)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Shared Package

```bash
pnpm build:shared
```

### 3. Start Development Servers

Run both web and API simultaneously:
```bash
pnpm dev
```

Or run individually in separate terminals:
```bash
# Terminal 1: Web application (http://localhost:5173)
pnpm dev:web

# Terminal 2: API server (http://localhost:4000)
pnpm dev:api
```

---

## Verification Commands

Run full workspace typechecking:
```bash
pnpm typecheck
```

Build all packages and apps:
```bash
pnpm build
```

---

## Product Modules in Phase 1

1. **Dashboard (Boshqaruv)**:
   - High-contrast KPI cards (Today's attendance, Active workers, Accrued salaries, Total paid, Outstanding balance).
   - Real-time attendance snapshot with status indicators.
   - Recent payment activity stream.

2. **Davomat (Attendance Journal)**:
   - Quick tactile attendance marking (Hozir / Yo'q) with instant feedback.
   - Bulk "Mark All Present" action.
   - Historical daily rate snapshotting to ensure retroactive payroll accuracy.
   - Date picker (Bugun, Kecha, custom calendar date).
   - Optional worker attendance notes.

3. **Moliya (Finances & Payroll)**:
   - Worker payroll ledger driven strictly by attendance and rate snapshots.
   - Independent partial payment recording (Cash, Card, Bank Transfer).
   - Balance owed calculation (Accrued - Paid).
   - Payment history journal.

4. **Sozlamalar (Settings & Worker Management)**:
   - Worker management is **strictly confined** to Sozlamalar.
   - Adding and editing craftsmen (roles: Usta, Shogird, Yordamchi, O'rnatuvchi, Boshqa).
   - Non-destructive worker archiving (preserves all attendance and financial records).
   - Owner profile settings (Workshop name, Owner name, Password).
   - Language preference persistence (O'zbekcha / Русский).

---

## Phase 1 Deliverables Status

- [x] Documented monorepo structure (`pnpm-workspace.yaml`, `apps/`, `packages/`, `docs/`)
- [x] Working responsive application shell with navigation and language switching
- [x] Custom restrained minimal & claymorphic design tokens and reusable UI primitives
- [x] Shared validation schemas (Zod) and type conventions
- [x] Database schema (`prisma/schema.prisma`) and API architecture documentation
- [x] Environment variable templates without secrets (`.env.example`)
- [x] Development README with verification commands
