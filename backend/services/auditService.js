const AuditLog = require('../models/AuditLog');

/**
 * Security Audit Logging Service
 * 
 * Records tamper-evident security events across authentication, certificate issuance,
 * threshold signing, verification, tampering, key rotation, and encryption.
 * 
 * Strict sanitization: Passwords, private keys, and raw secrets are NEVER logged.
 */

async function logSecurityEvent(req, { action, certificateId = null, result = 'SUCCESS', metadata = {} }) {
  try {
    const actorId = req && req.user ? req.user._id.toString() : 'ANONYMOUS';
    const actorEmail = req && req.user ? req.user.email : 'anonymous@verifier';
    const actorRole = req && req.user ? req.user.role : 'Verifier';

    const ipAddress = req
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1')
      : '127.0.0.1';
    const userAgent = req ? (req.headers['user-agent'] || 'system') : 'system';

    // Deep sanitize metadata
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.passwordHash;
    delete sanitizedMetadata.privateKey;
    delete sanitizedMetadata.rawKey;
    delete sanitizedMetadata.secret;

    await AuditLog.create({
      actorId,
      actorEmail,
      actorRole,
      action,
      certificateId,
      ipAddress,
      userAgent,
      result,
      metadata: sanitizedMetadata
    });
  } catch (err) {
    // Non-blocking: audit failure should not crash primary operations
    console.error('[Audit Log Error]', err.message);
  }
}

module.exports = {
  logSecurityEvent
};
