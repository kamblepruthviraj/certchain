# CertChain: Secure Digital Certificate Management System

> **Cryptography and Network Security PBL Project — 100% Complete Implementation**  
> An enterprise-grade, cryptographically verifiable academic credential management platform guaranteeing integrity, multi-official non-repudiation, zero-PII public auditing, and confidential end-to-end delivery.

---

## 1. Executive Summary

Traditional digital certificate systems store credentials in relational or document databases that are susceptible to insider tampering, rogue database administrators (DBAs), and credential forgery. 

**CertChain** addresses these vulnerabilities by establishing a zero-trust, multi-layered cryptographic defense-in-depth architecture:
1. **Deterministic Canonicalization**: Guarantees identical canonical serialization and SHA-256 digest generation across heterogeneous computing runtimes.
2. **Continuous SHA-256 Hash Chaining**: Formally links certificate blocks from a genesis block (`GENESIS`), making intermediate block deletion, insertion, or manipulation mathematically detectable.
3. **2-of-3 Ed25519 Threshold Multi-Signature Quorum**: Eliminates single points of failure and prevents unilateral credential issuance. Two distinct university officials must apply digital signatures using Ed25519 asymmetric keypairs before any certificate is issued.
4. **Zero-PII Binary Merkle Trees**: Aggregates certificate batches into binary Merkle trees using the Bitcoin-style trailing node duplication rule. Publishes compact 32-byte roots enabling $O(\log N)$ inclusion proofs without revealing student Personally Identifiable Information (PII).
5. **Confidential Delivery (X25519 + HKDF + AES-256-GCM)**: Employs Curve25519 Diffie-Hellman Key Agreement, HKDF-SHA256 key derivation, and AES-256-GCM authenticated encryption. Detects and rejects any tampered ciphertext via 128-bit authentication tag validation.
6. **Cryptographic Key Evolution & Versioning**: Tracks key epochs (`ACTIVE`, `ROTATED`, `REVOKED`), ensuring historical certificates issued under prior key versions remain 100% verifiable.
7. **Cryptographic Timestamp Authority (TSA)**: Issues verifiable cryptographic timestamp tokens certifying proof of existence prior to a specific point in time.

---

## 2. Complete 100% Implementation Matrix

| Capability / Module | Status | Cryptographic Primitive | Implementation Details |
| :--- | :---: | :--- | :--- |
| **RBAC & Multi-Role Authentication** | **100%** | JWT + bcrypt ($10$ rounds) | Role enforcement for `Admin`, `University Official`, `Student`, `Verifier`. Students restricted from certificate creation (`HTTP 403`). |
| **Deterministic Canonicalization** | **100%** | Strict Key Ordering + ISO Date Normalization | Strict alphanumeric key ordering and ISO 8601 calendar format (`YYYY-MM-DD`). |
| **SHA-256 Hash Chaining** | **100%** | FIPS 180-4 SHA-256 | Chronological block linkage: $\text{Hash} = \text{SHA-256}(\text{prevHash} \parallel \text{canonicalData})$. Genesis block links to `GENESIS`. |
| **2-of-3 Threshold Signatures** | **100%** | RFC 8032 Ed25519 | Quorum threshold ($t=2, n=3$). Mathematical digital signature over certificate digest. Prevents duplicate self-approvals. |
| **Binary Merkle Trees** | **100%** | SHA-256 + Bitcoin Duplicate Rule | Binary leaf derivation $\text{Leaf} = \text{SHA-256}(\text{certHash})$. Duplicates odd nodes. Computes compact $O(\log N)$ sibling proofs. |
| **Zero-PII Public Root Registry** | **100%** | Tamper-Evident MongoDB Registry | Public endpoint `/api/public/merkle-root` exposes strictly zero student PII (names, USNs, and CGPAs remain confidential). |
| **Confidential Credential Delivery** | **100%** | Curve25519 (X25519) + HKDF + AES-256-GCM | Ephemeral DH key agreement, 256-bit derived key, 96-bit random IV nonce, and 128-bit authentication tag. Rejects tampered ciphertext. |
| **Key Evolution & Rotation** | **100%** | Version Epoch Manager | Supports key rotation to Version $N+1$. Prior certificates maintain backward-compatible verification against archived public keys. |
| **Cryptographic TSA Tokens** | **100%** | Ed25519 Authority Signatures | Issues timestamp tokens over certificate digests with authority signature. |
| **8-Point Public Verification** | **100%** | Full Multi-Stage Pipeline | Zero-auth public portal executing the 8-point cryptographic integrity checklist in real time. |
| **Full Hash Chain Audit** | **100%** | Sequential Chain Validator | Audits every consecutive block link from `GENESIS` to head block via `/api/security/verify-chain`. |
| **Security Audit Logging** | **100%** | Tamper-Evident Audit Model | Immutable logging of authentication, threshold signing, key rotation, and tamper simulation events. |

