const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const Joi = require('joi');
const crypto = require('crypto');

const BLOCKED_IPS = new Map();
const REQUEST_LOG = new Map();
const ANOMALY_THRESHOLD = 100;
const BLOCK_DURATION = 15 * 60 * 1000;
const WINDOW_MS = 60 * 1000;

const securityEvents = [];

function logSecurityEvent(event) {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...event
  };
  securityEvents.push(entry);
  if (securityEvents.length > 10000) securityEvents.shift();
  return entry;
}

function getSecurityEvents(limit = 100) {
  return securityEvents.slice(-limit);
}

const ipBlocker = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const blocked = BLOCKED_IPS.get(ip);
  
  if (blocked && Date.now() < blocked.until) {
    logSecurityEvent({
      type: 'BLOCKED_REQUEST',
      ip,
      reason: blocked.reason,
      path: req.path
    });
    return res.status(403).json({ 
      error: 'ACCESS_DENIED',
      message: 'Your access has been temporarily restricted',
      retryAfter: Math.ceil((blocked.until - Date.now()) / 1000)
    });
  }
  
  if (blocked && Date.now() >= blocked.until) {
    BLOCKED_IPS.delete(ip);
  }
  
  next();
};

function blockIP(ip, reason, duration = BLOCK_DURATION) {
  BLOCKED_IPS.set(ip, {
    until: Date.now() + duration,
    reason,
    blockedAt: new Date().toISOString()
  });
  logSecurityEvent({
    type: 'IP_BLOCKED',
    ip,
    reason,
    duration
  });
}

function unblockIP(ip) {
  BLOCKED_IPS.delete(ip);
  logSecurityEvent({
    type: 'IP_UNBLOCKED',
    ip
  });
}

function getBlockedIPs() {
  const result = [];
  for (const [ip, data] of BLOCKED_IPS.entries()) {
    if (Date.now() < data.until) {
      result.push({ ip, ...data, remainingMs: data.until - Date.now() });
    }
  }
  return result;
}

const anomalyDetector = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  if (!REQUEST_LOG.has(ip)) {
    REQUEST_LOG.set(ip, []);
  }
  
  const requests = REQUEST_LOG.get(ip);
  requests.push({ time: now, path: req.path, method: req.method });
  
  const recentRequests = requests.filter(r => r.time > windowStart);
  REQUEST_LOG.set(ip, recentRequests);
  
  if (recentRequests.length > ANOMALY_THRESHOLD) {
    blockIP(ip, 'RATE_ANOMALY_DETECTED');
    logSecurityEvent({
      type: 'ANOMALY_DETECTED',
      ip,
      requestCount: recentRequests.length,
      threshold: ANOMALY_THRESHOLD,
      window: WINDOW_MS
    });
    return res.status(429).json({
      error: 'ANOMALY_DETECTED',
      message: 'Unusual activity detected. Access temporarily restricted.'
    });
  }
  
  next();
};

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || 'unknown';
    logSecurityEvent({
      type: 'RATE_LIMIT_HIT',
      ip,
      path: req.path
    });
    res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down.'
    });
  }
});

const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'RATE_LIMITED', message: 'Sensitive endpoint rate limited.' },
  standardHeaders: true,
  legacyHeaders: false
});

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.infura.io", "wss://*.infura.io"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

const inputSchemas = {
  createLoad: Joi.object({
    shipperId: Joi.string().required().max(100),
    origin: Joi.string().required().max(200),
    destination: Joi.string().required().max(200),
    mode: Joi.string().valid('GROUND', 'AIR', 'OCEAN', 'COURIER').required(),
    budgetAmount: Joi.number().positive().max(10000000).required(),
    region: Joi.string().valid('NORTH_AMERICA', 'EUROPE', 'ASIA_PACIFIC', 'LATAM').required(),
    serviceLevel: Joi.string().max(50).optional(),
    requirements: Joi.string().max(1000).optional()
  }),
  
  registerDriver: Joi.object({
    driverId: Joi.string().required().max(50),
    name: Joi.string().required().max(100),
    homeBase: Joi.string().required().max(100),
    equipment: Joi.string().required().max(100),
    walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional()
  }),
  
  creditAdvance: Joi.object({
    amount: Joi.number().positive().max(50000).required(),
    loadId: Joi.string().uuid().optional()
  }),
  
  assignDispatch: Joi.object({
    loadId: Joi.string().uuid().required(),
    driverId: Joi.string().required().max(50),
    method: Joi.string().valid('AI_SUGGESTED', 'MANUAL', 'BACKUP').default('MANUAL')
  }),
  
  acceptContract: Joi.object({
    loadId: Joi.string().uuid().required(),
    driverId: Joi.string().required().max(50)
  }),
  
  activateMode: Joi.object({
    mode: Joi.string().valid('GROUND', 'AIR', 'OCEAN', 'COURIER').required()
  }),
  
  activateRegion: Joi.object({
    region: Joi.string().valid('NORTH_AMERICA', 'EUROPE', 'ASIA_PACIFIC', 'LATAM').required()
  }),
  
  stagedLaunch: Joi.object({
    stage: Joi.string().valid('LOCAL', 'NATIONWIDE', 'GLOBAL').required()
  }),
  
  escrowDeposit: Joi.object({
    loadId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    depositorAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
  })
};

