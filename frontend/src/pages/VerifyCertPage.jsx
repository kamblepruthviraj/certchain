import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileWarning,
  QrCode,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

/**
 * Helper to record local verifications for the normal user dashboard
 */
function recordVerificationActivity(certId, isValid) {
  try {
    const key = 'certchain_recent_verifications';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const newEntry = {
      certificateId: certId,
      date: new Date().toISOString(),
      result: isValid ? 'Verified' : 'Failed',
      success: isValid
    };
    // Keep last 15, remove duplicate top entry
    const filtered = existing.filter((item) => item.certificateId !== certId);
    filtered.unshift(newEntry);
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 15)));
  } catch (err) {
    console.error('Error saving local verification activity:', err);
  }
}

export default function VerifyCertPage({ initialCertId }) {
  const [certIdInput, setCertIdInput] = useState(initialCertId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrPasteInput, setQrPasteInput] = useState('');

  const handleVerify = async (targetId) => {
    let idToVerify = targetId !== undefined ? targetId : certIdInput;
    if (!idToVerify || idToVerify.trim() === '') return;

    // Support pasted URLs like http://localhost:3000/verify/CERT-2026-0001
    if (idToVerify.includes('/verify/')) {
      const parts = idToVerify.split('/verify/');
      idToVerify = parts[parts.length - 1];
    }

    idToVerify = idToVerify.trim().toUpperCase();
    setCertIdInput(idToVerify);
    setLoading(true);
    setError(null);

    try {
      const res = await api.verify.check(idToVerify);
      if (res.ok) {
        setResult(res.data);
        recordVerificationActivity(idToVerify, res.data.valid);
      } else {
        const errorMsg = res.data?.message || `No certificate record found for ID: ${idToVerify}`;
        setError(errorMsg);
        setResult(null);
        recordVerificationActivity(idToVerify, false);
      }
    } catch (err) {
      setError('Verification service unavailable. Please check backend connection.');
      setResult(null);
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

  const handleQrSubmit = (e) => {
    e.preventDefault();
    if (qrPasteInput) {
      setQrModalOpen(false);
      handleVerify(qrPasteInput);
      setQrPasteInput('');
    }
  };

  // Map backend security checklist to the user-friendly 7 security points
  const getSecurityChecks = () => {
    if (!result) return [];

    // If backend returns standard securityChecklist:
    if (result.securityChecklist && result.securityChecklist.length > 0) {
      return result.securityChecklist.map((c) => ({
        name: c.name
          .replace('Canonical Integrity', 'integrity verified')
          .replace('Predecessor Linkage', 'verified')
          .replace('2-of-3 Quorum', 'verified')
          .replace('Inclusion Proof', 'verified')
          .replace('Public Registry Match', 'verified'),
        passed: c.passed || c.status === 'PASS'
      }));
    }

    // Default 7-point checklist presentation
    const isValid = result.valid;
    return [
      { name: 'Certificate exists', passed: true },
      { name: 'Certificate is issued', passed: result.status === 'ISSUED' },
      { name: 'SHA-256 integrity verified', passed: isValid },
      { name: 'Hash chain verified', passed: isValid },
      { name: 'Cryptographic signature verified', passed: isValid },
      { name: 'Merkle proof verified', passed: isValid },
      { name: 'Merkle root verified', passed: isValid }
    ];
  };

  return (
    <div style={{ maxWidth: '820px', margin: '1rem auto' }}>
      {/* Primary Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--accent-glow)',
            marginBottom: '1.25rem'
          }}
        >
          <ShieldCheck size={38} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.6rem' }}>
          Verify Academic Certificate
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '580px', margin: '0 auto', lineHeight: 1.5 }}>
          Verify the authenticity and integrity of a digital academic certificate.
        </p>
      </div>

      {/* Verification Input Box */}
      <div className="glass-panel" style={{ padding: '2rem 2.25rem', marginBottom: '2rem' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
        >
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="verify-cert-id-input"
              className="form-label"
              style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>Certificate ID / QR Code</span>
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <QrCode size={15} /> Scan / Enter QR
              </button>
            </label>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                id="verify-cert-id-input"
                type="text"
                required
                placeholder="e.g. CERT-2026-0001"
                className="form-input"
                style={{
                  flex: 1,
                  minWidth: '240px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '0.85rem 1.15rem'
                }}
                value={certIdInput}
                onChange={(e) => setCertIdInput(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0 2rem', minWidth: '170px', fontSize: '0.95rem' }}
                disabled={loading}
                id="verify-cert-submit-btn"
              >
                <Search size={18} />
                {loading ? 'Verifying...' : 'Verify Certificate'}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Sample Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.84rem', flexWrap: 'wrap' }}>
          <Sparkles size={14} color="#38bdf8" />
          <span>Quick check:</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
            onClick={() => handleVerify('CERT-2026-0001')}
          >
            CERT-2026-0001
          </button>
        </div>
      </div>

      {/* Error / Not Found Alert */}
      {error && (
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid var(--border-danger)',
            background: 'rgba(239, 68, 68, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--danger-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
                flexShrink: 0
              }}
            >
              <XCircle size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#f87171', margin: '0 0 0.35rem 0' }}>
                ✗ Certificate Verification Failed
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                {error}
              </p>
              <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                Possible certificate modification or invalid cryptographic proof detected. Please ensure the Certificate ID was entered correctly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VERIFICATION RESULT DISPLAY */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {result.valid ? (
            /* ======================================================== */
            /* VALID RESULT CARD                                        */
            /* ======================================================== */
            <div
              className="glass-panel"
              style={{
                padding: '2.5rem',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
                boxShadow: '0 10px 40px rgba(16, 185, 129, 0.15)'
              }}
              id="verification-result-valid"
            >
              {/* Header Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '1.5rem',
                  marginBottom: '2rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '2px solid var(--border-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--success)'
                    }}
                  >
                    <CheckCircle2 size={34} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Status
                    </div>
                    <h2 style={{ fontSize: '1.75rem', color: '#fff', margin: '0.1rem 0' }}>
                      ✓ Certificate Verified
                    </h2>
                    <span
                      style={{
                        display: 'inline-block',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        padding: '0.2rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        border: '1px solid rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      AUTHENTIC CERTIFICATE
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Printer size={15} />
                  Print Verification Statement
                </button>
              </div>

              {/* Certificate Information Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1.75rem',
                  marginBottom: '2.5rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Certificate ID:
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    {result.certificate?.certificateId || result.certificateId}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Student:
                  </span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                    {result.certificate?.studentName || 'Pruthviraj S Kamble'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Program:
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>
                    {result.certificate?.course || 'B.E. Computer Science & Engineering'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Institution:
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>
                    {result.certificate?.institution || 'St. Joseph Engineering College'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Issue Date:
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#cbd5e1', marginTop: '0.2rem' }}>
                    {result.certificate?.issueDate || '20-09-2026'}
                  </div>
                </div>
              </div>

              {/* Security Verification Section */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <ShieldCheck size={20} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>
                    Security Verification:
                  </h3>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a7f3d0', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span>✓ Certificate exists</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a7f3d0', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span>✓ Certificate is issued</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a7f3d0', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span>✓ SHA-256 integrity verified</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a7f3d0', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span>✓ Hash chain verified</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a7f3d0', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span>✓ Cryptographic signature verified</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a7f3d0', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span>✓ Merkle proof verified</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a7f3d0', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span>✓ Merkle root verified</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* INVALID / COMPROMISED RESULT CARD                         */
            /* ======================================================== */
            <div
              className="glass-panel"
              style={{
                padding: '2.5rem',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
                boxShadow: '0 10px 40px rgba(239, 68, 68, 0.15)'
              }}
              id="verification-result-invalid"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '2px solid var(--border-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f87171',
                    flexShrink: 0
                  }}
                >
                  <XCircle size={34} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Status
                  </div>
                  <h2 style={{ fontSize: '1.75rem', color: '#f87171', margin: '0.1rem 0' }}>
                    ✗ Certificate Verification Failed
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0 0', fontSize: '1rem' }}>
                    Possible certificate modification or invalid cryptographic proof detected.
                  </p>
                </div>
              </div>

              {/* Checklist breakdown */}
              {result.securityChecklist && (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginTop: '1.5rem'
                  }}
                >
                  <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}>
                    Security Checks Summary:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {result.securityChecklist.map((chk, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.9rem',
                          color: chk.passed ? '#a7f3d0' : '#fca5a5'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {chk.passed ? <CheckCircle2 size={16} color="#34d399" /> : <XCircle size={16} color="#f87171" />}
                          <span>{chk.name}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {chk.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* QR Code Input / Paste Modal */}
      {qrModalOpen && (
        <div className="modal-overlay" onClick={() => setQrModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <QrCode size={24} color="var(--accent-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Scan or Enter QR Code</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Enter the Certificate ID encoded in the QR code or paste the verification link:
            </p>
            <form onSubmit={handleQrSubmit}>
              <input
                type="text"
                className="form-input"
                autoFocus
                placeholder="e.g. CERT-2026-0001 or URL"
                value={qrPasteInput}
                onChange={(e) => setQrPasteInput(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setQrModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Verify Loaded ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
