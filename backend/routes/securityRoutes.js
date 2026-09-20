const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { verifyToken, requireRoles } = require('../middleware/auth');

// Complete Hash Chain Verification
router.get(
  '/verify-chain',
  verifyToken,
  securityController.verifyCompleteChain
);

// Key Evolution / Lifecycle
router.get(
  '/keys',
  verifyToken,
  securityController.getKeyVersions
);

router.post(
  '/keys/rotate',
  verifyToken,
  requireRoles('Admin'),
  securityController.rotateKeyVersion
);

// Audit Logging
router.get(
  '/audit-logs',
  verifyToken,
  requireRoles('Admin'),
  securityController.getAuditLogs
);

module.exports = router;
