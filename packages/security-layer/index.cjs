const crypto = require("crypto");

const SECURITY_CONFIG = {
  rateLimiting: {
    windowMs: 60000,
    maxRequests: 100,
    blockDuration: 300000
  },
  bruteForce: {
    maxAttempts: 5,
    lockoutDuration: 900000
  },
  encryption: {
    algorithm: "aes-256-gcm",
    keyLength: 32,
    ivLength: 16,
    authTagLength: 16
  },
  session: {
    maxAge: 86400000,
    renewalThreshold: 3600000
  },
  apiKey: {
    length: 32,
    hashRounds: 12
  }
};

const THREAT_LEVELS = {
  NONE: { level: 0, action: "ALLOW" },
  LOW: { level: 1, action: "LOG" },
  MEDIUM: { level: 2, action: "RATE_LIMIT" },
  HIGH: { level: 3, action: "CHALLENGE" },
  CRITICAL: { level: 4, action: "BLOCK" }
};

const rateLimitStore = new Map();
const blockedIPs = new Map();
const failedAttempts = new Map();
const anomalyPatterns = new Map();

function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

function hashData(data, salt = null) {
  const useSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(data + useSalt).digest("hex");
  return { hash, salt: useSalt };
}

function verifyHash(data, hash, salt) {
  const computed = crypto.createHash("sha256").update(data + salt).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

function encryptData(data, key) {
  const iv = crypto.randomBytes(SECURITY_CONFIG.encryption.ivLength);
  const cipher = crypto.createCipheriv(SECURITY_CONFIG.encryption.algorithm, Buffer.from(key, "hex"), iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex")
  };
}

function decryptData(encryptedData, key) {
  try {
    const decipher = crypto.createDecipheriv(
      SECURITY_CONFIG.encryption.algorithm,
      Buffer.from(key, "hex"),
      Buffer.from(encryptedData.iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));
    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

function checkRateLimit(ip, endpoint = "default") {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowStart = now - SECURITY_CONFIG.rateLimiting.windowMs;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key).filter(t => t > windowStart);
  requests.push(now);
  rateLimitStore.set(key, requests);

  const isLimited = requests.length > SECURITY_CONFIG.rateLimiting.maxRequests;
  
  if (isLimited) {
    blockedIPs.set(ip, {
      reason: "RATE_LIMIT_EXCEEDED",
      blockedAt: now,
      expiresAt: now + SECURITY_CONFIG.rateLimiting.blockDuration
    });
  }

  return {
    allowed: !isLimited,
    remaining: Math.max(0, SECURITY_CONFIG.rateLimiting.maxRequests - requests.length),
    resetAt: new Date(windowStart + SECURITY_CONFIG.rateLimiting.windowMs).toISOString()
  };
}

function isBlocked(ip) {
  const block = blockedIPs.get(ip);
  if (!block) return false;
  
  if (Date.now() > block.expiresAt) {
    blockedIPs.delete(ip);
    return false;
  }
  
  return true;
}

function blockIP(ip, reason, duration = SECURITY_CONFIG.rateLimiting.blockDuration) {
  const now = Date.now();
  blockedIPs.set(ip, {
    reason,
    blockedAt: now,
    expiresAt: now + duration,
    manual: true
  });
  return { blocked: true, ip, reason, expiresAt: new Date(now + duration).toISOString() };
}

function unblockIP(ip) {
  const wasBlocked = blockedIPs.has(ip);
  blockedIPs.delete(ip);
  return { unblocked: wasBlocked, ip };
}

function recordFailedAttempt(identifier, type = "auth") {
  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  if (!failedAttempts.has(key)) {
    failedAttempts.set(key, []);
  }
  
  const attempts = failedAttempts.get(key);
  attempts.push(now);
  
  const recentAttempts = attempts.filter(t => t > now - SECURITY_CONFIG.bruteForce.lockoutDuration);
  failedAttempts.set(key, recentAttempts);
  
  const isLockedOut = recentAttempts.length >= SECURITY_CONFIG.bruteForce.maxAttempts;
  
  return {
    attempts: recentAttempts.length,
    maxAttempts: SECURITY_CONFIG.bruteForce.maxAttempts,
    lockedOut: isLockedOut,
    lockoutEnds: isLockedOut ? new Date(recentAttempts[0] + SECURITY_CONFIG.bruteForce.lockoutDuration).toISOString() : null
  };
}

function clearFailedAttempts(identifier, type = "auth") {
  const key = `${type}:${identifier}`;
  failedAttempts.delete(key);
}

function detectAnomaly(ip, requestPattern) {
  const now = Date.now();
  const key = ip;
  
  if (!anomalyPatterns.has(key)) {
    anomalyPatterns.set(key, {
      patterns: [],
      baselineEstablished: false,
      anomalyScore: 0
    });
  }
  
  const ipData = anomalyPatterns.get(key);
  ipData.patterns.push({
    timestamp: now,
    ...requestPattern
  });
  
  if (ipData.patterns.length > 100) {
    ipData.patterns = ipData.patterns.slice(-100);
  }
  
  let anomalyScore = 0;
  
  if (requestPattern.userAgent && requestPattern.userAgent.toLowerCase().includes("bot")) {
    anomalyScore += 20;
  }
  
  if (requestPattern.path && requestPattern.path.includes("../")) {
    anomalyScore += 50;
  }
  
  if (requestPattern.path && /\.(php|asp|aspx|jsp)$/i.test(requestPattern.path)) {
    anomalyScore += 30;
  }
  
  if (requestPattern.payload && JSON.stringify(requestPattern.payload).includes("<script")) {
    anomalyScore += 60;
  }
  
  const recentPatterns = ipData.patterns.filter(p => p.timestamp > now - 60000);
  if (recentPatterns.length > 60) {
    anomalyScore += 40;
  }
  
  ipData.anomalyScore = anomalyScore;
  
  let threatLevel = THREAT_LEVELS.NONE;
  if (anomalyScore >= 80) threatLevel = THREAT_LEVELS.CRITICAL;
  else if (anomalyScore >= 50) threatLevel = THREAT_LEVELS.HIGH;
  else if (anomalyScore >= 30) threatLevel = THREAT_LEVELS.MEDIUM;
  else if (anomalyScore >= 10) threatLevel = THREAT_LEVELS.LOW;
  
  return {
    anomalyScore,
    threatLevel,
    recommendation: threatLevel.action
  };
}

function generateAPIKey(partnerId) {
  const key = generateSecureToken(SECURITY_CONFIG.apiKey.length);
  const { hash, salt } = hashData(key);
  
  return {
    key,
    keyPrefix: key.substring(0, 8),
    hash,
    salt,
    partnerId,
    createdAt: new Date().toISOString()
  };
}

function validateAPIKey(providedKey, storedHash, storedSalt) {
  return verifyHash(providedKey, storedHash, storedSalt);
}

function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/[<>]/g, "")
    .trim();
}

