const Certificate = require('../models/Certificate');
const CertificateRequest = require('../models/CertificateRequest');
const AuditLog = require('../models/AuditLog');
const MerkleBatch = require('../models/MerkleBatch');
const MerkleRoot = require('../models/MerkleRoot');
const QRCode = require('qrcode');
const {
  buildCanonicalData,
  generateCertificateHash,
  verifyCertificateIntegrity,
  verifyEntireChain
} = require('../utils/hash');
const merkleService = require('../services/merkleService');
const thresholdSignService = require('../services/thresholdSignService');
const timestampService = require('../services/timestampService');
const keyEvolutionService = require('../services/keyEvolutionService');
const { logSecurityEvent } = require('../services/auditService');

/**
 * Helper to generate a sequential unique certificate ID for the current year.
 * Format: CERT-YYYY-XXXX (e.g. CERT-2026-0001)
 */
const generateUniqueCertificateId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `CERT-${currentYear}-`;
  
  // Find highest numbered cert for the year
  const lastCertOfYear = await Certificate.findOne({
    certificateId: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let nextSequence = 1;
  if (lastCertOfYear && lastCertOfYear.certificateId) {
    const parts = lastCertOfYear.certificateId.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSeq}`;
};

/**
 * Create a new Certificate
 * - Computes previousHash from the chain head
 * - Builds deterministic canonical data
 * - Generates SHA-256 certificateHash
 * - Sets status = 'PENDING_APPROVAL'
 */
exports.createCertificate = async (req, res) => {
  try {
    const {
      studentName,
      usn,
      course,
      institution,
      cgpa,
      issueDate,
      certificateType
    } = req.body;

    // Validate required fields
    if (!studentName || !usn || !course || !institution || !cgpa || !issueDate || !certificateType) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: studentName, usn, course, institution, cgpa, issueDate, certificateType.'
      });
    }

    // Generate unique certificate ID
    const certificateId = await generateUniqueCertificateId();

    // Determine previousHash in the hash chain
    const lastCert = await Certificate.findOne().sort({ createdAt: -1 });
    const previousHash = lastCert ? lastCert.certificateHash : 'GENESIS';

    // Build deterministic canonical string
    const canonicalData = buildCanonicalData({
      certificateId,
      studentName,
      usn,
      course,
      institution,
      cgpa,
      issueDate,
      certificateType
    });

    // Compute SHA-256 hash chaining previousHash + canonicalData
    const certificateHash = generateCertificateHash(previousHash, canonicalData);

    // Generate Verification QR Code data URL
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificateId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    const activeKeyVer = await keyEvolutionService.getActiveKeyVersion();

    const certificate = await Certificate.create({
      certificateId,
      studentName,
      usn: usn.toUpperCase().trim(),
      course,
      institution,
      cgpa,
      issueDate: new Date(issueDate),
      certificateType,
      canonicalData,
      previousHash,
      certificateHash,
      approvals: [],
      thresholdSignatures: [],
      keyVersion: activeKeyVer ? activeKeyVer.version : 1,
      qrCodeDataUrl,
      recipientEmail: req.body.recipientEmail ? req.body.recipientEmail.toLowerCase().trim() : undefined,
      status: 'PENDING_APPROVAL',
      createdBy: req.user._id
    });

    // Link to CertificateRequest if submitted to fulfill student request
    if (req.body.requestId) {
      await CertificateRequest.findOneAndUpdate(
        { requestId: req.body.requestId },
        {
          status: 'In Review',
          certificateId: certificate.certificateId,
          comments: req.body.requestComments || 'Certificate drafted and pending official threshold signatures'
        }
      );
    }

    // Record audit event
    await logSecurityEvent(req, {
      action: 'CERTIFICATE_CREATE',
      certificateId,
      result: 'SUCCESS',
      metadata: { studentName, usn: usn.toUpperCase().trim(), course, requestId: req.body.requestId }
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate created successfully with status PENDING_APPROVAL.',
      certificate
    });
  } catch (error) {
    console.error('Certificate creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating certificate.',
      error: error.message
    });
  }
};

/**
 * Get all certificates with optional filtering
 */
exports.getAllCertificates = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { certificateId: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { usn: { $regex: search, $options: 'i' } }
      ];
    }

    const certificates = await Certificate.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching certificates.',
      error: error.message
    });
  }
};

/**
 * Get pending approvals queue
 */
exports.getPendingCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ status: 'PENDING_APPROVAL' }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching pending certificates.',
      error: error.message
    });
  }
};

/**
 * Get certificate by ID (either MongoDB _id or certificateId like CERT-2026-0001)
 */
exports.getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;

    let certificate;
    if (id.startsWith('CERT-')) {
      certificate = await Certificate.findOne({ certificateId: id });
    } else {
      certificate = await Certificate.findById(id);
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.'
      });
    }

    // Run cryptographic verification check
    const integrity = verifyCertificateIntegrity(certificate);

    return res.status(200).json({
      success: true,
      certificate,
      integrity
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving certificate.',
      error: error.message
    });
  }
};

/**
 * Multi-Official Approval Workflow
 * - Requires role: 'University Official' or 'Admin'
 * - Prevents same official from approving twice
 * - 1st approval -> remains PENDING_APPROVAL (1/2)
 * - 2nd approval -> transitions to ISSUED (2/2)
 */
exports.approveCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const officialUser = req.user;

    let certificate;
    if (id.startsWith('CERT-')) {
      certificate = await Certificate.findOne({ certificateId: id });
    } else {
      certificate = await Certificate.findById(id);
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.'
      });
    }

    if (certificate.status === 'ISSUED') {
      return res.status(400).json({
        success: false,
        message: 'Certificate is already fully approved and issued.'
      });
    }

    if (certificate.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve a rejected certificate.'
      });
    }

    // Check if this official has already approved
    const alreadyApproved = certificate.approvals.some(
      (app) => app.officialId.toString() === officialUser._id.toString()
    );

    if (alreadyApproved) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate approval rejected. You have already approved this certificate.'
      });
    }

    // 1. Generate real Ed25519 Cryptographic Digital Signature over the certificate hash
    const signatureResult = thresholdSignService.signCertificateHash(
      officialUser.email,
      certificate.certificateHash,
      certificate.keyVersion || 1
    );

    // Record both administrative approval and cryptographic signature
    certificate.approvals.push({
      officialId: officialUser._id,
      officialName: officialUser.name,
      role: officialUser.role,
      approvedAt: new Date()
    });

    certificate.thresholdSignatures.push({
      officialId: officialUser._id,
      officialName: officialUser.name,
      keyId: signatureResult.keyId,
      signature: signatureResult.signature,
      algorithm: signatureResult.algorithm,
      signedAt: new Date()
    });

    // 2. Validate 2-of-3 Cryptographic Threshold Quorum
    const keyVersionDoc = await keyEvolutionService.getKeyVersion(certificate.keyVersion || 1);
    const quorum = thresholdSignService.validateThresholdQuorum(
      certificate,
      keyVersionDoc ? keyVersionDoc.committee : [],
      2 // 2-of-3 threshold
    );

    const REQUIRED_THRESHOLD = 2;
    const currentApprovalCount = certificate.thresholdSignatures.length;

    // 3. When threshold quorum is reached, atomically transition to ISSUED
    if (quorum.isValid && certificate.status !== 'ISSUED') {
      certificate.status = 'ISSUED';

      // 4. Issue Cryptographic Timestamp Token from Internal TSA
      const timestampRec = await timestampService.issueTimestampProof(
        certificate.certificateHash,
        'CERTIFICATE',
        certificate.certificateId
      );
      certificate.timestampRecordId = timestampRec._id;
      certificate.timestampProof = {
        timestamp: timestampRec.timestamp,
        timestampAuthority: timestampRec.timestampAuthority,
        signature: timestampRec.signature
      };

      // 5. Add to persistent Merkle Tree Batch & Derive Merkle Proof
      let activeBatch = await MerkleBatch.findOne({ status: 'OPEN' });
      if (!activeBatch) {
        const batchCount = await MerkleBatch.countDocuments();
        activeBatch = new MerkleBatch({
          batchId: `BATCH-2026-${String(batchCount + 1).padStart(4, '0')}`,
          leafHashes: [],
          certificateIds: [],
          treeVersion: 1,
          status: 'OPEN'
        });
      }

      const leafHash = merkleService.deriveLeafHash(certificate.certificateHash);
      if (!activeBatch.leafHashes.includes(leafHash)) {
        activeBatch.leafHashes.push(leafHash);
        activeBatch.certificateIds.push(certificate.certificateId);
      }
      activeBatch.certificateCount = activeBatch.leafHashes.length;

      // Recompute batch Merkle Root
      const newRoot = merkleService.generateMerkleRoot(activeBatch.leafHashes);
      activeBatch.rootHash = newRoot;
      await activeBatch.save();

      // Upsert into public zero-PII Merkle Root registry
      await MerkleRoot.findOneAndUpdate(
        { batchId: activeBatch.batchId },
        {
          batchId: activeBatch.batchId,
          rootHash: newRoot,
          treeVersion: activeBatch.treeVersion,
          certificateCount: activeBatch.certificateCount
        },
        { upsert: true, new: true }
      );

      // Generate and attach Merkle Proof for this certificate
      const merkleProof = merkleService.generateMerkleProof(activeBatch.leafHashes, leafHash);
      certificate.merkleLeafHash = leafHash;
      certificate.merkleRoot = newRoot;
      certificate.merkleProof = merkleProof;
      certificate.batchId = activeBatch.batchId;

      // Log Certificate Issuance Audit Event
      await logSecurityEvent(req, {
        action: 'CERTIFICATE_ISSUE',
        certificateId: certificate.certificateId,
        result: 'SUCCESS',
        metadata: {
          approvals: currentApprovalCount,
          merkleRoot: newRoot,
          batchId: activeBatch.batchId,
          keyVersion: certificate.keyVersion
        }
      });
      // Atomically update any CertificateRequest linked to this certificateId or matching USN
      await CertificateRequest.updateMany(
        {
          $or: [
            { certificateId: certificate.certificateId },
            { studentUsn: certificate.usn, status: { $in: ['Pending', 'In Review', 'Approved'] } }
          ]
        },
        {
          status: 'Issued',
          certificateId: certificate.certificateId
        }
      );
    } else {
      // Log Single Signature Audit Event
      await logSecurityEvent(req, {
        action: 'OFFICIAL_SIGN',
        certificateId: certificate.certificateId,
        result: 'SUCCESS',
        metadata: {
          signaturesCount: currentApprovalCount,
          requiredThreshold: REQUIRED_THRESHOLD,
          keyId: signatureResult.keyId
        }
      });
    }

    await certificate.save();

    return res.status(200).json({
      success: true,
      message: certificate.status === 'ISSUED'
        ? `Certificate reached cryptographic 2-of-3 threshold quorum (${currentApprovalCount}/${REQUIRED_THRESHOLD}), Merkle tree batch committed, and status updated to ISSUED.`
        : `Cryptographic signature recorded (${currentApprovalCount}/${REQUIRED_THRESHOLD}). Awaiting second authorized official signature.`,
      certificate,
      approvalCount: currentApprovalCount,
      requiredApprovals: REQUIRED_THRESHOLD,
      status: certificate.status,
      thresholdQuorum: quorum
    });
  } catch (error) {
    console.error('Approval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during certificate approval.',
      error: error.message
    });
  }
};

/**
 * Multi-Official Workflow: Reject Certificate
 * Role: Admin or University Official can reject a pending certificate.
 */
exports.rejectCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const officialUser = req.user;

    let certificate;
    if (id.startsWith('CERT-')) {
      certificate = await Certificate.findOne({ certificateId: id });
    } else {
      certificate = await Certificate.findById(id);
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.'
      });
    }

    if (certificate.status === 'ISSUED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an already issued certificate.'
      });
    }

    if (certificate.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Certificate is already rejected.'
      });
    }

    certificate.status = 'REJECTED';
    certificate.rejectionReason = reason || 'Rejected during administrative review';
    certificate.rejectedBy = {
      officialId: officialUser._id,
      officialName: officialUser.name,
      rejectedAt: new Date()
    };

    await certificate.save();

    await logSecurityEvent(req, {
      action: 'CERTIFICATE_REJECT',
      certificateId: certificate.certificateId,
      result: 'SUCCESS',
      metadata: { reason: certificate.rejectionReason, rejectedBy: officialUser.name }
    });

    return res.status(200).json({
      success: true,
      message: `Certificate ${certificate.certificateId} has been rejected.`,
      certificate
    });
  } catch (error) {
    console.error('Rejection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during certificate rejection.',
      error: error.message
    });
  }
};

/**
 * Dashboard stats: Total, Pending, Issued, Rejected
 */
exports.getStats = async (req, res) => {
  try {
    const total = await Certificate.countDocuments();
    const pending = await Certificate.countDocuments({ status: 'PENDING_APPROVAL' });
    const issued = await Certificate.countDocuments({ status: 'ISSUED' });
    const rejected = await Certificate.countDocuments({ status: 'REJECTED' });
    const pendingRequests = await CertificateRequest.countDocuments({ status: { $in: ['Pending', 'In Review'] } });
    const totalRequests = await CertificateRequest.countDocuments();

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        issued,
        rejected,
        pendingRequests,
        totalRequests
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching statistics.',
      error: error.message
    });
  }
};

/**
 * Chain verification endpoint: inspects and validates the entire hash chain
 */
exports.getChainStatus = async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: 1 });
    const chainVerification = verifyEntireChain(certificates);

    return res.status(200).json({
      success: true,
      totalBlocks: certificates.length,
      ...chainVerification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking chain status.',
      error: error.message
    });
  }
};

/**
 * Interactive PBL Demonstration Helper: Simulate Tampering
 * Directly updates a field in the database without recomputing the SHA-256 hash.
 * This triggers immediate verification failure in Module 7 & 8.
 */
exports.simulateTamper = async (req, res) => {
  try {
    const { id } = req.params;
    const { tamperedCgpa } = req.body;

    let certificate;
    if (id.startsWith('CERT-')) {
      certificate = await Certificate.findOne({ certificateId: id });
    } else {
      certificate = await Certificate.findById(id);
    }

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    const previousCgpa = certificate.cgpa;
    const newCgpa = tamperedCgpa || (parseFloat(certificate.cgpa) < 9 ? '9.9' : '7.0');

    // Update field directly in DB WITHOUT recomputing hash
    certificate.cgpa = newCgpa;
    await certificate.save();

    // Check integrity to show mismatch
    const integrity = verifyCertificateIntegrity(certificate);

    await logSecurityEvent(req, {
      action: 'TAMPER_SIMULATED',
      certificateId: certificate.certificateId,
      result: 'SUCCESS',
      metadata: { previousCgpa, newCgpa, hashUnchanged: true }
    });

    return res.status(200).json({
      success: true,
      message: `Simulated tampering applied: CGPA changed from ${previousCgpa} to ${newCgpa} without updating certificateHash.`,
      certificate,
      integrity
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error applying simulated tampering.',
      error: error.message
    });
  }
};

/**
 * Interactive PBL Demonstration Helper: Restore Tampered Certificate
 * Recalculates the canonical data and hash or restores valid fields.
 */
exports.restoreTampered = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalCgpa } = req.body;

    let certificate;
    if (id.startsWith('CERT-')) {
      certificate = await Certificate.findOne({ certificateId: id });
    } else {
      certificate = await Certificate.findById(id);
    }

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (originalCgpa) {
      certificate.cgpa = originalCgpa;
    }

    // Rebuild canonical string and hash properly
    const canonicalData = buildCanonicalData({
      certificateId: certificate.certificateId,
      studentName: certificate.studentName,
      usn: certificate.usn,
      course: certificate.course,
      institution: certificate.institution,
      cgpa: certificate.cgpa,
      issueDate: certificate.issueDate,
      certificateType: certificate.certificateType
    });

    certificate.canonicalData = canonicalData;
    certificate.certificateHash = generateCertificateHash(certificate.previousHash, canonicalData);
    await certificate.save();

    const integrity = verifyCertificateIntegrity(certificate);

    await logSecurityEvent(req, {
      action: 'TAMPER_RESTORED',
      certificateId: certificate.certificateId,
      result: 'SUCCESS',
      metadata: { restoredCgpa: certificate.cgpa }
    });

    return res.status(200).json({
      success: true,
      message: 'Certificate data restored and cryptographic integrity re-established.',
      certificate,
      integrity
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error restoring certificate.',
      error: error.message
    });
  }
};

/**
 * Get certificate requests relevant to the current user
 */
exports.getMyRequests = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    // Normal users / students / verifiers see their own requests
    if (user.role === 'Student' || user.role === 'Verifier') {
      const orConditions = [{ userId: user._id }, { userEmail: user.email.toLowerCase() }];
      if (user.studentUsn) {
        orConditions.push({ studentUsn: user.studentUsn });
      }
      query = { $or: orConditions };
    }

    const requests = await CertificateRequest.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching certificate requests.',
      error: error.message
    });
  }
};

/**
 * Submit a new certificate or transcript request
 */
exports.createCertificateRequest = async (req, res) => {
  try {
    const user = req.user;
    const { certificateType, purpose, comments, studentUsn } = req.body;

    if (!certificateType) {
      return res.status(400).json({
        success: false,
        message: 'certificateType is required.'
      });
    }

    const currentYear = new Date().getFullYear();
    const count = await CertificateRequest.countDocuments();
    const requestId = `REQ-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const newRequest = await CertificateRequest.create({
      requestId,
      userId: user._id,
      userName: user.name,
      userEmail: user.email.toLowerCase(),
      studentUsn: (studentUsn || user.studentUsn || '').toUpperCase().trim(),
      certificateType,
      purpose: purpose || 'Verification & Official Records',
      comments: comments || '',
      status: 'Pending',
      requestedDate: new Date()
    });

    await logSecurityEvent(req, {
      action: 'CERTIFICATE_REQUEST_SUBMITTED',
      result: 'SUCCESS',
      metadata: { requestId, certificateType }
    });

    return res.status(201).json({
      success: true,
      message: `Request ${requestId} submitted successfully.`,
      request: newRequest
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error submitting certificate request.',
      error: error.message
    });
  }
};

