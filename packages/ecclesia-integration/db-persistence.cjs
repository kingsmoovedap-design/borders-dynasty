"use strict";

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function persistAnchor(anchor) {
  await pool.query(`
    INSERT INTO ecclesia_anchors (id, event_type, module, category, local_hash, ecclesia_scroll_id, ecclesia_hash, anchor_status, retry_count, payload, created_at, anchored_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (id) DO UPDATE SET
      ecclesia_scroll_id = $6,
      ecclesia_hash = $7,
      anchor_status = $8,
      retry_count = $9,
      anchored_at = $12
  `, [
    anchor.id,
    anchor.eventType,
    anchor.module,
    anchor.category,
    anchor.localHash,
    anchor.ecclesiaScrollId,
    anchor.ecclesiaHash,
    anchor.anchorStatus,
    anchor.retryCount || 0,
    JSON.stringify(anchor.payload),
    new Date(anchor.createdAt || Date.now()),
    anchor.anchoredAt ? new Date(anchor.anchoredAt) : null
  ]);
  
  return anchor;
}

async function loadAnchor(anchorId) {
  const result = await pool.query(
    `SELECT * FROM ecclesia_anchors WHERE id = $1`,
    [anchorId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    eventType: row.event_type,
    module: row.module,
    category: row.category,
    localHash: row.local_hash,
    ecclesiaScrollId: row.ecclesia_scroll_id,
    ecclesiaHash: row.ecclesia_hash,
    anchorStatus: row.anchor_status,
    retryCount: row.retry_count,
    payload: row.payload,
    createdAt: row.created_at,
    anchoredAt: row.anchored_at,
  };
}

async function loadAnchorByScrollId(scrollId) {
  const result = await pool.query(
    `SELECT * FROM ecclesia_anchors WHERE ecclesia_scroll_id = $1`,
    [scrollId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    eventType: row.event_type,
    module: row.module,
    category: row.category,
    localHash: row.local_hash,
    ecclesiaScrollId: row.ecclesia_scroll_id,
    ecclesiaHash: row.ecclesia_hash,
    anchorStatus: row.anchor_status,
    createdAt: row.created_at,
    anchoredAt: row.anchored_at,
  };
}

async function loadPendingAnchors() {
  const result = await pool.query(
    `SELECT * FROM ecclesia_anchors WHERE anchor_status = 'PENDING' OR anchor_status = 'FAILED' ORDER BY created_at DESC`
  );
  
  return result.rows.map(row => ({
    id: row.id,
    eventType: row.event_type,
    module: row.module,
    anchorStatus: row.anchor_status,
    retryCount: row.retry_count,
    createdAt: row.created_at,
  }));
}

async function loadAnchoredScrolls(filters = {}) {
  let query = `SELECT * FROM ecclesia_anchors WHERE anchor_status = 'ANCHORED'`;
  const params = [];
  let paramIndex = 1;
  
  if (filters.category) {
    query += ` AND category = $${paramIndex++}`;
    params.push(filters.category);
  }
  if (filters.module) {
    query += ` AND module = $${paramIndex++}`;
    params.push(filters.module);
  }
  if (filters.eventType) {
    query += ` AND event_type = $${paramIndex++}`;
    params.push(filters.eventType);
  }
  
  query += ` ORDER BY anchored_at DESC LIMIT $${paramIndex}`;
  params.push(filters.limit || 100);
  
  const result = await pool.query(query, params);
  return result.rows.map(row => ({
    id: row.id,
    eventType: row.event_type,
    module: row.module,
    category: row.category,
    localHash: row.local_hash,
    ecclesiaScrollId: row.ecclesia_scroll_id,
    ecclesiaHash: row.ecclesia_hash,
    anchoredAt: row.anchored_at,
  }));
}

async function getEcclesiaStats() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE anchor_status = 'ANCHORED') as total_anchored,
      COUNT(*) FILTER (WHERE anchor_status = 'PENDING') as pending,
      COUNT(*) FILTER (WHERE anchor_status = 'FAILED') as failed,
      MAX(anchored_at) FILTER (WHERE anchor_status = 'ANCHORED') as last_anchor
    FROM ecclesia_anchors
  `);
  
  const row = result.rows[0];
  
  const categoryResult = await pool.query(`
    SELECT category, COUNT(*) as count
    FROM ecclesia_anchors
    WHERE anchor_status = 'ANCHORED'
    GROUP BY category
  `);
  
  const byCategory = {};
  categoryResult.rows.forEach(r => {
    byCategory[r.category] = parseInt(r.count);
  });
  
  const moduleResult = await pool.query(`
    SELECT module, COUNT(*) as count
    FROM ecclesia_anchors
    WHERE anchor_status = 'ANCHORED'
    GROUP BY module
  `);
  
  const byModule = {};
  moduleResult.rows.forEach(r => {
    byModule[r.module] = parseInt(r.count);
  });
  
  return {
    totalAnchored: parseInt(row.total_anchored),
    pendingAnchors: parseInt(row.pending),
    failedAnchors: parseInt(row.failed),
    byCategory,
    byModule,
    lastAnchor: row.last_anchor,
  };
}

module.exports = {
  persistAnchor,
  loadAnchor,
  loadAnchorByScrollId,
  loadPendingAnchors,
  loadAnchoredScrolls,
  getEcclesiaStats,
};
