import assert from 'node:assert';
import { createApp } from '../dist/app.js';
import { prisma } from '../dist/services/prisma.js';

const TEST_PORT = 4003;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function cleanDatabase() {
  await prisma.volumeRecord.deleteMany();
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
  console.log('>>> STARTING VOLUME-BASED EARNINGS (m²) MODULE AUTOMATED TEST SUITE <<<\n');

  const server = await startServer(TEST_PORT);
  console.log(`[Test Server] Started on port ${TEST_PORT}`);

  try {
    await cleanDatabase();
    console.log('[Test DB] Cleaned all tables in test database.');

    // -------------------------------------------------------------------------
    // TEST 1: Authentication & Protection on Volume Endpoints
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Unauthenticated Access Rejection ---');
    const unauthRes = await fetch(`${BASE_URL}/volumes`);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated GET /volumes must return 401');
    const unauthBody = await unauthRes.json();
    assert.strictEqual(unauthBody.success, false);
    console.log('✓ Unauthenticated request to /volumes rejected with 401 Unauthorized');

    // Setup Owner
    const setupRes = await fetch(`${BASE_URL}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'password123',
        fullName: 'Alisher Qodirov',
        workshopName: 'AKFA Test Workshop',
        language: 'uz',
      }),
    });
    assert.strictEqual(setupRes.status, 201);
    const setupData = await setupRes.json();
    const token = setupData.data.accessToken;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    console.log('✓ Owner authenticated and obtained JWT token');

    // -------------------------------------------------------------------------
    // TEST 2: Worker Creation with Configurable ratePerM2
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Worker Creation with Configurable ratePerM2 ---');
    const workerRes = await fetch(`${BASE_URL}/workers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Usta Rustam',
        phone: '+998 90 111 22 33',
        role: 'usta',
        dailyRate: 200000,
        ratePerM2: 15000, // 15 000 UZS / m²
      }),
    });
    assert.strictEqual(workerRes.status, 201);
    const workerData = await workerRes.json();
    const workerId = workerData.data.id;
    assert.strictEqual(workerData.data.ratePerM2, 15000);
    assert.strictEqual(workerData.data.dailyRate, 200000);
    console.log('✓ Worker created with dailyRate 200 000 and ratePerM2 15 000 so\'m');

    // Existing worker compatibility: worker created without ratePerM2 defaults to 0
    const worker2Res = await fetch(`${BASE_URL}/workers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Shogird Elyor',
        role: 'shogird',
        dailyRate: 100000,
      }),
    });
    assert.strictEqual(worker2Res.status, 201);
    const worker2Data = await worker2Res.json();
    const worker2Id = worker2Data.data.id;
    assert.strictEqual(worker2Data.data.ratePerM2, 0, 'Existing/unspecified ratePerM2 must default to 0');
    console.log('✓ Compatibility check: worker created without ratePerM2 defaults to 0');

    // -------------------------------------------------------------------------
    // TEST 3: Validation of Negative Rates and Zero/Negative Quantities
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Validation (Negative Rates, Zero/Negative m²) ---');
    const invalidRateWorker = await fetch(`${BASE_URL}/workers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Invalid Rate',
        role: 'usta',
        dailyRate: 100000,
        ratePerM2: -5000,
      }),
    });
    assert.strictEqual(invalidRateWorker.status, 400, 'Negative ratePerM2 must be rejected with 400');
    console.log('✓ Worker creation with negative ratePerM2 rejected');

    const invalidM2Res = await fetch(`${BASE_URL}/volumes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        workerId,
        date: '2026-11-03',
        squareMeters: 0,
      }),
    });
    assert.strictEqual(invalidM2Res.status, 400, 'Zero square meters must be rejected with 400');

    const negativeM2Res = await fetch(`${BASE_URL}/volumes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        workerId,
        date: '2026-11-03',
        squareMeters: -10,
      }),
    });
    assert.strictEqual(negativeM2Res.status, 400, 'Negative square meters must be rejected with 400');
    console.log('✓ Volume creation with zero or negative m² rejected');

    // -------------------------------------------------------------------------
    // TEST 4: Daily Volume Recording & Automatic Backend Calculation
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Daily Volume Entry & Calculation ---');
    // Decimal value: 12.5 m² at 15 000 so'm/m² = 187 500 so'm
    const vol1Res = await fetch(`${BASE_URL}/volumes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        workerId,
        date: '2026-11-03',
        squareMeters: 12.5,
        notes: '1-bino alyuminiy romlar',
      }),
    });
    assert.strictEqual(vol1Res.status, 201);
    const vol1Data = await vol1Res.json();
    const vol1Id = vol1Data.data.id;
    assert.strictEqual(vol1Data.data.squareMeters, 12.5);
    assert.strictEqual(vol1Data.data.rateSnapshot, 15000);
    assert.strictEqual(vol1Data.data.totalAmount, 187500, '12.5 * 15000 = 187500');
    assert.strictEqual(vol1Data.data.workerName, 'Usta Rustam');
    console.log('✓ Volume entry 1 created: 12.5 m² × 15 000 so\'m = 187 500 so\'m');

    // -------------------------------------------------------------------------
    // TEST 5: Multiple Entries for Same Worker on Same Day
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Multiple Entries for Same Worker on Same Day ---');
    // Second entry on same day: 8.25 m² at custom rate 16 000 so'm/m² = 132 000 so'm
    const vol2Res = await fetch(`${BASE_URL}/volumes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        workerId,
        date: '2026-11-03',
        squareMeters: 8.25,
        rateSnapshot: 16000,
        notes: '2-bino maxsus vitraj',
      }),
    });
    assert.strictEqual(vol2Res.status, 201, 'Multiple volume entries on same day must succeed');
    const vol2Data = await vol2Res.json();
    assert.strictEqual(vol2Data.data.squareMeters, 8.25);
    assert.strictEqual(vol2Data.data.rateSnapshot, 16000);
    assert.strictEqual(vol2Data.data.totalAmount, 132000, '8.25 * 16000 = 132000');
    console.log('✓ Volume entry 2 created on same day: 8.25 m² × 16 000 so\'m = 132 000 so\'m');

    // Verify both entries exist for date 2026-11-03
    const listRes = await fetch(`${BASE_URL}/volumes?date=2026-11-03`, { headers: authHeaders });
    const listData = await listRes.json();
    assert.strictEqual(listData.data.length, 2);
    console.log('✓ Successfully retrieved 2 volume records for 2026-11-03');

    // -------------------------------------------------------------------------
    // TEST 6: Historical Rate Snapshot Immutability
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Historical Rate Snapshot Immutability ---');
    // Update worker's current ratePerM2 to 25 000
    await fetch(`${BASE_URL}/workers/${workerId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ ratePerM2: 25000 }),
    });

    // Check that historical volume record 1 rateSnapshot and totalAmount remain unchanged
    const checkVol1 = await fetch(`${BASE_URL}/volumes/${vol1Id}`, { headers: authHeaders });
    const checkVol1Data = await checkVol1.json();
    assert.strictEqual(checkVol1Data.data.rateSnapshot, 15000, 'Historical snapshot must not change');
    assert.strictEqual(checkVol1Data.data.totalAmount, 187500, 'Historical totalAmount must not change');
    console.log('✓ Worker ratePerM2 updated to 25 000, but past volume record remained at 15 000 / 187 500');

    // -------------------------------------------------------------------------
    // TEST 7: Editing and Deleting Volume Entries
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Volume Editing and Deleting ---');
    // Edit entry 1 to 10 m²
    const editRes = await fetch(`${BASE_URL}/volumes/${vol1Id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ squareMeters: 10 }),
    });
    assert.strictEqual(editRes.status, 200);
    const editData = await editRes.json();
    assert.strictEqual(editData.data.squareMeters, 10);
    assert.strictEqual(editData.data.totalAmount, 150000, '10 * 15000 = 150000');
    console.log('✓ Volume entry edited: new totalAmount accurately recalculated to 150 000 so\'m');

    // Delete entry 2
    const delRes = await fetch(`${BASE_URL}/volumes/${vol2Data.data.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.strictEqual(delRes.status, 200);

    const checkDel = await fetch(`${BASE_URL}/volumes/${vol2Data.data.id}`, { headers: authHeaders });
    assert.strictEqual(checkDel.status, 404);
    console.log('✓ Volume entry 2 successfully deleted and returned 404 on subsequent lookup');

    // Re-create an entry for worker2: 20 m² at 10 000 so'm = 200 000 so'm
    await fetch(`${BASE_URL}/volumes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        workerId: worker2Id,
        date: '2026-11-03',
        squareMeters: 20,
        rateSnapshot: 10000,
      }),
    });
    console.log('✓ Volume record created for Worker 2 (20 m² × 10 000 = 200 000 so\'m)');

    // -------------------------------------------------------------------------
    // TEST 8: Finance Integration — Total Earnings = Base Salary + Volume Earnings
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Finance Integration (Base Salary + Volume Earnings) ---');
    // Mark attendance for Worker 1 on 2026-11-03 (dailyRate = 200 000)
    await fetch(`${BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        workerId,
        date: '2026-11-03',
        status: 'PRESENT',
        rateSnapshot: 200000,
      }),
    });
    console.log('✓ Attendance recorded for Worker 1: Base wage = 200 000 so\'m');

    // Now Worker 1 has:
    // Base salary: 200 000 so'm
    // Volume earnings: 150 000 so'm (from edited entry 1: 10 m² * 15000)
    // Combined Total Accrued: 350 000 so'm

    const summariesRes = await fetch(`${BASE_URL}/finance/summaries`, { headers: authHeaders });
    const summariesData = await summariesRes.json();
    const w1Summary = summariesData.data.find((s) => s.workerId === workerId);
    assert.ok(w1Summary, 'Worker 1 must be present in summaries');
    assert.strictEqual(w1Summary.baseSalary, 200000, 'Base salary must be 200 000');
    assert.strictEqual(w1Summary.volumeEarnings, 150000, 'Volume earnings must be 150 000');
    assert.strictEqual(w1Summary.totalAccruedSalary, 350000, 'Total accrued must be 200 000 + 150 000 = 350 000');
    assert.strictEqual(w1Summary.volumeM2, 10, 'Total volume m² must be 10');
    assert.strictEqual(w1Summary.balanceOwed, 350000, 'No payments yet; balanceOwed must be 350 000');
    console.log('✓ Worker 1 finance summary verified: Base (200k) + Volume (150k) = Total (350k)');

    // Worker 2 has:
    // Base salary: 0 (no attendance)
    // Volume earnings: 200 000 so'm (20 m² * 10000)
    // Total Accrued: 200 000 so'm
    const w2Summary = summariesData.data.find((s) => s.workerId === worker2Id);
    assert.strictEqual(w2Summary.baseSalary, 0);
    assert.strictEqual(w2Summary.volumeEarnings, 200000);
    assert.strictEqual(w2Summary.totalAccruedSalary, 200000);
    assert.strictEqual(w2Summary.balanceOwed, 200000);
    console.log('✓ Worker 2 finance summary verified: Base (0) + Volume (200k) = Total (200k)');

    // Check Workshop Overview
    const overviewRes = await fetch(`${BASE_URL}/finance/overview`, { headers: authHeaders });
    const overviewData = await overviewRes.json();
    assert.strictEqual(overviewData.data.totalBaseSalaries, 200000);
    assert.strictEqual(overviewData.data.totalVolumeEarnings, 350000); // 150k + 200k
    assert.strictEqual(overviewData.data.totalVolumeM2, 30); // 10 + 20
    assert.strictEqual(overviewData.data.totalAccruedSalaries, 550000); // 200k base + 350k volume
    assert.strictEqual(overviewData.data.totalPendingBalance, 550000);
    console.log('✓ Workshop Overview verified: Total Accrued = 550 000 so\'m (200k base + 350k volume)');

    // -------------------------------------------------------------------------
    // TEST 9: Payment Deduction and Recalculation with Volume Earnings
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing Payment Deduction against Combined Earnings ---');
    // Pay 150 000 so'm to Worker 1
    await fetch(`${BASE_URL}/finance/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        workerId,
        amount: 150000,
        paymentDate: '2026-11-03',
        paymentMethod: 'CASH',
        notes: 'Avans to\'lovi',
      }),
    });

    const w1DetailsRes = await fetch(`${BASE_URL}/finance/workers/${workerId}`, { headers: authHeaders });
    const w1Details = await w1DetailsRes.json();
    assert.strictEqual(w1Details.data.totalAccruedSalary, 350000);
    assert.strictEqual(w1Details.data.totalPaid, 150000);
    assert.strictEqual(w1Details.data.balanceOwed, 200000, '350 000 - 150 000 = 200 000 so\'m');
    assert.strictEqual(w1Details.data.volumes.length, 1);
    console.log('✓ Payment of 150 000 so\'m recorded; balance owed accurately reduced to 200 000 so\'m');

    // -------------------------------------------------------------------------
    // TEST 10: Volume Overview Reporting Endpoint
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Testing Volume Overview & Reporting Aggregations ---');
    const volOverviewRes = await fetch(`${BASE_URL}/volumes/overview?date=2026-11-03`, { headers: authHeaders });
    const volOverviewData = await volOverviewRes.json();
    assert.strictEqual(volOverviewData.data.overview.todaySquareMeters, 30);
    assert.strictEqual(volOverviewData.data.overview.todayEarnings, 350000);
    assert.strictEqual(volOverviewData.data.workerSummaries.length, 2);
    console.log('✓ Volume Overview reporting endpoint verified with today and monthly totals');

    console.log('\n======================================================');
    console.log('🎉 ALL 10 VOLUME-BASED EARNINGS TEST SCENARIOS PASSED! 🎉');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
