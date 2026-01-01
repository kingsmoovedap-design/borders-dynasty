"use strict";

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function persistBuyback(buyback) {
  await pool.query(`
    INSERT INTO bsc_buybacks (id, partner_id, partner_type, bsc_amount, fiat_amount, fiat_currency, exchange_rate, status, tx_hash, payout_method, payout_details, processed_at, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (id) DO UPDATE SET
      status = $8,
      tx_hash = $9,
      processed_at = $12
  `, [
    buyback.id,
    buyback.partnerId,
    buyback.partnerType,
    buyback.bscAmount,
    buyback.fiatAmount,
    buyback.fiatCurrency || 'USD',
    buyback.exchangeRate,
    buyback.status,
    buyback.txHash,
    buyback.payoutMethod,
    JSON.stringify(buyback.payoutDetails),
    buyback.processedAt ? new Date(buyback.processedAt) : null,
    new Date(buyback.createdAt || Date.now())
  ]);
  
  return buyback;
}

async function loadBuyback(buybackId) {
  const result = await pool.query(
    `SELECT * FROM bsc_buybacks WHERE id = $1`,
    [buybackId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    partnerId: row.partner_id,
    partnerType: row.partner_type,
    bscAmount: parseFloat(row.bsc_amount),
    fiatAmount: parseFloat(row.fiat_amount),
    fiatCurrency: row.fiat_currency,
    exchangeRate: parseFloat(row.exchange_rate),
    status: row.status,
    txHash: row.tx_hash,
    payoutMethod: row.payout_method,
    payoutDetails: row.payout_details,
    processedAt: row.processed_at,
    createdAt: row.created_at,
  };
}

async function loadPartnerBuybacks(partnerId) {
  const result = await pool.query(
    `SELECT * FROM bsc_buybacks WHERE partner_id = $1 ORDER BY created_at DESC`,
    [partnerId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    partnerId: row.partner_id,
    bscAmount: parseFloat(row.bsc_amount),
    fiatAmount: parseFloat(row.fiat_amount),
    status: row.status,
    createdAt: row.created_at,
  }));
}

async function persistBridgeTransaction(transaction) {
  await pool.query(`
    INSERT INTO bridge_transactions (id, user_id, direction, source_chain, dest_chain, source_token, dest_token, amount, bridge_fee, source_tx_hash, dest_tx_hash, status, created_at, completed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (id) DO UPDATE SET
      source_tx_hash = $10,
      dest_tx_hash = $11,
      status = $12,
      completed_at = $14
  `, [
    transaction.id,
    transaction.userId,
    transaction.direction,
    transaction.sourceChain,
    transaction.destChain,
    transaction.sourceToken,
    transaction.destToken,
    transaction.amount,
    transaction.bridgeFee,
    transaction.sourceTxHash,
    transaction.destTxHash,
    transaction.status,
    new Date(transaction.createdAt || Date.now()),
    transaction.completedAt ? new Date(transaction.completedAt) : null
  ]);
  
  return transaction;
}

async function loadBridgeTransaction(bridgeId) {
  const result = await pool.query(
    `SELECT * FROM bridge_transactions WHERE id = $1`,
    [bridgeId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    direction: row.direction,
    sourceChain: row.source_chain,
    destChain: row.dest_chain,
    sourceToken: row.source_token,
    destToken: row.dest_token,
    amount: parseFloat(row.amount),
    bridgeFee: parseFloat(row.bridge_fee || 0),
    sourceTxHash: row.source_tx_hash,
    destTxHash: row.dest_tx_hash,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

async function loadUserBridgeTransactions(userId) {
  const result = await pool.query(
    `SELECT * FROM bridge_transactions WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    sourceChain: row.source_chain,
    destChain: row.dest_chain,
    amount: parseFloat(row.amount),
    status: row.status,
    createdAt: row.created_at,
  }));
}

async function persistFiatTransaction(transaction) {
  await pool.query(`
    INSERT INTO fiat_transactions (id, user_id, type, crypto_amount, crypto_token, fiat_amount, fiat_currency, exchange_rate, provider, provider_tx_id, status, metadata, created_at, completed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (id) DO UPDATE SET
      provider_tx_id = $10,
      status = $11,
      completed_at = $14
  `, [
    transaction.id,
    transaction.userId,
    transaction.type,
    transaction.cryptoAmount,
    transaction.cryptoToken,
    transaction.fiatAmount,
    transaction.fiatCurrency,
    transaction.exchangeRate,
    transaction.provider,
    transaction.providerTxId,
    transaction.status,
    JSON.stringify(transaction.metadata || {}),
    new Date(transaction.createdAt || Date.now()),
    transaction.completedAt ? new Date(transaction.completedAt) : null
  ]);
  
  return transaction;
}

async function loadFiatTransaction(transactionId) {
  const result = await pool.query(
    `SELECT * FROM fiat_transactions WHERE id = $1`,
    [transactionId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    cryptoAmount: parseFloat(row.crypto_amount),
    cryptoToken: row.crypto_token,
    fiatAmount: parseFloat(row.fiat_amount),
    fiatCurrency: row.fiat_currency,
    exchangeRate: parseFloat(row.exchange_rate),
    provider: row.provider,
    providerTxId: row.provider_tx_id,
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

async function loadUserFiatTransactions(userId) {
  const result = await pool.query(
    `SELECT * FROM fiat_transactions WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    cryptoAmount: parseFloat(row.crypto_amount),
    fiatAmount: parseFloat(row.fiat_amount),
    provider: row.provider,
    status: row.status,
    createdAt: row.created_at,
  }));
}

async function getBridgeStats() {
  const result = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM bridge_transactions) as total_bridge,
      (SELECT COUNT(*) FROM bridge_transactions WHERE status = 'COMPLETED') as completed_bridge,
      (SELECT COALESCE(SUM(amount), 0) FROM bridge_transactions) as total_bridge_volume,
      (SELECT COUNT(*) FROM bsc_buybacks) as total_buybacks,
      (SELECT COUNT(*) FROM bsc_buybacks WHERE status = 'COMPLETED') as completed_buybacks,
      (SELECT COALESCE(SUM(bsc_amount), 0) FROM bsc_buybacks) as total_bsc_bought,
      (SELECT COALESCE(SUM(fiat_amount), 0) FROM bsc_buybacks WHERE status = 'COMPLETED') as total_fiat_paid,
      (SELECT COUNT(*) FROM fiat_transactions) as total_fiat,
      (SELECT COUNT(*) FROM fiat_transactions WHERE type = 'BUY') as fiat_buys,
      (SELECT COUNT(*) FROM fiat_transactions WHERE type = 'SELL') as fiat_sells
  `);
  
  const row = result.rows[0];
  return {
    bridgeTransactions: {
      total: parseInt(row.total_bridge),
      completed: parseInt(row.completed_bridge),
      totalVolume: parseFloat(row.total_bridge_volume),
    },
    buybacks: {
      total: parseInt(row.total_buybacks),
      completed: parseInt(row.completed_buybacks),
      totalBSC: parseFloat(row.total_bsc_bought),
      totalFiat: parseFloat(row.total_fiat_paid),
    },
    fiatTransactions: {
      total: parseInt(row.total_fiat),
      buys: parseInt(row.fiat_buys),
      sells: parseInt(row.fiat_sells),
    },
  };
}

module.exports = {
  persistBuyback,
  loadBuyback,
  loadPartnerBuybacks,
  persistBridgeTransaction,
  loadBridgeTransaction,
  loadUserBridgeTransactions,
  persistFiatTransaction,
  loadFiatTransaction,
  loadUserFiatTransactions,
  getBridgeStats,
};
