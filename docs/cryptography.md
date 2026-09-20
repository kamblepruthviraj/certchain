# CertChain: Cryptographic Specifications & Algorithms

## 1. Mathematical Foundations & Primitives

CertChain strictly employs modern, peer-reviewed cryptographic primitives standardized by NIST, IETF, and ISO. Custom or unverified cryptographic primitives are avoided.

| Domain | Primitive | Standard | Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Hashing** | SHA-256 | FIPS 180-4 | 256-bit digest (64 hex chars) | Deterministic block digests, Merkle leaves/nodes |
| **Digital Signatures** | Ed25519 | RFC 8032 | Edwards-curve Curve25519, SHA-512 | 2-of-3 threshold quorum committee signatures |
| **Key Agreement** | X25519 | RFC 7748 | Montgomery curve Curve25519 | Non-interactive Diffie-Hellman shared secret agreement |
| **Key Derivation** | HKDF-SHA256 | RFC 5869 | Extract-and-Expand with domain salt | 256-bit symmetric key derivation from DH secret |
| **Authenticated Encryption**| AES-256-GCM | NIST SP 800-38D | 256-bit key, 96-bit IV, 128-bit Auth Tag | Confidential and tamper-evident certificate delivery |

---

## 2. Deterministic Canonicalization (RFC 8785 Compliant)

A major flaw in naive hashing systems is nondeterministic JSON serialization (varying key order, whitespace, date formatting, and Unicode representation).

### 2.1 Fixed Canonical Key Ordering
CertChain enforces deterministic key ordering with normalized string representations:
```javascript
const canonicalObj = {
  certificateId:   String(certificateId).trim(),
  studentName:     String(studentName).trim(),
  usn:             String(usn).trim().toUpperCase(),
  course:          String(course).trim(),
  institution:     String(institution).trim(),
  cgpa:            String(cgpa).trim(),
  issueDate:       formattedDate, // Normalized YYYY-MM-DD
  certificateType: String(certificateType).trim()
};
const canonicalData = JSON.stringify(canonicalObj);
```

### 2.2 Date Normalization
Dates are normalized to standard ISO 8601 calendar format (`YYYY-MM-DD`):
$$\text{issueDate} = \text{Date.toISOString().split('T')[0]}$$

---

## 3. SHA-256 Hash Chaining

CertChain constructs an immutable chronological ledger by linking each certificate to its predecessor:

### 3.1 Genesis Block Rule
For the initial block in the system ($i = 0$):
$$\text{previousHash}_0 = \text{"GENESIS"}$$

### 3.2 Block Hash Derivation
For any block $i \ge 0$:
$$\text{certificateHash}_i = \text{SHA-256}(\text{previousHash}_i \mathbin{\Vert} \text{canonicalData}_i)$$

Where $\mathbin{\Vert}$ represents direct string concatenation.

### 3.3 Chain Linkage Invariant
For any subsequent block $i > 0$:
$$\text{previousHash}_i = \text{certificateHash}_{i-1}$$

Any alteration of an arbitrary field in block $k$ alters $\text{certificateHash}_k$, which instantly breaks the link $\text{previousHash}_{k+1} = \text{certificateHash}_k$, alerting the verification pipeline.

---

## 4. 2-of-3 Ed25519 Threshold Multi-Signature Quorum Scheme

To prevent unilateral credential issuance by a rogue administrator or compromised key, CertChain requires a verifiable 2-of-3 threshold signature scheme.

### 4.1 Distinction: Administrative Approval vs. Cryptographic Signature
1. **Administrative Approval**: Recorded audit log indicating that an authenticated user clicked "Approve" in the web application.
2. **Cryptographic Signature**: A formal mathematical digital signature generated using an Ed25519 private key share over the canonical SHA-256 hash of the certificate.

### 4.2 Signature Generation
Each university official $j \in \{1, 2, 3\}$ holds an Ed25519 private key $sk_j$. Upon approval:
$$\sigma_j = \text{Ed25519.Sign}(sk_j, \text{certificateHash})$$