---

## 3. Cryptographic Architecture Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                    CERTCHAIN SYSTEM ARCHITECTURE                                   |
+----------------------------------------------------------------------------------------------------+

  [ DRAFT CERTIFICATE ]
           │
           ▼
  [ 1. CANONICALIZER ] ──> Normalized JSON String (Strict Key Ordering & ISO Date)
           │
           ▼
  [ 2. SHA-256 ENGINE ] ──> certificateHash = SHA-256( previousHash || canonicalData )
           │
           ▼
  [ 3. THRESHOLD COMMITTEE ] ──> 2-of-3 Ed25519 Asymmetric Signatures (Official 1, Official 2)
           │                   (Enforces distinct officials; rejects duplicate approvals)
           ▼
  [ 4. CRYPTOGRAPHIC TSA ] ──> Issue Internal Timestamp Token over certificateHash
           │
           ▼
  [ 5. BINARY MERKLE TREE ] ──> Leaf = SHA-256(certificateHash)
           │                    Duplicate odd nodes (Bitcoin rule)
           │                    Derive 32-byte Merkle Root & Inclusion Proof Path
           ▼
  [ 6. PUBLIC REGISTRY ] ──> Register Root in Public Zero-PII Registry (/api/public/merkle-root)
           │
           ▼
  [ 7. SECURE DELIVERY ] ──> Student X25519 Public Key + Server Delivery Key
                               │
                               ▼ X25519 DH Key Agreement
                               ▼ HKDF-SHA256 Key Derivation
                               ▼ AES-256-GCM Authenticated Encryption (96-bit IV + 128-bit Tag)
                               │
                               ▼
  [ 8. PUBLIC 8-POINT VERIFIER ] <── Employer / Public Auditor inspects credential
