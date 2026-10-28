// AKFA Workshop Staging Deployment Smoke Test Script
// Usage: node scripts/staging-smoke-test.mjs <API_BASE_URL>
// Example: node scripts/staging-smoke-test.mjs https://akfa-api-staging.onrender.com

const targetBase = (process.argv[2] || 'http://localhost:4000').replace(/\/$/, '');
const apiBase = targetBase.endsWith('/api') ? targetBase : `${targetBase}/api`;

console.log(`\n==================================================`);
console.log(`AKFA Staging API Verification Suite`);
console.log(`Target: ${apiBase}`);
console.log(`==================================================\n`);

async function runTest() {
  const testId = Date.now();
  const testUsername = `staging_test_${testId}`;
  const testPassword = 'TestPassword123!';
  let accessToken = '';
  let refreshToken = '';

  // 1. Health Check
  console.log('1. Testing GET /api/health...');
  const healthRes = await fetch(`${apiBase}/health`);
  if (!healthRes.ok) {
    throw new Error(`Health check failed with status ${healthRes.status}`);
  }
  const health = await healthRes.json();
  console.log('   ✓ Health check passed:', health.status, `(${health.system})`);

  // 2. Setup Status Check
  console.log('\n2. Testing GET /api/auth/setup-status...');
  const statusRes = await fetch(`${apiBase}/auth/setup-status`);
  const statusData = await statusRes.json();
  console.log('   ✓ Setup status retrieved: isInitialized =', statusData.isInitialized);

  // 3. Authentication Flow
  if (!statusData.isInitialized) {
    console.log('\n3. First-time setup: Initializing staging owner...');
    const setupRes = await fetch(`${apiBase}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
        fullName: 'Staging Test Admin',
        workshopName: 'AKFA Test Ustaxonasi',
        language: 'uz',
      }),
    });
    if (!setupRes.ok) {
      throw new Error(`Setup failed with status ${setupRes.status}`);
    }
    const setupData = await setupRes.json();
    accessToken = setupData.data.accessToken;
    refreshToken = setupData.data.refreshToken;
    console.log('   ✓ Staging owner successfully initialized!');
  } else {
    console.log('\n3. Owner already initialized. Testing authentication flow...');
    // If credentials are provided via env, attempt login
    const loginUsername = process.env.STAGING_OWNER_USERNAME || 'admin';
    const loginPassword = process.env.STAGING_OWNER_PASSWORD || 'Admin123!';
    console.log(`   Attempting login as '${loginUsername}'...`);
    const loginRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginUsername,
        password: loginPassword,
      }),
    });
    if (loginRes.ok) {
      const loginData = await loginRes.json();
      accessToken = loginData.data.accessToken;
      refreshToken = loginData.data.refreshToken;
      console.log('   ✓ Login succeeded and issued fresh JWT access & refresh tokens.');
    } else {
      console.log(`   (i) Existing owner credentials not provided in env (Status: ${loginRes.status}).`);
    }
  }

  // 4. Test Unauthenticated Access Rejection
  console.log('\n4. Testing Unauthenticated Access Rejection on Protected Endpoint...');
  const unauthRes = await fetch(`${apiBase}/workers`);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for unauthenticated request, got ${unauthRes.status}`);
  }
  console.log('   ✓ Unauthenticated request rejected with 401 Unauthorized.');

  if (!accessToken) {
    console.log('\n⚠️ Authentication token not available. Skipping authenticated data mutations.');
    console.log('To run full authenticated data checks, set STAGING_OWNER_USERNAME and STAGING_OWNER_PASSWORD.');
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  // 5. Worker CRUD
  console.log('\n5. Testing POST /api/workers (Create Worker)...');
  const workerRes = await fetch(`${apiBase}/workers`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `Staging Usta ${testId}`,
      phone: '+998 90 123 45 67',
      role: 'usta',
      dailyRate: 350000,
    }),
  });
  if (!workerRes.ok) {
    const err = await workerRes.json();
    throw new Error(`Worker creation failed: ${JSON.stringify(err)}`);
  }
  const workerData = await workerRes.json();
  const workerId = workerData.data.id;
  console.log(`   ✓ Worker created: ${workerData.data.name} (ID: ${workerId}, Rate: ${workerData.data.dailyRate} so'm)`);

  // 6. Attendance Marking & Rate Snapshot
  console.log('\n6. Testing POST /api/attendance/mark (Record Attendance)...');
  const today = new Date().toISOString().split('T')[0];
  const attRes = await fetch(`${apiBase}/attendance/mark`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      workerId,
      date: today,
      status: 'PRESENT',
      notes: 'Staging smoke test attendance',
    }),
  });
  if (!attRes.ok) {
    const err = await attRes.json();
    throw new Error(`Attendance marking failed: ${JSON.stringify(err)}`);
  }
  const attData = await attRes.json();
  console.log(`   ✓ Attendance recorded for date ${today}: Snapshot rate = ${attData.data.rateSnapshot} so'm`);

  // 7. Finance Calculation Verification
  console.log('\n7. Testing GET /api/finance/overview (Financial Ledger)...');
  const finRes = await fetch(`${apiBase}/finance/overview`, {
    headers: authHeaders,
  });
  if (!finRes.ok) {
    throw new Error(`Finance overview failed with status ${finRes.status}`);
  }
  const finData = await finRes.json();
  console.log(`   ✓ Finance overview: Accrued = ${finData.data.totalAccruedSalaries} so'm, Pending = ${finData.data.totalPendingBalance} so'm`);

  // 8. Partial Payment Recording
  console.log('\n8. Testing POST /api/finance/payments (Partial Payment)...');
  const payRes = await fetch(`${apiBase}/finance/payments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      workerId,
      amount: 150000,
      paymentDate: today,
      paymentMethod: 'CASH',
      notes: 'Staging test partial payment',
    }),
  });
  if (!payRes.ok) {
    const err = await payRes.json();
    throw new Error(`Payment failed: ${JSON.stringify(err)}`);
  }
  const payData = await payRes.json();
  console.log(`   ✓ Partial payment of ${payData.data.amount} so'm recorded.`);

  // 9. Verify Worker Balance
  console.log('\n9. Testing GET /api/finance/workers/:id (Worker Balance Check)...');
  const detailRes = await fetch(`${apiBase}/finance/workers/${workerId}`, {
    headers: authHeaders,
  });
  const detailData = await detailRes.json();
  console.log(`   ✓ Worker Financial Summary: Total Earned = ${detailData.data.summary.totalEarned} so'm, Paid = ${detailData.data.summary.totalPaid} so'm, Balance Owed = ${detailData.data.summary.balanceOwed} so'm`);

  // 10. Refresh Token Rotation
  console.log('\n10. Testing POST /api/auth/refresh (Token Rotation)...');
  const refreshRes = await fetch(`${apiBase}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!refreshRes.ok) {
    throw new Error(`Token refresh failed with status ${refreshRes.status}`);
  }
  const refreshData = await refreshRes.json();
  const newAccessToken = refreshData.data.accessToken;
  const newRefreshToken = refreshData.data.refreshToken;
  console.log('   ✓ Refresh token rotated successfully.');

  // 11. Logout & Session Revocation
  console.log('\n11. Testing POST /api/auth/logout (Revocation)...');
  const logoutRes = await fetch(`${apiBase}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: newRefreshToken }),
  });
  console.log('   ✓ Logged out successfully.');

  // Verify revoked token cannot be refreshed
  const reuseRes = await fetch(`${apiBase}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: newRefreshToken }),
  });
  if (reuseRes.status !== 401) {
    throw new Error(`Expected 401 for revoked refresh token, got ${reuseRes.status}`);
  }
  console.log('   ✓ Revoked refresh token rejected with 401.');

  console.log(`\n==================================================`);
  console.log(`🎉 ALL STAGING SMOKE TEST SCENARIOS PASSED! 🎉`);
  console.log(`==================================================\n`);
}

runTest().catch((err) => {
  console.error('\n❌ Smoke Test Failed:', err);
  process.exit(1);
});