function validateInput(schemaName) {
  return (req, res, next) => {
    const schema = inputSchemas[schemaName];
    if (!schema) {
      return next();
    }
    
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const ip = req.ip || 'unknown';
      logSecurityEvent({
        type: 'VALIDATION_FAILED',
        ip,
        path: req.path,
        errors: error.details.map(d => d.message)
      });
      
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }
    
    req.body = value;
    next();
  };
}

function sanitizeInput(obj) {
  if (typeof obj === 'string') {
    return obj
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim()
      .slice(0, 10000);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const safeKey = key.replace(/[^\w.-]/g, '').slice(0, 100);
      result[safeKey] = sanitizeInput(value);
    }
    return result;
  }
  return obj;
}

const sanitizer = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  next();
};

function generateRequestSignature(req) {
  const data = `${req.method}:${req.path}:${JSON.stringify(req.body || {})}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

const requestLogger = (req, res, next) => {
  const requestId = generateRequestSignature(req);
  req.requestId = requestId;
  req.startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (duration > 5000 || res.statusCode >= 400) {
      logSecurityEvent({
        type: 'REQUEST_LOGGED',
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip || 'unknown'
      });
    }
  });
  
  next();
};

const corsConfig = {
  origin: (origin, callback) => {
    const allowedPatterns = [
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https?:\/\/.*\.repl\.co$/,
      /^https?:\/\/.*\.replit\.dev$/,
      /^https?:\/\/.*\.replit\.app$/
    ];
    
    if (!origin || allowedPatterns.some(p => p.test(origin))) {
      callback(null, true);
    } else {
      logSecurityEvent({
        type: 'CORS_REJECTED',
        origin
      });
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
  maxAge: 86400
};

function createSecurityMiddleware() {
  return [
    ipBlocker,
    anomalyDetector,
    securityHeaders,
    sanitizer,
    requestLogger,
    apiRateLimiter
  ];
}

function selfProtectionLoop() {
  setInterval(() => {
    const now = Date.now();
    
    for (const [ip, data] of BLOCKED_IPS.entries()) {
      if (now >= data.until) {
        BLOCKED_IPS.delete(ip);
      }
    }
    
    for (const [ip, requests] of REQUEST_LOG.entries()) {
      const recent = requests.filter(r => r.time > now - WINDOW_MS);
      if (recent.length === 0) {
        REQUEST_LOG.delete(ip);
      } else {
        REQUEST_LOG.set(ip, recent);
      }
    }
    
    const recentEvents = securityEvents.filter(e => 
      new Date(e.timestamp).getTime() > now - 5 * 60 * 1000
    );
    
    const anomalies = recentEvents.filter(e => 
      e.type === 'ANOMALY_DETECTED' || 
      e.type === 'VALIDATION_FAILED' ||
      e.type === 'RATE_LIMIT_HIT'
    );
    
    if (anomalies.length > 50) {
      logSecurityEvent({
        type: 'ELEVATED_THREAT_LEVEL',
        anomalyCount: anomalies.length,
        message: 'Elevated security threat detected - monitoring intensified'
      });
    }
  }, 30000);
}

selfProtectionLoop();

module.exports = {
  createSecurityMiddleware,
  validateInput,
  inputSchemas,
  blockIP,
  unblockIP,
  getBlockedIPs,
  logSecurityEvent,
  getSecurityEvents,
  apiRateLimiter,
  strictRateLimiter,
  securityHeaders,
  sanitizer,
  ipBlocker,
  anomalyDetector,
  requestLogger,
  corsConfig,
  BLOCKED_IPS,
  REQUEST_LOG
};