```

---

## 4. The 8-Point Cryptographic Security Checklist

Every credential verified through `/api/verify/:id` undergoes an 8-stage verification pipeline:

1. **Certificate Record Exists**: Confirms the credential record is registered in the institutional repository.
2. **Certificate Status (ISSUED)**: Confirms the credential completed administrative review and was not rejected or revoked.
3. **SHA-256 Canonical Integrity**: Reconstructs canonical JSON from fields and recomputes $\text{SHA-256}(\text{previousHash} \parallel \text{canonicalData})$. Mismatches immediately indicate database tampering.
4. **Hash Chain Predecessor Linkage**: Confirms continuous cryptographic linkage to the preceding certificate block or `GENESIS`.
5. **Cryptographic Threshold Signatures (2-of-3 Quorum)**: Mathematically validates that at least 2 distinct authorized officials produced valid Ed25519 digital signatures against committee public keys.
6. **Merkle Tree Inclusion Proof**: Recomputes parent hashes along the sibling proof path to derive the expected Merkle root in $O(\log N)$ steps.
7. **Merkle Root Public Registry Match**: Confirms the computed Merkle root is officially registered in the public tamper-evident registry.
8. **Cryptographic Timestamp Token**: Mathematically validates the timestamp authority signature certifying token issuance time.

---

## 5. Five-Vector Security Defense Sandbox

CertChain includes an interactive sandbox demonstrating real-time defense against 5 attack vectors:

- **Vector 1 (Direct DB Alteration)**: Modifying a student's CGPA directly in MongoDB without updating `certificateHash` immediately triggers an integrity mismatch on Check 3.
- **Vector 2 (MitM Ciphertext Manipulation)**: Flipping a single bit in an encrypted delivery envelope causes the AES-256-GCM 128-bit authentication tag check to fail, aborting decryption with `AUTHENTICATION_FAILURE`.
- **Vector 3 (Merkle Sibling Substitution)**: Providing a false sibling in the Merkle path derives an incorrect root that fails Check 6 & 7.
- **Vector 4 (Signature Forgery & Self-Approval)**: Attempting duplicate approvals by the same official or forging signatures is blocked by committee key verification (Check 5).
- **Vector 5 (Historical Chain Rewriting)**: Inserting or altering past blocks severs `previousHash` links downstream, immediately detected by `/api/security/verify-chain`.

---

## 6. Project Directory Structure

```
certchain/
├── backend/
│   ├── config/
│   │   ├── db.js                      # MongoDB connection manager
│   │   ├── seed.js                    # Auto-seeding default demo accounts & key epoch
│   │   ├── official_keystore.json     # Persistent Ed25519 signing keystore
│   │   ├── tsa_keystore.json          # Persistent TSA authority keystore
│   │   └── delivery_keystore.json     # Persistent X25519 delivery keystore
│   ├── controllers/
│   │   ├── authController.js          # Authentication & token issuance
│   │   ├── certificateController.js   # Certificate creation, approvals, tamper hooks
│   │   ├── verifyController.js        # 8-Point verification pipeline
│   │   ├── merkleController.js        # Public Merkle root registry & proof validation
│   │   ├── deliveryController.js      # X25519 key exchange & AES-GCM envelopes
│   │   └── securityController.js      # Chain audits, key rotation, audit trail
│   ├── middleware/
│   │   └── auth.js                    # JWT verification & RBAC role enforcement
│   ├── models/
│   │   ├── User.js                    # User accounts, roles, public keys
│   │   ├── Certificate.js             # Canonical certificate records & hashes
│   │   ├── MerkleBatch.js             # Batch leaves & tree states
│   │   ├── MerkleRoot.js              # Public zero-PII root registry
│   │   ├── KeyVersion.js              # Cryptographic key epochs & committees
│   │   ├── TimestampRecord.js         # Cryptographic TSA timestamp proofs
│   │   ├── SecureDelivery.js          # Encrypted AES-256-GCM envelopes
│   │   └── AuditLog.js                # Security audit event trail
│   ├── routes/
│   │   ├── authRoutes.js              # /api/auth
│   │   ├── certificateRoutes.js       # /api/certificates
│   │   ├── verifyRoutes.js            # /api/verify
│   │   ├── merkleRoutes.js            # /api/public
│   │   ├── deliveryRoutes.js          # /api/secure-delivery
│   │   └── securityRoutes.js          # /api/security
│   ├── services/
│   │   ├── merkleService.js           # Binary tree builder & proof auditor
│   │   ├── thresholdSignService.js    # Ed25519 2-of-3 quorum multi-signatures
│   │   ├── secureDeliveryService.js   # X25519 DH + HKDF + AES-256-GCM
│   │   ├── timestampService.js        # Cryptographic TSA token issuer
│   │   ├── keyEvolutionService.js     # Key epoch bootstrapping & rotation
│   │   └── auditService.js            # Tamper-evident event logger
│   ├── tests/
│   │   ├── certchain_100.test.js      # 20-Requirement complete integration suite
│   │   └── milestone30.test.js        # Legacy 30% suite (backward compatibility)
│   ├── utils/
│   │   └── hash.js                    # Canonical serializer & hash chaining engine
│   └── server.js                      # Express server with Helmet, rate limiting, sanitization
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Role-aware navigation bar
│   │   │   └── HashBadge.jsx          # Cryptographic hash visualizer with copy tool
│   │   ├── pages/
│   │   │   ├── VerifyCertPage.jsx     # 8-Point checklist, official credential card, QR preview
│   │   │   ├── MerkleRegistryPage.jsx # Zero-PII root registry & live proof auditor
│   │   │   ├── SecureDeliveryPage.jsx # X25519 key exchange & AES-GCM envelope sandbox
│   │   │   ├── SecurityCenterPage.jsx # Complete chain audit, key rotation, audit logs
│   │   │   ├── DashboardPage.jsx      # Metrics overview & quick actions
│   │   │   ├── PendingApprovalsPage.jsx # 2-of-3 threshold signature queue
│   │   │   ├── CreateCertPage.jsx     # Certificate drafting & hash preview
│   │   │   ├── CertificatesListPage.jsx # Institutional ledger explorer
│   │   │   ├── CertDetailsPage.jsx    # Merkle visualizer & 5-vector sandbox
│   │   │   └── LoginPage.jsx          # Quick-switching institutional demo sign-in
│   │   ├── services/
│   │   │   └── api.js                 # Universal API client wrapper
│   │   ├── App.jsx                    # Root view controller
│   │   └── index.css                  # Dark glassmorphic design system
│   └── vite.config.js                 # Vite configuration with /api proxy
├── docs/
│   ├── architecture.md                # System architecture & database schemas
│   ├── cryptography.md                # Mathematical algorithms & primitives
│   ├── security.md                    # STRIDE threat model & attack vector defenses
│   ├── api.md                         # OpenAPI/REST API specification
│   ├── testing.md                     # Test runner specifications & coverage
│   └── deployment.md                  # Production operations & environment guide
├── package.json                       # Root orchestration package
├── start-dev.js                       # Unified dev server launcher
└── README.md                          # Comprehensive documentation
```

---

## 7. Installation & Quick Start

### 7.1 Prerequisites
- **Node.js**: v18+ or v20+ LTS
- **MongoDB**: Local MongoDB Community Server running at `mongodb://127.0.0.1:27017`

