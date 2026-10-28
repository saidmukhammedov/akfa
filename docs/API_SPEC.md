# AKFA Workshop API Specification (Phase 1)

Base URL: `http://localhost:4000/api` (Local) / `https://api.yourdomain.com/api` (Production)

## 1. Authentication Endpoints

### `POST /auth/login`
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
    "token": "jwt_token_here",
    "user": {
      "id": "owner-1",
      "username": "admin",
      "fullName": "Alisher Qodirov",
      "workshopName": "AKFA Rom va Eshiklar Tsexi",
      "language": "uz"
    }
  }
  ```

### `GET /auth/profile`
Retrieves authenticated owner profile.
- **Headers**: `Authorization: Bearer <token>`

### `PUT /auth/profile`
Updates owner profile and language preference.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "fullName": "Alisher Qodirov",
    "workshopName": "AKFA Rom va Eshiklar Tsexi",
    "language": "ru"
  }
  ```

---

## 2. Worker Endpoints (Settings module only)

### `GET /workers?status=ACTIVE`
Lists all active or archived workers.

### `POST /workers`
Registers a new worker with agreed daily rate.
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

### `GET /attendance?date=2026-10-28`
Fetches attendance roster for the specified date.

### `POST /attendance/mark`
Marks a single worker's attendance. Snapshots their daily rate.
- **Request Body**:
  ```json
  {
    "workerId": "worker-1",
    "date": "2026-10-28",
    "status": "PRESENT",
    "notes": "Keldi"
  }
  ```

### `POST /attendance/bulk`
Marks attendance for all workers simultaneously.
- **Request Body**:
  ```json
  {
    "date": "2026-10-28",
    "records": [
      { "workerId": "worker-1", "status": "PRESENT" },
      { "workerId": "worker-2", "status": "PRESENT" }
    ]
  }
  ```

---

## 4. Finance Endpoints

### `GET /finance/overview`
Retrieves workshop aggregate totals:
- `totalAccruedSalaries`: Sum of attendance earnings
- `totalPaymentsDistributed`: Sum of recorded payments
- `totalPendingBalance`: Outstanding payroll debt
- `activeWorkerCount`: Count of active craftsmen

### `GET /finance/summaries`
Returns payroll summaries for every worker (days worked, accrued salary, total paid, balance owed).

### `POST /finance/payments`
Records a salary payment or advance (supports partial payments).
- **Request Body**:
  ```json
  {
    "workerId": "worker-1",
    "amount": 500000,
    "paymentDate": "2026-10-28",
    "paymentMethod": "CASH",
    "notes": "Haftalik avans"
  }
  ```

### `GET /finance/payments`
Lists payment transaction history.
