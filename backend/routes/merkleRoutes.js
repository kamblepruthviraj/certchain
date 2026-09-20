const express = require('express');
const router = express.Router();
const merkleController = require('../controllers/merkleController');

// Public endpoints (no authentication required)
router.get('/merkle-root', merkleController.getLatestMerkleRoot);
router.get('/merkle-roots', merkleController.getAllMerkleRoots);
router.get('/merkle-batch/:batchId', merkleController.getBatchDetails);
router.post('/verify-proof', merkleController.verifyProof);

module.exports = router;
