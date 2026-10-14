/**
 * Backend Test Script
 * Run: node test-backend.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    const result = await fn();
    if (result.ok) {
      console.log(colors.green(`  ✅ ${name}`));
      passed++;
    } else {
      console.log(colors.red(`  ❌ ${name}`));
      console.log(colors.red(`     → ${result.reason}`));
      failed++;
      failures.push({ name, reason: result.reason });
    }
  } catch (err) {
    console.log(colors.red(`  ❌ ${name}`));
    console.log(colors.red(`     → ${err.message}`));
    failed++;
    failures.push({ name, reason: err.message });
  }
}

async function request(method, path, body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  let data;
  try { data = await res.json(); } catch { data = { raw: await res.text() }; }

  return { status: res.status, data };
}

async function run() {
  console.log(colors.bold(colors.cyan('\n═══════════════════════════════════════════')));
  console.log(colors.bold(colors.cyan('  MyGov Backend Test Suite')));
  console.log(colors.bold(colors.cyan(`  Testing: ${BASE_URL}`)));
  console.log(colors.bold(colors.cyan('═══════════════════════════════════════════\n')));

  let adultToken = null;
  let youthToken = null;
  let officerToken = null;
  const unique = Date.now();

  // 1. HEALTH
  console.log(colors.bold('\n📡 Health Check'));
  await test('GET / returns health JSON', async () => {
    const { status, data } = await request('GET', '/');
    if (status !== 200) return { ok: false, reason: `status ${status}` };
    if (!data.message) return { ok: false, reason: 'no message' };
    return { ok: true };
  });

  // 2. ADULT REGISTER
  console.log(colors.bold('\n👤 Register — Adult (with ID)'));
  const adultId = String(unique).slice(-13).padStart(13, '1');
  const adultEmail = `adult${unique}@test.ls`;

  await test('Register adult with 13-digit ID', async () => {
    const { status, data } = await request('POST', '/api/auth/register', {
      account_type: 'adult',
      full_name: 'Test Adult',
      national_id: adultId,
      email: adultEmail,
      phone: '58000001',
      date_of_birth: '1990-01-15',
      gender: 'Male',
      password: 'test1234',
    });
    if (status !== 201) return { ok: false, reason: `status ${status}: ${data.message || JSON.stringify(data)}` };
    if (!data.token) return { ok: false, reason: 'no token returned' };
    adultToken = data.token;
    return { ok: true };
  });

  await test('Reject adult with wrong ID length', async () => {
    const { status } = await request('POST', '/api/auth/register', {
      account_type: 'adult',
      full_name: 'Bad ID',
      national_id: '123',
      date_of_birth: '1990-01-15',
      gender: 'Male',
      password: 'test1234',
    });
    if (status !== 400) return { ok: false, reason: `expected 400, got ${status}` };
    return { ok: true };
  });

  // 3. YOUTH REGISTER
  console.log(colors.bold('\n🧑 Register — Youth (no ID)'));
  const youthUsername = `youth${unique}`;
  const youthEmail = `youth${unique}@test.ls`;

  await test('Register youth with username', async () => {
    const { status, data } = await request('POST', '/api/auth/register', {
      account_type: 'youth',
      full_name: 'Test Youth',
      username: youthUsername,
      email: youthEmail,
      date_of_birth: '2010-06-20',
      gender: 'Female',
      password: 'test1234',
    });
    if (status !== 201) return { ok: false, reason: `status ${status}: ${data.message || JSON.stringify(data)}` };
    if (!data.token) return { ok: false, reason: 'no token' };
    youthToken = data.token;
    return { ok: true };
  });

  await test('Reject youth without username', async () => {
    const { status } = await request('POST', '/api/auth/register', {
      account_type: 'youth',
      full_name: 'No Username',
      date_of_birth: '2010-01-01',
      gender: 'Male',
      password: 'test1234',
    });
    if (status !== 400) return { ok: false, reason: `expected 400, got ${status}` };
    return { ok: true };
  });

  // 4. LOGIN
  console.log(colors.bold('\n🔐 Login (auto-detect)'));

  await test('Login with National ID', async () => {
    const { status } = await request('POST', '/api/auth/login', {
      identifier: adultId,
      password: 'test1234',
    });
    if (status !== 200) return { ok: false, reason: `status ${status}` };
    return { ok: true };
  });

  await test('Login with username', async () => {
    const { status } = await request('POST', '/api/auth/login', {
      identifier: youthUsername,
      password: 'test1234',
    });
    if (status !== 200) return { ok: false, reason: `status ${status}` };
    return { ok: true };
  });

  await test('Login with email', async () => {
    const { status } = await request('POST', '/api/auth/login', {
      identifier: adultEmail,
      password: 'test1234',
    });
    if (status !== 200) return { ok: false, reason: `status ${status}` };
    return { ok: true };
  });

  await test('Reject wrong password', async () => {
    const { status } = await request('POST', '/api/auth/login', {
      identifier: youthUsername,
      password: 'wrongpass',
    });
    if (status !== 401) return { ok: false, reason: `expected 401, got ${status}` };
    return { ok: true };
  });

  // 5. OFFICER LOGIN
  console.log(colors.bold('\n🏛️  Officer Login'));
  await test('Login as Home Affairs', async () => {
    const { status, data } = await request('POST', '/api/auth/login', {
      identifier: '6000000000001',
      password: 'password123',
    });
    if (status !== 200) return { ok: false, reason: `status ${status}: ${data.message || ''}` };
    if (!data.token) return { ok: false, reason: 'no token' };
    officerToken = data.token;
    return { ok: true };
  });

  // 6. APPLY
  console.log(colors.bold('\n📝 Apply for Services (citizen)'));

  await test('Apply for Birth Certificate', async () => {
    if (!adultToken) return { ok: false, reason: 'no adult token' };
    const { status, data } = await request('POST', '/api/applications', {
      service_type: 'Birth Certificate',
      form_data: {
        subject_full_name: 'Baby Test',
        subject_date_of_birth: '2024-01-01',
        subject_gender: 'Female',
        subject_district: 'Maseru',
        mother_name: 'Test Mother',
      },
    }, adultToken);
    if (status !== 201) return { ok: false, reason: `status ${status}: ${data.message || JSON.stringify(data)}` };
    return { ok: true };
  });

  await test('Apply for National ID Registration', async () => {
    if (!adultToken) return { ok: false, reason: 'no adult token' };
    const { status, data } = await request('POST', '/api/applications', {
      service_type: 'National ID Registration',
      form_data: {
        subject_full_name: 'ID Applicant',
        subject_date_of_birth: '2010-01-01',
        subject_gender: 'Male',
        subject_district: 'Leribe',
      },
    }, adultToken);
    if (status !== 201) return { ok: false, reason: `status ${status}: ${data.message || JSON.stringify(data)}` };
    return { ok: true };
  });

  await test('Apply for Passport Application', async () => {
    if (!adultToken) return { ok: false, reason: 'no adult token' };
    const { status, data } = await request('POST', '/api/applications', {
      service_type: 'Passport Application',
      form_data: {
        subject_full_name: 'Passport Applicant',
        subject_national_id: adultId,
        subject_date_of_birth: '1990-01-15',
      },
    }, adultToken);
    if (status !== 201) return { ok: false, reason: `status ${status}: ${data.message || JSON.stringify(data)}` };
    return { ok: true };
  });

  await test('Apply for Death Certificate', async () => {
    if (!adultToken) return { ok: false, reason: 'no adult token' };
    const { status, data } = await request('POST', '/api/applications', {
      service_type: 'Death Certificate',
      form_data: {
        subject_full_name: 'Deceased Test',
        subject_date_of_birth: '1950-01-01',
        date_of_death: '2024-10-01',
        place_of_death: 'Maseru',
      },
    }, adultToken);
    if (status !== 201) return { ok: false, reason: `status ${status}: ${data.message || JSON.stringify(data)}` };
    return { ok: true };
  });

  // 7. PENSION BLOCK
  console.log(colors.bold('\n💰 Pension Eligibility'));
  await test('Pension blocked for gov employee', async () => {
    if (!officerToken) return { ok: false, reason: 'no officer token' };
    const { status, data } = await request('POST', '/api/applications', {
      service_type: 'Pension Application',
      form_data: { amount: 5000 },
    }, officerToken);
    if (status === 201) return { ok: false, reason: 'gov employee was allowed to apply' };
    return { ok: true };
  });

  // 8. TRACK
  console.log(colors.bold('\n🔍 Track Application'));
  await test('Track by reference (public)', async () => {
    if (!adultToken) return { ok: false, reason: 'no adult token' };
    const listRes = await request('GET', '/api/applications/my', null, adultToken);
    if (listRes.status !== 200) return { ok: false, reason: 'failed to list' };
    const apps = listRes.data;
    if (!Array.isArray(apps) || apps.length === 0) return { ok: false, reason: 'no apps' };
    const ref = apps[0].reference_number;
    const { status, data } = await request('GET', `/api/applications/track/${ref}`);
    if (status !== 200) return { ok: false, reason: `status ${status}` };
    if (!data.reference_number) return { ok: false, reason: 'no reference' };
    return { ok: true };
  });

  // 9. OFFICER QUEUE
  console.log(colors.bold('\n👮 Officer Queue'));

  await test('Home Affairs can view queue', async () => {
    if (!officerToken) return { ok: false, reason: 'no officer token' };
    const { status, data } = await request('GET', '/api/applications/officer/queue', null, officerToken);
    if (status !== 200) return { ok: false, reason: `status ${status}` };
    if (!Array.isArray(data)) return { ok: false, reason: 'not an array' };
    return { ok: true };
  });

  await test('Citizen blocked from officer queue', async () => {
    if (!adultToken) return { ok: false, reason: 'no adult token' };
    const { status } = await request('GET', '/api/applications/officer/queue', null, adultToken);
    if (status === 200) return { ok: false, reason: 'citizen accessed officer queue' };
    return { ok: true };
  });

  // 10. LEGACY
  console.log(colors.bold('\n🔄 Legacy Routes'));

  await test('GET /api/citizen/profile', async () => {
    if (!adultToken) return { ok: false, reason: 'no adult token' };
    const { status } = await request('GET', '/api/citizen/profile', null, adultToken);
    if (status !== 200) return { ok: false, reason: `status ${status}` };
    return { ok: true };
  });

  await test('GET /api/requests/queue (officer)', async () => {
    if (!officerToken) return { ok: false, reason: 'no officer token' };
    const { status } = await request('GET', '/api/requests/queue', null, officerToken);
    if (status !== 200) return { ok: false, reason: `status ${status}` };
    return { ok: true };
  });

  // SUMMARY
  console.log(colors.bold(colors.cyan('\n═══════════════════════════════════════════')));
  console.log(colors.bold(colors.cyan(`  Results: ${passed} passed, ${failed} failed`)));
  console.log(colors.bold(colors.cyan('═══════════════════════════════════════════\n')));

  if (failed > 0) {
    console.log(colors.bold(colors.red('Failed tests:')));
    failures.forEach(f => console.log(colors.red(`  • ${f.name}`)));
    console.log();
    process.exit(1);
  } else {
    console.log(colors.bold(colors.green('🎉 ALL TESTS PASSED\n')));
    process.exit(0);
  }
}

run().catch(err => {
  console.error(colors.red('\n❌ Test runner crashed:'), err);
  process.exit(1);
});