const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function persistAuditEntry(entry) {
  const previousHashResult = await pool.query(
    `SELECT hash FROM audit_entries ORDER BY created_at DESC LIMIT 1`
  );
  const previousHash = previousHashResult.rows[0]?.hash || 'GENESIS';
  
  await pool.query(`
    INSERT INTO audit_entries (id, event_type, category, severity, actor, data, metadata, hash, previous_hash, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    entry.id,
    entry.eventType,
    entry.category,
    entry.severity,
    entry.actor,
    JSON.stringify(entry.data || {}),
    JSON.stringify(entry.metadata || {}),
    entry.hash,
    previousHash,
    new Date(entry.timestamp)
  ]);
  
  return entry;
}

async function loadAuditEntries(filters = {}, options = {}) {
  let query = `SELECT * FROM audit_entries WHERE 1=1`;
  const params = [];
  let paramIndex = 1;
  
  if (filters.category) {
    query += ` AND category = $${paramIndex++}`;
    params.push(filters.category);
  }
  if (filters.severity) {
    query += ` AND severity = $${paramIndex++}`;
    params.push(filters.severity);
  }
  if (filters.eventType) {
    query += ` AND event_type LIKE $${paramIndex++}`;
    params.push(`%${filters.eventType}%`);
  }
  if (filters.actor) {
    query += ` AND actor = $${paramIndex++}`;
    params.push(filters.actor);
  }
  if (filters.startTime) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(new Date(filters.startTime));
  }
  if (filters.endTime) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(new Date(filters.endTime));
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  
  query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM audit_entries`,
    []
  );
  
  return {
    entries: result.rows.map(row => ({
      id: row.id,
      timestamp: row.created_at.toISOString(),
      eventType: row.event_type,
      category: row.category,
      severity: row.severity,
      actor: row.actor,
      data: row.data,
      metadata: row.metadata,
      hash: row.hash,
      previousHash: row.previous_hash
    })),
    total: parseInt(countResult.rows[0].count),
    hasMore: parseInt(countResult.rows[0].count) > offset + limit
  };
}

async function getAuditStats() {
  const totalResult = await pool.query(`SELECT COUNT(*) FROM audit_entries`);
  
  const last24hResult = await pool.query(
    `SELECT COUNT(*) FROM audit_entries WHERE created_at > NOW() - INTERVAL '24 hours'`
  );
  
  const last7dResult = await pool.query(
    `SELECT COUNT(*) FROM audit_entries WHERE created_at > NOW() - INTERVAL '7 days'`
  );
  
  const oldestResult = await pool.query(
    `SELECT created_at FROM audit_entries ORDER BY created_at ASC LIMIT 1`
  );
  
  const newestResult = await pool.query(
    `SELECT created_at FROM audit_entries ORDER BY created_at DESC LIMIT 1`
  );
  
  return {
    totalEntries: parseInt(totalResult.rows[0].count),
    last24h: parseInt(last24hResult.rows[0].count),
    last7d: parseInt(last7dResult.rows[0].count),
    oldestEntry: oldestResult.rows[0]?.created_at?.toISOString() || null,
    newestEntry: newestResult.rows[0]?.created_at?.toISOString() || null
  };
}

async function verifyChainIntegrityFromDB() {
  const result = await pool.query(
    `SELECT id, hash, previous_hash FROM audit_entries ORDER BY created_at ASC`
  );
  
  const errors = [];
  
  for (let i = 1; i < result.rows.length; i++) {
    const current = result.rows[i];
    const previous = result.rows[i - 1];
    
    if (current.previous_hash !== previous.hash) {
      errors.push({
        index: i,
        entryId: current.id,
        expectedPreviousHash: previous.hash,
        actualPreviousHash: current.previous_hash,
        message: 'Hash chain broken - possible tampering detected'
      });
    }
  }
  
  return {
    verified: errors.length === 0,
    entriesChecked: result.rows.length,
    errors
  };
}

async function persistSecurityEvent(event) {
  await pool.query(`
    INSERT INTO security_events (id, type, ip, path, data, severity, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    event.id,
    event.type,
    event.ip || null,
    event.path || null,
    JSON.stringify(event.data || {}),
    event.severity || 'INFO',
    new Date(event.timestamp)
  ]);
  
  return event;
}

async function loadSecurityEvents(limit = 100) {
  const result = await pool.query(
    `SELECT * FROM security_events ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    ip: row.ip,
    path: row.path,
    data: row.data,
    severity: row.severity,
    timestamp: row.created_at.toISOString()
  }));
}

module.exports = {
  persistAuditEntry,
  loadAuditEntries,
  getAuditStats,
  verifyChainIntegrityFromDB,
  persistSecurityEvent,
  loadSecurityEvents,
  pool
};
