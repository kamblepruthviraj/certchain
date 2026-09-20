# CertChain: Threat Model & Security Analysis

## 1. Threat Model & Trust Assumptions

### 1.1 Assumptions
1. The server hardware and Node.js process runtime are not actively compromised by hypervisor-level rootkits during execution.
2. Standard cryptographic primitives (SHA-256, Ed25519, X25519, AES-256-GCM) are mathematically sound against classical computing attacks.
3. Node.js native `crypto` implements constant-time operations for signature verification and GCM tag comparison, mitigating side-channel timing attacks.

### 1.2 Adversary Capabilities
CertChain is designed to defend against:
- **Malicious Database Administrators (DBAs)** or attackers with direct SQL/NoSQL write access to the MongoDB database.
- **Rogue University Officials** attempting unilateral certificate generation or grade inflation.
- **Network Eavesdroppers & Man-in-the-Middle (MitM)** attackers attempting to intercept, modify, or replay credentials.
- **External Impersonators** seeking to register false credentials or scrape private student data.

---

## 2. STRIDE Security Matrix

| STRIDE Category | Threat Description | CertChain Mitigation & Defense |
| :--- | :--- | :--- |
| **Spoofing** | Adversary attempts to forge an official's approval or identity. | Ed25519 digital signatures mathematically bound to institutional private keys. JWT authentication with bcrypt password hashing ($10$ rounds). |
| **Tampering** | Rogue actor alters student CGPA or credentials directly in MongoDB. | Deterministic canonicalization recalculates SHA-256 block hash. Any modification immediately breaks canonical digest and hash chain. |
| **Repudiation** | Official denies having authorized a fraudulent credential. | Threshold signatures record individual official key ID and Ed25519 signature over the certificate digest. Irrefutable non-repudiation. |
| **Information Disclosure** | Public verifiers inspect institutional databases to scrape student PII. | Zero-PII public Merkle root registry: Only 32-byte cryptographic hashes are published; names, USNs, and CGPAs remain confidential. |
| **Denial of Service** | Botnet overwhelms login endpoints or verification service. | `express-rate-limit` enforces strict windows (30 req / 15 min for auth, 120 req / 10 min for public verification). 1MB payload ceiling. |
| **Elevation of Privilege** | Student user crafts HTTP request to access administrative endpoints. | Strict Role-Based Access Control (RBAC) middleware checks JWT roles before controller execution. Students receive HTTP 403 Forbidden. |

---

## 3. Five-Vector Security Defense Analysis

CertChain incorporates automated tests and interactive UI sandboxes demonstrating real-time defense against 5 specific attack vectors:

### Attack Vector 1: Direct Database Field Alteration (CGPA Inflation)
- **Attack Scenario**: An attacker with database credentials runs `db.certificates.updateOne({ certificateId: 'CERT-2026-0001' }, { $set: { cgpa: '9.99' } })`.
- **System Reaction**: When `/api/verify/CERT-2026-0001` is queried, the verification pipeline normalizes the database fields into canonical JSON and recomputes $\text{SHA-256}(\text{previousHash} \mathbin{\Vert} \text{canonicalData})$. The calculated hash diverges from `certificateHash`.
- **Checklist Outcome**: Check 3 (`SHA-256 Canonical Integrity`) fails with `INVALID`. Status set to `INVALID`.

### Attack Vector 2: Man-in-the-Middle Ciphertext Tampering
- **Attack Scenario**: An attacker intercepts an encrypted delivery envelope in transit and flips bits in the ciphertext to corrupt the academic record.
- **System Reaction**: During decryption via `/api/secure-delivery/decrypt`, AES-256-GCM evaluates the 128-bit authentication tag against the derived shared key and ciphertext.
- **Checklist Outcome**: Node.js `decipher.final()` throws `Error: Unsupported state or unable to authenticate data`. Decryption is aborted with `AUTHENTICATION_FAILURE`.

### Attack Vector 3: Merkle Inclusion Sibling Substitution
- **Attack Scenario**: A malicious entity attempts to present a fabricated certificate by crafting an arbitrary Merkle inclusion path.
- **System Reaction**: The Merkle auditor sequentially hashes the target leaf with each sibling node in the provided path.
- **Checklist Outcome**: The resulting computed root fails to match the officially registered root in `MerkleRoot`. Check 6 & 7 fail with `INVALID`.

### Attack Vector 4: Signature Forgery & Duplicate Self-Approval
- **Attack Scenario**: A single official attempts to sign a certificate twice to artificially reach the 2-signature quorum threshold, or provides an invalid signature.
- **System Reaction**:
  1. Administrative check: Rejects repeated sign attempts with `HTTP 409 Conflict`.
  2. Cryptographic check: Evaluates `crypto.verify(null, hash, publicKey, signature)` for each signature against distinct public keys in `KeyVersion.committee`.
- **Checklist Outcome**: Check 5 fails if duplicate officials or invalid signatures are present.

### Attack Vector 5: Historical Chain Rewriting & Intermediate Insertion
- **Attack Scenario**: An adversary attempts to delete or insert a block into past records.
- **System Reaction**: Administrative endpoint `GET /api/security/verify-chain` executes `verifyEntireChain()`, auditing every block chronologically from `GENESIS`.
- **Checklist Outcome**: Because block $i+1$ explicitly stores `previousHash` equal to block $i$'s hash, altering block $i$ severs the chain link at index $i+1$. Chain validity returns `false` with the exact broken index.

---

## 4. Application Hardening Measures

1. **HTTP Security Headers**: `helmet` configured with strict Content Security Policy (CSP), frameguard (anti-clickjacking), and MIME-sniffing prevention.
2. **NoSQL Query Injection Sanitizer**: Custom Express middleware recursively scrubs any keys prefixed with `$` or containing `.` from `req.body`, `req.query`, and `req.params`.
3. **Payload Limiting**: `express.json({ limit: '1mb' })` blocks memory exhaustion attacks from oversized POST payloads.
4. **Audit Logging**: Every security-sensitive action (`LOGIN_SUCCESS`, `CERT_CREATED`, `CERT_APPROVED`, `CHAIN_AUDIT_EXECUTE`, `KEY_ROTATION`, `TAMPER_SIMULATED`) is permanently committed to `AuditLog` with actor identity and IP address.
