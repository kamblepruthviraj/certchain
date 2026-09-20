const Certificate = require('../models/Certificate');
const MerkleRoot = require('../models/MerkleRoot');
const KeyVersion = require('../models/KeyVersion');
const { verifyCertificateIntegrity } = require('../utils/hash');
const merkleService = require('../services/merkleService');
const thresholdSignService = require('../services/thresholdSignService');
const timestampService = require('../services/timestampService');
const { logSecurityEvent } = require('../services/auditService');

/**
 * Public Certificate Verification Endpoint
 * GET /api/verify/:certificateId
 * 
 * Performs comprehensive 8-point cryptographic verification:
 * 1. Certificate Record Exists
 * 2. Status is ISSUED
 * 3. Canonical SHA-256 Digest Integrity
 * 4. Hash Chain Predecessor Continuity
 * 5. 2-of-3 Cryptographic Threshold Signatures (Ed25519)
 * 6. Merkle Tree Leaf & Inclusion Proof Verification
 * 7. Merkle Root Match in Trusted Public Registry
 * 8. Cryptographic Timestamp Token Verification (Internal TSA)
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
      await logSecurityEvent(req, {
        action: 'PUBLIC_VERIFY',
        certificateId: trimmedId,
        result: 'FAILURE',
        metadata: { reason: 'CERTIFICATE_NOT_FOUND' }
      });

      return res.status(404).json({
        valid: false,
        certificateId: trimmedId,
        status: 'NOT_FOUND',
        message: `No certificate record found for ID: ${trimmedId}.`
      });
    }

    const securityChecklist = [];

    // CHECK 1: Certificate Exists
    securityChecklist.push({
      name: 'Certificate Record Exists',
      passed: true,
      description: 'Found certificate record in the institutional database'
    });

    // CHECK 2: Issuance Status
    const isIssued = certificate.status === 'ISSUED';
    securityChecklist.push({
      name: 'Certificate Status: ISSUED',
      passed: isIssued,
      description: isIssued
        ? 'Certificate is formally signed and issued'
        : `Certificate is currently in ${certificate.status} state`
    });

    if (certificate.status === 'PENDING_APPROVAL') {
      return res.status(200).json({
        valid: false,
        certificateId: certificate.certificateId,
        status: 'PENDING_APPROVAL',
        message: 'Certificate is awaiting required 2-of-3 multi-official threshold signatures.',
        securityChecklist,
        currentSignatures: certificate.thresholdSignatures ? certificate.thresholdSignatures.length : 0,
        requiredThreshold: 2
      });
    }

    if (certificate.status === 'REJECTED') {
      return res.status(200).json({
        valid: false,
        certificateId: certificate.certificateId,
        status: 'REJECTED',
        message: 'This certificate was formally rejected by university officials.',
        securityChecklist,
        rejectionReason: certificate.rejectionReason || 'Rejected during administrative review'
      });
    }

    // CHECK 3: Canonical SHA-256 Digest Match
    const integrity = verifyCertificateIntegrity(certificate);
    securityChecklist.push({
      name: 'SHA-256 Canonical Integrity',
      passed: integrity.isValid,
      description: integrity.isValid
        ? 'Recomputed hash matches stored cryptographic hash perfectly'
        : 'HASH MISMATCH: Certificate content has been modified!'
    });

    // CHECK 4: Hash Chain Link Continuity
    let chainLinkValid = false;
    if (certificate.previousHash === 'GENESIS') {
      chainLinkValid = true;
    } else {
      const prevCert = await Certificate.findOne({ certificateHash: certificate.previousHash });
      chainLinkValid = !!prevCert;
    }
    securityChecklist.push({
      name: 'Hash Chain Predecessor Linkage',
      passed: chainLinkValid,
      description: chainLinkValid
        ? 'Valid cryptographic link to predecessor block or GENESIS'
        : 'Chain link broken: predecessor hash could not be verified'
    });

    // CHECK 5: 2-of-3 Cryptographic Threshold Signatures
    const keyVersionDoc = await KeyVersion.findOne({ version: certificate.keyVersion || 1 });
    const quorumCheck = thresholdSignService.validateThresholdQuorum(
      certificate,
      keyVersionDoc ? keyVersionDoc.committee : [],
      2
    );
    securityChecklist.push({
      name: 'Cryptographic Threshold Signatures (2-of-3 Quorum)',
      passed: quorumCheck.isValid,
      description: quorumCheck.isValid
        ? `Verified ${quorumCheck.validSignaturesCount} distinct Ed25519 digital signatures against committee public keys`
        : `Quorum check failed: ${quorumCheck.reason || 'Invalid signatures'}`
    });

    // CHECK 6: Merkle Tree Proof Verification
    let merkleProofValid = false;
    if (certificate.merkleRoot && certificate.merkleLeafHash) {
      merkleProofValid = merkleService.verifyMerkleProof(
        certificate.merkleLeafHash,
        certificate.merkleProof || [],
        certificate.merkleRoot
      );
    }
    securityChecklist.push({
      name: 'Merkle Tree Inclusion Proof',
      passed: merkleProofValid,
      description: merkleProofValid
        ? 'Cryptographic Merkle path derives trusted Merkle root'
        : 'Merkle proof verification failed'
    });

    // CHECK 7: Merkle Root Registered in Public Registry
    let rootRegistryValid = false;
    if (certificate.merkleRoot) {
      const rootDoc = await MerkleRoot.findOne({ rootHash: certificate.merkleRoot });
      rootRegistryValid = !!rootDoc;
    }
    securityChecklist.push({
      name: 'Merkle Root Public Registry Match',
      passed: rootRegistryValid,
      description: rootRegistryValid
        ? 'Root hash is registered in the public tamper-evident registry'
        : 'Root hash not found in public registry'
    });

    // CHECK 8: Cryptographic Timestamp Token
    let timestampValid = false;
    if (certificate.timestampProof && certificate.timestampProof.signature) {
      timestampValid = timestampService.verifyTimestampProof(
        certificate.certificateHash,
        certificate.timestampProof.timestamp,
        'CERTIFICATE',
        certificate.certificateId,
        certificate.timestampProof.signature
      );
    }
    securityChecklist.push({
      name: 'Cryptographic Timestamp Token',
      passed: timestampValid,
      description: timestampValid
        ? `Verified TSA signature issued on ${new Date(certificate.timestampProof.timestamp).toUTCString()}`
        : 'Timestamp token verification failed or unverified'
    });

    // All checks must pass for full validation
    const allChecksPassed = securityChecklist.every((c) => c.passed);

    // Record verification event
    await logSecurityEvent(req, {
      action: 'PUBLIC_VERIFY',
      certificateId: certificate.certificateId,
      result: allChecksPassed ? 'SUCCESS' : 'FAILURE',
      metadata: { allChecksPassed, checksFailed: securityChecklist.filter((c) => !c.passed).map((c) => c.name) }
    });

    if (!allChecksPassed) {
      const message = !integrity.isValid
        ? 'Certificate integrity verification failed. Possible tampering detected.'
        : 'Certificate verification failed one or more cryptographic security checks!';

      return res.status(200).json({
        valid: false,
        certificateId: certificate.certificateId,
        status: 'INVALID',
        message,
        securityChecklist,
        integrityMatched: integrity.isValid,
        storedHash: integrity.storedHash,
        calculatedHash: integrity.calculatedHash
      });
    }

    // Success response: returns verified certificate with QR code and security proofs
    return res.status(200).json({
      valid: true,
      certificateId: certificate.certificateId,
      status: 'ISSUED',
      message: 'Certificate successfully verified. All 8 cryptographic security checks passed.',
      integrityMatched: true,
      securityChecklist,
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
        merkleRoot: certificate.merkleRoot,
        batchId: certificate.batchId,
        keyVersion: certificate.keyVersion,
        qrCodeDataUrl: certificate.qrCodeDataUrl,
        timestampProof: certificate.timestampProof,
        signaturesCount: certificate.thresholdSignatures ? certificate.thresholdSignatures.length : 0
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
