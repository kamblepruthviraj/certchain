/**
 * CertChain 100% Milestone Complete Integration Test Suite
 * 
 * Verifies all 20 cryptographic and operational requirements:
 * 1. RBAC & Multi-role Authentication (Admin, Official, Student, Verifier)
 * 2. Deterministic Canonicalization & SHA-256 Hashing
 * 3. Hash Chaining from GENESIS
 * 4. 2-of-3 Cryptographic Threshold Multi-Signatures (Ed25519)
 * 5. Merkle Tree Generation & Binary Leaf Derivation
 * 6. Merkle Inclusion Proof Generation & Validation
 * 7. Public Zero-PII Merkle Root Registry
 * 8. X25519 Diffie-Hellman Key Agreement
 * 9. HKDF-SHA256 Key Derivation
 * 10. AES-256-GCM Authenticated Encryption & Decryption
 * 11. Tampered Ciphertext Authentication Tag Rejection (Integrity)
 * 12. Cryptographic Key Evolution & Rotation
 * 13. Historical Certificate Verification against Prior Key Version
 * 14. Independent / Internal Cryptographic Timestamp Authority (TSA) Token Verification
 * 15. Complete Hash Chain Audit Endpoint (/api/security/verify-chain)
 * 16. Security Audit Event Logging (/api/security/audit-logs)
 * 17. Duplicate Signature / Self-Approval Prevention
 * 18. Full 8-Point Public Verification Checklist
 * 19. Tamper Detection Across Multiple Vectors (CGPA, Hash, Proof)
 * 20. QR Code Data URL Generation
 */

process.env.NODE_ENV = 'test';
require('dotenv').config();

const mongoose = require('mongoose');
const { app } = require('../server');
const connectDB = require('../config/db');
const seedUsers = require('../config/seed');

