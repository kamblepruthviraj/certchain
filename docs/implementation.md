# CertChain: Implementation & Technical Working Documentation

**Secure Digital Certificate Management System**  
*Comprehensive Technical Implementation, Architecture, Cryptographic Pipeline & Verification Guide*

---

| Attribute | Details |
| :--- | :--- |
| **Project Title** | CertChain: Secure Digital Certificate Management System |
| **Lead Developer** | Pruthviraj S Kamble (USN: 4SO23CS177) |
| **Department** | Department of Computer Science & Engineering |
| **Institution** | St. Joseph Engineering College, Mangaluru |
| **Version & Date** | Version 2.0 (Milestone Release) • September 2026 |
| **GitHub Repository** | [https://github.com/kamblepruthviraj/certchain](https://github.com/kamblepruthviraj/certchain) |
| **Evaluation Domain** | Cryptography, Network Security, Applied Block Structures & Public Auditing |

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Objectives](#2-system-objectives)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Project Folder Structure](#5-project-folder-structure)
6. [User Roles & Access Levels](#6-user-roles--access-levels)
7. [Certificate Creation Workflow](#7-certificate-creation-workflow)
8. [Certificate Data Model](#8-certificate-data-model)
9. [SHA-256 Implementation](#9-sha-256-implementation)
10. [Hash Chain Implementation](#10-hash-chain-implementation)
11. [Multi-Official Approval Workflow](#11-multi-official-approval-workflow)
12. [Merkle Tree Implementation](#12-merkle-tree-implementation)
13. [Merkle Root & Zero-PII Registry](#13-merkle-root--zero-pii-registry)
14. [QR Code Verification](#14-qr-code-verification)
15. [Certificate Verification Pipeline](#15-certificate-verification-pipeline)
16. [Tamper Detection Mechanism](#16-tamper-detection-mechanism)
17. [Database Architecture & Collections](#17-database-architecture--collections)
18. [API Documentation](#18-api-documentation)
19. [Authentication Mechanism](#19-authentication-mechanism)
20. [Role-Based Access Control (RBAC)](#20-role-based-access-control-rbac)
21. [Security Features Matrix](#21-security-features-matrix)
22. [Most Important Source Files](#22-most-important-source-files)
23. [Core Code Snippets](#23-core-code-snippets)
24. [Frontend Architecture & Working](#24-frontend-architecture--working)
25. [Backend Architecture & Request Lifecycle](#25-backend-architecture--request-lifecycle)
26. [End-to-End System Workflow](#26-end-to-end-system-workflow)
27. [Automated Testing & Test Results](#27-automated-testing--test-results)
28. [PBL Security Demonstration Procedure](#28-pbl-security-demonstration-procedure)
29. [Current Implementation vs Future Roadmap](#29-current-implementation-vs-future-roadmap)
30. [System Limitations](#30-system-limitations)
31. [Future Enhancements](#31-future-enhancements)
32. [Conclusion & Implementation Status](#32-conclusion--implementation-status)

---

## 1. Project Overview

### What is CertChain?
**CertChain** is an academic credential management and verification platform engineered to prevent academic fraud, transcript forgery, and unauthorized record modification. Conventional digital record systems store student qualifications in centralized databases where administrative insiders, compromised server credentials, or rogue database administrators (DBAs) can alter grades, degrees, and student identifiers undetected.

### The Problem It Solves
- **Diploma Mills & Forgery**: Traditional paper certificates and static PDF diplomas are easily forged using graphic editing tools.
- **Silent Database Manipulation**: In typical educational ERPs, modifying a student's CGPA directly in the database (`UPDATE certificates SET cgpa = '9.9'`) leaves no cryptographic footprint.
- **Centralized Issuance Risks**: A single compromised administrative key allows fraudulent diplomas to be generated unilaterally.
- **Privacy vs. Verification Trade-off**: Public verification typically requires revealing student Personally Identifiable Information (PII) to unauthenticated third parties.

### Main Security Objective
CertChain enforces a **zero-trust, multi-layered cryptographic defense**:
1. Every certificate is deterministically serialized and linked chronologically to the preceding certificate via **SHA-256 hash chaining** originating from a `GENESIS` block.
2. Issuance requires a **2-of-3 threshold quorum** of independent digital signatures using Ed25519 asymmetric keypairs.
3. Credentials are batch-aggregated into **binary Merkle trees** publishing compact 32-byte zero-PII roots to an immutable registry.
4. Tampering with any field (e.g. altering CGPA by even a fraction of a decimal point) immediately breaks the canonical digest and severs the cryptographic chain.

---

## 2. System Objectives

The platform accomplishes seven core objectives:

| Objective | Description | Implementation Status |
| :--- | :--- | :---: |
| **Secure Certificate Issuance** | Deterministic canonical JSON serialization preventing runtime parsing discrepancies. | **CURRENTLY IMPLEMENTED** |
| **Certificate Integrity** | Strict SHA-256 cryptographic digest calculation over canonical data and predecessor hash. | **CURRENTLY IMPLEMENTED** |
| **Tamper Detection** | Real-time divergence between stored hash and recomputed digest upon any field modification. | **CURRENTLY IMPLEMENTED** |
| **Multi-Official Approval** | 2-of-3 threshold signature quorum preventing unilateral issuance by any single authority. | **CURRENTLY IMPLEMENTED** |
| **Fast Public Verification** | Instant verification by Certificate ID or QR code without requiring user login. | **CURRENTLY IMPLEMENTED** |
| **Zero-PII Public Auditing** | Merkle tree inclusion proofs ($O(\log N)$) proving batch membership without exposing other records. | **CURRENTLY IMPLEMENTED** |
| **Confidential Delivery** | Recipient-targeted X25519 Diffie-Hellman + AES-256-GCM authenticated encryption. | **CURRENTLY IMPLEMENTED** |
| **Hardware Security Module (HSM)** | Dedicated FIPS 140-2 Level 3 hardware module for committee key storage. | *PLANNED / FUTURE* |
| **Decentralized L1 Blockchain Anchor**| Anchoring Merkle root hashes periodically to Ethereum or Polygon mainnet. | *PLANNED / FUTURE* |

---

## 3. System Architecture

CertChain is architected in a modular, decoupled structure:

```
+-----------------------------------------------------------------------------+
|                            PRESENTATION LAYER (SPA)                         |
|  React 19 + Vite | Role-Based Views | Dark Navy Glassmorphism UI            |
|  - Verifier / Normal User: Verify Portal, Dashboard, Pending Requests       |
|  - University Official & Admin: Issue Cert, 2-of-3 Approvals, Hash Chain,  |
|                                Merkle Registry, Secure Delivery, Security   |
+-----------------------------------------------------------------------------+
                                       │  HTTPS / REST JSON
+-----------------------------------------------------------------------------+
|                             API GATEWAY LAYER                               |
|  Express.js | Helmet Security Headers | Rate Limiters | NoSQL Sanitization   |
|  JWT Bearer Authentication Middleware | Role Authorization (requireRoles)   |
+-----------------------------------------------------------------------------+
                                       │
+-----------------------------------------------------------------------------+
|                       APPLICATION & CONTROLLER LAYER                        |
|  - authController         : User authentication, JWT issuance & bcrypt      |
|  - certificateController  : Issuance, 2-of-3 approvals, requests, tamper   |
|  - verifyController       : 8-point / 7-point cryptographic verification    |
|  - merkleController       : Tree batching, root derivation & proof auditing |
|  - deliveryController     : X25519 DH key generation, AES-256-GCM delivery   |
|  - securityController     : Full chain verification, key rotation, audits   |
+-----------------------------------------------------------------------------+
                                       │
+-----------------------------------------------------------------------------+
|                         CRYPTOGRAPHIC SERVICES LAYER                        |
|  - hash.js                : buildCanonicalData, sha256, hash chain validator|
|  - thresholdSignService.js: Ed25519 keypairs, signing, 2-of-3 quorum check  |
|  - merkleService.js       : Derive leaf, build tree, Merkle proof verify    |
|  - timestampService.js    : Cryptographic TSA token issuance & verification |
|  - secureDeliveryService.js: X25519 DH agreement, HKDF-SHA256, AES-256-GCM  |
|  - keyEvolutionService.js : Key version lifecycle (ACTIVE, ROTATED)         |
|  - auditService.js        : Tamper-evident security audit event logging     |
+-----------------------------------------------------------------------------+
                                       │  Mongoose ODM
+-----------------------------------------------------------------------------+
|                            DATA PERSISTENCE LAYER                           |
|  MongoDB Database:                                                          |
|  - users, certificates, certificaterequests, merklebatches, merkleroots,    |
|    keyversions, timestamprecords, securedeliveries, auditlogs               |
+-----------------------------------------------------------------------------+
```

---

## 4. Technology Stack

Every technology documented below is actively used in the repository:

| Technology | Layer | Exact Purpose in CertChain |
| :--- | :--- | :--- |
| **Node.js (v20+)** | Backend Runtime | Non-blocking asynchronous server environment for all APIs and cryptography. |
| **Express.js (v4.21)** | Web Framework | REST API routing, rate limiting, security middleware, and controller orchestration. |
| **MongoDB (v7+)** | Database Engine | Document store for certificates, cryptographic proofs, Merkle batches, and audit logs. |
| **Mongoose (v8.9)** | ODM Library | Schema validation, indexing, and model management for database entities. |
| **Node.js `crypto`** | Cryptography | Native engine for SHA-256 digests, Ed25519 digital signatures, X25519 Diffie-Hellman, HKDF key derivation, and AES-256-GCM authenticated encryption. |
| **jsonwebtoken (v9.0)** | Authentication | Stateless session authentication via cryptographically signed JWT Bearer tokens. |
| **bcryptjs (v2.4)** | Password Security | One-way password hashing using salted bcrypt (10 rounds). |
| **qrcode (v1.5)** | QR Code Engine | Dynamic Base64 verification QR code generation embedded on certificate records. |
| **Helmet (v8.0)** | HTTP Hardening | Security HTTP headers (XSS filter, nosniff, frameguard). |
| **express-rate-limit** | Abuse Defense | Brute-force and rate-limiting defense on authentication and public verification. |
| **React (v19.2)** | Frontend Framework | Component-based interactive Single Page Application (SPA). |
| **Vite (v8.3)** | Frontend Tooling | High-performance build tool and development server with SPA proxying. |
| **Lucide React** | Visual Interface | Iconography for security status badges, cryptographic indicators, and navigation. |

---

## 5. Project Folder Structure

The repository follows a clean, modular structure:

```
certchain/
├── backend/
│   ├── config/
│   │   ├── db.js                     # MongoDB connection pool configuration
│   │   ├── official_keystore.json    # Persisted Ed25519 committee keys
│   │   └── seed.js                   # Default user accounts & sample requests seed
│   ├── controllers/
│   │   ├── authController.js         # User registration, login, and profile
│   │   ├── certificateController.js  # Certificate creation, 2-of-3 approval, requests
│   │   ├── deliveryController.js     # X25519 keypair generation & AES-GCM delivery
│   │   ├── merkleController.js       # Merkle batch retrieval & proof verification
│   │   ├── securityController.js     # Full hash chain audit, key rotation, audit logs
│   │   └── verifyController.js       # Public 8-point / 7-point verification pipeline
│   ├── middleware/
│   │   └── auth.js                   # JWT verification (verifyToken) & RBAC (requireRoles)
│   ├── models/
│   │   ├── AuditLog.js               # Tamper-evident security audit trail
│   │   ├── Certificate.js            # Core certificate schema with cryptographic proofs
│   │   ├── CertificateRequest.js     # User certificate and transcript requests
│   │   ├── KeyVersion.js             # Cryptographic key epoch evolution records
│   │   ├── MerkleBatch.js            # Batch leaf aggregation for Merkle tree builder
│   │   ├── MerkleRoot.js             # Public zero-PII Merkle root registry
│   │   ├── SecureDelivery.js         # Encrypted envelopes (IV, tag, ciphertext)
│   │   ├── TimestampRecord.js        # Internal TSA timestamp authority records
│   │   └── User.js                   # User schema with bcrypt password hashing
│   ├── routes/
│   │   ├── authRoutes.js             # /api/auth endpoints
│   │   ├── certificateRoutes.js      # /api/certificates endpoints
│   │   ├── deliveryRoutes.js         # /api/secure-delivery endpoints
│   │   ├── merkleRoutes.js           # /api/public Merkle endpoints
│   │   ├── securityRoutes.js         # /api/security endpoints
│   │   └── verifyRoutes.js           # /api/verify public verification endpoint
│   ├── services/
│   │   ├── auditService.js           # Sanitized event logging service
│   │   ├── keyEvolutionService.js    # Key rotation and epoch tracking
│   │   ├── merkleService.js          # Binary tree builder, roots, and proofs
│   │   ├── secureDeliveryService.js  # X25519 DH agreement & AES-256-GCM encryption
│   │   ├── thresholdSignService.js   # Ed25519 2-of-3 threshold quorum validation
│   │   └── timestampService.js       # Cryptographic TSA token generator
│   ├── tests/
│   │   └── certchain_100.test.js     # 20-suite comprehensive automated integration test
│   ├── utils/
│   │   └── hash.js                   # Canonicalization, SHA-256, and chain validation
│   └── server.js                     # Express application bootstrap & middleware
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HashBadge.jsx         # Monospace formatted hash badges with copy feature
│   │   │   ├── Navbar.jsx            # Role-based navigation with mobile responsive drawer
│   │   │   └── UserProfileModal.jsx  # User identity and profile modal
│   │   ├── pages/
│   │   │   ├── CertDetailsPage.jsx   # Detailed block inspector & 5-vector defense sandbox
│   │   │   ├── CertificatesListPage.jsx # Chronological Hash Chain Explorer
│   │   │   ├── CreateCertPage.jsx    # Certificate issuance form with auto-fill
│   │   │   ├── DashboardPage.jsx     # Role-aware dashboard dispatcher
│   │   │   ├── LoginPage.jsx         # Sign-in & registration with 1-click role demos
│   │   │   ├── MerkleRegistryPage.jsx # Public zero-PII Merkle registry & live auditor
│   │   │   ├── NormalUserDashboard.jsx # Streamlined dashboard for verifiers and students
│   │   │   ├── PendingApprovalsPage.jsx # Multi-official 2-of-3 approval queue
│   │   │   ├── PendingRequestsPage.jsx # User certificate request status & submission
│   │   │   ├── SecureDeliveryPage.jsx # X25519 DH + AES-GCM encryption/decryption sandbox
│   │   │   ├── SecurityCenterPage.jsx # Chain audit, key rotation, security event logs
│   │   │   └── VerifyCertPage.jsx    # Primary public verification portal
│   │   ├── services/
│   │   │   └── api.js                # Centralized fetch client attaching JWT Bearer token
│   │   ├── App.jsx                   # Routing, URL synchronization & route protection
│   │   ├── index.css                 # Dark navy design tokens, glassmorphism, responsive CSS
│   │   └── main.jsx                  # React application entry point
│   ├── index.html                    # HTML shell
│   └── vite.config.js                # Vite dev server and /api proxy configuration
│
├── docs/                             # In-depth architectural, cryptographic, and testing guides
├── package.json                      # Root npm scripts orchestration
└── start-dev.js                      # Concurrent backend & frontend bootstrapper
```

---

## 6. User Roles & Access Levels

CertChain implements strict Role-Based Access Control across four distinct roles:

| Role | Permitted Actions | Accessible Frontend Views | Authorized Backend APIs |
| :--- | :--- | :--- | :--- |
| **Normal User / Verifier** *(also Guest)* | • Public Certificate Verification<br>• View Verification Metrics<br>• View & Submit Certificate Requests<br>• View Personal Profile | `/verify`<br>`/dashboard`<br>`/pending-requests`<br>`/verify/:certificateId` | `GET /api/verify/:certificateId`<br>`GET /api/certificates/verifier-stats`<br>`GET /api/certificates/my-requests`<br>`POST /api/certificates/request`<br>`GET /api/auth/me` |
| **Student** | • All Verifier Capabilities<br>• Receive Encrypted Credentials<br>• Decrypt Personal Certificate | `/verify`<br>`/dashboard`<br>`/pending-requests`<br>`/secure-delivery` | Above + `POST /api/secure-delivery/encrypt`<br>`POST /api/secure-delivery/decrypt`<br>`GET /api/secure-delivery/:certId` |
| **University Official** | • Issue New Certificates<br>• Perform 2-of-3 Multi-Signature Approvals<br>• Reject Erroneous Requests<br>• View Full Hash Chain Explorer<br>• Inspect Merkle Batches & Roots<br>• Perform Secure Delivery Operations<br>• Execute Security Center Audits | Above +<br>`/issue`<br>`/approvals`<br>`/hash-chain`<br>`/merkle`<br>`/secure-delivery`<br>`/security` | Above + `POST /api/certificates`<br>`GET /api/certificates/pending`<br>`POST /api/certificates/:id/approve`<br>`POST /api/certificates/:id/reject`<br>`GET /api/certificates/chain-status`<br>`GET /api/security/verify-chain` |
| **Administrator** | • Full System Oversight<br>• Cryptographic Key Epoch Rotation<br>• Security Audit Log Auditing<br>• Tamper Simulation & Testing | All Views | All APIs + `POST /api/security/keys/rotate`<br>`GET /api/security/audit-logs`<br>`POST /api/certificates/:id/tamper-test`<br>`POST /api/certificates/:id/restore-test` |

---

## 7. Certificate Creation Workflow

The certificate creation lifecycle guarantees deterministic immutability before formal issuance:

```
[ University Official Logs In ]
             │
             ▼
[ Enters Student & Course Details ]
             │
             ▼
[ POST /api/certificates ] ──> Authorized by requireRoles('Admin', 'University Official')
             │
             ▼
[ 1. Validate All Mandatory Fields ]
             │
             ▼
[ 2. Generate Unique Sequential ID ] ──> Formats 'CERT-YYYY-XXXX' (e.g. CERT-2026-0001)
             │
             ▼
[ 3. Query Hash of Last Block in DB ] ──> previousHash = lastCert ? lastCert.certificateHash : 'GENESIS'
             │
             ▼
[ 4. Construct Canonical JSON String ] ──> Normalized alphanumeric key order & ISO 8601 date
             │
             ▼
[ 5. Compute SHA-256 Block Digest ] ──> certificateHash = SHA-256( previousHash + canonicalData )
             │
             ▼
[ 6. Generate Verification QR Code ] ──> Encodes URL `/verify/CERT-2026-0001` as Base64 PNG data URL
             │
             ▼
[ 7. Store in MongoDB with Status ] ──> status: 'PENDING_APPROVAL', approvals: [], thresholdSignatures: []
             │
             ▼
[ 8. Log Audit Event ] ──> action: 'CERTIFICATE_CREATE'
```

---

## 8. Certificate Data Model

The core `Certificate` schema (`backend/models/Certificate.js`) contains all identity attributes and cryptographic proofs:

```javascript
const certificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true, index: true },
  studentName:   { type: String, required: true, trim: true },
  usn:           { type: String, required: true, trim: true, index: true },
  course:        { type: String, required: true, trim: true },
  institution:   { type: String, required: true, trim: true },
  cgpa:          { type: String, required: true, trim: true },
  issueDate:     { type: Date,   required: true },
  certificateType:{ type: String, required: true, trim: true },

  // Deterministic canonical serialization
  canonicalData: { type: String, required: true },

  // SHA-256 Hash Chain attributes
  previousHash:    { type: String, required: true },
  certificateHash: { type: String, required: true, index: true },

  // Multi-Official Approvals & Real Ed25519 Signatures (2-of-3 Quorum)
  approvals: [{
    officialId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    officialName: { type: String, required: true },
    role:         { type: String, required: true },
    approvedAt:   { type: Date, default: Date.now }
  }],
  thresholdSignatures: [{
    officialId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    officialName: { type: String, required: true },
    keyId:        { type: String, required: true },
    signature:    { type: String, required: true },
    algorithm:    { type: String, default: 'Ed25519' },
    signedAt:     { type: Date, default: Date.now }
  }],
  keyVersion: { type: Number, default: 1 },

  // Merkle Tree Integration
  merkleLeafHash: { type: String, index: true },
  merkleRoot:     { type: String, index: true },
  merkleProof: [{
    position: { type: String, enum: ['left', 'right'] },
    hash: String
  }],
  batchId: { type: String, index: true },

  // Cryptographic Timestamp Token (Internal TSA)
  timestampProof: {
    timestamp: Date,
    timestampAuthority: String,
    signature: String
  },

  // QR Code Verification
  qrCodeDataUrl: { type: String },

  // Lifecycle Status
  status: {
    type: String,
    enum: ['PENDING_APPROVAL', 'ISSUED', 'REJECTED'],
    default: 'PENDING_APPROVAL',
    index: true
  }
}, { timestamps: true });
```

---

## 9. SHA-256 Implementation

### Conceptual Overview
SHA-256 (Secure Hash Algorithm 256-bit, FIPS 180-4) is a cryptographic hash function that transforms arbitrary-length input into an irreversible, fixed-size 256-bit (64 hexadecimal characters) digest. It guarantees:
- **Preimage Resistance**: Computationally infeasible to derive original certificate data from the hash.
- **Collision Resistance**: Infeasible to find two distinct certificates producing the identical hash.
- **Avalanche Effect**: Changing even 1 character in student data completely randomizes the resulting digest.

### Actual Code Implementation
From `backend/utils/hash.js`:

```javascript
const crypto = require('crypto');

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

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
```

### Real Example:
**Input Canonical JSON**:
```json
{"certificateId":"CERT-2026-0001","studentName":"Rahul S Verma","usn":"1RV23CS042","course":"B.E. Computer Science & Engineering","institution":"RV College of Engineering","cgpa":"9.45","issueDate":"2026-06-20","certificateType":"Degree Certificate"}
```
**Chained with Previous Hash `GENESIS`**:
```
GENESIS{"certificateId":"CERT-2026-0001","studentName":"Rahul S Verma", ...}
```
**Resulting SHA-256 Hash**:
```
a832254008863afe9b333c7b23f9dc9c62e4b44cef768f0a4ff9f8943917ac38
```

---

## 10. Hash Chain Implementation

### Conceptual Overview
A hash chain links sequential blocks together by embedding the hash of Block $N-1$ into the digest calculation of Block $N$:

$$\text{Hash}_N = \text{SHA-256}(\text{Hash}_{N-1} \parallel \text{CanonicalData}_N)$$

```
[ GENESIS ]
     │
     ▼
[ Block 1 (CERT-2026-0001) ] ──> Hash 1 = SHA-256('GENESIS' + Canonical 1)
     │
     ▼
[ Block 2 (CERT-2026-0002) ] ──> Hash 2 = SHA-256(Hash 1 + Canonical 2)
     │
     ▼
[ Block 3 (CERT-2026-0003) ] ──> Hash 3 = SHA-256(Hash 2 + Canonical 3)
```

### Actual Code Implementation
From `backend/utils/hash.js`:

```javascript
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

function verifyEntireChain(certificates) {
  if (!certificates || certificates.length === 0) {
    return { isChainValid: true, brokenAtIndex: null, reason: 'Empty chain' };
  }

  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];

    if (i === 0) {
      if (cert.previousHash !== 'GENESIS') {
        return { isChainValid: false, brokenAtIndex: 0, reason: "Genesis must be 'GENESIS'" };
      }
    } else {
      const prevCert = certificates[i - 1];
      if (cert.previousHash !== prevCert.certificateHash) {
        return {
          isChainValid: false,
          brokenAtIndex: i,
          reason: `Chain broken: previousHash does not match prior certificateHash`
        };
      }
    }

    const integrity = verifyCertificateIntegrity(cert);
    if (!integrity.isValid) {
      return { isChainValid: false, brokenAtIndex: i, reason: 'Integrity check failed' };
    }
  }

  return { isChainValid: true, brokenAtIndex: null, reason: null };
}
```

---

## 11. Multi-Official Approval Workflow

### Quorum & Threshold Cryptography
CertChain implements **2-of-3 ($t=2, n=3$) cryptographic threshold signing**:
1. When created, status is `PENDING_APPROVAL`.
2. First official reviews and signs:
   - Evaluates `signCertificateHash(officialUser.email, cert.certificateHash, cert.keyVersion)`.
   - Records Ed25519 digital signature and official identifier.
   - Status **remains** `PENDING_APPROVAL` (1/2 signatures).
3. Duplicate signature prevention:
   - If the same official attempts to approve a second time, the API rejects with `HTTP 409 Conflict`.
4. Second distinct official signs:
   - Produces second distinct Ed25519 signature.
   - Satisfies 2-of-3 quorum ($2 \ge 2$).
   - Automatically issues TSA timestamp token.
   - Adds leaf to active Merkle batch.
   - Updates status atomically to `ISSUED`.

### Actual Code Implementation
From `backend/controllers/certificateController.js`:

```javascript
exports.approveCertificate = async (req, res) => {
  const { id } = req.params;
  const officialUser = req.user;

  let certificate = await Certificate.findOne({ certificateId: id });
  if (certificate.status === 'ISSUED') {
    return res.status(400).json({ success: false, message: 'Certificate is already issued.' });
  }

  // Duplicate approval prevention
  const alreadyApproved = certificate.approvals.some(
    (app) => app.officialId.toString() === officialUser._id.toString()
  );
  if (alreadyApproved) {
    return res.status(409).json({ success: false, message: 'Duplicate approval rejected.' });
  }

  // Generate Ed25519 digital signature
  const signatureResult = thresholdSignService.signCertificateHash(
    officialUser.email,
    certificate.certificateHash,
    certificate.keyVersion || 1
  );

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

  const keyVersionDoc = await keyEvolutionService.getKeyVersion(certificate.keyVersion || 1);
  const quorum = thresholdSignService.validateThresholdQuorum(
    certificate,
    keyVersionDoc ? keyVersionDoc.committee : [],
    2 // 2-of-3 threshold
  );

  if (quorum.isValid && certificate.status !== 'ISSUED') {
    certificate.status = 'ISSUED';
    // Issue TSA timestamp token and commit to Merkle batch...
  }

  await certificate.save();
  return res.status(200).json({ success: true, certificate });
};
```

---

## 12. Merkle Tree Implementation

### Binary Leaf Derivation & Odd Node Rule
CertChain implements binary Merkle trees adhering to Bitcoin's trailing node duplication rule:
1. Binary leaf hash derivation: $\text{Leaf} = \text{SHA-256}(\text{'LEAF:'} \parallel \text{certificateHash})$.
2. If a level has an odd count of nodes, the last node is duplicated to form a full pair.
3. Compact sibling inclusion proofs provide $O(\log N)$ verification paths.

### Actual Code Implementation
From `backend/services/merkleService.js`:

```javascript
function deriveLeafHash(certificateHash) {
  return sha256(`LEAF:${certificateHash}`);
}

function buildMerkleTree(leafHashes) {
  if (!leafHashes || leafHashes.length === 0) {
    return [[sha256('EMPTY_TREE')]];
  }

  const levels = [[...leafHashes]];
  let currentLevel = leafHashes;

  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      // If odd number of nodes, duplicate the trailing node
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const parentHash = sha256(left + right);
      nextLevel.push(parentHash);
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }
  return levels;
}
```

---

## 13. Merkle Root & Zero-PII Registry

### Public Zero-PII Guarantee
The Merkle root is registered in a public tamper-evident MongoDB collection (`MerkleRoot`). When verifiers query `GET /api/public/merkle-root`, the payload contains:
- `rootHash`: 64-character hex string
- `batchId`: e.g. `BATCH-2026-0001`
- `certificateCount`: integer count
- `treeVersion`: integer epoch

**Zero PII Guarantee**: Student names, USNs, and CGPAs are completely excluded from the public Merkle root registry response.

### Verification Code:
From `backend/services/merkleService.js`:

```javascript
function verifyMerkleProof(targetLeafHash, proof, expectedRoot) {
  if (!targetLeafHash || !expectedRoot) return false;
  if (!proof || proof.length === 0) {
    return targetLeafHash === expectedRoot;
  }

  let currentHash = targetLeafHash;
  for (const step of proof) {
    if (!step.hash) return false;
    if (step.position === 'left') {
      currentHash = sha256(step.hash + currentHash);
    } else if (step.position === 'right') {
      currentHash = sha256(currentHash + step.hash);
    } else {
      return false;
    }
  }
  return currentHash === expectedRoot;
}
```

---

## 14. QR Code Verification

### QR Payload & Flow
1. Upon certificate creation, the backend generates a verification URL:
   `http://localhost:3000/verify/CERT-2026-0001`
2. Generates Base64 PNG using the `qrcode` library:
   ```javascript
   const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificateId}`;
   const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
     margin: 1,
     width: 250,
     color: { dark: '#0f172a', light: '#ffffff' }
   });
   ```
3. When scanned with any smartphone camera:
   - Directs user to `/verify/:certificateId`
   - Frontend auto-loads the certificate ID
   - Automatically triggers the public verification endpoint `GET /api/verify/:certificateId`
   - Displays authentic results without manual typing.

---

## 15. Certificate Verification Pipeline

Every certificate undergoes an **8-Point Cryptographic Pipeline** on the backend:

```
                  User Requests Verification (ID or QR)
                                   │
                                   ▼
                   GET /api/verify/:certificateId
                                   │
                                   ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │ 1. Certificate Record Exists?                                    │
 ├──────────────────────────────────────────────────────────────────┤
 │ 2. Certificate Status is ISSUED?                                 │
 ├──────────────────────────────────────────────────────────────────┤
 │ 3. Canonical SHA-256 Digest Matches Stored Hash?                 │
 ├──────────────────────────────────────────────────────────────────┤
 │ 4. Hash Chain Link to Predecessor or GENESIS is Valid?          │
 ├──────────────────────────────────────────────────────────────────┤
 │ 5. 2-of-3 Ed25519 Cryptographic Threshold Signatures Valid?      │
 ├──────────────────────────────────────────────────────────────────┤
 │ 6. Merkle Inclusion Proof Derives Trusted Batch Root?            │
 ├──────────────────────────────────────────────────────────────────┤
 │ 7. Merkle Root Officially Registered in Public Registry?        │
 ├──────────────────────────────────────────────────────────────────┤
 │ 8. Cryptographic TSA Timestamp Authority Signature Valid?       │
 └──────────────────────────────────────────────────────────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    [ ALL 8 CHECKS PASS ]                     [ ANY CHECK FAILS ]
               │                                       │
               ▼                                       ▼
     ✓ AUTHENTIC CERTIFICATE                  ✗ VERIFICATION FAILED
```

---

## 16. Tamper Detection Mechanism

CertChain provides deterministic tamper detection across all fields.

### Concrete Attack Simulation:
1. **Original Credential**:
   - CGPA: `9.45`
   - Stored Hash: `a832254008863afe9b333c7b23f9dc9c62e4b44cef768f0a4ff9f8943917ac38`
2. **Database Attack (Attacker alters CGPA in MongoDB)**:
   - Malicious update: `cgpa = '9.99'`
   - Stored Hash remains unchanged (`a832...`) because attacker lacks committee private keys.
3. **Verification Execution**:
   - Reconstructed Canonical Data: `{"certificateId":"CERT-2026-0001", ..., "cgpa":"9.99"}`
   - Recomputed Hash: `b572e90f117c3e174a7a8d8b9487c9f5642a8b9e...`
   - Comparison: `Recomputed Hash ≠ Stored Hash`
4. **Result**:
   - Check 3 (`SHA-256 Canonical Integrity`) fails immediately.
   - Status: `✗ Certificate Verification Failed`.
   - Explanation: `"Certificate integrity verification failed. Possible tampering detected."`

---

## 17. Database Architecture & Collections

| Collection | Model File | Purpose | Key Indexes |
| :--- | :--- | :--- | :--- |
| `users` | `User.js` | Institutional accounts, roles, bcrypt password hashes, and student USNs. | `email` (unique) |
| `certificates` | `Certificate.js` | Canonical certificate data, hashes, previousHash, Merkle proof, and Ed25519 signatures. | `certificateId` (unique), `certificateHash`, `usn`, `merkleRoot` |
| `certificaterequests` | `CertificateRequest.js` | Student/verifier requests for degree certificates and transcripts. | `requestId` (unique), `userId`, `userEmail`, `status` |
| `merklebatches` | `MerkleBatch.js` | Accumulator for leaf hashes forming batch Merkle trees. | `batchId` (unique), `status` |
| `merkleroots` | `MerkleRoot.js` | Public zero-PII registry mapping batches to Merkle root hashes. | `batchId` (unique), `rootHash` |
| `keyversions` | `KeyVersion.js` | Key version epochs tracking active and rotated Ed25519 committee keys. | `version` (unique), `status` |
| `timestamprecords` | `TimestampRecord.js` | Internal TSA timestamp tokens with authority digital signatures. | `targetHash`, `timestamp` |
| `securedeliveries` | `SecureDelivery.js` | Encrypted envelopes (X25519 public key, IV nonce, auth tag, ciphertext). | `deliveryId` (unique), `certificateId`, `recipientEmail` |
| `auditlogs` | `AuditLog.js` | Tamper-evident security event logs (creation, signing, verification, tampering). | `createdAt` (descending), `action`, `certificateId` |

---

## 18. API Documentation

| Method | Endpoint | Description | Authentication & Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | Public (Rate Limited: 30/15m) |
| `GET` | `/api/auth/me` | Retrieve authenticated user session | JWT Bearer Token |
| `GET` | `/api/verify/:certificateId` | Comprehensive 8-point certificate verification | Public (Rate Limited: 120/10m) |
| `GET` | `/api/certificates` | Query certificates with filtering and search | JWT Bearer Token |
| `GET` | `/api/certificates/stats` | Retrieve institutional registry metrics | JWT Bearer Token |
| `GET` | `/api/certificates/verifier-stats`| Verifier metrics (total, success, failed, pending) | JWT Bearer Token |
| `GET` | `/api/certificates/my-requests` | Retrieve certificate requests for logged-in user | JWT Bearer Token |
| `POST` | `/api/certificates/request` | Submit new certificate or transcript request | JWT Bearer Token |
| `GET` | `/api/certificates/chain-status` | Verify continuous chronological hash chain | JWT Bearer Token |
| `GET` | `/api/certificates/pending` | Query pending 2-of-3 approval queue | `Admin`, `University Official` |
| `POST` | `/api/certificates` | Create new certificate in PENDING_APPROVAL state | `Admin`, `University Official` |
| `GET` | `/api/certificates/:id` | Retrieve single certificate with integrity status | JWT Bearer Token |
| `POST` | `/api/certificates/:id/approve` | Apply Ed25519 threshold signature | `Admin`, `University Official` |
| `POST` | `/api/certificates/:id/reject` | Formally reject certificate request | `Admin`, `University Official` |
| `POST` | `/api/certificates/:id/tamper-test`| Simulate CGPA database tampering for demo | JWT Bearer Token |
| `POST` | `/api/certificates/:id/restore-test`| Restore valid canonical state | JWT Bearer Token |
| `GET` | `/api/public/merkle-root` | Retrieve latest public zero-PII Merkle root | Public |
| `GET` | `/api/public/merkle-roots` | Retrieve all historical Merkle roots | Public |
| `POST` | `/api/public/verify-proof` | Verify standalone Merkle inclusion proof | Public |
| `POST` | `/api/secure-delivery/generate-keypair`| Generate recipient X25519 keypair | Public |
| `POST` | `/api/secure-delivery/encrypt` | Encrypt credential using X25519 + AES-256-GCM | `Admin`, `University Official`, `Student` |
| `POST` | `/api/secure-delivery/decrypt` | Decrypt and validate AES-GCM authentication tag | Public |
| `GET` | `/api/security/verify-chain` | Complete chronological hash chain audit | JWT Bearer Token |
| `GET` | `/api/security/keys` | Retrieve key version epochs | JWT Bearer Token |
| `POST` | `/api/security/keys/rotate` | Rotate active key version to Version $N+1$ | `Admin` |
| `GET` | `/api/security/audit-logs` | Retrieve security audit events | `Admin` |

---

## 19. Authentication Mechanism

Authentication employs stateless JSON Web Tokens (JWT) signed using HMAC-SHA256:

1. **Sign-In Flow**:
   - User posts `email` and `password` to `/api/auth/login`.
   - Backend queries `User` model by lowercase email.
   - Compares candidate password using `bcrypt.compare(candidatePassword, user.passwordHash)`.
   - Generates JWT containing `{ id, email, role, name }` with a 24-hour expiration.
2. **Token Transmission**:
   - Frontend stores token in `localStorage` (`pbl_cert_token`).
   - Every subsequent request attaches header:
     `Authorization: Bearer <jwt_token>`
3. **Verification**:
   - `verifyToken` middleware decodes token and queries user record, attaching `req.user`.

---

## 20. Role-Based Access Control (RBAC)

### Backend Authorization Middleware
From `backend/middleware/auth.js`:

```javascript
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of the following roles: [${roles.join(', ')}]`
      });
    }
    next();
  };
};
```

### Frontend Route Protection
In `frontend/src/App.jsx`, attempts by a Normal User / Verifier to access administrative views (`/merkle`, `/security`, `/issue`, `/approvals`, `/hash-chain`, `/secure-delivery`) trigger immediate redirection to `/dashboard` with an explicit alert banner:
> *"Access restricted to authorized university officials."*

---

## 21. Security Features Matrix

| Security Feature | Cryptographic Primitive | Implementation Details |
| :--- | :--- | :--- |
| **Deterministic Canonicalization** | Alphanumeric Key Sorting + ISO Dates | Normalized string format prevents hashing differences across runtimes. |
| **SHA-256 Hashing** | FIPS 180-4 SHA-256 | Irreversible, collision-resistant 64-character hexadecimal digest. |
| **Immutable Hash Chaining** | Sequential Predecessor Linking | Block $N$ links to Block $N-1$; Genesis links to `GENESIS`. |
| **Threshold Multi-Signatures** | RFC 8032 Ed25519 (2-of-3 Quorum) | Requires two distinct officials' digital signatures before issuance. |
| **Binary Merkle Trees** | SHA-256 + Bitcoin Duplicate Rule | Compact inclusion proof generation; zero student PII in public roots. |
| **Confidential Delivery** | Curve25519 (X25519) + AES-256-GCM | Authenticated encryption with 96-bit IV and 128-bit authentication tag. |
| **Cryptographic Timestamping** | Internal TSA Authority Signatures | Independent proof of existence certifying certificate creation timestamp. |
| **Key Evolution & Epochs** | Active, Rotated, Revoked Lifecycle | Historical certificates remain valid against prior key version epochs. |
| **Input Sanitization** | Recursive NoSQL Query Stripping | Deletes keys starting with `$` or containing `.` to prevent injection. |
| **Security Audit Logging** | Immutable Event Trail | Sanitized logging of authentication, signing, and tamper defense events. |

---

## 22. Most Important Source Files

1. **`backend/utils/hash.js`**: Core canonicalization, SHA-256 block hashing, and hash chain verification.
2. **`backend/services/thresholdSignService.js`**: Ed25519 key generation, digital signing, and 2-of-3 threshold quorum verification.
3. **`backend/services/merkleService.js`**: Binary tree construction, root derivation, and $O(\log N)$ inclusion proof verification.
4. **`backend/controllers/verifyController.js`**: Public 8-point verification pipeline and tamper detection.
5. **`backend/controllers/certificateController.js`**: Certificate creation, 2-of-3 approval flow, and tamper testing hooks.
6. **`backend/models/Certificate.js`**: Complete certificate data model with embedded cryptographic proofs.
7. **`frontend/src/pages/VerifyCertPage.jsx`**: Primary verifier UI and certificate authenticity presenter.
8. **`frontend/src/components/Navbar.jsx`**: Role-based navigation with verifier vs official separation.
9. **`frontend/src/App.jsx`**: Client-side routing, URL synchronization, and route protection.

---

## 23. Core Code Snippets

### 1. Deterministic Canonicalization (`backend/utils/hash.js`)
```javascript
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
```

### 2. SHA-256 Block Hashing (`backend/utils/hash.js`)
```javascript
const payloadToHash = previousHash + canonicalData;
return crypto.createHash('sha256').update(payloadToHash).digest('hex');
```

### 3. Threshold Quorum Validation (`backend/services/thresholdSignService.js`)
```javascript
const quorumSatisfied = validCount >= threshold;
return {
  isValid: quorumSatisfied,
  validSignaturesCount: validCount,
  requiredThreshold: threshold,
  details: verificationDetails
};
```

### 4. Merkle Proof Verification (`backend/services/merkleService.js`)
```javascript
for (const step of proof) {
  if (step.position === 'left') {
    currentHash = sha256(step.hash + currentHash);
  } else if (step.position === 'right') {
    currentHash = sha256(currentHash + step.hash);
  }
}
return currentHash === expectedRoot;
```

### 5. AES-256-GCM Decryption & Tag Verification (`backend/services/secureDeliveryService.js`)
```javascript
const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, ivBuffer);
decipher.setAuthTag(authTagBuffer);
let decrypted = decipher.update(ciphertextBuffer, null, 'utf8');
decrypted += decipher.final('utf8');
return JSON.parse(decrypted);
```

---

## 24. Frontend Architecture & Working

The frontend is designed with a modern dark navy aesthetic (`#0a0d14`), cyan accents (`#06b6d4`), and glassmorphism cards.

### Navigation Separation
- **Verifier / Normal User Navigation**:
  - `Verify`: Primary verification interface.
  - `Dashboard`: Clean verification metrics and recent activity.
  - `Pending Requests`: Student request tracking and submission.
  - `User Profile`: Account information modal.
  - `Logout` / `Sign In`
- **University Official Navigation**:
  - Full operational access: `Dashboard`, `Issue Certificate`, `Pending Approvals`, `Hash Chain`, `Merkle Registry`, `Secure Delivery`, `Security Center`.

---

## 25. Backend Architecture & Request Lifecycle

```
HTTP Request (Client)
         │
         ▼
[ Helmet Security Headers & CORS ]
         │
         ▼
[ NoSQL Injection Sanitizer ]
         │
         ▼
[ Express Router ]
         │
         ▼
[ verifyToken (JWT Verification) ]
         │
         ▼
[ requireRoles (RBAC Authorization) ]
         │
         ▼
[ Controller Logic ]
         │
         ▼
[ Cryptographic Services (crypto) ]
         │
         ▼
[ MongoDB Database (Mongoose) ]
         │
         ▼
[ Security Audit Logger ]
         │
         ▼
JSON Response (HTTP 200/201/400/403/404/409)
```

---

## 26. End-to-End System Workflow

```
UNIVERSITY OFFICIAL                        CERTCHAIN BACKEND                          PUBLIC VERIFIER
        │                                         │                                          │
        ├──────── POST /api/certificates ─────────>                                          │
        │         (Draft Certificate)             │                                          │
        │                                 Canonicalize & Hash                                │
        │                                 Chained to Predecessor                             │
        │                                         │                                          │
        ├────── POST /api/.../approve (1/2) ──────>                                          │
        │       (1st Ed25519 Signature)           │                                          │
        │                                         │                                          │
        ├────── POST /api/.../approve (2/2) ──────>                                          │
        │       (2nd Ed25519 Signature)           │                                          │
        │                                 Quorum Satisfied!                                  │
        │                                 TSA Token Issued                                   │
        │                                 Merkle Batch Committed                             │
        │                                 Status = ISSUED                                    │
        │                                         │                                          │
        │                                         │<────── GET /api/verify/:certId ──────────┤
        │                                         │        (Scan QR or Enter ID)             │
        │                                         │                                          │
        │                                 Execute 8-Point Check                              │
        │                                         │                                          │
        │                                         ├──────────── JSON Verification ───────────>
        │                                         │             ✓ AUTHENTIC CERTIFICATE      │
```

---

## 27. Automated Testing & Test Results

CertChain includes an automated 20-requirement integration test suite (`backend/tests/certchain_100.test.js`).

### Test Execution Command:
```bash
npm test
```

### Verified Test Suites:
1. **Suite 1: Multi-Role Authentication & Access Control** (`PASS`)
   - Authenticated Admin, Officials (1, 2, 3), Student, and Verifier.
   - Enforced RBAC: Student blocked from certificate creation (`HTTP 403`).
2. **Suite 2: Deterministic Canonicalization, SHA-256 & QR** (`PASS`)
   - Unique sequential ID generation (`CERT-2026-0001`).
   - Genesis link (`previousHash: 'GENESIS'`).
   - Base64 QR code PNG generation.
3. **Suite 3: 2-of-3 Cryptographic Threshold Signatures** (`PASS`)
   - 1st Ed25519 signature recorded; status remains `PENDING_APPROVAL`.
   - Duplicate signature attempt by same official rejected (`HTTP 409 Conflict`).
   - 2nd distinct official signature satisfies 2-of-3 quorum; transitions to `ISSUED`.
4. **Suite 4: Merkle Tree Generation & Public Registry** (`PASS`)
   - Derived leaf hash $\text{Leaf} = \text{SHA-256}(\text{certificateHash})$.
   - Zero student PII confirmed in public Merkle root registry response.
5. **Suite 5: Comprehensive 8-Point Public Verification** (`PASS`)
   - Valid certificate passes all 8 security checks.
   - Attack Vector 1 (CGPA alteration) caught by canonical SHA-256 check.
6. **Suite 6: Secure Delivery (X25519 + AES-256-GCM)** (`PASS`)
   - Recipient keypair generation and AES-256-GCM encryption.
   - Attack Vector 2 (tampered ciphertext) caught by authentication tag check.
7. **Suite 7: Key Evolution & Historical Verification** (`PASS`)
   - Key rotated to Version 2.
   - Historical certificate issued under Version 1 remains 100% verified under Version 2 epoch.
8. **Suite 8: Complete Hash Chain Audit & Audit Logs** (`PASS`)
   - Sequential chain verification confirms continuous linkage across all blocks.
   - Audit trail records tamper-evident logs.

---

## 28. PBL Security Demonstration Procedure

Follow this 7-step procedure during viva or evaluation:

1. **Step 1 (Creation)**: Log in as University Official and navigate to `/issue`. Autofill sample student data and submit. Observe status is `PENDING_APPROVAL` with `0/2` approvals.
2. **Step 2 (Single Approval)**: Log in as Official 1 (`official1@univ.edu`), navigate to `/approvals`, and click `Approve`. Observe approval count is `1/2` and status remains `PENDING_APPROVAL`.
3. **Step 3 (Duplicate Prevention)**: Attempt to click `Approve` again with the same official. Observe rejection notice: *"Duplicate approval rejected. You have already approved this certificate."*
4. **Step 4 (Threshold Issuance)**: Log in as Official 2 (`official2@univ.edu`), navigate to `/approvals`, and click `Approve`. Observe status transitions to `ISSUED`, Merkle root is committed, and TSA token is issued.
5. **Step 5 (Public Verification)**: Navigate to `/verify` as a public verifier. Enter `CERT-2026-0001` and verify. Confirm all 7 security checklist items pass with status `✓ AUTHENTIC CERTIFICATE`.
6. **Step 6 (Live Attack Simulation)**: In the details page sandbox, click `Simulate CGPA Tamper` (modifies CGPA from 8.80 to 9.99 directly in MongoDB).
7. **Step 7 (Instant Tamper Detection)**: Re-verify `CERT-2026-0001`. Observe immediate failure: `✗ Certificate Verification Failed`, highlighting `SHA-256 Canonical Integrity` mismatch. Click `Restore Canonical Integrity` to restore.

---

## 29. Current Implementation vs Future Roadmap

### Currently Implemented in Codebase (100% Verified):
- Deterministic canonical JSON serialization.
- Continuous SHA-256 hash chaining from `GENESIS`.
- 2-of-3 Ed25519 cryptographic threshold signature quorum.
- Duplicate approval prevention.
- Binary Merkle trees with Bitcoin odd-node duplication rule.
- Zero-PII public Merkle root registry.
- Curve25519 (X25519) Diffie-Hellman + HKDF-SHA256 + AES-256-GCM confidential delivery.
- Authenticated ciphertext tamper rejection via 128-bit tag.
- Internal Cryptographic Timestamp Authority (TSA).
- Cryptographic key evolution epochs (`ACTIVE`, `ROTATED`).
- Backward-compatible historical certificate verification.
- Role-based UI separating normal verifiers from university officials.
- QR code generation and instant verification routing (`/verify/:certificateId`).
- User certificate request management (`/pending-requests`).
- Security audit event logging.
- 20-suite automated integration test runner.

### Future / Planned Capabilities:
- Hardware Security Module (HSM) PKCS#11 integration.
- Decentralized Layer-1 Ethereum/Polygon root anchoring.
- RFC 3161 external trusted commercial TSA integration.
- Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs) for anonymous credential verification.

---

## 30. System Limitations

1. **Local Keystore**: Committee Ed25519 private keys are persisted in `official_keystore.json` for demonstration purposes rather than a physical FIPS 140-2 Level 3 HSM.
2. **Single Database Instance**: MongoDB is configured as a standalone replica set; production deployment requires geo-distributed sharding.
3. **Internal TSA**: The timestamp authority is operated as an internal cryptographic service rather than a globally recognized external RFC 3161 public TSA.

---

## 31. Future Enhancements

1. **Decentralized Anchoring**: Periodically write the active batch Merkle root to a smart contract on Ethereum Sepolia or Polygon to achieve trustless public consensus.
2. **Selective Disclosure via zk-SNARKs**: Allow students to prove they graduated with CGPA $> 8.0$ without disclosing their exact CGPA or student name to employers.
3. **Biometric Official Signatures**: Integrate WebAuthn (FIDO2) hardware security keys (e.g. YubiKey) for official multi-signature threshold signing.

---

## 32. Conclusion & Implementation Status

CertChain successfully implements a comprehensive, verifiable digital credential system that solves the vulnerabilities of centralized academic databases. By combining deterministic serialization, SHA-256 hash chaining, 2-of-3 Ed25519 threshold signatures, binary Merkle tree proofs, and authenticated AES-GCM encryption, the system guarantees that certificate modification is mathematically impossible without immediate detection.

### Final Implementation Status Checklist:
- [x] **SHA-256 Deterministic Hashing**: ✓ Implemented
- [x] **Continuous Hash Chaining**: ✓ Implemented
- [x] **2-of-3 Threshold Signatures**: ✓ Implemented
- [x] **Binary Merkle Trees & Proofs**: ✓ Implemented
- [x] **Zero-PII Merkle Root Registry**: ✓ Implemented
- [x] **X25519 + AES-256-GCM Delivery**: ✓ Implemented
- [x] **Cryptographic TSA Timestamping**: ✓ Implemented
- [x] **Key Evolution & Epoch Rotation**: ✓ Implemented
- [x] **Role-Based UI / UX Refactor**: ✓ Implemented
- [x] **QR Code Public Verification**: ✓ Implemented
- [x] **Pending Requests Module**: ✓ Implemented
- [x] **20-Suite Automated Test Runner**: ✓ Implemented
