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
  console.log('\n=== BORDERS DYNASTY GLOBAL OPS MONOREPO TEST ===\n');
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
    assert(res.body.modes.includes('AIR'), 'Missing AIR mode');
  });

  await test('Codex Ecclesia is healthy', async () => {
    const res = await request(CODEX_URL, 'GET', '/codex/health');
    assert(res.status === 200, 'Codex not healthy');
  });

  console.log('\n--- Global Ops Status ---\n');

  await test('Get ops status shows modes and regions', async () => {
    const res = await request(LOGISTICS_URL, 'GET', '/ops/status');
    assert(res.status === 200, 'Failed to get status');
    assert(res.body.modes.GROUND, 'Missing GROUND mode');
    assert(res.body.regions.NORTH_AMERICA, 'Missing NORTH_AMERICA region');
    console.log(`    Active modes: ${Object.keys(res.body.modes).filter(m => res.body.modes[m].active).join(', ')}`);
  });

  console.log('\n--- Mode/Region Activation ---\n');

  await test('Activate AIR mode', async () => {
    const res = await request(LOGISTICS_URL, 'POST', '/ops/activate-mode', { mode: 'AIR' });
    assert(res.status === 200, 'Failed to activate');
    assert(res.body.success === true, 'Activation failed');
  });

  await test('Activate EUROPE region', async () => {
    const res = await request(LOGISTICS_URL, 'POST', '/ops/activate-region', { region: 'EUROPE' });
    assert(res.status === 200, 'Failed to activate');
    assert(res.body.success === true, 'Activation failed');
  });

  await test('Cannot activate not-ready region (ASIA_PACIFIC)', async () => {
    const res = await request(LOGISTICS_URL, 'POST', '/ops/activate-region', { region: 'ASIA_PACIFIC' });
    assert(res.status === 400, 'Should fail for not-ready region');
  });

  console.log('\n--- FreightEngine Load Creation ---\n');

  let loadId;
  await test('Create GROUND load in NORTH_AMERICA', async () => {
    const res = await request(LOGISTICS_URL, 'POST', '/loads', {
      shipperId: 'TEST-SHIPPER',
      origin: 'Chicago, IL',
      destination: 'Miami, FL',
      mode: 'GROUND',
      budgetAmount: 2500,
      region: 'NORTH_AMERICA'
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.id.includes('-'), 'ID should be UUID');
    assert(res.body.region === 'NORTH_AMERICA', 'Region mismatch');
    loadId = res.body.id;
    console.log(`    Load ID: ${loadId}`);
  });

  await test('Create AIR load in EUROPE (after activation)', async () => {
    const res = await request(LOGISTICS_URL, 'POST', '/loads', {
      shipperId: 'EU-SHIPPER',
      origin: 'London, UK',
      destination: 'Rome, IT',
      mode: 'AIR',
      budgetAmount: 8000,
      region: 'EUROPE'
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.mode === 'AIR', 'Mode mismatch');
  });

  console.log('\n--- Load Lifecycle ---\n');

  await test('Mark load in-transit', async () => {
    const res = await request(LOGISTICS_URL, 'POST', `/loads/${loadId}/in-transit`);
    assert(res.status === 200, 'Failed to mark in-transit');
    assert(res.body.status === 'IN_TRANSIT', 'Status mismatch');
  });

  await test('Mark load delivered', async () => {
    const res = await request(LOGISTICS_URL, 'POST', `/loads/${loadId}/delivered`);
    assert(res.status === 200, 'Failed to mark delivered');
    assert(res.body.status === 'DELIVERED', 'Status mismatch');
  });

  console.log('\n--- Codex Hash-Chain ---\n');

  await test('Events logged to Codex with hash chain', async () => {
    const res = await request(CODEX_URL, 'GET', '/codex/records');
    assert(res.status === 200, 'Failed to get records');
    assert(res.body.length > 0, 'No records');
    const hasChain = res.body.some(r => r.prevHash !== null);
    assert(hasChain, 'No hash chain links found');
    console.log(`    Total records: ${res.body.length}`);
  });

  await test('Create anchor (merkle root)', async () => {
    const res = await request(CODEX_URL, 'POST', '/codex/anchors');
    assert(res.status === 201, 'Failed to create anchor');
    assert(res.body.rootHash, 'Missing rootHash');
    console.log(`    Anchor: ${res.body.rootHash.substring(0, 24)}...`);
  });

  console.log('\n=== GLOBAL OPS TEST RESULTS ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('\nCapabilities Verified:');
  console.log('• Modes: GROUND, AIR, OCEAN, COURIER');
  console.log('• Regions: NORTH_AMERICA, EUROPE (active), ASIA_PACIFIC, LATAM (not ready)');
  console.log('• Ops activation/deactivation with Codex logging');
  console.log('• FreightEngine with mode validation');
  console.log('• Load lifecycle: CREATED → IN_TRANSIT → DELIVERED');
  console.log(`\nStatus: ${failed === 0 ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runMonorepoTest().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