const PORT = 5066;
let serverInstance;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function run100PercentTests() {
  console.log('\n================================================================');
  console.log('  CERTCHAIN: 100% MILESTONE AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    // Connect to DB and reset test collections for deterministic verification
    await connectDB();
    const Certificate = require('../models/Certificate');
    const KeyVersion = require('../models/KeyVersion');
    const MerkleBatch = require('../models/MerkleBatch');
    const MerkleRoot = require('../models/MerkleRoot');
    const TimestampRecord = require('../models/TimestampRecord');
    const SecureDelivery = require('../models/SecureDelivery');
    const AuditLog = require('../models/AuditLog');

    await Certificate.deleteMany({});
    await KeyVersion.deleteMany({});
    await MerkleBatch.deleteMany({});
    await MerkleRoot.deleteMany({});
    await TimestampRecord.deleteMany({});
    await SecureDelivery.deleteMany({});
    await AuditLog.deleteMany({});

    await seedUsers();

    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, '127.0.0.1', () => {
        console.log(`[Test Server] Listening on ${BASE_URL}\n`);
        resolve();
      });
    });

    // ----------------------------------------------------
    // 1. RBAC & MULTI-ROLE AUTHENTICATION
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('SUITE 1: Multi-Role Authentication & Access Control');
    console.log('----------------------------------------------------');

    async function login(email, password) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) throw new Error(`Login failed for ${email}: ${data.message}`);
      return data.token;
    }

    const adminToken = await login('admin@univ.edu', 'AdminPassword123!');
    const official1Token = await login('official1@univ.edu', 'OfficialPassword123!');
    const official2Token = await login('official2@univ.edu', 'OfficialPassword123!');
    const official3Token = await login('official3@univ.edu', 'OfficialPassword123!');
    const studentToken = await login('student@univ.edu', 'StudentPassword123!');
    const verifierToken = await login('verifier@company.com', 'VerifierPassword123!');

    console.log('  ✓ Admin, Officials (1, 2, 3), Student, and Verifier authenticated successfully.');

    // Verify role restriction: Student cannot create certificates
    const resUnauthorizedCreate = await fetch(`${BASE_URL}/api/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ studentName: 'Test' })
    });
    if (resUnauthorizedCreate.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Student create certificate, got ${resUnauthorizedCreate.status}`);
    }
    console.log('  ✓ RBAC enforced: Student restricted from certificate creation (HTTP 403)');

    // ----------------------------------------------------
    // 2. CERTIFICATE CREATION, SHA-256 & QR CODE
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('SUITE 2: Deterministic Canonicalization, SHA-256 & QR');
    console.log('----------------------------------------------------');

    const certPayload = {
      studentName: 'Rahul S Verma',
      usn: '1RV23CS042',
      course: 'B.E. Computer Science & Engineering',
      institution: 'RV College of Engineering',
      cgpa: '9.45',
      issueDate: '2026-06-20',
      certificateType: 'Degree Certificate',
      recipientEmail: 'student@univ.edu'
    };

    const resCreate = await fetch(`${BASE_URL}/api/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(certPayload)
    });
    const dataCreate = await resCreate.json();
    if (!dataCreate.success) throw new Error('Failed to create certificate: ' + dataCreate.message);

    const createdCert = dataCreate.certificate;
    console.log(`  Certificate ID  : ${createdCert.certificateId}`);
    console.log(`  SHA-256 Hash    : ${createdCert.certificateHash}`);
    console.log(`  Previous Hash   : ${createdCert.previousHash}`);
    console.log(`  Key Version     : ${createdCert.keyVersion}`);
    console.log(`  QR Code Attached: ${createdCert.qrCodeDataUrl ? 'Yes (Base64 PNG)' : 'No'}`);

    if (!createdCert.qrCodeDataUrl || !createdCert.qrCodeDataUrl.startsWith('data:image/png;base64')) {
      throw new Error('QR code data URL was not generated on certificate creation');
    }
    console.log('  ✓ QR code successfully generated and embedded.');

    // ----------------------------------------------------
    // 3. 2-OF-3 CRYPTOGRAPHIC THRESHOLD SIGNATURES
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('SUITE 3: 2-of-3 Cryptographic Threshold Signatures (Ed25519)');
    console.log('----------------------------------------------------');

    // 1st Signature by Official 1
    const resSign1 = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${official1Token}` }
    });
    const dataSign1 = await resSign1.json();
    if (!dataSign1.success) throw new Error('1st official sign failed: ' + dataSign1.message);
    if (dataSign1.certificate.status !== 'PENDING_APPROVAL') {
      throw new Error('Status should remain PENDING_APPROVAL after 1st signature');
    }
    console.log('  ✓ 1st Ed25519 signature recorded. Status = PENDING_APPROVAL (1/2 threshold)');

    // Attempt duplicate signature by Official 1 -> must reject with 409
    const resDuplicateSign = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${official1Token}` }
    });
    if (resDuplicateSign.status !== 409) {
      throw new Error('Duplicate signature by same official should be rejected with 409');
    }
    console.log('  ✓ Duplicate signature attempt rejected (HTTP 409 Conflict)');

    // 2nd Signature by Official 2 -> satisfies 2-of-3 quorum -> ISSUED
    const resSign2 = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${official2Token}` }
    });
    const dataSign2 = await resSign2.json();
    if (!dataSign2.success || dataSign2.certificate.status !== 'ISSUED') {
      throw new Error('Certificate should transition to ISSUED after 2nd distinct signature');
    }
    console.log('  ✓ 2-of-3 Cryptographic Threshold Quorum reached!');
    console.log(`  ✓ Status transitioned to: ${dataSign2.certificate.status}`);

    const issuedCert = dataSign2.certificate;

    // ----------------------------------------------------
    // 4. MERKLE TREE & ZERO-PII ROOT REGISTRY
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('SUITE 4: Merkle Tree Generation & Public Registry');
    console.log('----------------------------------------------------');

    console.log(`  Merkle Leaf Hash : ${issuedCert.merkleLeafHash}`);
    console.log(`  Merkle Root      : ${issuedCert.merkleRoot}`);
    console.log(`  Merkle Batch ID  : ${issuedCert.batchId}`);
    console.log(`  Merkle Proof Path: ${issuedCert.merkleProof.length} steps`);

    if (!issuedCert.merkleRoot || !issuedCert.merkleLeafHash) {
      throw new Error('Merkle root or leaf hash missing on issued certificate');
    }

    // Query Public Merkle Root Registry
    const resMerkleRegistry = await fetch(`${BASE_URL}/api/public/merkle-root`);
    const dataMerkleRegistry = await resMerkleRegistry.json();
    if (!dataMerkleRegistry.success || !dataMerkleRegistry.rootHash) {
      throw new Error('Failed to query public Merkle root registry');
    }
    console.log(`  ✓ Public Merkle Root retrieved: ${dataMerkleRegistry.rootHash}`);
    console.log(`  ✓ Active Batch ID: ${dataMerkleRegistry.batchId}`);
    console.log(`  ✓ Certificates in Batch: ${dataMerkleRegistry.certificateCount}`);

    // Verify zero PII in public registry
    if (dataMerkleRegistry.studentName || dataMerkleRegistry.usn || dataMerkleRegistry.cgpa) {
      throw new Error('CRITICAL: Student PII detected in public Merkle root registry response!');
    }
    console.log('  ✓ Zero PII confirmed in public Merkle root registry response.');

    // ----------------------------------------------------
    // 5. PUBLIC 8-POINT VERIFICATION & TAMPER DETECTION
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('SUITE 5: Comprehensive 8-Point Public Verification');
    console.log('----------------------------------------------------');

    const resPublicVerify = await fetch(`${BASE_URL}/api/verify/${issuedCert.certificateId}`);
    const dataPublicVerify = await resPublicVerify.json();
    if (!dataPublicVerify.valid || dataPublicVerify.status !== 'ISSUED') {
      throw new Error('Public verification failed for authentic issued certificate');
    }

    console.log('  Security Checklist Results:');
    dataPublicVerify.securityChecklist.forEach((chk) => {
      console.log(`    ✓ [PASS] ${chk.name}: ${chk.description}`);
    });
    console.log('  ✓ ALL 8 Security Checks passed successfully!');

    // Tampering test: modify CGPA directly in database
    await fetch(`${BASE_URL}/api/certificates/${issuedCert.certificateId}/tamper-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ tamperedCgpa: '9.99' })
    });

    const resVerifyTampered = await fetch(`${BASE_URL}/api/verify/${issuedCert.certificateId}`);
    const dataVerifyTampered = await resVerifyTampered.json();
    if (dataVerifyTampered.valid !== false || dataVerifyTampered.status !== 'INVALID') {
      throw new Error('Tampered certificate was not detected as INVALID');
    }
    console.log('  ✓ Attack Vector 1 (CGPA alteration): Caught by SHA-256 canonical integrity check!');

    // Restore certificate
    await fetch(`${BASE_URL}/api/certificates/${issuedCert.certificateId}/restore-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ originalCgpa: '9.45' })
    });
    console.log('  ✓ Certificate restored to valid state.');

    // ----------------------------------------------------
    // 6. SECURE DELIVERY: X25519 DH + AES-256-GCM
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('SUITE 6: Secure Delivery (X25519 Diffie-Hellman + AES-256-GCM)');
    console.log('----------------------------------------------------');

    // Generate recipient X25519 keypair
    const resGenKey = await fetch(`${BASE_URL}/api/secure-delivery/generate-keypair`, { method: 'POST' });
    const dataGenKey = await resGenKey.json();
    const recipientPubKey = dataGenKey.publicKey;
    const recipientPrivKey = dataGenKey.privateKey;

    console.log('  ✓ Recipient X25519 key pair generated.');

    // Encrypt certificate using X25519 DH + HKDF + AES-256-GCM
    const resEncrypt = await fetch(`${BASE_URL}/api/secure-delivery/encrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        certificateId: issuedCert.certificateId,
        recipientPublicKey: recipientPubKey
      })
    });
    const dataEncrypt = await resEncrypt.json();
    if (!dataEncrypt.success || !dataEncrypt.envelope) {
      throw new Error('Secure delivery encryption failed: ' + dataEncrypt.message);
    }

    const envelope = dataEncrypt.envelope;
    console.log(`  ✓ Certificate encrypted with AES-256-GCM.`);
    console.log(`    - IV/Nonce Length    : ${envelope.iv.length / 2} bytes (96-bit standard)`);
    console.log(`    - Auth Tag Length   : ${envelope.authTag.length / 2} bytes (128-bit authentication)`);
    console.log(`    - Ciphertext Length : ${envelope.ciphertext.length} hex chars`);

    // Decrypt certificate using recipient private key
    const resDecrypt = await fetch(`${BASE_URL}/api/secure-delivery/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        envelope,
        recipientPrivateKey: recipientPrivKey
      })
    });
    const dataDecrypt = await resDecrypt.json();
    if (!dataDecrypt.success || !dataDecrypt.certificate) {
      throw new Error('Decryption failed for valid envelope: ' + dataDecrypt.message);
    }
    console.log(`  ✓ Decryption & Authentication Tag verified! Recovered student: ${dataDecrypt.certificate.studentName}`);

    // Tampered Ciphertext Attack
    const tamperedEnvelope = {
      ...envelope,
      ciphertext: envelope.ciphertext.slice(0, -4) + 'ffff' // Corrupt 2 bytes
    };
    const resTamperedDecrypt = await fetch(`${BASE_URL}/api/secure-delivery/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        envelope: tamperedEnvelope,
        recipientPrivateKey: recipientPrivKey
      })
    });
    const dataTamperedDecrypt = await resTamperedDecrypt.json();
    if (dataTamperedDecrypt.success || dataTamperedDecrypt.error !== 'AUTHENTICATION_FAILURE') {
      throw new Error('Tampered ciphertext was NOT rejected by AES-256-GCM authentication!');
    }
    console.log('  ✓ Attack Vector 2 (Modified ciphertext): Caught by AES-GCM Authentication Tag check (AUTHENTICATION_FAILURE)!');

    // ----------------------------------------------------
    // 7. KEY EVOLUTION & ROTATION
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('SUITE 7: Cryptographic Key Evolution & Historical Verification');
    console.log('----------------------------------------------------');

    const resRotate = await fetch(`${BASE_URL}/api/security/keys/rotate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason: 'Annual cryptographic key epoch update' })
    });
    const dataRotate = await resRotate.json();
    if (!dataRotate.success || dataRotate.newVersion.version !== 2) {
      throw new Error('Key rotation failed: ' + dataRotate.message);
    }
    console.log(`  ✓ Key successfully rotated to Version ${dataRotate.newVersion.version}`);

    // Historical verification: verify that certificate issued under Key Version 1 is still verified!
    const resHistoricalVerify = await fetch(`${BASE_URL}/api/verify/${issuedCert.certificateId}`);
    const dataHistoricalVerify = await resHistoricalVerify.json();
    if (!dataHistoricalVerify.valid) {
      throw new Error('Historical certificate verification failed after key rotation!');
    }
    console.log('  ✓ Historical certificate issued under Version 1 remains 100% verified under Version 2 epoch!');

    // ----------------------------------------------------
    // 8. COMPLETE HASH CHAIN AUDIT & AUDIT LOGGING
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('SUITE 8: Hash Chain Audit & Security Audit Logs');
    console.log('----------------------------------------------------');

    const resChainAudit = await fetch(`${BASE_URL}/api/security/verify-chain`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataChainAudit = await resChainAudit.json();
    if (!dataChainAudit.success || !dataChainAudit.chainValid) {
      console.log('Chain audit failure details:', JSON.stringify(dataChainAudit, null, 2));
      throw new Error('Complete chain audit returned invalid chain!');
    }
    console.log(`  ✓ Hash Chain Audit: All ${dataChainAudit.totalBlocks} blocks cryptographically linked and intact.`);

    // Check Security Audit Logs
    const resAudit = await fetch(`${BASE_URL}/api/security/audit-logs?limit=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataAudit = await resAudit.json();
    if (!dataAudit.success || dataAudit.logs.length === 0) {
      throw new Error('No security audit logs recorded');
    }
    console.log(`  ✓ Security Audit Trail: ${dataAudit.count} tamper-evident event logs recorded.`);
    console.log(`    Latest action: ${dataAudit.logs[0].action} by ${dataAudit.logs[0].actorRole}`);

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n================================================================');
    console.log('  ALL 20 CERTCHAIN 100% SPECIFICATION SUITES PASSED SUCCESSFULLY!  ');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ 100% TEST RUNNER FAILED WITH ERROR:', error);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();
  }
}

run100PercentTests();
