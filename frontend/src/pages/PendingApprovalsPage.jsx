import React, { useState, useEffect } from 'react';
import { CheckSquare, UserCheck, AlertCircle, CheckCircle2, ArrowRight, Shield, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function PendingApprovalsPage({ user, setView, setSelectedCertId, onApprovalChanged }) {
  const [pendingCerts, setPendingCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.certificates.getPending();
      if (res.ok && res.data.certificates) {
        setPendingCerts(res.data.certificates);
      }
    } catch (err) {
      console.error('Error fetching pending:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (certId) => {
    setApprovingId(certId);
    setActionMessage(null);
    try {
      const res = await api.certificates.approve(certId);
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: res.data.message
        });
        await fetchPending();
        if (onApprovalChanged) onApprovalChanged();
      } else {
        setActionMessage({
          type: 'danger',
          text: res.data.message || 'Approval rejected.'
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'danger',
        text: 'Error submitting approval request.'
      });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Multi-Official Approval Workflow</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Module 5: Prototype 2-of-2 ($t$-of-$n$) multi-signature approval queue before issuance
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchPending}>
          <RefreshCw size={15} />
          Refresh Queue
        </button>
      </div>

      {actionMessage && (
        <div className={`alert alert-${actionMessage.type}`}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Explanatory banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          borderLeft: '4px solid var(--accent-primary)',
          background: 'rgba(99, 102, 241, 0.05)'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Shield size={22} color="var(--accent-primary)" />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Signed-in Official: <strong style={{ color: '#fff' }}>{user.name}</strong> ({user.role}).{' '}
            Issuance requires approvals from <strong>TWO distinct authorized officials</strong>. Once 2 approvals are recorded, the certificate status atomically transitions to <strong style={{ color: 'var(--success)' }}>ISSUED</strong>.
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading pending approvals queue...
        </div>
      ) : pendingCerts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h3>All Caught Up!</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            There are no pending certificates awaiting approval right now.
          </p>
          <button className="btn btn-primary" onClick={() => setView('create')}>
            Issue a New Certificate
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {pendingCerts.map((cert) => {
            const approvalsCount = cert.approvals ? cert.approvals.length : 0;
            const hasCurrentUserApproved = cert.approvals && cert.approvals.some(
              (app) => app.officialId === user._id || app.officialName === user.name
            );

            return (
              <div
                key={cert.certificateId}
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  border: hasCurrentUserApproved
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                        {cert.certificateId}
                      </span>
                      <span className="status-badge badge-pending">
                        {cert.status}
                      </span>
                      <span
                        style={{
                          background: approvalsCount === 1 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          color: approvalsCount === 1 ? '#fbbf24' : 'var(--text-secondary)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px'
                        }}
                      >
                        Approvals: {approvalsCount} / 2
                      </span>
                    </div>

                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                      {cert.studentName}{' '}
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({cert.usn})</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {cert.course} • {cert.institution} • CGPA: <strong>{cert.cgpa}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedCertId(cert.certificateId);
                        setView('details');
                      }}
                    >
                      Inspect Data
                    </button>

                    {hasCurrentUserApproved ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 1rem',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: 'var(--radius-md)',
                          color: '#fbbf24',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}
                      >
                        <UserCheck size={16} />
                        Signed by You (Awaiting 2nd Official)
                      </div>
                    ) : (
                      <button
                        className="btn btn-success"
                        disabled={approvingId === cert.certificateId}
                        onClick={() => handleApprove(cert.certificateId)}
                        id={`approve-btn-${cert.certificateId}`}
                      >
                        <CheckSquare size={17} />
                        {approvingId === cert.certificateId
                          ? 'Recording Signature...'
                          : `Approve (${approvalsCount + 1}/2)`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Hashes & Approvals history */}
                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <HashBadge hash={cert.previousHash} label="Previous Hash Link" truncate={true} />
                    <HashBadge hash={cert.certificateHash} label="SHA-256 Current Hash" truncate={true} />
                  </div>

                  {cert.approvals && cert.approvals.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Recorded Approvals:</strong>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {cert.approvals.map((app, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid var(--border-success)',
                              color: '#a7f3d0',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}
                          >
                            ✓ {app.officialName} ({new Date(app.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
