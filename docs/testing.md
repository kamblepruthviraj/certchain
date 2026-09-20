# CertChain: Automated Testing & Verification Guide

## 1. Automated Test Architecture
CertChain includes a comprehensive 20-requirement automated integration test suite (`backend/tests/certchain_100.test.js`) that verifies all functional, cryptographic, and operational specifications without requiring manual intervention.

### Quick Test Execution
To run the complete automated test suite from the repository root:
```bash
npm test
```
Or directly within the `backend/` directory:
```bash
cd backend
npm test
```

---

## 2. Test Suites & 20 Requirement Checklist

| Suite | Target Domain | Requirements Verified |
| :--- | :--- | :--- |
| **Suite 1** | RBAC & Multi-Role Authentication | 1. Authenticate Admin, Official 1, Official 2, Official 3, Student, Verifier.<br>2. Enforce RBAC: Student blocked from certificate creation (`HTTP 403`). |
| **Suite 2** | Deterministic Canonicalization & Hashing | 3. Sequential unique ID generation (`CERT-2026-XXXX`).<br>4. Deterministic key ordering and canonical JSON string derivation.<br>5. Genesis hash linking (`previousHash: 'GENESIS'`).<br>6. Verification QR code generation (Base64 PNG data URL). |
| **Suite 3** | 2-of-3 Ed25519 Threshold Quorum | 7. 1st official Ed25519 signature recorded; status remains `PENDING_APPROVAL` (1/2 threshold).<br>8. Duplicate signature attempt by same official rejected (`HTTP 409 Conflict`).<br>9. 2nd distinct official signature satisfies 2-of-3 quorum; status transitions to `ISSUED`. |
| **Suite 4** | Merkle Tree & Zero-PII Root Registry | 10. Binary leaf hash derivation: $\text{Leaf} = \text{SHA-256}(\text{certificateHash})$.<br>11. Bitcoin-style odd node duplication rule.<br>12. Sibling inclusion proof generation ($O(\log N)$ path).<br>13. Public zero-PII Merkle root registry exposes root hash without student PII. |
| **Suite 5** | 8-Point Public Verification & Tamper Defense | 14. Full 8-point checklist execution on valid certificate (all checks pass).<br>15. **Attack Vector 1**: Direct CGPA alteration caught by canonical SHA-256 hash check. |
| **Suite 6** | Confidential Delivery (X25519 + AES-GCM) | 16. Recipient X25519 keypair generation.<br>17. Shared secret derivation via X25519 DH + HKDF-SHA256.<br>18. AES-256-GCM encryption with 96-bit IV and 128-bit Auth Tag.<br>19. **Attack Vector 2**: Tampered ciphertext bit-flip triggers `AUTHENTICATION_FAILURE`. |
| **Suite 7** | Key Evolution & Historical Verification | 20. Key epoch rotation to Version 2.<br>21. Historical certificate issued under Version 1 remains 100% verified under Version 2 epoch. |
| **Suite 8** | Chain Audits & Security Event Logging | 22. Full chronological hash chain audit (`/api/security/verify-chain`).<br>23. Tamper-evident security audit trail logging (`/api/security/audit-logs`). |

---

