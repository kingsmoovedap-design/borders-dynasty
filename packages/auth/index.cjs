const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dynasty-omega-secret-' + crypto.randomBytes(16).toString('hex');
const JWT_EXPIRY = '4h';
const REFRESH_EXPIRY = '7d';

const sessions = new Map();
const apiKeys = new Map();
const accessLogs = [];

const ROLES = {
  OMEGA: { level: 100, name: 'Omega Leadership', permissions: ['*'] },
  ADMIN: { level: 80, name: 'Administrator', permissions: ['ops', 'treasury', 'dispatch', 'drivers', 'loads'] },
  OPS: { level: 60, name: 'Operations', permissions: ['dispatch', 'drivers', 'loads', 'loadboard'] },
  SHIPPER: { level: 40, name: 'Shipper', permissions: ['loads', 'contracts', 'loadboard:shipper'] },
  DRIVER: { level: 20, name: 'Driver', permissions: ['loads:assigned', 'credit', 'wallet'] },
  PARTNER: { level: 30, name: 'Partner API', permissions: ['loads:create', 'loads:read', 'contracts'] }
};

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(payload, expiresIn = JWT_EXPIRY) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function createSession(userId, role, metadata = {}) {
  const sessionId = crypto.randomUUID();
  const accessToken = generateToken({ 
    sessionId, 
    userId, 
    role,
    type: 'access'
  });
  const refreshToken = generateToken({ 
    sessionId, 
    userId, 
    type: 'refresh' 
  }, REFRESH_EXPIRY);
  
  const session = {
    id: sessionId,
    userId,
    role,
    accessToken,
    refreshToken,
    metadata,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
  };
  
  sessions.set(sessionId, session);
  
  logAccess({
    type: 'SESSION_CREATED',
    userId,
    role,
    sessionId
  });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRY,
    role,
    sessionId
  };
}

function validateSession(accessToken) {
  const decoded = verifyToken(accessToken);
  if (!decoded || decoded.type !== 'access') {
    return null;
  }
  
  const session = sessions.get(decoded.sessionId);
  if (!session) {
    return null;
  }
  
  session.lastActivity = new Date().toISOString();
  
  return {
    userId: decoded.userId,
    role: decoded.role,
    sessionId: decoded.sessionId,
    permissions: ROLES[decoded.role]?.permissions || []
  };
}

function refreshSession(refreshToken) {
  const decoded = verifyToken(refreshToken);
  if (!decoded || decoded.type !== 'refresh') {
    return null;
  }
  
  const session = sessions.get(decoded.sessionId);
  if (!session) {
    return null;
  }
  
  const newAccessToken = generateToken({
    sessionId: decoded.sessionId,
    userId: decoded.userId,
    role: session.role,
    type: 'access'
  });
  
  session.accessToken = newAccessToken;
  session.lastActivity = new Date().toISOString();
  session.expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  
  return {
    accessToken: newAccessToken,
    expiresIn: JWT_EXPIRY
  };
}

function revokeSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    logAccess({
      type: 'SESSION_REVOKED',
      userId: session.userId,
      sessionId
    });
    sessions.delete(sessionId);
    return true;
  }
  return false;
}

