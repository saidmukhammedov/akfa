import assert from 'node:assert';
import { createApp } from '../dist/app.js';
import { prisma } from '../dist/services/prisma.js';

const TEST_PORT = 4004;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function cleanDatabase() {
  await prisma.voiceAuditLog.deleteMany();
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
  console.log('>>> STARTING UZBEK VOICE COMMAND MODULE (V1) AUTOMATED TEST SUITE <<<\n');

  const server = await startServer(TEST_PORT);
  console.log(`[Test Server] Started on port ${TEST_PORT}`);

  try {
    await cleanDatabase();
    console.log('[Test DB] Cleaned all tables in test database.');

    // -------------------------------------------------------------------------
    // TEST 1: Authentication & Protection on Voice Endpoints
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Unauthenticated Access Rejection ---');
    const unauthRes = await fetch(`${BASE_URL}/voice/history`);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated GET /voice/history must return 401');
    const unauthBody = await unauthRes.json();
    assert.strictEqual(unauthBody.success, false);
    console.log('✓ Unauthenticated request to /voice/history rejected with 401');

    const unauthPost = await fetch(`${BASE_URL}/voice/parse-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Salom' }),
    });
    assert.strictEqual(unauthPost.status, 401, 'Unauthenticated POST /voice/parse-text must return 401');
    console.log('✓ Unauthenticated request to /voice/parse-text rejected with 401');

    // -------------------------------------------------------------------------
    // SETUP: Create Workshop Owner & Workers
    // -------------------------------------------------------------------------
    console.log('\n--- Setting up Owner & Workers ---');
    const setupRes = await fetch(`${BASE_URL}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'bekzod_voice',
        password: 'password123',
        fullName: 'Bekzod Voice Admin',
        workshopName: 'AKFA Voice Workshop',
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

    // Create 3 Workers: Jamshid (Usta), Sherzod (Shogird), and Azizbek
    const createWorker = async (name, role, dailyRate, ratePerM2) => {
      const res = await fetch(`${BASE_URL}/workers`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name, role, dailyRate, ratePerM2 }),
      });
      assert.strictEqual(res.status, 201);
      const json = await res.json();
      return json.data;
    };

    const workerJamshid = await createWorker('Jamshid Usta', 'usta', 150000, 20000);
    const workerSherzod = await createWorker('Sherzod Aliyev', 'shogird', 100000, 15000);
    const workerAzizbek = await createWorker('Azizbek Karimov', 'usta', 180000, 25000);
    console.log(`✓ Created 3 test workers: ${workerJamshid.name}, ${workerSherzod.name}, ${workerAzizbek.name}`);

    // -------------------------------------------------------------------------
    // TEST 2: Uzbek Volume Voice Command Parsing ("record_volume")
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Volume Command Parsing ---');
    const volumeParseRes = await fetch(`${BASE_URL}/voice/parse-text`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Bugun Jamshid 25 kvadrat, Sherzod 18 kvadrat ishladi.',
        date: '2026-11-03',
      }),
    });
    assert.strictEqual(volumeParseRes.status, 200);
    const volumeParseData = await volumeParseRes.json();
    console.log('VOLUME PARSE DATA:', JSON.stringify(volumeParseData, null, 2));
    assert.strictEqual(volumeParseData.success, true);
    assert.strictEqual(volumeParseData.data.intent, 'record_volume');
    assert.strictEqual(volumeParseData.data.requiresConfirmation, true);
    assert.ok(volumeParseData.data.confirmationToken, 'Must generate confirmation token');
    assert.ok(Array.isArray(volumeParseData.data.items), 'items must be an array');
    assert.strictEqual(volumeParseData.data.items.length, 2);

    const [vol1, vol2] = volumeParseData.data.items;
    assert.strictEqual(vol1.workerName, 'Jamshid Usta');
    assert.strictEqual(vol1.details.squareMeters, 25);
    assert.strictEqual(vol1.details.rateSnapshot, 20000);
    assert.strictEqual(vol1.details.totalAmount, 25 * 20000);

    assert.strictEqual(vol2.workerName, 'Sherzod Aliyev');
    assert.strictEqual(vol2.details.squareMeters, 18);
    assert.strictEqual(vol2.details.rateSnapshot, 15000);
    assert.strictEqual(vol2.details.totalAmount, 18 * 15000);
    console.log(`✓ Parsed volume command with exact worker matches & calculated amounts: 25m² * 20,000 = ${vol1.details.totalAmount}, 18m² * 15,000 = ${vol2.details.totalAmount}`);

    // -------------------------------------------------------------------------
    // TEST 3: Confirmation Workflow & Idempotency
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Confirmation Workflow & Idempotency ---');
    const token1 = volumeParseData.data.confirmationToken;
    const confirmRes = await fetch(`${BASE_URL}/voice/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        confirmationToken: token1,
        decision: 'CONFIRM',
      }),
    });
    assert.strictEqual(confirmRes.status, 200);
    const confirmData = await confirmRes.json();
    assert.strictEqual(confirmData.success, true);
    assert.strictEqual(confirmData.data.affectedCount, 2);
    console.log('✓ Volume command confirmed and 2 volume records saved to database.');

    // Verify records exist in volume module
    const volListRes = await fetch(`${BASE_URL}/volumes?date=2026-11-03`, {
      headers: authHeaders,
    });
    assert.strictEqual(volListRes.status, 200);
    const volListData = await volListRes.json();
    assert.strictEqual(volListData.data.length, 2);
    console.log('✓ Database verified: exactly 2 volume records exist for 2026-11-03');

    // Test Idempotency: Repeating confirmation with the same token MUST be rejected
    const repeatConfirm = await fetch(`${BASE_URL}/voice/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        confirmationToken: token1,
        decision: 'CONFIRM',
      }),
    });
    assert.strictEqual(repeatConfirm.status, 400, 'Duplicate confirmation must return 400 Bad Request');
    console.log('✓ Idempotency verified: duplicate confirmation rejected');

    // -------------------------------------------------------------------------
    // TEST 4: Uzbek Attendance Voice Command Parsing ("record_attendance")
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Attendance Command Parsing ---');
    const attParseRes = await fetch(`${BASE_URL}/voice/parse-text`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Bugun Jamshid va Sherzod keldi, Azizbek kelmadi.',
        date: '2026-11-03',
      }),
    });
    assert.strictEqual(attParseRes.status, 200);
    const attParseData = await attParseRes.json();
    assert.strictEqual(attParseData.success, true);
    assert.strictEqual(attParseData.data.intent, 'record_attendance');
    assert.strictEqual(attParseData.data.items.length, 3);

    const attJamshid = attParseData.data.items.find((w) => w.workerName.includes('Jamshid'));
    const attSherzod = attParseData.data.items.find((w) => w.workerName.includes('Sherzod'));
    const attAzizbek = attParseData.data.items.find((w) => w.workerName.includes('Azizbek'));

    assert.strictEqual(attJamshid.details.status, 'PRESENT');
    assert.strictEqual(attSherzod.details.status, 'PRESENT');
    assert.strictEqual(attAzizbek.details.status, 'ABSENT');
    console.log('✓ Parsed attendance correctly: Jamshid (PRESENT), Sherzod (PRESENT), Azizbek (ABSENT)');

    // Confirm attendance
    const confirmAtt = await fetch(`${BASE_URL}/voice/confirm`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        confirmationToken: attParseData.data.confirmationToken,
        decision: 'CONFIRM',
      }),
    });
    assert.strictEqual(confirmAtt.status, 200);
    const confirmAttData = await confirmAtt.json();
    assert.strictEqual(confirmAttData.data.affectedCount, 3);
    console.log('✓ Attendance command confirmed and 3 attendance records created.');

    // -------------------------------------------------------------------------
    // TEST 5: Uzbek Written Numbers & Suffixes
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Uzbek Word Numbers & Suffixes ---');
    const wordNumParse = await fetch(`${BASE_URL}/voice/parse-text`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Azizbekka o‘ttiz besh yarim kvadrat yozing.',
        date: '2026-11-03',
      }),
    });
    assert.strictEqual(wordNumParse.status, 200);
    const wordNumData = await wordNumParse.json();
    assert.strictEqual(wordNumData.data.intent, 'record_volume');
    const azizEntry = wordNumData.data.items[0];
    assert.strictEqual(azizEntry.workerName, 'Azizbek Karimov');
    assert.strictEqual(azizEntry.details.squareMeters, 35.5, 'Must parse "o\'ttiz besh yarim" to 35.5');
    console.log('✓ Successfully resolved Uzbek suffix "Azizbekka" -> Azizbek Karimov and number "o‘ttiz besh yarim" -> 35.5');

    // -------------------------------------------------------------------------
    // TEST 6: Read-Only Report Queries (Instant execution, no confirmation)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Read-Only Voice Report Queries ---');
    // Daily report
    const dailyReportRes = await fetch(`${BASE_URL}/voice/parse-text`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Bugungi kunlik hisobotni ko‘rsat',
        date: '2026-11-03',
      }),
    });
    assert.strictEqual(dailyReportRes.status, 200);
    const dailyReportData = await dailyReportRes.json();
    assert.strictEqual(dailyReportData.data.intent, 'get_daily_report');
    assert.strictEqual(dailyReportData.data.requiresConfirmation, false);
    assert.ok(dailyReportData.data.report, 'Report data must be present immediately');
    assert.strictEqual(dailyReportData.data.report.type, 'DAILY_REPORT');
    assert.strictEqual(dailyReportData.data.report.data.presentCount, 2);
    assert.strictEqual(dailyReportData.data.report.data.absentCount, 1);
    console.log('✓ Daily report query returned instant report without confirmation');

    // Monthly volume report
    const volReportRes = await fetch(`${BASE_URL}/voice/parse-text`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Shu oyda qancha obyom bo‘ldi? Obyom hisoboti',
        date: '2026-11-03',
      }),
    });
    assert.strictEqual(volReportRes.status, 200);
    const volReportData = await volReportRes.json();
    assert.strictEqual(volReportData.data.intent, 'get_volume_report');
    assert.strictEqual(volReportData.data.requiresConfirmation, false);
    assert.strictEqual(volReportData.data.report.type, 'VOLUME_REPORT');
    assert.ok(volReportData.data.report.data.totalSquareMeters >= 43);
    console.log(`✓ Volume report query returned total m²: ${volReportData.data.report.data.totalSquareMeters}`);

    // Worker salary report
    const salaryReportRes = await fetch(`${BASE_URL}/voice/parse-text`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Jamshidning oylik maoshi qancha bo‘ldi?',
        date: '2026-11-03',
      }),
    });
    assert.strictEqual(salaryReportRes.status, 200);
    const salaryReportData = await salaryReportRes.json();
    assert.strictEqual(salaryReportData.data.intent, 'get_worker_salary');
    assert.strictEqual(salaryReportData.data.requiresConfirmation, false);
    assert.strictEqual(salaryReportData.data.report.type, 'WORKER_SALARY');
    assert.ok(salaryReportData.data.report.data.workerName.includes('Jamshid'));
    console.log(`✓ Worker salary report query resolved Jamshid with total calculated earnings: ${salaryReportData.data.report.data.totalEarned}`);

    // -------------------------------------------------------------------------
    // TEST 7: Ambiguous Worker Resolution & Missing Information
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Ambiguous Worker & Missing Info ---');
    // Create another "Aziz..." worker to trigger ambiguity with Azizbek
    await createWorker('Azizulloh Samadov', 'shogird', 90000, 12000);

    const ambigRes = await fetch(`${BASE_URL}/voice/parse-text`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Aziz bugun 20 kvadrat qildi',
        date: '2026-11-03',
      }),
    });
    assert.strictEqual(ambigRes.status, 200);
    const ambigData = await ambigRes.json();
    assert.strictEqual(ambigData.data.needsClarification, true, 'Must detect ambiguity between Azizbek and Azizulloh');
    assert.ok(ambigData.data.clarificationMessage, 'Must provide clarification prompt');
    console.log(`✓ Ambiguity detected: "${ambigData.data.clarificationMessage}"`);

    // -------------------------------------------------------------------------
    // TEST 8: Audio Processing with Mock STT Provider
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Audio Upload Endpoint ---');
    // Send a sample base64 payload to /voice/process-audio
    const dummyAudioBase64 = Buffer.from('RIFF....WAVEfmt....data....').toString('base64');
    const audioRes = await fetch(`${BASE_URL}/voice/process-audio`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        audioBase64: dummyAudioBase64,
        mimeType: 'audio/webm',
      }),
    });
    assert.strictEqual(audioRes.status, 200);
    const audioData = await audioRes.json();
    assert.strictEqual(audioData.success, true);
    assert.ok(audioData.data.transcript, 'Audio response must contain transcribed text');
    console.log(`✓ Audio processing succeeded with transcript: "${audioData.data.transcript}"`);

    // -------------------------------------------------------------------------
    // TEST 9: Voice Audit Logs
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing Voice Audit History ---');
    const historyRes = await fetch(`${BASE_URL}/voice/history`, {
      headers: authHeaders,
    });
    assert.strictEqual(historyRes.status, 200);
    const historyData = await historyRes.json();
    assert.strictEqual(historyData.success, true);
    assert.ok(historyData.data.length >= 5, 'History must contain logs of voice actions');
    console.log(`✓ Voice audit history contains ${historyData.data.length} recorded events`);

    console.log('\n======================================================');
    console.log('>>> ALL UZBEK VOICE COMMAND TESTS PASSED (100%) <<<');
    console.log('======================================================\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