## 3. Sample Verification Output
When running `npm test`, the following output confirms a successful verification:
```
================================================================
  CERTCHAIN: 100% MILESTONE AUTOMATED VERIFICATION SUITE
================================================================

[Database] MongoDB Connected: 127.0.0.1
[Test Server] Listening on http://127.0.0.1:5066

----------------------------------------------------
SUITE 1: Multi-Role Authentication & Access Control
----------------------------------------------------
  ✓ Admin, Officials (1, 2, 3), Student, and Verifier authenticated successfully.
  ✓ RBAC enforced: Student restricted from certificate creation (HTTP 403)

----------------------------------------------------
SUITE 2: Deterministic Canonicalization, SHA-256 & QR
----------------------------------------------------
  Certificate ID  : CERT-2026-0001
  SHA-256 Hash    : a832254008863afe9b333c7b23f9dc9c62e4b44cef768f0a4ff9f8943917ac38
  Previous Hash   : GENESIS
  Key Version     : 1
  QR Code Attached: Yes (Base64 PNG)
  ✓ QR code successfully generated and embedded.

----------------------------------------------------
SUITE 3: 2-of-3 Cryptographic Threshold Signatures (Ed25519)
----------------------------------------------------
  ✓ 1st Ed25519 signature recorded. Status = PENDING_APPROVAL (1/2 threshold)
  ✓ Duplicate signature attempt rejected (HTTP 409 Conflict)
  ✓ 2-of-3 Cryptographic Threshold Quorum reached!
  ✓ Status transitioned to: ISSUED

----------------------------------------------------
SUITE 4: Merkle Tree Generation & Public Registry
----------------------------------------------------
  Merkle Leaf Hash : 3169ea14b637ed3097095e09db223541d353f1b94fe2d30b4844c61f47ca05b8
  Merkle Root      : 3169ea14b637ed3097095e09db223541d353f1b94fe2d30b4844c61f47ca05b8
  Merkle Batch ID  : BATCH-2026-0001
  Merkle Proof Path: 0 steps
  ✓ Public Merkle Root retrieved: 3169ea14b637ed3097095e09db223541d353f1b94fe2d30b4844c61f47ca05b8
  ✓ Active Batch ID: BATCH-2026-0001
  ✓ Certificates in Batch: 1
  ✓ Zero PII confirmed in public Merkle root registry response.

----------------------------------------------------
SUITE 5: Comprehensive 8-Point Public Verification
----------------------------------------------------
  Security Checklist Results:
    ✓ [PASS] Certificate Record Exists: Found certificate record in the institutional database
    ✓ [PASS] Certificate Status: ISSUED: Certificate is formally signed and issued
    ✓ [PASS] SHA-256 Canonical Integrity: Recomputed hash matches stored cryptographic hash perfectly
    ✓ [PASS] Hash Chain Predecessor Linkage: Valid cryptographic link to predecessor block or GENESIS
    ✓ [PASS] Cryptographic Threshold Signatures (2-of-3 Quorum): Verified 2 distinct Ed25519 digital signatures against committee public keys
    ✓ [PASS] Merkle Tree Inclusion Proof: Cryptographic Merkle path derives trusted Merkle root
    ✓ [PASS] Merkle Root Public Registry Match: Root hash is registered in the public tamper-evident registry
    ✓ [PASS] Cryptographic Timestamp Token: Verified TSA signature issued on Thu, 17 Sep 2026 17:56:29 GMT
  ✓ ALL 8 Security Checks passed successfully!
  ✓ Attack Vector 1 (CGPA alteration): Caught by SHA-256 canonical integrity check!
  ✓ Certificate restored to valid state.

----------------------------------------------------
SUITE 6: Secure Delivery (X25519 Diffie-Hellman + AES-256-GCM)
----------------------------------------------------
  ✓ Recipient X25519 key pair generated.
  ✓ Certificate encrypted with AES-256-GCM.
    - IV/Nonce Length    : 12 bytes (96-bit standard)
    - Auth Tag Length   : 16 bytes (128-bit authentication)
    - Ciphertext Length : 2976 hex chars
  ✓ Decryption & Authentication Tag verified! Recovered student: Rahul S Verma
  ✓ Attack Vector 2 (Modified ciphertext): Caught by AES-GCM Authentication Tag check (AUTHENTICATION_FAILURE)!

----------------------------------------------------
SUITE 7: Cryptographic Key Evolution & Historical Verification
----------------------------------------------------
  ✓ Key successfully rotated to Version 2
  ✓ Historical certificate issued under Version 1 remains 100% verified under Version 2 epoch!

----------------------------------------------------
SUITE 8: Hash Chain Audit & Security Audit Logs
----------------------------------------------------
  ✓ Hash Chain Audit: All 1 blocks cryptographically linked and intact.
  ✓ Security Audit Trail: 10 tamper-evident event logs recorded.
    Latest action: CHAIN_AUDIT_EXECUTE by Admin

================================================================
  ALL 20 CERTCHAIN 100% SPECIFICATION SUITES PASSED SUCCESSFULLY!  
================================================================
```
