"use strict";

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function persistOperator(operator) {
  await pool.query(`
    INSERT INTO mobile_operators (id, user_id, name, email, phone, home_base, home_coords, equipment, operator_type, status, notification_prefs, current_location, route_to_home, active_load_id, wallet_address, bsc_balance, push_token, last_seen, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    ON CONFLICT (id) DO UPDATE SET
      current_location = $12,
      route_to_home = $13,
      active_load_id = $14,
      bsc_balance = $16,
      last_seen = $18
  `, [
    operator.id,
    operator.userId,
    operator.name,
    operator.email,
    operator.phone,
    operator.homeBase,
    JSON.stringify(operator.homeCoords),
    operator.equipment,
    operator.operatorType?.id || operator.operatorType,
    operator.status,
    JSON.stringify(operator.notificationPrefs),
    JSON.stringify(operator.currentLocation),
    JSON.stringify(operator.routeToHome),
    operator.activeLoadId,
    operator.walletAddress,
    operator.bscBalance || 0,
    operator.pushToken,
    new Date(operator.lastSeen || Date.now()),
    new Date(operator.createdAt || Date.now())
  ]);
  
  return operator;
}

async function loadOperator(operatorId) {
  const result = await pool.query(
    `SELECT * FROM mobile_operators WHERE id = $1`,
    [operatorId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    homeBase: row.home_base,
    homeCoords: row.home_coords,
    equipment: row.equipment,
    operatorType: row.operator_type,
    status: row.status,
    notificationPrefs: row.notification_prefs,
    currentLocation: row.current_location,
    routeToHome: row.route_to_home,
    activeLoadId: row.active_load_id,
    walletAddress: row.wallet_address,
    bscBalance: parseFloat(row.bsc_balance || 0),
    pushToken: row.push_token,
    lastSeen: row.last_seen,
    createdAt: row.created_at,
  };
}

async function loadAllOperators(filters = {}) {
  let query = `SELECT * FROM mobile_operators WHERE 1=1`;
  const params = [];
  let paramIndex = 1;
  
  if (filters.status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters.type) {
    query += ` AND operator_type = $${paramIndex++}`;
    params.push(filters.type);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
  params.push(filters.limit || 100);
  
  const result = await pool.query(query, params);
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    homeBase: row.home_base,
    operatorType: row.operator_type,
    status: row.status,
    lastSeen: row.last_seen,
  }));
}

async function persistNotification(notification) {
  await pool.query(`
    INSERT INTO load_notifications (id, operator_id, load_id, type, title, message, rate, distance, deadhead_miles, home_direction_score, expires_at, status, viewed_at, responded_at, response, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (id) DO UPDATE SET
      status = $12,
      viewed_at = $13,
      responded_at = $14,
      response = $15
  `, [
    notification.id,
    notification.operatorId,
    notification.loadId,
    notification.type?.id || notification.type,
    notification.title,
    notification.message,
    notification.metrics?.rate || notification.rate,
    notification.metrics?.distance || notification.distance,
    notification.metrics?.deadheadMiles || notification.deadheadMiles,
    notification.metrics?.homeDirectionScore || notification.homeDirectionScore,
    new Date(notification.expiresAt),
    notification.status,
    notification.viewedAt ? new Date(notification.viewedAt) : null,
    notification.respondedAt ? new Date(notification.respondedAt) : null,
    notification.response,
    new Date(notification.createdAt || Date.now())
  ]);
  
  return notification;
}

async function loadNotification(notificationId) {
  const result = await pool.query(
    `SELECT * FROM load_notifications WHERE id = $1`,
    [notificationId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    operatorId: row.operator_id,
    loadId: row.load_id,
    type: row.type,
    title: row.title,
    message: row.message,
    rate: parseFloat(row.rate || 0),
    distance: parseFloat(row.distance || 0),
    deadheadMiles: parseFloat(row.deadhead_miles || 0),
    homeDirectionScore: row.home_direction_score,
    expiresAt: row.expires_at,
    status: row.status,
    viewedAt: row.viewed_at,
    respondedAt: row.responded_at,
    response: row.response,
    createdAt: row.created_at,
  };
}

async function loadOperatorNotifications(operatorId, filters = {}) {
  let query = `SELECT * FROM load_notifications WHERE operator_id = $1`;
  const params = [operatorId];
  let paramIndex = 2;
  
  if (filters.status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters.pending) {
    query += ` AND status = 'PENDING' AND expires_at > NOW()`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
  params.push(filters.limit || 50);
  
  const result = await pool.query(query, params);
  return result.rows.map(row => ({
    id: row.id,
    operatorId: row.operator_id,
    loadId: row.load_id,
    type: row.type,
    title: row.title,
    message: row.message,
    status: row.status,
    homeDirectionScore: row.home_direction_score,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

async function getOperatorStats() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
      (SELECT COUNT(*) FROM load_notifications WHERE status = 'PENDING' AND expires_at > NOW()) as pending_notifications,
      (SELECT COUNT(*) FROM load_notifications WHERE status = 'ACCEPTED') as accepted,
      (SELECT COUNT(*) FROM load_notifications WHERE status = 'DECLINED') as declined
    FROM mobile_operators
  `);
  
  const row = result.rows[0];
  return {
    totalOperators: parseInt(row.total),
    activeOperators: parseInt(row.active),
    pendingNotifications: parseInt(row.pending_notifications),
    acceptedNotifications: parseInt(row.accepted),
    declinedNotifications: parseInt(row.declined),
  };
}

module.exports = {
  persistOperator,
  loadOperator,
  loadAllOperators,
  persistNotification,
  loadNotification,
  loadOperatorNotifications,
  getOperatorStats,
};
