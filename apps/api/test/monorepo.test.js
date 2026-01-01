const http = require('http');

const LOGISTICS_URL = 'http://localhost:3000';
const CODEX_URL = 'http://localhost:3001';

function request(baseUrl, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
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

async function runMonorepoTest() {
  console.log('\n=== BORDERS DYNASTY MONOREPO INTEGRATION TEST ===\n');
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

  console.log('--- Service Health Checks ---\n');

  await test('Logistics API is healthy', async () => {
    const res = await request(LOGISTICS_URL, 'GET', '/health');
    assert(res.status === 200, 'API not healthy');
    assert(res.body.service === 'Borders Dynasty Logistics API', 'Wrong service');
  });

  await test('Codex Ecclesia is healthy', async () => {
    const res = await request(CODEX_URL, 'GET', '/health');
    assert(res.status === 200, 'Codex not healthy');
    assert(res.body.service === 'Codex Ecclesia', 'Wrong service');
  });

  console.log('\n--- FreightEngine Load Creation ---\n');

  let loadId;
  await test('Create load with FreightEngine (UUID generated)', async () => {
    const res = await request(LOGISTICS_URL, 'POST', '/loads', {
      shipperId: 'TEST-SHIPPER',
      origin: 'Chicago, IL',
      destination: 'Miami, FL',
      mode: 'GROUND',
      budgetAmount: 2500
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.id, 'Missing UUID');
    assert(res.body.id.includes('-'), 'ID should be UUID format');
    assert(res.body.shipperId === 'TEST-SHIPPER', 'ShipperId mismatch');
    assert(res.body.mode === 'GROUND', 'Mode mismatch');
    assert(res.body.budgetAmount === 2500, 'Budget mismatch');
    loadId = res.body.id;
    console.log(`    Load ID: ${loadId}`);
  });

  console.log('\n--- Codex Hash-Chain Verification ---\n');

  await test('LOAD_CREATED event logged to Codex', async () => {
    const res = await request(CODEX_URL, 'GET', '/codex/records');
    assert(res.status === 200, 'Failed to get records');
    const record = res.body.find(r => r.data && r.data.loadId === loadId);
    assert(record, 'Load not found in Codex');
    assert(record.type === 'LOAD_CREATED', 'Wrong event type');
    assert(record.hash, 'Missing hash');
    console.log(`    Hash: ${record.hash.substring(0, 16)}...`);
  });

  await test('Codex record has hash chain (prevHash)', async () => {
    const res = await request(CODEX_URL, 'GET', '/codex/records');
    if (res.body.length > 1) {
      const lastRecord = res.body[res.body.length - 1];
      assert(lastRecord.prevHash !== null, 'Should have prevHash for chain');
      console.log(`    Chain link: ${lastRecord.prevHash.substring(0, 16)}...`);
    } else {
      console.log('    First record - no prevHash (expected)');
    }
  });

  console.log('\n--- Load Delivery Flow ---\n');

  await test('Mark load as delivered', async () => {
    const res = await request(LOGISTICS_URL, 'POST', `/loads/${loadId}/delivered`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'DELIVERED', 'Status should be DELIVERED');
    assert(res.body.updatedAt !== res.body.createdAt, 'updatedAt should change');
  });

  await test('LOAD_DELIVERED event logged to Codex', async () => {
    const res = await request(CODEX_URL, 'GET', '/codex/records');
    const record = res.body.find(r => r.type === 'LOAD_DELIVERED' && r.data.loadId === loadId);
    assert(record, 'Delivery not found in Codex');
    assert(record.actor === 'operator', 'Actor should be operator');
  });

  console.log('\n--- Codex Anchoring ---\n');

  await test('Create Codex anchor (merkle root)', async () => {
    const res = await request(CODEX_URL, 'POST', '/codex/anchors');
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.rootHash, 'Missing rootHash');
    assert(res.body.id, 'Missing anchor ID');
    console.log(`    Anchor #${res.body.id}: ${res.body.rootHash.substring(0, 24)}...`);
  });

  await test('List all anchors', async () => {
    const res = await request(CODEX_URL, 'GET', '/codex/anchors');
    assert(res.status === 200, 'Failed to get anchors');
    assert(Array.isArray(res.body), 'Expected array');
    assert(res.body.length > 0, 'Should have at least one anchor');
    console.log(`    Total anchors: ${res.body.length}`);
  });

  console.log('\n=== MONOREPO TEST RESULTS ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nServices Verified:`);
  console.log('• Logistics API (FreightEngine + UUID)');
  console.log('• Codex Ecclesia (Hash-chain + Anchoring)');
  console.log('• Cross-service integration working');
  console.log(`\nStatus: ${failed === 0 ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runMonorepoTest().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
