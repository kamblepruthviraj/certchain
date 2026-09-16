const Certificate = require('../models/Certificate');
const { verifyCertificateIntegrity } = require('../utils/hash');

/**
 * Public Certificate Verification Endpoint
 * GET /api/verify/:certificateId
 * 
 * Performs live SHA-256 recalculation against the deterministic canonical data:
 * 1. Retrieve certificate by certificateId
 * 2. Reconstruct canonical data from stored fields
 * 3. Retrieve previousHash
 * 4. Recalculate SHA-256(previousHash + canonicalData)
 * 5. Compare calculated hash with stored certificateHash
 * 6. Check certificate status (ISSUED vs PENDING_APPROVAL / REJECTED)
 * 7. Return verification result with tamper detection
 */
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    if (!certificateId || certificateId.trim() === '') {
      return res.status(400).json({
        valid: false,
        status: 'INVALID',
        message: 'Certificate ID is required.'
      });
    }

    const trimmedId = certificateId.trim().toUpperCase();
    const certificate = await Certificate.findOne({ certificateId: trimmedId });

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        certificateId: trimmedId,
        status: 'NOT_FOUND',
        message: 'Certificate not found in the registry.'
      });
    }

    // Step 3, 4, 5: Reconstruct canonical data & recalculate SHA-256
    const integrity = verifyCertificateIntegrity(certificate);

    // Step 6: Detect Tampering
    if (!integrity.isValid) {
      return res.status(200).json({
        valid: false,
        certificateId: certificate.certificateId,
        status: 'INVALID',
        message: 'Certificate integrity verification failed. Possible tampering detected.',
        storedHash: integrity.storedHash,
        calculatedHash: integrity.calculatedHash,
        integrityMatched: false
      });
    }

    // Step 7: Check issuance status
    if (certificate.status === 'PENDING_APPROVAL') {
      return res.status(200).json({
        valid: false,
        certificateId: certificate.certificateId,
        status: 'PENDING_APPROVAL',
        message: 'Certificate cryptographic hash is intact, but issuance is pending required multi-official approvals.',
        integrityMatched: true,
        currentApprovals: certificate.approvals.length,
        requiredApprovals: 2
      });
    }

    if (certificate.status === 'REJECTED') {
      return res.status(200).json({
        valid: false,
        certificateId: certificate.certificateId,
        status: 'REJECTED',
        message: 'This certificate was formally rejected by university officials.',
        integrityMatched: true
      });
    }

    // Verified & Officially Issued
    return res.status(200).json({
      valid: true,
      certificateId: certificate.certificateId,
      status: 'ISSUED',
      message: 'Certificate verified successfully. Cryptographic integrity confirmed via SHA-256.',
      integrityMatched: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        usn: certificate.usn,
        course: certificate.course,
        institution: certificate.institution,
        cgpa: certificate.cgpa,
        issueDate: certificate.issueDate.toISOString().split('T')[0],
        certificateType: certificate.certificateType,
        certificateHash: certificate.certificateHash,
        previousHash: certificate.previousHash,
        approvedByCount: certificate.approvals.length
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      valid: false,
      status: 'SERVER_ERROR',
      message: 'An error occurred during certificate verification.',
      error: error.message
    });
  }
};
