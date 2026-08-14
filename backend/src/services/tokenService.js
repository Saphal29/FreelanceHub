'use strict';

/**
 * Token Service — Redis-backed JWT denylist + refresh token store.
 *
 * Denylist  : revoked access token JTIs, keyed by jti, TTL = token remaining lifetime.
 * Refresh   : hashed refresh tokens keyed by userId, value = { tokenHash, jti, exp }.
 *
 * Falls back gracefully when Redis is unavailable (e.g. local dev without Redis):
 *   - isRevoked()       → returns false  (allows the request through)
 *   - revokeToken()     → no-op
 *   - storeRefresh()    → no-op
 *   - validateRefresh() → returns null
 *   - revokeRefresh()   → no-op
 *
 * In production you MUST set REDIS_URL to get full revocation behaviour.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

// ── Redis client (lazy-initialised so startup isn't blocked if Redis is down) ──
let redisClient = null;

const getRedis = async () => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.warn('REDIS_URL not set — token revocation disabled. Set REDIS_URL for production.');
    return null;
  }

  try {
    const { createClient } = require('redis');
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });
    await redisClient.connect();
    logger.info('Redis connected for token service');
    return redisClient;
  } catch (err) {
    logger.error('Failed to connect to Redis', { error: err.message });
    redisClient = null;
    return null;
  }
};

// ── Access token denylist ─────────────────────────────────────────────────────

/**
 * Revoke an access token by storing its JTI in Redis until it expires.
 * @param {string} jti   - JWT ID claim from the token
 * @param {number} exp   - JWT exp claim (Unix seconds)
 */
const revokeToken = async (jti, exp) => {
  const redis = await getRedis();
  if (!redis) return;

  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl <= 0) return; // already expired — no need to store

  await redis.set(`denylist:${jti}`, '1', { EX: ttl });
  logger.auth('Access token revoked', { jti, ttlSeconds: ttl });
};

/**
 * Check whether an access token JTI has been revoked.
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
const isRevoked = async (jti) => {
  const redis = await getRedis();
  if (!redis) return false; // fail open when Redis unavailable

  const result = await redis.get(`denylist:${jti}`);
  return result !== null;
};

// ── Refresh token store ───────────────────────────────────────────────────────

const REFRESH_KEY = (userId) => `refresh:${userId}`;

/**
 * Store a new refresh token for a user (replaces any existing one).
 * @param {string} userId
 * @param {string} plaintextToken  - the token sent to the client
 * @param {string} jti             - the JTI embedded in the access token this refresh is paired with
 * @param {number} exp             - Unix seconds when the refresh token expires
 */
const storeRefreshToken = async (userId, plaintextToken, jti, exp) => {
  const redis = await getRedis();
  if (!redis) return;

  const tokenHash = crypto.createHash('sha256').update(plaintextToken).digest('hex');
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl <= 0) return;

  await redis.set(
    REFRESH_KEY(userId),
    JSON.stringify({ tokenHash, jti, exp }),
    { EX: ttl }
  );
  logger.auth('Refresh token stored', { userId, ttlSeconds: ttl });
};

/**
 * Validate a submitted refresh token for a user.
 * Returns the stored record if valid, null otherwise.
 * @param {string} userId
 * @param {string} plaintextToken
 * @returns {Promise<{ tokenHash: string, jti: string, exp: number } | null>}
 */
const validateRefreshToken = async (userId, plaintextToken) => {
  const redis = await getRedis();
  if (!redis) return null;

  const raw = await redis.get(REFRESH_KEY(userId));
  if (!raw) return null;

  const stored = JSON.parse(raw);
  const submitted = crypto.createHash('sha256').update(plaintextToken).digest('hex');

  if (stored.tokenHash !== submitted) {
    logger.security('Refresh token mismatch — possible token theft attempt', { userId });
    return null;
  }

  if (stored.exp < Math.floor(Date.now() / 1000)) {
    logger.auth('Refresh token expired', { userId });
    return null;
  }

  return stored;
};

/**
 * Delete the refresh token for a user (on logout or rotation).
 * @param {string} userId
 */
const revokeRefreshToken = async (userId) => {
  const redis = await getRedis();
  if (!redis) return;

  await redis.del(REFRESH_KEY(userId));
  logger.auth('Refresh token revoked', { userId });
};

module.exports = {
  revokeToken,
  isRevoked,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
};
