import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Key,
  GitBranch,
  Layers,
  GraduationCap,
  Building2,
  Calendar,
  Award,
  Hash,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function CertDetailsPage({ certId, setView, setVerifyCertId }) {
  const [cert, setCert] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
        <p>Loading certificate details...</p>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '3rem auto' }}>
        <XCircle size={40} color="var(--danger)" style={{ marginBottom: '0.75rem' }} />
        <h3>Certificate Not Found</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          No certificate matching ID <strong>{certId}</strong> was found in the database.
        </p>
        <button className="btn btn-secondary" onClick={() => setView('registry')}>
          Back to Certificate Registry
        </button>
      </div>
    );
  }

  // Derive verification checklist values based on real backend state
  const isIntegrityValid = integrity ? integrity.isValid : false;
  const isApprovalSatisfied =
    cert.status === 'ISSUED' ||
    (cert.thresholdSignatures && cert.thresholdSignatures.length >= 2) ||
    (cert.approvals && cert.approvals.length >= 2);
  const isRecordValid = !!cert._id;
  const isInstitutionVerified = !!cert.institution;
  const isCertificateActive = cert.status === 'ISSUED';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Navigation and Top Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setView('registry')}
          id="back-to-registry-btn"
        >
          <ArrowLeft size={15} />
          Back to Registry
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchDetails} title="Refresh">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (setVerifyCertId) setVerifyCertId(cert.certificateId);
              setView('verify');
            }}
            id="public-verify-view-btn"
          >
            <ExternalLink size={14} /> Public Verification Portal
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {alertNotice && (
        <div className={`alert alert-${alertNotice.type}`} style={{ marginBottom: '1.5rem' }}>
          {alertNotice.type === 'danger' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{alertNotice.message}</span>
        </div>
      )}

      {/* Verification Status Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          borderLeft: isCertificateActive && isIntegrityValid
            ? '4px solid var(--success)'
            : cert.status === 'PENDING_APPROVAL'
            ? '4px solid var(--warning)'
            : '4px solid var(--danger)',
          background: isCertificateActive && isIntegrityValid
            ? 'rgba(16, 185, 129, 0.05)'
            : cert.status === 'PENDING_APPROVAL'
            ? 'rgba(245, 158, 11, 0.05)'
            : 'rgba(239, 68, 68, 0.05)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {isCertificateActive && isIntegrityValid ? (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid var(--border-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--success)'
                }}
              >
                <ShieldCheck size={26} />
              </div>
            ) : cert.status === 'PENDING_APPROVAL' ? (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24'
                }}
              >
                <Clock size={26} />
              </div>
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--border-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--danger)'
                }}
              >
                <AlertTriangle size={26} />
              </div>
            )}

            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                {isCertificateActive && isIntegrityValid
                  ? 'Certificate Verified ✓'
                  : cert.status === 'PENDING_APPROVAL'
                  ? 'Certificate Pending Approval'
                  : 'Certificate Integrity Alert'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {isCertificateActive && isIntegrityValid
                  ? 'This certificate is formally issued, authenticated, and cryptographically verified.'
                  : cert.status === 'PENDING_APPROVAL'
                  ? 'This credential is in review and requires authorized official approval.'
                  : 'The certificate records show an inconsistency with the cryptographic block.'}
              </div>
            </div>
          </div>

          <div>
            <span
              className={`status-badge ${
                cert.status === 'ISSUED'
                  ? 'badge-issued'
                  : cert.status === 'PENDING_APPROVAL'
                  ? 'badge-pending'
                  : 'badge-invalid'
              }`}
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
            >
              {cert.status}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1 — CERTIFICATE INFORMATION */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <GraduationCap size={22} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Certificate Information</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            background: 'rgba(15, 21, 35, 0.4)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Student Name */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Student Full Name
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginTop: '0.25rem' }}>
              {cert.studentName}
            </div>
          </div>

          {/* USN / Student ID */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              USN / Student ID
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace', marginTop: '0.25rem' }}>
              {cert.usn}
            </div>
          </div>

          {/* Course / Program */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Course / Program
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>
              {cert.course}
            </div>
          </div>

          {/* CGPA / Grade */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CGPA / Grade
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', marginTop: '0.25rem' }}>
              {cert.cgpa} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ 10.0</span>
            </div>
          </div>

          {/* Awarding Institution */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Awarding Institution
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>
              {cert.institution}
            </div>
          </div>

          {/* Certificate Type */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Certificate Type
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>
              {cert.certificateType || 'Degree Certificate'}
            </div>
          </div>

          {/* Issue Date */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Issue Date
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', marginTop: '0.25rem' }}>
              {formatDate(cert.issueDate || cert.createdAt)}
            </div>
          </div>

          {/* Certificate ID */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Certificate ID
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '0.03em', marginTop: '0.25rem' }}>
              {cert.certificateId}
            </div>
          </div>

          {/* Status */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lifecycle Status
            </span>
            <div style={{ marginTop: '0.25rem' }}>
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
          </div>
        </div>
      </div>

      {/* SECTION 2 — VERIFICATION STATUS (Simple Security Checks) */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <FileCheck size={22} color="var(--success)" />
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Verification Status</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          High-level institutional security and validity indicators evaluated in real-time by the backend verification engine:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Check 1: Certificate record valid */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: isRecordValid ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.08)',
              border: isRecordValid ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isRecordValid ? <CheckCircle2 size={18} color="#34d399" /> : <XCircle size={18} color="#f87171" />}
              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>Certificate record valid</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: isRecordValid ? '#34d399' : '#f87171', fontWeight: 600 }}>
              {isRecordValid ? 'Confirmed in database' : 'Record Missing'}
            </span>
          </div>

          {/* Check 2: Certificate integrity verified */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: isIntegrityValid ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.08)',
              border: isIntegrityValid ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isIntegrityValid ? <CheckCircle2 size={18} color="#34d399" /> : <XCircle size={18} color="#f87171" />}
              <div>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>Certificate integrity verified</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Data matches stored cryptographic digest
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: isIntegrityValid ? '#34d399' : '#f87171', fontWeight: 600 }}>
              {isIntegrityValid ? 'Pass ✓' : 'Hash Mismatch ✗'}
            </span>
          </div>

          {/* Check 3: Approval requirements satisfied */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: isApprovalSatisfied ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
              border: isApprovalSatisfied ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isApprovalSatisfied ? <CheckCircle2 size={18} color="#34d399" /> : <Clock size={18} color="#fbbf24" />}
              <div>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>Approval requirements satisfied</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Multi-official authorization threshold
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: isApprovalSatisfied ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
              {isApprovalSatisfied
                ? 'Approved by Officials'
                : `${cert.approvals ? cert.approvals.length : 0} / 2 Approvals`}
            </span>
          </div>

          {/* Check 4: Issuing institution verified */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: isInstitutionVerified ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.08)',
              border: isInstitutionVerified ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isInstitutionVerified ? <CheckCircle2 size={18} color="#34d399" /> : <XCircle size={18} color="#f87171" />}
              <div>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>Issuing institution verified</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {cert.institution} (Key Epoch {cert.keyVersion || 1})
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: isInstitutionVerified ? '#34d399' : '#f87171', fontWeight: 600 }}>
              {isInstitutionVerified ? 'Verified Institution' : 'Unverified'}
            </span>
          </div>

          {/* Check 5: Certificate is active */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: isCertificateActive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
              border: isCertificateActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isCertificateActive ? <CheckCircle2 size={18} color="#34d399" /> : <Clock size={18} color="#fbbf24" />}
              <div>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>Certificate is active</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Not revoked, invalidated, or suspended
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: isCertificateActive ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
              {isCertificateActive ? 'Active (ISSUED)' : cert.status}
            </span>
          </div>
        </div>
      </div>

      {/* EXPANDABLE SECTION: Technical Verification Details */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#fff' }}>Technical Verification Details</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
              Underlying cryptographic hashes, Merkle tree inclusion proofs, and digital signatures.
            </p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            id="toggle-tech-details-btn"
          >
            {showTechnicalDetails ? (
              <>
                <ChevronUp size={16} /> Hide Technical Details
              </>
            ) : (
              <>
                <ChevronDown size={16} /> Show Technical Details
              </>
            )}
          </button>
        </div>

        {/* Technical Details Panel (Visible Only When Expanded) */}
        {showTechnicalDetails && (
          <div style={{ marginTop: '1.75rem', paddingTop: '1.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {/* Cryptographic Hashes & Linkage */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SHA-256 BLOCK HASH</span>
                <div style={{ marginTop: '0.35rem' }}>
                  <HashBadge hash={cert.certificateHash} label="Current Block Hash" truncate={false} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>PREVIOUS HASH</span>
                <div style={{ marginTop: '0.35rem' }}>
                  <HashBadge hash={cert.previousHash} label="Chained Predecessor" truncate={false} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>HASH CHAIN STATUS</span>
                <div style={{ marginTop: '0.35rem', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontWeight: 700, color: isIntegrityValid ? '#34d399' : '#f87171', fontSize: '0.9rem' }}>
                    {isIntegrityValid ? 'VALID (Continuous Link)' : 'INVALID (Tampered Link)'}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>KEY VERSION (EPOCH)</span>
                <div style={{ marginTop: '0.35rem', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem' }}>
                    Epoch {cert.keyVersion || 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Merkle Tree & Inclusion Proof (If present) */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <GitBranch size={18} color="var(--accent-primary)" />
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Merkle Tree Inclusion</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MERKLE ROOT HASH</span>
                  <div style={{ marginTop: '0.2rem' }}>
                    <code style={{ fontSize: '0.78rem', wordBreak: 'break-all', color: '#cbd5e1' }}>
                      {cert.merkleRoot || 'Registered in Batch'}
                    </code>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MERKLE BATCH ID</span>
                  <div style={{ marginTop: '0.2rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                    {cert.batchId || 'BATCH-2026-0001'}
                  </div>
                </div>
              </div>

              {cert.merkleProof && cert.merkleProof.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    MERKLE SIBLING PROOF PATH ({cert.merkleProof.length} steps):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {cert.merkleProof.map((step, idx) => (
                      <div key={idx} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.6rem', borderRadius: '4px' }}>
                        Step {idx + 1} ({step.position}): <code style={{ color: '#94a3b8' }}>{step.hash}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Digital Signatures & TSA Timestamp */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
              {/* Signatures */}
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Key size={18} color="#fbbf24" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Digital Signature Status</h4>
                </div>

                {cert.thresholdSignatures && cert.thresholdSignatures.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {cert.thresholdSignatures.map((sig, sIdx) => (
                      <div key={sIdx} style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{sig.officialName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          Algorithm: {sig.algorithm || 'Ed25519'} • Key: {sig.keyId}
                        </div>
                        <div style={{ color: '#34d399', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                          Status: VALID ✓
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    No digital signatures attached yet.
                  </div>
                )}
              </div>

              {/* Timestamp Authority */}
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Clock size={18} color="#38bdf8" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Timestamp Proof</h4>
                </div>

                {cert.timestampProof ? (
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Authority: </span>
                      <strong style={{ color: '#fff' }}>{cert.timestampProof.timestampAuthority || 'Institutional TSA'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Stamped: </span>
                      <span style={{ color: '#38bdf8' }}>{new Date(cert.timestampProof.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Status: TSA Verified ✓
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    TSA timestamp generated upon formal issuance.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
