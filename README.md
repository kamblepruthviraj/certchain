# Secure Digital Certificate Management System

> **Cryptography and Network Security PBL Project**  
> **Milestone: 30% Phase Complete Working Prototype**

---

## 1. Project Overview

The **Secure Digital Certificate Management System** is a cryptographically verifiable academic credential management platform designed to prevent credential fraud, tampering, and unauthorized unilateral issuance. 

In this **30% Milestone Prototype**, we implement the foundational cryptographic core:
- **Canonical Serialization & SHA-256 Hashing**: Deterministic hashing guaranteeing collision resistance and content integrity.
- **Hash-Chained Audit Ledger**: Consecutive certificates are linked cryptographically (`GENESIS` $\rightarrow$ `Cert 1` $\rightarrow$ `Cert 2`), making insertion, modification, or removal immediately detectable.
- **Multi-Official Approval Workflow ($t$-of-$n$ Prototype)**: Prototype 2-of-2 ($t=2$) multi-signature approval queue requiring two distinct authorized university officials before a certificate transitions to `ISSUED`.
- **Public Verification & Real-Time Tamper Detection**: Instant public cryptographic audit that recalculates the certificate hash from canonical data, compares it against the immutable stored hash, and exposes any tampering down to the exact mismatch.
- **Interactive Security Sandbox**: Built-in demonstration tool to simulate database-level tampering (e.g. altering CGPA directly in MongoDB) to visually demonstrate tamper detection for evaluation and viva presentations.

---

## 2. Features Implemented in 30% Phase

| Module | Feature | Implementation Status | Description |
|---|---|---|---|
| **Module 1** | Role-Based Authentication | Complete | Admin & University Official roles; bcrypt salted password hashing; JWT stateless sessions. |
| **Module 2** | Certificate Issuance | Complete | Deterministic ID generation (`CERT-YYYY-XXXX`), student USN, academic metadata, canonical formatting. |
| **Module 3** | SHA-256 Hashing | Complete | Cryptographic hashing using Node.js `crypto.createHash('sha256')` on canonical data strings. |
| **Module 4** | Hash Chaining | Complete | Consecutive block linkage via `previousHash` $\rightarrow$ `certificateHash`. First block links to `GENESIS`. |
| **Module 5** | Multi-Official Approvals | Complete | 2-of-2 approval threshold ($t=2$); prevention of double approvals by same official; formal rejection workflow. |
| **Module 6** | Database Storage | Complete | MongoDB + Mongoose schemas with indexed unique identifiers, hash links, and approval logs. |
| **Module 7** | Status Management | Complete | Atomic lifecycle state transitions: `PENDING_APPROVAL` $\rightarrow$ `ISSUED` or `REJECTED`. |
| **Module 8** | Public Verification | Complete | Zero-auth endpoint recalculates SHA-256 in real time and verifies status. |
| **Module 9** | Tamper Detection | Complete | Dynamic detection of payload corruption or out-of-band database tampering. |
| **Module 10** | Modern Frontend UI | Complete | Responsive React + Vite dark glassmorphic UI with interactive simulation controls. |

---

## 3. Architecture

```
                                  +---------------------------------------+
                                  |         React + Vite Frontend         |
                                  | (Dashboard, Approval Queue, Verifier) |
                                  +-------------------+-------------------+
                                                      |
                                           REST API (HTTP / JSON)
                                           JWT Bearer Authentication
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |         Node.js / Express API         |
                                  |---------------------------------------|
                                  |  - Auth Middleware (Role RBAC)        |
                                  |  - Hash Engine (crypto SHA-256)       |
                                  |  - Multi-Official Approval Logic      |
                                  |  - Verification & Tamper Engine       |
                                  +-------------------+-------------------+
                                                      |
                                                Mongoose ODM
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |            MongoDB Database           |
                                  |---------------------------------------|
                                  |  - Users Collection (Officials/Admin) |
                                  |  - Certificates Collection (Chained)  |
                                  +---------------------------------------+
```

### Hash Chain Structure:
```
+---------------------------------------+      +---------------------------------------+
|          GENESIS BLOCK                |      |          CERT-2026-0001               |
| previousHash: "GENESIS"               | ---> | previousHash: "GENESIS"               |
+---------------------------------------+      | Hash: SHA256("GENESIS" + canonical_1) |
                                               +-------------------+-------------------+
                                                                   |
                                                                   v
+---------------------------------------+      +---------------------------------------+
|          CERT-2026-0003               |      |          CERT-2026-0002               |
| previousHash: Hash of CERT-2026-0002  | <--- | previousHash: Hash of CERT-2026-0001  |
| Hash: SHA256(prevHash + canonical_3)  |      | Hash: SHA256(prevHash + canonical_2)  |
+---------------------------------------+      +---------------------------------------+
```