The signature $\sigma_j$ is stored in the certificate record alongside their unique key identifier (`KEY-OFFICIAL-vN`).

### 4.3 Quorum Verification
A certificate transitions to `ISSUED` if and only if:
1. $|\{\sigma_j\}| \ge t$ where $t = 2$ and $n = 3$.
2. All signatures are from **distinct** authorized committee officials ($j \neq k$).
3. Each signature satisfies:
   $$\text{Ed25519.Verify}(pk_j, \text{certificateHash}, \sigma_j) == \text{True}$$

---

## 5. Binary Merkle Tree & Inclusion Proofs

To allow public verification without exposing private student records, certificates are aggregated into binary Merkle trees.

### 5.1 Leaf Hash Derivation
Each certificate is represented as a leaf:
$$\text{Leaf}_i = \text{SHA-256}(\text{certificateHash}_i)$$

### 5.2 Bitcoin-Style Odd Leaf Duplication Rule
When a layer contains an odd number of nodes $2k + 1$, the final node is duplicated to maintain a balanced binary tree:
$$\text{layer}' = [N_0, N_1, \dots, N_{2k}, N_{2k}]$$

### 5.3 Parent Node Derivation
$$\text{Parent} = \text{SHA-256}(\text{LeftChild} \mathbin{\Vert} \text{RightChild})$$

### 5.4 Inclusion Proof Verification
Given leaf hash $H$, proof path $P = [(p_1, pos_1), \dots, (p_k, pos_k)]$, and public root $R$:
$$\text{current} = H$$
For each step $(p_m, pos_m)$:
$$\text{current} = \begin{cases}
\text{SHA-256}(p_m \mathbin{\Vert} \text{current}) & \text{if } pos_m = \text{"left"} \\
\text{SHA-256}(\text{current} \mathbin{\Vert} p_m) & \text{if } pos_m = \text{"right"}
\end{cases}$$
The proof is valid if $\text{current} == R$. Time complexity: $O(\log N)$.

---

## 6. Secure Delivery: X25519 + HKDF + AES-256-GCM

CertChain provides confidential certificate delivery to students while protecting against eavesdropping and payload tampering.

### 6.1 Ephemeral Diffie-Hellman Key Agreement
1. Recipient generates Curve25519 keypair: $(sk_R, pk_R)$.
2. University server maintains Curve25519 delivery keypair: $(sk_S, pk_S)$.
3. Shared secret derivation:
   $$SS = \text{X25519}(sk_S, pk_R) = \text{X25519}(sk_R, pk_S)$$

### 6.2 Key Derivation Function (HKDF-SHA256)
$$K_{\text{AES}} = \text{HKDF-Expand}(\text{HKDF-Extract}(\text{salt}=\text{"certchain-v1-delivery"}, SS), \text{info}=\text{"aes-256-gcm-key"}, \text{len}=32)$$

### 6.3 Authenticated Encryption (AES-256-GCM)
1. Generate random 96-bit Initialization Vector (IV/nonce): $IV \in_R \{0, 1\}^{96}$.
2. Authenticated encryption:
   $$(C, T) = \text{AES-256-GCM-Encrypt}(K_{\text{AES}}, IV, \text{Plaintext})$$
   Where $C$ is the ciphertext and $T$ is the 128-bit authentication tag.

### 6.4 Tamper Rejection
Upon decryption:
$$\text{AES-256-GCM-Decrypt}(K_{\text{AES}}, IV, C, T)$$
If an attacker alters any bit in $C$ or $T$, decryption immediately aborts and throws `AUTHENTICATION_FAILURE`.

---

## 7. Key Evolution & Historical Verification

To defend against long-term key compromise, CertChain implements key versioning epochs (`KeyVersion`):
- **Epoch Transition**: Active key version advances from $v_N \to v_{N+1}$.
- **Status Progression**: Previous version transitions from `ACTIVE` to `ROTATED`.
- **Historical Verification**: Certificates issued under Version 1 record `keyVersion: 1`. When verified under Version 2, the verification engine queries Version 1's archived committee public keys. Historical certificates remain 100% valid.