### 7.2 Installation
From the project root:
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 7.3 Start Unified Development Environment
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend SPA**: `http://localhost:3000`

---

## 8. Running Automated Tests

To execute the complete 20-requirement automated test suite:
```bash
npm test
```
All 8 suites pass with exit code `0`:
1. Multi-Role Authentication & Access Control (Admin, Officials 1-3, Student, Verifier)
2. Deterministic Canonicalization, SHA-256 Hashing & QR Generation
3. 2-of-3 Cryptographic Threshold Multi-Signatures (Ed25519)
4. Binary Merkle Tree Construction & Public Zero-PII Root Registry
5. Comprehensive 8-Point Public Verification & Attack Vector 1 Defense
6. Secure Delivery (X25519 DH + HKDF + AES-256-GCM) & Attack Vector 2 Defense
7. Cryptographic Key Evolution & Historical Verification
8. Complete Hash Chain Audit & Security Audit Logs

---

## 9. Default Demo Seed Accounts

| Role | Name | Email | Password | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | University Registrar | `admin@univ.edu` | `AdminPassword123!` | Key rotation, system configuration, chain auditing |
| **Official 1** | Controller of Examinations | `official1@univ.edu` | `OfficialPassword123!` | Threshold Signer 1 (Committee key 1) |
| **Official 2** | Dean of Academic Affairs | `official2@univ.edu` | `OfficialPassword123!` | Threshold Signer 2 (Committee key 2) |
| **Official 3** | Member of Syndicate | `official3@univ.edu` | `OfficialPassword123!` | Threshold Signer 3 (Committee key 3) |
| **Student** | Graduating Student | `student@univ.edu` | `StudentPassword123!` | Recipient portal, X25519 keypair, decrypted view |
| **Verifier** | Global Verification Services | `verifier@company.com` | `VerifierPassword123!` | Public 8-point audit & Merkle proof inspection |

*Quick login buttons are provided on the login page for rapid role switching during academic evaluation.*

---

## 10. PBL Viva Presentation Guide

### Key Talking Points:
1. **Why not standard database storage?**  
   Standard databases lack mathematical immutability. An insider with SQL/NoSQL write permissions can alter grades without leaving an evidentiary cryptographic trail. CertChain links blocks via SHA-256 and validates against an 8-point checklist.
2. **Why 2-of-3 threshold signatures instead of a single signature?**  
   A single key creates a catastrophic single point of compromise. If one official's laptop is compromised, the attacker can forge certificates. With a 2-of-3 threshold scheme, at least two independent officials must cryptographically sign using distinct Ed25519 key shares.
3. **Why Merkle trees for public verification?**  
   Publishing an entire database to the public violates student data privacy (GDPR / FERPA). Merkle trees allow publishing a single 32-byte root hash containing zero PII while enabling any student to prove their credential is mathematically included via an $O(\log N)$ sibling proof path.
4. **How does authenticated encryption protect delivery?**  
   Standard TLS protects transport, but not the stored artifact. Using X25519 Diffie-Hellman Key Agreement and AES-256-GCM authenticated encryption, the certificate remains encrypted at rest for the recipient. If an attacker tampers with a single byte in transit, the 128-bit GCM authentication tag check fails immediately.