function generateApiKey(partnerId, partnerName, permissions = ['loads:create', 'loads:read']) {
  const keyId = `DYN-${partnerId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const secret = crypto.randomBytes(32).toString('base64url');
  const apiKey = `${keyId}.${secret}`;
  
  const keyData = {
    keyId,
    partnerId,
    partnerName,
    permissions,
    secretHash: hashPassword(secret),
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usageCount: 0,
    rateLimit: 100,
    rateLimitWindow: 60000,
    status: 'ACTIVE'
  };
  
  apiKeys.set(keyId, keyData);
  
  logAccess({
    type: 'API_KEY_CREATED',
    partnerId,
    keyId
  });
  
  return {
    apiKey,
    keyId,
    partnerId,
    permissions,
    rateLimit: keyData.rateLimit
  };
}

function validateApiKey(apiKey) {
  const [keyId, secret] = apiKey.split('.');
  if (!keyId || !secret) {
    return null;
  }
  
  const keyData = apiKeys.get(keyId);
  if (!keyData || keyData.status !== 'ACTIVE') {
    return null;
  }
  
  if (!verifyPassword(secret, keyData.secretHash)) {
    logAccess({
      type: 'API_KEY_INVALID',
      keyId,
      partnerId: keyData.partnerId
    });
    return null;
  }
  
  keyData.lastUsed = new Date().toISOString();
  keyData.usageCount++;
  
  return {
    keyId,
    partnerId: keyData.partnerId,
    partnerName: keyData.partnerName,
    permissions: keyData.permissions,
    role: 'PARTNER'
  };
}

function revokeApiKey(keyId) {
  const keyData = apiKeys.get(keyId);
  if (keyData) {
    keyData.status = 'REVOKED';
    logAccess({
      type: 'API_KEY_REVOKED',
      keyId,
      partnerId: keyData.partnerId
    });
    return true;
  }
  return false;
}

function listApiKeys(partnerId = null) {
  const keys = [];
  for (const [keyId, data] of apiKeys) {
    if (!partnerId || data.partnerId === partnerId) {
      keys.push({
        keyId,
        partnerId: data.partnerId,
        partnerName: data.partnerName,
        permissions: data.permissions,
        status: data.status,
        createdAt: data.createdAt,
        lastUsed: data.lastUsed,
        usageCount: data.usageCount
      });
    }
  }
  return keys;
}

function logAccess(event) {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...event
  };
  accessLogs.push(entry);
  if (accessLogs.length > 10000) accessLogs.shift();
  return entry;
}

function getAccessLogs(limit = 100, filters = {}) {
  let logs = [...accessLogs];
  
  if (filters.type) {
    logs = logs.filter(l => l.type === filters.type);
  }
  if (filters.userId) {
    logs = logs.filter(l => l.userId === filters.userId);
  }
  if (filters.partnerId) {
    logs = logs.filter(l => l.partnerId === filters.partnerId);
  }
  
  return logs.slice(-limit);
}

function hasPermission(role, requiredPermission) {
  const roleConfig = ROLES[role];
  if (!roleConfig) return false;
  
  if (roleConfig.permissions.includes('*')) return true;
  
  return roleConfig.permissions.some(p => {
    if (p === requiredPermission) return true;
    if (requiredPermission.includes(':')) {
      const [resource] = requiredPermission.split(':');
      return p === resource || p.startsWith(resource + ':');
    }
    return false;
  });
}

const authMiddleware = (requiredPermission = null) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    
    let authResult = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      authResult = validateSession(token);
      if (authResult) {
        authResult.authType = 'jwt';
      }
    } else if (apiKeyHeader) {
      authResult = validateApiKey(apiKeyHeader);
      if (authResult) {
        authResult.authType = 'apikey';
      }
    }
    
    if (!authResult) {
      logAccess({
        type: 'AUTH_FAILED',
        path: req.path,
        ip: req.ip
      });
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Valid authentication required' });
    }
    
    if (requiredPermission && !hasPermission(authResult.role, requiredPermission)) {
      logAccess({
        type: 'PERMISSION_DENIED',
        userId: authResult.userId || authResult.partnerId,
        role: authResult.role,
        requiredPermission,
        path: req.path
      });
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    
    req.auth = authResult;
    next();
  };
};

const omegaAuth = authMiddleware('*');

function authenticateOmega(accessCode) {
  const expectedCode = process.env.OMEGA_ACCESS_CODE || process.env.VITE_OMEGA_ACCESS_CODE;
  
  if (!expectedCode) {
    return { error: 'Omega access not configured' };
  }
  
  if (accessCode !== expectedCode) {
    logAccess({
      type: 'OMEGA_AUTH_FAILED'
    });
    return { error: 'Invalid access code' };
  }
  
  return createSession('omega-leadership', 'OMEGA', {
    source: 'omega-portal'
  });
}

module.exports = {
  ROLES,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  createSession,
  validateSession,
  refreshSession,
  revokeSession,
  generateApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,
  logAccess,
  getAccessLogs,
  hasPermission,
  authMiddleware,
  omegaAuth,
  authenticateOmega,
  sessions,
  apiKeys
};
