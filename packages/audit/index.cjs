const crypto = require('crypto');

const auditLog = [];
const complianceReports = [];

const EVENT_CATEGORIES = {
  SECURITY: ['IP_BLOCKED', 'IP_UNBLOCKED', 'AUTH_FAILED', 'RATE_LIMIT_HIT', 'ANOMALY_DETECTED'],
  OPERATIONS: ['LOAD_CREATED', 'LOAD_DELIVERED', 'DISPATCH_ASSIGNED', 'CONTRACT_ACCEPTED'],
  TREASURY: ['ESCROW_DEPOSITED', 'PAYOUT_PROCESSED', 'CREDIT_ADVANCE', 'CREDIT_REPAYMENT'],
  GOVERNANCE: ['MODE_ACTIVATED', 'REGION_ACTIVATED', 'GLOBAL_LAUNCH', 'STAGED_LAUNCH'],
  ACCESS: ['SESSION_CREATED', 'SESSION_REVOKED', 'API_KEY_CREATED', 'API_KEY_REVOKED']
};

const SEVERITY_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  NOTICE: 2,
  WARNING: 3,
  ERROR: 4,
  CRITICAL: 5,
  ALERT: 6,
  EMERGENCY: 7
};

function categorizeEvent(eventType) {
  for (const [category, events] of Object.entries(EVENT_CATEGORIES)) {
    if (events.some(e => eventType.includes(e))) {
      return category;
    }
  }
  return 'GENERAL';
}

function determineSeverity(eventType) {
  if (eventType.includes('EMERGENCY') || eventType.includes('BREACH')) return 'EMERGENCY';
  if (eventType.includes('ALERT') || eventType.includes('CRITICAL')) return 'ALERT';
  if (eventType.includes('BLOCKED') || eventType.includes('FAILED')) return 'WARNING';
  if (eventType.includes('ANOMALY')) return 'NOTICE';
  if (eventType.includes('CREATED') || eventType.includes('ACTIVATED')) return 'INFO';
  return 'INFO';
}

function createAuditEntry(eventType, data, actor = 'system', metadata = {}) {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType,
    category: categorizeEvent(eventType),
    severity: determineSeverity(eventType),
    actor,
    data,
    metadata: {
      ...metadata,
      ip: metadata.ip || null,
      userAgent: metadata.userAgent || null,
      sessionId: metadata.sessionId || null
    },
    hash: null
  };
  
  const previousHash = auditLog.length > 0 ? auditLog[auditLog.length - 1].hash : 'GENESIS';
  const contentToHash = JSON.stringify({
    previousHash,
    timestamp: entry.timestamp,
    eventType: entry.eventType,
    data: entry.data
  });
  entry.hash = crypto.createHash('sha256').update(contentToHash).digest('hex');
  
  auditLog.push(entry);
  
  if (auditLog.length > 50000) {
    archiveOldEntries();
  }
  
  return entry;
}

function archiveOldEntries() {
  const toArchive = auditLog.splice(0, 10000);
  const archiveId = `ARCHIVE-${Date.now()}`;
  complianceReports.push({
    id: archiveId,
    type: 'AUDIT_ARCHIVE',
    entriesCount: toArchive.length,
    firstEntry: toArchive[0]?.timestamp,
    lastEntry: toArchive[toArchive.length - 1]?.timestamp,
    merkleRoot: generateMerkleRoot(toArchive.map(e => e.hash)),
    archivedAt: new Date().toISOString()
  });
}

function generateMerkleRoot(hashes) {
  if (hashes.length === 0) return null;
  if (hashes.length === 1) return hashes[0];
  
  const nextLevel = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left;
    const combined = crypto.createHash('sha256').update(left + right).digest('hex');
    nextLevel.push(combined);
  }
  
  return generateMerkleRoot(nextLevel);
}

function queryAuditLog(filters = {}, options = {}) {
  let results = [...auditLog];
  
  if (filters.category) {
    results = results.filter(e => e.category === filters.category);
  }
  if (filters.severity) {
    const minLevel = SEVERITY_LEVELS[filters.severity] || 0;
    results = results.filter(e => SEVERITY_LEVELS[e.severity] >= minLevel);
  }
  if (filters.eventType) {
    results = results.filter(e => e.eventType.includes(filters.eventType));
  }
  if (filters.actor) {
    results = results.filter(e => e.actor === filters.actor);
  }
  if (filters.startTime) {
    results = results.filter(e => new Date(e.timestamp) >= new Date(filters.startTime));
  }
  if (filters.endTime) {
    results = results.filter(e => new Date(e.timestamp) <= new Date(filters.endTime));
  }
  
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  
  return {
    entries: results.slice(offset, offset + limit),
    total: results.length,
    hasMore: results.length > offset + limit
  };
}

