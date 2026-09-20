# CertChain: REST API Specification & Endpoints

## 1. Base URL & Authentication
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: Bearer Token in `Authorization` header (`Authorization: Bearer <JWT>`).

---

## 2. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user and returns a JSON Web Token (JWT).
- **Rate Limit**: 30 requests / 15 minutes.
- **Request Body**:
  ```json
  {
    "email": "official1@univ.edu",
    "password": "OfficialPassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "660c1...",
      "name": "Dr. Ramesh Sharma",
      "email": "official1@univ.edu",
      "role": "University Official"
    }
  }
  ```

### `POST /api/auth/register`
Registers a new institutional user (Admin only).

### `GET /api/auth/me`
Retrieves profile and active role of current bearer token.

---

## 3. Certificate Management Endpoints (`/api/certificates`)

### `POST /api/certificates`
Creates a new academic certificate draft, calculates canonical data, chains `previousHash`, and embeds a QR code.
- **RBAC Roles**: `Admin`, `University Official`.
- **Request Body**:
  ```json
  {
    "studentName": "Rahul S Verma",
    "usn": "1RV23CS042",
    "course": "B.E. Computer Science & Engineering",
    "institution": "RV College of Engineering",
    "cgpa": "9.45",
    "issueDate": "2026-06-20",
    "certificateType": "Degree Certificate",
    "recipientEmail": "student@univ.edu"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "certificate": {
      "certificateId": "CERT-2026-0001",
      "certificateHash": "a83225...38",
      "previousHash": "GENESIS",
      "status": "PENDING_APPROVAL",
      "qrCodeDataUrl": "data:image/png;base64,..."
    }
  }
  ```

### `POST /api/certificates/:id/approve`
Applies an Ed25519 threshold signature. Automatically transitions certificate to `ISSUED` once 2 distinct signatures are recorded.
- **RBAC Roles**: `Admin`, `University Official`.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Approved and signed! Threshold quorum satisfied: Certificate is now officially ISSUED.",
    "certificate": { ... },
    "quorum": { "isValid": true, "validCount": 2, "required": 2 }
  }
  ```

### `POST /api/certificates/:id/reject`
Rejects a draft with an administrative rationale.

### `GET /api/certificates`
Lists certificates with optional query filters (`status`, `search`, `page`, `limit`).

### `GET /api/certificates/:id`
Retrieves single certificate details including cryptographic hashes and integrity verification.

---

## 4. Public Verification Endpoint (`/api/verify`)

### `GET /api/verify/:id`
Executes the comprehensive 8-point cryptographic verification pipeline without authentication.
- **Rate Limit**: 120 requests / 10 minutes.
- **Response `200 OK`**:
  ```json
  {
    "valid": true,
    "integrityMatched": true,
    "status": "ISSUED",
    "message": "Certificate passed all 8 cryptographic integrity and authority checks.",
    "certificate": {
      "certificateId": "CERT-2026-0001",
      "studentName": "Rahul S Verma",
      "usn": "1RV23CS042",
      "course": "B.E. Computer Science & Engineering",
      "institution": "RV College of Engineering",
      "cgpa": "9.45",
      "issueDate": "2026-06-20",
      "certificateHash": "a83225...38",
      "previousHash": "GENESIS",
      "merkleRoot": "3169...b8",
      "qrCodeDataUrl": "data:image/png;base64,..."
    },
    "securityChecklist": [
      { "name": "Certificate Record Exists", "status": "PASS", "description": "..." },
      { "name": "Certificate Status: ISSUED", "status": "PASS", "description": "..." },
      { "name": "SHA-256 Canonical Integrity", "status": "PASS", "description": "..." },
      { "name": "Hash Chain Predecessor Linkage", "status": "PASS", "description": "..." },
      { "name": "Cryptographic Threshold Signatures (2-of-3 Quorum)", "status": "PASS", "description": "..." },
      { "name": "Merkle Tree Inclusion Proof", "status": "PASS", "description": "..." },
      { "name": "Merkle Root Public Registry Match", "status": "PASS", "description": "..." },
      { "name": "Cryptographic Timestamp Token", "status": "PASS", "description": "..." }
    ]
  }
  ```

---

## 5. Public Merkle Registry Endpoints (`/api/public`)

### `GET /api/public/merkle-root`
Returns the active batch's root hash. Contains strictly zero student PII.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "batchId": "BATCH-2026-0001",
    "rootHash": "3169ea14b637ed3097095e09db223541d353f1b94fe2d30b4844c61f47ca05b8",
    "treeVersion": 1,
    "certificateCount": 4,
    "publishedAt": "2026-09-17T17:56:29Z"
  }
  ```

### `GET /api/public/merkle-roots`
Returns array of all historical published batch roots.

### `POST /api/public/verify-proof`
Mathematically validates a Merkle inclusion proof against a specified root.
- **Request Body**:
  ```json
  {
    "leafHash": "3169ea...",
    "proof": [ { "position": "right", "hash": "..." } ],
    "rootHash": "3169ea..."
  }
  ```

---

## 6. Confidential Delivery Endpoints (`/api/secure-delivery`)

### `POST /api/secure-delivery/generate-keypair`
Generates a fresh ephemeral Curve25519 (X25519) keypair for the client.

### `POST /api/secure-delivery/encrypt`
Executes X25519 DH + HKDF-SHA256 + AES-256-GCM encryption of the certificate.
- **Request Body**:
  ```json
  {
    "certificateId": "CERT-2026-0001",
    "recipientPublicKey": "-----BEGIN PUBLIC KEY...\n...",
    "recipientEmail": "student@univ.edu"
  }
  ```

### `POST /api/secure-delivery/decrypt`
Decrypts and validates the authentication tag of an envelope using the recipient's private key.
- **Request Body**:
  ```json
  {
    "envelopeId": "ENV-2026-0001",
    "recipientPrivateKey": "-----BEGIN PRIVATE KEY...\n..."
  }
  ```

---

## 7. Security Operations Center Endpoints (`/api/security`)

### `GET /api/security/verify-chain`
Audits the complete chronological hash chain from genesis to head block.
- **RBAC Roles**: `Admin`, `University Official`.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "chainValid": true,
    "totalBlocks": 12,
    "brokenAt": null,
    "auditedAt": "2026-09-17T18:00:00Z"
  }
  ```

### `GET /api/security/keys`
Lists all key version epochs and the currently active committee.

### `POST /api/security/keys/rotate`
Rotates the committee keypairs to Version N+1.
- **RBAC Roles**: `Admin`.
- **Request Body**:
  ```json
  { "reason": "Scheduled annual key rotation" }
  ```

### `GET /api/security/audit-logs`
Retrieves immutable audit logs with optional filtering (`action`, `actorEmail`, `limit`, `page`).
