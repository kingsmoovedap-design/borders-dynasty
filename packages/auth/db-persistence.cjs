const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function persistSession(session) {
  const accessTokenHash = crypto.createHash('sha256').update(session.accessToken).digest('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(session.refreshToken).digest('hex');
  
  await pool.query(`
    INSERT INTO auth_sessions (id, user_id, role, access_token_hash, refresh_token_hash, metadata, last_activity, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      access_token_hash = $4,
      last_activity = $7,
      expires_at = $8
  `, [
    session.id,
    session.userId,
    session.role,
    accessTokenHash,
    refreshTokenHash,
    JSON.stringify(session.metadata || {}),
    new Date(session.lastActivity),
    new Date(session.expiresAt)
  ]);
  
  return session;
}

async function loadSession(sessionId) {
  const result = await pool.query(
    `SELECT * FROM auth_sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    metadata: row.metadata,
    lastActivity: row.last_activity.toISOString(),
    expiresAt: row.expires_at.toISOString()
  };
}

async function deleteSession(sessionId) {
  await pool.query(`DELETE FROM auth_sessions WHERE id = $1`, [sessionId]);
}

async function persistApiKey(keyData) {
  await pool.query(`
    INSERT INTO api_keys (id, partner_id, partner_name, secret_hash, permissions, rate_limit, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET
      status = $7,
      last_used = NOW()
  `, [
    keyData.keyId,
    keyData.partnerId,
    keyData.partnerName,
    keyData.secretHash,
    JSON.stringify(keyData.permissions),
    keyData.rateLimit,
    keyData.status
  ]);
  
  return keyData;
}

async function loadApiKey(keyId) {
  const result = await pool.query(
    `SELECT * FROM api_keys WHERE id = $1 AND status = 'ACTIVE'`,
    [keyId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    keyId: row.id,
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    secretHash: row.secret_hash,
    permissions: row.permissions,
    rateLimit: row.rate_limit,
    status: row.status,
    lastUsed: row.last_used?.toISOString(),
    usageCount: row.usage_count
  };
}

async function loadAllApiKeys(partnerId = null) {
  let query = `SELECT * FROM api_keys`;
  const params = [];
  
  if (partnerId) {
    query += ` WHERE partner_id = $1`;
    params.push(partnerId);
  }
  
  const result = await pool.query(query, params);
  
  return result.rows.map(row => ({
    keyId: row.id,
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    permissions: row.permissions,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    lastUsed: row.last_used?.toISOString(),
    usageCount: row.usage_count
  }));
}

async function updateApiKeyStatus(keyId, status) {
  await pool.query(`UPDATE api_keys SET status = $2 WHERE id = $1`, [keyId, status]);
}

async function updateApiKeyUsage(keyId) {
  await pool.query(`
    UPDATE api_keys 
    SET last_used = NOW(), usage_count = usage_count + 1 
    WHERE id = $1
  `, [keyId]);
}

async function cleanupExpiredSessions() {
  await pool.query(`DELETE FROM auth_sessions WHERE expires_at < NOW()`);
}

module.exports = {
  persistSession,
  loadSession,
  deleteSession,
  persistApiKey,
  loadApiKey,
  loadAllApiKeys,
  updateApiKeyStatus,
  updateApiKeyUsage,
  cleanupExpiredSessions,
  pool
};
