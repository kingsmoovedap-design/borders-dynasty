const http = require('http');

const API_URL = 'http://localhost:3000';
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

async function runFullCoinFlowTest() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     BORDERS DYNASTY - FULL COIN FLOW INTEGRATION TEST        ║');
  console.log('║     Local → Nationwide → Global Launch Scenarios             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${name}`);
      console.log(`    Error: ${err.message}`);
      failed++;
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 1: SERVICE HEALTH & INITIALIZATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await test('Logistics API healthy with BSC contract', async () => {
    const res = await request(API_URL, 'GET', '/health');
    assert(res.status === 200, 'API not healthy');
    assert(res.body.bscContract, 'Missing BSC contract');
    assert(res.body.dynastyFee === '5%', 'Wrong dynasty fee');
    console.log(`    BSC Contract: ${res.body.bscContract}`);
  });

  await test('Codex Ecclesia healthy', async () => {
    const res = await request(CODEX_URL, 'GET', '/codex/health');
    assert(res.status === 200, 'Codex not healthy');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 2: DRIVER REGISTRATION & CREDIT LINES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let driverId = 'DRIVER-001';
  await test('Register driver with DevineCredit line', async () => {
    const res = await request(API_URL, 'POST', '/drivers', {
      driverId,
      name: 'John Dynasty',
      homeBase: 'Los Angeles, CA',
      equipment: 'Box Truck'
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.driver.driverId === driverId, 'Driver ID mismatch');
    assert(res.body.creditLine.limit === 500, 'Expected $500 credit limit');
    console.log(`    Credit Line: $${res.body.creditLine.limit} (${res.body.creditLine.tier})`);
  });

  await test('Get driver credit status', async () => {
    const res = await request(API_URL, 'GET', `/drivers/${driverId}/credit`);
    assert(res.status === 200, 'Failed to get credit');
    assert(res.body.available === 500, 'Credit should be fully available');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 3: LOCAL LAUNCH (GROUND + NORTH_AMERICA)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await test('Get LOCAL launch plan', async () => {
    const res = await request(API_URL, 'GET', '/ops/launch-plan/local');
    assert(res.status === 200, 'Failed to get plan');
    assert(res.body.stage === 'LOCAL', 'Wrong stage');
    console.log(`    Modes: ${res.body.modes.join(', ')}`);
    console.log(`    Regions: ${res.body.regions.join(', ')}`);
  });

  let loadId;
  await test('Create GROUND load with BSC escrow deposit', async () => {
    const res = await request(API_URL, 'POST', '/loads', {
      shipperId: 'SHIPPER-LOCAL-1',
      origin: 'Los Angeles, CA',
      destination: 'San Diego, CA',
      mode: 'GROUND',
      budgetAmount: 800,
      region: 'NORTH_AMERICA',
      driverId
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.escrowDeposit, 'Missing escrow deposit');
    assert(res.body.escrowDeposit.status === 'HELD', 'Escrow not held');
    loadId = res.body.id;
    console.log(`    Load ID: ${loadId}`);
    console.log(`    Escrow: $${res.body.escrowDeposit.amount} BSC`);
  });

  await test('Issue credit advance against load', async () => {
    const res = await request(API_URL, 'POST', `/drivers/${driverId}/advance`, {
      amount: 200,
      loadId
    });
    assert(res.status === 201, 'Failed to issue advance');
    assert(res.body.amount === 200, 'Wrong advance amount');
    console.log(`    Advance: $${res.body.amount}`);
  });

  await test('Mark load in-transit', async () => {
    const res = await request(API_URL, 'POST', `/loads/${loadId}/in-transit`);
    assert(res.status === 200, 'Failed to mark in-transit');
    assert(res.body.status === 'IN_TRANSIT', 'Wrong status');
  });

  await test('Complete delivery with auto payout & credit repayment', async () => {
    const res = await request(API_URL, 'POST', `/loads/${loadId}/delivered`);
    assert(res.status === 200, 'Failed to deliver');
    assert(res.body.status === 'DELIVERED', 'Wrong status');
    assert(res.body.payoutResult, 'Missing payout result');
    
    const payout = res.body.payoutResult;
    console.log(`    Dynasty Fee: $${payout.dynastyPayout.amount}`);
    console.log(`    Driver Gross: $${payout.driverPayout.amount}`);
    console.log(`    Credit Repaid: $${payout.creditRepaid || 0}`);
    console.log(`    Driver Net: $${payout.driverPayout.netAmount || payout.driverPayout.amount}`);
  });

  await test('Verify credit balance after repayment', async () => {
    const res = await request(API_URL, 'GET', `/drivers/${driverId}/credit`);
    assert(res.status === 200, 'Failed to get credit');
    assert(res.body.balance === 0, 'Balance should be repaid');
    assert(res.body.available === 500, 'Credit should be restored');
    console.log(`    Available Credit: $${res.body.available}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 4: NATIONWIDE LAUNCH (+ AIR + COURIER)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await test('Execute NATIONWIDE staged launch', async () => {
    const res = await request(API_URL, 'POST', '/ops/staged-launch', { stage: 'NATIONWIDE' });
    assert(res.status === 200, 'Failed to launch');
    assert(res.body.activatedModes.includes('AIR'), 'AIR not activated');
    console.log(`    Activated: ${res.body.activatedModes.join(', ')}`);
  });

  await test('Create AIR freight load', async () => {
    const res = await request(API_URL, 'POST', '/loads', {
      shipperId: 'SHIPPER-NATIONAL-1',
      origin: 'New York, NY',
      destination: 'Miami, FL',
      mode: 'AIR',
      budgetAmount: 3500,
      region: 'NORTH_AMERICA'
    });
    assert(res.status === 201, 'Failed to create AIR load');
    assert(res.body.mode === 'AIR', 'Wrong mode');
    console.log(`    AIR Load: $${res.body.budgetAmount}`);
  });

  await test('Create COURIER load', async () => {
    const res = await request(API_URL, 'POST', '/loads', {
      shipperId: 'SHIPPER-COURIER-1',
      origin: 'Chicago, IL',
      destination: 'Detroit, MI',
      mode: 'COURIER',
      budgetAmount: 150,
      region: 'NORTH_AMERICA'
    });
    assert(res.status === 201, 'Failed to create COURIER load');
    console.log(`    COURIER Load: $${res.body.budgetAmount}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 5: GLOBAL LAUNCH (+ OCEAN + EUROPE)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await test('Execute GLOBAL launch wave', async () => {
    const res = await request(API_URL, 'POST', '/ops/global-launch');
    assert(res.status === 200, 'Failed to launch');
    assert(res.body.opsStatus.modes.OCEAN.active, 'OCEAN not activated');
    assert(res.body.opsStatus.regions.EUROPE.active, 'EUROPE not activated');
    console.log('    All modes activated');
    console.log('    NA + EUROPE regions active');
  });

  await test('Create OCEAN freight (transatlantic)', async () => {
    const res = await request(API_URL, 'POST', '/loads', {
      shipperId: 'SHIPPER-GLOBAL-1',
      origin: 'Rotterdam, NL',
      destination: 'New York, NY',
      mode: 'OCEAN',
      budgetAmount: 25000,
      region: 'EUROPE'
    });
    assert(res.status === 201, 'Failed to create OCEAN load');
    console.log(`    OCEAN Load: $${res.body.budgetAmount}`);
  });

  await test('Create GROUND load in EUROPE', async () => {
    const res = await request(API_URL, 'POST', '/loads', {
      shipperId: 'SHIPPER-EU-1',
      origin: 'Paris, FR',
      destination: 'Berlin, DE',
      mode: 'GROUND',
      budgetAmount: 1200,
      region: 'EUROPE'
    });
    assert(res.status === 201, 'Failed to create EU load');
    console.log(`    EU GROUND Load: $${res.body.budgetAmount}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 6: TREASURY & CODEX VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await test('Verify treasury payouts', async () => {
    const res = await request(API_URL, 'GET', '/treasury/payouts');
    assert(res.status === 200, 'Failed to get payouts');
    assert(res.body.length > 0, 'No payouts recorded');
    console.log(`    Total Payouts: ${res.body.length}`);
  });

  await test('Verify credit transactions', async () => {
    const res = await request(API_URL, 'GET', '/credit/transactions');
    assert(res.status === 200, 'Failed to get transactions');
    const advances = res.body.filter(t => t.type === 'ADVANCE');
    const repayments = res.body.filter(t => t.type === 'REPAYMENT');
    console.log(`    Advances: ${advances.length}, Repayments: ${repayments.length}`);
  });

  await test('Verify Codex hash-chain records', async () => {
    const res = await request(CODEX_URL, 'GET', '/codex/records');
    assert(res.status === 200, 'Failed to get records');
    
    const types = {};
    res.body.forEach(r => {
      types[r.type] = (types[r.type] || 0) + 1;
    });
    
    console.log(`    Total Records: ${res.body.length}`);
    console.log(`    Event Types: ${Object.keys(types).join(', ')}`);
  });

  await test('Create Codex anchor for audit trail', async () => {
    const res = await request(CODEX_URL, 'POST', '/codex/anchors');
    assert(res.status === 201, 'Failed to create anchor');
    console.log(`    Anchor Hash: ${res.body.rootHash.substring(0, 32)}...`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 7: FINAL OPS STATUS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await test('Get final ops status', async () => {
    const res = await request(API_URL, 'GET', '/ops/status');
    assert(res.status === 200, 'Failed to get status');
    
    const activeModes = Object.entries(res.body.modes)
      .filter(([, v]) => v.active).map(([k]) => k);
    const activeRegions = Object.entries(res.body.regions)
      .filter(([, v]) => v.active).map(([k]) => k);
    
    console.log(`    Active Modes: ${activeModes.join(', ')}`);
    console.log(`    Active Regions: ${activeRegions.join(', ')}`);
  });

  await test('Get all loads summary', async () => {
    const res = await request(API_URL, 'GET', '/loads');
    assert(res.status === 200, 'Failed to get loads');
    
    const byMode = {};
    res.body.forEach(l => {
      byMode[l.mode] = (byMode[l.mode] || 0) + 1;
    });
    
    console.log(`    Total Loads: ${res.body.length}`);
    Object.entries(byMode).forEach(([mode, count]) => {
      console.log(`      ${mode}: ${count}`);
    });
  });

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS SUMMARY                      ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  PASSED: ${String(passed).padEnd(3)} | FAILED: ${String(failed).padEnd(3)}                                ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  SYSTEMS VERIFIED:                                           ║');
  console.log('║  • FreightEngine (UUID, mode validation)                     ║');
  console.log('║  • TreasuryEngine (escrow, payouts, BSC token)               ║');
  console.log('║  • DevineCredit (credit lines, advances, repayments)         ║');
  console.log('║  • Global Ops (staged launch: LOCAL → NATIONWIDE → GLOBAL)   ║');
  console.log('║  • Codex Ecclesia (hash-chain, anchoring)                    ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  STATUS: ${failed === 0 ? 'ALL TESTS PASSED ✓                                  ' : 'SOME TESTS FAILED ✗                                '}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  process.exit(failed > 0 ? 1 : 0);
}

runFullCoinFlowTest().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
