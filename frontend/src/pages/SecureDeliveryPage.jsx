import React, { useState } from 'react';
import {
  Lock,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  FileLock2,
  Unlock,
  Bug,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function SecureDeliveryPage({ user }) {
  const [recipientKeys, setRecipientKeys] = useState(null);
  const [certId, setCertId] = useState('CERT-2026-0001');
  const [recipientEmail, setRecipientEmail] = useState(user ? user.email : 'student@univ.edu');
  const [envelope, setEnvelope] = useState(null);
  const [decryptedCert, setDecryptedCert] = useState(null);
  const [tamperedCiphertext, setTamperedCiphertext] = useState(null);
  const [decryptionError, setDecryptionError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // 1. Generate X25519 Key Pair for recipient
  const handleGenerateKeys = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.delivery.generateKeyPair();
      if (res.ok && res.data.success) {
        setRecipientKeys({
          publicKey: res.data.publicKey,
          privateKey: res.data.privateKey
        });
        setStatusMessage({ type: 'success', text: 'Fresh X25519 Curve25519 keypair generated successfully!' });
      } else {
        setStatusMessage({ type: 'danger', text: 'Key generation failed.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', text: 'Network error generating keypair.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Encrypt Certificate Envelope
  const handleEncryptEnvelope = async () => {
    if (!recipientKeys || !recipientKeys.publicKey) {
      setStatusMessage({ type: 'danger', text: 'Please generate a recipient X25519 keypair first.' });
      return;
    }
    if (!certId) return;

    setLoading(true);
    setStatusMessage(null);
    setEnvelope(null);
    setDecryptedCert(null);
    setTamperedCiphertext(null);
    setDecryptionError(null);

    try {
      const res = await api.delivery.encrypt(certId.trim(), recipientKeys.publicKey, recipientEmail);
      if (res.ok && res.data.success) {
        setEnvelope(res.data.envelope);
        setStatusMessage({
          type: 'success',
          text: `Certificate encrypted using X25519 DH + HKDF + AES-256-GCM! Envelope ID: ${res.data.envelope.envelopeId}`
        });
      } else {
        setStatusMessage({
          type: 'danger',
          text: res.data.message || 'Encryption failed. Ensure certificate is ISSUED.'
        });
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', text: 'Network error encrypting certificate.' });
    } finally {
      setLoading(false);
    }
  };

  // 3. Decrypt Certificate Envelope
  const handleDecryptEnvelope = async (useTampered = false) => {
    if (!envelope || !recipientKeys || !recipientKeys.privateKey) return;

    setLoading(true);
    setDecryptionError(null);
    setStatusMessage(null);

    try {
      const cipherToSend = useTampered ? tamperedCiphertext : undefined;
      const res = await api.delivery.decrypt(envelope.envelopeId, recipientKeys.privateKey, cipherToSend);

      if (res.ok && res.data.success) {
        setDecryptedCert(res.data.certificate);
        setStatusMessage({
          type: 'success',
          text: '✓ Authenticated Decryption Successful! AES-GCM Auth Tag verified perfectly.'
        });
      } else {
        setDecryptedCert(null);
        setDecryptionError(res.data.message || 'Decryption failed.');
        setStatusMessage({
          type: 'danger',
          text: `✗ Decryption Rejected: ${res.data.message || 'Authentication tag failed.'}`
        });
      }
    } catch (err) {
      setDecryptionError('Network error decrypting envelope.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Simulate Attack Vector 2: Tamper with Ciphertext
  const handleTamperCiphertext = () => {
    if (!envelope) return;
    const originalCipher = envelope.ciphertext;
    // Flip characters in the middle of ciphertext
    const mid = Math.floor(originalCipher.length / 2);
    const flippedChar = originalCipher[mid] === 'a' ? 'b' : 'a';
    const modified = originalCipher.substring(0, mid) + flippedChar + originalCipher.substring(mid + 1);
    setTamperedCiphertext(modified);
    setDecryptedCert(null);
    setStatusMessage({
      type: 'warning',
      text: 'Ciphertext bit flip simulated! The AES-256-GCM authentication tag will now reject decryption.'
    });
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
            marginBottom: '1rem'
          }}
        >
          <FileLock2 size={36} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
          Confidential Credential Delivery Portal
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
          End-to-end authenticated encryption using X25519 Diffie-Hellman Key Agreement, HKDF-SHA256 key derivation, and AES-256-GCM authenticated envelopes.
        </p>
      </div>

      {statusMessage && (
        <div className={`alert alert-${statusMessage.type}`} style={{ marginBottom: '1.5rem' }}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Step 1: Recipient X25519 Key Generation */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Key size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
              Step 1: Recipient X25519 Key Pair
            </h3>
          </div>
          <button className="btn btn-primary" onClick={handleGenerateKeys} disabled={loading}>
            <Sparkles size={16} />
            {recipientKeys ? 'Regenerate X25519 Keypair' : 'Generate X25519 Keypair'}
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          The graduating student or authorized recipient provides an X25519 public key. The private key never leaves the client environment.
        </p>

        {recipientKeys ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>RECIPIENT PUBLIC KEY (X25519):</span>
              <pre style={{ margin: '0.5rem 0 0 0', fontSize: '0.72rem', color: '#cbd5e1', overflowX: 'auto' }}>
                {recipientKeys.publicKey}
              </pre>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700 }}>RECIPIENT PRIVATE KEY (CONFIDENTIAL):</span>
              <pre style={{ margin: '0.5rem 0 0 0', fontSize: '0.72rem', color: '#94a3b8', overflowX: 'auto' }}>
                {recipientKeys.privateKey}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            Click "Generate X25519 Keypair" above to initialize your secure cryptographic session.
          </div>
        )}
      </div>

      {/* Step 2: Encrypt & Package Envelope */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <Lock size={22} color="#34d399" />
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
            Step 2: Authenticated Encryption (Server to Recipient)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="form-label">Certificate ID to Encrypt:</label>
            <input
              type="text"
              className="form-input"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="CERT-2026-0001"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div>
            <label className="form-label">Recipient Email:</label>
            <input
              type="email"
              className="form-input"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn btn-success"
          onClick={handleEncryptEnvelope}
          disabled={loading || !recipientKeys}
        >
          <Lock size={16} />
          Encrypt with AES-256-GCM
        </button>

        {envelope && (
          <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ fontSize: '1rem', color: '#38bdf8', marginBottom: '1rem' }}>
              Secure Delivery Envelope ({envelope.envelopeId})
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ALGORITHM</span>
                <div style={{ fontWeight: 700, color: '#fff' }}>{envelope.algorithm}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>INITIALIZATION VECTOR (IV)</span>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {envelope.iv} (12 bytes)
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GCM AUTH TAG (INTEGRITY)</span>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#34d399' }}>
                  {envelope.authTag} (16 bytes)
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CIPHERTEXT (ENCRYPTED PAYLOAD):</span>
              <div style={{ marginTop: '0.3rem', maxHeight: '100px', overflowY: 'auto', background: '#0a0f1d', padding: '0.75rem', borderRadius: '6px' }}>
                <code style={{ fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                  {tamperedCiphertext || envelope.ciphertext}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Decrypt & Tamper Sandbox */}
      {envelope && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Unlock size={22} color="#fbbf24" />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
              Step 3: Client Decryption & Tamper Rejection Sandbox
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleDecryptEnvelope(false)}
              disabled={loading}
            >
              <Unlock size={16} />
              Decrypt Valid Envelope
            </button>

            <button
              className="btn btn-danger"
              onClick={handleTamperCiphertext}
              disabled={loading || tamperedCiphertext !== null}
            >
              <Bug size={16} />
              Simulate Attack Vector 2: Tamper Ciphertext
            </button>

            {tamperedCiphertext && (
              <button
                className="btn btn-secondary"
                onClick={() => handleDecryptEnvelope(true)}
                disabled={loading}
              >
                Attempt Decryption of Tampered Ciphertext
              </button>
            )}

            {tamperedCiphertext && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setTamperedCiphertext(null);
                  setDecryptionError(null);
                  setStatusMessage(null);
                }}
              >
                <RotateCcw size={16} /> Reset
              </button>
            )}
          </div>

          {/* Decryption Error Result */}
          {decryptionError && (
            <div className="alert alert-danger" style={{ padding: '1.25rem' }}>
              <AlertOctagon size={24} />
              <div>
                <div style={{ fontWeight: 700, color: '#fca5a5' }}>
                  INTEGRITY FAILURE: GCM Authentication Tag Mismatch
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {decryptionError}. The ciphertext was altered in transit. AES-256-GCM successfully refused decryption!
                </div>
              </div>
            </div>
          )}

          {/* Decrypted Credential Success */}
          {decryptedCert && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid var(--border-success)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--success)' }}>
                <CheckCircle2 size={22} />
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                  ✓ Certificate Successfully Decrypted & Authenticated
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>STUDENT NAME</span>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>{decryptedCert.studentName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>USN</span>
                  <div style={{ fontWeight: 600, color: '#38bdf8' }}>{decryptedCert.usn}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>COURSE</span>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{decryptedCert.course}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CGPA</span>
                  <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1.1rem' }}>{decryptedCert.cgpa}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
