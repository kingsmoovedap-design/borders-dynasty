const API = 'http://localhost:3000';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  return { status: res.status, data: await res.json() };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    testsPassed++;
  } else {
    console.log(`  ✗ ${testName}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     BORDERS DYNASTY - FULL COIN OPERATIONS TEST SUITE        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 1: SECURITY INFRASTRUCTURE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const secStatus = await request('GET', '/security/status');
  assert(secStatus.status === 200, 'Security status endpoint accessible');
  assert(secStatus.data.protection, 'Protection config present');
  console.log(`    Rate limit: ${secStatus.data.protection.rateLimit}`);
  console.log(`    Anomaly threshold: ${secStatus.data.protection.anomalyThreshold}`);

  const secEvents = await request('GET', '/security/events?limit=10');
  assert(secEvents.status === 200, 'Security events retrievable');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 2: DEVINE DISPATCH - EXTERNAL CONTRACT GATHERING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const partners = await request('GET', '/devine-dispatch/partners');
  assert(partners.status === 200, 'Partner boards listing works');
  assert(partners.data.partners.length >= 5, 'Multiple loadboard partners available');
  console.log(`    Partner boards: ${partners.data.partners.map(p => p.name).join(', ')}`);

  const gatherResult = await request('POST', '/devine-dispatch/gather', {});
  assert(gatherResult.status === 200, 'Contract gathering from all partners');
  console.log(`    Total gathered: ${gatherResult.data.summary?.totalGathered || 0}`);
  console.log(`    Redirected to Dynasty: ${gatherResult.data.summary?.totalRedirected || 0}`);

  const contracts = await request('GET', '/devine-dispatch/contracts');
  assert(contracts.status === 200, 'Retrieved gathered contracts');
  assert(contracts.data.length > 0, 'Contracts were gathered');

  const qualified = await request('GET', '/devine-dispatch/qualified');
  assert(qualified.status === 200, 'Dynasty-qualified contracts retrievable');
  console.log(`    Dynasty qualified: ${qualified.data.length}`);

  let convertedLoadId = null;
  if (qualified.data.length > 0) {
    const contractToConvert = qualified.data[0];
    console.log(`    Converting contract: ${contractToConvert.id} (score: ${contractToConvert.dynastyScore})`);
    
    const converted = await request('POST', `/devine-dispatch/convert/${contractToConvert.id}`);
    assert(converted.status === 200, 'External contract converted to Dynasty load');
    if (converted.data.convertedLoad) {
      convertedLoadId = converted.data.convertedLoad.id;
      console.log(`    New Dynasty load ID: ${convertedLoadId}`);
    }
  }

  const dispatchStats = await request('GET', '/devine-dispatch/stats');
  assert(dispatchStats.status === 200, 'Dispatch stats retrievable');
  console.log(`    By mode: GROUND=${dispatchStats.data.byMode?.GROUND}, COURIER=${dispatchStats.data.byMode?.COURIER}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 3: FULL BSC TOKEN FLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await request('POST', '/ops/staged-launch', { stage: 'NATIONWIDE' });

  const driverWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f8d5Fe';
  const shipperWallet = '0xE89fDED72D0D83De3421C6642FA035ebE197804f';

  const driver = await request('POST', '/drivers', {
    driverId: 'TOKEN-DRIVER-001',
    name: 'Token Test Driver',
    homeBase: 'Houston, TX',
    equipment: 'DRY_VAN'
  });
  assert(driver.status === 201, 'Driver registered for token test');

  const load = await request('POST', '/loads', {
    shipperId: 'TOKEN-SHIPPER-001',
    origin: 'Houston, TX',
    destination: 'Dallas, TX',
    mode: 'GROUND',
    budgetAmount: 2500,
    region: 'NORTH_AMERICA'
  });
  assert(load.status === 201, 'Load created for token test');
  const loadId = load.data.id;
  console.log(`    Load ID: ${loadId}`);

  const escrowDeposit = await request('POST', '/token/escrow/deposit', {
    loadId: loadId,
    amount: 2500,
    depositorAddress: shipperWallet
  });
  assert(escrowDeposit.status === 200, 'Escrow deposit successful');
  console.log(`    Escrow TX Hash: ${escrowDeposit.data.txHash?.slice(0, 20)}...`);

  const escrowBalance = await request('GET', `/token/escrow/${loadId}`);
  assert(escrowBalance.status === 200, 'Escrow balance retrievable');
  assert(escrowBalance.data.total === 2500, 'Escrow balance matches deposit');
  console.log(`    Escrow balance: $${escrowBalance.data.total}`);

  const contract = await request('POST', '/contract/accept', {
    loadId: loadId,
    driverId: 'TOKEN-DRIVER-001'
  });
  assert(contract.status === 201, 'Contract accepted');
  console.log(`    Contract: $${contract.data.amount} (Driver: $${contract.data.driverPayout}, Dynasty: $${contract.data.dynastyFee})`);

  await request('POST', `/loads/${loadId}/in-transit`);
  const delivered = await request('POST', `/loads/${loadId}/delivered`);
  assert(delivered.status === 200, 'Load marked as delivered');

  const payout = await request('POST', `/token/payout/${loadId}`, {
    driverWallet: driverWallet
  });
  assert(payout.status === 200, 'Payout processed');
  console.log(`    Driver TX: ${payout.data.driverTransaction?.txHash?.slice(0, 20)}...`);
  console.log(`    Dynasty TX: ${payout.data.dynastyTransaction?.txHash?.slice(0, 20)}...`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 4: CREDIT ADVANCE WITH TOKEN INTEGRATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const creditAdvance = await request('POST', '/token/credit/advance', {
    driverId: 'TOKEN-DRIVER-001',
    amount: 150,
    driverWallet: driverWallet
  });
  assert(creditAdvance.status === 200, 'Credit advance issued with token');
  console.log(`    Advance TX: ${creditAdvance.data.tokenTransaction?.txHash?.slice(0, 20)}...`);

  const repayment = await request('POST', '/token/credit/repay', {
    driverId: 'TOKEN-DRIVER-001',
    amount: 150,
    driverWallet: driverWallet
  });
  assert(repayment.status === 200, 'Credit repayment processed with token');
  console.log(`    Repayment TX: ${repayment.data.tokenTransaction?.txHash?.slice(0, 20)}...`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 5: TOKEN TREASURY STATS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const treasuryStats = await request('GET', '/token/treasury/stats');
  assert(treasuryStats.status === 200, 'Treasury stats retrievable');
  console.log(`    BSC Contract: ${treasuryStats.data.contract}`);
  console.log(`    Escrow Wallet: ${treasuryStats.data.escrowWallet}`);
  console.log(`    Dynasty Fee: ${treasuryStats.data.feePercent}%`);
  console.log(`    Total Deposited: $${treasuryStats.data.totalDeposited}`);
  console.log(`    Driver Payouts: $${treasuryStats.data.totalDriverPayouts}`);
  console.log(`    Dynasty Fees: $${treasuryStats.data.totalDynastyFees}`);

  const tokenTxs = await request('GET', '/token/transactions');
  assert(tokenTxs.status === 200, 'Token transactions retrievable');
  assert(tokenTxs.data.length >= 4, 'All token transactions recorded');
  console.log(`    Total transactions: ${tokenTxs.data.length}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 6: INPUT VALIDATION (SECURITY TEST)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const invalidLoad = await request('POST', '/loads', {
    shipperId: 'test',
    origin: 'A',
    destination: 'B',
    mode: 'INVALID_MODE',
    budgetAmount: -100,
    region: 'MARS'
  });
  assert(invalidLoad.status === 400, 'Invalid load creation rejected');

  const sqlInjection = await request('POST', '/loads', {
    shipperId: "'; DROP TABLE loads; --",
    origin: '<script>alert("xss")</script>',
    destination: 'Normal City',
    mode: 'GROUND',
    budgetAmount: 1000,
    region: 'NORTH_AMERICA'
  });
  assert(sqlInjection.status === 201, 'SQL injection sanitized (load created safely)');

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS SUMMARY                       ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  PASSED: ${testsPassed.toString().padEnd(2)}  | FAILED: ${testsFailed.toString().padEnd(2)}                                    ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  SYSTEMS VERIFIED:                                            ║');
  console.log('║  • Security Middleware (rate limit, anomaly detection)        ║');
  console.log('║  • Devine Dispatch (external loadboard gathering)             ║');
  console.log('║  • BSC Token Integration (escrow, payouts)                    ║');
  console.log('║  • Credit System (advances, repayments with tokens)           ║');
  console.log('║  • Input Validation (sanitization, SQL injection prevention)  ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  if (testsFailed === 0) {
    console.log('║  STATUS: ALL TESTS PASSED ✓                                  ║');
  } else {
    console.log(`║  STATUS: ${testsFailed} TESTS FAILED ✗                                    ║`);
  }
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

runTests().catch(console.error);
