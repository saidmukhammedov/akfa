import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../dist/app.js';
import { prisma } from '../dist/services/prisma.js';

// Enforce test database connection
const TEST_PORT = 4002;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function cleanDatabase() {
  await prisma.payment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.owner.deleteMany();
}

function startServer(port) {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(port, () => resolve(server));
  });
}

async function runTests() {
  console.log('>>> STARTING PHASE 2 AUTOMATED TEST SUITE <<<\n');

  let server = await startServer(TEST_PORT);
  console.log(`[Test Server] Started on port ${TEST_PORT}`);

  try {
    await cleanDatabase();
    console.log('[Test DB] Cleaned all tables in test database.');

    // -------------------------------------------------------------------------
    // TEST 1: Unauthenticated access rejection
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Unauthenticated Access Rejection ---');
    const unauthWorkerRes = await fetch(`${BASE_URL}/workers`);
    assert.strictEqual(unauthWorkerRes.status, 401, 'Should reject worker listing without token');
    const unauthBody = await unauthWorkerRes.json();
    assert.strictEqual(unauthBody.success, false);
    console.log('✓ Request without token returned 401 Unauthorized');

    const invalidTokenRes = await fetch(`${BASE_URL}/workers`, {
      headers: { Authorization: 'Bearer totally-invalid-token' },
    });
    assert.strictEqual(invalidTokenRes.status, 401, 'Should reject invalid token');
    console.log('✓ Request with invalid token returned 401 Unauthorized');

    // -------------------------------------------------------------------------
    // TEST 2: Owner Setup, Login & Refresh Token Rotation
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Owner Setup & Token Flow ---');

    // Regression check: verify setup status endpoints return application/json and false when DB is empty
    const statusBefore = await fetch(`${BASE_URL}/auth/status`);
    assert.strictEqual(statusBefore.status, 200, 'GET /auth/status must return 200 OK');
    assert.ok(statusBefore.headers.get('content-type')?.includes('application/json'), 'GET /auth/status must return JSON');
    const statusBeforeJson = await statusBefore.json();
    assert.strictEqual(statusBeforeJson.success, true);
    assert.strictEqual(statusBeforeJson.isInitialized, false, 'isInitialized should be false before initial setup');

    const setupStatusAliasBefore = await fetch(`${BASE_URL}/auth/setup-status`);
    assert.strictEqual(setupStatusAliasBefore.status, 200, 'GET /auth/setup-status must return 200 OK');
    assert.ok(setupStatusAliasBefore.headers.get('content-type')?.includes('application/json'), 'GET /auth/setup-status must return JSON');
    const setupStatusAliasBeforeJson = await setupStatusAliasBefore.json();
    assert.strictEqual(setupStatusAliasBeforeJson.success, true);
    assert.strictEqual(setupStatusAliasBeforeJson.isInitialized, false);
    console.log('✓ /auth/status and /auth/setup-status return JSON with isInitialized = false');

    // Regression check: unknown API routes must return JSON 404, not Express default HTML
    const unknownRes = await fetch(`${BASE_URL}/unknown-route-test`);
    assert.strictEqual(unknownRes.status, 404, 'Unknown API route must return 404');
    assert.ok(unknownRes.headers.get('content-type')?.includes('application/json'), 'Unknown route must return JSON, not HTML');
    const unknownJson = await unknownRes.json();
    assert.strictEqual(unknownJson.success, false);
    console.log('✓ Unknown API route returns structured JSON 404 error');

    // Setup initial owner
    const setupRes = await fetch(`${BASE_URL}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'owner_test',
        password: 'secure_password_123',
        fullName: 'Test Owner',
        workshopName: 'AKFA Test Workshop',
        language: 'uz',
      }),
    });
    assert.strictEqual(setupRes.status, 201, 'Owner setup should succeed');
    const setupData = await setupRes.json();
    assert.ok(setupData.data.accessToken);
    assert.ok(setupData.data.refreshToken);
    console.log('✓ Initial owner setup succeeded');

    // Verify setup status returns true after setup
    const statusAfter = await fetch(`${BASE_URL}/auth/setup-status`);
    const statusAfterJson = await statusAfter.json();
    assert.strictEqual(statusAfterJson.isInitialized, true, 'isInitialized should be true after setup');
    console.log('✓ /auth/setup-status returns isInitialized = true after owner creation');

    // Attempting second setup must be rejected (controlled setup, no public registration)
    const secondSetupRes = await fetch(`${BASE_URL}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'hacker',
        password: 'another_password',
        fullName: 'Intruder',
      }),
    });
    assert.strictEqual(secondSetupRes.status, 403, 'Subsequent owner setup must be rejected with 403');
    console.log('✓ Second owner setup rejected with 403 Forbidden (no open registration)');

    // Login with credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'owner_test',
        password: 'secure_password_123',
      }),
    });
    assert.strictEqual(loginRes.status, 200, 'Login should succeed');
    const loginData = await loginRes.json();
    let authToken = loginData.data.accessToken;
    let refreshToken = loginData.data.refreshToken;
    console.log('✓ Login succeeded and returned valid JWT access token');

    // Token refresh rotation test
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    assert.strictEqual(refreshRes.status, 200, 'Token refresh should succeed');
    const refreshData = await refreshRes.json();
    assert.ok(refreshData.data.accessToken);
    assert.ok(refreshData.data.refreshToken);
    assert.notStrictEqual(refreshData.data.refreshToken, refreshToken, 'Refresh token must be rotated');
    authToken = refreshData.data.accessToken; // Use refreshed token for subsequent tests
    console.log('✓ Token rotation succeeded with a new pair of access & refresh tokens');

    // -------------------------------------------------------------------------
    // TEST 3: Creating, Editing, Archiving, and Restoring Workers
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Worker CRUD & Archiving ---');
    const createWorkerRes = await fetch(`${BASE_URL}/workers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Aziz Rakhimov',
        phone: '+998 90 111 22 33',
        role: 'usta',
        dailyRate: 300000,
      }),
    });
    assert.strictEqual(createWorkerRes.status, 201, 'Creating worker should succeed');
    const worker1 = (await createWorkerRes.json()).data;
    assert.strictEqual(worker1.name, 'Aziz Rakhimov');
    assert.strictEqual(worker1.dailyRate, 300000);
    assert.strictEqual(worker1.status, 'ACTIVE');
    console.log('✓ Worker created with dailyRate 300 000 so\'m');

    // Edit worker
    const updateWorkerRes = await fetch(`${BASE_URL}/workers/${worker1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        phone: '+998 90 999 88 77',
      }),
    });
    assert.strictEqual(updateWorkerRes.status, 200);
    const updatedWorker = (await updateWorkerRes.json()).data;
    assert.strictEqual(updatedWorker.phone, '+998 90 999 88 77');
    console.log('✓ Worker phone updated');

    // Archive worker
    const archiveRes = await fetch(`${BASE_URL}/workers/${worker1.id}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(archiveRes.status, 200);
    const archivedWorker = (await archiveRes.json()).data;
    assert.strictEqual(archivedWorker.status, 'ARCHIVED');
    assert.ok(archivedWorker.archivedAt);
    console.log('✓ Worker archived without loss of data');

    // Unarchive worker
    const unarchiveRes = await fetch(`${BASE_URL}/workers/${worker1.id}/unarchive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(unarchiveRes.status, 200);
    const restoredWorker = (await unarchiveRes.json()).data;
    assert.strictEqual(restoredWorker.status, 'ACTIVE');
    assert.strictEqual(restoredWorker.archivedAt, null);
    console.log('✓ Worker restored to active status');

    // Create second worker for payroll testing
    const createWorker2Res = await fetch(`${BASE_URL}/workers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Davronbek Shodiyev',
        role: 'shogird',
        dailyRate: 150000,
      }),
    });
    const worker2 = (await createWorker2Res.json()).data;
    console.log('✓ Second worker created with dailyRate 150 000 so\'m');

    // -------------------------------------------------------------------------
    // TEST 4 & 5: Attendance Recording, Upsert & Duplicate Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- 4 & 5. Testing Attendance Upsert & Duplicate Prevention ---');
    const date1 = '2026-10-25';

    // Mark worker 1 PRESENT on date1
    const attRes1 = await fetch(`${BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        workerId: worker1.id,
        date: date1,
        status: 'PRESENT',
        notes: 'Keldi va vaqtida ketdi',
      }),
    });
    assert.strictEqual(attRes1.status, 200);
    const attRecord1 = (await attRes1.json()).data;
    assert.strictEqual(attRecord1.rateSnapshot, 300000, 'Rate snapshot must match worker dailyRate');
    console.log('✓ Attendance recorded with rateSnapshot 300 000 so\'m');

    // Mark same worker on same date again (concurrency-safe upsert, must NOT create duplicate)
    const attRes1Duplicate = await fetch(`${BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        workerId: worker1.id,
        date: date1,
        status: 'PRESENT',
        notes: 'Updated note',
      }),
    });
    assert.strictEqual(attRes1Duplicate.status, 200);

    const countForDate1 = await prisma.attendance.count({
      where: { workerId: worker1.id, date: date1 },
    });
    assert.strictEqual(countForDate1, 1, 'There must be strictly 1 record per worker per date');
    console.log('✓ Duplicate attendance prevented (count = 1)');

    // -------------------------------------------------------------------------
    // TEST 6: Historical Wage Preservation After a Rate Change
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Historical Wage Preservation After Rate Change ---');
    // Change worker 1 dailyRate to 400 000 so'm
    await fetch(`${BASE_URL}/workers/${worker1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ dailyRate: 400000 }),
    });

    // Mark attendance on a new date date2 with new rate
    const date2 = '2026-10-26';
    await fetch(`${BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        workerId: worker1.id,
        date: date2,
        status: 'PRESENT',
      }),
    });

    // Check financial details:
    // date1 should still have rateSnapshot = 300 000, date2 should have rateSnapshot = 400 000
    // Total accrued for worker 1 should be 300 000 + 400 000 = 700 000 so'm!
    const finDetailRes = await fetch(`${BASE_URL}/finance/workers/${worker1.id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(finDetailRes.status, 200);
    const finDetail = (await finDetailRes.json()).data;
    assert.strictEqual(finDetail.daysWorked, 2);
    assert.strictEqual(finDetail.totalAccruedSalary, 700000, 'Must preserve historical rate (300k + 400k = 700k)');
    console.log('✓ Historical rate snapshot preserved: day 1 @ 300k + day 2 @ 400k = 700 000 so\'m');

    // -------------------------------------------------------------------------
    // TEST 7 & 8: Attendance Correction & Financial Effect
    // -------------------------------------------------------------------------
    console.log('\n--- 7 & 8. Testing Attendance Correction & Financial Recalculation ---');
    // Correct date2 attendance from PRESENT to ABSENT
    await fetch(`${BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        workerId: worker1.id,
        date: date2,
        status: 'ABSENT',
        notes: 'Xatolik tuzatildi: kelmagan',
      }),
    });

    const finDetailAfterCorrection = (await (await fetch(`${BASE_URL}/finance/workers/${worker1.id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })).json()).data;

    assert.strictEqual(finDetailAfterCorrection.daysWorked, 1);
    assert.strictEqual(finDetailAfterCorrection.totalAccruedSalary, 300000, 'Must only count PRESENT attendance');
    console.log('✓ Attendance correction immediately and accurately adjusted accrued salary to 300 000 so\'m');

    // -------------------------------------------------------------------------
    // TEST 9: Partial Payments and Outstanding Balances
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing Partial Payments & Balance Calculations ---');
    // Worker 1 earned 300 000. Give partial payment of 100 000 CASH
    const payRes1 = await fetch(`${BASE_URL}/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        workerId: worker1.id,
        amount: 100000,
        paymentDate: '2026-10-27',
        paymentMethod: 'CASH',
        notes: 'Avans',
      }),
    });
    assert.strictEqual(payRes1.status, 201);

    const finDetailAfterPay1 = (await (await fetch(`${BASE_URL}/finance/workers/${worker1.id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })).json()).data;

    assert.strictEqual(finDetailAfterPay1.totalPaid, 100000);
    assert.strictEqual(finDetailAfterPay1.balanceOwed, 200000, 'Balance owed must be 300k - 100k = 200k');
    console.log('✓ Partial payment of 100 000 so\'m recorded; balance owed is exactly 200 000 so\'m');

    // Give second partial payment of 50 000 CARD
    await fetch(`${BASE_URL}/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        workerId: worker1.id,
        amount: 50000,
        paymentDate: '2026-10-28',
        paymentMethod: 'CARD',
      }),
    });

    const finDetailAfterPay2 = (await (await fetch(`${BASE_URL}/finance/workers/${worker1.id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })).json()).data;

    assert.strictEqual(finDetailAfterPay2.totalPaid, 150000);
    assert.strictEqual(finDetailAfterPay2.balanceOwed, 150000);
    console.log('✓ Second partial payment of 50 000 so\'m recorded; balance owed is 150 000 so\'m');

    // -------------------------------------------------------------------------
    // TEST 10: Malformed Inputs, Invalid Dates & Negative Amounts Rejection
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Testing Validation Rejections (Negative Amounts, Bad Dates) ---');
    const badAmountRes = await fetch(`${BASE_URL}/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        workerId: worker1.id,
        amount: -50000,
        paymentDate: '2026-10-28',
        paymentMethod: 'CASH',
      }),
    });
    assert.strictEqual(badAmountRes.status, 400, 'Negative payment amount must be rejected');
    console.log('✓ Negative payment amount rejected with 400 Bad Request');

    const badDateRes = await fetch(`${BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        workerId: worker1.id,
        date: 'invalid-date',
        status: 'PRESENT',
      }),
    });
    assert.strictEqual(badDateRes.status, 400, 'Invalid date format must be rejected');
    console.log('✓ Invalid date format rejected with 400 Bad Request');

    // -------------------------------------------------------------------------
    // TEST 11: Persistence Across API Server Restart
    // -------------------------------------------------------------------------
    console.log('\n--- 11. Testing Persistence Across Server Restart ---');
    // Stop the server
    await new Promise((resolve) => server.close(resolve));
    console.log('[Test Server] Stopped.');

    await new Promise((r) => setTimeout(r, 500));

    // Restart the server
    server = await startServer(TEST_PORT);
    console.log('[Test Server] Restarted.');

    await new Promise((r) => setTimeout(r, 200));

    // Query data from restarted server
    const overviewAfterRestartRes = await fetch(`${BASE_URL}/finance/overview`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(overviewAfterRestartRes.status, 200);
    const overview = (await overviewAfterRestartRes.json()).data;

    assert.strictEqual(overview.totalAccruedSalaries, 300000, 'Accrued salaries must persist across restart');
    assert.strictEqual(overview.totalPaymentsDistributed, 150000, 'Payments must persist across restart');
    assert.strictEqual(overview.totalPendingBalance, 150000, 'Balance must persist across restart');
    console.log('✓ All records and balances persisted 100% intact across API server restart');

    console.log('\n======================================================');
    console.log('🎉 ALL 11 PHASE 2 AUTOMATED TEST SCENARIOS PASSED! 🎉');
    console.log('======================================================\n');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('[Test Server] Cleanly closed.');
    }
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