---

## 4. Technologies Used

- **Frontend**: React 18, Vite 5, Vanilla CSS Design System (Glassmorphic dark aesthetic, responsive CSS Grid/Flexbox), Lucide React icons.
- **Backend**: Node.js, Express.js 4, Mongoose 8, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Node.js native `crypto` module.
- **Database**: MongoDB (Local instance at `mongodb://127.0.0.1:27017/pbl_certificate_db`).
- **Testing**: Native integration test suite (`backend/tests/milestone30.test.js`) verifying Tests 1 through 7.

---

## 5. Installation Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- MongoDB Community Server running locally on port 27017

### Setup Backend:
```bash
cd backend
npm install
```

### Setup Frontend:
```bash
cd ../frontend
npm install
```

---

## 6. Environment Variables

### Backend Configuration (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/pbl_certificate_db
JWT_SECRET=pbl_cns_secure_digital_certificate_management_secret_key_2026!
JWT_EXPIRE=24h
```

---

## 7. How to Start the Services

### Option A: Unified Startup from Root Directory (Recommended)
From the root directory `c:\PBL`, run:
```bash
npm run dev
```
*This concurrently starts both the Node.js backend (port 5000) and Vite frontend (port 3000) with color-coded live logs.*

### Option B: Separate Terminal Windows

#### 1. Start MongoDB:
Ensure local MongoDB service is running:
```powershell
net start MongoDB
```

#### 2. Start Backend:
```bash
cd backend
npm run dev
# Server listens on http://localhost:5000
```
*Note: On first startup, the server automatically seeds initial official test accounts.*

#### 3. Start Frontend:
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000 (proxies /api to http://localhost:5000)
```

---

## 8. Seed Accounts for Testing

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Dr. Vikram Sharma | `admin@univ.edu` | `AdminPassword123!` |
| **Official 1** | Prof. Rajesh Rao (Registrar) | `official1@univ.edu` | `OfficialPassword123!` |
| **Official 2** | Prof. Ananya Sen (Dean) | `official2@univ.edu` | `OfficialPassword123!` |

*Quick login buttons are built directly into the login screen to allow fast switching between Official 1 and Official 2 during demonstrations.*

---

## 9. API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new official or admin
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated session info

### Certificates (`/api/certificates`)
- `POST /api/certificates` — Create a new certificate (Generates SHA-256 and previous hash link; initial status `PENDING_APPROVAL`)
- `GET /api/certificates` — List all certificates (Supports filtering by search query and status)
- `GET /api/certificates/pending` — Fetch certificates awaiting approvals
- `GET /api/certificates/stats` — Metrics count (Total, Pending, Issued, Rejected)
- `GET /api/certificates/chain-status` — Validates the cryptographic continuity of the entire blockchain-like chain
- `GET /api/certificates/:id` — Retrieve full certificate metadata and stored hash
- `POST /api/certificates/:id/approve` — Submit official approval (Requires role `Admin` or `University Official`; transitions to `ISSUED` on 2nd approval)
- `POST /api/certificates/:id/reject` — Submit rejection with formal reason
- `POST /api/certificates/:id/tamper-test` — Sandbox helper: Modifies CGPA directly in database without updating hash
- `POST /api/certificates/:id/restore-test` — Sandbox helper: Restores original valid data and hash

### Public Verification (`/api/verify`)
- `GET /api/verify/:certificateId` — Public zero-auth endpoint; dynamically computes SHA-256 and verifies hash equality and status

---

## 10. Cryptographic Implementation Details

### SHA-256 Deterministic Canonical Serialization
To avoid serialization discrepancies (such as key ordering or whitespace differences), certificates are transformed into a canonical formatted string before hashing:

```
ID:CERT-2026-0001|NAME:Rahul Verma|USN:1RV23CS042|COURSE:B.E. Computer Science|INST:RV College of Engineering|CGPA:8.95|DATE:2026-05-30T00:00:00.000Z|TYPE:Degree Certificate
```

The SHA-256 hash is computed using Node.js native `crypto`:
```javascript
const crypto = require('crypto');

function generateCertificateHash(previousHash, canonicalData) {
  const payload = `${previousHash}|${canonicalData}`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}
```

### Hash Chaining Mechanism
1. When issuing block $N$, the system finds block $N-1$ in the database.
2. If no previous certificate exists, `previousHash = "GENESIS"`.
3. If block $N-1$ exists, `previousHash = block_{N-1}.certificateHash`.
4. The current hash is computed as $H_N = \text{SHA256}(\text{previousHash} \parallel \text{canonicalData}_N)$.
5. Any subsequent alteration of block $N-1$ breaks the hash linkage for block $N$ and all downstream certificates.