function generateComplianceReport(reportType, dateRange = {}) {
  const startTime = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endTime = dateRange.end || new Date().toISOString();
  
  const relevantEntries = auditLog.filter(e => 
    new Date(e.timestamp) >= new Date(startTime) &&
    new Date(e.timestamp) <= new Date(endTime)
  );
  
  const report = {
    id: `REPORT-${Date.now()}`,
    type: reportType,
    generatedAt: new Date().toISOString(),
    period: { start: startTime, end: endTime },
    summary: {
      totalEvents: relevantEntries.length,
      byCategory: {},
      bySeverity: {},
      topEventTypes: {}
    },
    securityMetrics: {
      blockedIPs: 0,
      authFailures: 0,
      anomaliesDetected: 0,
      rateLimitHits: 0
    },
    operationalMetrics: {
      loadsCreated: 0,
      loadsDelivered: 0,
      contractsAccepted: 0
    },
    treasuryMetrics: {
      escrowDeposits: 0,
      payoutsProcessed: 0,
      creditAdvances: 0
    },
    chainOfCustody: {
      firstEntryHash: relevantEntries[0]?.hash || null,
      lastEntryHash: relevantEntries[relevantEntries.length - 1]?.hash || null,
      merkleRoot: generateMerkleRoot(relevantEntries.map(e => e.hash))
    }
  };
  
  for (const entry of relevantEntries) {
    report.summary.byCategory[entry.category] = (report.summary.byCategory[entry.category] || 0) + 1;
    report.summary.bySeverity[entry.severity] = (report.summary.bySeverity[entry.severity] || 0) + 1;
    report.summary.topEventTypes[entry.eventType] = (report.summary.topEventTypes[entry.eventType] || 0) + 1;
    
    if (entry.eventType.includes('IP_BLOCKED')) report.securityMetrics.blockedIPs++;
    if (entry.eventType.includes('AUTH_FAILED')) report.securityMetrics.authFailures++;
    if (entry.eventType.includes('ANOMALY')) report.securityMetrics.anomaliesDetected++;
    if (entry.eventType.includes('RATE_LIMIT')) report.securityMetrics.rateLimitHits++;
    
    if (entry.eventType.includes('LOAD_CREATED')) report.operationalMetrics.loadsCreated++;
    if (entry.eventType.includes('LOAD_DELIVERED')) report.operationalMetrics.loadsDelivered++;
    if (entry.eventType.includes('CONTRACT_ACCEPTED')) report.operationalMetrics.contractsAccepted++;
    
    if (entry.eventType.includes('ESCROW')) report.treasuryMetrics.escrowDeposits++;
    if (entry.eventType.includes('PAYOUT')) report.treasuryMetrics.payoutsProcessed++;
    if (entry.eventType.includes('CREDIT_ADVANCE')) report.treasuryMetrics.creditAdvances++;
  }
  
  complianceReports.push(report);
  
  return report;
}

function verifyChainIntegrity(startIndex = 0, endIndex = null) {
  const end = endIndex || auditLog.length;
  const errors = [];
  
  for (let i = startIndex + 1; i < end; i++) {
    const current = auditLog[i];
    const previous = auditLog[i - 1];
    
    const expectedContent = JSON.stringify({
      previousHash: previous.hash,
      timestamp: current.timestamp,
      eventType: current.eventType,
      data: current.data
    });
    const expectedHash = crypto.createHash('sha256').update(expectedContent).digest('hex');
    
    if (current.hash !== expectedHash) {
      errors.push({
        index: i,
        entryId: current.id,
        expectedHash,
        actualHash: current.hash,
        message: 'Hash mismatch - possible tampering detected'
      });
    }
  }
  
  return {
    verified: errors.length === 0,
    entriesChecked: end - startIndex,
    errors
  };
}

function getAuditStats() {
  const now = new Date();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  const recent24h = auditLog.filter(e => new Date(e.timestamp) >= last24h);
  const recent7d = auditLog.filter(e => new Date(e.timestamp) >= last7d);
  
  return {
    totalEntries: auditLog.length,
    last24h: recent24h.length,
    last7d: recent7d.length,
    oldestEntry: auditLog[0]?.timestamp || null,
    newestEntry: auditLog[auditLog.length - 1]?.timestamp || null,
    chainIntegrity: verifyChainIntegrity(),
    reportsGenerated: complianceReports.length
  };
}

module.exports = {
  EVENT_CATEGORIES,
  SEVERITY_LEVELS,
  createAuditEntry,
  queryAuditLog,
  generateComplianceReport,
  verifyChainIntegrity,
  getAuditStats,
  generateMerkleRoot,
  auditLog,
  complianceReports
};
