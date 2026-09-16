const crypto = require('crypto');

/**
 * Builds a deterministic canonical string representation of the core certificate data.
 * Keys are arranged in a strict, fixed order to ensure deterministic hashing.
 * 
 * @param {Object} data 
 * @returns {string} Deterministic JSON string
 */
function buildCanonicalData({
  certificateId,
  studentName,
  usn,
  course,
  institution,
  cgpa,
  issueDate,
  certificateType
}) {
  // Normalize issueDate to standard YYYY-MM-DD format for consistency
  const formattedDate = issueDate instanceof Date
    ? issueDate.toISOString().split('T')[0]
    : new Date(issueDate).toISOString().split('T')[0];

  const canonicalObj = {
    certificateId: String(certificateId).trim(),
    studentName: String(studentName).trim(),
    usn: String(usn).trim().toUpperCase(),
    course: String(course).trim(),
    institution: String(institution).trim(),
    cgpa: String(cgpa).trim(),
    issueDate: formattedDate,
    certificateType: String(certificateType).trim()
  };

  return JSON.stringify(canonicalObj);
}

/**
 * Calculates SHA-256 digest of input string.
 * Returns 64-character hexadecimal string.
 * 
 * @param {string} data 
 * @returns {string} 64-character hex hash
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generates certificate hash chaining with previousHash:
 * currentHash = SHA256(previousHash + canonicalCertificateData)
 * 
 * @param {string} previousHash - 'GENESIS' or hash of preceding certificate
 * @param {string} canonicalData - Deterministic canonical JSON string
 * @returns {string} 64-character hex hash
 */
function generateCertificateHash(previousHash, canonicalData) {
  if (!previousHash) {
    throw new Error('previousHash is required for hash chaining');
  }
  if (!canonicalData) {
    throw new Error('canonicalData is required to calculate certificate hash');
  }

  const payloadToHash = previousHash + canonicalData;
  return sha256(payloadToHash);
}

/**
 * Verifies the cryptographic integrity of a certificate:
 * Rebuilds canonical data from fields, recalculates SHA256(previousHash + canonical),
 * and checks if it matches stored certificateHash.
 * 
 * @param {Object} certificate 
 * @returns {Object} { isValid: boolean, storedHash: string, calculatedHash: string, canonicalData: string }
 */
function verifyCertificateIntegrity(certificate) {
  const recalculatedCanonical = buildCanonicalData({
    certificateId: certificate.certificateId,
    studentName: certificate.studentName,
    usn: certificate.usn,
    course: certificate.course,
    institution: certificate.institution,
    cgpa: certificate.cgpa,
    issueDate: certificate.issueDate,
    certificateType: certificate.certificateType
  });

  const calculatedHash = generateCertificateHash(
    certificate.previousHash,
    recalculatedCanonical
  );

  const isValid = calculatedHash === certificate.certificateHash;

  return {
    isValid,
    storedHash: certificate.certificateHash,
    calculatedHash,
    canonicalData: recalculatedCanonical
  };
}

/**
 * Verifies the integrity of an entire chain of certificates chronologically.
 * Checks both individual certificate hash integrity and continuous link to previousHash.
 * 
 * @param {Array} certificates - Chronologically ordered certificates array
 * @returns {Object} { isChainValid: boolean, brokenAtIndex: number|null, reason: string|null }
 */
function verifyEntireChain(certificates) {
  if (!certificates || certificates.length === 0) {
    return { isChainValid: true, brokenAtIndex: null, reason: 'Empty chain' };
  }

  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];

    // Check 1: First certificate must link to GENESIS
    if (i === 0) {
      if (cert.previousHash !== 'GENESIS') {
        return {
          isChainValid: false,
          brokenAtIndex: 0,
          reason: `Genesis block previousHash must be 'GENESIS', found '${cert.previousHash}'`
        };
      }
    } else {
      // Subsequent certificates must link to preceding certificate's certificateHash
      const prevCert = certificates[i - 1];
      if (cert.previousHash !== prevCert.certificateHash) {
        return {
          isChainValid: false,
          brokenAtIndex: i,
          reason: `Chain broken at index ${i} (${cert.certificateId}): previousHash '${cert.previousHash}' does not match prior certificateHash '${prevCert.certificateHash}'`
        };
      }
    }

    // Check 2: Individual certificate SHA-256 integrity
    const integrity = verifyCertificateIntegrity(cert);
    if (!integrity.isValid) {
      return {
        isChainValid: false,
        brokenAtIndex: i,
        reason: `Integrity check failed at index ${i} (${cert.certificateId}). Stored: ${cert.certificateHash}, Recomputed: ${integrity.calculatedHash}`
      };
    }
  }

  return { isChainValid: true, brokenAtIndex: null, reason: null };
}

module.exports = {
  buildCanonicalData,
  sha256,
  generateCertificateHash,
  verifyCertificateIntegrity,
  verifyEntireChain
};
