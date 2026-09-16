/**
 * Milestone 30% Automated Integration Test Runner
 * Validates TEST 1 through TEST 6 as defined in the project specification.
 */
process.env.NODE_ENV = 'test';
require('dotenv').config();

const mongoose = require('mongoose');
const { app } = require('../server');
const connectDB = require('../config/db');
const seedUsers = require('../config/seed');

const PORT = 5055;
let serverInstance;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  console.log('====================================================');
  console.log('  STARTING MILESTONE 30% AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Connect DB and seed default accounts
    await connectDB();
    await seedUsers();

    // 2. Start test server
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, '127.0.0.1', () => {
        console.log(`[Test Runner] Test server listening on ${BASE_URL}\n`);
        resolve();
      });
    });

    // ----------------------------------------------------
    // SETUP: Retrieve Official 1, Official 2, and Admin
    // ----------------------------------------------------
    console.log('[SETUP] Logging in test accounts...');

    // Official 1
    const resLogin1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'official1@univ.edu',
        password: 'OfficialPassword123!'
      })
    });
    const dataLogin1 = await resLogin1.json();
    if (!dataLogin1.success) throw new Error('Failed to login Official 1: ' + dataLogin1.message);
    const tokenOfficial1 = dataLogin1.token;
    console.log('  ✓ Official 1 authenticated successfully');

    // Official 2
    const resLogin2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'official2@univ.edu',
        password: 'OfficialPassword123!'
      })
    });
    const dataLogin2 = await resLogin2.json();
    if (!dataLogin2.success) throw new Error('Failed to login Official 2: ' + dataLogin2.message);
    const tokenOfficial2 = dataLogin2.token;
    console.log('  ✓ Official 2 authenticated successfully\n');

    // ====================================================
    // TEST 1: Create certificate -> SHA-256 generated -> stored -> PENDING_APPROVAL
    // ====================================================
    console.log('----------------------------------------------------');
    console.log('TEST 1: Create Certificate & Verify SHA-256 Generation & Status');
    console.log('----------------------------------------------------');

    const newCertPayload = {
      studentName: 'Pruthviraj S Kamble',
      usn: '4SO23CS177',
      course: 'B.E. Computer Science & Engineering',
      institution: 'St. Joseph Engineering College',
      cgpa: '8.75',
      issueDate: '2026-06-15',
      certificateType: 'Bachelor of Engineering Degree'
    };

    const resCreate = await fetch(`${BASE_URL}/api/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenOfficial1}`
      },
      body: JSON.stringify(newCertPayload)
    });
    const dataCreate = await resCreate.json();

    if (!dataCreate.success) {
      throw new Error('TEST 1 FAILED: ' + dataCreate.message);
    }

    const createdCert = dataCreate.certificate;
    console.log(`  Certificate ID  : ${createdCert.certificateId}`);
    console.log(`  Status          : ${createdCert.status}`);
    console.log(`  Previous Hash   : ${createdCert.previousHash}`);
    console.log(`  Certificate Hash: ${createdCert.certificateHash}`);
    console.log(`  Hash Length     : ${createdCert.certificateHash.length} chars (SHA-256 hex)`);

    if (createdCert.status !== 'PENDING_APPROVAL') {
      throw new Error(`TEST 1 FAILED: Expected PENDING_APPROVAL, got ${createdCert.status}`);
    }
    if (createdCert.certificateHash.length !== 64) {
      throw new Error(`TEST 1 FAILED: Hash length is not 64 chars!`);
    }
    console.log('>>> TEST 1 PASSED: Certificate created, SHA-256 generated, status = PENDING_APPROVAL\n');

    // ====================================================
    // TEST 5: Try approving twice with same official -> Request rejected
    // (Run before 2nd official approves)
    // ====================================================
    console.log('----------------------------------------------------');
    console.log('TEST 5: Duplicate Approval Prevention (Same Official Twice)');
    console.log('----------------------------------------------------');

    // Official 1 approves first time
    const resApprove1 = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenOfficial1}` }
    });
    const dataApprove1 = await resApprove1.json();
    console.log(`  1st Approval by Official 1: Status = ${dataApprove1.status}, Approvals = ${dataApprove1.approvalCount}/2`);

    // Official 1 tries to approve again!
    const resApproveDup = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenOfficial1}` }
    });
    const dataApproveDup = await resApproveDup.json();

    console.log(`  Duplicate Approval Attempt HTTP Code: ${resApproveDup.status}`);
    console.log(`  Duplicate Approval Response Message: "${dataApproveDup.message}"`);

    if (resApproveDup.status !== 409) {
      throw new Error(`TEST 5 FAILED: Expected HTTP 409 Conflict, received ${resApproveDup.status}`);
    }
    console.log('>>> TEST 5 PASSED: Duplicate approval prevented and rejected with HTTP 409\n');

    // ====================================================
    // TEST 6: Try approving without authorization -> Request rejected
    // ====================================================
    console.log('----------------------------------------------------');
    console.log('TEST 6: Unauthorized Approval Attempt');
    console.log('----------------------------------------------------');

    // Without token
    const resNoAuth = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/approve`, {
      method: 'POST'
    });
    const dataNoAuth = await resNoAuth.json();
    console.log(`  Unauthenticated request HTTP Code: ${resNoAuth.status}`);
    console.log(`  Response message: "${dataNoAuth.message}"`);

    if (resNoAuth.status !== 401) {
      throw new Error(`TEST 6 FAILED: Expected HTTP 401, got ${resNoAuth.status}`);
    }

    // With invalid token
    const resBadAuth = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer bad_fake_token_12345' }
    });
    if (resBadAuth.status !== 401) {
      throw new Error(`TEST 6 FAILED: Expected HTTP 401 for bad token, got ${resBadAuth.status}`);
    }
    console.log('>>> TEST 6 PASSED: Unauthorized approval requests properly rejected\n');

    // ====================================================
    // TEST 2: Official 1 approved -> Status PENDING_APPROVAL
    //         Official 2 approves -> Status = ISSUED
    // ====================================================
    console.log('----------------------------------------------------');
    console.log('TEST 2: Multi-Official Approval Workflow (2-of-2 Transition)');
    console.log('----------------------------------------------------');

    // Verify cert status after 1 approval is still PENDING_APPROVAL
    const resCheckPending = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}`, {
      headers: { 'Authorization': `Bearer ${tokenOfficial1}` }
    });
    const dataCheckPending = await resCheckPending.json();
    if (dataCheckPending.certificate.status !== 'PENDING_APPROVAL') {
      throw new Error(`TEST 2 FAILED: Expected status PENDING_APPROVAL after 1 approval, got ${dataCheckPending.certificate.status}`);
    }
    console.log(`  State after 1 approval: status = ${dataCheckPending.certificate.status} (${dataCheckPending.certificate.approvals.length}/2)`);

    // Official 2 approves
    const resApprove2 = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenOfficial2}` }
    });
    const dataApprove2 = await resApprove2.json();

    console.log(`  2nd Approval by Official 2: Status = ${dataApprove2.status}, Approvals = ${dataApprove2.approvalCount}/2`);
    if (dataApprove2.status !== 'ISSUED') {
      throw new Error(`TEST 2 FAILED: Expected status ISSUED after 2nd approval, got ${dataApprove2.status}`);
    }
    console.log('>>> TEST 2 PASSED: 2-Official approval completed and transitioned status to ISSUED\n');

    // ====================================================
    // TEST 3: Public Verify Issued Certificate -> SHA-256 Recalculated -> VALID
    // ====================================================
    console.log('----------------------------------------------------');
    console.log('TEST 3: Public Verification of Issued Certificate');
    console.log('----------------------------------------------------');

    const resVerify = await fetch(`${BASE_URL}/api/verify/${createdCert.certificateId}`);
    const dataVerify = await resVerify.json();

    console.log(`  Verification result: valid = ${dataVerify.valid}`);
    console.log(`  Certificate Status : ${dataVerify.status}`);
    console.log(`  Integrity Match    : ${dataVerify.integrityMatched}`);
    console.log(`  Message            : "${dataVerify.message}"`);

    if (!dataVerify.valid || dataVerify.status !== 'ISSUED' || !dataVerify.integrityMatched) {
      throw new Error(`TEST 3 FAILED: Verification failed for valid certificate: ${JSON.stringify(dataVerify)}`);
    }
    console.log('>>> TEST 3 PASSED: Public verification succeeded with live SHA-256 match\n');

    // ====================================================
    // TEST 4: Modify Certificate in Database -> Verify Again -> TAMPER DETECTED
    // ====================================================
    console.log('----------------------------------------------------');
    console.log('TEST 4: Tamper Detection (Modify DB Field -> Recalculated Hash Mismatch)');
    console.log('----------------------------------------------------');

    // Apply simulated tampering (modify CGPA from 8.75 to 9.95 directly in DB without changing certificateHash)
    const resTamper = await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/tamper-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenOfficial1}`
      },
      body: JSON.stringify({ tamperedCgpa: '9.95' })
    });
    const dataTamper = await resTamper.json();
    console.log(`  Tamper applied: ${dataTamper.message}`);

    // Now run public verification on the tampered certificate
    const resVerifyTampered = await fetch(`${BASE_URL}/api/verify/${createdCert.certificateId}`);
    const dataVerifyTampered = await resVerifyTampered.json();

    console.log(`  Verification result : valid = ${dataVerifyTampered.valid}`);
    console.log(`  Status              : ${dataVerifyTampered.status}`);
    console.log(`  Message             : "${dataVerifyTampered.message}"`);
    console.log(`  Stored Hash in DB   : ${dataVerifyTampered.storedHash}`);
    console.log(`  Recalculated Hash   : ${dataVerifyTampered.calculatedHash}`);

    if (dataVerifyTampered.valid !== false || dataVerifyTampered.status !== 'INVALID') {
      throw new Error(`TEST 4 FAILED: Tampered certificate was not marked INVALID!`);
    }
    if (!dataVerifyTampered.message.includes('tampering detected') && !dataVerifyTampered.message.includes('integrity verification failed')) {
      throw new Error(`TEST 4 FAILED: Expected tampering message not found`);
    }
    console.log('>>> TEST 4 PASSED: Tamper detection verified! SHA-256 mismatch caught modification.\n');

    // Restore certificate so DB remains consistent
    await fetch(`${BASE_URL}/api/certificates/${createdCert.certificateId}/restore-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenOfficial1}`
      },
      body: JSON.stringify({ originalCgpa: '8.75' })
    });
    console.log('  [Cleanup] Certificate restored to original state.');

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('====================================================');
    console.log('  ALL 6 MILESTONE 30% TESTS PASSED SUCCESSFULLY!  ');
    console.log('====================================================');

  } catch (error) {
    console.error('\n❌ TEST RUNNER FAILED WITH ERROR:', error);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();
  }
}

runTests();
