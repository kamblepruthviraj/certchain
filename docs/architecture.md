# CertChain: System Architecture Specification

## 1. Executive Overview
**CertChain** is an enterprise-grade Secure Digital Certificate Management System developed as a Project-Based Learning (PBL) capstone. The platform guarantees the integrity, authenticity, non-repudiation, and confidential delivery of academic credentials using modern applied cryptography.

Unlike conventional database-driven certificate systems that are vulnerable to insider manipulation, database administrator (DBA) tampering, and credential forgery, CertChain implements a multi-layered cryptographic defense-in-depth architecture:
- **Deterministic Canonicalization**: Guarantees identical hashing across heterogeneous runtimes.
- **Continuous SHA-256 Hash Chaining**: Links certificate blocks chronologically from a known `GENESIS` block.
- **2-of-3 Cryptographic Threshold Multi-Signatures**: Employs an authorized institutional committee using Ed25519 asymmetric keypairs.
- **Zero-PII Binary Merkle Trees**: Aggregates certificate batches into single 32-byte roots with $O(\log N)$ inclusion proofs.
- **End-to-End Authenticated Delivery**: Implements Curve25519 (X25519) Diffie-Hellman Key Agreement, HKDF-SHA256 key derivation, and AES-256-GCM authenticated encryption.
- **Cryptographic Key Evolution**: Supports key epoch versioning with backward-compatible historical verification.
- **Cryptographic Timestamp Authority (TSA)**: Provides proof of existence prior to a certified point in time.

---

## 2. Layered Architecture Diagram

```
+-----------------------------------------------------------------------+
|                         PRESENTATION LAYER                            |
|  React 19 + Vite SPA | Role-Based Navigation | Responsive Glassmorphism |
|  - Verifier / Normal User: Verify Portal, Dashboard, Pending Requests       |
|  - University Official & Admin: Issue Cert, 2-of-3 Approvals, Hash Chain,  |
|                                Merkle Registry, Secure Delivery, Security   |
+-----------------------------------------------------------------------+
                                   |  HTTPS / JSON API
+-----------------------------------------------------------------------+
|                          API GATEWAY LAYER                            |
|  Express.js | Helmet Security Headers | Rate Limiters | CORS          |
|  NoSQL Injection Sanitizer | 1MB Payload Protection | JWT Middleware  |
+-----------------------------------------------------------------------+
                                   |
+-----------------------------------------------------------------------+
|                       APPLICATION & BUSINESS LOGIC                    |
|  Controllers:                                                         |
|  - certificateController  : Issuance, Approvals, Tamper Hooks         |
|  - verifyController       : 8-Point Verification Pipeline             |
|  - merkleController       : Tree Batching, Root Registry, Proofs      |
|  - deliveryController     : X25519 Key Exchange, AES-GCM Envelopes   |
|  - securityController     : Chain Audits, Key Rotation, Audit Logs    |
+-----------------------------------------------------------------------+
                                   |
+-----------------------------------------------------------------------+
|                      CRYPTOGRAPHIC ENGINE LAYER                       |
|  - Deterministic Canonicalizer (Strict Key Ordering + ISO Normalization)|
|  - SHA-256 Hash Engine (Chaining with previousHash)                   |
|  - 2-of-3 Ed25519 Threshold Quorum Multi-Signature Scheme             |
|  - Binary Merkle Tree Builder (Bitcoin-style Duplicate Odd Rules)     |
|  - X25519 DH + HKDF-SHA256 + AES-256-GCM Authenticated Encryption    |
|  - Internal Cryptographic TSA Token Issuer & Signature Verifier      |
|  - Key Evolution & Version Epoch Manager (ACTIVE/ROTATED/REVOKED)     |
+-----------------------------------------------------------------------+
                                   |
+-----------------------------------------------------------------------+
|                         DATA PERSISTENCE LAYER                        |
|  MongoDB Database:                                                    |
|  - users            : Institutional accounts & official public keys   |
|  - certificates     : Canonical payloads, hashes, proofs, signatures  |
|  - merklebatches    : Batched leaf collections & tree states          |
|  - merkleroots      : Public zero-PII batch root registry             |
|  - keyversions      : Cryptographic key epochs & committee records    |
|  - timestamprecords : Immutable TSA signature proofs                  |
|  - securedeliveries : Encrypted AES-256-GCM delivery envelopes        |
|  - auditlogs        : Security event audit trail                      |
+-----------------------------------------------------------------------+
```

---

## 3. Core Database Entities & Schemas