function validateRequestOrigin(origin, allowedOrigins) {
  if (!origin) return false;
  return allowedOrigins.some(allowed => {
    if (allowed === "*") return true;
    if (allowed.startsWith("*.")) {
      const domain = allowed.substring(2);
      return origin.endsWith(domain);
    }
    return origin === allowed;
  });
}

function getSecurityStatus() {
  const now = Date.now();
  const activeBlocks = Array.from(blockedIPs.entries())
    .filter(([_, block]) => block.expiresAt > now)
    .map(([ip, block]) => ({ ip, ...block }));
  
  return {
    blockedIPs: activeBlocks.length,
    activeBlocks,
    rateLimitEntries: rateLimitStore.size,
    failedAttemptTracking: failedAttempts.size,
    anomalyTracking: anomalyPatterns.size,
    config: {
      rateLimitWindow: SECURITY_CONFIG.rateLimiting.windowMs / 1000 + "s",
      maxRequests: SECURITY_CONFIG.rateLimiting.maxRequests,
      bruteForceThreshold: SECURITY_CONFIG.bruteForce.maxAttempts
    }
  };
}

function cleanupExpiredData() {
  const now = Date.now();
  
  for (const [ip, block] of blockedIPs.entries()) {
    if (block.expiresAt < now) {
      blockedIPs.delete(ip);
    }
  }
  
  for (const [key, requests] of rateLimitStore.entries()) {
    const valid = requests.filter(t => t > now - SECURITY_CONFIG.rateLimiting.windowMs);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, valid);
    }
  }
  
  for (const [key, attempts] of failedAttempts.entries()) {
    const valid = attempts.filter(t => t > now - SECURITY_CONFIG.bruteForce.lockoutDuration);
    if (valid.length === 0) {
      failedAttempts.delete(key);
    } else {
      failedAttempts.set(key, valid);
    }
  }
  
  return { cleaned: true, timestamp: new Date().toISOString() };
}

setInterval(cleanupExpiredData, 300000);

module.exports = {
  SECURITY_CONFIG,
  THREAT_LEVELS,
  generateSecureToken,
  hashData,
  verifyHash,
  encryptData,
  decryptData,
  checkRateLimit,
  isBlocked,
  blockIP,
  unblockIP,
  recordFailedAttempt,
  clearFailedAttempts,
  detectAnomaly,
  generateAPIKey,
  validateAPIKey,
  sanitizeInput,
  validateRequestOrigin,
  getSecurityStatus,
  cleanupExpiredData
};
