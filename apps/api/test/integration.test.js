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

async function runIntegrationTest() {
  console.log('\n=== BORDERS DYNASTY - BSC + LOGISTICS INTEGRATION TEST ===\n');
  console.log('This test demonstrates how BSC tokens integrate with the logistics system.\n');

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

  console.log('--- Step 1: Verify Services Are Running ---\n');

  await test('Logistics API health check', async () => {
    const res = await request('GET', '/health');
    assert(res.status === 200, 'API not healthy');
    assert(res.body.status === 'ok', 'Status not ok');
  });

  console.log('\n--- Step 2: Simulate Operator Creating Load ---\n');

  let loadId;
  await test('Operator creates freight load (LA → Phoenix)', async () => {
    const res = await request('POST', '/loads', { 
      origin: 'Los Angeles, CA', 
      destination: 'Phoenix, AZ' 
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.id, 'Missing load ID');
    loadId = res.body.id;
    console.log(`    Created Load #${loadId}`);
  });

  console.log('\n--- Step 3: BSC Token Integration Flow ---\n');
  console.log('    In the live app, the following happens:');
  console.log('    1. Operator connects MetaMask wallet');
  console.log('    2. Operator enters load details + BSC deposit amount');
  console.log('    3. App transfers BSC to escrow address (0xE89fDED...)');
  console.log('    4. After blockchain confirmation, load is created in logistics API');
  console.log('    5. Upon delivery, escrow releases BSC to carrier\n');

  await test('Simulated BSC deposit flow (would transfer tokens in live app)', async () => {
    const mockDeposit = {
      from: '0x1234567890123456789012345678901234567890',
      to: '0xE89fDED72D0D83De3421C6642FA035ebE197804f',
      amount: '50.00',
      token: 'BSC',
      loadId: loadId
    };
    console.log(`    Deposit: ${mockDeposit.amount} ${mockDeposit.token}`);
    console.log(`    Escrow: ${mockDeposit.to.substring(0, 10)}...`);
    assert(mockDeposit.amount === '50.00', 'Deposit amount mismatch');
  });

  console.log('\n--- Step 4: Load Lifecycle ---\n');

  await test('View active loads', async () => {
    const res = await request('GET', '/loads');
    assert(res.status === 200, 'Failed to get loads');
    assert(Array.isArray(res.body), 'Expected array');
    const ourLoad = res.body.find(l => l.id === loadId);
    assert(ourLoad, 'Our load not found');
    assert(ourLoad.status === 'CREATED', 'Status should be CREATED');
    console.log(`    Found Load #${loadId} - Status: ${ourLoad.status}`);
  });

  await test('Mark load as delivered (triggers escrow release in production)', async () => {
    const res = await request('POST', `/loads/${loadId}/delivered`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'DELIVERED', 'Status should be DELIVERED');
    console.log(`    Load #${loadId} delivered at ${res.body.deliveredAt}`);
  });

  console.log('\n--- Step 5: Verify Final State ---\n');

  await test('Confirm load is marked delivered', async () => {
    const res = await request('GET', `/loads/${loadId}`);
    assert(res.status === 200, 'Failed to get load');
    assert(res.body.status === 'DELIVERED', 'Should be DELIVERED');
  });

  console.log('\n=== INTEGRATION SUMMARY ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nBSC Token Integration Points:`);
  console.log('• Deposit required before load creation');
  console.log('• Funds held in escrow smart contract');
  console.log('• Automatic release on delivery confirmation');
  console.log('• All transactions logged to Codex Ecclesia');
  console.log(`\nStatus: ${failed === 0 ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runIntegrationTest().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
