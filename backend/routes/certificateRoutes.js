const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { verifyToken, requireRoles } = require('../middleware/auth');

// Protected routes for dashboard and management
router.get('/stats', verifyToken, certificateController.getStats);
router.get('/chain-status', verifyToken, certificateController.getChainStatus);
router.get('/pending', verifyToken, requireRoles('Admin', 'University Official'), certificateController.getPendingCertificates);

// Normal user / verifier requests and dashboard activity
router.get('/my-requests', verifyToken, certificateController.getMyRequests);
router.post('/request', verifyToken, certificateController.createCertificateRequest);
router.get('/verifier-stats', verifyToken, certificateController.getVerifierDashboardStats);

router.post('/', verifyToken, requireRoles('Admin', 'University Official'), certificateController.createCertificate);
router.get('/', verifyToken, certificateController.getAllCertificates);
router.get('/:id', verifyToken, certificateController.getCertificateById);

// 2-Official Approval workflow
router.post('/:id/approve', verifyToken, requireRoles('Admin', 'University Official'), certificateController.approveCertificate);
router.post('/:id/reject', verifyToken, requireRoles('Admin', 'University Official'), certificateController.rejectCertificate);

// Interactive tamper testing helpers for PBL demo
router.post('/:id/tamper-test', verifyToken, certificateController.simulateTamper);
router.post('/:id/restore-test', verifyToken, certificateController.restoreTampered);

module.exports = router;
