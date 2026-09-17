import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, Copy, Check, Terminal, ExternalLink, RefreshCw, Bug } from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function CertDetailsPage({ certId, setView, setVerifyCertId }) {
  const [cert, setCert] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tamperingLoading, setTamperingLoading] = useState(false);
  const [alertNotice, setAlertNotice] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.certificates.getById(certId);
      if (res.ok && res.data.certificate) {
        setCert(res.data.certificate);
        setIntegrity(res.data.integrity);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certId) {
      fetchDetails();
    }
  }, [certId]);

  const handleSimulateTamper = async () => {
    setTamperingLoading(true);
    setAlertNotice(null);
    try {
      const res = await api.certificates.simulateTamper(certId, '9.99');
      if (res.ok) {
        setCert(res.data.certificate);
        setIntegrity(res.data.integrity);
        setAlertNotice({
          type: 'danger',
          message: 'Simulated tampering applied! CGPA modified to 9.99 in DB without recalculating certificateHash. SHA-256 integrity check failed as expected!'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTamperingLoading(false);
    }
  };

  const handleRestoreTamper = async () => {
    setTamperingLoading(true);
    setAlertNotice(null);
    try {
      const res = await api.certificates.restoreTampered(certId);
      if (res.ok) {
        setCert(res.data.certificate);
        setIntegrity(res.data.integrity);
        setAlertNotice({
          type: 'success',
          message: 'Certificate restored and cryptographic hash re-synchronized!'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTamperingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
        Loading cryptographic certificate block...
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3>Certificate Not Found</h3>
        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setView('certificates')}>
          Back to Registry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setView('certificates')}>
          <ArrowLeft size={15} />
          Back to List
        </button>
        <button className="btn btn-secondary btn-sm" onClick={fetchDetails}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {alertNotice && (
        <div className={`alert alert-${alertNotice.type}`}>
          {alertNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{alertNotice.message}</span>
        </div>
      )}

      {/* Main Certificate Glass Container */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                {cert.certificateId}
              </span>
              <span
                className={`status-badge ${
                  cert.status === 'ISSUED'
                    ? 'badge-issued'
                    : cert.status === 'PENDING_APPROVAL'
                    ? 'badge-pending'
                    : 'badge-invalid'
                }`}
              >
                {cert.status}
              </span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              {cert.studentName}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              USN: <strong>{cert.usn}</strong> • {cert.course}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setVerifyCertId(cert.certificateId);
                setView('verify');
              }}
            >
              <ExternalLink size={15} />
              Open in Public Verifier
            </button>
          </div>
        </div>

        {cert.status === 'REJECTED' && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}
          >
            <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700 }}>Certificate Formally Rejected</div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
                Reason: {cert.rejectionReason || 'Rejected during administrative review'}
              </div>
              {cert.rejectedBy && cert.rejectedBy.officialName && (
                <div style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.25rem' }}>
                  Rejected by: {cert.rejectedBy.officialName} on {new Date(cert.rejectedBy.rejectedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Academic Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            background: 'rgba(15, 21, 35, 0.6)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '2rem'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>INSTITUTION</span>
            <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>{cert.institution}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CERTIFICATE TYPE</span>
            <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>{cert.certificateType}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CGPA / GRADE</span>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8', marginTop: '0.2rem' }}>
              {cert.cgpa}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISSUE DATE</span>
            <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>
              {new Date(cert.issueDate).toISOString().split('T')[0]}
            </div>
          </div>
        </div>

        {/* Cryptographic Hash Chain Links */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Cryptographic SHA-256 Hash Chain Structure
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <HashBadge hash={cert.previousHash} label="Previous Block Hash Link (Genesis / Predecessor)" truncate={false} />
            </div>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: integrity && !integrity.isValid ? '1px solid var(--border-danger)' : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <HashBadge hash={cert.certificateHash} label="Stored SHA-256 Certificate Hash" truncate={false} />
            </div>
          </div>
        </div>

        {/* Live Integrity Verification Status */}
        {integrity && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: integrity.isValid ? 'var(--success-bg)' : 'var(--danger-bg)',
              border: integrity.isValid ? '1px solid var(--border-success)' : '1px solid var(--border-danger)',
              marginBottom: '2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              {integrity.isValid ? (
                <ShieldCheck size={24} color="var(--success)" />
              ) : (
                <AlertTriangle size={24} color="var(--danger)" />
              )}
              <span style={{ fontWeight: 700, fontSize: '1rem', color: integrity.isValid ? '#34d399' : '#f87171' }}>
                {integrity.isValid ? 'Live Cryptographic Integrity Intact' : 'CRITICAL: Live Integrity Failure / Tampering Detected'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Formula: <code>SHA256(previousHash + canonicalData)</code>
            </div>
            {!integrity.isValid && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div>Stored DB Hash: <code style={{ color: '#cbd5e1' }}>{integrity.storedHash}</code></div>
                <div>Live Recalculated: <code style={{ color: '#f87171' }}>{integrity.calculatedHash}</code></div>
              </div>
            )}
          </div>
        )}

        {/* Canonical Data Inspection */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Deterministic Canonical Data String (Payload Hashed)
          </h4>
          <pre
            style={{
              background: '#090d16',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: '#38bdf8',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {cert.canonicalData}
          </pre>
        </div>

        {/* Approvals Record */}
        <div>
          <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Multi-Official Approvals ({cert.approvals ? cert.approvals.length : 0} / 2 required)
          </h4>
          {cert.approvals && cert.approvals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cert.approvals.map((app, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#fff' }}>Official {i + 1}: {app.officialName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      ({app.role})
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Approved on {new Date(app.approvedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No official approvals recorded yet. Waiting for 2 authorized university officials.
            </div>
          )}
        </div>
      </div>

      {/* Interactive Tamper Testing Sandbox for PBL Viva / Evaluation */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Bug size={22} color="var(--danger)" />
          <h3 style={{ fontSize: '1.15rem' }}>Interactive Security Sandbox: Tamper Detection</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Simulate a malicious attacker directly modifying the student's grade in the database without recalculating the hash chain. When verified, the system will immediately flag the modification and output a SHA-256 digest mismatch.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-danger"
            disabled={tamperingLoading}
            onClick={handleSimulateTamper}
          >
            <AlertTriangle size={16} />
            Simulate Malicious Tampering (Alter CGPA to 9.99 in DB)
          </button>

          <button
            className="btn btn-secondary"
            disabled={tamperingLoading}
            onClick={handleRestoreTamper}
          >
            <ShieldCheck size={16} />
            Restore Valid State & Sync Hash
          </button>
        </div>
      </div>
    </div>
  );
}