/**
 * Normal user / verifier verification dashboard stats & recent activity
 */
exports.getVerifierDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    const totalVerifications = await AuditLog.countDocuments({ action: 'PUBLIC_VERIFY' });
    const successfulVerifications = await AuditLog.countDocuments({ action: 'PUBLIC_VERIFY', result: 'SUCCESS' });
    const failedVerifications = await AuditLog.countDocuments({ action: 'PUBLIC_VERIFY', result: 'FAILURE' });

    let pendingRequestsCount = 0;
    if (user) {
      const orConditions = [{ userId: user._id }, { userEmail: user.email.toLowerCase() }];
      if (user.studentUsn) orConditions.push({ studentUsn: user.studentUsn });
      pendingRequestsCount = await CertificateRequest.countDocuments({
        $or: orConditions,
        status: { $in: ['Pending', 'In Review'] }
      });
    }

    const recentLogs = await AuditLog.find({ action: 'PUBLIC_VERIFY' })
      .sort({ createdAt: -1 })
      .limit(10);

    const recentActivity = recentLogs.map((log) => ({
      certificateId: log.certificateId || 'UNKNOWN',
      date: log.createdAt,
      result: log.result === 'SUCCESS' ? 'Verified' : 'Failed',
      success: log.result === 'SUCCESS'
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalVerifications: totalVerifications || 0,
        successfulVerifications: successfulVerifications || 0,
        failedVerifications: failedVerifications || 0,
        pendingRequests: pendingRequestsCount || 0
      },
      recentActivity
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching verification dashboard statistics.',
      error: error.message
    });
  }
};

/**
 * Update student certificate request status (Admin / University Official)
 */
exports.updateCertificateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments, certificateId } = req.body;

    const request = await CertificateRequest.findOne({
      $or: [
        { requestId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: `Certificate request ${id} not found.`
      });
    }

    if (status) request.status = status;
    if (comments !== undefined) request.comments = comments;
    if (certificateId) request.certificateId = certificateId;

    await request.save();

    await logSecurityEvent(req, {
      action: 'CERTIFICATE_REQUEST_STATUS_UPDATED',
      result: 'SUCCESS',
      metadata: { requestId: request.requestId, newStatus: request.status }
    });

    return res.status(200).json({
      success: true,
      message: `Request ${request.requestId} updated to ${request.status}.`,
      request
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating certificate request status.',
      error: error.message
    });
  }
};


