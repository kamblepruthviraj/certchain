const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');

// Public verification endpoint
router.get('/:certificateId', verifyController.verifyCertificate);

module.exports = router;
