const Certificate = require('../models/Certificate');
const KeyVersion = require('../models/KeyVersion');
const AuditLog = require('../models/AuditLog');
const { verifyEntireChain } = require('../utils/hash');
const keyEvolutionService = require('../services/keyEvolutionService');
const { logSecurityEvent } = require('../services/auditService');

/**
 * Security Management Controller
 * 
 * Provides administrative oversight:
 * 1. Full Hash Chain Integrity Auditing
 * 2. Cryptographic Key Evolution & Rotation
 * 3. Security Event Audit Trail Retrieval
 */

exports.verifyCompleteChain = async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: 1 });
    const chainVerification = verifyEntireChain(certificates);

    const result = {
      success: true,
      chainValid: chainVerification.isChainValid,
      totalBlocks: certificates.length,
      brokenAt: chainVerification.brokenAtIndex !== null ? `Block index ${chainVerification.brokenAtIndex}` : null,
      expectedHash: chainVerification.expectedHash || null,
      actualHash: chainVerification.actualHash || null,
      reason: chainVerification.reason || null,
      auditedAt: new Date()
    };

    await logSecurityEvent(req, {
      action: 'CHAIN_AUDIT_EXECUTE',
      result: chainVerification.isChainValid ? 'SUCCESS' : 'FAILURE',
      metadata: { totalBlocks: certificates.length, chainValid: chainVerification.isChainValid }
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error executing complete chain verification.',
      error: error.message
    });
  }
};

exports.getKeyVersions = async (req, res) => {
  try {
    const versions = await KeyVersion.find().sort({ version: -1 });
    const activeVersion = versions.find((v) => v.status === 'ACTIVE') || null;

    return res.status(200).json({
      success: true,
      activeVersion: activeVersion ? activeVersion.version : null,
      versions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching key versions.',
      error: error.message
    });
  }
};

exports.rotateKeyVersion = async (req, res) => {
  try {
    const { reason } = req.body;
    const newVersion = await keyEvolutionService.rotateActiveKeyVersion(
      reason || 'Cryptographic key rotation initiated by administrator'
    );

    await logSecurityEvent(req, {
      action: 'KEY_ROTATION',
      result: 'SUCCESS',
      metadata: { newVersion: newVersion.version, reason }
    });

    return res.status(200).json({
      success: true,
      message: `Key version rotated successfully to Version ${newVersion.version}. Historical certificates remain verifiable against past key versions.`,
      newVersion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error rotating key version.',
      error: error.message
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { action, result, limit = 50 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (result) query.result = result;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 200));

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching security audit logs.',
      error: error.message
    });
  }
};
