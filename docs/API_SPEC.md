# AKFA Workshop API Specification (Phase 2 — Production Integration)

Base URL: `http://localhost:4000/api` (Local) / `https://api.yourdomain.com/api` (Production)

## 1. Authentication Endpoints

### `GET /auth/status`
Checks if the initial owner account has been set up.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "isInitialized": true
  }
  ```

### `POST /auth/setup` (Rate-limited)
Initial single-owner creation. Only available when `isInitialized === false`. Rejects subsequent calls with `403 Forbidden`.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "akfa_secure_password_2026",
    "fullName": "Alisher Qodirov",
    "workshopName": "AKFA Rom va Eshiklar Tsexi",
    "language": "uz"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "4a7c29...",
      "owner": { ... }
    }
  }
  ```

### `POST /auth/login` (Rate-limited)
Authenticates the workshop owner.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "akfa_secure_password_2026"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "4a7c29...",
      "user": {
        "id": "c1f7b029...",
        "username": "admin",
        "fullName": "Alisher Qodirov",
        "workshopName": "AKFA Rom va Eshiklar Tsexi",
        "language": "uz"
      }
    }
  }
  ```

### `POST /auth/refresh`
Exchanges a valid refresh token for a newly rotated access token + refresh token pair.
- **Request Body**:
  ```json
  { "refreshToken": "4a7c29..." }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "new_jwt_here",
      "refreshToken": "new_rotated_refresh_token_here",
      "owner": { ... }
    }
  }
  ```

### `POST /auth/logout`
Revokes active session refresh token in database.
- **Request Body**:
  ```json
  { "refreshToken": "4a7c29..." }
  ```

### `GET /auth/profile`
Retrieves authenticated owner profile.
- **Headers**: `Authorization: Bearer <accessToken>`

### `PUT /auth/profile`
Updates owner profile, language preference, and optionally changes password.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "fullName": "Alisher Qodirov",
    "workshopName": "AKFA Rom va Eshiklar Tsexi",
    "language": "ru",
    "currentPassword": "old_password",
    "newPassword": "new_secure_password"
  }
  ```

---

## 2. Worker Endpoints (Settings module only)

All routes require `Authorization: Bearer <accessToken>`.

### `GET /workers?status=ACTIVE`
Lists workers with optional status filter (`ACTIVE` | `ARCHIVED`).

### `POST /workers`
Registers a new worker with agreed daily rate in UZS.
- **Request Body**:
  ```json
  {
    "name": "Sardor Aliyev",
    "phone": "+998 90 123 45 67",
    "role": "usta",
    "dailyRate": 250000
  }
  ```

### `PUT /workers/:id`
Updates worker information or daily rate.

### `POST /workers/:id/archive`
Safely archives worker without deleting attendance or financial history.

### `POST /workers/:id/unarchive`
Restores worker to active status.

---

## 3. Attendance Endpoints

All routes require `Authorization: Bearer <accessToken>`.

### `GET /attendance?date=YYYY-MM-DD`
Fetches roster of all active workers for specified date, including marked status and rate snapshot.

### `POST /attendance/mark`
Atomic upsert of worker attendance for a date. Snapshots worker daily rate into `rateSnapshot`.
- **Request Body**:
  ```json
  {
    "workerId": "worker-uuid",
    "date": "2026-10-28",
    "status": "PRESENT",
    "notes": "Keldi"
  }
  ```

### `POST /attendance/bulk`
Marks attendance for all workers in a single database transaction.

---

## 4. Finance Endpoints

All routes require `Authorization: Bearer <accessToken>`.

### `GET /finance/overview`
Retrieves workshop aggregate totals calculated with decimal precision:
- `totalAccruedSalaries`: Sum of attendance earnings (`PRESENT` records * `rateSnapshot`)
- `totalPaymentsDistributed`: Sum of recorded payments
- `totalPendingBalance`: Outstanding payroll debt
- `activeWorkerCount`: Count of active craftsmen

### `GET /finance/summaries`
Returns payroll summaries for every worker (days worked, accrued salary, total paid, balance owed).

### `GET /finance/workers/:workerId`
Returns complete attendance and payment ledger for a specific worker.

### `POST /finance/payments`
Records a salary payment or advance in database transaction (supports partial payments).
- **Request Body**:
  ```json
  {
    "workerId": "worker-uuid",
    "amount": 500000,
    "paymentDate": "2026-10-28",
    "paymentMethod": "CASH",
    "notes": "Haftalik avans"
  }
  ```

### `GET /finance/payments`
Lists payment transaction history.
