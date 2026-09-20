const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { verifyToken, requireRoles } = require('../middleware/auth');

// Recipient keypair generation helper for interactive sandbox/testing
router.post('/generate-keypair', deliveryController.generateKeyPair);

// Encrypt certificate (Authorized roles: Admin, Official, Student)
router.post(
  '/encrypt',
  verifyToken,
  requireRoles('Admin', 'University Official', 'Student'),
  deliveryController.encryptCertificate
);

// Decrypt certificate (Authenticated or direct recipient sandbox)
router.post('/decrypt', deliveryController.decryptCertificate);

// Fetch encrypted envelope
router.get(
  '/:certId',
  verifyToken,
  deliveryController.getDeliveryEnvelope
);

module.exports = router;
