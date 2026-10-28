import { createApp } from './dist/app.js';

const app = createApp();
const server = app.listen(4001, async () => {
  console.log('[Test Server] Listening on port 4001');

  try {
    // 1. Health check
    const healthRes = await fetch('http://localhost:4001/api/health');
    const health = await healthRes.json();
    console.log('✓ Health check:', health.status);

    // 2. Auth profile
    const profileRes = await fetch('http://localhost:4001/api/auth/profile', {
      headers: { Authorization: 'Bearer dev-token' }
    });
    const profile = await profileRes.json();
    console.log('✓ Owner profile retrieved:', profile.data.fullName, `(${profile.data.workshopName})`);

    // 3. Workers list
    const workersRes = await fetch('http://localhost:4001/api/workers', {
      headers: { Authorization: 'Bearer dev-token' }
    });
    const workers = await workersRes.json();
    console.log('✓ Workers list retrieved:', workers.data.length, 'workers found');

    // 4. Attendance list
    const attRes = await fetch('http://localhost:4001/api/attendance?date=2026-10-28', {
      headers: { Authorization: 'Bearer dev-token' }
    });
    const att = await attRes.json();
    console.log('✓ Attendance query:', att.data.presentCount, 'present,', att.data.absentCount, 'absent');

    // 5. Finance overview
    const finRes = await fetch('http://localhost:4001/api/finance/overview', {
      headers: { Authorization: 'Bearer dev-token' }
    });
    const fin = await finRes.json();
    console.log('✓ Finance overview:', fin.data.totalAccruedSalaries, "so'm accrued,", fin.data.totalPendingBalance, "so'm pending debt");

    console.log('\n>>> ALL ENDPOINT CHECKS PASSED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      console.log('[Test Server] Closed');
    });
  }
});
