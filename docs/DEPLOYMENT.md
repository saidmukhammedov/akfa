# AKFA Workshop Management System — Production Deployment Guide (Phase 2)

This guide documents the production deployment architecture for the AKFA Workshop Management System using **Neon PostgreSQL**, **Render** (Node.js API), and **Vercel** (React Web Client).

---

## 1. Neon PostgreSQL Database Provisioning

Neon provides serverless PostgreSQL with built-in connection pooling via PgBouncer.

### 1.1. Provisioning Steps
1. Log in to [Neon Console](https://console.neon.tech/) and create a project (e.g. `akfa-workshop-prod`).
2. Select your closest AWS region (e.g. `eu-central-1` or `us-east-2`).
3. Neon provides two connection strings in the dashboard:
   - **Pooled connection string** (ends with `-pooler`):
     ```
     postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require
     ```
   - **Direct connection string** (without `-pooler`):
     ```
     postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require
     ```

### 1.2. Why Direct vs Pooled URLs Matter in Prisma
- `DATABASE_URL` (Pooled): Used by the API server at runtime to handle thousands of concurrent queries without exhausting database connection limits.
- `DIRECT_URL` (Direct): Used exclusively by Prisma during migrations (`prisma migrate deploy`), because PgBouncer does not support prepared statements and transactional DDL locks required for migrations.

Our `apps/api/prisma/schema.prisma` is configured for this:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 2. Safe Migration Execution

Never run destructive schema commands (`db push --force-reset`) against staging or production environments.

### 2.1. Versioned Production Migrations
Production migrations must strictly execute versioned SQL migrations generated in `prisma/migrations/`:

```bash
# Execute pending migrations safely on production
npx prisma migrate deploy
```

### 2.2. Pre-deployment Checklist
- [x] Check database connectivity using `DIRECT_URL`.
- [x] Run `npx prisma migrate status` to inspect migration divergence.
- [x] Apply migrations using `npx prisma migrate deploy`.
- [x] Verify table constraints: `UNIQUE(workerId, date)`, `ON DELETE RESTRICT` for workers with history.

---

## 3. Backend Deployment on Render

### 3.1. Service Settings
- **Service Type**: Web Service
- **Environment**: Node
- **Root Directory**: `.` (or `apps/api`)
- **Build Command**: `pnpm install && pnpm build:shared && pnpm --filter @akfa/api build`
- **Start Command**: `pnpm --filter @akfa/api start`

### 3.2. Render Environment Variables
| Variable | Value / Notes |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render default) |
| `CLIENT_URL` | `https://your-akfa-frontend.vercel.app` |
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string |
| `JWT_SECRET` | 64-character random hexadecimal string |
| `JWT_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | `7` |
| `INITIAL_OWNER_USERNAME` | Production owner username (e.g. `admin`) |
| `INITIAL_OWNER_PASSWORD` | Strong password (hashed on first startup) |
| `INITIAL_OWNER_FULLNAME` | Owner full name |
| `INITIAL_WORKSHOP_NAME` | Name of workshop |

---

## 4. Frontend Deployment on Vercel

### 4.1. Project Settings
- **Framework Preset**: Vite
- **Root Directory**: `apps/web`
- **Build Command**: `pnpm --filter @akfa/shared build && pnpm --filter @akfa/web build`
- **Output Directory**: `dist`

### 4.2. Vercel Environment Variables
| Variable | Value / Notes |
|---|---|
| `VITE_API_URL` | `https://your-api.onrender.com/api` |
| `VITE_DEFAULT_LANGUAGE` | `uz` |

---

## 5. Security Safeguards

1. **Owner-Only Isolation**: Unrestricted public owner registration is blocked. Once an owner exists, `/api/auth/setup` rejects further attempts with `403 Forbidden`.
2. **Brute Force Protection**: `/api/auth/*` is guarded with rate limiting (20 requests per 15 minutes).
3. **Data Preservation**: Worker archiving never drops records (`ON DELETE RESTRICT` foreign key guarantees).
4. **Token Rotation**: Refresh tokens are single-use; reusing a revoked token immediately revokes all sessions.