### Multi-Official Approval Workflow ($t$-of-$n$ Prototype)
- Minimum threshold: $t = 2$ distinct authorized officials.
- When Official 1 approves:
  - System checks if Official 1 already signed. If yes $\rightarrow$ HTTP 409 Conflict.
  - Adds signature record `{ officialId, officialName, role, approvedAt }`.
  - Count = 1/2 $\rightarrow$ status remains `PENDING_APPROVAL`.
- When Official 2 approves:
  - System records 2nd signature.
  - Count reaches threshold (2/2) $\rightarrow$ atomic status update: `status = "ISSUED"`.
- If an official detects invalid credentials:
  - System allows formal rejection $\rightarrow$ `status = "REJECTED"`, recording official name, timestamp, and reason.

### Verification & Tamper Detection Workflow
When a certificate ID is entered into the public verifier:
1. Certificate record is retrieved from the database.
2. The canonical string is reconstructed from the retrieved fields.
3. The cryptographic hash is recalculated: $\text{RecalculatedHash} = \text{SHA256}(\text{storedPreviousHash} \parallel \text{RecomputedCanonical})$.
4. The recalculated hash is compared against the stored `certificateHash`.
5. **If mismatch**: Status is `INVALID`, with alert `"Certificate integrity verification failed. Possible tampering detected"`.
6. **If match**:
   - If status is `ISSUED` $\rightarrow$ Certificate is verified as authentic and tamper-free.
   - If status is `PENDING_APPROVAL` $\rightarrow$ Alert shown that certificate is awaiting required multi-official approvals.
   - If status is `REJECTED` $\rightarrow$ Alert shown that certificate was rejected by university officials.

---

## 11. Automated Test Suite

Run the full end-to-end integration test runner:
```bash
cd backend
npm test
```

### Verified Test Cases:
- **TEST 1**: Create certificate $\rightarrow$ verify deterministic SHA-256 generation $\rightarrow$ verify initial status `PENDING_APPROVAL`.
- **TEST 2**: Multi-Official Approval $\rightarrow$ Official 1 approves (status remains `PENDING_APPROVAL`, 1/2) $\rightarrow$ Official 2 approves (status atomically updates to `ISSUED`, 2/2).
- **TEST 3**: Public Verification $\rightarrow$ Real-time SHA-256 calculation matches stored hash $\rightarrow$ response `valid: true`.
- **TEST 4**: Tamper Detection $\rightarrow$ Alter database CGPA field out-of-band $\rightarrow$ Public verifier flags hash mismatch $\rightarrow$ returns `valid: false` & `"Possible tampering detected"`.
- **TEST 5**: Duplicate Approval Prevention $\rightarrow$ Same official attempts to approve twice $\rightarrow$ API rejects with HTTP 409 Conflict.
- **TEST 6**: Unauthorized Approval Attempt $\rightarrow$ Unauthenticated or unauthorized user attempts approval $\rightarrow$ API rejects with HTTP 401/403.
- **TEST 7**: Multi-Official Rejection Workflow $\rightarrow$ Official rejects pending certificate $\rightarrow$ status transitions to `REJECTED`, logging reason and official identity.

---

## 12. Known Limitations of 30% Milestone Prototype

The current version fulfills the strict scope of the 30% milestone:
1. **Multi-Signature Prototype**: Uses an application-level multi-signature approval queue ($t=2$ recorded approvals) rather than cryptographic threshold multi-signatures.
2. **Chain Storage**: The hash chain is stored as a linked collection in MongoDB rather than a distributed consensus ledger.
3. **Proof Mechanism**: Uses individual SHA-256 hash checks and chain links rather than Merkle proofs.
4. **Certificate Delivery**: Standard HTTPS REST responses rather than asymmetric Diffie-Hellman key exchange and AES-256-GCM encrypted envelope delivery.

---

## 13. Future Implementation Roadmap

### 50% Milestone
- **Merkle Tree Construction**: Batching certificates into binary Merkle trees.
- **Merkle Root Publication**: Periodic root publication for high-throughput batch verification.
- **Merkle Proof Verification**: Generating and auditing compact $\mathcal{O}(\log n)$ inclusion proofs.

### 75% Milestone
- **True Threshold Cryptography**: Cryptographic $(t, n)$ threshold signatures (e.g. Shamir secret sharing / BLS or multi-party RSA).
- **Independent Timestamping Authority (TSA)**: RFC 3161 compliant cryptographic timestamps to prove existence at a specific time.

### 100% Milestone
- **Diffie-Hellman Key Exchange**: Ephemeral ECDH key agreement between university and recipient.
- **AES-256-GCM Certificate Delivery**: Authenticated encryption for confidential end-to-end credential delivery.
- **Cryptographic Key Evolution**: Forward-secure key rolling and epoch-based key management.
