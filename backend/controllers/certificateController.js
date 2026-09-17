const Certificate = require('../models/Certificate');
const {
  buildCanonicalData,
  generateCertificateHash,
  verifyCertificateIntegrity,
  verifyEntireChain
} = require('../utils/hash');

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
      status: 'PENDING_APPROVAL',
      createdBy: req.user._id
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

    // Record this official's approval
    certificate.approvals.push({
      officialId: officialUser._id,
      officialName: officialUser.name,
      role: officialUser.role,
      approvedAt: new Date()
    });

    const REQUIRED_APPROVALS = 2;
    const currentApprovalCount = certificate.approvals.length;

    if (currentApprovalCount >= REQUIRED_APPROVALS) {
      certificate.status = 'ISSUED';
    }

    await certificate.save();

    return res.status(200).json({
      success: true,
      message: certificate.status === 'ISSUED'
        ? `Certificate fully approved (${currentApprovalCount}/${REQUIRED_APPROVALS}) and status updated to ISSUED.`
        : `Approval recorded (${currentApprovalCount}/${REQUIRED_APPROVALS}). Awaiting second official approval.`,
      certificate,
      approvalCount: currentApprovalCount,
      requiredApprovals: REQUIRED_APPROVALS,
      status: certificate.status
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

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        issued,
        rejected
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
