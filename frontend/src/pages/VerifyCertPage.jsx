import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, AlertOctagon, CheckCircle2, Copy, Check, Clock, FileWarning, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function VerifyCertPage({ initialCertId }) {
  const [certIdInput, setCertIdInput] = useState(initialCertId || 'CERT-2026-0001');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (targetId) => {
    const idToVerify = targetId || certIdInput;
    if (!idToVerify || idToVerify.trim() === '') return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.verify.check(idToVerify.trim());
      if (res.ok) {
        setResult(res.data);
      } else {
        if (res.status === 404) {
          setError(res.data.message || `No certificate record found for ID: ${idToVerify}`);
        } else {
          setError(res.data.message || 'Verification service error.');
        }
      }
    } catch (err) {
      setError('Network communication failed during verification.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCertId) {
      setCertIdInput(initialCertId);
      handleVerify(initialCertId);
    }
  }, [initialCertId]);

  return (
    <div style={{ maxWidth: '780px', margin: '1rem auto' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--accent-glow)',
            marginBottom: '1rem'
          }}
        >
          <ShieldCheck size={36} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
          Public Credential Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '540px', margin: '0 auto' }}>
          Real-time cryptographic SHA-256 integrity recalculation & multi-official issuance verification. No login required.
        </p>
      </div>

      {/* Verification Search Box */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
        >
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              Enter Certificate ID
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                required
                placeholder="e.g. CERT-2026-0001"
                className="form-input"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
                value={certIdInput}
                onChange={(e) => setCertIdInput(e.target.value)}
                id="verify-input"
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0 2rem', minWidth: '140px' }}
                disabled={loading}
                id="verify-submit-btn"
              >
                <Search size={18} />
                {loading ? 'Verifying...' : 'VERIFY'}
              </button>
            </div>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <Sparkles size={14} />
          <span>Tip: Try testing with <code>CERT-2026-0001</code> or create a new one from the official dashboard.</span>
        </div>
      </div>

      {/* Not Found / Error Banner */}
      {error && (
        <div className="alert alert-danger" style={{ padding: '1.25rem' }}>
          <FileWarning size={20} />
          <div>
            <div style={{ fontWeight: 700, color: '#fca5a5' }}>Certificate Not Found</div>
            <div style={{ fontSize: '0.85rem' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Verification Result Display */}
      {result && (
        <div>
          {/* CASE 1: VALID & ISSUED */}
          {result.valid && (
            <div
              className="glass-panel"
              style={{
                padding: '2.5rem',
                border: '1px solid var(--border-success)',
                background: 'rgba(16, 185, 129, 0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--border-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success)',
                    boxShadow: 'var(--success-glow)'
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#34d399' }}>
                    ✓ CERTIFICATE VERIFIED
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {result.message}
                  </p>
                </div>
              </div>

              {/* Certificate Details */}
              <div
                style={{
                  background: 'rgba(15, 21, 35, 0.8)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.75rem',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1.75rem'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CERTIFICATE ID</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                      {result.certificate.certificateId}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STUDENT NAME</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                      {result.certificate.studentName}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>USN / STUDENT ID</span>
                    <div style={{ fontWeight: 600, color: '#38bdf8' }}>
                      {result.certificate.usn}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROGRAM & DEGREE</span>
                    <div style={{ fontWeight: 600, color: '#fff' }}>
                      {result.certificate.course}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AWARDING INSTITUTION</span>
                    <div style={{ fontWeight: 600, color: '#fff' }}>
                      {result.certificate.institution}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CGPA / GRADE</span>
                    <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1.1rem' }}>
                      {result.certificate.cgpa}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISSUANCE STATUS</span>
                    <div>
                      <span className="status-badge badge-issued">
                        ✓ {result.certificate.status || 'ISSUED'} ({result.certificate.approvedByCount}/2 Signatures)
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISSUE DATE</span>
                    <div style={{ fontWeight: 600, color: '#fff' }}>
                      {result.certificate.issueDate}
                    </div>
                  </div>
                </div>

                {/* Cryptographic Proof Verification */}
                <div
                  style={{
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <ShieldCheck size={16} />
                    <span>INTEGRITY CHECK: ✓ SHA-256 MATCH CONFIRMED</span>
                  </div>
                  <HashBadge hash={result.certificate.certificateHash} label="Cryptographic Block Digest" truncate={false} />
                </div>
              </div>
            </div>
          )}

          {/* CASE 2: INTEGRITY FAILED / TAMPERING DETECTED */}
          {result.status === 'INVALID' && (
            <div
              className="glass-panel"
              style={{
                padding: '2.5rem',
                border: '1px solid var(--border-danger)',
                background: 'rgba(239, 68, 68, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--border-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--danger)',
                    boxShadow: 'var(--danger-glow)'
                  }}
                >
                  <AlertOctagon size={32} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#f87171' }}>
                    ✗ VERIFICATION FAILED
                  </h2>
                  <p style={{ color: '#fca5a5', fontWeight: 600 }}>
                    Certificate integrity check failed. Possible modification detected!
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(15, 21, 35, 0.9)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  The deterministic canonical representation of the certificate was recalculated using the previous block's hash and <code>SHA-256</code>. The resulting digest <strong>does not match</strong> the hash stored in the certificate registry block.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STORED REGISTRY HASH:</span>
                    <div style={{ marginTop: '0.2rem' }}>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#cbd5e1', wordBreak: 'break-all' }}>
                        {result.storedHash}
                      </code>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700 }}>RECALCULATED HASH (FROM DB DATA):</span>
                    <div style={{ marginTop: '0.2rem' }}>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#f87171', wordBreak: 'break-all' }}>
                        {result.calculatedHash}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ⚠️ <strong>Security Audit Note:</strong> This certificate data has been tampered with or corrupted after initial registration. It cannot be trusted.
              </div>
            </div>
          )}

          {/* CASE 3: PENDING APPROVAL */}
          {result.status === 'PENDING_APPROVAL' && (
            <div
              className="glass-panel"
              style={{
                padding: '2.5rem',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                background: 'rgba(245, 158, 11, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <Clock size={36} color="#fbbf24" />
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: '#fbbf24' }}>
                    ⏳ CERTIFICATE PENDING APPROVAL
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Cryptographic hash is intact, but the certificate has not completed the multi-official approval workflow.
                  </p>
                </div>
              </div>

              <div style={{ background: 'rgba(15, 21, 35, 0.8)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Certificate ID: <strong style={{ color: '#fff' }}>{result.certificateId}</strong>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Current Approvals: <strong style={{ color: '#fbbf24' }}>{result.currentApprovals} of {result.requiredApprovals} required official signatures</strong>.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