### 3.1 Certificate Entity (`certificates`)
The central record representing an academic credential:
```javascript
{
  certificateId: "CERT-2026-0001",           // Sequential unique identifier
  studentName: "Rahul S Verma",              // Student Full Name
  usn: "1RV23CS042",                         // University Seat Number (Uppercase)
  course: "B.E. Computer Science & Eng.",    // Degree Program
  institution: "RV College of Engineering",  // Awarding Institution
  cgpa: "9.45",                              // Cumulative Grade Point Average
  issueDate: ISODate("2026-06-20"),          // Normalized Date
  certificateType: "Degree Certificate",     // Classification
  canonicalData: "{\"certificateId\":...}",  // Deterministic JSON string
  previousHash: "GENESIS",                   // SHA-256 link to prior block
  certificateHash: "a83225...38",            // SHA256(previousHash + canonicalData)
  status: "ISSUED",                          // PENDING_APPROVAL | ISSUED | REJECTED | REVOKED
  keyVersion: 1,                             // Key epoch under which cert was issued
  approvals: [ ... ],                        // Administrative review records
  thresholdSignatures: [                     // Ed25519 Digital Signatures
    {
      officialId: ObjectId("..."),
      officialName: "Dr. Ramesh Sharma",
      keyId: "KEY-OFFICIAL1-v1",
      signature: "3a8f...21",
      algorithm: "Ed25519",
      signedAt: ISODate("...")
    }
  ],
  merkleLeafHash: "3169...b8",               // Leaf digest in batch tree
  merkleRoot: "3169...b8",                   // Merkle root hash of batch
  merkleProof: [ ... ],                      // Sibling audit path to root
  batchId: "BATCH-2026-0001",                // Associated Merkle batch
  timestampProof: {                          // Cryptographic timestamp token
    timestamp: ISODate("..."),
    timestampAuthority: "CertChain Internal TSA",
    signature: "6f82...10"
  },
  qrCodeDataUrl: "data:image/png;base64,..." // Embedded verification QR Code
}
```

### 3.2 Public Merkle Root Entity (`merkleroots`)
The public-facing proof registry exposing zero student PII:
```javascript
{
  batchId: "BATCH-2026-0001",
  rootHash: "3169ea14b637ed3097095e09db223541d353f1b94fe2d30b4844c61f47ca05b8",
  certificateCount: 4,
  treeVersion: 1,
  publishedAt: ISODate("2026-09-17T17:56:29Z")
}
```

### 3.3 Key Version Entity (`keyversions`)
Tracks committee key evolution across time:
```javascript
{
  version: 1,
  status: "ACTIVE", // ACTIVE | ROTATED | REVOKED
  algorithm: "Ed25519",
  threshold: 2,
  committeeSize: 3,
  committee: [
    { officialId: "...", officialName: "...", keyId: "KEY-OFFICIAL1-v1", publicKey: "-----BEGIN PUBLIC KEY..." },
    { officialId: "...", officialName: "...", keyId: "KEY-OFFICIAL2-v1", publicKey: "-----BEGIN PUBLIC KEY..." },
    { officialId: "...", officialName: "...", keyId: "KEY-OFFICIAL3-v1", publicKey: "-----BEGIN PUBLIC KEY..." }
  ],
  validFrom: ISODate("2026-01-01T00:00:00Z"),
  validTo: null
}
```

---

## 4. Lifecycle & State Machine

```
[Draft Created by Admin / Official]
                │
                ▼
        STATUS: PENDING_APPROVAL
        - Computes previousHash from chain head
        - Derives canonicalData & certificateHash
        - Generates Verification QR Code
        - Approvals count = 0 / 2
                │
                ├──────────────────────────────────────┐
                │ 1st Official Signs (Ed25519)         │ Reject by Official
                ▼                                      ▼
        STATUS: PENDING_APPROVAL                STATUS: REJECTED
        - Approvals count = 1 / 2               - Terminal state
        - Duplicate signature blocked
                │
                │ 2nd Distinct Official Signs (Ed25519)
                ▼
        STATUS: ISSUED (2-of-3 Quorum Satisfied)
        - Issue Cryptographic TSA Timestamp Token
        - Insert Leaf into Persistent Merkle Batch
        - Compute Merkle Root & Sibling Inclusion Proof
        - Register Root in Public Zero-PII Merkle Registry
                │
                ▼
        STATUS: DELIVERED (On Student Claim)
        - Curve25519 DH + HKDF + AES-256-GCM Envelope Created
```

---

## 5. Trust Boundaries & Threat Model

| Zone | Actors | Trust Level | Security Controls |
| :--- | :--- | :--- | :--- |
| **Public Zone** | Employers, Public Verifiers, Unauthenticated Users | Untrusted | Rate limited (120 req / 10 min), Read-only verification, Zero PII Merkle roots |
| **Recipient Zone** | Graduating Students | Partially Trusted | RBAC restriction (No certificate creation/approval), Client-side X25519 keypair |
| **Administrative Zone** | University Officials, Controller of Exams | High Trust | 2-of-3 threshold quorum required; no single official can issue credentials unilaterally |
| **Database Zone** | MongoDB, DBAs, Host OS | Susceptible to Tampering | Deterministic SHA-256 hashing and Merkle proofs immediately expose any direct DB edits |
