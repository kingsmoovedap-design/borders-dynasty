const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n=== BORDERS DYNASTY LOGISTICS INTEGRITY TEST ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${err.message}`);
      failed++;
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  await test('Health endpoint returns OK', async () => {
    const res = await request('GET', '/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'ok', 'Expected status ok');
    assert(res.body.service === 'Borders Dynasty API', 'Wrong service name');
  });

  await test('Create load with valid data', async () => {
    const res = await request('POST', '/loads', { origin: 'Chicago', destination: 'Miami' });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.origin === 'Chicago', 'Origin mismatch');
    assert(res.body.destination === 'Miami', 'Destination mismatch');
    assert(res.body.status === 'CREATED', 'Status should be CREATED');
    assert(res.body.id, 'Missing load ID');
    assert(res.body.createdAt, 'Missing createdAt timestamp');
  });

  await test('Create load fails without origin', async () => {
    const res = await request('POST', '/loads', { destination: 'Miami' });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.error, 'Expected error message');
  });

  await test('Create load fails without destination', async () => {
    const res = await request('POST', '/loads', { origin: 'Chicago' });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('List all loads returns array', async () => {
    const res = await request('GET', '/loads');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body), 'Expected array');
    assert(res.body.length > 0, 'Expected at least one load');
  });

  let testLoadId;
  await test('Create second load for testing', async () => {
    const res = await request('POST', '/loads', { origin: 'New York', destination: 'Boston' });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    testLoadId = res.body.id;
  });

  await test('Get load by ID returns correct load', async () => {
    const res = await request('GET', `/loads/${testLoadId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.id === testLoadId, 'ID mismatch');
    assert(res.body.origin === 'New York', 'Origin mismatch');
  });

  await test('Get non-existent load returns 404', async () => {
    const res = await request('GET', '/loads/99999');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await test('Mark load as delivered', async () => {
    const res = await request('POST', `/loads/${testLoadId}/delivered`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'DELIVERED', 'Status should be DELIVERED');
    assert(res.body.deliveredAt, 'Missing deliveredAt timestamp');
  });

  await test('Verify load status persists as DELIVERED', async () => {
    const res = await request('GET', `/loads/${testLoadId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'DELIVERED', 'Status should still be DELIVERED');
  });

  await test('Mark non-existent load returns 404', async () => {
    const res = await request('POST', '/loads/99999/delivered');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  console.log('\n=== TEST RESULTS ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);
  console.log(`Status: ${failed === 0 ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
