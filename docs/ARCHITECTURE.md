# AKFA Workshop Management System — Architecture Overview (Phase 1)

## 1. High-Level Architecture

The AKFA workshop management system is structured as a TypeScript monorepo managed with `pnpm` workspaces:

```
akfa/
├── apps/
│   ├── web/               # Frontend: React 18, TypeScript, Vite, Tailwind CSS
│   └── api/               # Backend: Node.js, Express, TypeScript, Prisma ORM
├── packages/
│   └── shared/            # Shared types, Zod schemas, i18n dictionaries & formatters
└── docs/                  # Architecture, Database, and API documentation
```

### Key Technical Decisions

| Layer | Technology | Rationale |
|---|---|---|
| **Monorepo Manager** | `pnpm` workspaces | Fast dependency resolution, hard linking, strict dependency isolation |
| **Frontend Shell** | React 18 + Vite | Sub-millisecond HMR, low bundle footprint, fast startup |
| **Styling** | Tailwind CSS v3 | Custom restrained claymorphism tokens, high tactile feedback |
| **Backend API** | Node.js + Express + TypeScript | Lightweight, predictable runtime, strict type safety |
| **ORM & Database** | Prisma + PostgreSQL (Neon) | Serverless connection pooling, strong schema migrations, type-safe client |
| **Deployment Targets** | Vercel (Web) & Render (API) | Optimized edge delivery for web, long-running Node.js process for API |
| **Mobile Strategy** | Capacitor (Phase 2+) | Android packaging of the responsive web shell without rewriting logic |

---

## 2. Product Domain Rules

1. **Owner-Only Authentication**
   - Single tenant / owner-admin security model.
   - Credentials protected via bcrypt hash in production.
   - Language preferences persisted in owner profile (`uz` default, `ru` secondary).

2. **Strict Worker Isolation**
   - Worker management (adding, modifying daily rate, archiving) is **strictly isolated** to the `Sozlamalar` (Settings) module.
   - Prevents accidental changes during daily workshop operations.

3. **Attendance & Historical Rate Snapshots**
   - Daily attendance is strictly binary: `PRESENT` ("Keldi") or `ABSENT` ("Kelmadi"), with optional notes.
   - Salary calculations are strictly driven by attendance multiplied by the **rate snapshot** captured on that date.
   - Changing a worker's rate today does **not** corrupt previous payroll calculations.

4. **Independent & Partial Payments**
   - Payments are recorded as individual ledger entries (Cash, Card, Bank Transfer).
   - Partial payments are native first-class citizens.
   - Outstanding balance is computed deterministically: `AccruedSalary - TotalPayments`.

5. **Non-Destructive Archiving**
   - Archiving a worker removes them from daily attendance lists while preserving 100% of attendance and financial records.
   - Archived workers can be restored at any time.

---

## 3. Localization Strategy

- **Default Language**: Uzbek Latin (`uz`)
- **Secondary Language**: Russian (`ru`)
- Translations and formatters reside in `@akfa/shared/i18n`.
- Numbers and currencies formatted with Uzbek space-separated thousands:
  - Uzbek: `1 500 000 so'm`
  - Russian: `1 500 000 сум`
- Dates formatted with localized month names and ordinal suffixes.
